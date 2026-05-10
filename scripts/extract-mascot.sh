#!/usr/bin/env bash
# Unpack the pixellab character ZIP into /public/mascot/{anim}/{i}.png.
# The ZIP layout is determined empirically: the script greps for files
# named like *_<frame>.png inside any animation folder and lays them out
# as 0.png, 1.png, ... in the matching anim directory.
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
echo "ZIP contents:"
find "$TMP" -type f | head -50

# For each animation we want, find frames and copy in numeric order.
copy_anim() {
  local name="$1" target="$2"
  mkdir -p "$OUT/$target"
  # Look for any path containing the animation name + .png, sorted.
  mapfile -t files < <(find "$TMP" -type f -iname "*.png" | grep -i "/$name/\|/${name}_\|_${name}_" | sort)
  if (( ${#files[@]} == 0 )); then
    echo "  no frames found for $name — skipping"
    return
  fi
  local i=0
  for f in "${files[@]}"; do
    cp "$f" "$OUT/$target/$i.png"
    i=$((i + 1))
  done
  echo "  $name -> $OUT/$target/ ($i frames)"
}

copy_anim "idle" "idle"
copy_anim "jump" "jump"
copy_anim "curled" "curled"
copy_anim "sitting-on-belly" "curled"  # template name fallback

echo "done"
