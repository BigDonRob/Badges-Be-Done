export function generateSeed() {
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0].toString(36); }
    catch { return (Date.now() * 1000 + Math.random() * 1000).toString(36); }
}

export function createSeededRNG(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
    return () => { h = (h * 9301 + 49297) % 233280; return h / 233280; };
}

export function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : [255,255,255];
}

export function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

export function extractDominantColors(img, maxColors = 3) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
    const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    
    // Count color frequencies across entire image
    const colorMap = new Map();
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a > 64) { // Only include non-transparent pixels
            // Filter out blacks, greys, and whites
            if (isNeutralColor(r, g, b)) continue;
            
            // Group by hue buckets (primary/secondary colors)
            const hue = getHue(r, g, b);
            const bucket = getHueBucket(hue);
            const key = `${bucket},${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
    }
    
    // Sort by frequency and get top colors — skip index 0 (hue bucket string)
    let sorted = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxColors)
        .map(([k]) => {
            const parts = k.split(',');
            return [Number(parts[1]), Number(parts[2]), Number(parts[3])];
        });
    
    // If we couldn't extract enough colors, use defaults
    if (sorted.length < maxColors) {
        const defaults = [
            [100, 100, 120], // Gray-blue
            [200, 150, 100], // Tan
            [150, 200, 150]  // Mint green
        ];
        while (sorted.length < maxColors) {
            sorted.push(defaults[sorted.length]);
        }
    }
    
    return sorted;
}

function isNeutralColor(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    // Saturation in HSV space — guard against max=0
    const saturation = max > 0 ? diff / max : 0;

    // Filter very dark pixels (near-black)
    const brightness = (r + g + b) / 3;

    // Filter very light pixels (near-white)
    const isVeryLight = max > 220 && min > 190;

    // Filter low-saturation (grey) pixels
    return saturation < 0.20 || brightness < 25 || isVeryLight;
}

function getHue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    if (delta === 0) return 0;
    
    let hue;
    if (max === r) {
        hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
        hue = ((b - r) / delta + (b < r ? 2 : 0)) * 60;
    } else {
        hue = ((r - g) / delta + (r < g ? 4 : 0)) * 60;
    }
    
    return hue < 0 ? hue + 360 : hue;
}

function getHueBucket(hue) {
    if (hue >= 0 && hue < 30) return 'red';
    if (hue >= 30 && hue < 60) return 'orange';
    if (hue >= 60 && hue < 120) return 'yellow';
    if (hue >= 120 && hue < 180) return 'green';
    if (hue >= 180 && hue < 240) return 'cyan';
    if (hue >= 240 && hue < 300) return 'blue';
    if (hue >= 300 && hue < 360) return 'purple';
    return 'red'; // fallback
}

export function generateComplementaryPalette(baseColors, type = 'cool') {
    return baseColors.map(color => {
        const [r, g, b] = color;
        const hsl = rgbToHsl(r, g, b);

        if (type === 'cool') {
            // Cool bias: nudge hue toward blue/cyan (+30°), desaturate slightly, lighten a touch
            const newHue   = (hsl[0] + 30) % 360;
            const newSat   = Math.max(35, hsl[1] * 0.85);
            const newLight = Math.min(72, hsl[2] * 1.15 + 5);
            return hslToRgb(newHue, newSat, newLight);
        } else if (type === 'warm') {
            // Warm bias: nudge hue toward red/orange (−30°), boost saturation, deepen slightly
            const newHue   = (hsl[0] - 30 + 360) % 360;
            const newSat   = Math.min(95, hsl[1] * 1.3 + 10);
            const newLight = Math.max(30, hsl[2] * 0.92);
            return hslToRgb(newHue, newSat, newLight);
        } else {
            return color;
        }
    });
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
            case g: h = ((b - r) / d + (b < r ? 2 : 0)) * 60; break;
            case b: h = ((r - g) / d + (r < g ? 4 : 0)) * 60; break;
        }
    }
    return [h, s * 100, l * 100];
}

export function generateComplementaryColors(count, rng = Math.random) {
    const h = rng() * 360, s = 70 + rng() * 30, l = 40 + rng() * 30;
    const colors = [hslToRgb(h, s, l)];
    if (count >= 2) colors.push(hslToRgb((h + (rng() > 0.5 ? 180 : 120)) % 360, s, l));
    if (count >= 3) colors.push(hslToRgb((h + 240) % 360, s, l));
    return colors;
}
