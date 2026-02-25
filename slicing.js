import { SLICE_COLORS, SLICE_HEX_COLORS } from './constants.js';
import { bgStack, intersectionStack, overlayStack } from './stacks.js';
import { drawSourceOnCanvas } from './imageUtils.js';

// ─── Modal DOM refs (resolved once, deferred) ─────────────────────────────────

const getEl = id => document.getElementById(id);

// ─── Module state ─────────────────────────────────────────────────────────────

let modalResolve         = null;
let currentIndex         = 0;
let modalData            = []; // [{img, filename, mode, slices, checkStates}]

// ─── Slice Detection ──────────────────────────────────────────────────────────

/**
 * Detect connected regions where the midground image overlaps the
 * compiled intersection stack. Only the intersection stack is used
 * for detection — the overlay stack is excluded.
 */
export function detectSlices(sourceImg, mode) {
    const border = intersectionStack.compiledCanvas;
    if (!border) return [];

    const bCanvas = document.createElement('canvas'); bCanvas.width = 64; bCanvas.height = 64;
    const bCtx    = bCanvas.getContext('2d');
    bCtx.drawImage(border, 0, 0, 64, 64);
    const bData   = bCtx.getImageData(0, 0, 64, 64);

    const fCanvas = document.createElement('canvas'); fCanvas.width = 64; fCanvas.height = 64;
    const fCtx    = fCanvas.getContext('2d');
    fCtx.imageSmoothingEnabled = false;
    drawSourceOnCanvas(fCtx, sourceImg, 64, 64, mode);
    const fData   = fCtx.getImageData(0, 0, 64, 64);

    const overlapMap = new Uint8Array(64 * 64);
    for (let i = 0; i < bData.data.length; i += 4) {
        const pi = i / 4;
        overlapMap[pi] = (bData.data[i+3] > 10 && fData.data[i+3] > 200) ? 1 : 0;
    }

    const visited = new Uint8Array(64 * 64);
    const slices  = [];

    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const idx = y * 64 + x;
            if (overlapMap[idx] !== 1 || visited[idx]) continue;
            const pixels = new Set();
            const queue  = [[x, y]];
            while (queue.length) {
                const [cx, cy] = queue.shift();
                if (cx < 0 || cx >= 64 || cy < 0 || cy >= 64) continue;
                const ci = cy * 64 + cx;
                if (visited[ci] || !overlapMap[ci]) continue;
                visited[ci] = 1;
                pixels.add(ci);
                queue.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
            }
            if (pixels.size >= 3) slices.push(pixels);
        }
    }

    return slices.sort((a, b) => a.size - b.size);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * Show the slice selection modal for entries that have slicing enabled.
 * Returns a Promise that resolves to the modalData array (with checkStates),
 * or null if cancelled.
 */
export function showSliceModal(slicingEntries) {
    return new Promise(resolve => {
        modalResolve = resolve;
        modalData    = slicingEntries.map(({ img, file, mode }) => {
            const slices = detectSlices(img, mode);
            return { img, filename: file.name, mode, slices, checkStates: new Array(slices.length).fill(true) };
        });
        currentIndex = 0;
        getEl('sliceModal').style.display = 'flex';
        renderCurrent();
    });
}

export function initSliceModal() {
    getEl('sliceConfirm').addEventListener('click', confirm);
    getEl('sliceCancel').addEventListener('click',  cancel);

    getEl('slicePrevBtn').addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; renderCurrent(); }
    });
    getEl('sliceNextBtn').addEventListener('click', () => {
        if (currentIndex < modalData.length - 1) { currentIndex++; renderCurrent(); }
    });

    document.addEventListener('keydown', e => {
        if (getEl('sliceModal').style.display !== 'flex') return;
        if (e.key === 'ArrowLeft'  && currentIndex > 0)                  { e.preventDefault(); currentIndex--; renderCurrent(); }
        if (e.key === 'ArrowRight' && currentIndex < modalData.length-1) { e.preventDefault(); currentIndex++; renderCurrent(); }
        if (e.key === 'Enter')  { e.preventDefault(); confirm(); }
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function renderCurrent() {
    const data  = modalData[currentIndex];
    const total = modalData.length;
    getEl('sliceImageCounter').textContent = `${currentIndex + 1} / ${total}`;
    getEl('slicePrevBtn').disabled = currentIndex === 0;
    getEl('sliceNextBtn').disabled = currentIndex === total - 1;
    getEl('sliceConfirm').style.display = currentIndex === total - 1 ? 'inline-block' : 'none';
    renderPreview(data);
    renderCheckboxes(data);
}

function renderPreview(data) {
    const canvas = getEl('slicePreviewCanvas');
    const ctx    = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 256, 256);

    if (bgStack.compiledCanvas)           ctx.drawImage(bgStack.compiledCanvas,           0, 0, 256, 256);
    drawSourceOnCanvas(ctx, data.img, 256, 256, data.mode);
    if (intersectionStack.compiledCanvas) ctx.drawImage(intersectionStack.compiledCanvas, 0, 0, 256, 256);
    if (overlayStack.compiledCanvas)      ctx.drawImage(overlayStack.compiledCanvas,      0, 0, 256, 256);

    // Slice region overlays
    data.slices.forEach((sliceSet, idx) => {
        const [r, g, b] = SLICE_COLORS[idx % SLICE_COLORS.length];
        const alpha = data.checkStates[idx] ? 0.55 : 0.15;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        let sumX = 0, sumY = 0;
        sliceSet.forEach(pi => {
            const sx = pi % 64, sy = Math.floor(pi / 64);
            ctx.fillRect(sx * 4, sy * 4, 4, 4);
            sumX += sx; sumY += sy;
        });
        if (sliceSet.size > 0) {
            const cx = (sumX / sliceSet.size) * 4 + 2;
            const cy = (sumY / sliceSet.size) * 4 + 2;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(cx - 9, cy - 9, 18, 18);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(idx + 1, cx, cy);
        }
    });
}

function renderCheckboxes(data) {
    const container = getEl('sliceCheckboxes');
    container.innerHTML = '';

    if (data.slices.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:12px 0;">No slices detected for this image.</p>';
        return;
    }

    const hint = document.createElement('p');
    hint.className   = 'slice-count-hint';
    hint.textContent = `${data.slices.length} slice region${data.slices.length !== 1 ? 's' : ''} detected — check to include in the final image.`;
    container.appendChild(hint);

    const grid = document.createElement('div');
    grid.className = 'slice-checkbox-grid';

    data.slices.forEach((sliceSet, idx) => {
        const hex  = SLICE_HEX_COLORS[idx % SLICE_HEX_COLORS.length];
        const item = document.createElement('label');
        item.className = 'slice-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" ${data.checkStates[idx] ? 'checked' : ''}>
            <span class="slice-color-dot" style="background:${hex};box-shadow:0 0 6px ${hex}88;"></span>
            <span class="slice-label">Slice ${idx + 1}</span>
            <span class="slice-px">${sliceSet.size}px</span>`;
        item.querySelector('input').addEventListener('change', e => {
            data.checkStates[idx] = e.target.checked;
            renderPreview(data);
        });
        grid.appendChild(item);
    });

    container.appendChild(grid);
}

function confirm() {
    getEl('sliceModal').style.display = 'none';
    if (modalResolve) { modalResolve(modalData); modalResolve = null; }
}

function cancel() {
    getEl('sliceModal').style.display = 'none';
    if (modalResolve) { modalResolve(null); modalResolve = null; }
}
