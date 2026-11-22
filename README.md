# toon-vsl-kit

Kit for Claude's **toon-vsl** skill: every video and image (VSLs, shorts, ads, explainers, thumbnails, posts, banners, posters) in one consistent sitcom-toon style.

```
SKILL.md            the skill's instructions (a copy of what is saved in claude.ai)
kit/docs/           STYLE · CHARACTERS · SCENES · MOTION · FORMATS · AUDIO
kit/engine/         toon.js engine, Open Peeps parts, cast (chars2.js, cast.custom.js), pages, renderers
kit/example/        vsl.js: the complete Buzztorm film ("Coach Tony's Treadmill"), plus its timing and lips
kit/audio/          align.py (pocketsphinx), score.py + instruments.py (synth score/SFX), mix.py
kit/tools/          setup.sh · prep_voice.sh · lips.py · shot_stills.py · sheet.py · catalog.py · finish.sh
kit/ref/            style card, character sheets, sets and props sheets, CATALOG.md + scenes/ (every shot), motion/ (every movement), formats, thumbnails
```

Quick start: `bash kit/tools/setup.sh ~/vsl/demo && cd ~/vsl/demo && node render.mjs stills/smoke "75,2000" 1`

Licences:
- Open Peeps: CC0 (Pablo Stanley).
- Fonts Bungee, Baloo 2 and VT323: SIL OFL.
- Synth instruments: adapted from an MIT demo.
