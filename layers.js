import { CORNER_STYLES, CORNER_STYLE_HINTS, BG_STYLE_GROUPS, BORDER_STYLE_GROUPS } from './constants.js';
import { hexToRgb, extractDominantColors, generateComplementaryColors, generateSeed, createSeededRNG, generateComplementaryPalette } from './colors.js';
import { createSimpleBorder } from './borders.js';
import { createBackgroundPattern } from './backgrounds.js';
import { state } from './state.js';

// ─── DOM Micro-Utilities ──────────────────────────────────────────────────────

function mkEl(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}

function buildSelectEl(groups) {
    const sel = document.createElement('select');
    sel.className = 'styled-select';
    for (const group of groups) {
        const og = document.createElement('optgroup');
        og.label = group.label;
        for (const [val, txt] of group.options) og.appendChild(new Option(txt, val));
        sel.appendChild(og);
    }
    return sel;
}

function buildColorSwatches(count, defaults) {
    return Array.from({ length: count }, (_, i) => {
        const wrap = mkEl('div', 'lc-color-swatch');
        const inp = document.createElement('input');
        inp.type = 'color';
        inp.value = defaults[i] || '#ffffff';
        wrap.append(inp, mkEl('span', '', `C${i+1}`));
        return { wrap, inp };
    });
}

function buildColorSwatchesWithDefaults(count, layerKind) {
    const defaults = layerKind === 'background' 
        ? ['#1a1a2e','#16213e','#0f3460']
        : ['#ffffff','#ff0000','#00ff00'];
    return buildColorSwatches(count, defaults);
}

// ─── LayerStack ───────────────────────────────────────────────────────────────

export class LayerStack {
    constructor(kind) {
        this.kind          = kind; // 'background' | 'border'
        this.layers        = [];
        this.nextId        = 1;
        this.compiledCanvas = null;
        this.listEl        = null;
        this._onRecompile  = null;
    }

    /** Call once DOM is ready. Adds the first default layer. */
    init(listEl, onRecompile) {
        this.listEl       = listEl;
        this._onRecompile = onRecompile || (() => {});
        this.addLayer();
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    addLayer(overrides = {}) {
        const id       = this.nextId++;
        const defaults = this._defaultSettings();
        // Deep-merge: for border layers the nested 'corners' object must be preserved
        const settings = overrides.settings
            ? { ...defaults, ...overrides.settings,
                ...(defaults.corners ? { corners: { ...defaults.corners, ...(overrides.settings.corners || {}) } } : {}) }
            : defaults;
        const layer = { id, collapsed: false, type: overrides.type || 'upload', image: null, _mini: null, settings };
        this.layers.push(layer);
        const card = this._buildCard(layer);
        this.listEl.appendChild(card);

        // If restoring to generate mode, activate that radio so the UI section shows
        if (layer.type === 'generate') {
            const radio = card.querySelector('input[value="generate"]');
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
        }

        this._renumber();
        return layer;
    }

    /** Remove all layers and reset state (used by session restore). */
    clearAllLayers() {
        this.listEl.innerHTML = '';
        this.layers           = [];
        this.nextId           = 1;
        this.compiledCanvas   = null;
    }

    removeLayer(id) {
        const idx = this.layers.findIndex(l => l.id === id);
        if (idx < 0) return;
        this.layers.splice(idx, 1);
        this.listEl.querySelector(`[data-lid="${id}"]`)?.remove();
        this._renumber();
        this.recompile();
    }

    setLayerImage(layer, img) {
        layer.image = img;
        this.recompile();
    }

    // ── Compilation ───────────────────────────────────────────────────────────

    recompile() {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        for (const l of this.layers) {
            if (l.image) {
                ctx.globalAlpha = l.settings.alpha ?? 1;
                ctx.drawImage(l.image, 0, 0, 64, 64);
            }
        }
        ctx.globalAlpha = 1;
        this.compiledCanvas = c;
        this._onRecompile();
    }

    /** Re-generate all generate-type layers with fresh seeds (for cycle mode). */
    recompileForCycle() {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        for (const l of this.layers) {
            ctx.globalAlpha = l.settings.alpha ?? 1;
            if (l.type === 'upload' && l.image) {
                ctx.drawImage(l.image, 0, 0, 64, 64);
            } else if (l.type === 'generate') {
                const fresh = this._generateCanvas(l.settings);
                if (fresh) ctx.drawImage(fresh, 0, 0, 64, 64);
            }
        }
        ctx.globalAlpha = 1;
        return c;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    _renumber() {
        this.listEl.querySelectorAll('.lc-title')
            .forEach((t, i) => { t.textContent = `Layer ${i+1}`; });
    }

    _defaultSettings() {
        return this.kind === 'background'
            ? { style: 'bg1', colorMode: 'manual', colorCount: 2, manualColors: ['#1a1a2e','#16213e','#0f3460'], alpha: 1 }
            : { width: 3, style: 'solid', colorMode: 'manual', colorCount: 1, manualColors: ['#ffffff','#ff0000','#00ff00'], corners: { tl:true, tr:true, bl:true, br:true }, alpha: 1 };
    }

    _resolveColors(s, rng) {
        // Always use manual colors now, ensure at least one color
        const colors = [s.manualColors[0], s.colorCount>=2 ? s.manualColors[1] : null, s.colorCount>=3 ? s.manualColors[2] : null]
            .filter(Boolean);
        
        // If no valid colors found, use a default
        if (colors.length === 0) {
            return [[255, 255, 255]]; // Default to white
        }
        
        return colors.map(hexToRgb);
    }

    _generateCanvas(s) {
        const rng    = createSeededRNG(generateSeed());
        const colors = this._resolveColors(s, rng);
        const canvas = this.kind === 'background'
            ? createBackgroundPattern(colors, s.style, rng)
            : createSimpleBorder(colors, s.width, s.style, rng, s.corners);
        
        return canvas;
    }

    // ── Card Builder ──────────────────────────────────────────────────────────

    _buildCard(layer) {
        const card = mkEl('div', 'layer-card');
        card.dataset.lid = layer.id;

        // Header
        const header      = mkEl('div', 'lc-header');
        const title       = mkEl('span', 'lc-title', `Layer ${this.layers.length + 1}`);
        const typeToggle  = mkEl('div', 'lc-type-toggle');
        const collapseBtn = mkEl('button', 'lc-collapse-btn', '▾');
        const removeBtn   = mkEl('button', 'lc-remove-btn', '×');
        removeBtn.title   = 'Remove layer';

        const makeRadio = (value, label) => {
            const lbl   = mkEl('label', 'lc-type-btn');
            const radio = document.createElement('input');
            radio.type  = 'radio';
            radio.name  = `lt_${this.kind}_${layer.id}`;
            radio.value = value;
            if (value === 'upload') radio.checked = true;
            lbl.append(radio, label);
            return { lbl, radio };
        };
        const { lbl: uploadLbl, radio: uploadRadio } = makeRadio('upload', 'Upload');
        const { lbl: genLbl,    radio: genRadio    } = makeRadio('generate', 'Generate');
        typeToggle.append(uploadLbl, genLbl);
        header.append(title, typeToggle, collapseBtn, removeBtn);
        card.appendChild(header);

        // Body
        const body      = mkEl('div', 'lc-body');
        const controls  = mkEl('div', 'lc-controls');

        // Upload sub-section
        const uploadSec = mkEl('div', 'lc-upload-section');
        const fileId    = `lf_${this.kind}_${layer.id}`;
        const fileWrap  = mkEl('div', 'file-input-wrapper');
        fileWrap.style.marginBottom = '0';
        const fileInp   = document.createElement('input');
        fileInp.type    = 'file'; fileInp.accept = 'image/*'; fileInp.id = fileId;
        fileInp.style.cssText = 'position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;';
        const fileLbl   = mkEl('label', 'file-button', 'Choose Image');
        fileLbl.htmlFor = fileId;
        const fileInfo  = mkEl('span', 'file-info', 'No file selected');
        fileWrap.append(fileInp, fileLbl);
        uploadSec.append(fileWrap, fileInfo);

        fileInp.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            fileInfo.textContent = file.name;
            const { loadImage } = await import('./imageUtils.js');
            this.setLayerImage(layer, await loadImage(file));
        });

        // Generate sub-section
        const genSec = mkEl('div', 'lc-generate-section');
        genSec.style.display = 'none';
        this._buildGenControls(genSec, layer);

        controls.append(uploadSec, genSec);
        
        // Alpha slider (always visible)
        const alphaField = mkEl('div', 'lc-field');
        alphaField.append(mkEl('span', 'lc-field-label', 'Alpha'));
        const alphaRow = mkEl('div', 'lc-colors-row');
        const alphaSlider = document.createElement('input');
        alphaSlider.type = 'range';
        alphaSlider.min = 0;
        alphaSlider.max = 100;
        alphaSlider.value = (layer.settings.alpha || 1) * 100;
        alphaSlider.style.width = '140px';
        const alphaLabel = mkEl('span', 'lc-alpha-label', `${Math.round((layer.settings.alpha || 1) * 100)}%`);
        alphaRow.append(alphaSlider, alphaLabel);
        alphaField.appendChild(alphaRow);
        
        alphaSlider.addEventListener('input', () => {
            const value = parseInt(alphaSlider.value);
            layer.settings.alpha = value / 100;
            alphaLabel.textContent = `${value}%`;
            this.recompile();
        });
        
        controls.appendChild(alphaField);
        body.appendChild(controls);
        card.appendChild(body);

        // Events
        removeBtn.addEventListener('click', () => this.removeLayer(layer.id));
        collapseBtn.addEventListener('click', () => {
            layer.collapsed = !layer.collapsed;
            body.style.display  = layer.collapsed ? 'none' : '';
            collapseBtn.textContent = layer.collapsed ? '▸' : '▾';
        });
        [uploadRadio, genRadio].forEach(radio => radio.addEventListener('change', () => {
            layer.type = radio.value;
            uploadSec.style.display = radio.value === 'upload'    ? '' : 'none';
            genSec.style.display    = radio.value === 'generate'  ? '' : 'none';
            // Auto-expand when switching to generate
            if (radio.value === 'generate' && layer.collapsed) {
                layer.collapsed = false;
                body.style.display = '';
                collapseBtn.textContent = '▾';
            }
        }));

        return card;
    }

    _buildGenControls(container, layer) {
        this.kind === 'background'
            ? this._buildBgGenControls(container, layer)
            : this._buildBorderGenControls(container, layer);
    }

    _buildBgGenControls(container, layer) {
        const s = layer.settings;

        const styleField = mkEl('div', 'lc-field');
        styleField.append(mkEl('span', 'lc-field-label', 'Style'));
        const styleEl = buildSelectEl(BG_STYLE_GROUPS);
        styleEl.value = s.style;
        styleEl.addEventListener('change', () => { s.style = styleEl.value; });
        styleField.appendChild(styleEl);

        const countField = mkEl('div', 'lc-field');
        countField.append(mkEl('span', 'lc-field-label', 'Colors'));

        const colorRow = mkEl('div', 'lc-colors-row');

        const countEl = document.createElement('select');
        countEl.className = 'styled-select';
        ['1','2','3'].forEach(v => countEl.appendChild(new Option(v, v)));
        countEl.value = s.colorCount;
        colorRow.appendChild(countEl);

        const pullDisplay = mkEl('span', 'lc-pull-display', 'Pull palette from Reference:');
        colorRow.appendChild(pullDisplay);

        const paletteDisplay = mkEl('div', 'lc-palette-display');
        const paletteLabel = mkEl('span', 'lc-palette-label', 'Reference:');
        paletteLabel.style.display = 'none'; // Hide the label
        const paletteColors = mkEl('div', 'lc-palette-colors');
        const origBtn = mkEl('button', 'lc-palette-btn', '1');
        const coolBtn = mkEl('button', 'lc-palette-btn', '2');
        const warmBtn = mkEl('button', 'lc-palette-btn', '3');
        paletteColors.append(origBtn, coolBtn, warmBtn);
        paletteDisplay.append(paletteLabel, paletteColors);
        colorRow.appendChild(paletteDisplay);

        const swatches = buildColorSwatchesWithDefaults(3, this.kind);
        // Initialize swatches with layer's actual settings
        swatches.forEach((sw, i) => {
            if (s.manualColors[i]) {
                sw.inp.value = s.manualColors[i];
            }
        });
        swatches.forEach(sw => colorRow.appendChild(sw.wrap));
        countField.appendChild(colorRow);
        
        /** Convert [r,g,b] array → #rrggbb hex */
        const toHex = ([r, g, b]) =>
            '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2,'0')).join('');

        /** Write colors to swatches + settings */
        const applyColors = (colors) => {
            colors.forEach((color, i) => {
                if (i < 3 && Array.isArray(color)) {
                    const hex = toHex(color);
                    swatches[i].inp.value = hex;
                    s.manualColors[i] = hex;
                }
            });
        };

        /** Tint button backgrounds to preview the palette */
        const tintBtns = (orig, cool, warm) => {
            if (orig[0]) origBtn.style.background = toHex(orig[0]);
            if (cool[0]) coolBtn.style.background = toHex(cool[0]);
            if (warm[0]) warmBtn.style.background = toHex(warm[0]);
        };

        /** Extract + pre-compute all three palettes from ref image or saved data. */
        const buildPalettes = () => {
            console.log('Building palettes, ref image:', !!state.colorRefImage, 'saved palettes:', !!state.savedPalettes);
            if (state.colorRefImage) {
                const base = extractDominantColors(state.colorRefImage, 3);
                console.log('Extracted base colors:', base);
                const cool = generateComplementaryPalette(base, 'cool');
                const warm = generateComplementaryPalette(base, 'warm');
                console.log('Generated palettes:', { base, cool, warm });
                return { base, cool, warm };
            }
            return state.savedPalettes || null;
        };

        // Tint palette buttons on load if data is available
        const palettesOnLoad = buildPalettes();
        if (palettesOnLoad) tintBtns(palettesOnLoad.base, palettesOnLoad.cool, palettesOnLoad.warm);

        origBtn.addEventListener('click', () => {
            const p = buildPalettes();
            if (!p) return;
            tintBtns(p.base, p.cool, p.warm);
            applyColors(p.base);
        });

        coolBtn.addEventListener('click', () => {
            const p = buildPalettes();
            if (!p) return;
            tintBtns(p.base, p.cool, p.warm);
            applyColors(p.cool);
        });

        warmBtn.addEventListener('click', () => {
            const p = buildPalettes();
            if (!p) return;
            tintBtns(p.base, p.cool, p.warm);
            applyColors(p.warm);
        });

        const updateVis = () => {
            const n = parseInt(countEl.value);
            swatches[1].wrap.style.display = n >= 2 ? '' : 'none';
            swatches[2].wrap.style.display = n >= 3 ? '' : 'none';
        };
        updateVis();

        countEl.addEventListener('change', () => { s.colorCount = parseInt(countEl.value); updateVis(); });
        swatches.forEach((sw, i) => sw.inp.addEventListener('input', () => { s.manualColors[i] = sw.inp.value; }));

        const genBtn = mkEl('button', 'lc-gen-btn', 'Generate');
        genBtn.addEventListener('click', () => {
            const canvas = this._generateCanvas(s);
            if (!canvas) return;
            const img = new Image();
            img.onload = () => this.setLayerImage(layer, img);
            img.src = canvas.toDataURL();
        });

        container.append(styleField, countField, genBtn);
    }

    _buildBorderGenControls(container, layer) {
        const s = layer.settings;

        const widthField = mkEl('div', 'lc-field');
        const widthLabel = mkEl('span', 'lc-field-label', `Width: ${s.width}px`);
        const widthRange = document.createElement('input');
        widthRange.type  = 'range'; widthRange.min = 2; widthRange.max = 5; widthRange.value = s.width;
        widthRange.style.width = '140px';
        widthRange.addEventListener('input', () => { s.width = parseInt(widthRange.value); widthLabel.textContent = `Width: ${widthRange.value}px`; });
        widthField.append(widthLabel, widthRange);

        const styleField = mkEl('div', 'lc-field');
        styleField.append(mkEl('span', 'lc-field-label', 'Style'));
        const styleEl = buildSelectEl(BORDER_STYLE_GROUPS);
        styleEl.value = s.style;
        styleField.appendChild(styleEl);

        const cornerSec  = mkEl('div', 'lc-corners');
        cornerSec.style.display = CORNER_STYLES.has(s.style) ? '' : 'none';
        const cGrid      = mkEl('div', 'corner-grid');
        const cornerHint = mkEl('p', 'corner-hint', CORNER_STYLE_HINTS[s.style] || '');
        ['tl','tr','bl','br'].forEach(k => {
            const lbl = mkEl('label', 'corner-btn');
            const cb  = document.createElement('input');
            cb.type = 'checkbox'; cb.checked = s.corners[k];
            cb.addEventListener('change', () => { s.corners[k] = cb.checked; });
            lbl.append(cb, k.toUpperCase());
            cGrid.appendChild(lbl);
        });
        cornerSec.append(cGrid, cornerHint);

        styleEl.addEventListener('change', () => {
            s.style = styleEl.value;
            const has = CORNER_STYLES.has(s.style);
            cornerSec.style.display  = has ? '' : 'none';
            cornerHint.textContent   = CORNER_STYLE_HINTS[s.style] || '';
        });

        const countField = mkEl('div', 'lc-field');
        countField.append(mkEl('span', 'lc-field-label', 'Colors'));

        const colorRow = mkEl('div', 'lc-colors-row');

        const countEl = document.createElement('select');
        countEl.className = 'styled-select lc-count-select';
        ['1','2','3'].forEach(v => countEl.appendChild(new Option(v, v)));
        countEl.value = s.colorCount;
        colorRow.appendChild(countEl);

        const pullDisplay = mkEl('span', 'lc-pull-display', 'Pull palette from Reference:');
        colorRow.appendChild(pullDisplay);

        // Palette preset buttons (1=orig, 2=cool, 3=warm)
        const paletteWrap = mkEl('div', 'lc-palette-wrap');
        const origBtn = mkEl('button', 'lc-palette-btn', '1');
        const coolBtn = mkEl('button', 'lc-palette-btn lc-palette-btn--cool', '2');
        const warmBtn = mkEl('button', 'lc-palette-btn lc-palette-btn--warm', '3');
        origBtn.title = 'Apply extracted colors (original)';
        coolBtn.title = 'Apply extracted colors with cool shift';
        warmBtn.title = 'Apply extracted colors with warm shift';
        paletteWrap.append(origBtn, coolBtn, warmBtn);
        colorRow.appendChild(paletteWrap);

        const swatches = buildColorSwatchesWithDefaults(3, this.kind);
        // Initialize swatches with layer's actual settings
        swatches.forEach((sw, i) => {
            if (s.manualColors[i]) {
                sw.inp.value = s.manualColors[i];
            }
        });
        swatches.forEach(sw => colorRow.appendChild(sw.wrap));
        countField.appendChild(colorRow);
        
        // ── Shared helpers ────────────────────────────────────────────────────

        const toHex = ([r, g, b]) =>
            '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2,'0')).join('');

        const applyColors = (colors) => {
            colors.forEach((color, i) => {
                if (i < 3 && Array.isArray(color)) {
                    const hex = toHex(color);
                    swatches[i].inp.value = hex;
                    s.manualColors[i] = hex;
                }
            });
        };

        const tintBtns = (orig, cool, warm) => {
            if (orig[0]) origBtn.style.background = toHex(orig[0]);
            if (cool[0]) coolBtn.style.background = toHex(cool[0]);
            if (warm[0]) warmBtn.style.background = toHex(warm[0]);
        };

        /** Extract + pre-compute all three palettes from ref image or saved data. */
        const buildPalettes = () => {
            console.log('Building palettes, ref image:', !!state.colorRefImage, 'saved palettes:', !!state.savedPalettes);
            if (state.colorRefImage) {
                const base = extractDominantColors(state.colorRefImage, 3);
                console.log('Extracted base colors:', base);
                const cool = generateComplementaryPalette(base, 'cool');
                const warm = generateComplementaryPalette(base, 'warm');
                console.log('Generated palettes:', { base, cool, warm });
                return { base, cool, warm };
            }
            return state.savedPalettes || null;
        };

        // Tint palette buttons on load if data is available
        const palettesOnLoad = buildPalettes();
        if (palettesOnLoad) tintBtns(palettesOnLoad.base, palettesOnLoad.cool, palettesOnLoad.warm);

        origBtn.addEventListener('click', () => {
            const p = buildPalettes();
            if (!p) return;
            tintBtns(p.base, p.cool, p.warm);
            applyColors(p.base);
        });

        coolBtn.addEventListener('click', () => {
            const p = buildPalettes();
            if (!p) return;
            tintBtns(p.base, p.cool, p.warm);
            applyColors(p.cool);
        });

        warmBtn.addEventListener('click', () => {
            const p = buildPalettes();
            if (!p) return;
            tintBtns(p.base, p.cool, p.warm);
            applyColors(p.warm);
        });

        const updateVis = () => {
            const n = parseInt(countEl.value);
            swatches[1].wrap.style.display = n >= 2 ? '' : 'none';
            swatches[2].wrap.style.display = n >= 3 ? '' : 'none';
        };
        updateVis();

        countEl.addEventListener('change', () => { s.colorCount = parseInt(countEl.value); updateVis(); });
        swatches.forEach((sw, i) => sw.inp.addEventListener('input', () => { s.manualColors[i] = sw.inp.value; }));

        const genBtn = mkEl('button', 'lc-gen-btn', 'Generate');
        genBtn.addEventListener('click', () => {
            const canvas = this._generateCanvas(s);
            if (!canvas) return;
            const img = new Image();
            img.onload = () => this.setLayerImage(layer, img);
            img.src = canvas.toDataURL();
        });

        const controls = mkEl('div', 'lc-controls');
        controls.append(widthField, styleField, cornerSec, countField);
        container.append(controls, genBtn);
    }
}
