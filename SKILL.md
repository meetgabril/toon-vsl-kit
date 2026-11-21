---
name: toon-vsl
description: Make a premium cartoon VSL or explainer video (sitcom-toon Open Peeps style, lip-synced characters) from a script and the user's voiceover, plus character sheets, 4:5 versions and thumbnails.
---

# Toon VSL: script + voiceover → premium cartoon video

This skill reproduces the pipeline and look of the approved Buzztorm VSL "Coach Tony's Treadmill":
- flat Open Peeps characters with thick plum ink, lip-synced to the user's ElevenLabs voice;
- a hand-built 2D vector engine and synthesized music and SFX;
- 9:16 and 4:5 masters plus thumbnails.

The only paid tools are Claude and ElevenLabs. Everything else is code in the kit.

## 0. Get the kit (first, every session)
The kit lives in the user's private repo **`meetgabril/toon-vsl-kit`**.
```
git clone https://github.com/meetgabril/toon-vsl-kit ~/toon-vsl-kit
```
If the clone fails (auth or 404), call the session's `add_repo` tool with owner `meetgabril` and repo `toon-vsl-kit`, then clone as it instructs. Never pre-check with curl.

Then read, in this order, before planning anything:
- `kit/docs/STYLE.md`: the look and the client's art-direction rules.
- `kit/docs/CHARACTERS.md`: the cast, the API, and how to build new characters.
- `kit/docs/SCENES.md`: the engine, shot anatomy, ready-made pieces, recipes, 4:5 and thumbnails.
- `kit/docs/AUDIO.md`: voice rules, alignment, lip sync, score, mix and master.
- `kit/ref/*.jpg`: look at the character sheets, the storyboard and the thumbnails.

Requirements: Node 22+, Playwright + Chromium, Python 3 (numpy, scipy, soundfile, Pillow, pocketsphinx) and ffmpeg. `setup.sh` links or installs what's missing.

## 1. Intake
Ask only what you can't infer (use AskUserQuestion):
- **Script**: lines with speakers. If there's no script yet, write one (see "Writing the script").
- **Voiceover**: the ElevenLabs export. Ask for the final text if it was edited while recording.
- **Brand**: name, colours, CTA, and any words to avoid on screen.
- **Cast**: reuse Dex (narrator) and Tony (fitness coach), or design new characters.
- **Formats**: 9:16 by default, 4:5 and thumbnails on request.

## 2. Project setup
```
bash ~/toon-vsl-kit/kit/tools/setup.sh ~/vsl/<slug>
cd ~/vsl/<slug>
```
The project starts as a copy of the finished Buzztorm film (`vsl.js`), which renders immediately. Render a few stills to confirm the toolchain works:
```
node render.mjs stills/smoke "75,2000" 1
```

## 3. Voice → timing → lips
```
bash prep_voice.sh <voice.mp3>
cd work && python3 ../audio/align.py && cd ..   # write work/lines.txt first; add brand-word phonemes in align.py
python3 lips.py
```
Never alter the voice beyond `prep_voice.sh` (AUDIO.md).

## 4. Cast and character sheets (approval gate)
1. Register new characters in `cast.custom.js`.
2. Run `node shoot_sheet2.mjs tony,dex,extras,cast:M` and **look at** each `ref/sheet_*.png` at full size.
3. Fix colours, poses and heights, then send the sheets to the user before building scenes.

Characters must follow STYLE.md: professional poses, unambiguous extras, identical outfits, the same height in two-shots, and clean hands and shoulders.

## 5. Shot plan
Write `PLAN.md` with one row per beat:
- start time (from timing.json), and the words it covers;
- set or background, shot size and camera;
- characters with pose and mood, the on-screen text or prop that illustrates the line literally, and the SFX cue.

Vary shot sizes and land reactions 0–3 frames before the word.

## 6. Build the shots
Edit the SHOTS section of `vsl.js`, reusing its backgrounds, props, rigs and recipes (SCENES.md).

After each pass:
```
node render.mjs stills/a "$(python3 shot_stills.py)" 3
python3 sheet.py stills/a stills/a.jpg 9 220
```
Then **look at the sheet** and at full-size crops of anything suspicious: hands, shoulders, overlaps, cut-off text, mirrored text, story logic. Send the sheet to the user and keep going.

## 7. Render the frames
```
node render.mjs frames "0-<N-1>" 3     # N = frames printed by prep_voice.sh, about 40–70 ms per frame
```
For 4:5 as well:
```
HTML=vsl45.html node render.mjs frames45 "0-<N-1>" 3
```
Then check one still per shot and tune `Y0`.

Run long renders in the background and poll until they finish. `RESUME=1` continues an interrupted render.

## 8. Music, SFX and mix
1. Rewrite the `groove` / `melody` cues and the SFX `cues` lists in `audio/score.py` for this film's shots.
2. `DUR=<sec> python3 audio/score.py`
3. `python3 audio/mix.py`, and confirm the printed levels.

## 9. Finish and deliver
```
bash finish.sh "<Brand>_VSL_v1" both
```
This masters to −15 LUFS, encodes H.264 + AAC 320k, and runs QA (freezes, black frames, loudness).

Deliver the MP4s with SendUserFile and a short summary of what changed. Bump the version on every delivery (v2, v3…) and keep the old files.

## 10. Thumbnails (on request)
Add a `thumbXxx()` function next to the examples at the end of `vsl.js`, wire it in `renderThumb` (`?v=`), then run:
```
node shoot_thumb.mjs out/thumb.png "?v=xxx"
```
Follow the thumbnail layout in SCENES.md. All on-screen text is in the video's language, even when the user writes to you in another.

## Iterating on feedback (the client is a perfectionist)
- Treat every note as a symptom. Re-check the whole film for the same class of bug: render the pose sheet and a stills sheet, and crop to full size.
- Fix the root cause in `chars2.js` or the helpers, not per-shot patches.
- When only some shots changed, re-render only those frame ranges, then re-encode. Reuse the previous MP4's audio when the audio is unchanged.
- Never ship without looking at the frames you changed.

## Writing the script (when the user has none)
VSL arc, about 2.5–3 minutes and about 150 words per minute:
1. **Hook**: a character the viewer recognises, with a result.
2. **Problem**: how they get clients today, made concrete with two doors, costs and numbers.
3. **Agitation**: what breaks (one week off, an algorithm change, a flagged account).
4. **Reframe**: the treadmill metaphor.
5. **Mechanism**: a free community, onboarding and a viral loop.
6. **Proof beat**: one month later.
7. **Offer**: what the agency builds and what the client keeps.
8. **Risk reversal**.
9. **CTA**: a free call, "leave with a plan".
10. **Closing joke**.

Use a narrator plus a hero who reacts in short lines. Write in plain spoken English, with numbers written as words, and never describe what the viewer already sees. For ElevenLabs, give one voice per speaker, speed 1.0–1.1, stability about 50 %, and natural pauses between lines.

## Licences
- Open Peeps: CC0 (Pablo Stanley).
- Fonts Bungee, Baloo 2 and VT323: SIL OFL.
- Synth instruments: adapted from an MIT demo.
- The engine and cast code are the user's.
