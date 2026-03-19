import { state } from './state.js';
import { bgStack, intersectionStack, overlayStack } from './stacks.js';
import { initDropZones } from './dropzones.js';
import { initSliceModal } from './slicing.js';
import { processImages } from './processing.js';
import { downloadAllAsZip, downloadAllIndividually } from './download.js';
import { saveSettings, loadSettings } from './save.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const colorRefInput      = document.getElementById('colorRefInput');
const colorRefInfo       = document.getElementById('colorRefInfo');
const colorRefPreview    = document.getElementById('colorRefPreview');
const colorRefPreviewImg = document.getElementById('colorRefPreviewImg');

const bgPreviewCanvas           = document.getElementById('bgPreviewCanvas');
const intersectionPreviewCanvas = document.getElementById('intersectionPreviewCanvas');
const overlayPreviewCanvas      = document.getElementById('overlayPreviewCanvas');

const bgLayerList           = document.getElementById('bgLayerList');
const intersectionLayerList = document.getElementById('intersectionLayerList');
const overlayLayerList      = document.getElementById('overlayLayerList');

const addBgLayerBtn           = document.getElementById('addBgLayerBtn');
const addIntersectionLayerBtn = document.getElementById('addIntersectionLayerBtn');
const addOverlayLayerBtn      = document.getElementById('addOverlayLayerBtn');

const cycleBackgrounds = document.getElementById('cycleBackgrounds');
const processButton    = document.getElementById('processButton');
const downloadAll      = document.getElementById('downloadAll');
const downloadSaveAs   = document.getElementById('downloadSaveAs');
const downloadInd      = document.getElementById('downloadIndividual');

const saveSessionBtn   = document.getElementById('saveSessionBtn');
const loadSessionInput = document.getElementById('loadSessionInput');
const sessionStatus    = document.getElementById('sessionStatus');

// ─── Stack Previews ───────────────────────────────────────────────────────────

function updatePreviews() {
    const draw = (canvas, ...sources) => {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 256, 256);
        for (const src of sources)
            if (src) ctx.drawImage(src, 0, 0, 256, 256);
    };
    draw(bgPreviewCanvas,           bgStack.compiledCanvas);
    draw(intersectionPreviewCanvas, bgStack.compiledCanvas, intersectionStack.compiledCanvas);
    draw(overlayPreviewCanvas,      bgStack.compiledCanvas, intersectionStack.compiledCanvas, overlayStack.compiledCanvas);
}

// ─── Process Button State ─────────────────────────────────────────────────────

function updateProcessButton() {
    const hasIntersection = intersectionStack.layers.some(l => l.image);
    processButton.disabled = !(hasIntersection && state.sourceImages.length > 0);
}

// ─── Shared callback ──────────────────────────────────────────────────────────

function onAnyChange() {
    updatePreviews();
    updateProcessButton();
}

// ─── Initialize ───────────────────────────────────────────────────────────────

bgStack.init(bgLayerList,                     onAnyChange);
intersectionStack.init(intersectionLayerList, onAnyChange);
overlayStack.init(overlayLayerList,           onAnyChange);

initDropZones(onAnyChange);
initSliceModal();

addBgLayerBtn.addEventListener('click',           () => bgStack.addLayer());
addIntersectionLayerBtn.addEventListener('click', () => intersectionStack.addLayer());
addOverlayLayerBtn.addEventListener('click',      () => overlayStack.addLayer());

// Generate button listeners (removed from HTML, keeping for reference)
// const generateBgBtn = document.getElementById('generateBgBtn');
// const generateIntersectionBtn = document.getElementById('generateIntersectionBtn');

// if (generateBgBtn) {
//     generateBgBtn.addEventListener('click', () => {
//         bgStack.recompile();
//         onAnyChange();
//     });
// }

// if (generateIntersectionBtn) {
//     generateIntersectionBtn.addEventListener('click', () => {
//         intersectionStack.recompile();
//         onAnyChange();
//     });
// }

colorRefInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    colorRefInfo.textContent = file.name;
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            state.colorRefImage  = img;
            state.savedPalettes  = null; // real image supersedes any saved palette data
            colorRefPreviewImg.src = ev.target.result;
            colorRefPreview.classList.add('active');
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

processButton.addEventListener('click',  () => processImages(cycleBackgrounds.classList.contains('active')));
cycleBackgrounds.addEventListener('click', () => cycleBackgrounds.classList.toggle('active'));
downloadAll.addEventListener('click',    () => downloadAllAsZip(false));
downloadSaveAs.addEventListener('click', () => downloadAllAsZip(true));
downloadInd.addEventListener('click',    () => downloadAllIndividually());

// ─── Session Save / Load ──────────────────────────────────────────────────────

saveSessionBtn.addEventListener('click', async () => {
    await saveSettings();
    _flashStatus('Session saved ✓', 'ok');
});

loadSessionInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ''; // allow reloading same file
    sessionStatus.textContent  = 'Loading…';
    sessionStatus.className    = 'session-status loading';
    try {
        const data = await loadSettings(file, onAnyChange);
        const ts   = data.savedAt ? new Date(data.savedAt).toLocaleString() : 'unknown time';
        _flashStatus(`Session restored (saved ${ts}) ✓`, 'ok');
    } catch (err) {
        _flashStatus(`Load failed: ${err.message}`, 'err');
    }
});

function _flashStatus(msg, type) {
    sessionStatus.textContent = msg;
    sessionStatus.className   = `session-status ${type}`;
    setTimeout(() => {
        sessionStatus.textContent = '';
        sessionStatus.className   = 'session-status';
    }, 5000);
}
