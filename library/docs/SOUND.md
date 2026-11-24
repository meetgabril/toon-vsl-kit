# SOUND: the house sound (Studio Standard)

Every brand shares this sound the way it shares the drawing style. A brand owns its theme, its instruments per character and its stings (`sound-identity.json`, `sound-signature.json`); it never changes the rules below. Read this before scoring, picking a sound or adding a brand.

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

## 3. Brands: one theme, many moods
Each brand has ONE 16-beat theme (`sound-identity.json` → `theme`) in a key of its own. Bar 1 (4 or 5 notes) is the **sonic logo** and must be singable alone. Minor for the problem; `theme_major` for the solution. The orchestra plays the same theme in every mood, on the lead the identity assigns:

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

**Adding a brand** (references/brands.md step 6): write 3 different themes into `theme_candidates`, `orchestra.py audition <brand>`, the user picks one; give each main character a different instrument; `orchestra.py kit <brand>` renders into `brands/<b>/music/`: 8 moods, `motif-<character>`, `logo-sting`, `series-bump`, `outro`, `button`, and the musical gags (`sad-trombone`, `xylo-climb`, `xylo-fall`, `harp-gliss`, `dramatic-sting`, `rimshot`, `tiptoe-pizz`, `drumroll`, `wah-trumpet`, `tuba-plonk`), all in the brand's key. Store as .ogg (brand .wav files are git-ignored).

## 4. The signature: one sound per idea
`sound-signature.json`: `events` (studio library sound for each engine event: pop, ding, stamp, whoosh, boing…), `musical` (the gags and leitmotifs above, used as event types in story.js), `signature` (stings). `sfx.py kit --brand <b>` copies them all into the project. Never pick a different sound for an event inside one video; change the signature instead.

## 5. Voices that are not the script
- Main characters react in **their own voice**: 32 reactions recorded once in ElevenLabs v3/v4 with audio tags (`reactions.py script` → one take → `reactions.py split`). Events `voice-<char>-<id>`, mixed as dialogue.
- Extras (`reactions` category) are generic people, never a named character.
- Walla is unintelligible, 20 to 24 dB under the voice, low-cut at about 200 Hz, wide. Sitcom audience laughs: organic posts only, once per film at most.

## 6. Places, styles, mix
- Every background has a room tone (`amb-*`), changing on the cut like the picture.
- Visual style → `STYLE=<style> python3 stylize.py` on music + SFX only (ink, oldfilm, paper, riso, noir, comic, pastel, dusk, freeze, vhs). The voice is never processed.
- Mix ladder vs the voice: reactions ≈ 0 · SFX −8 to −12 · music −11 in gaps, ≈ −19 under speech · walla −20 to −24 · ambience −30 · room tone ≈ −40. Master −15 LUFS, ≈ −1 dBTP.

## 7. Pipeline
```
python3 sfx.py kit --brand <brand>               # signature, gags, stings, takes → sfx/ (reports anything missing)
node events.mjs && python3 audio/autoscore.py   # real-orchestra score in the brand's theme + SFX + sound boil + ladder
STYLE=<visual style> python3 audio/stylize.py   # the style's sound on music + SFX
python3 audio/mix.py && bash finish.sh "<name>" 916
```

## 8. Growing the library
`sfx.py session [category]` prints what still has no file (with ElevenLabs prompts, but prefer recorded libraries first); `sfx.py addall <folder> --source <id>` registers a batch; `sfx.py browse <words>` searches the raw packs. Licences in `library/sfx/sources.json`. The Designer's Choice files never sit in a public repo.
