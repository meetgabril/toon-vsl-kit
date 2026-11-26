# Production (video and images): one process, every size

`$S` = `~/buzztorm-studio`. Run every command inside the project folder (`~/studio/<brand>/<title>`), created by:
```
python3 $S/library/tools/studio.py new <brand> <title> <recipe> --goal <goal> [--offer <id>] [--parent <title>]
```
It copies the engine, the tools, the document templates, `formats.json` and the brand, and writes the project record (status Brief). Move status with `studio.py status <brand>/<title> --set "<Status>" [--note …]` at every step.

## The process (same for Reel, Story, 16:9, 4:5, posts, carousels, thumbnails)
| Step | Command | Approval |
|---|---|---|
| 1. Content | write `script.md` with `{screen text}` (`scripts.md`); `python3 script.py check script.md` and `studio.py check . --stage script` | Script review |
| 2. First storyboard | `python3 director.py script.md story.js`, then edit 2–3 shots at most (`@ key: value` lines in the script, or story.js) | — |
| 3. Preview | `SPECULATE=1 bash make.sh preview` (add `AR=` / `ZONE=` for other sizes) → look at `work/sheet.jpg` yourself, send the preview MP4 | Preview review |
| 4. Changes | edit, then `bash make.sh preview` again, or on the final `bash make.sh shot <n>` (only shot n is re-rendered) | — |
| 5. Final | `bash make.sh final` (ready at once when the speculative final matches) | Ready for approval |
| 6. Delivery | copy to `delivery/` with the naming rule, `post.md`, `studio.py check . --stage final`, package (`delivery.md`) | Publication |

`make.sh` does in one call, with ≤ 12 lines of output: voice (cached; ElevenLabs when `ELEVENLABS_API_KEY` is set, else the newest `work/voice*` file) → timing → **layout preflight** (one rest frame and one end frame per shot, ~2 s, nothing rendered if a text fails) → render ‖ sound (sfx kit, score, `STYLE` sound, mix; cached) → master −15 LUFS + encode → video QA on the final (frozen/black stretches) → Quality Gate → contact sheet with the zone shaded red (`work/sheet.jpg`) → area map (`work/areas.txt`).
- Sizes: `AR=916` (default) · `45` (ships 1080×1350) · `11` · `169`. Zones (`ZONE=`): default per size (`reel`, `feed`, `square`, `wide`); others `story`, `thumbnail`, `ad-vertical`, `ad-feed`, `ad-square`, `discord-event`. All in `library/engine/formats.json`.
- Preview = half size, 12 fps; final = full size, 24 fps. `SPECULATE=1` starts the final in the background right after the preview; `make.sh final` reuses it when nothing changed. Approvals do not change.
- `CAP=0` turns the burnt-in captions off (on by default; they follow the zone and step around faces).
- Visual styles (`STYLE=`): Standard `ink` · Old film `oldfilm` · Paper cut-out `paper` · Risograph `riso` · Noir `noir` · Comic `comic` · Pastel `pastel` · Dusk `dusk` · Freeze frame `freeze` · VHS `vhs`. Export `STYLE` before `make.sh`; the sound style follows.

Music-only videos: hand-written `work/timing.json` and closed `lips.json` (`library/docs/FORMATS.md`).
Voice recorded by the team: `python3 script.py el script.md`, send the dialogue and voice descriptions, status "Waiting for voiceover", put the file in `work/` and run `make.sh`.

## Text on screen: roles, not pixels
Every text that must be read goes through the layout rails: `hud "TEXT" role=hook|label|note at=auto` (`library/docs/STORY.md`). The engine places it in the format's safe zone, away from faces (strong), bodies, set signs and panels, platform UI (never) and preview crops (weak); when it would touch a face it wraps to two lines in the free side column. Size comes from the role and the format. `at=top|upper|mid|lower`, `dx=`, `tilt=`, `bg=` remain available. Never hand-place pixels for readable text; `sign`, `pill`, `stamp` are scenery that moves with the camera.

## Stills (post, carousel, story frames, covers, thumbnails)
```
AR=45 bash make.sh stills "60,132,204"            # posts/carousels (slides = beats)
AR=169 ZONE=thumbnail bash make.sh stills 30      # YouTube thumbnail: a one-scene story.js
```
**Thumbnails are a one-scene story**, not drawing code: the hero close on one side (`T R cu <mood>`), the promise as `hud "…" role=hook at=auto` (≤ 6 words), a set from the brand. The zone keeps the duration badge clear. The old `thumbXxx()` functions are reference only.
Social post layout (carousel, post): screen-space items `slidehead` (same size on every slide), `swipe`, `say`, `cta` (`library/docs/FORMATS.md`). Covers: `COVER="TEXT"`. Transparent assets: `ALPHA=1` (PNG).

## Bait + kinetic text reels (Hook Library)
`python3 kinetic.py kinetic.json`: bait frames (engine or a team clip) + one-word cards in the brand colours and font, pop-in, one hit per card, silent tail for the loop; writes the layout capture per card. See `hooks.md`.

## Hook test (Trial reels)
Render the full reel with hook A; write `story_b.js`/`story_c.js` that differ only until the hook ends; `make.sh shot 1` for each and splice with the shared body. Deliver 3 videos and 3 post copies for non-followers. After 72 h: Projects → Log results → graduate the winner and add its hook to "Proven" in `hooks.md`.

## Make another format (from an approved piece)
Same project, same story: `AR=169 bash make.sh preview` (16:9), `AR=45` (4:5 feed video), `AR=169 ZONE=thumbnail bash make.sh stills <frame>` (thumbnail). Texts and captions re-place themselves for the size. A new project with `--parent <title>` only when the content changes (carousel from scenes, story teaser, trial reels, cut-downs, Discord, sticker, checklist or lesson from the same idea).
16:9 framing: the wide window looks at the vertical composition; check feet and set tops on the sheet and tune `Y0` per shot only when needed.

## Working fast (tokens and time)
- One piece per session; studies and analysis in another session.
- Independent commands in the same turn; read outputs only from `make.sh` (they are short).
- Think hard on idea, hook and script; run production steps without long reasoning.
- The API key lives in the environment (`ELEVENLABS_API_KEY`), never in the chat.
