import { bgStack, intersectionStack, overlayStack } from './stacks.js';
import { state } from './state.js';
import { extractDominantColors, generateComplementaryPalette } from './colors.js';

const SAVE_VERSION = 2;

// ─── Pixel encoding ───────────────────────────────────────────────────────────
//
// Each upload-layer image is stored as:
//   { palette: ['#rrggbbaa', ...], pixels: '<base64 Uint8Array(4096)>' }
//
// palette holds every unique RGBA colour found in the 64×64 image (≤256 entries).
// pixels is a Uint8Array where each byte is an index into palette.
// If the image somehow contains >255 unique colours we fall back to a PNG data-URL
// stored as { fallback: '<dataURL>' }.  Generate-type layers store { regen: true }
// and are reconstructed via _generateCanvas(settings) on restore.

function encodeImage(img) {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 64, 64);
    const raw = ctx.getImageData(0, 0, 64, 64).data; // Uint8ClampedArray, length 16384

    const paletteMap = new Map(); // '#rrggbbaa' → uint8 index
    const palette    = [];
    const indices    = new Uint8Array(4096);

    for (let i = 0; i < 4096; i++) {
        const r = raw[i*4], g = raw[i*4+1], b = raw[i*4+2], a = raw[i*4+3];
        const key = `${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}${a.toString(16).padStart(2,'0')}`;
        if (!paletteMap.has(key)) {
            if (palette.length >= 256) {
                // Safety fallback for photographic / highly varied images
                return { fallback: cv.toDataURL('image/png') };
            }
            paletteMap.set(key, palette.length);
            palette.push(key); // store without '#' to save chars
        }
        indices[i] = paletteMap.get(key);
    }

    // btoa on a Uint8Array via String.fromCharCode — safe because all values ≤255
    const pixels = btoa(String.fromCharCode(...indices));
    return { palette, pixels };
}

async function decodeImage(encoded) {
    if (encoded.fallback) return _loadImg(encoded.fallback);

    const { palette, pixels } = encoded;
    const raw     = atob(pixels);
    const cv      = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const ctx     = cv.getContext('2d');
    const imgData = ctx.createImageData(64, 64);

    for (let i = 0; i < 4096; i++) {
        const idx = raw.charCodeAt(i);
        const hex = palette[idx]; // 'rrggbbaa' (8 chars, no #)
        imgData.data[i*4]   = parseInt(hex.slice(0,2), 16);
        imgData.data[i*4+1] = parseInt(hex.slice(2,4), 16);
        imgData.data[i*4+2] = parseInt(hex.slice(4,6), 16);
        imgData.data[i*4+3] = parseInt(hex.slice(6,8), 16);
    }

    ctx.putImageData(imgData, 0, 0);
    return _loadImg(cv.toDataURL());
}

// ─── Palette serialization ────────────────────────────────────────────────────

function computeAllPalettes() {
    if (!state.colorRefImage) return null;
    const base = extractDominantColors(state.colorRefImage, 3);
    const cool = generateComplementaryPalette(base, 'cool');
    const warm = generateComplementaryPalette(base, 'warm');
    return { base, cool, warm }; // each: [[r,g,b],[r,g,b],[r,g,b]]
}

// ─── Stack serialization ──────────────────────────────────────────────────────

async function serializeStack(stack) {
    const out = [];
    for (const layer of stack.layers) {
        const entry = {
            type:     layer.type,
            settings: { ...layer.settings, alpha: layer.settings.alpha || 1 },
            imageData: null,
        };
        if (layer.type === 'generate') {
            // No pixel data needed — will be regenerated from settings
            entry.imageData = { regen: true };
        } else if (layer.image) {
            entry.imageData = encodeImage(layer.image);
        }
        out.push(entry);
    }
    return out;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveSettings() {
    const stacks = {
        background:   await serializeStack(bgStack),
        intersection: await serializeStack(intersectionStack),
        overlay:      await serializeStack(overlayStack),
    };

    const data = {
        version:          SAVE_VERSION,
        savedAt:          new Date().toISOString(),
        cycleBackgrounds: document.getElementById('cycleBackgrounds').classList.contains('active'),
        colorRefPalettes: computeAllPalettes(), // { base, cool, warm } or null
        stacks,
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `badges-session-${_dateSlug()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Restore ──────────────────────────────────────────────────────────────────

async function restoreStack(stack, savedLayers) {
    stack.clearAllLayers();
    for (const saved of savedLayers) {
        const layer = stack.addLayer({ type: saved.type, settings: saved.settings });

        if (!saved.imageData) continue;

        if (saved.imageData.regen) {
            // Regenerate from settings (generate-type layers)
            const canvas = stack._generateCanvas(layer.settings);
            if (canvas) {
                const img = await _loadImg(canvas.toDataURL());
                stack.setLayerImage(layer, img);
            }
        } else {
            // Decode indexed or fallback pixel data (upload-type layers)
            const img = await decodeImage(saved.imageData);
            stack.setLayerImage(layer, img);
        }
    }
    stack.recompile();
}

export async function loadSettings(file, onRestored) {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.version !== SAVE_VERSION) {
        throw new Error(`Unsupported save version ${data.version} (expected ${SAVE_VERSION})`);
    }

    await Promise.all([
        restoreStack(bgStack,           data.stacks.background),
        restoreStack(intersectionStack, data.stacks.intersection),
        restoreStack(overlayStack,      data.stacks.overlay),
    ]);

    // Restore cycle-backgrounds toggle
    document.getElementById('cycleBackgrounds')
        .classList.toggle('active', !!data.cycleBackgrounds);

    // Restore palette arrays — no ref image needed
    if (data.colorRefPalettes) {
        state.savedPalettes  = data.colorRefPalettes;
        state.colorRefImage  = null; // no image; palette data is all we need
        document.getElementById('colorRefInfo').textContent = '(palettes restored from session — load new image to update)';
        // Clear any stale preview
        document.getElementById('colorRefPreview').classList.remove('active');
    }

    if (onRestored) onRestored();
    return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _loadImg(src) {
    return new Promise((resolve, reject) => {
        const img   = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode failed during session restore'));
        img.src     = src;
    });
}

function _dateSlug() {
    return new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
}
