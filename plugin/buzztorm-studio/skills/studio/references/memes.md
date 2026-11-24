# Memes

Memes are built from **structural formats** (`library/memes/formats.json`: Reject / Prefer, Four levels, Nobody: / Me:, POV, Expectation vs reality, Them / Me, Day 1 vs Day 100, What I asked for / What I got, Starter pack, Tier list, The impossible choice, Me explaining, Hot take sign, The chart, Reaction caption) drawn **only with the brand's own characters, backgrounds and props**.

Never download, trace or recreate third-party meme images (film stills, photos of real people, other artists' comics or recognizable compositions). If the user asks for a specific famous template, say once that the studio builds the same joke with the brand's own characters, and offer the closest structural format. This keeps every meme original (Instagram stops recommending accounts that mostly repost) and safe in ads.

## Making one
1. Pick the format and a pain/phrase from `brain/audience.json`; write the text (caption ≤ 2 lines; panel texts ≤ 8 words each).
2. Render one still per panel with the brand's characters (one beat per panel in `story.js`, `AR=11` or `AR=45`, `QA=1`).
3. Write `meme.json` and compose:
```
{"format": "reject-prefer", "size": "4x5", "brand": "brand/brand-profile.json", "handle": "@brand",
 "panels": [{"image": "stills/m/f00010.jpg", "text": "Posting every day"}, {"image": "stills/m/f00034.jpg", "text": "Building a community"}],
 "out": "delivery/<brand>_meme_<title>_v1_4x5.png"}
```
`python3 meme.py meme.json` — layouts single · rows · cols (labels) · grid (title + 6 cells) · tier (S–D rows, items as text). It refuses text that doesn't fit at 40 px and writes the layout capture for the gate.
4. `post.md`: one line that continues the joke + the send-trigger question, ≤ 3 hashtags, alt text.

Moods for reactions: calm, smile, happy, serious, worried, fear, hopeful, driven, sad, cheeky, tired, sleep, blank.
