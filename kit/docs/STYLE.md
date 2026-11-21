# Style bible: premium sitcom-toon VSL

This is the look the client approved on "Coach Tony's Treadmill" (the Buzztorm VSL, v17). Match it unless the user asks for something else. The reference images are in `ref/`: `sheet_*.jpg`, `frames_4x5_*.jpg` and `thumb_*.jpg`.

## Look
- **Characters** use Open Peeps (Pablo Stanley, CC0): flat colour, thick dark-plum ink (`#17141c` / `#1b1422`) and no gradients on bodies. Tony is the exception. He has a custom muscular rig drawn in the same ink style.
- **World** pieces are built by toon.js from flat shapes. Lines are a constant 7 px at 1080 wide, whatever the zoom. A light "boil" (3 drawings cycling at 12 fps) keeps lines hand-drawn and alive. Use `boil:0` for big background fills.
- **Shading** is a hard-edged shade block inside the fill (`shade: () => fillOnly(...)`). Never use soft airbrush.
- **Post** adds a soft vignette (26 % at the corners) and 4.5 % animated grain. Both are already in `post()`.
- **Palette**: brand navy `#25385c` / `#16213a`, brand orange `#ff6a2a`, cream paper `#fff6e0` / `#efe4d2`, warm gold `#ffd66b`, success green `#2f8f4a`, alert red `#e8574a`, teal `#5bc0be`, violet `#a974e0`. Use colour as meaning: green = good/growth, red = loss/flagged, orange = Buzztorm/CTA.
- **Type**:
  - **Bungee** for signs, titles and big numbers.
  - **Baloo 2 800** for labels and UI text.
  - **VT323** for screens and counters.
  - On-screen text is always in the video's language (English for Buzztorm) and short, three words or fewer where possible.

## Composition (1080×1920 composition space)
- Floor line around y 1300. Characters stand with feet at y 1750–1900.
- Titles and signs go in the top third (y 150–700). Nothing important goes outside x 60–1020.
- Close-ups use `bust:true`. The character's chest is anchored to the frame bottom, so you never see a floating torso.
- One idea per shot. Every sentence of the voiceover gets a literal visual: props carry the joke and numbers count up.
- Vary shot sizes: wide, medium two-shot, close-up and an insert (a screen, card or number). Never use the same framing twice in a row.
- Dark navy "explainer" backgrounds (`bgCommunity`, `bgBoard`) are for concepts and diagrams. The warm studio, gym, beach and street sets are for story.

## Motion
- Every shot has a gentle push-in (`zk` in drawFrame, +3.5 %). Nothing is static for more than about 4 frames: characters breathe, sway and blink.
- Pops use the `back` ease with overshoot (`pop1`). Swaps (before → after) use a `poof` plus `stars` lasting about 0.3 s.
- Reactions land 0–3 frames before their word. Read word times from `work/timing.json`.
- Use hard cuts between shots. Keep one stylised transition per film at most (the orange portal swirl, `WIPE`).
- Lip sync runs only on the character who is speaking (`lips.json` speaker). Heads nod slightly while talking.

## Art-direction rules from the client (premium means all of these)
- Use professional, masculine poses for male leads. Avoid cartoonish flailing and anything that "looks weird".
- Extras are clearly male or female. Use light skin, bright fitness clothes and colourful tops, as on `sheet_extras`.
- Outfits are identical in every scene. A character only changes outfit when the story says so: Tony is shirtless only at the beach.
- Characters in a two-shot are the same height. Check the Dex height reference on the character sheet.
- Hands have fingers and the thumb sits inside the fist. There must be no spikes on shoulders, elbows or sleeves, and no stray stroke ends.
- Recording scenes show a real setup: a camera on a tripod, a softbox or ring light, and a phone rig. The "REC" label appears only on those, never as "REC x1".
- Logos and avatars inside UI cards show the real character (Tony's face on the ad-account card), not a generic peep.
- Show no website or phone UI that isn't the brand's own. Say "community", not the platform's brand name.
- Data must make story sense. If a line asks "did my leads disappear?", the screen answers it: it shows "checking…" and then +47 new leads. It never shows a "0" that reads as a statement.

## Formats
- **9:16 master**: 1080×1920 at 24 fps, from `vsl.html`.
- **4:5**: 1080×1350. Render `vsl45.html` (a 1400×1750 canvas with 160 px of extra world on each side) and downscale. Per-shot vertical framing goes in `Y0` (default 140, meaning composition y 140–1890). Lower it for shots with a sign near the top. Never crop the 9:16 frames, because that cuts titles and feet.
- **Thumbnails**: 1080×1920 PNG, from `thumb.html` and `shoot_thumb.mjs`. See SCENES.md.
