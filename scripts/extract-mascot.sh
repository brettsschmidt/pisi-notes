#!/usr/bin/env bash
# Unpack the pixellab character ZIP into /public/mascot/{idle,jump,curled}/.
# Runs in macOS bash 3.2 (no `mapfile`).
#
# The ZIP names animations with hashes like `jumping-747266cf` or
# `animation-b2ced785`. We map common prefixes to our slot names:
#   jumping*       -> jump
#   sleeping*      -> curled
#   sitting*       -> curled
#   anything else  -> idle (default)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="$ROOT/public/mascot/cat.zip"
OUT="$ROOT/public/mascot"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [[ ! -s "$ZIP" ]]; then
  echo "no ZIP at $ZIP — nothing to extract"
  exit 0
fi

echo "unpacking $ZIP into $TMP"
unzip -qq "$ZIP" -d "$TMP"

# For each animation directory, copy frames as 0.png, 1.png, ... into the
# matching slot in /public/mascot.
copy_frames() {
  local anim_dir="$1" slot="$2"
  mkdir -p "$OUT/$slot"
  rm -f "$OUT/$slot"/*.png 2>/dev/null || true
  local i=0
  for f in $(ls "$anim_dir/south"/frame_*.png 2>/dev/null | sort); do
    cp "$f" "$OUT/$slot/$i.png"
    i=$((i + 1))
  done
  echo "  $slot <- $(basename "$anim_dir")  ($i frames)"
}

if [[ -d "$TMP/animations" ]]; then
  for anim in "$TMP"/animations/*/; do
    name="$(basename "$anim")"
    case "$name" in
      jumping*|jump*)        copy_frames "$anim" "jump" ;;
      sleeping*|sitting*|curled*|seated*) copy_frames "$anim" "curled" ;;
      *)                     copy_frames "$anim" "idle" ;;
    esac
  done
fi

echo "done"
