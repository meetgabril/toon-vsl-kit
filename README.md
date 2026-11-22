# toon-vsl-kit

Kit for Claude's **toon-vsl** skill: every video and image (VSLs, shorts, ads, explainers, thumbnails, posts, banners, posters) in one consistent sitcom-toon style.

```
SKILL.md            the skill's instructions (a copy of what is saved in claude.ai)
kit/docs/           VIRAL (hooks, sends, loops) · STORY (beat grammar) · STYLES (10 finishes) · STYLE · CHARACTERS · SCENES · MOTION · FORMATS · AUDIO
kit/engine/         toon.js engine, Open Peeps parts, cast, vsl.js (library + director), story.js (the film), pages, renderers
kit/example/        buzztorm_vsl.js (the approved film, hand-written) · script_example.md
kit/audio/          autoscore.py (music + SFX from the story) · score.py + instruments.py (synth) · mix.py · align.py
kit/tools/          setup.sh · script.py (ElevenLabs script) · ingest.py (upload → timing + visemes) · shot_stills.py · sheet.py · catalog.py · finish.sh
kit/ref/            style card, character sheets, sets and props sheets, CATALOG.md + scenes/ (every shot), motion/ (every movement), formats, thumbnails
```

Flow: `script.py el script.md` → user records in ElevenLabs → `ingest.py upload.mp4 script.md` → write `story.js` → `render.mjs` → `events.mjs` + `autoscore.py` + `mix.py` → `finish.sh`

Licences:
- Open Peeps: CC0 (Pablo Stanley).
- Fonts Bungee, Baloo 2 and VT323: SIL OFL.
- Synth instruments: adapted from an MIT demo.
