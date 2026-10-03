#!/usr/bin/env bash
# Re-encode the hero background video for the web.
#
#   bash .github/scripts/make_hero_video.sh "videos/source/My Clip.mp4"
#
# Produces, from the original:
#   videos/hero.mp4        1024px wide, silent  (desktop/tablet)
#   videos/hero-small.mp4   640px wide, silent  (phones)
#   images/hero-poster.jpg  first-frame still, shown before/instead of the video
#
# Audio is always stripped (-an): the hero must never make noise.
# Keep the original in videos/source/ — that folder is git-ignored.
#
# No ffmpeg installed? A self-contained build comes with:
#   pip install imageio-ffmpeg
#   FFMPEG=$(python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
set -euo pipefail

SRC="${1:?Usage: make_hero_video.sh <source video>}"
FFMPEG="${FFMPEG:-ffmpeg}"

"$FFMPEG" -hide_banner -loglevel error -y -i "$SRC" \
  -an -c:v libx264 -preset slower -crf 30 -profile:v high -pix_fmt yuv420p \
  -vf "scale=1024:-2" -movflags +faststart videos/hero.mp4

"$FFMPEG" -hide_banner -loglevel error -y -i "$SRC" \
  -an -c:v libx264 -preset slower -crf 31 -profile:v main -pix_fmt yuv420p \
  -vf "scale=640:-2" -movflags +faststart videos/hero-small.mp4

# Poster frame, taken 1.5s in to avoid a black first frame
"$FFMPEG" -hide_banner -loglevel error -y -ss 1.5 -i "$SRC" \
  -frames:v 1 -q:v 4 images/hero-poster.jpg

ls -lh videos/hero.mp4 videos/hero-small.mp4 images/hero-poster.jpg
