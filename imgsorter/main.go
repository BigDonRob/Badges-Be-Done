package main

import (
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"fmt"
	"image"
	"image/color"
	_ "image/gif"
	_ "image/jpeg"
	"image/png"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// ─── Ratio bounds: 9:16 portrait → 16:9 landscape ────────────────────────────
const (
	minRatio = 9.0 / 16.0 // 0.5625
	maxRatio = 16.0 / 9.0 // 1.7778
)

var supportedExts = map[string]bool{
	".jpg": true, ".jpeg": true,
	".png": true,
	".gif": true,
}

// ─── Stats ────────────────────────────────────────────────────────────────────

type stats struct {
	total, kept, transparent, discardedRatio, duplicates int
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	once   := flag.Bool("once",   false, "Self-delete this executable after processing")
	dryRun := flag.Bool("dry",    false, "Preview what would happen — no files moved")
	copy   := flag.Bool("copy",   false, "Copy files instead of moving them")
	ps2fix := flag.Bool("ps2fix", false, "Fix PCSX2 alpha dumps: doubles alpha channel, clamps to 255 (PS2 stores alpha 0–128, not 0–255)")
	flag.Parse()

	banner()

	// Get input path from CLI arg (drag-and-drop on Windows) or prompt
	inputDir := ""
	if args := flag.Args(); len(args) > 0 {
		inputDir = cleanPath(args[0])
	} else {
		fmt.Print("Folder path (or drag folder here): ")
		fmt.Scanln(&inputDir)
		inputDir = cleanPath(inputDir)
	}

	info, err := os.Stat(inputDir)
	if err != nil || !info.IsDir() {
		fail(fmt.Sprintf("Not a valid folder: %s", inputDir))
	}

	outputDir := filepath.Join(filepath.Dir(inputDir), filepath.Base(inputDir)+"_sorted")

	fmt.Printf("  Input:  %s\n", inputDir)
	fmt.Printf("  Output: %s\n", outputDir)
	if *dryRun {
		fmt.Println("  Mode:   DRY RUN (nothing will be moved)")
	} else if *copy {
		fmt.Println("  Mode:   Copy (originals kept)")
	} else {
		fmt.Println("  Mode:   Move")
	}
	if *ps2fix {
		fmt.Println("  PS2fix: ON — alpha channel will be doubled (PCSX2 dump correction)")
	}
	fmt.Println()

	// ── Collect all image paths first (fast, no reading) ──────────────────────
	var paths []string
	_ = filepath.Walk(inputDir, func(p string, fi os.FileInfo, err error) error {
		if err != nil || fi.IsDir() {
			return nil
		}
		if supportedExts[strings.ToLower(filepath.Ext(p))] {
			paths = append(paths, p)
		}
		return nil
	})

	if len(paths) == 0 {
		fmt.Println("  No supported images found (.jpg .jpeg .png .gif).")
		pause()
		os.Exit(0)
	}

	fmt.Printf("  Found %d image(s) — processing...\n\n", len(paths))

	// ── Process ────────────────────────────────────────────────────────────────
	seen := make(map[string]bool) // sha256 hash → already placed
	var s stats
	s.total = len(paths)

	for i, p := range paths {
		printProgress(i+1, len(paths))

		hash, err := hashFile(p)
		if err != nil {
			continue
		}

		// Duplicate check
		if seen[hash] {
			s.duplicates++
			if !*dryRun {
				dest := filepath.Join(outputDir, "duplicates", filepath.Base(p))
				transfer(p, dest, *copy)
			}
			continue
		}
		seen[hash] = true

		// Decode header — width, height, format (no pixel data loaded yet)
		cfg, format, err := decodeConfig(p)
		if err != nil {
			continue // unreadable, skip
		}

		w, h := cfg.Width, cfg.Height
		ratio := float64(w) / float64(h)

		// Ratio filter
		if ratio < minRatio || ratio > maxRatio {
			s.discardedRatio++
			if !*dryRun {
				dest := filepath.Join(outputDir, "discarded_ratio", filepath.Base(p))
				transfer(p, dest, *copy)
			}
			continue
		}

		// Transparency check + optional PS2 alpha fix (PNG only)
		hasAlpha := false
		if format == "png" {
			if *ps2fix {
				// Full decode required — we need to rewrite pixel data.
				// Transparency is evaluated AFTER correction so routing is accurate.
				hasAlpha, err = applyPS2AlphaFix(p, func(dest string) error {
					return writeFixedPNG(p, dest)
				})
				if err != nil {
					fmt.Printf("\n  ⚠ ps2fix failed for %s: %v\n", filepath.Base(p), err)
					continue
				}
				// In ps2fix mode the file is always written fresh to dest;
				// skip the normal transfer below by routing through a special path.
				bucket := fmt.Sprintf("%dx%d", w, h)
				var destDir string
				if hasAlpha {
					s.transparent++
					destDir = filepath.Join(outputDir, "transparent", bucket)
				} else {
					destDir = filepath.Join(outputDir, bucket)
				}
				s.kept++
				if !*dryRun {
					dest := safeDestPath(filepath.Join(destDir, filepath.Base(p)))
					if err := os.MkdirAll(filepath.Dir(dest), 0755); err == nil {
						if err2 := writeFixedPNG(p, dest); err2 == nil && !*copy {
							os.Remove(p) // remove original after successful fixed write
						}
					}
				}
				continue
			}
			hasAlpha = pngHasTransparency(p, cfg)
		}

		// Bucket name: e.g. "1920x1080"
		bucket := fmt.Sprintf("%dx%d", w, h)
		var destDir string
		if hasAlpha {
			s.transparent++
			destDir = filepath.Join(outputDir, "transparent", bucket)
		} else {
			destDir = filepath.Join(outputDir, bucket)
		}

		s.kept++
		if !*dryRun {
			dest := filepath.Join(destDir, filepath.Base(p))
			transfer(p, dest, *copy)
		}
	}

	// ── Summary ────────────────────────────────────────────────────────────────
	fmt.Print("\r") // clear progress line
	printSummary(s, *dryRun)

	if *once && !*dryRun {
		fmt.Println("\n  Self-deleting in 3 seconds...")
		time.Sleep(3 * time.Second)
		selfDelete()
		os.Exit(0)
	}

	pause()
}

// ─── Core Helpers ─────────────────────────────────────────────────────────────

func decodeConfig(path string) (image.Config, string, error) {
	f, err := os.Open(path)
	if err != nil {
		return image.Config{}, "", err
	}
	defer f.Close()
	cfg, format, err := image.DecodeConfig(f)
	return cfg, format, err
}

func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// pngHasTransparency checks whether a PNG actually contains transparent pixels.
// We use the color model from DecodeConfig as a fast gate — if the model
// doesn't even support alpha, we skip the pixel scan entirely.
// If it does support alpha, we do a sampled scan (every 16th pixel per axis)
// so we read ~1/256 of pixels rather than the full image. Fast enough for
// 4K sources; accurate enough for asset/sprite content.
func pngHasTransparency(path string, cfg image.Config) bool {
	// Gate: does this color model even carry alpha?
	switch cfg.ColorModel {
	case color.NRGBAModel, color.RGBA64Model, color.NRGBA64Model,
		color.AlphaModel, color.Alpha16Model:
		// has alpha channel — fall through to pixel scan
	case color.RGBAModel:
		// RGBA model — might have alpha, scan
	default:
		return false // Gray, Paletted (GIF handled separately), etc.
	}

	f, err := os.Open(path)
	if err != nil {
		return false
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		return false
	}

	bounds := img.Bounds()
	step := 16 // sample every 16th pixel in each axis
	if step < 1 {
		step = 1
	}
	for y := bounds.Min.Y; y < bounds.Max.Y; y += step {
		for x := bounds.Min.X; x < bounds.Max.X; x += step {
			_, _, _, a := img.At(x, y).RGBA()
			if a < 0xffff {
				return true
			}
		}
	}
	return false
}

func transfer(src, dest string, copyMode bool) {
	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return
	}
	// Avoid overwriting — append hash prefix if collision
	dest = safeDestPath(dest)

	if copyMode {
		copyFile(src, dest)
	} else {
		if err := os.Rename(src, dest); err != nil {
			// Cross-device rename fallback
			copyFile(src, dest)
			os.Remove(src)
		}
	}
}

func copyFile(src, dst string) {
	in, err := os.Open(src)
	if err != nil {
		return
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return
	}
	defer out.Close()
	io.Copy(out, in)
}

// safeDestPath returns dest unchanged if it doesn't exist, otherwise appends
// an incrementing suffix to avoid stomping existing files.
func safeDestPath(dest string) string {
	if _, err := os.Stat(dest); os.IsNotExist(err) {
		return dest
	}
	ext  := filepath.Ext(dest)
	base := strings.TrimSuffix(dest, ext)
	for i := 2; ; i++ {
		candidate := fmt.Sprintf("%s_%d%s", base, i, ext)
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
}

// ─── PS2 Alpha Fix ────────────────────────────────────────────────────────────

// writeFixedPNG decodes src, doubles every alpha value (clamped to 255),
// and writes the corrected RGBA PNG to dst. Returns whether any pixel in the
// CORRECTED image is non-opaque (used for transparency bucket routing).
func writeFixedPNG(src, dst string) error {
	_, err := applyPS2AlphaFix(src, func(d string) error { return nil })
	// We want the actual write; call the real impl directly.
	_ = err

	f, err := os.Open(src)
	if err != nil {
		return err
	}
	defer f.Close()

	decoded, _, err := image.Decode(f)
	if err != nil {
		return err
	}

	bounds := decoded.Bounds()
	out    := image.NewNRGBA(bounds)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r32, g32, b32, a32 := decoded.At(x, y).RGBA()
			// RGBA() returns 16-bit pre-multiplied values; convert to 8-bit straight.
			var r8, g8, b8, a8 uint8
			if a32 == 0 {
				r8, g8, b8, a8 = 0, 0, 0, 0
			} else {
				r8 = uint8(r32 * 0xff / a32)
				g8 = uint8(g32 * 0xff / a32)
				b8 = uint8(b32 * 0xff / a32)
				a8 = uint8(a32 >> 8)
			}
			// PS2 fix: double alpha, clamp to 255
			fixed := uint16(a8) * 2
			if fixed > 255 {
				fixed = 255
			}
			out.SetNRGBA(x, y, color.NRGBA{R: r8, G: g8, B: b8, A: uint8(fixed)})
		}
	}

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	outF, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer outF.Close()

	return encodePNG(outF, out)
}

// applyPS2AlphaFix is a lightweight helper that returns whether the corrected
// image has any transparent pixels, without writing anything. The callback is
// unused here; real writes go through writeFixedPNG.
func applyPS2AlphaFix(src string, _ func(string) error) (hasTransparency bool, err error) {
	f, err := os.Open(src)
	if err != nil {
		return false, err
	}
	defer f.Close()

	decoded, _, err := image.Decode(f)
	if err != nil {
		return false, err
	}

	bounds := decoded.Bounds()
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			_, _, _, a32 := decoded.At(x, y).RGBA()
			a8 := uint8(a32 >> 8)
			fixed := uint16(a8) * 2
			if fixed > 255 {
				fixed = 255
			}
			if fixed < 255 {
				return true, nil
			}
		}
	}
	return false, nil
}

func encodePNG(w io.Writer, img image.Image) error {
	enc := png.Encoder{CompressionLevel: png.DefaultCompression}
	return enc.Encode(w, img)
}

func selfDelete() {
	exe, err := os.Executable()
	if err != nil {
		return
	}
	switch runtime.GOOS {
	case "windows":
		// Can't delete a running .exe; spawn a detached batch that waits then deletes
		bat := exe + "._del.bat"
		script := fmt.Sprintf(
			"@echo off\r\n:loop\r\ndel \"%s\" 2>nul\r\nif exist \"%s\" (timeout /t 1 /nobreak >nul & goto loop)\r\ndel \"%%~f0\"\r\n",
			exe, exe, // delete self (the bat) last
		)
		if err := os.WriteFile(bat, []byte(script), 0600); err != nil {
			return
		}
		cmd := exec.Command("cmd", "/C", "start", "/min", bat)
		cmd.SysProcAttr = windowsSysProcAttr() // defined in sysproc_windows.go
		_ = cmd.Start()
	default:
		// Unix: file can be removed while still running (inode stays open)
		os.Remove(exe)
	}
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

func banner() {
	fmt.Println("┌─────────────────────────────────────────┐")
	fmt.Println("│         Image Sorter  •  by BBD          │")
	fmt.Println("│  Deduplicate · Filter ratios · Bucket    │")
	fmt.Println("└─────────────────────────────────────────┘")
	fmt.Println()
}

func printProgress(current, total int) {
	pct := float64(current) / float64(total) * 100
	bar := int(pct / 5) // 20 chars wide
	filled := strings.Repeat("█", bar)
	empty  := strings.Repeat("░", 20-bar)
	fmt.Printf("\r  [%s%s] %3.0f%%  %d/%d ", filled, empty, pct, current, total)
}

func printSummary(s stats, dry bool) {
	action := "moved"
	if dry {
		action = "would move"
	}
	fmt.Println()
	fmt.Println("  ┌──────────────────────────────────────┐")
	fmt.Printf( "  │  Scanned              %14d  │\n", s.total)
	fmt.Printf( "  │  Sorted to buckets    %14d  │\n", s.kept)
	fmt.Printf( "  │  ↳ With transparency  %14d  │\n", s.transparent)
	fmt.Printf( "  │  Discarded (ratio)    %14d  │\n", s.discardedRatio)
	fmt.Printf( "  │  Duplicates           %14d  │\n", s.duplicates)
	fmt.Printf( "  │  (%s)                           │\n", action)
	fmt.Println("  └──────────────────────────────────────┘")
}

func pause() {
	fmt.Println("\n  Press Enter to exit...")
	fmt.Scanln()
}

func fail(msg string) {
	fmt.Printf("\n  ✗ %s\n", msg)
	pause()
	os.Exit(1)
}

func cleanPath(p string) string {
	return strings.Trim(p, "\"' \t\r\n")
}
