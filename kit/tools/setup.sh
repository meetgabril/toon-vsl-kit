#!/usr/bin/env bash
# setup.sh <project_dir> — new toon-VSL project from the kit (engine + example scene file + audio tools)
set -e
KIT="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?usage: setup.sh <project_dir>}"
mkdir -p "$P"/{work,music,stills,out,ref}
cp -r "$KIT"/engine/. "$P"/
cp "$KIT"/example/buzztorm_vsl.js "$P"/example_buzztorm_vsl.js   # reference only; the film = vsl.js + story.js
mkdir -p "$P"/audio && cp "$KIT"/audio/*.py "$P"/audio/
cp "$KIT"/tools/*.py "$KIT"/tools/*.sh "$P"/ && rm -f "$P"/setup.sh
cp -r "$KIT"/ref/. "$P"/ref/
# example timing/lips so the example renders before your own voice exists
for f in "$KIT"/example/work/*; do [ -e "$P/work/$(basename "$f")" ] || cp "$f" "$P/work/"; done
cd "$P"
# Playwright + Chromium: link an existing install into node_modules, else install it
if [ ! -e node_modules/playwright ]; then
  mkdir -p node_modules
  for d in /opt/npm-tools/node_modules "$(npm root -g 2>/dev/null)" /usr/lib/node_modules /usr/local/lib/node_modules; do
    if [ -d "$d/playwright" ]; then ln -sf "$d/playwright" node_modules/playwright; [ -d "$d/playwright-core" ] && ln -sf "$d/playwright-core" node_modules/playwright-core; break; fi
  done
  [ -e node_modules/playwright ] || { npm i playwright >/dev/null 2>&1 && npx playwright install chromium >/dev/null 2>&1; } || echo "WARN: playwright not available"
fi
python3 -c "import numpy, scipy, soundfile, PIL" 2>/dev/null || pip install --break-system-packages -q numpy scipy soundfile pillow
python3 -c "import pocketsphinx" 2>/dev/null || pip install --break-system-packages -q pocketsphinx || echo "WARN: pocketsphinx missing (needed for align.py)"
command -v ffmpeg >/dev/null || echo "WARN: ffmpeg missing"
echo "project ready: $P"
