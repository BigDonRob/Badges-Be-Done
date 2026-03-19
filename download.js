import { state } from './state.js';
import { bgStack, intersectionStack, overlayStack } from './stacks.js';

const statusEl = document.getElementById('status');

// ─── Single canvas download ───────────────────────────────────────────────────

export function downloadCanvas(canvas, filename) {
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    });
}

// ─── ZIP download ─────────────────────────────────────────────────────────────

export async function downloadAllAsZip(saveAs = false) {
    const zip    = new JSZip(); // eslint-disable-line no-undef
    const folder = zip.folder('bordered_images');
    const groups = _groupByBase(state.processedCanvases);

    Object.values(groups).forEach(items =>
        items.forEach(item =>
            folder.file(`${_base(item.filename)}${item.suffix}.png`,
                item.canvas.toDataURL('image/png').split(',')[1], { base64: true })
        )
    );

    _saveStackSnapshot(folder, bgStack,           'compiled_background.png');
    _saveStackSnapshot(folder, intersectionStack, 'compiled_intersection.png');
    _saveStackSnapshot(folder, overlayStack,      'compiled_overlay.png');

    const blob = await zip.generateAsync({ type: 'blob' });

    if (saveAs && 'showSaveFilePicker' in window) {
        try {
            const fh = await window.showSaveFilePicker({ types: [{ description: 'ZIP', accept: { 'application/zip': ['.zip'] } }] });
            const w  = await fh.createWritable();
            await w.write(blob); await w.close();
            return;
        } catch { /* fallthrough */ }
    }
    _triggerDownload(blob, 'processed_images.zip');
}

// ─── Individual download ──────────────────────────────────────────────────────

export async function downloadAllIndividually() {
    statusEl.textContent = 'Downloading individually...';
    statusEl.classList.add('active');

    const groups  = _groupByBase(state.processedCanvases);
    let counter   = 1;

    for (const items of Object.values(groups)) {
        for (const item of items) {
            let layer = 0;
            const m = item.suffix?.match(/slice(\d+)_front/);
            if (m) layer = parseInt(m[1]);
            downloadCanvas(item.canvas, `Badge${String(counter).padStart(3,'0')}-${String(layer).padStart(3,'0')}.png`);
            await _delay(100);
        }
        counter++;
    }

    statusEl.textContent = `Downloaded ${state.processedCanvases.length} image(s)!`;
    setTimeout(() => statusEl.classList.remove('active'), 3000);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _base(filename) { return filename.replace(/\.[^/.]+$/, ''); }

function _groupByBase(canvases) {
    const g = {};
    canvases.forEach(item => {
        const b = _base(item.filename);
        if (!g[b]) g[b] = [];
        g[b].push(item);
    });
    return g;
}

function _saveStackSnapshot(folder, stack, name) {
    if (!stack.compiledCanvas) return;
    folder.file(name, stack.compiledCanvas.toDataURL('image/png').split(',')[1], { base64: true });
}

function _triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
