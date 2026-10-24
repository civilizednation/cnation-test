#!/usr/bin/env bash
# 전체 렌더 → output.mp4, 걸린 시간 → render_time.txt
# BLENDER 에 blender 실행 파일을 주면 `blender -b -P`, 없으면 PYTHON(bpy 모듈)으로 실행
set -euo pipefail
cd "$(dirname "$0")"
FRAMES_DIR="${FRAMES_DIR:-frames}"
rm -rf "$FRAMES_DIR" && mkdir -p "$FRAMES_DIR"

start=$(date +%s)
if [[ -n "${BLENDER:-}" ]]; then
  "$BLENDER" -b -P scene.py -- --out "$FRAMES_DIR"
else
  "${PYTHON:-python3}" scene.py --out "$FRAMES_DIR"
fi
end=$(date +%s)

count=$(ls "$FRAMES_DIR"/frame_*.png | wc -l)
minutes=$(awk -v s="$((end - start))" 'BEGIN { printf "%.1f", s / 60 }')
echo "${count}, ${minutes}분" > render_time.txt

ffmpeg -y -loglevel error -framerate 30 -i "$FRAMES_DIR/frame_%04d.png" \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart output.mp4
cat render_time.txt
