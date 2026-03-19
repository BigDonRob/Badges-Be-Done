# Badges-Be-Done

Procedural badge compositing, batch-ready.

A browser-based tool for compositing 64×64 PNG badges from layered backgrounds, borders, and midground subject images. Runs entirely client-side — no server, no uploads.

---

## How It Works

Images are composited through four ordered layer groups, bottom to top:

```
[4] Overlay         always on top; excluded from slice detection
[3] Border          frame/border; overlapping midground can be promoted above border
[2] Midground       your subject (character, icon, sprite)
[1] Background      bottom of the stack
```

Each group compiles its layers in order before the groups are merged. The final output is a 64×64 PNG per subject image.

---

## Layer Groups

### 1 — Background

Sits beneath everything. Supports uploaded images or procedurally generated patterns.

**Generated pattern styles:**
- *Noise & Organic:* Cellular Soft Noise, Flow Noise Field, Galaxy Noise Hybrid, Soft Radial Falloff
- *Wave & Angular:* Concentric Polygon Rings, Directional Drift Field, Low-Frequency Wave Interference, Spiral Swirl Field, Starburst Harmonic
- *Geometric:* Pixel Grid, Diagonal Stripes, Dot Grid
- *Sparse:* Starfield Sparse Distribution

**Cycle Backgrounds:** When enabled, each subject image in a batch gets independently re-seeded background layers rather than sharing a single compiled background. Useful for producing a varied set from one batch run.

### 2 — Midground (Subject Images)

Four drop zones accept one or more images. Zones differ by fit mode and whether slice detection is enabled:

| Zone | Fit | Slice detection |
|------|-----|-----------------|
| Resize & Slice | Stretch to fill 64×64 | On |
| Center & Slice | Scale-to-fit, centered, no upscale | On |
| Resize | Stretch to fill 64×64 | Off |
| Center | Scale-to-fit, centered, no upscale | Off |

Files can be dragged directly onto a zone or selected via the file picker. All four zones can be used simultaneously in a single batch.

### 3 — Border / Interaction

Sits above the midground in the base composite, but pixels from this layer that overlap the subject can optionally be moved behind the subject via slice detection (see below).

**Generated border styles:**
- *Classic:* Solid, Dashed, Dotted, Dot-Dash, Drop Shadow, Checkerboard, Multi-Color Rings
- *Math Pattern:* Axial Stripe, Bitplane Slice, Constant Field, Edge Gradient Band, Manhattan Distance, Parity Field, Prime Modulation, Ring Distance Field, Sawtooth Edge, XOR Interference
- *Pixel Art:* Corner Brackets, Chamfered Corners, Corner Rivets, Open Corners, Corner Pips, Double Rule, Cross-Stitch, Zigzag Teeth, Brick Course

Corner-configurable pixel art styles (Brackets, Chamfer, Rivet, Open, Pips) let you independently toggle each of the four corners on or off.

### 4 — Overlay

Applied after all slicing operations. Always the topmost layer. Not used for overlap detection. Suitable for gloss effects, vignettes, or top-layer icons.

---

## Layer Controls

Every layer in every group exposes:

**Type toggle** — Switch between *Upload* (load any PNG/JPG) and *Generate* (procedural pattern).

**Alpha slider** — 0–100% opacity applied at composite time. The source image is never modified; alpha is applied during each recompile, so adjusting the slider is non-destructive and reversible.

**Collapse / Remove** — Layers can be collapsed to save space or removed entirely.

Multiple layers per group composite in order, bottom to top within the group.

---

## Color Reference & Palette System

Load an optional reference image to extract up to three dominant colors from it (greys, near-blacks, and near-whites are filtered out). Three palettes are derived from those colors:

| Button | Palette |
|--------|---------|
| 1 | Extracted colors as-is |
| 2 | Cool-shifted (hue rotated toward blue/cyan, slightly desaturated) |
| 3 | Warm-shifted (hue rotated toward red/orange, saturation boosted) |

Clicking a palette button on any generate layer copies those colors into its swatches instantly. Palette buttons are available on both background and border generate layers.

Palette data is serialised into session files, so buttons remain functional after a session is restored even without reloading the original reference image.

---

## Slice Detection

For subjects in the two "slice on" drop zones, the tool detects connected pixel regions where the subject overlaps the compiled border layer using a BFS flood-fill. These regions — "slices" — are presented before processing in a modal showing a live preview with colored overlays.

For each detected slice you can:
- **Check** — promote that region above the border in the final output (the subject appears *in front of* the frame in that area)
- **Uncheck** — leave it composited beneath the border as normal

The modal supports keyboard navigation (← → to move between images, Enter to confirm all, Esc to cancel).

When slicing is used, two images are produced per subject:
- `_base` — standard composite, no promotion
- `_slices_front` — with checked regions promoted above the border

---

## Session Save / Load

The full state of all three layer stacks can be saved to a `.json` file and restored later.

**What is saved:**
- All layer types, settings, and ordering for all three stacks
- Uploaded layer images (stored as indexed palette data; PNG data-URL fallback for images with more than 255 unique colors)
- Generated layer settings (layers are re-generated on restore rather than storing pixel data)
- Cycle Backgrounds toggle state
- Extracted color palettes (if a reference image was loaded)

Session files are versioned. The current format is v2.

---

## Processing & Export

Click **Process Images** once at least one border layer has an image and at least one midground image is queued. A progress indicator tracks the batch.

Results appear in a grid with individual **Download** buttons per image.

Bulk export options:

| Button | Behavior |
|--------|----------|
| Download All as ZIP | Packages all output PNGs plus compiled layer snapshots into a ZIP |
| Save As ZIP | Same, but uses the File System Access API for a Save dialog where supported |
| Download All (Individual) | Sequential per-file downloads named `Badge001-000.png` (badge index + slice layer index) |

---

## File Structure

| File | Purpose |
|------|---------|
| `app.js` | Entry point, event wiring, stack preview rendering |
| `state.js` | Shared mutable state (source images, processed canvases, color reference) |
| `stacks.js` | Instantiates the three `LayerStack` singletons |
| `layers.js` | `LayerStack` class — layer CRUD, card UI, compilation, alpha handling |
| `backgrounds.js` | 13 procedural background pattern generators |
| `borders.js` | 19 border style renderers |
| `colors.js` | Color utilities — extraction, HSL/RGB conversion, palette generation |
| `imageUtils.js` | `loadImage` (File → HTMLImageElement), `drawSourceOnCanvas` (resize/center modes) |
| `slicing.js` | BFS slice detection, slice selection modal |
| `processing.js` | Compositing pipeline — standard and sliced composite functions, batch loop |
| `download.js` | ZIP generation, individual download, canvas-to-blob helpers |
| `dropzones.js` | Drag-and-drop and file input wiring for the four midground zones |
| `save.js` | Session serialisation (indexed palette encoding) and restore |
| `constants.js` | Style group definitions, corner hint strings, slice color arrays |
| `index.html` | Single-page markup |
| `styles.css` | Dark theme and component styles |

---

## Browser Requirements

No installation required. Open `index.html` in a modern browser.

- Standard Canvas 2D API (`getContext('2d')`, `getImageData`)
- `FileReader`, `Blob`, `URL.createObjectURL` for file I/O
- `crypto.getRandomValues` for seed generation (falls back to `Date.now` if unavailable)
- `showSaveFilePicker` for Save As ZIP (optional — falls back to automatic download)
- JSZip loaded from CDN (`cdnjs.cloudflare.com`)
