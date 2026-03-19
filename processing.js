import { state } from './state.js';
import { bgStack, intersectionStack, overlayStack } from './stacks.js';
import { showSliceModal } from './slicing.js';
import { loadImage, drawSourceOnCanvas } from './imageUtils.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const statusEl     = document.getElementById('status');
const progressCont = document.getElementById('progressContainer');
const progressBar  = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsEl    = document.getElementById('results');
const imageGrid    = document.getElementById('imageGrid');

// ─── Main Entry ───────────────────────────────────────────────────────────────

export async function processImages(cycleBackgrounds) {
    if (!state.sourceImages.length) return;

    // Load all images first
    const loadedEntries = [];
    for (const item of state.sourceImages) {
        const img = await loadImage(item.file);
        loadedEntries.push({ img, file: item.file, mode: item.mode, slicing: item.slicing });
    }

    // Separate into slicing and non-slicing groups
    const slicingEntries = loadedEntries.filter(e => e.slicing);

    // Show modal only for slicing entries, if any exist
    let sliceSelectionsMap = null;
    if (slicingEntries.length > 0) {
        const result = await showSliceModal(slicingEntries);
        if (!result) return; // user cancelled
        // Build a Map keyed by the loaded entry object for fast lookup
        sliceSelectionsMap = new Map(slicingEntries.map((e, i) => [e, result[i]]));
    }

    // Setup UI
    statusEl.textContent = 'Processing images...';
    progressCont.style.display = 'block';
    resultsEl.style.display    = 'block';
    imageGrid.innerHTML        = '';
    state.processedCanvases    = [];

    const total = loadedEntries.length;
    let processed = 0;

    for (let i = 0; i < loadedEntries.length; i++) {
        const entry = loadedEntries[i];
        const { img, file, mode, slicing } = entry;

        // Resolve background canvas for this image
        const bgCanvas = cycleBackgrounds
            ? bgStack.recompileForCycle()
            : bgStack.compiledCanvas;

        if (slicing && sliceSelectionsMap) {
            const sel = sliceSelectionsMap.get(entry);
            const { slices, checkStates } = sel;

            // Base badge: all layers, no slice promotion
            const base = compositeImage(img, mode, bgCanvas, intersectionStack.compiledCanvas, overlayStack.compiledCanvas);
            state.processedCanvases.push({ canvas: base, filename: file.name, suffix: '_base' });
            addToGrid(base, 'Base Badge', file.name, '_base');

            // Composite with promoted slices (if any selected)
            const checkedIdx = checkStates.map((v, si) => v ? si : -1).filter(si => si >= 0);
            if (checkedIdx.length > 0) {
                const comp  = compositeSliced(img, mode, slices, checkedIdx, bgCanvas, intersectionStack.compiledCanvas, overlayStack.compiledCanvas);
                const label = `Slices ${checkedIdx.map(si => si+1).join(', ')} front`;
                state.processedCanvases.push({ canvas: comp, filename: file.name, suffix: '_slices_front' });
                addToGrid(comp, label, file.name, '_slices_front');
            }
        } else {
            const canvas = compositeImage(img, mode, bgCanvas, intersectionStack.compiledCanvas, overlayStack.compiledCanvas);
            state.processedCanvases.push({ canvas, filename: file.name, suffix: '' });
            addToGrid(canvas, `Image ${i+1}`, file.name, '');
        }

        processed++;
        const pct = (processed / total) * 100;
        progressBar.style.setProperty('--progress', `${pct}%`);
        progressText.textContent = `Processed ${processed}/${total} images`;
    }

    statusEl.textContent = 'Processing complete!';
    setTimeout(() => { progressCont.style.display = 'none'; statusEl.textContent = ''; }, 2000);
}

// ─── Compositing ──────────────────────────────────────────────────────────────

/**
 * Standard composite: BG → midground → intersection → overlay
 */
export function compositeImage(sourceImg, mode, bgCanvas, intersectionCanvas, overlayCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (bgCanvas)           ctx.drawImage(bgCanvas, 0, 0, 64, 64);
    drawSourceOnCanvas(ctx, sourceImg, 64, 64, mode);
    if (intersectionCanvas) ctx.drawImage(intersectionCanvas, 0, 0, 64, 64);
    if (overlayCanvas)      ctx.drawImage(overlayCanvas, 0, 0, 64, 64);
    return canvas;
}

/**
 * Sliced composite: same as compositeImage but checked slice pixels
 * are painted above the intersection layer, then overlay goes on top.
 */
export function compositeSliced(sourceImg, mode, slices, checkedIndices, bgCanvas, intersectionCanvas, overlayCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (bgCanvas)           ctx.drawImage(bgCanvas, 0, 0, 64, 64);
    drawSourceOnCanvas(ctx, sourceImg, 64, 64, mode);
    if (intersectionCanvas) ctx.drawImage(intersectionCanvas, 0, 0, 64, 64);

    // Gather promoted pixels
    const fgCv  = document.createElement('canvas'); fgCv.width = 64; fgCv.height = 64;
    const fgCtx = fgCv.getContext('2d');
    fgCtx.imageSmoothingEnabled = false;
    drawSourceOnCanvas(fgCtx, sourceImg, 64, 64, mode);
    const fgData = fgCtx.getImageData(0, 0, 64, 64);

    const front = new Set();
    checkedIndices.forEach(si => slices[si].forEach(p => front.add(p)));

    const ovCv  = document.createElement('canvas'); ovCv.width = 64; ovCv.height = 64;
    const ovCtx = ovCv.getContext('2d');
    const ovData = ovCtx.createImageData(64, 64);
    for (let i = 0; i < fgData.data.length; i += 4) {
        if (front.has(i / 4)) {
            ovData.data[i]   = fgData.data[i];
            ovData.data[i+1] = fgData.data[i+1];
            ovData.data[i+2] = fgData.data[i+2];
            ovData.data[i+3] = fgData.data[i+3];
        }
    }
    ovCtx.putImageData(ovData, 0, 0);
    ctx.drawImage(ovCv, 0, 0);

    // Overlay always topmost
    if (overlayCanvas) ctx.drawImage(overlayCanvas, 0, 0, 64, 64);

    return canvas;
}

// ─── Grid Helper ──────────────────────────────────────────────────────────────

function addToGrid(canvas, label, filename, suffix) {
    const wrap = document.createElement('div');
    wrap.className = 'image-item';
    wrap.appendChild(canvas);

    const lbl = document.createElement('div');
    lbl.textContent = label;
    lbl.style.cssText = 'color:var(--text-secondary);font-size:0.8em;margin-top:5px;';
    wrap.appendChild(lbl);

    const btn = document.createElement('button');
    btn.textContent = 'Download';
    btn.className   = 'download-individual';
    btn.onclick     = () => {
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href = url; a.download = `processed_${filename.replace(/\.[^/.]+$/, '')}${suffix}.png`;
            a.click(); URL.revokeObjectURL(url);
        });
    };
    wrap.appendChild(btn);
    imageGrid.appendChild(wrap);
}
