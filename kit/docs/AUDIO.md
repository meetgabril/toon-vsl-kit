# Audio: voice, timing, lip sync, score, SFX and mix

## Golden rule: the voice is sacred
The user's ElevenLabs voiceover is the master clock and the star.
- **Never** pitch-shift, time-stretch, de-ess hard, heavily compress or limit it. An earlier version did, and the client heard the quality loss immediately.
- The only processing allowed is a 70 Hz high-pass plus a gentle 2:1 compressor (`prep_voice.sh` → `work/voice_clean.wav`, 48 kHz).
- The picture is timed to the voice. When something doesn't fit, change the picture, never the audio.

## 1. Script → lines.txt
Write `work/lines.txt` with one speech turn per line: `SPEAKER|exact text as spoken`.
```
D|This is Tony. Celebrity fitness coach.
T|If I miss a day, I feel it.
```
- `D` = narrator (Dex), `T` = Tony, and any other letter is a character from `cast.custom.js`.
- The text must match the audio word for word. If the user edited the script while recording, ask for the final text.

## 2. Alignment → timing.json
```
bash prep_voice.sh /path/voice.mp3        # → work/voice.mp3, voice16.raw, voice_clean.wav; prints duration and frame count
cd work && python3 ../audio/align.py      # pocketsphinx forced alignment → timing.json {words:[[w,t0,t1,line]], lines:[{sp,t0,t1,text}]}
```
- Brand or invented words need a pronunciation line in align.py, for example `d.add_word('buzztorm','B AH Z T AO R M',True)`. It uses ARPAbet phonemes. Add one for each brand word, or alignment drifts after it.
- Sanity-check by printing each line's t0–t1. Pauses should fall between lines.

## 3. Lip sync → lips.json
`python3 lips.py` reads the RMS of the clean voice per frame (24 fps). It normalises by the 92nd percentile of speech and closes the mouth in gaps between words longer than 0.12 s. The speaker per frame comes from the line times.
- The characters' wrappers read it: a mouth opens only when `sp` equals that character.
- Head nods follow the speech energy.

## 4. Score and SFX → music/music.wav, music/sfx.wav
`DUR=<seconds> python3 audio/score.py`. Everything is synthesised in numpy (`audio/instruments.py`, MIT-derived), so there are no samples and no licensing issues.

### Music
- `groove(t0, t1, chords, bassroots, style, vol)` with styles `sitcom think casino aerobics island folk`.
- `melody(THEME, t0, vol)` plays a theremin lead. Extra layers: `strings_trem` (dread), `pad`, `brass` (button), `xylo` (sparkle run), `tuba` wah-wahs, `noise_riser`.
- **Arc** used in the Buzztorm film:
  1. A minor sitcom groove for the problem.
  2. "Think" for explanations.
  3. "Casino" for ads.
  4. "Aerobics" for the hustle.
  5. Strings for the algorithm drop.
  6. Silence for the twist.
  7. Major "folk" or "sitcom" for the solution and the community.
  8. A brass hit on the brand name.
  9. A theremin button on the last joke.
- `hard_cut(a, b)` gives musical silences under punchlines. Silence is the strongest SFX.

### SFX
`cues += [(time, sound(), gain)]`. Available sounds:
- **UI and reveals**: pop, ding, chaching, coin, click, beep, sparkle
- **Motion**: whoosh, slide, portal
- **Impacts and fails**: thud, stamp, boing, powerdown, buzz
- **Objects**: page, chalk, creak, whir
- **People**: steps, cheer, gulp
- **Ambience**: waves

Each is placed at its visual event, with times in seconds from your shots. Use a pop for each element that appears, a ding or chaching for money and growth, a stamp for verdict stamps, and a whoosh on big moves.

Rewrite the cue lists for every new film. The Buzztorm ones are only an example.

## 5. Mix → music/mix_raw.wav
`python3 audio/mix.py` measures gated RMS and sets:
- **music**: 11 dB under the voice, ducked another 8 dB while anyone speaks, with a 9 kHz low-pass so it never fights the consonants.
- **SFX**: 10 dB under the voice, with peaks capped at 0.7× the voice peak.

It prints the measured levels. Confirm them every time.

## 6. Master and encode (finish.sh)
`bash finish.sh "Name" both`:
1. One linear gain to **−15 LUFS** integrated, then a limiter (about −1.3 dBFS sample peak, around −1 dBTP).
2. AAC at 320k.
3. H.264 CRF 19 (preset veryfast, maxrate 14M), 24 fps. It encodes 9:16 from `frames/` and 4:5 from `frames45/` (scaled to 1080×1350).
4. QA prints: freezes of 0.6 s or more, black frames, integrated loudness and peak.

When only the picture changed, you can reuse the audio from the previous MP4 (`-map 1:a -c:a copy`).
