# Production

`$S` = `~/buzztorm-studio`. Projects are built in `~/studio/<brand>/<project-title>` (title in lowercase-with-hyphens, e.g. `daily-posting`).

## 1. Set up the project
```
bash $S/library/tools/setup.sh ~/studio/<brand>/<title> <brand>
cd ~/studio/<brand>/<title>
```
This copies the engine and the Studio Library, the brand's profile (`brand/`), its characters (`cast.custom.js`), its backgrounds (`sets.custom.js`) and generates `brand.js`, which swaps the studio's colour roles for the brand's colours at render time. Then create the project record (`projects.md`).

Docs: `$S/library/docs/`. References (style card, sets, props, scenes, motion): `ref/` in the project.

## 2. Script → voiceover (voiceover only)
Write `script.md` (format: `library/example/script_example.md`):
- `lang: en`, one `voice X:` line per speaker from the Brand Profile `characters`.
- One line per speaker turn: `X: [emotion] text`.

Run `python3 script.py el script.md` and send the user, in one message:
1. the contents of `work/elevenlabs_dialogue.txt` in a code block;
2. the voice descriptions;
3. "Paste it into ElevenLabs (Text to Dialogue or Studio, Eleven v3), export ONE file with all lines in order, and upload it here."

Status: Waiting for voiceover. Build nothing until the file arrives. Then:
```
python3 ingest.py <upload> script.md
```
If the recorded words differ from the script, update `script.md` to match the audio and run it again. Add an ARPAbet pronunciation in `audio/align.py` for every brand or invented word.

Music-only videos: write `work/timing.json` by hand (scenes on a 120 bpm grid, 0.5 s per beat) and a closed-mouth `lips.json` (`library/docs/FORMATS.md`, "Without a voiceover").

## 3. Storyboard
Write `story.js`, one scene per sentence or punchline (`library/docs/STORY.md`). Use only the brand's characters and backgrounds plus the Studio Library. Every number and screen answers the line it illustrates.

Contact sheet:
```
node render.mjs stills/a "$(python3 shot_stills.py 0.5)" 3 && python3 sheet.py stills/a stills/a.jpg 8 220
```
Look at it, fix overlaps, empty frames and illogical moments, then send it for Storyboard review.

## 4. Render and sound
```
node render.mjs frames "0-<N-1>" 3                    # AR=45|11|169 for other sizes, CAP=1 when Subtitles is ON
node events.mjs && python3 audio/autoscore.py && python3 audio/mix.py
bash finish.sh "<brand>_<content>_<title>_v<N>" 916   # 916,45,169 … masters −15 LUFS, encodes, runs QA
```
Run renders longer than ~2 minutes in the background and poll. Rename outputs to the file-name rule in `delivery.md`.

`STYLE=<engine name>` previews a visual style on every scene. Engine names: Standard `ink`, Old film `oldfilm`, Paper cut-out `paper`, Risograph `riso`, Noir `noir`, Comic `comic`, Pastel `pastel`, Dusk `dusk`, Freeze frame `freeze`, VHS `vhs`.

## 5. Stills (Post, Carousel, Story, covers, thumbnails)
Add a `thumbXxx()` design at the end of `vsl.js`, wire it in `renderThumb`, then:
```
node shoot_thumb.mjs out/<file>.png "?v=xxx&w=1080&h=1350"
```
Layouts: `library/docs/FORMATS.md` and `library/docs/SCENES.md` (Thumbnails).

## 6. Quality check (before every Ready for approval)
Check and fix, then report one line "Quality check passed":
- Only the brand's colours, characters, backgrounds and props (plus Studio Library).
- Outfits identical in every scene; characters in a two-shot are the same height.
- On-screen text: 3 words or fewer where possible, inside the safe area for the content.
- Ads: brand visible within 3 s, CTA end card held 2 s.
- Audio mastered at −15 LUFS; voiceover unaltered.
- Story frames leave the top 250 px and bottom 340 px free.
- Discord files within their size limits (`discord.md`).
- Look at a contact sheet of the final render and at full-size crops of anything that changed.

## Hook test (Trial reels)
1. Build and render the full reel with hook A.
2. Write the first scene(s) for hooks B and C in copies of `story.js` (`story_b.js`, `story_c.js`) that differ only until the end of the hook; render only that frame range for each and splice with the shared body.
3. Deliver 3 videos and 3 post copies (`delivery.md`).
4. After 72 hours the user logs results (`projects.md`). The winner can be graduated: new post copy written for followers, same video. Add the winning hook to the top of "Proven" in the brand's `hooks.md`.

## Repurpose
Start from the approved project; each target becomes its own version folder in the same project with its own delivery package.
| Target | How |
|---|---|
| Carousel | one slide per key scene, rendered as stills at 4:5 with the Comic or Standard style; last slide CTA |
| Story teaser | 3 frames: hook image, "new episode" frame with a countdown or link sticker, a poll frame |
| Trial reels | hook test on the approved body |
| 16:9 version | `AR=169`, set `Y0['169']` per scene after a stills check |
| 4:5 feed video | `AR=45` |
| Short cut-downs | 3 clips: the hook, the funniest scene, the twist (8–15 s each) |
| Discord announcement | GIF teaser (3–6 s) + message (`discord.md`) |
| Sticker | best character moment as a 320×320 loop (`discord.md`) |
| Soundboard clip | best line of the voiceover, up to 5 s (`discord.md`) |
