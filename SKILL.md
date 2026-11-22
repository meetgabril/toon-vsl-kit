---
name: toon-vsl
description: Make any cartoon video or image in the user's sitcom-toon style (Open Peeps cast, Tony/Dex, plum ink): VSLs, shorts, ads, explainers, thumbnails, posts, carousels, banners, posters, character sheets. Use for any of these.
---

# Toon studio

**Flow: script (with emotions) → the user records it in ElevenLabs and uploads one file → you build everything.**
You write a short `story.js` (one beat per shot). The engine handles:
- timing to the words, phoneme lip sync, layout and motion;
- sound effects, music, mix;
- 9:16, 4:5, 1:1 and 16:9, captions.

Keep token use low: read only the docs a step needs, write beats rather than code, and look at contact sheets rather than single frames.

## 0. Kit (every session)
```
git clone https://github.com/meetgabril/toon-vsl-kit ~/toon-vsl-kit   # if it fails: add_repo(owner meetgabril, repo toon-vsl-kit, access push), then clone
bash ~/toon-vsl-kit/kit/tools/setup.sh ~/toon/<slug> && cd ~/toon/<slug>
```
Docs are in `kit/docs`, references in `kit/ref`. Always read **VIRAL.md** (hooks, send triggers, loops, scorecard), **STYLE.md** (rules) and **STORY.md** (beat grammar). Read the others only when needed:
- STYLES.md: other finishes (oldfilm, paper, riso, noir, comic, pastel, dusk, freeze, vhs), per film or per beat.
- CHARACTERS.md: new characters.
- FORMATS.md: non-9:16 formats, stills, other video types.
- MOTION.md / ref/CATALOG.md: recipes from the approved film.
- AUDIO.md and SCENES.md.

## 1. Script for ElevenLabs (stop and wait for the upload)
The goal is **sends**, not views (VIRAL.md). Design each script:
- a hook in 1–3 s, for example a verified, bizarre historical fact that pivots with a joke to the topic;
- one archetype the viewer will send it to;
- high-arousal payoffs (awe or a laugh);
- a button joke;
- a last line that loops into the first.

Write `script.md` (format and a full viral example: `kit/example/script_example.md` + `story_example_viral.js`):
- `lang:`, plus one `voice X:` line per speaker describing the voice.
- One line per speech turn: `X: [emotion] text`.
- **Tags** (Eleven v3): `[excited] [warm] [curious] [whispers] [sighs] [laughs] [sarcastic] [serious] [shouting]`, one or two per line.
- **Wording**: numbers as words, short sentences, the hook in line 1.

Run `python3 script.py check script.md`, which shows the hook length, long sentences and the loop join. Score it with the VIRAL.md scorecard and rewrite anything under 4/5. Facts used as hooks must be verified with a web search.

Then run `python3 script.py el script.md` and give the user:
- the contents of `work/elevenlabs_dialogue.txt` (in a code block);
- the voice descriptions;
- "Paste it into ElevenLabs (Text to Dialogue or Studio, Eleven v3) and export ONE file (mp3/wav/mp4) with all lines in order. Upload it here."

Don't build anything before the upload arrives.

## 2. Ingest the upload
```
python3 ingest.py <upload> script.md
```
This writes timing and mouth shapes to `work/` and prints the line times. If the user changed words while recording, update `script.md` to match the audio and run it again. Non-English uses energy alignment automatically.

## 3. Cast (only if there are new characters)
1. Add each new character with `addCast` in `cast.custom.js`.
2. Run `node shoot_sheet2.mjs cast:X` and **look** at the sheet.
3. Send it for approval before building.

Reuse Tony and Dex as they are.

## 4. Story
Write `story.js`: one beat per sentence or punchline (STORY.md).
1. Check: `node render.mjs stills/a "$(python3 shot_stills.py 0.5)" 3 && python3 sheet.py stills/a stills/a.jpg 8 220` and look at the sheet.
2. Fix overlaps, empty frames and illogical moments.
3. Send the sheet to the user.

**The story must make literal sense on screen.** Every number and screen answers the line it illustrates. Use `style:` switches with meaning (`oldfilm` for the history hook, `freeze` + `label` for "yep, that's me"), and `loop: 0.4` for shorts.

## 5. Render and sound
```
node render.mjs frames "0-<N-1>" 3                       # N from ingest; add AR=45|11|169 → frames<fmt>, CAP=1 for captions
node events.mjs && python3 audio/autoscore.py && python3 audio/mix.py
bash finish.sh "<Brand>_<Piece>_v1" 916            # or 916,45 …; masters −15 LUFS, encodes, QA
```
- Run renders over ~2 min in the background and poll.
- The voice is never altered: only the high-pass and gentle compression done in ingest.
- Deliver with SendUserFile, plus 3–5 lines on what's in it and the packaging from VIRAL.md: cover text, a caption that invites a tag without asking, and 2–3 cut-down ideas. Bump the version on every change.

## 6. Stills (thumbnails, posts, banners)
1. Add a `thumbXxx()` design at the end of `vsl.js` and wire it in `renderThumb`.
2. Run `node shoot_thumb.mjs out/x.png "?v=xxx&w=1080&h=1920"`.

Layouts per format are in FORMATS.md. On-screen text is always in the deliverable's language.

## Feedback loop (the client is a perfectionist)
- Treat every note as a symptom. Re-check the whole film for that class of problem with a stills sheet and full-size crops.
- Fix the root cause, then re-render only the affected frame ranges (`RESUME=1` or explicit ranges) and re-encode.
- Never ship without looking at what changed.

## After each project (grow the library)
1. `python3 catalog.py frames ref`.
2. Re-render the galleries (`?v=style`, `?v=props`, `?v=sets&i=N`, `?v=mouths`) when sets or props were added.
3. Commit any new sets, props, characters (`cast.custom.js` + sheets), story recipes and their reference images back to the kit, and push to `meetgabril/toon-vsl-kit`.

## Writing scripts
- **VSL** (2.5–3 min, about 150 words per minute). The Buzztorm example for each step is in brackets:
  1. **Hook**: a character the viewer recognises, with a result.
  2. **Problem**: how they get clients today, made concrete with numbers (two doors, costs).
  3. **Agitation**: what breaks (one week off, an algorithm change, a flagged account).
  4. **Reframe**: a metaphor (the treadmill).
  5. **Mechanism** (a free community, onboarding and a viral loop).
  6. **Proof beat** (one month later).
  7. **Offer**: what the agency builds and what the client keeps.
  8. **Risk reversal**.
  9. **CTA** (a free call, "leave with a plan").
  10. **Closing joke**.
- **Short** (15–60 s): the first line is the hook stated as fact, then 2–4 escalating beats, with the twist on the last word.
- **Ad** (6–30 s): problem → solution → proof number → CTA.
- **Explainer**: question → 3 steps → result → CTA.

Use a narrator plus a hero who reacts in short lines. Write in plain spoken language, with numbers written as words, and never describe what the viewer already sees. Voices: one per speaker, speed 1.0–1.1, stability about 50 %, natural pauses between lines.

## Licences
- Open Peeps: CC0 (Pablo Stanley).
- Fonts Bungee, Baloo 2 and VT323: SIL OFL.
- Synth instruments: adapted from an MIT demo.
- The engine and cast code are the user's.
