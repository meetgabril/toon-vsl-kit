# SOUND: the house sound (Studio Standard)

Every brand shares this sound the way it shares the drawing style. Brands change the theme melody, the leitmotif instruments and the signature picks, never the palette below. Read this before scoring, before picking a sound and before adding anything to the library.

## 1. The idea: the picture, translated into sound
Our films look hand-made: flat colour, one plum ink, hard shade, a line that boils, film grain. They should sound hand-made too, like a mid-century TV cartoon crossed with a 90s sitcom. Real objects, real instruments, a little warmth and wobble, nothing slick.

| Picture (STYLE.md) | Sound rule |
|---|---|
| Flat colour, few shapes | Few, clear sounds. **One sound per idea**, never a stack of three "trailer" layers. |
| One plum ink for everything | One **ink bus**: every music and SFX track goes through the same tape warmth and the same small room (`stylize.py ink`). That glue is what makes 900 sounds from different packs feel like one show. |
| Hard-edged shade, hard cuts | **Hard cuts in sound too.** Music stops dead on the punchline (`silence`), no long fades, no swells into jokes. |
| Line boil (3 drawings at 12 fps) | **Sound boil**: a repeated sound is never identical. Round-robin takes (`sfx/<k>~2.wav`) plus ±35 cents and ±1.2 dB per hit (autoscore does it). |
| 4.5 % film grain | **Room tone under every scene** (`amb-*`, about −40 dB under the voice). Musical silence yes, digital silence never. |
| Pop with overshoot (`back` ease) | Appearing things get short, bright, upward pops; leaving things get downward zips. Sound direction follows motion direction. |
| One stylised transition per film | One **series bump** per film, the same one every time. |

## 2. The house orchestra
- **Lead voice of the brand**: theremin (Dex and the brand theme). It is our signature colour, like a sitcom's slap bass.
- **Rhythm section**: upright/analog bass, brushes and rim, small kit, claps, shaker.
- **Colour**: tuba (oom-pah, Tony), vibes / music box (Tony's Mom), nylon guitar, pizzicato, xylophone, rhodes, muted brass, tremolo strings for tension.
- **Foley**: wood, rubber, springs, kazoo, slide whistle, bike horn, real paper, real coins. Prefer acoustic sounds (Kenney, The Designer's Choice) over synthetic beeps.
- **Banned** (wrong picture): cinematic braams, sub drops and trailer hits, EDM risers and trap hats, glossy "corporate ukulele", stock meme sounds baked into the file (add those in the app), other companies' sonic logos.

## 3. Key, theme and moods
- Everything is in **D**: D minor for the problem, D major for the solution. Pitched SFX (ding, chime, sparkle) should sit on D, F#, A.
- **One theme, many moods** (theme and variations). Every cue plays the same melody, which is what makes a stranger recognise the brand by ear. Bank: `brands/<b>/music/` from `music_kit.py`; the same mood names drive story.js `music:`.

| Mood (`music:`) | When | Theme played on |
|---|---|---|
| `sitcom` | the problem, the set-up | theremin |
| `think` | explaining how it works | vibes over rhodes |
| `aerobics` | the grind, chaos, posting every day | xylophone over fast arps |
| `casino` | ads, money, paid traffic | muted brass over brushed swing |
| `tiptoe` | awkward, sneaky, the mistake | clarinet over tuba + pizzicato |
| `tension` / `build` | the drop, bad news / a real reveal | slowed theremin over tremolo strings |
| `folk` | the turn, the solution | nylon guitar (major) |
| `happy` | community, the win, the CTA | theremin (major) |
| `silence` | right before every punchline | nothing (room tone stays) |

## 4. Leitmotifs and the sonic logo
- Each main character owns the theme's first bar on their own instrument: Dex = theremin, Tony = tuba march, Tony's Mom = music box (`motif-*.wav`). Play it when the character first appears in a film, never more than once.
- **Sonic logo** = the first four notes of the theme (D-F-E-D) on brass + sparkle (`logo-sting`). **Series bump** = a pizzicato run up the same notes (`series-bump`). **Outro** = the head in major. **Button** = theremin ta-daa on the last joke. All four live in `brands/<b>/sfx/` and come in through `sfx.py kit`.

## 5. Voices that are not the script
- **Main characters react in their own voice.** Every character has a voice kit of 32 reactions (laughs, gasps, grunts, angry shouts, cheers, sighs…) recorded once in ElevenLabs v3/v4 with the character's own voice: `reactions.py script` → user records one take → `reactions.py split`. Use as events `voice-<char>-<id>`; they are mixed as dialogue (no boil, no ducking).
- **Extras** (`reactions` category) are generic people. They are never used for a named character.
- **Walla** (`walla` category) is always unintelligible, 20 to 24 dB under the voice, low-cut at about 200 Hz, wide. Clear words in a crowd compete with the voiceover and kill retention.
- Sitcom audience laughs: organic posts only, at most once per film, on the biggest joke.

## 6. Places
Every background has a room tone: gym → `amb-gym`, desk → `amb-studio`, living room → `amb-living-room`, beach → `amb-beach`, street → `amb-street`, office → `amb-office` + `walla-office`. The tone changes on the cut, exactly like the picture.

## 7. Visual style → sound style (`STYLE=<style> python3 stylize.py`)
| Visual style | Sound |
|---|---|
| Standard (`ink`), Freeze frame | ink bus: warm tape, small room |
| Old film | mono, 300 Hz–4 kHz, wow, projector crackle |
| Paper cut-out | dry, close, papery mids, no room |
| Risograph | light bit-crush and 16 kHz sample-and-hold, saturated |
| Noir | dark (3.8 kHz top), long smoky room |
| Comic | more drive, presence lift, tight room |
| Pastel | rounded highs, chorus, airy room |
| Dusk | warm 5 kHz top, long warm room |
| VHS | wobble + flutter, faint hiss, narrowed stereo |
The voice is never stylised.

## 8. Mix ladder (relative to the voice)
voice 0 dB · character reactions about 0 · SFX −8 to −12 · music −11 in gaps, about −19 under speech (mix.py ducks) · walla −20 to −24 · ambience −30 · room tone about −40. Master −15 LUFS integrated, about −1 dBTP (finish.sh). Nothing clips.

## 9. Pipeline
```
python3 sfx.py kit --brand <brand>                  # signature sounds + takes + stings into sfx/
node events.mjs && python3 audio/autoscore.py      # score + SFX from the story (mood names above, sound boil, ladder)
STYLE=<visual style> python3 audio/stylize.py      # the visual style's sound, on music + SFX only
python3 audio/mix.py && bash finish.sh "<name>" 916
```

## 10. Growing the library
- `sfx.py session [category]` prints the ElevenLabs Sound Effects sheet for every slot without a file. Generate once, name files `<id>.mp3`, then `sfx.py addall <folder> --source elevenlabs`. Never generate the same slot twice.
- Pack files are searchable with `sfx.py browse <words>`; promote one with `sfx.py add <id> <pack file> --source <source>`.
- Sources and licences: `library/sfx/sources.json`. The Designer's Choice files may never sit in a public repo.
