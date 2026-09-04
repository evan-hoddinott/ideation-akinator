#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source_sheet=${1:?Pass the generated 3x3 portrait sheet path}
output_dir="$repo_dir/static/images/sage-pixel"
contact_sheet="$repo_dir/artifacts/sage-pixel-portrait-contact-sheet.png"

mkdir -p "$output_dir" "$(dirname "$contact_sheet")"
cp "$source_sheet" "$output_dir/source-sheet.png"

names=(
	neutral thinking suspicious
	delighted irritated shocked
	smug defeated forbidden
)

cell_width=410
cell_height=426

for index in "${!names[@]}"; do
	column=$((index % 3))
	row=$((index / 3))
	x=$((column * cell_width))
	y=$((row * cell_height))
	convert "$source_sheet" \
		-crop "${cell_width}x${cell_height}+${x}+${y}" +repage \
		-trim -background none -gravity center -extent "${cell_height}x${cell_height}" \
		-filter point -resize 96x96 -colors 32 +dither +repage \
		"$output_dir/${names[$index]}.png"
done

montage \
	"$output_dir/neutral.png" "$output_dir/thinking.png" "$output_dir/suspicious.png" \
	"$output_dir/delighted.png" "$output_dir/irritated.png" "$output_dir/shocked.png" \
	"$output_dir/smug.png" "$output_dir/defeated.png" "$output_dir/forbidden.png" \
	-background '#080611' -geometry 192x192+12+12 -tile 3x3 "$contact_sheet"

identify "$output_dir"/*.png "$contact_sheet"
