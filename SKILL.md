---
name: toon-vsl
description: Make any cartoon video or image in the user's sitcom-toon style (Open Peeps cast, Tony/Dex, plum ink): VSLs, shorts, ads, explainers, thumbnails, posts, carousels, banners, posters, character sheets. Use for any of these.
---

# Toon studio: every video and image in one consistent cartoon style

This skill produces the user's house style, first built for the approved Buzztorm VSL "Coach Tony's Treadmill":
- flat Open Peeps characters with thick plum ink, lip-synced to the user's voice;
- a hand-built 2D vector engine and synthesized music and SFX.

It covers **every format**:
- **Video**: VSLs, shorts, reels and TikToks, ads, explainers, testimonials, demos and loops, in 9:16, 4:5, 1:1 and 16:9.
- **Stills**: thumbnails, feed posts, carousels, banners, posters and stickers.
- **Character sheets.**

The only paid tools are Claude and ElevenLabs. Everything else is code in the kit.

**Consistency is the point.** Every new piece reuses the same cast, outfits, palette, sets, props, scenes and motion from the reference library, so all the brand's content looks like one show.

## 0. Get the kit (first, every session)
The kit lives in the user's private repo **`meetgabril/toon-vsl-kit`**.
```
git clone https://github.com/meetgabril/toon-vsl-kit ~/toon-vsl-kit
```
If the clone fails (auth or 404), call the session's `add_repo` tool with owner `meetgabril`, repo `toon-vsl-kit` and access `push`, then clone as it instructs. Never pre-check with curl.

Read before planning (docs are in `kit/docs/`, references in `kit/ref/`):
- **STYLE.md**: the look and the client's art-direction rules. Also look at `ref/style_card.jpg`.
- **CHARACTERS.md**: the cast, the API, and how to build new characters. Look at `ref/sheet_*.jpg`.
- **SCENES.md**: the engine, shot anatomy, ready-made sets and props, recipes, captions and galleries. Look at `ref/sets_sheet.jpg` and `ref/props_sheet.jpg`.
- **MOTION.md**: house timings and every movement in the film. Look at the strips in `ref/motion/`.
- **FORMATS.md**: every video and image type and canvas size, with layout rules.
- **AUDIO.md**: voice rules, alignment, lip sync, score, mix and master.
- **ref/CATALOG.md + ref/scenes/**: every shot of the approved film, with its code line range. Reuse these before inventing.

Requirements: Node 22+, Playwright + Chromium, Python 3 (numpy, scipy, soundfile, Pillow, pocketsphinx) and ffmpeg. `setup.sh` links or installs what's missing.

## 1. Intake
Ask only what you can't infer (use AskUserQuestion):
- **Deliverable type and formats**: see FORMATS.md.
- **Script or copy**: if there's none, write it (see "Writing scripts").
- **Voiceover**: optional. Without one, the piece is timed to music or on-screen text.
- **Brand, CTA and on-screen language**: on-screen text is always in the deliverable's language, even when the user writes to you in another.
- **Cast**: reuse Dex and Tony, or design new characters.

## 2. Project setup
```
bash ~/toon-vsl-kit/kit/tools/setup.sh ~/toon/<slug>
cd ~/toon/<slug>
node render.mjs stills/smoke "75,2000" 1     # the template (the Buzztorm film) renders immediately
```

## 3. Timing
- **With a voiceover**:
  ```
  bash prep_voice.sh <voice.mp3>
  # write work/lines.txt (SPEAKER|text), then:
  cd work && python3 ../audio/align.py && cd ..
  python3 lips.py
  ```
  Never alter the voice beyond `prep_voice.sh`.
- **Without a voiceover**: hand-write `work/timing.json` and an all-closed `lips.json`, and time cuts to the music grid (FORMATS.md).
- **Stills**: skip this step.

## 4. Cast and character sheets (approval gate)
1. Register new characters in `cast.custom.js`.
2. Run `node shoot_sheet2.mjs tony,dex,extras,cast:<KEY>` and **look at** each sheet at full size.
3. Fix colours, poses and heights, then send the sheets to the user before building.

Characters follow STYLE.md: professional poses, unambiguous extras, identical outfits, the same height in two-shots, and clean hands and shoulders.

## 5. Plan
Write `PLAN.md` with one row per beat (or one per image):
- time and words;
- set or background, shot size and camera;
- characters with pose and mood;
- the on-screen text or prop that illustrates the line literally;
- the motion (a MOTION.md technique) and the SFX cue.

Name the catalogued scene, set, prop or motion you're reusing for each row.

## 6. Build
- **Video**: edit the SHOTS section of `vsl.js`.
- **Stills**: add a `thumbXxx()` design at the end of vsl.js and wire it in `renderThumb` (`?v=`).

After each pass:
```
node render.mjs stills/a "$(python3 shot_stills.py)" 3        # add AR=<fmt> for other formats
python3 sheet.py stills/a stills/a.jpg 9 220
```
For stills: `node shoot_thumb.mjs out/x.png "?v=xxx&w=1080&h=1350"`.

**Look at** the sheet and at full-size crops: hands, shoulders, overlaps, cut-off or mirrored text, story logic. Send drafts to the user early.

## 7. Render the video
```
node render.mjs frames "0-<N-1>" 3                  # 9:16; about 40–70 ms per frame
AR=45 node render.mjs frames45 "0-<N-1>" 3          # also AR=11 → frames11, AR=169 → frames169; CAP=1 for captions
```
Tune `Y0[fmt][shot]` after a stills check for each extra format.

Run long renders in the background and poll until they finish. `RESUME=1` continues an interrupted render.

## 8. Music, SFX and mix
1. Rewrite the cues in `audio/score.py` for this piece.
2. `DUR=<sec> python3 audio/score.py`
3. `python3 audio/mix.py`, and confirm the printed levels.

## 9. Finish and deliver
```
bash finish.sh "<Brand>_<Piece>_v1" 916,45      # any of 916,45,11,169
```
This masters to −15 LUFS, encodes H.264 + AAC 320k, and runs QA.

Deliver with SendUserFile and a short summary. Bump the version on every delivery and keep the old files.

## 10. Grow the library (after every project)
1. `python3 catalog.py frames ref`: add the new scenes to the catalog.
2. Re-render the galleries (`?v=style`, `?v=props`, `?v=sets&i=N`) when sets or props were added, and register new sets in `SETS` and new props in `galleryProps()`.
3. Copy reusable sets, props, characters (`cast.custom.js` + sheets), recipes and motion notes back into the kit (`kit/example/vsl.js`, `kit/engine/`, `kit/docs/`, `kit/ref/`).
4. Commit and push to `meetgabril/toon-vsl-kit` so the next session starts with everything.

## Iterating on feedback (the client is a perfectionist)
- Treat every note as a symptom. Re-check everything for the same class of bug: render the character sheets and a stills sheet, and crop to full size.
- Fix the root cause in `chars2.js` or the helpers, not per-shot patches.
- When only some shots changed, re-render only those frame ranges, then re-encode. Reuse the previous MP4's audio when the audio is unchanged.
- Never ship without looking at what you changed.

## Writing scripts (when the user has none)
- **VSL** (2.5–3 min, about 150 words per minute):
  1. Hook: a character the viewer recognises, with a result.
  2. Problem, made concrete with numbers.
  3. Agitation: what breaks.
  4. Reframe: a metaphor.
  5. Mechanism.
  6. Proof beat.
  7. Offer.
  8. Risk reversal.
  9. CTA.
  10. Closing joke.
- **Short** (15–60 s): the first line is the hook stated as fact, then 2–4 escalating beats, with the twist on the last word.
- **Ad** (6–30 s): problem → solution → proof number → CTA.
- **Explainer**: question → 3 steps → result → CTA.

Use plain spoken language and numbers written as words, and never describe what the viewer already sees. For ElevenLabs, give one voice per speaker, speed 1.0–1.1, stability about 50 %, and natural pauses between lines.

## Licences
- Open Peeps: CC0 (Pablo Stanley).
- Fonts Bungee, Baloo 2 and VT323: SIL OFL.
- Synth instruments: adapted from an MIT demo.
- The engine and cast code are the user's.
