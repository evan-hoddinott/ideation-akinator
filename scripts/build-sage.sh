#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
image_name=ideation-akinator-blender

docker build --quiet --tag "$image_name" "$repo_dir/tools/blender"
docker run --rm \
	--user "$(id -u):$(id -g)" \
	--volume "$repo_dir:/work" \
	"$image_name" \
	--python /work/tools/blender/build_sage.py
