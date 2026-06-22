#!/usr/bin/env bash
#
# Slice a video into a zero-padded .webp frame sequence for the cinematic-hero
# scroll-scrub engine (components/home/cinematic-hero/use-scrub-frames.ts).
#
# The engine reads frames named 0001.webp, 0002.webp, … (1-indexed, 4-wide pad)
# and is configured with a `count` equal to the number of frames produced here.
#
# Usage:
#   scripts/extract-frames.sh <input-video> <out-dir> [width]
#
# Example:
#   scripts/extract-frames.sh public/images/videos/hero.mp4 public/frames/hero 1280
#
set -euo pipefail

IN="${1:?input video required}"
OUT="${2:?output dir required}"
WIDTH="${3:-1280}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH" >&2
  exit 1
fi

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp not found on PATH (needed because this ffmpeg lacks libwebp)" >&2
  exit 1
fi

mkdir -p "$OUT"
rm -f "$OUT"/*.webp "$OUT"/*.png

# 1) Extract scaled PNG frames (this ffmpeg build has no libwebp encoder).
ffmpeg -loglevel error -i "$IN" \
  -vf "scale=${WIDTH}:-2:flags=lanczos" \
  "$OUT/%04d.png"

# 2) Convert each PNG → quality webp, then drop the PNGs.
for png in "$OUT"/*.png; do
  cwebp -quiet -q 80 "$png" -o "${png%.png}.webp"
done
rm -f "$OUT"/*.png

COUNT="$(ls "$OUT"/*.webp 2>/dev/null | wc -l | tr -d ' ')"
echo "Extracted ${COUNT} frames to ${OUT} (set count: ${COUNT} in the scrub config)"
