#!/usr/bin/env python3
"""
Crop a single exported character sheet down to RPG Maker MZ's 3x4 walking area (432x576).
- Takes ONE input file.
- Outputs to --out if provided, otherwise next to the input with "_432x576" suffix.
- Optional --prefix will add a leading "$" to the base filename if missing.
By Luke Acha and ChatGPT
"""
from PIL import Image
from pathlib import Path
import argparse
import sys

CROP_W, CROP_H = 432, 576

def ensure_dollar_prefix(p: Path, enable: bool) -> Path:
    if not enable:
        return p
    stem = p.stem
    if not stem.startswith("$"):
        stem = "$" + stem
    return p.with_stem(stem)

def crop_file(in_path: Path, out_path: Path):
    img = Image.open(in_path).convert("RGBA")
    w, h = img.size
    if w < CROP_W or h < CROP_H:
        print(f"[!] Warning: input smaller than {CROP_W}x{CROP_H} ({w}x{h}). Cropping to min size.", file=sys.stderr)
    box = (0, 0, min(CROP_W, w), min(CROP_H, h))
    cropped = img.crop(box)
    cropped.save(out_path)
    print(f"[+] Saved: {out_path}")

def main():
    ap = argparse.ArgumentParser(description="Crop top-left 432x576 (3x4 frames) from a character sheet.")
    ap.add_argument("--in", dest="infile", required=True, help="Input PNG path")
    ap.add_argument("--out", dest="outfile", default=None, help="Output PNG path (optional)")
    ap.add_argument("--prefix", action="store_true", help="Add $ prefix to output base filename if missing")
    args = ap.parse_args()

    in_path = Path(args.infile)
    if not in_path.exists():
        ap.error(f"Input file not found: {in_path}")

    # Default output path: same folder, base + _432x576.png
    if args.outfile:
        out_path = Path(args.outfile)
    else:
        out_path = in_path.with_name(in_path.stem + "_432x576.png")

    # Optionally add $ prefix
    out_path = ensure_dollar_prefix(out_path, args.prefix)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    crop_file(in_path, out_path)

if __name__ == "__main__":
    main()
