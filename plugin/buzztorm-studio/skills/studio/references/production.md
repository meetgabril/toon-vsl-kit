# Production (video and images)

`$S` = `~/buzztorm-studio`. Run every command inside the project folder (`~/studio/<brand>/<title>`), created by:
```
python3 $S/library/tools/studio.py new <brand> <title> <recipe> --goal <goal> [--offer <id>] [--parent <title>]
```
It copies the engine, the tools, the document templates and the brand (profile, Brand Brain, characters, backgrounds) and writes the project record (status Brief). Move status with `studio.py status <brand>/<title> --set "<Status>" [--note …]` at every step.

## 1. Script → voice
Write `script.md` (format: `library/example/script_example.md`; voice lines from the Brand Profile characters; `> FACTS:` line when needed). Gate: `--stage script`. Script review.
- Voice recorded for you (ELEVENLABS_API_KEY set and every character has `voice_id`): `python3 voice.py script.md` → `work/voice_api.mp3`.
- Otherwise: `python3 script.py el script.md`, send the dialogue text and voice descriptions, status "Waiting for voiceover", wait for the upload.
- Then `python3 ingest.py <audio> script.md`. If words changed while recording, update `script.md` and run it again.
Music-only videos: hand-written `work/timing.json` and closed `lips.json` (`library/docs/FORMATS.md`).

## 2. Storyboard
`story.js`, one scene per sentence (`library/docs/STORY.md`). Brand characters, backgrounds and props only. Every number and screen answers its line literally.
Contact sheet with layout capture:
```
QA=1 node render.mjs stills/a "$(python3 shot_stills.py 0.5)" 3 && python3 sheet.py stills/a stills/a.jpg 8 220
```
Look at it yourself, then `python3 studio.py check . --stage final` must show the layout check OK (ignore the files check until delivery). Then Storyboard review.

Social post layout (carousel, post): `AR=45`, screen-space items `slidehead` (same size on every slide), `swipe`, `say`, `cta` (`library/docs/FORMATS.md` → Social post layout). Story frames: `SAFE=story`. Reels: `SAFE=reel`. Covers: `COVER="TEXT"`. Transparent assets: `ALPHA=1` (PNG).

## 3. Render, sound, finish
```
QA=1 node render.mjs frames "0-<N-1>" 3          # AR=45|11|169 for other sizes; CAP=1 when Subtitles is ON
node events.mjs && python3 audio/autoscore.py && python3 audio/mix.py
bash finish.sh "<brand>_<format>_<title>_v<N>" 916      # masters at −15 LUFS, encodes, QA
```
Long renders in the background; poll. Move outputs into `delivery/` with the naming rule (`delivery.md`), write `delivery/post.md`, run the gate `--stage final`, then Ready for approval.

Visual styles (`STYLE=`): Standard `ink` · Old film `oldfilm` · Paper cut-out `paper` · Risograph `riso` · Noir `noir` · Comic `comic` · Pastel `pastel` · Dusk `dusk` · Freeze frame `freeze` · VHS `vhs`.

## Stills (post, carousel, story, covers, thumbnails)
Render beats as stills (`QA=1 AR=45 node render.mjs stills/x "<frames>" 3`), or a `thumbXxx()` design with `shoot_thumb.mjs`. Downscale 4:5 renders (1400×1750) to 1080×1350 when exporting.

## Bait + kinetic text reels (Hook Library)
`python3 kinetic.py kinetic.json`: bait frames (engine or a team clip) + one-word cards in the brand colours and font, pop-in, one hit per card, silent tail for the loop; writes the layout capture per card. See `hooks.md`.

## Hook test (Trial reels)
Render the full reel with hook A; write `story_b.js`/`story_c.js` that differ only until the hook ends; render only that range for each and splice with the shared body. Deliver 3 videos and 3 post copies for non-followers. After 72 h: Projects → Log results → graduate the winner and add its hook to "Proven" in `hooks.md`.

## Make another format (from an approved piece)
Each new format is a new project with `--parent <title>` reusing the approved script, facts, CTA and scenes: carousel from scenes · story teaser · trial reels · 16:9 (`AR=169`, tune `Y0`) · 4:5 feed video (`AR=45`) · short cut-downs · Discord announcement · sticker · soundboard clip · checklist or lesson from the same idea.
