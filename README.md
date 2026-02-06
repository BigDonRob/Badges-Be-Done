# Badges-Be-Done!

A simple web tool for making layered 64×64 badges.
Upload images or generate borders and backgrounds using math-based patterns.
Then export finished badges or layered variants.

---

## What It Does

You can:

* Upload foreground art (characters, items, screenshots, etc.)
* Upload or generate borders
* Upload or generate backgrounds
* Automatically cut out small “breakout” pieces where art overlaps the border
* Batch process multiple images
* Download everything as PNGs or ZIP

Everything runs locally in your browser.

---

## Borders

You can either upload a border image or generate one.

Border width can be **2–5 pixels**, leaving a center area of:

* 60×60 interior (2px border)
* 54×54 interior (5px border)

### Basic Border Styles

* Solid
* Dashed
* Dotted
* Checkerboard
* Drop shadow
* Multi-color rings
* Dot + dash mix

### Math Pattern Borders

These generate repeating patterns using coordinate math:

* Axial stripes
* Bitplane slice patterns
* Constant stroke
* Edge gradient bands
* Manhattan distance (diamond rings)
* Parity / checker variants
* Prime modulation
* Radial ring distance
* Sawtooth edge marching
* XOR interference noise

---

## Colors

You can use **1–3 colors**.

Color options:

* Pick manually
* Extract from uploaded image (tries to avoid greys/blacks)
* Random palette generation

---

## Backgrounds

You can upload a background image or generate one.

Generated backgrounds are low-detail on purpose so foreground art stays readable.

### Background Pattern Types

* Cellular soft noise
* Concentric polygon rings
* Directional drift flow
* Organic flow noise
* Galaxy swirl noise
* Low-frequency wave interference
* Soft radial falloff
* Spiral swirl
* Starburst harmonic
* Sparse starfield

Optional:

* Cycle variations automatically when batch processing
* Use same colors or generate new ones per image

---

## Slicing (Breakout Layers)

This finds places where foreground art overlaps the border and lets you export versions where those pieces sit on top of the border.

Good for:

* Weapon tips
* Hair strands
* Cloth edges
* Small detail overlaps

### How It Works

* Image is scaled to 64×64
* Finds pixels where border and foreground both exist
* Groups connected pixels into regions
* Removes tiny noise (<3 pixels)
* Keeps all real overlaps (3px or larger)

Each region becomes an optional extra layer.

---

## Background Removal (Optional)

For screenshots or images with solid backgrounds:

* Detects if transparency already exists and skips if so
* Uses AI segmentation to remove background
* Runs locally
* Usually ~1 second per image after model loads

---

## Typical Uses

**Quick Badge**

* Generate border
* Add foreground
* Export

**Full Generated Badge**

* Generate border
* Generate background
* Add foreground
* Export

**Screenshot Cleanup Pipeline**

* Generate border
* Generate background
* Remove screenshot background
* Slice overlaps
* Export variants

---

## Output Files

Example naming:

```
Badge001-000.png  ← Base badge
Badge001-001.png  ← Breakout layer 1
Badge001-002.png  ← Breakout layer 2
```

---

## Technical Notes (Light Version)

* Output size: 64×64
* Processing: Browser only (no uploads to servers)
* Border math uses global coordinates (0–63)
* Backgrounds support seeded variation
* Works with most browser image formats
* Save-As works best in Chrome / Edge (fallback download exists)

---

## License

Open source.
Use it, modify it, break it, improve it.
