/**
 * Shared mutable state.
 *
 * sourceImages entries:  { file: File, mode: 'resize'|'center', slicing: boolean }
 * processedCanvases:     { canvas, filename, suffix }
 * savedPalettes:         { base, cool, warm } — each [[r,g,b], ...]. Populated by
 *                        session restore when no ref image is present, so palette
 *                        buttons still work. Cleared when a real ref image is loaded.
 */
export const state = {
    colorRefImage:     null,
    savedPalettes:     null,
    sourceImages:      [],
    processedCanvases: [],
};
