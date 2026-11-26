#!/usr/bin/env bash
# make.sh preview|final|shot <n>|stills <frames> [name] — one command per stage, any size, ≤ 12 lines of output.
#   AR=916 (default) | 45 | 11 | 169   ZONE=<zone in formats.json> (default per size: reel, feed, square, wide; e.g. story, thumbnail, ad-vertical)
#   voice (cached by hash) → timing → layout preflight (1 rest + 1 end frame per shot) → render ‖ audio → encode → Quality Gate → contact sheet
#   preview: half size, 12 fps, ultrafast (review) · final: full size, 24 fps, veryfast (delivery) · shot <n>: re-render shot n of the final and re-encode
#   stills <f1,f2,…>: full-size stills (posts, carousels, thumbnails, covers) with the same layout rails and gate; no audio
#   SPECULATE=1 with preview: after the preview, the final starts in the background; `make.sh final` reuses it if nothing changed.
set -euo pipefail
MODE=${1:-preview}
case $MODE in shot|stills) ARG=${2:?"usage: make.sh $MODE <shot number | frames>"}; NAME=${3:-$(basename "$PWD")} ;; *) ARG=""; NAME=${2:-$(basename "$PWD")} ;; esac
AR=${AR:-916}; export AR; ZONE=${ZONE:-$(python3 studio.py zone . "$AR" 2>/dev/null || true)}; export ZONE; [ -n "$ZONE" ] && export SAFE=$ZONE || unset SAFE
LOG=work/make.log; : > "$LOG"; mkdir -p work out qa_pre
t0=$(date +%s%N); lap() { echo "  $(( ($(date +%s%N) - t0) / 1000000 )) ms  $1"; }
python3 -c "import json,sys;open('formats.js','w').write('// formats.js — generated from formats.json. Do not edit; edit formats.json.\nexport const FORMATS = '+json.dumps(json.load(open('formats.json')))+';\n')"
HASH() { cat story.js script.md work/voice.hash formats.json vsl.js toon.js brand.js cast.custom.js sets.custom.js audio/*.py 2>/dev/null | sha1sum | cut -c1-12; echo -n "$AR|${ZONE:-}|${STYLE:-}|${CAP:-1}"; }

gate() {   # one line per check (delivery files are judged at delivery), then the errors; returns 1 when layout or copy fail
  python3 studio.py check . --stage final > work/gate.txt 2>&1 || true
  echo "  gate: $(grep -E '^  \[' work/gate.txt | grep -v ' files' | sed -E 's/^  \[(OK |FAIL)\] (.*)/\2 \1/; s/ OK $/ ok/; s/ FAIL$/ FAIL/' | tr '\n' ' ')(files at delivery)"
  sed -n '/\[FAIL\] \(layout\|copy\|claims\|facts\|cta\)/,/^  \[/p' work/gate.txt | grep -E "ERROR" | head -6 || true
  grep -E "^ +WARN" work/gate.txt | head -3 || true
  ! grep -qE '\[FAIL\] (layout|copy)' work/gate.txt; }

if [ "$MODE" = stills ]; then   # —— stills: one render at full size, gate, sheet ——
  D=stills/make; mkdir -p "$D"; find "$D" -type f -delete
  AR=$AR QA=1 node render.mjs "$D" "$ARG" 2 >>"$LOG" 2>&1; touch "$D/REST"; lap "stills ($AR, zone ${ZONE:-default}): $(ls "$D" | grep -c 'jpg$') frames"
  i=0; for f in $(ls "$D"/f*.jpg); do i=$((i + 1)); python3 -c "
import sys; from PIL import Image; im = Image.open(sys.argv[1]).convert('RGB'); w, h = im.size
size = {(1400, 1750): (1080, 1350)}.get((w, h), (w, h)); im.resize(size, Image.LANCZOS).save(sys.argv[2])" "$f" "out/${NAME}_$(printf %02d $i).png"; done
  lap "exported $i PNG to out/ at the size they ship"
  OK=0; gate || OK=2; python3 rails_sheet.py "$D" "$ARG" work/sheet.jpg; exit $OK
fi

# 1. voice: only when the script or the voices changed (cache = hash of script + brand voices)
if [ -f script.md ] && grep -qE '^[A-Z]:' script.md; then
  H=$(cat script.md brand/brand-profile.json | sha1sum | cut -c1-12)
  if [ "$(cat work/voice.hash 2>/dev/null)" != "$H" ]; then
    if [ -n "${ELEVENLABS_API_KEY:-}" ]; then
      python3 voice.py script.md >>"$LOG" 2>&1 || { echo "  voice failed: $(tail -1 "$LOG")"; exit 3; }
      VO=work/voice_api.mp3
    else VO=$( (ls -t work/voice*.mp3 work/voice*.wav work/*.mp4 2>/dev/null || true) | head -1); [ -n "$VO" ] || { echo "  no voice: set ELEVENLABS_API_KEY or put the voiceover in work/"; exit 3; }; fi
    python3 ingest.py "$VO" script.md >>"$LOG" 2>&1; echo "$H" > work/voice.hash; lap "voice + timing (new)"
  else lap "voice + timing (cached)"; fi
fi

# 2. speculative final already done for exactly these inputs?
if [ "$MODE" = final ] && [ -z "${INSPEC:-}" ] && [ -f work/spec.hash ] && [ "$(cat work/spec.hash)" = "$(HASH)" ]; then
  w=0; while [ -f work/spec.lock ] && [ $w -lt 120 ]; do sleep 1; w=$((w + 1)); done; rm -f work/spec.lock   # an orphaned lock never blocks
  if [ -f "out/${NAME}_final.mp4" ]; then lap "final ready (rendered while the preview was in review)"; MODE=reuse; fi
fi

# 3. layout preflight: one rest frame and one end frame per shot, at preview size, layout capture only
node events.mjs >>"$LOG" 2>&1
SHOTS=$(python3 -c "
import json; d = json.load(open('work/events.json')); ts = [b['t'] for b in d['beats']] + [d['dur']]
print(' '.join(str(round(t * 24)) for t in ts))")
PRE=$(python3 - <<'EOF'
import json; d = json.load(open('work/events.json')); ts = [b['t'] for b in d['beats']] + [d['dur']]
fr = sorted({int(min(ts[i] + .9, (ts[i] + ts[i + 1]) / 2) * 24) for i in range(len(ts) - 1)} | {int((ts[i + 1] - .1) * 24) for i in range(len(ts) - 1)})   # after the pop-in, and the shot's last frame
print(','.join(str(f) for f in fr))
EOF
)
if [ "$MODE" != reuse ]; then
  find qa_pre -type f -delete
  AR=${AR}p QA=1 CAP=${CAP:-1} node render.mjs qa_pre "$PRE" 2 >>"$LOG" 2>&1 || AR=$AR QA=1 CAP=${CAP:-1} node render.mjs qa_pre "$PRE" 2 >>"$LOG" 2>&1
  touch qa_pre/REST   # every preflight capture is a rest frame: the gate judges all of them
  if ! python3 studio.py check . --stage final > work/gate_pre.txt 2>&1 && grep -q "ERROR" <(sed -n '/\[FAIL\] layout/,/^  \[/p' work/gate_pre.txt); then
    lap "preflight: layout problems (nothing rendered)"; sed -n '/\[FAIL\] layout/,/^  \[/p' work/gate_pre.txt | grep ERROR | head -8; exit 2
  fi
  python3 areamap.py qa_pre > work/areas.txt 2>/dev/null || true
  lap "preflight: layout OK on $(echo "$PRE" | tr ',' '\n' | wc -l) frames"
fi

# 4. render ‖ audio
N=$(python3 -c "import json;print(json.load(open('work/lips.json'))['N'])")
case $MODE in
  final) DIR=frames; ARx=$AR; FR="0-$((N - 1))"; FPS=24 ;;
  shot) [ "$(ls frames 2>/dev/null | grep -c jpg$)" -ge "$N" ] || { echo "  shot needs a full final first (make.sh final)"; exit 4; }
        NS=$(echo $SHOTS | wc -w); [ "$ARG" -ge 1 ] 2>/dev/null && [ "$ARG" -lt "$NS" ] || { echo "  shot must be 1–$((NS - 1))"; exit 4; }; DIR=frames; ARx=$AR; set -- $SHOTS; S=$(eval echo \${$((ARG))}); E=$(eval echo \${$((ARG + 1))}); FR="$S-$((E - 1))"; FPS=24 ;;

  reuse) DIR=frames; FPS=24 ;;
  *) DIR=prev; ARx=${AR}p; FR=$(python3 -c "print(','.join(map(str,range(0,$N,2))))"); FPS=12 ;;
esac
if [ "$MODE" != reuse ]; then
  mkdir -p "$DIR"; [ "$MODE" = shot ] || find "$DIR" -type f -delete
  AH=$( (cat work/events.json work/voice.hash audio/*.py 2>/dev/null; echo "${STYLE:-}") | sha1sum | cut -c1-12)
  if [ "$(cat work/audio.hash 2>/dev/null)" = "$AH" ] && [ -f music/mix_raw.wav ]; then AUD=""; else
  ( [ -f sfx/boing.wav ] || python3 sfx.py kit; python3 audio/autoscore.py; [ -n "${STYLE:-}" ] && STYLE=$STYLE python3 audio/stylize.py; python3 audio/mix.py && echo "$AH" > work/audio.hash ) >>"$LOG" 2>&1 & AUD=$!; fi
  QAF=1; [ "$MODE" = final ] && QAF=""   # layout already proven by preflight + preview; final skips per-frame capture
  AR=$ARx QA=$QAF CAP=${CAP:-1} node render.mjs "$DIR" "$FR" 2 >>"$LOG" 2>&1
  [ -n "$AUD" ] && wait $AUD; lap "render ($MODE, $(ls "$DIR" | grep -c jpg$) frames) ‖ audio"

  # 5. master + encode (loudness measured on the wav, not on the video)
  I=$(ffmpeg -hide_banner -i music/mix_raw.wav -af ebur128 -f null - 2>&1 | awk '/I:/{v=$2} END{print v}'); G=$(python3 -c "print(round(-15-($I),2))")
  ffmpeg -v error -y -i music/mix_raw.wav -af "volume=${G}dB,alimiter=limit=0.84:level=false" -ar 48000 music/master.wav
  OM=$MODE; [ "$MODE" = shot ] && OM=final; OUT=out/${NAME}_$OM.mp4
  VF="scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p"; [ "$OM" = final ] && [ "$AR" = 45 ] && VF="scale=1080:1350:flags=lanczos,format=yuv420p"   # 4:5 renders at 1400×1750 and ships at 1080×1350
  if [ "$OM" = final ]; then X="-preset veryfast -crf 19 -maxrate 14M -bufsize 28M"; A=320k; else X="-preset ultrafast -crf 23"; A=128k; fi
  ffmpeg -v error -y -framerate $FPS -pattern_type glob -i "$DIR/f*.jpg" -i music/master.wav -map 0:v -map 1:a -vf "$VF" -c:v libx264 $X -c:a aac -b:a $A -shortest -movflags +faststart "$OUT"
  LUFS=$(ffmpeg -hide_banner -i music/master.wav -af ebur128=peak=true -f null - 2>&1 | awk '/I:/{i=$2} /Peak:/{p=$2} END{print i" LUFS, peak "p}')
  lap "encode $OUT ($(du -h "$OUT" | cut -f1), $LUFS)"
  if [ "$OM" = final ]; then   # final video QA: frozen or black stretches (same check as finish.sh)
    FZ=$(ffmpeg -hide_banner -i "$OUT" -vf "freezedetect=n=0.001:d=0.6,blackdetect=d=0.1" -an -f null - 2>&1 | grep -oE "(freeze|black)_start: ?[0-9.]+" | head -3 | tr '\n' ' ' || true)
    [ -n "$FZ" ] && echo "  check video: $FZ (frozen or black stretch; fine only if the story holds a still on purpose)" || lap "video QA: no frozen or black stretches"
  fi
fi

# 6. gate (newest capture = this render) + contact sheet with the zone shaded
OK=0; gate || OK=2
SH=$(python3 -c "print(','.join(str(int(x)//2*2 if '$DIR'=='prev' else int(x)) for x in '$PRE'.split(',')))")
python3 rails_sheet.py "$DIR" "$SH" work/sheet.jpg
lap "done"

# 7. speculative final: start it now, while the preview is reviewed (approvals unchanged; discarded if anything changes)
if [ "$MODE" = preview ] && [ "${SPECULATE:-0}" = 1 ] && [ "$OK" = 0 ]; then
  HASH > work/spec.hash; touch work/spec.lock
  ( AR=$AR ZONE=${ZONE:-} SPECULATE=0 INSPEC=1 bash make.sh final "$NAME" > work/spec.log 2>&1; rm -f work/spec.lock ) &
  disown; echo "  final started in the background (ready in ~45 s)"
fi
exit $OK
