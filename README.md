# Badges-Be-Done!

A simple web tool for creating multi-layered badges with automatic slicing and batch processing capabilities.

## Features

- **Multi-layer compositing**: Background + Foreground + Border + Individual slices
- **Automatic slicing**: Detects and creates separate layers for complex badge designs
- **Batch processing**: Handle multiple images with consistent naming
- **Flexible downloads**: ZIP, individual files, or Save As options
- **Smart naming**: BadgeXXX-YYY format with 3-digit padding for large batches

## How to Use

1. **Upload Border Image**: Choose a transparent PNG or WebP file for the border overlay
2. **Upload Background Image** (Optional): Add a background layer that shows through transparent areas
3. **Enable Slicing** (Optional): Check to generate individual slice layers on top of the base badge
4. **Upload Images**: Select one or more foreground images to process
5. **Process**: Click "Process Images" to generate all layer combinations
6. **Download**: Choose from three download options:
   - **Download All as ZIP**: Quick download to default folder
   - **Save As ZIP**: Choose exact location (Chrome/Edge only)
   - **Download All (Individual)**: Separate PNG files with BadgeXXX-YYY naming

## Output Structure

Each processed image generates multiple layers:
- **BadgeXXX-000.png**: Background + Foreground + Border (base badge)
- **BadgeXXX-001.png**: Background + Foreground + Border + Slice 1
- **BadgeXXX-002.png**: Background + Foreground + Border + Slice 2
- etc.

Where:
- **XXX** = Foreground image number (001, 002, 003...)
- **YYY** = Layer index (000 = border top, 001+ = individual slices)

## Technical Details

- **Output Size**: 64x64 pixels for all processed images
- **Supported Formats**: 
  - Border: PNG, WebP (transparent recommended)
  - Background: Any image format
  - Source: Any image format supported by browsers
- **Processing**: Client-side only, no server uploads required
- **Browser Support**: Save As requires Chrome/Edge 86+, others fall back gracefully

## File System Access

The "Save As ZIP" feature uses the File System Access API for modern browsers, allowing you to choose the exact save location. Other browsers will use the standard download behavior.

## Deployment

Ready to deploy to GitHub Pages as-is. No build process required. Simply push to a repository and enable GitHub Pages from the repository settings.

## License

Open source - feel free to use and modify.
