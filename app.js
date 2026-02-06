let borderImage = null;
let backgroundImage = null;
let sourceImages = [];
let removeBackgroundLib = null;
let borderSourceImage = null;
let generatedBorderImage = null;
let generatedBackgroundImage = null;

const borderInput = document.getElementById('borderInput');
const borderInfo = document.getElementById('borderInfo');
const borderPreview = document.getElementById('borderPreview');
const borderPreviewImg = document.getElementById('borderPreviewImg');
const borderUpload = document.getElementById('borderUpload');
const borderGenerate = document.getElementById('borderGenerate');
const uploadSection = document.getElementById('uploadSection');
const generateSection = document.getElementById('generateSection');
const borderSourceInput = document.getElementById('borderSourceInput');
const borderSourceInfo = document.getElementById('borderSourceInfo');
const borderWidth = document.getElementById('borderWidth');
const borderWidthValue = document.getElementById('borderWidthValue');
const borderStyle = document.getElementById('borderStyle');
const colorCount = document.getElementById('colorCount');
const colorMode = document.getElementById('colorMode');
const manualColorSection = document.getElementById('manualColorSection');
const borderColor1 = document.getElementById('borderColor1');
const borderColor2 = document.getElementById('borderColor2');
const borderColor3 = document.getElementById('borderColor3');
const color2Container = document.getElementById('color2Container');
const color3Container = document.getElementById('color3Container');
const generateBorderButton = document.getElementById('generateBorderButton');
const generatedBorderPreview = document.getElementById('generatedBorderPreview');
const generatedBorderPreviewImg = document.getElementById('generatedBorderPreviewImg');
const backgroundUpload = document.getElementById('backgroundUpload');
const backgroundGenerate = document.getElementById('backgroundGenerate');
const backgroundUploadSection = document.getElementById('backgroundUploadSection');
const backgroundGenerateSection = document.getElementById('backgroundGenerateSection');
const backgroundStyle = document.getElementById('backgroundStyle');
const bgColorCount = document.getElementById('bgColorCount');
const bgColorMode = document.getElementById('bgColorMode');
const bgManualColorSection = document.getElementById('bgManualColorSection');
const bgColor1 = document.getElementById('bgColor1');
const bgColor2 = document.getElementById('bgColor2');
const bgColor3 = document.getElementById('bgColor3');
const bgColor2Container = document.getElementById('bgColor2Container');
const bgColor3Container = document.getElementById('bgColor3Container');
const generateBackgroundButton = document.getElementById('generateBackgroundButton');
const generatedBackgroundPreview = document.getElementById('generatedBackgroundPreview');
const generatedBackgroundPreviewImg = document.getElementById('generatedBackgroundPreviewImg');
const cycleBackgrounds = document.getElementById('cycleBackgrounds');
const enableSlicing = document.getElementById('enableSlicing');
const removeBackgroundCheckbox = document.getElementById('removeBackground');
const imagesInput = document.getElementById('imagesInput');
const imagesInfo = document.getElementById('imagesInfo');
const processButton = document.getElementById('processButton');
const status = document.getElementById('status');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const results = document.getElementById('results');
const imageGrid = document.getElementById('imageGrid');
const downloadAll = document.getElementById('downloadAll');
const downloadSaveAs = document.getElementById('downloadSaveAs');
const downloadIndividual = document.getElementById('downloadIndividual');

borderInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        borderInfo.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                borderImage = img;
                borderPreviewImg.src = event.target.result;
                borderPreview.classList.add('active');
                updateProcessButton();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Border mode switching
borderUpload.addEventListener('change', (e) => {
    if (e.target.checked) {
        uploadSection.style.display = 'block';
        generateSection.style.display = 'none';
        generatedBorderPreview.style.display = 'none';
        borderImage = generatedBorderImage = null;
        updateProcessButton();
    }
});

borderGenerate.addEventListener('change', (e) => {
    if (e.target.checked) {
        uploadSection.style.display = 'none';
        generateSection.style.display = 'block';
        borderPreview.style.display = 'none';
        borderImage = null;
        updateProcessButton();
    }
});

// Border source image upload
borderSourceInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        borderSourceInfo.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                borderSourceImage = img;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Border width slider
borderWidth.addEventListener('input', (e) => {
    borderWidthValue.textContent = e.target.value;
});

// Color count switching
colorCount.addEventListener('change', (e) => {
    const count = parseInt(e.target.value);
    color2Container.style.display = count >= 2 ? 'flex' : 'none';
    color3Container.style.display = count >= 3 ? 'flex' : 'none';
});

// Color mode switching
colorMode.addEventListener('change', (e) => {
    if (e.target.value === 'manual') {
        manualColorSection.style.display = 'block';
    } else {
        manualColorSection.style.display = 'none';
    }
});

// Generate border button
generateBorderButton.addEventListener('click', () => generateBorder());

backgroundInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        backgroundInfo.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                backgroundImage = img;
                backgroundPreviewImg.src = event.target.result;
                backgroundPreview.classList.add('active');
                updateProcessButton();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Background mode switching
backgroundUpload.addEventListener('change', (e) => {
    if (e.target.checked) {
        backgroundUploadSection.style.display = 'block';
        backgroundGenerateSection.style.display = 'none';
        generatedBackgroundPreview.style.display = 'none';
        backgroundImage = generatedBackgroundImage = null;
        updateProcessButton();
    }
});

backgroundGenerate.addEventListener('change', (e) => {
    if (e.target.checked) {
        backgroundUploadSection.style.display = 'none';
        backgroundGenerateSection.style.display = 'block';
        backgroundPreview.style.display = 'none';
        backgroundImage = null;
        updateProcessButton();
    }
});

// Background color mode switching
bgColorMode.addEventListener('change', (e) => {
    if (e.target.value === 'manual') {
        bgManualColorSection.style.display = 'block';
    } else {
        bgManualColorSection.style.display = 'none';
    }
});

// Background color count switching
bgColorCount.addEventListener('change', (e) => {
    const count = parseInt(e.target.value);
    bgColor2Container.style.display = count >= 2 ? 'flex' : 'none';
    bgColor3Container.style.display = count >= 3 ? 'flex' : 'none';
});

// Generate background button
generateBackgroundButton.addEventListener('click', generateBackground);

imagesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        sourceImages = sourceImages.concat(files);
        imagesInfo.textContent = `${sourceImages.length} file(s) total`;
        updateProcessButton();
    }
});

function updateProcessButton() {
    const hasBorder = borderImage || generatedBorderImage;
    const hasBackground = backgroundImage || generatedBackgroundImage;
    processButton.disabled = !(hasBorder && sourceImages.length > 0);
}

processButton.addEventListener('click', processImages);

// Generate simple border
function generateBorder() {
    const width = parseInt(borderWidth.value);
    const style = borderStyle.value;
    const mode = colorMode.value;
    const count = parseInt(colorCount.value);
    
    // Generate new seed each time
    const seed = generateSeed();
    const rng = createSeededRNG(seed);
    
    let colors = [];
    
    if (mode === 'manual') {
        colors = [
            hexToRgb(borderColor1.value),
            count >= 2 ? hexToRgb(borderColor2.value) : null,
            count >= 3 ? hexToRgb(borderColor3.value) : null
        ].filter(Boolean);
    } else if (mode === 'extract' && borderSourceImage) {
        colors = extractDominantColors(borderSourceImage, count);
    } else if (mode === 'random') {
        colors = generateComplementaryColors(count, rng);
    } else {
        colors = [[255, 255, 255]]; // Default white
    }
    
    // Create border canvas
    const borderCanvas = createSimpleBorder(colors, width, style, rng);
    
    // Convert to image
    const url = borderCanvas.toDataURL();
    const img = new Image();
    img.onload = () => {
        generatedBorderImage = img;
        generatedBorderPreviewImg.src = url;
        generatedBorderPreview.style.display = 'block';
        updateProcessButton();
    };
    img.src = url;
}

// Generate background
function generateBackground() {
    const style = backgroundStyle.value;
    const mode = bgColorMode.value;
    const count = parseInt(bgColorCount.value);
    
    // Generate new seed each time
    const seed = generateSeed();
    const rng = createSeededRNG(seed);
    
    let colors = [];
    
    if (mode === 'manual') {
        colors = [
            hexToRgb(bgColor1.value),
            count >= 2 ? hexToRgb(bgColor2.value) : null,
            count >= 3 ? hexToRgb(bgColor3.value) : null
        ].filter(Boolean);
    } else if (mode === 'extract' && borderSourceImage) {
        colors = extractDominantColors(borderSourceImage, count);
    } else if (mode === 'random') {
        colors = generateComplementaryColors(count, rng);
    } else {
        colors = [[26, 26, 46], [22, 33, 62], [15, 52, 96]]; // Default dark theme
    }
    
    // Create background canvas
    const backgroundCanvas = createBackgroundPattern(colors, style, rng);
    
    // Convert to image
    const url = backgroundCanvas.toDataURL();
    const img = new Image();
    img.onload = () => {
        generatedBackgroundImage = img;
        generatedBackgroundPreviewImg.src = url;
        generatedBackgroundPreview.style.display = 'block';
        updateProcessButton();
    };
    img.src = url;
}

// Generate high-quality seed
function generateSeed() {
    // Try crypto API first, fallback to timestamp
    try {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0].toString(36);
    } catch (e) {
        // Fallback to high-resolution timestamp
        return (Date.now() * 1000 + Math.random() * 1000).toString(36);
    }
}

// Create seeded random number generator
function createSeededRNG(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return function() {
        hash = (hash * 9301 + 49297) % 233280;
        return hash / 233280;
    };
}
// Extract dominant colors from image
function extractDominantColors(img, maxColors = 3) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 64, 64);
    
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;
    const colorMap = new Map();
    
    // Sample pixels and count colors
    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a > 128) {
            // Exclude black and grey colors
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max - min;
            
            // Skip if too dark or too grey (low saturation)
            if (max < 50 || saturation < 20) {
                continue;
            }
            
            // Group similar colors
            const color = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
            colorMap.set(color, (colorMap.get(color) || 0) + 1);
        }
    }
    
    // Get top colors up to maxColors
    const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxColors)
        .map(([color]) => color.split(',').map(Number));
    
    return sortedColors.length > 0 ? sortedColors : [[255, 255, 255]];
}

// Generate complementary colors using color theory rules
function generateComplementaryColors(count, rng = Math.random) {
    const colors = [];
    
    // Generate a random primary color
    const primaryHue = rng() * 360;
    const primarySaturation = 70 + rng() * 30; // 70-100%
    const primaryLightness = 40 + rng() * 30; // 40-70%
    
    colors.push(hslToRgb(primaryHue, primarySaturation, primaryLightness));
    
    if (count >= 2) {
        // Secondary: Complementary (180° opposite) or Triadic (120° apart)
        const useComplementary = rng() > 0.5;
        const secondaryHue = useComplementary ? 
            (primaryHue + 180) % 360 : 
            (primaryHue + 120) % 360;
        
        colors.push(hslToRgb(secondaryHue, primarySaturation, primaryLightness));
    }
    
    if (count >= 3) {
        // Tertiary: Either split complementary or another triadic color
        const tertiaryHue = colors.length === 2 ? 
            (primaryHue + 240) % 360 : // Third triadic color
            (primaryHue + 150 + rng() * 60) % 360; // Split complementary
        
        colors.push(hslToRgb(tertiaryHue, primarySaturation, primaryLightness));
    }
    
    return colors;
}

// Create simple border from colors
function createSimpleBorder(colors, width, style, rng = Math.random) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 64, 64);
    
    const color = colors[0] || [255, 255, 255];
    
    switch (style) {
        case 'solid':
            createSolidBorder(ctx, color, width);
            break;
        case 'dashed':
            createDashedBorder(ctx, color, width);
            break;
        case 'dotted':
            createDottedBorder(ctx, color, width);
            break;
        case 'checkerboard':
            createCheckerboardBorder(ctx, colors, width);
            break;
        case 'shadow':
            createShadowBorder(ctx, color, width);
            break;
        case 'multiring':
            createMultiRingBorder(ctx, colors, width);
            break;
        case 'dotdash':
            createDotDashBorder(ctx, colors, width);
            break;
        case 'axial':
            createPatternBorder(ctx, colors, width, 'axial', rng);
            break;
        case 'bitplane':
            createPatternBorder(ctx, colors, width, 'bitplane', rng);
            break;
        case 'constant':
            createPatternBorder(ctx, colors, width, 'constant', rng);
            break;
        case 'edge':
            createPatternBorder(ctx, colors, width, 'edge', rng);
            break;
        case 'manhattan':
            createPatternBorder(ctx, colors, width, 'manhattan', rng);
            break;
        case 'parity':
            createPatternBorder(ctx, colors, width, 'parity', rng);
            break;
        case 'prime':
            createPatternBorder(ctx, colors, width, 'prime', rng);
            break;
        case 'radial':
            createPatternBorder(ctx, colors, width, 'radial', rng);
            break;
        case 'sawtooth':
            createPatternBorder(ctx, colors, width, 'sawtooth', rng);
            break;
        case 'xor':
            createPatternBorder(ctx, colors, width, 'xor', rng);
            break;
    }
    
    return canvas;
}

function createSolidBorder(ctx, color, width) {
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
    
    // Draw border pixels with transparent interior
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < width; y++) {
            ctx.fillRect(x, y, 1, 1);
            ctx.fillRect(x, 64 - width + y, 1, 1);
        }
    }
    
    for (let y = width; y < 64 - width; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillRect(x, y, 1, 1);
            ctx.fillRect(64 - width + x, y, 1, 1);
        }
    }
}

function createDashedBorder(ctx, color, width) {
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
    const dashLength = 8;
    const gapLength = 4;
    
    // Top and bottom edges
    for (let x = 0; x < 64; x += dashLength + gapLength) {
        for (let y = 0; y < width; y++) {
            for (let dx = 0; dx < dashLength && x + dx < 64; dx++) {
                ctx.fillRect(x + dx, y, 1, 1);
                ctx.fillRect(x + dx, 64 - width + y, 1, 1);
            }
        }
    }
    
    // Left and right edges
    for (let y = width; y < 64 - width; y += dashLength + gapLength) {
        for (let x = 0; x < width; x++) {
            for (let dy = 0; dy < dashLength && y + dy < 64 - width; dy++) {
                ctx.fillRect(x, y + dy, 1, 1);
                ctx.fillRect(64 - width + x, y + dy, 1, 1);
            }
        }
    }
}

function createDottedBorder(ctx, color, width) {
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
    const spacing = 6;
    
    for (let x = spacing; x < 64 - spacing; x += spacing) {
        for (let y = 0; y < width; y++) {
            ctx.fillRect(x, y, width, width);
            ctx.fillRect(x, 64 - width - y, width, width);
        }
    }
    
    for (let y = spacing; y < 64 - spacing; y += spacing) {
        for (let x = 0; x < width; x++) {
            ctx.fillRect(x, y, width, width);
            ctx.fillRect(64 - width - x, y, width, width);
        }
    }
}

function createCheckerboardBorder(ctx, colors, width) {
    const color1 = colors[0] || [255, 255, 255];
    const color2 = colors[1] || [200, 200, 200];
    const squareSize = Math.max(2, Math.floor(width / 2));
    
    for (let x = 0; x < 64; x += squareSize) {
        for (let y = 0; y < 64; y += squareSize) {
            // Only draw on edges
            if (x < width || x >= 64 - width || y < width || y >= 64 - width) {
                const isEven = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0;
                ctx.fillStyle = isEven ? 
                    `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.8)` : 
                    `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.8)`;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    }
}

function createShadowBorder(ctx, color, width) {
    // Draw shadow first
    ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
    
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < width; y++) {
            ctx.fillRect(x + 2, y + 2, 1, 1);
            ctx.fillRect(x + 2, 64 - width + y + 2, 1, 1);
        }
    }
    
    for (let y = width; y < 64 - width; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillRect(x + 2, y + 2, 1, 1);
            ctx.fillRect(64 - width + x + 2, y + 2, 1, 1);
        }
    }
    
    // Draw main border on top
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
    
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < width; y++) {
            ctx.fillRect(x, y, 1, 1);
            ctx.fillRect(x, 64 - width + y, 1, 1);
        }
    }
    
    for (let y = width; y < 64 - width; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillRect(x, y, 1, 1);
            ctx.fillRect(64 - width + x, y, 1, 1);
        }
    }
}

function createMultiRingBorder(ctx, colors, width) {
    const color1 = colors[0] || [255, 255, 255];
    const color2 = colors[1] || [200, 200, 200];
    const color3 = colors[2] || [150, 150, 150];
    
    const ringColors = [color1, color2, color3];
    const ringsPerColor = Math.ceil(width / 3);
    
    for (let ring = 0; ring < width; ring++) {
        const colorIndex = Math.floor(ring / ringsPerColor) % ringColors.length;
        const color = ringColors[colorIndex];
        
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
        
        // Top and bottom edges
        for (let x = 0; x < 64; x++) {
            ctx.fillRect(x, ring, 1, 1);
            ctx.fillRect(x, 64 - width + ring, 1, 1);
        }
        
        // Left and right edges (excluding corners to avoid double-drawing)
        for (let y = ring + 1; y < 64 - width + ring; y++) {
            ctx.fillRect(ring, y, 1, 1);
            ctx.fillRect(64 - width + ring, y, 1, 1);
        }
    }
}

function createDotDashBorder(ctx, colors, width) {
    const color1 = colors[0] || [255, 255, 255];
    const color2 = colors[1] || [200, 200, 200];
    
    const dotLength = 3;
    const dashLength = 6;
    const gapLength = 3;
    const patternLength = dotLength + gapLength + dashLength + gapLength;
    
    // Top and bottom edges
    for (let x = 0; x < 64; x += patternLength) {
        for (let y = 0; y < width; y++) {
            // Dots
            for (let dx = 0; dx < dotLength && x + dx < 64; dx++) {
                ctx.fillStyle = `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.8)`;
                ctx.fillRect(x + dx, y, 1, 1);
                ctx.fillRect(x + dx, 64 - width + y, 1, 1);
            }
            
            // Dashes
            for (let dx = dotLength + gapLength; dx < dotLength + gapLength + dashLength && x + dx < 64; dx++) {
                ctx.fillStyle = `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.8)`;
                ctx.fillRect(x + dx, y, 1, 1);
                ctx.fillRect(x + dx, 64 - width + y, 1, 1);
            }
        }
    }
    
    // Left and right edges
    for (let y = width; y < 64 - width; y += patternLength) {
        for (let x = 0; x < width; x++) {
            // Dots
            for (let dy = 0; dy < dotLength && y + dy < 64 - width; dy++) {
                ctx.fillStyle = `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.8)`;
                ctx.fillRect(x, y + dy, 1, 1);
                ctx.fillRect(64 - width + x, y + dy, 1, 1);
            }
            
            // Dashes
            for (let dy = dotLength + gapLength; dy < dotLength + gapLength + dashLength && y + dy < 64 - width; dy++) {
                ctx.fillStyle = `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.8)`;
                ctx.fillRect(x, y + dy, 1, 1);
                ctx.fillRect(64 - width + x, y + dy, 1, 1);
            }
        }
    }
}

// Pattern-based border generation
function createPatternBorder(ctx, colors, width, patternType, rng = Math.random) {
    const numColors = colors.length;
    const cx = 31.5, cy = 31.5; // Center coordinates
    
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            // Border mask - only draw on border pixels
            if (!isBorderPixel(x, y, width)) continue;
            
            let colorIndex = 0;
            
            switch (patternType) {
                case 'constant':
                    colorIndex = 0;
                    break;
                    
                case 'axial':
                    // Randomly choose axis: horizontal, vertical, or diagonal
                    const axis = Math.floor(rng() * 3);
                    if (axis === 0) colorIndex = y % numColors; // Horizontal
                    else if (axis === 1) colorIndex = x % numColors; // Vertical
                    else colorIndex = (x + y) % numColors; // Diagonal
                    break;
                    
                case 'parity':
                    colorIndex = (x + y) % numColors;
                    break;
                    
                case 'xor':
                    colorIndex = (x ^ y) % numColors;
                    break;
                    
                case 'radial':
                    const dist = Math.floor(Math.sqrt((x - cx) ** 2 + (y - cy) ** 2));
                    colorIndex = dist % numColors;
                    break;
                    
                case 'manhattan':
                    const manhattanDist = Math.abs(x - cx) + Math.abs(y - cy);
                    colorIndex = manhattanDist % numColors;
                    break;
                    
                case 'edge':
                    const edgeDist = Math.min(x, y, 63 - x, 63 - y);
                    colorIndex = edgeDist % numColors;
                    break;
                    
                case 'sawtooth':
                    const u = Math.min(x, y, 63 - x, 63 - y);
                    colorIndex = (u + x + y) % numColors;
                    break;
                    
                case 'bitplane':
                    if (numColors === 2) {
                        const bitX = (x >> 1) & 1;
                        const bitY = (y >> 2) & 1;
                        colorIndex = bitX ^ bitY;
                    } else {
                        const bitX = x & 1;
                        const bitY = (y >> 1) & 1;
                        colorIndex = (bitX + 2 * bitY) % numColors;
                    }
                    break;
                    
                case 'prime':
                    const modX = x % 3;
                    const modY = y % 5;
                    colorIndex = (modX * modY) % numColors;
                    break;
            }
            
            const color = colors[colorIndex % colors.length];
            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

// Border mask function
function isBorderPixel(x, y, width) {
    return (x < width) || (x >= 64 - width) || (y < width) || (y >= 64 - width);
}

// Background pattern generation
function createBackgroundPattern(colors, patternType, rng = Math.random) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const numColors = colors.length;
    const cx = 31.5, cy = 31.5; // Center coordinates
    
    // Hash function for seeded noise
    const hash = (x, y, s) => {
        const val = Math.sin((x * 12.9898 + y * 78.233 + s * 37.719)) * 43758.5453;
        return val - Math.floor(val);
    };
    
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            // Normalized coordinates
            const nx = (x - cx) / 32;
            const ny = (y - cy) / 32;
            const r = Math.sqrt(nx * nx + ny * ny);
            const theta = Math.atan2(ny, nx);
            
            let colorIndex = 0;
            let v = 0;
            
            switch (patternType) {
                case 'bg1': // Cellular Soft Noise
                    v = hash(Math.floor(x / 8), Math.floor(y / 8), Math.floor(rng() * 1000)) / 4294967296;
                    colorIndex = Math.floor(v * numColors);
                    break;
                    
                case 'bg2': // Concentric Polygon Rings
                    const N = 3 + (Math.floor(rng() * 1000) % 6);
                    v = Math.abs(Math.cos(N * theta)) + r;
                    colorIndex = Math.floor(v * numColors) % numColors;
                    break;
                    
                case 'bg3': // Directional Drift Field
                    const A2 = 3 + Math.floor(rng() * 4);
                    const B2 = 3 + Math.floor(rng() * 4);
                    v = Math.sin(nx * A2 + ny * B2 + Math.floor(rng() * 1000));
                    if (numColors === 2) {
                        colorIndex = v > 0 ? 1 : 0;
                    } else {
                        colorIndex = Math.floor((v + 1) * 1.5) % numColors;
                    }
                    break;
                    
                case 'bg4': // Flow Noise Field
                    v = hash(x + hash(y, 0, Math.floor(rng() * 1000)) * 16,
                             y + hash(x, 0, Math.floor(rng() * 1000)) * 16,
                             Math.floor(rng() * 1000)) / 4294967296;
                    colorIndex = Math.floor(v * numColors);
                    break;
                    
                case 'bg5': // Galaxy Noise Hybrid
                    const k2 = 4 + (Math.floor(rng() * 1000) % 5);
                    v = Math.sin(theta * k2 + r * 6 + hash(x, y, Math.floor(rng() * 1000)) * 2);
                    if (numColors === 2) {
                        colorIndex = v > 0 ? 1 : 0;
                    } else {
                        colorIndex = Math.floor((v + 2) / 1.3) % numColors;
                    }
                    break;
                    
                case 'bg6': // Low-Frequency Wave Interference
                    const A = 3 + Math.floor(rng() * 4);
                    const B = 3 + Math.floor(rng() * 4);
                    v = Math.sin(nx * A + Math.floor(rng() * 1000)) + Math.cos(ny * B - Math.floor(rng() * 1000));
                    if (numColors === 2) {
                        colorIndex = v > 0 ? 1 : 0;
                    } else {
                        colorIndex = Math.floor((v + 2) / 1.5) % numColors;
                    }
                    break;
                    
                case 'bg7': // Soft Radial Falloff
                    v = r + hash(x, y, Math.floor(rng() * 1000)) * 0.08;
                    colorIndex = Math.floor(v * numColors) % numColors;
                    break;
                    
                case 'bg8': // Spiral Swirl Field
                    const k = 4 + (Math.floor(rng() * 1000) % 5);
                    v = theta + r * k;
                    colorIndex = Math.floor(v * numColors) % numColors;
                    break;
                    
                case 'bg9': // Starburst Harmonic
                    const n = 4 + (Math.floor(rng() * 1000) % 5);
                    v = Math.cos(n * theta);
                    if (numColors === 2) {
                        colorIndex = v > 0 ? 1 : 0;
                    } else {
                        colorIndex = Math.floor((v + 1) * 1.5) % numColors;
                    }
                    break;
                    
                case 'bg10': // Starfield Sparse Distribution
                    v = hash(x, y, Math.floor(rng() * 1000)) / 4294967296;
                    if (numColors === 2) {
                        colorIndex = v > 0.92 ? 1 : 0;
                    } else {
                        if (v > 0.97) colorIndex = 2;
                        else if (v > 0.92) colorIndex = 1;
                        else colorIndex = 0;
                    }
                    break;
            }
            
            const color = colors[colorIndex % colors.length];
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    return canvas;
}

// Color conversion utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [255, 255, 255];
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
        Math.round(255 * f(0)),
        Math.round(255 * f(8)),
        Math.round(255 * f(4))
    ];
}

// Dynamically import background removal library
async function loadBackgroundRemovalLib() {
    if (!removeBackgroundLib) {
        try {
            const module = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/browser.mjs');
            removeBackgroundLib = module;
            return true;
        } catch (error) {
            console.error('Failed to load background removal library:', error);
            return false;
        }
    }
    return true;
}

// Check if image has transparency
function hasTransparency(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
            return true;
        }
    }
    return false;
}

// Remove background from image
async function removeBackground(img, index, total) {
    if (hasTransparency(img)) {
        updateProgress(index, total, 'Skipped (already transparent)');
        return img;
    }
    
    updateProgress(index, total, 'Removing background...');
    
    try {
        const loaded = await loadBackgroundRemovalLib();
        if (!loaded) {
            throw new Error('Library not loaded');
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        
        const resultBlob = await removeBackgroundLib.removeBackground(blob, {
            progress: (key, current, total) => {
                const percent = Math.round((current / total) * 100);
                updateProgress(index, total, `Removing background... ${percent}%`);
            }
        });
        
        const url = URL.createObjectURL(resultBlob);
        const resultImg = new Image();
        await new Promise((resolve, reject) => {
            resultImg.onload = resolve;
            resultImg.onerror = reject;
            resultImg.src = url;
        });
        URL.revokeObjectURL(url);
        
        updateProgress(index, total, 'Background removed!');
        return resultImg;
    } catch (error) {
        console.error('Background removal failed:', error);
        updateProgress(index, total, 'Background removal failed');
        return img;
    }
}

function updateProgress(current, total, message) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.setProperty('--progress', `${percent}%`);
    progressText.textContent = `Processing image ${current}/${total}: ${message}`;
}

async function processImages() {
    if (!sourceImages.length) return;
    
    status.textContent = 'Processing images...';
    progressContainer.style.display = 'block';
    results.style.display = 'block';
    imageGrid.innerHTML = '';
    
    const total = sourceImages.length;
    let processed = 0;
    
    // Get background settings for cycling
    const shouldCycleBackgrounds = cycleBackgrounds.checked;
    const bgStyle = backgroundStyle.value;
    const bgMode = bgColorMode.value;
    const bgCount = parseInt(bgColorCount.value);
    
    for (let i = 0; i < sourceImages.length; i++) {
        const sourceImage = sourceImages[i];
        
        // Generate unique background for each image if cycling is enabled
        let currentBackgroundImage = backgroundImage;
        if (shouldCycleBackgrounds && generatedBackgroundImage) {
            const seed = generateSeed();
            const rng = createSeededRNG(seed);
            
            let colors = [];
            if (bgMode === 'manual') {
                colors = [
                    hexToRgb(bgColor1.value),
                    bgCount >= 2 ? hexToRgb(bgColor2.value) : null,
                    bgCount >= 3 ? hexToRgb(bgColor3.value) : null
                ].filter(Boolean);
            } else if (bgMode === 'random') {
                colors = generateComplementaryColors(bgCount, rng);
            } else {
                colors = [[26, 26, 46], [22, 33, 62], [15, 52, 96]];
            }
            
            const backgroundCanvas = createBackgroundPattern(colors, bgStyle, rng);
            const url = backgroundCanvas.toDataURL();
            currentBackgroundImage = new Image();
            currentBackgroundImage.src = url;
            await new Promise(resolve => {
                currentBackgroundImage.onload = resolve;
            });
        }
        
        // Process the image with current background
        const canvas = createProcessedImage(sourceImage, currentBackgroundImage);
        processedCanvases.push({
            canvas: canvas,
            filename: sourceImage.name,
            suffix: ''
        });
        
        // Add to UI
        const container = document.createElement('div');
        container.className = 'image-item';
        container.appendChild(canvas);
        
        const label = document.createElement('div');
        label.textContent = `Image ${i + 1}`;
        label.style.color = 'var(--text-secondary)';
        label.style.fontSize = '0.8em';
        label.style.marginTop = '5px';
        container.appendChild(label);
        
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.className = 'download-individual';
        downloadButton.onclick = () => {
            downloadCanvas(canvas, `processed_${sourceImage.name.replace(/\.[^/.]+$/, '')}.png`);
        };
        container.appendChild(downloadButton);
        
        imageGrid.appendChild(container);
        
        processed++;
        progressText.textContent = `Processed ${processed}/${total} images`;
        progressBar.style.width = `${(processed / total) * 100}%`;
    }
    
    status.textContent = 'Processing complete!';
    setTimeout(() => {
        progressContainer.style.display = 'none';
        status.textContent = '';
    }, 2000);
}

function loadImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function scaleImage(img, width, height) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const scaledImg = new Image();
        scaledImg.onload = () => resolve(scaledImg);
        scaledImg.src = canvas.toDataURL();
    });
}

function createProcessedImage(sourceImg, bgImage = null) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Use provided background or fall back to global background
    const backgroundToUse = bgImage || backgroundImage;
    if (backgroundToUse) {
        ctx.drawImage(backgroundToUse, 0, 0, 64, 64);
    }

    ctx.drawImage(sourceImg, 0, 0, 64, 64);

    const activeBorder = generatedBorderImage || borderImage;
    if (activeBorder) {
        ctx.drawImage(activeBorder, 0, 0, 64, 64);
    }

    return canvas;
}

function detectSlices(sourceImg) {
    const borderCanvas = document.createElement('canvas');
    borderCanvas.width = 64;
    borderCanvas.height = 64;
    const borderCtx = borderCanvas.getContext('2d');
    
    const activeBorder = generatedBorderImage || borderImage;
    if (!activeBorder) return [];
    
    borderCtx.drawImage(activeBorder, 0, 0, 64, 64);
    const borderData = borderCtx.getImageData(0, 0, 64, 64);

    const foregroundCanvas = document.createElement('canvas');
    foregroundCanvas.width = 64;
    foregroundCanvas.height = 64;
    const foregroundCtx = foregroundCanvas.getContext('2d');
    foregroundCtx.drawImage(sourceImg, 0, 0, 64, 64);
    const foregroundData = foregroundCtx.getImageData(0, 0, 64, 64);

    const overlapMap = new Uint8Array(64 * 64);
    for (let i = 0; i < borderData.data.length; i += 4) {
        const pixelIndex = i / 4;
        const borderAlpha = borderData.data[i + 3];
        const foregroundAlpha = foregroundData.data[i + 3];
        
        overlapMap[pixelIndex] = (borderAlpha > 10 && foregroundAlpha > 200) ? 1 : 0;
    }

    const visited = new Uint8Array(64 * 64);
    const slices = [];
    
    const MIN_SLICE_SIZE = 3;

    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const index = y * 64 + x;
            if (overlapMap[index] === 1 && visited[index] === 0) {
                const slicePixels = new Set();
                const queue = [[x, y]];
                
                while (queue.length > 0) {
                    const [cx, cy] = queue.shift();
                    const ci = cy * 64 + cx;
                    
                    if (cx < 0 || cx >= 64 || cy < 0 || cy >= 64) continue;
                    if (visited[ci] === 1) continue;
                    if (overlapMap[ci] === 0) continue;
                    
                    visited[ci] = 1;
                    slicePixels.add(ci);
                    
                    queue.push([cx + 1, cy]);
                    queue.push([cx - 1, cy]);
                    queue.push([cx, cy + 1]);
                    queue.push([cx, cy - 1]);
                }
                
                const size = slicePixels.size;
                if (size >= MIN_SLICE_SIZE) {
                    slices.push(slicePixels);
                }
            }
        }
    }

    slices.sort((a, b) => a.size - b.size);
    return slices;
}

function createSlicedImage(sourceImg, mode, slices, sliceIndex = -1) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, 64, 64);
    }

    ctx.drawImage(sourceImg, 0, 0, 64, 64);

    const activeBorder = generatedBorderImage || borderImage;
    if (activeBorder) {
        ctx.drawImage(activeBorder, 0, 0, 64, 64);
    }

    if (mode === 'single-front' && sliceIndex >= 0 && sliceIndex < slices.length) {
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = 64;
        sliceCanvas.height = 64;
        const sliceCtx = sliceCanvas.getContext('2d');
        
        const foregroundCanvas = document.createElement('canvas');
        foregroundCanvas.width = 64;
        foregroundCanvas.height = 64;
        const foregroundCtx = foregroundCanvas.getContext('2d');
        foregroundCtx.drawImage(sourceImg, 0, 0, 64, 64);
        const foregroundData = foregroundCtx.getImageData(0, 0, 64, 64);
        
        const sliceData = sliceCtx.createImageData(64, 64);
        const selectedSlice = slices[sliceIndex];
        
        for (let i = 0; i < foregroundData.data.length; i += 4) {
            const pixelIndex = i / 4;
            if (selectedSlice.has(pixelIndex)) {
                sliceData.data[i] = foregroundData.data[i];
                sliceData.data[i + 1] = foregroundData.data[i + 1];
                sliceData.data[i + 2] = foregroundData.data[i + 2];
                sliceData.data[i + 3] = foregroundData.data[i + 3];
            }
        }
        
        sliceCtx.putImageData(sliceData, 0, 0);
        ctx.drawImage(sliceCanvas, 0, 0);
    }

    return canvas;
}

function downloadCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    });
}

async function downloadAllAsZip(processedCanvases, saveAs = false) {
    const zip = new JSZip();
    const folder = zip.folder('bordered_images');

    const groupedImages = {};
    processedCanvases.forEach((item, index) => {
        const baseName = item.filename.replace(/\.[^/.]+$/, '');
        if (!groupedImages[baseName]) {
            groupedImages[baseName] = [];
        }
        groupedImages[baseName].push({
            ...item,
            globalIndex: index
        });
    });
    
    let globalCounter = 1;
    
    for (const [baseName, images] of Object.entries(groupedImages)) {
        for (let i = 0; i < images.length; i++) {
            const item = images[i];
            
            let layerIndex = 0;
            if (item.suffix && item.suffix.includes('_front')) {
                const sliceMatch = item.suffix.match(/slice(\d+)_front/);
                if (sliceMatch) {
                    layerIndex = parseInt(sliceMatch[1]);
                }
            }
            
            const foregroundNum = String(globalCounter).padStart(3, '0');
            const layerNum = String(layerIndex).padStart(3, '0');
            const filename = `Badge${foregroundNum}-${layerNum}.png`;
            
            const blob = await new Promise(resolve => {
                item.canvas.toBlob(resolve);
            });
            folder.file(filename, blob);
        }
        globalCounter++;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    
    if (saveAs) {
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'bordered_images.zip',
                    types: [{
                        description: 'ZIP files',
                        accept: { 'application/zip': ['.zip'] }
                    }]
                });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                return;
            } catch (err) {
                console.log('Save As cancelled or not supported, using regular download');
            }
        }
    }
    
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bordered_images.zip';
    a.click();
    URL.revokeObjectURL(url);
}

async function downloadAllIndividually(processedCanvases) {
    status.textContent = 'Downloading images individually...';
    status.classList.add('active');
    
    const groupedImages = {};
    processedCanvases.forEach((item, index) => {
        const baseName = item.filename.replace(/\.[^/.]+$/, '');
        if (!groupedImages[baseName]) {
            groupedImages[baseName] = [];
        }
        groupedImages[baseName].push({
            ...item,
            globalIndex: index
        });
    });
    
    let globalCounter = 1;
    
    for (const [baseName, images] of Object.entries(groupedImages)) {
        for (let i = 0; i < images.length; i++) {
            const item = images[i];
            
            let layerIndex = 0;
            if (item.suffix && item.suffix.includes('_front')) {
                const sliceMatch = item.suffix.match(/slice(\d+)_front/);
                if (sliceMatch) {
                    layerIndex = parseInt(sliceMatch[1]);
                }
            }
            
            const foregroundNum = String(globalCounter).padStart(3, '0');
            const layerNum = String(layerIndex).padStart(3, '0');
            const filename = `Badge${foregroundNum}-${layerNum}.png`;
            
            downloadCanvas(item.canvas, filename);
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        globalCounter++;
    }
    
    status.textContent = `Downloaded ${processedCanvases.length} image(s) individually!`;
    
    setTimeout(() => {
        status.classList.remove('active');
    }, 3000);
}
