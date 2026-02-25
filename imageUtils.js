/**
 * Load a File object into an HTMLImageElement.
 */
export function loadImage(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Draw a source image onto a canvas context.
 *   mode='resize' → stretch to fill canvasW × canvasH
 *   mode='center' → scale DOWN only if needed (maintain aspect), then center
 */
export function drawSourceOnCanvas(ctx, sourceImg, canvasW, canvasH, mode) {
    if (mode === 'center') {
        const scale = canvasW / 64;
        let dw = sourceImg.width, dh = sourceImg.height;
        if (dw > 64 || dh > 64) {
            const ratio = Math.min(64 / dw, 64 / dh);
            dw = Math.floor(dw * ratio);
            dh = Math.floor(dh * ratio);
        }
        const dx = Math.floor((64 - dw) / 2) * scale;
        const dy = Math.floor((64 - dh) / 2) * scale;
        ctx.drawImage(sourceImg, dx, dy, dw * scale, dh * scale);
    } else {
        ctx.drawImage(sourceImg, 0, 0, canvasW, canvasH);
    }
}
