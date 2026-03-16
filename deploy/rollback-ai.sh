#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/var/www/ai-work-control-center"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"

if [[ ! -d "$RELEASES_DIR" ]]; then
  echo "Releases directory not found: $RELEASES_DIR"
  exit 1
fi

mapfile -t releases < <(ls -1 "$RELEASES_DIR" | sort)
count=${#releases[@]}

if (( count < 2 )); then
  echo "No previous release found. Need at least 2 releases."
  exit 1
fi

latest_index=$((count - 1))
prev_index=$((count - 2))
latest="${releases[$latest_index]}"
previous="${releases[$prev_index]}"

echo "Latest release  : $latest"
echo "Rollback target : $previous"

ln -sfn "$RELEASES_DIR/$previous" "$CURRENT_LINK"
nginx -t
nginx -s reload

echo "Rollback completed: $CURRENT_LINK -> $RELEASES_DIR/$previous"
