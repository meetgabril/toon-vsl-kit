# Discord

The brand's community content, made with the brand's own characters. Discord delivery = files + a message to paste. Discord has no hashtags; `#` starts a heading.

## Specs
| Asset | Size and format | Limit | Notes |
|---|---|---|---|
| Emoji | 128×128 PNG, or GIF if animated, transparent | 256 KB | One per character mood. Name: `<character>_<mood>` (`tony_flex`) |
| Sticker | exactly 320×320; PNG static, APNG (or GIF) animated | 512 KB | Needs a related emoji and a description (the Alt text). Slots: 5 without Boost, 15 at Boost level 1, 30 at level 2 |
| Soundboard sound | MP3 | 512 KB, up to 5 s | Cut from approved voiceovers (catchphrases), the sonic logo or house sound effects |
| Event cover | at least 800×400 | — | Discord crops toward the centre after the event is created: keep everything important in the middle half |
| Server banner | 960×540 (16:9; 1920×1080 is resized) | — | Needs Boost level 2 |
| Invite background | 1920×1080 JPG or PNG | — | No logo or text on it |
| Server icon | 512×512 | — | The brand's main character or logo |
| Announcement image | GIF or MP4 | keep under the server's upload limit | 3–6 s loop teaser |

Check the brand's `discord.boost_level` in the Brand Profile before offering banners or more stickers than the slots allow.

## Making the assets
- Emoji: render each character mood as a bust on a transparent background (sticker/transparent PNG layout in `library/docs/FORMATS.md`), crop tight to the head, downscale to 128×128. The engine moods: calm, smile, happy, serious, worried, fear, hopeful, driven, sad, cheeky, tired, sleep, blank. Animated emoji: 8–12 fps, 32–64 colours to stay under 256 KB.
- Stickers: character loops (wave, flex, laugh, nod, facepalm). Last frame = first frame. Export APNG; compress until under 512 KB.
- Soundboard: cut with ffmpeg from `work/voice_clean.wav`, fade in/out 20 ms, normalise to −16 LUFS, MP3 128 kbps, check the size.

## Script types for Announcement (screen 3)
Episode drop ★ · Challenge kickoff · Win of the week · More (Weekly recap comic · Countdown · Rules reminder).
Event (title from the user): Live/AMA ★ · Workshop · Challenge · Watch party.

## Message format
```
# <emoji> <headline, under 8 words>
<1–2 lines: what it is and why it matters now>
-# <small print: the challenge rule, the time, or the hidden-detail prompt>
<mention, only if the Mention option is not None>
```
Plus `thread-starter.md`: the first message of the discussion thread (a question that invites replies).

Example (Buzztorm · Episode drop):
```
# 🎬 Tony did it again
Episode 7 is live. He finally took off the ring light… almost.
-# Spot the hidden gag in the first 2 seconds. First right answer gets the 🏆 Eagle Eye role.
```

## Server assets (one set per brand)
Server icon, banner (if Boost level 2), invite background, welcome GIF (main character waving), rules card (comic style, one rule per panel), role-unlock cards (e.g. Rookie → Regular → Legend). Save the final files' names in the Brand Profile under `discord`.
