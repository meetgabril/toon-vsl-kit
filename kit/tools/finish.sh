#!/usr/bin/env bash
# finish.sh "<Name>" [916|45|both] — master the mix and encode the finished MP4(s) + QA
#   needs: music/mix_raw.wav (audio/mix.py), frames/ (9:16) and/or frames45/ (4:5) rendered
set -e; NAME="${1:?name}"; AR="${2:-both}"; mkdir -p out
# one linear gain to -15 LUFS, then a gentle -1.3 dBFS limiter (no other processing on the voice)
I=$(ffmpeg -hide_banner -i music/mix_raw.wav -af ebur128 -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
G=$(python3 -c "print(round(-15-($I),2))"); echo "mix integrated $I LUFS -> gain $G dB"
ffmpeg -v error -y -i music/mix_raw.wav -af "volume=${G}dB,alimiter=limit=0.84:level=false" -ar 48000 music/master.wav
enc() { # $1 frames dir  $2 vf  $3 out
  ffmpeg -v error -y -framerate 24 -i "$1"/f%05d.jpg -i music/master.wav -map 0:v -map 1:a -vf "$2" \
    -c:v libx264 -preset veryfast -crf 19 -maxrate 14M -bufsize 28M -c:a aac -b:a 320k -movflags +faststart "$3"; }
[ "$AR" != 45 ] && enc frames "format=yuv420p" "out/${NAME}.mp4" && echo "out/${NAME}.mp4"
[ "$AR" != 916 ] && enc frames45 "scale=1080:1350:flags=lanczos,format=yuv420p" "out/${NAME}_4x5.mp4" && echo "out/${NAME}_4x5.mp4"
for f in out/${NAME}*.mp4; do
  echo "== QA $f"; ffprobe -v error -show_entries stream=codec_type,width,height,duration -of csv=p=0 "$f"
  ffmpeg -hide_banner -i "$f" -vf "freezedetect=n=0.001:d=0.6,blackdetect=d=0.1" -af ebur128=peak=true -f null - 2>&1 | grep -E "freeze_start|black_start|^ +I:|^ +Peak:"
done
