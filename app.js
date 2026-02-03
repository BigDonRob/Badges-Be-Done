let borderImage = null;
let backgroundImage = null;
let sourceImages = [];

const borderInput = document.getElementById('borderInput');
const borderInfo = document.getElementById('borderInfo');
const borderPreview = document.getElementById('borderPreview');
const borderPreviewImg = document.getElementById('borderPreviewImg');
const backgroundInput = document.getElementById('backgroundInput');
const backgroundInfo = document.getElementById('backgroundInfo');
const backgroundPreview = document.getElementById('backgroundPreview');
const backgroundPreviewImg = document.getElementById('backgroundPreviewImg');
const enableSlicing = document.getElementById('enableSlicing');
const imagesInput = document.getElementById('imagesInput');
const imagesInfo = document.getElementById('imagesInfo');
const processButton = document.getElementById('processButton');
const status = document.getElementById('status');
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

imagesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        sourceImages = sourceImages.concat(files);
        imagesInfo.textContent = `${sourceImages.length} file(s) total`;
        updateProcessButton();
    }
});

function updateProcessButton() {
    processButton.disabled = !(borderImage && sourceImages.length > 0);
}

processButton.addEventListener('click', processImages);

async function processImages() {
    imageGrid.innerHTML = '';
    results.classList.remove('active');
    status.textContent = 'Processing images...';
    status.classList.add('active');

    const processedCanvases = [];
    const useSlicing = enableSlicing.checked;

    for (let i = 0; i < sourceImages.length; i++) {
        const file = sourceImages[i];
        const img = await loadImage(file);
        
        if (useSlicing) {
            // Detect all separate slice regions
            const slices = detectSlices(img);
            
            // Generate "all behind" version
            const allBehindCanvas = createSlicedImage(img, 'all-behind', slices);
            processedCanvases.push({
                canvas: allBehindCanvas,
                filename: file.name,
                suffix: '_all_behind'
            });

            const container0 = document.createElement('div');
            container0.className = 'image-item';
            container0.appendChild(allBehindCanvas);
            const label0 = document.createElement('div');
            label0.textContent = 'Border Top';
            label0.style.color = 'var(--text-secondary)';
            label0.style.fontSize = '0.8em';
            label0.style.marginTop = '5px';
            container0.appendChild(label0);
            
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download';
            downloadButton.className = 'download-individual';
            downloadButton.onclick = () => {
                downloadCanvas(allBehindCanvas, `processed_${file.name.replace(/\.[^/.]+$/, '')}_all_behind.png`);
            };
            container0.appendChild(downloadButton);

            const downloadAllButton = document.createElement('button');
            downloadAllButton.textContent = 'Download All as ZIP';
            downloadAllButton.className = 'download-all';
            downloadAllButton.style.marginLeft = '10px';
            downloadAll.onclick = () => downloadAllAsZip(processedCanvases);
            downloadIndividual.onclick = () => downloadAllIndividually(processedCanvases);
            container0.appendChild(downloadAllButton);

            imageGrid.appendChild(container0);

            // Generate one image for each slice being in front
            for (let sliceIdx = 0; sliceIdx < slices.length; sliceIdx++) {
                const sliceCanvas = createSlicedImage(img, 'single-front', slices, sliceIdx);
                processedCanvases.push({
                    canvas: sliceCanvas,
                    filename: file.name,
                    suffix: `_slice${sliceIdx + 1}_front`
                });

                const container = document.createElement('div');
                container.className = 'image-item';
                container.appendChild(sliceCanvas);
                const label = document.createElement('div');
                label.textContent = `Layer ${sliceIdx + 1}`;
                label.style.color = 'var(--text-secondary)';
                label.style.fontSize = '0.8em';
                label.style.marginTop = '5px';
                container.appendChild(label);
                
                sliceCanvas.addEventListener('click', () => {
                    downloadCanvas(sliceCanvas, `processed_${file.name.replace(/\.[^/.]+$/, '')}_slice${sliceIdx + 1}_front.png`);
                });
                imageGrid.appendChild(container);
            }
        } else {
            // Standard processing
            const canvas = createProcessedImage(img);
            processedCanvases.push({
                canvas: canvas,
                filename: file.name,
                suffix: ''
            });

            const container = document.createElement('div');
            container.className = 'image-item';
            container.appendChild(canvas);
            
            canvas.addEventListener('click', () => {
                downloadCanvas(canvas, `processed_${file.name}`);
            });

            imageGrid.appendChild(container);
        }
    }

    const totalImages = processedCanvases.length;
    status.textContent = `Successfully processed ${totalImages} image(s)!`;
    results.classList.add('active');

    downloadAll.onclick = () => downloadAllAsZip(processedCanvases);
    downloadSaveAs.onclick = () => downloadAllAsZip(processedCanvases, true);
    downloadIndividual.onclick = () => downloadAllIndividually(processedCanvases);
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

function createProcessedImage(sourceImg) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw background if available (static, always behind everything)
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, 64, 64);
    }

    // Draw resized source image (foreground)
    ctx.drawImage(sourceImg, 0, 0, 64, 64);

    // Draw border overlay (static)
    ctx.drawImage(borderImage, 0, 0, 64, 64);

    return canvas;
}

function detectSlices(sourceImg) {
    // Create temporary canvases for analysis
    const borderCanvas = document.createElement('canvas');
    borderCanvas.width = 64;
    borderCanvas.height = 64;
    const borderCtx = borderCanvas.getContext('2d');
    borderCtx.drawImage(borderImage, 0, 0, 64, 64);
    const borderData = borderCtx.getImageData(0, 0, 64, 64);

    const foregroundCanvas = document.createElement('canvas');
    foregroundCanvas.width = 64;
    foregroundCanvas.height = 64;
    const foregroundCtx = foregroundCanvas.getContext('2d');
    foregroundCtx.drawImage(sourceImg, 0, 0, 64, 64);
    const foregroundData = foregroundCtx.getImageData(0, 0, 64, 64);

    // Create a binary map of overlap pixels
    const overlapMap = new Uint8Array(64 * 64);
    for (let i = 0; i < borderData.data.length; i += 4) {
        const pixelIndex = i / 4;
        const borderAlpha = borderData.data[i + 3];
        const foregroundAlpha = foregroundData.data[i + 3];
        overlapMap[pixelIndex] = (borderAlpha > 10 && foregroundAlpha > 10) ? 1 : 0;
    }

    // Flood fill to find contiguous regions
    const visited = new Uint8Array(64 * 64);
    const slices = [];

    for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
            const index = y * 64 + x;
            if (overlapMap[index] === 1 && visited[index] === 0) {
                // Found a new slice region - flood fill it
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
                    
                    // Check 4-connected neighbors
                    queue.push([cx + 1, cy]);
                    queue.push([cx - 1, cy]);
                    queue.push([cx, cy + 1]);
                    queue.push([cx, cy - 1]);
                }
                
                if (slicePixels.size > 0) {
                    slices.push(slicePixels);
                }
            }
        }
    }

    return slices;
}

function createSlicedImage(sourceImg, mode, slices, sliceIndex = -1) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Layer 1: Background (always at bottom)
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, 64, 64);
    }

    // Layer 2: Complete foreground (always drawn)
    ctx.drawImage(sourceImg, 0, 0, 64, 64);

    // Layer 3: Border (always drawn)
    ctx.drawImage(borderImage, 0, 0, 64, 64);

    // Layer 4: Additional slice on top (only for single-front mode)
    if (mode === 'single-front' && sliceIndex >= 0 && sliceIndex < slices.length) {
        // Create a canvas for just the selected slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = 64;
        sliceCanvas.height = 64;
        const sliceCtx = sliceCanvas.getContext('2d');
        
        // Get foreground data to extract the slice
        const foregroundCanvas = document.createElement('canvas');
        foregroundCanvas.width = 64;
        foregroundCanvas.height = 64;
        const foregroundCtx = foregroundCanvas.getContext('2d');
        foregroundCtx.drawImage(sourceImg, 0, 0, 64, 64);
        const foregroundData = foregroundCtx.getImageData(0, 0, 64, 64);
        
        // Create slice data (only pixels in the selected slice)
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
        
        // Draw the slice on top of everything
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

    // Group by original filename to get proper indexing
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
            
            // Determine layer index based on proper layering:
            // Background (bottom) → Foreground → Border (000) → Slices (001, 002, ...)
            let layerIndex = 0;
            if (item.suffix && item.suffix.includes('_front')) {
                // Slices are on top, start from index 1
                const sliceMatch = item.suffix.match(/slice(\d+)_front/);
                if (sliceMatch) {
                    layerIndex = parseInt(sliceMatch[1]); // Slice 1 = 001, Slice 2 = 002, etc.
                }
            }
            // If no suffix or _all_behind, this is the border layer (000)
            
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
        // Use File System Access API if available (modern browsers)
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
                // User cancelled or API not available, fall back to regular download
                console.log('Save As cancelled or not supported, using regular download');
            }
        }
    }
    
    // Regular download fallback
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
    
    // Group by original filename to get proper indexing
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
            
            // Determine layer index based on proper layering:
            // Background (bottom) → Foreground → Border (000) → Slices (001, 002, ...)
            let layerIndex = 0;
            if (item.suffix && item.suffix.includes('_front')) {
                // Slices are on top, start from index 1
                const sliceMatch = item.suffix.match(/slice(\d+)_front/);
                if (sliceMatch) {
                    layerIndex = parseInt(sliceMatch[1]); // Slice 1 = 001, Slice 2 = 002, etc.
                }
            }
            // If no suffix or _all_behind, this is the border layer (000)
            
            const foregroundNum = String(globalCounter).padStart(3, '0');
            const layerNum = String(layerIndex).padStart(3, '0');
            const filename = `Badge${foregroundNum}-${layerNum}.png`;
            
            downloadCanvas(item.canvas, filename);
            
            // Small delay between downloads to prevent browser blocking
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        globalCounter++;
    }
    
    status.textContent = `Downloaded ${processedCanvases.length} image(s) individually!`;
    
    // Clear status after 3 seconds
    setTimeout(() => {
        status.classList.remove('active');
    }, 3000);
}
