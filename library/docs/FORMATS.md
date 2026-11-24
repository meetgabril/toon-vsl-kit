# Formats: every kind of video and image

The kit isn't only for VSLs. Everything is drawn by the same engine, cast and style, so any video or still made with it matches the rest of the brand's library. Pick the row and follow its notes. The universal pipeline is in SKILL.md.

## Canvas formats
| id | size | how |
|---|---|---|
| `916` | 1080×1920 (Reels, TikTok, Shorts, Stories, VSL) | native composition. `node render.mjs frames …` |
| `45` | 1080×1350 (feed video) | `AR=45 node render.mjs frames45 …` (1400×1750 canvas, downscaled by finish.sh) |
| `11` | 1080×1080 (square feed) | `AR=11 node render.mjs frames11 …` |
| `169` | 1920×1080 (YouTube, landing pages, presentations) | `AR=169 node render.mjs frames169 …` |

`FMT` / `Y0` in vsl.js give each format a window onto the vertical composition. For `11` and `169`, set `Y0['169'][shot]` per shot after a stills check, because titles placed near the top of a vertical layout fall outside a landscape window. See `ref/formats_916_45_11_169.jpg`.

**Landscape-first projects** (16:9 is the main deliverable) should author shots for the window:
- the visible area at sc .84 is x −600…1680 and y 520…1806 (composition units);
- spread characters horizontally, and put titles at y ≥ 560;
- set `FMT['169'].y0` once.

Encode any format with ffmpeg the way finish.sh does (scale `frames11` to 1080×1080, `frames169` to 1920×1080).

## Video types
| type | length | structure | notes |
|---|---|---|---|
| **VSL** | 2–4 min | hook → problem → agitation → reframe → mechanism → proof → offer → risk reversal → CTA → closing joke | narrator (Dex) plus a hero who reacts; one stylised transition |
| **Short / Reel / TikTok** | 15–60 s | frame 1 is already the hook image → 2–4 escalating beats → twist or payoff on the last word | `CAP=1` for burned-in captions (most viewers watch muted); hard cuts every 1.5–3 s; loop the last frame into the first where possible |
| **Ad creative** | 6–30 s | problem in 0–3 s (brand visible by 3 s) → solution → proof number → CTA end card (2 s hold) | captions on; one message; end card = `sign` + `pill` CTA over `bgStage` |
| **Explainer** | 45–120 s | question → how it works in 3 steps (diagram on `bgBoard`) → result → CTA | `arrow` draw-ons, numbered pills, `folk` flows (see `sources_to_community`) |
| **Testimonial / case study** | 30–90 s | client before → turning point → after with numbers | `transformFig` for physical results; counters and bar charts for business results |
| **Feature / product demo** | 20–60 s | phone or laptop UI cards in close-up (`phone`, course window from `thumbAcademy2`) with a character reacting | UI cards: cream with a navy header, VT323 numbers |
| **Character loop / sticker / GIF** | 1–4 s | one action that loops seamlessly (wave, flex, laugh) | make the last frame equal the first; export a GIF with `ffmpeg -i frames/f%05d.jpg -vf "fps=12,scale=540:-1:flags=lanczos,palettegen"` (two-pass palettegen / paletteuse) |

**Without a voiceover** (music-only shorts, ads with on-screen text):
- write `work/timing.json` by hand. The beats are `lines` with `t0` / `t1` and empty `words`, or put words at the times the text appears;
- make `lips.json` with every frame closed: `{N, fps:24, open:[0…], sp:['']*N}`;
- time cuts to the music grid (120 bpm = 0.5 s per beat) and run `DUR=… python3 audio/score.py` with only music cues.

## Image types (thumb.html + shoot_thumb.mjs, any size)
`node shoot_thumb.mjs out/x.png "?v=<design>&w=<px>&h=<px>"`. Write each design as a `thumbXxx()` function next to the examples, and use `CW` / `CH` for the layout.

| type | size | layout notes |
|---|---|---|
| Vertical thumbnail / Story / Reel cover | 1080×1920 | headline plate at the top, one hero object in the middle, character bust at the bottom (SCENES.md, thumbnails) |
| YouTube thumbnail | 1280×720 | character close-up on one side at 40 % of the width, 3–5 huge words on the other, high contrast, no small text |
| Feed post | 1080×1080 / 1080×1350 | one idea: title plate + character + one prop; brand pill bottom-right |
| Carousel | 1080×1350 × N | the same background and title-plate position on every slide; slide number pill; the last slide is the CTA |
| Banner / cover | 1500×500 (X), 1584×396 (LinkedIn), 2560×1440 (YouTube; safe area 1546×423 in the centre) | keep characters inside the centre safe area; tagline in Bungee |
| Poster / flyer / print | A4 at 2480×3508 (300 dpi) | scale everything about 2.3×; ink widths are in pixels, so raise `S.lw` (`S.lwScale = 2.3`) for print |
| Ad image | 1080×1080 / 1080×1920 | headline ≤ 6 words, one number, CTA pill; text kept small enough for ad-platform text limits |
| Character sheet | 2560×1440 | `node shoot_sheet2.mjs cast:<KEY>` |
| Sticker / transparent PNG | any | skip the background fill and `post()`; the PNG keeps alpha |

## Social post layout (Post, Carousel) — Instagram standard
Render slides as beats at `AR=45` (1080×1350) and use the screen-space items, which stay fixed and readable whatever the scene:
- `slidehead` on every slide, with the **same `size=` on every slide** (68 by default) and `n=`/`of=`. Keep titles to 19 characters or fewer so none shrinks.
- `swipe` on every slide except the last.
- Dialogue with `say` (never `sub`, which is too small once downscaled).
- One extra last slide for the call to action with `cta`: comment a keyword, or join the brand's free community. The menu's slide count is story slides; the CTA slide is added on top.
- Safe area: 64 px from every edge (the profile grid crops 4:5 posts to 3:4). Minimum text on the final image: titles 60 px, dialogue 44 px, counters 80 px.
- Scene items (counters, lists, props) stay between the title plate and the dialogue band: composition y ≈ 450–1350 at `AR=45`.
- No platform UI, no small print. Check the 6-up contact sheet at phone size before review.

## Consistency checklist (every deliverable)
- Same cast, same outfits, same palette and fonts (`ref/style_card.jpg`), same ink weight.
- Sets and props come from `ref/sets_sheet.jpg` and `ref/props_sheet.jpg` before inventing new ones. New pieces are drawn in the same way: flat fill, hard shade and plum ink.
- Motion uses the house timings (MOTION.md). Scenes reuse their catalogued code (`ref/CATALOG.md`).
- On-screen text is in the deliverable's language, short and in Bungee or Baloo.
- After each project, run `python3 catalog.py frames ref` so the new scenes join the library. Commit new sets, props, characters and their sheets back to the kit repo.
