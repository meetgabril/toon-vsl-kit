#!/usr/bin/env bash
# prep_voice.sh <voice.mp3|wav> — copies the voiceover in UNCHANGED and makes the working versions
#   work/voice.mp3 (original) · work/voice16.raw (16k mono for alignment) · work/voice_clean.wav (48k: 70 Hz high-pass + gentle 2:1 comp, nothing else)
set -e; IN="${1:?voice file}"; mkdir -p work music
cp "$IN" work/voice."${IN##*.}"
ffmpeg -v error -y -i "$IN" -ac 1 -ar 16000 -f s16le work/voice16.raw
ffmpeg -v error -y -i "$IN" -af "highpass=f=70,acompressor=threshold=-20dB:ratio=2:attack=15:release=200:makeup=1" -ar 48000 -ac 1 work/voice_clean.wav
python3 - <<'P'
import soundfile as sf; d=sf.info('work/voice_clean.wav').duration; print(f"voice {d:.2f}s  -> frames @24fps: {round(d*24)+1}  (export DUR={d+0.05:.2f})")
P
