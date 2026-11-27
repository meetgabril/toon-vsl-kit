# SOUND: the house sound (Studio Standard)

**Every brand uses the same sound** (decision 24 Nov 2026), exactly like the drawing style: one theme, one orchestra, one signature, one library, in `library/sound/` (`identity.json`, `signature.json`, `music/`). Characters get their leitmotif from their role (narrator, hero, supporting). Read this before scoring or picking a sound.

## 0. Non-negotiable: everything is a real recording
- **Music** is performed by a real recorded orchestra: VS Chamber Orchestra Community Edition (Versilian Studios, CC0), curated in `library/instruments/vsco/` (pizzicato strings and bass, tuba, clarinet, bassoon, flute, piccolo, trumpet incl. harmon mute, trombone, horn, xylophone, glockenspiel, marimba, harp, upright piano, timpani, snare, bass drum, woodblocks, slapstick, ratchet, vibraslap, cymbals, triangle, bells). `orchestra.py` picks the right recorded note, velocity layer and round-robin take, adds human timing and dynamics and one shared room. Pitches in `map.json` are measured (VSCO names use C3 = middle C).
- **SFX** come from recorded libraries (The Designer's Choice CARTOON, Kenney, VSCO, studio layers of those). Crowds and ambiences come from recorded walla (to download: Sonniss GDC, Freesound CC0). Character reactions are the character's own ElevenLabs voice.
- **No synth sound is delivered.** If a slot has no real file, autoscore leaves it silent and reports it; `sfx.py kit` lists it as MISSING. Synth exists only for drafts (`SYNTH_SFX=1`).

## 1. The idea: the picture, translated into sound
Our films look hand-made: flat colour, one plum ink, hard shade, a boiling line, film grain. They sound like a hand-made TV cartoon: a small studio orchestra (the Carl Stalling / sitcom tradition), real foley, real voices.

| Picture (STYLE.md) | Sound rule |
|---|---|
| Flat colour, few shapes | **One sound per idea.** Never a stack of "trailer" layers. Small orchestra, never a wall of sound. |
| One plum ink for everything | **One room and one tape warmth** for all music and SFX (`stylize.py`, the ink bus). That glue makes sounds from different libraries feel like one show. |
| Hard-edged shade, hard cuts | **Hard cuts in sound.** The music stops dead before the punchline (`silence`), no long fades. |
| Line boil | **Sound boil.** A repeated sound is never identical: round-robin takes (`sfx/<k>~2.wav`), ±35 cents, ±1.2 dB. The orchestra does the same with its round robins and human timing. |
| Film grain | **Room tone under every scene.** Musical silence, yes; digital silence, never. |
| Pop with overshoot | Things that appear go up (pizz, xylo climb); things that leave go down (zip, xylo fall, slide whistle). |
| One stylised transition per film | **One series bump per film**, the same every time. |

## 2. The house orchestra and what it may play
Lead colours: clarinet, bassoon (sneaky), muted trumpet (wah), tuba (oom-pah), flute, glockenspiel and xylophone. Rhythm: pizzicato double bass (walking), upright piano comping, woodblock, snare, light cymbal. Drama: tremolo strings, timpani, horn.
**Banned:** synth pads and leads, cinematic braams and sub drops, EDM risers, trap hats, "corporate ukulele", meme sounds baked into the file (add those in the app), other companies' sonic logos.

## 3. One theme, many moods
The studio has ONE 16-beat theme (`library/sound/identity.json` → `theme`) in D. Bar 1 (D-F-E-D) is the **sonic logo**. Minor for the problem; `theme_major` for the solution. The orchestra plays the same theme in every mood, on the lead the identity assigns. Long sections develop every 8 bars: **A** (lead) → **B** (lighter percussion, no tune: room for the voice) → **A'** (the theme on `alt_leads`):

| Mood (`music:` in story.js) | When | Default lead |
|---|---|---|
| `sitcom` | the problem, the set-up | clarinet over walking pizz bass + piano |
| `think` | explaining how it works | glockenspiel over harp |
| `aerobics` | the grind, chaos, posting every day | xylophone over spiccato strings + tuba |
| `casino` | ads, money, paid traffic | muted trumpet over swing bass + piano |
| `tiptoe` | awkward, sneaky, the mistake | bassoon over pizzicato + woodblock |
| `tension` / `build` | the drop, bad news / a real reveal | slow cello over tremolo strings + timpani |
| `folk` | the turn, the solution | flute over harp + marimba |
| `happy` | community, the win, the CTA | trumpet over a tuba march |
| `silence` | before every punchline | nothing (room tone stays) |

`orchestra.py kit` renders into `library/sound/music/` (.ogg): 8 moods, `motif-narrator|hero|supporting`, `logo-sting`, `series-bump`, `outro`, `button`, and the musical gags (`sad-trombone`, `xylo-climb`, `xylo-fall`, `harp-gliss`, `dramatic-sting`, `rimshot`, `tiptoe-pizz`, `drumroll`, `wah-trumpet`, `tuba-plonk`). `orchestra.py audition` renders `theme_candidates` if the studio ever changes its theme.

## 4. The signature: one sound per idea
`library/sound/signature.json`: `events` (studio library sound for each engine event: pop, ding, stamp, whoosh, boing…), `musical` (the gags and leitmotifs above, used as event types in story.js), `signature` (stings). `places` maps every background set to a room tone + walla (default: room tone). `sfx.py kit` copies all of it into the project; each event id is a list, so a public CC0 sound takes over when the private licensed one is absent. The interface itself is played by the orchestra, in key (check = glock up, wrong = bassoon bwomp, sent = pizz, like = woodblock, portal = harp + slapstick). Never pick a different sound for an event inside one video; change the signature instead.

## 5. Voices that are not the script
- Main characters react in **their own voice**: 32 reactions recorded once in ElevenLabs v3/v4 with audio tags (`reactions.py script` → one take → `reactions.py split`). Events `voice-<char>-<id>`, mixed as dialogue.
- Extras (`reactions` category) are generic people, never a named character.
- Walla is unintelligible, 20 to 24 dB under the voice, low-cut at about 200 Hz, wide. Sitcom audience laughs: organic posts only, once per film at most.

## 6. Places, styles, mix
- **Immersion is automatic.** autoscore reads each beat's `set` and lays that place's room tone and walla under the scene, starting at a random point of the recording, crossfading 0.35 s on the cut. A character's first appearance (`enter` event from vsl.js) plays the leitmotif of their role once.
- Visual style → `STYLE=<style> python3 stylize.py` on music + SFX only (ink, oldfilm, paper, riso, noir, comic, pastel, dusk, freeze, vhs). The voice is never processed.
- Mix ladder vs the voice (measured on a test scene): reactions ≈ 0 · SFX −10, 3 dB lower while someone talks · music: bed −11 in gaps / −19 under speech, melody stem −27 under speech (a tune fights words) · walla −22 · ambience −30. SFX are levelled by short-term loudness, not peak. The orchestra's room rings 0.8 s into the next scene. Master −15 LUFS, ≈ −1 dBTP.

## 7. Pipeline
```
python3 sfx.py kit                               # signature, gags, stings, takes → sfx/ (reports anything missing)
node events.mjs && python3 audio/autoscore.py   # real-orchestra score in the brand's theme + SFX + sound boil + ladder
STYLE=<visual style> python3 audio/stylize.py   # the style's sound on music + SFX
python3 audio/mix.py                             # make.sh runs all of this, cached, in parallel with the render
```

## 8. Public and private library
- `library/sfx/files/` (git): CC0 and studio-made sounds (Kenney, VSCO orchestra, studio layers). Always present.
- `library/sfx/files-licensed/` + `packs/designers-choice/` + `packs/sonniss-gdc/` + `packs/sonniss-gdc2/` (git-ignored): The Designer's Choice CARTOON and Sonniss GDC 2018/2019/2020/2026 picks (walla, ambiences, reactions, cartoon foley). Licences allow commercial use with no credit but forbid redistribution. Rebuild in any session: stage `~/Downloads/buzztorm-cartoon-ogg.tar` `~/Downloads/buzztorm-gdc/buzztorm-gdc-picks.tar` and `~/Downloads/buzztorm-gdc/buzztorm-gdc-picks2.tar` from Gabriel's Mac, then `python3 library/sfx/import_licensed.py <tars>`. sfx.py prefers the licensed file and falls back to the public one. Small-group reactions (`crowd-laugh`, `walla-angry-mob`) are built by the import from real single-person takes, stacked with offsets and stereo spread. Still without a real recording (the slot stays silent): tape-rewind, camera-shutter, screenshot, typing, cash-count, voice-note, pen-scribble, printer, mic-tap, crowd-ooh, walla-crowd-ooh, walla-whisper, extra-happy-yay, extra-baby-giggle.

## 9. Growing the library
`sfx.py session [category]` prints what still has no file (with ElevenLabs prompts, but prefer recorded libraries first); `sfx.py addall <folder> --source <id>` registers a batch; `sfx.py browse <words>` searches the raw packs. Licences in `library/sfx/sources.json`. The Designer's Choice files never sit in a public repo.
