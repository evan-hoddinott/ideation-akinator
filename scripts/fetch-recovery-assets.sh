#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
manifest="$repo_dir/docs/RECOVERY-ASSET-SOURCES.tsv"
output_dir="$repo_dir/static/images/era-sourced"
evidence_dir="$repo_dir/artifacts/recovery"
status_file="$evidence_dir/asset-http-status.txt"
hash_file="$evidence_dir/asset-sha256.txt"

mkdir -p "$output_dir" "$evidence_dir"
: >"$status_file"

while IFS=$'\t' read -r local_name era creator source_page direct_url license intended_use; do
	if [[ "$local_name" == "local_name" || -z "$local_name" ]]; then
		continue
	fi
	target="$output_dir/$era/$local_name"
	mkdir -p "$(dirname "$target")"
	http_status=$(curl --location --silent --show-error --output "$target" --write-out '%{http_code}' "$direct_url")
	printf '%s\t%s\t%s\n' "$http_status" "${target#"$repo_dir/"}" "$direct_url" >>"$status_file"
	if [[ "$http_status" != "200" ]]; then
		printf 'Asset fetch failed with HTTP %s: %s\n' "$http_status" "$direct_url" >&2
		exit 1
	fi
done <"$manifest"

find "$output_dir" -type f -print0 | sort -z | xargs -0 sha256sum >"$hash_file"
printf 'Downloaded %s recovery visuals.\n' "$(find "$output_dir" -type f | wc -l)"
