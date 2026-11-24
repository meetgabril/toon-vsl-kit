# Buzztorm Studio

Buzztorm's cartoon content studio: one house style, many brands. Operated through the **Buzztorm Studio** plugin (`/studio`), entirely by menus.

```
plugin/buzztorm-studio/    the plugin (/studio): menus, content catalog, delivery rules
library/                   the Studio Library, shared by every brand
  engine/                  drawing and render engine (toon.js, vsl.js), Open Peeps parts, renderers
  audio/                   music, sound effects, mix, alignment
  tools/                   setup.sh <project_dir> <brand>, script, ingest, contact sheets, finish
  docs/                    Studio Standards and guides: STYLE, VIRAL, STORY, STYLES, FORMATS, CHARACTERS, SCENES, MOTION, AUDIO
  ref/                     style card, character sheets, backgrounds, props, scene and motion catalogs
  example/                 approved Buzztorm films used as references
  shared/                  backgrounds and props proposed by brands for every brand
  recipes/                 one spec per format (sizes, safe zones, parts, copy, limits) — the Content Factory
  memes/formats.json       structural meme formats, drawn only with each brand's own characters
  doc-templates/           branded HTML/CSS for PDFs (e-books, checklists, playbooks, worksheets, cheat sheets, lessons)
  goldens/                 reference pieces every engine change must keep passing
  tools/studio.py          project state machine + the Quality Gate (claims, facts, copy, CTA, layout, files)
  tools/build_doc.py · meme.py · voice.py   PDFs · meme layouts · optional ElevenLabs voice
brands/
  _template/               the structure every brand copies
  buzztorm/                Buzztorm, a brand like any other (brain/ = Brand Brain: audience, offers, CTAs, voice, claims, facts, proof, series, ideas)
legacy/                    the old toon-vsl skill (kept for reference)
```

## How a brand plugs in
Every brand fills the same ten colour roles in `brand-profile.json` (primary, primary_dark, accent, highlight, paper, paper_dark, positive, negative, secondary, tertiary). `setup.sh` turns them into `brand.js`; the engine draws with the studio defaults and swaps each role for the brand's colour at render time. The brand's characters (`characters/cast.custom.js`) and backgrounds (`backgrounds/sets.custom.js`) are copied into each project.

```
bash library/tools/setup.sh ~/studio/<brand>/<title> <brand>
```

`kit` is a link to `library` so older instructions keep working.

## Licences
- Open Peeps: CC0 (Pablo Stanley).
- Fonts Bungee, Baloo 2 and VT323: SIL OFL.
- Synth instruments: adapted from an MIT demo.
- The engine, characters and brand files belong to Buzztorm.
