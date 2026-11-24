# Menus

Exact screens, options and conditions. ★ = recommended (first option, label ends with "(Recommended)"). Max 4 options per screen. The user can always type another answer, "back" or "home".

## Home — "Which brand?"
Fill the 4 slots in this order and show the first 4:
1. Up to 2 brands, most recently used first (from `projects/*/project.json` dates; alphabetical when there are no projects yet). The first is ★.
2. Add brand
3. Studio Library
4. Admin

Any other brand, or Admin when it doesn't fit, is typed by the user. Accept partial names ("buzz" → Buzztorm).

## Brand — "What do you need?"
- Create content ★
- Projects (shows how many are waiting for review, e.g. "Projects (2 waiting)")
- Characters & backgrounds
- Brand Profile

## Create content

### 1 — "Where will it be posted?"
- `<Preset name>` ★ — only if the brand has presets; the most used one. Running a preset jumps to screen 5 with screens 1–4 filled in.
- Social (Instagram, TikTok, Shorts)
- YouTube & Web
- Discord

### 2 — "What are you making?"
| Channel | Options |
|---|---|
| Social | Reel ★ · Trial reels (hook test) · Post or carousel · Story |
| YouTube & Web | YouTube video ★ · Sales page video · LinkedIn video · Presentation loop |
| Discord | Announcement ★ · Event · Emoji, stickers & sounds · Server assets |

Follow-up screens, only when needed:
- Post or carousel → "How many story slides?" 5 ★ · 1 (single post) · 7 · 9 — a call-to-action slide is added after them (not for a single post, where the CTA goes in the post copy).
- Story → "How many frames?" 3 ★ · 1 · 5
- Emoji, stickers & sounds → "Which set?" Emoji ★ · Stickers · Soundboard sounds · All three
- Event → ask in plain text: event title, date and time (one message).

### 3 — "What kind of story?"
Show the top 3 script types for the content (table in `scripts.md`) plus "More". "More" shows the next 3 plus "Write my own".
Skipped for: Emoji/stickers/sounds, Server assets, Presentation loop (uses the brand's default loop: characters waving, logo, tagline).

### 4 — "How should it sound?"
Only for video content (Reel, Trial reels, YouTube video, Sales page video, LinkedIn video):
- Voiceover (ElevenLabs) ★
- Music and on-screen text
Screens 3 and 4 do not depend on each other: ask them in one AskUserQuestion call.

### 5 — "Which hook?"
Write 3 hooks for the brand (see `scripts.md`), each shown as: the hook line, the first image in a few words, its score.
- Hook A ★ · Hook B · Hook C · Write my own
Trial reels: no choice. All 3 hooks are used; the screen is "Use these 3 hooks?" Approve ★ · Replace one · Write my own.
Skipped for: Emoji/stickers/sounds, Server assets, Presentation loop. Event: the hook is the event title line.

## Script review — "Ready to approve the script?"
Show a card:
```
<Brand> · <Content> · <Script type> · <Length>
Characters: … · Visual style: … · Size: …
Options: Subtitles OFF · Post copy ON · Hashtags 5 · Alt text ON
<script, one line per speaker turn>
Viral score: x/5 (lowest check: …)
```
- Approve ★ · Change hook · Change options · Rewrite

"Change options" opens one multi-select screen with only the options that apply to this content (`content.md`), plus Characters, Visual style and Size as a second question in the same call.

After Approve:
- Voiceover → status "Waiting for voiceover". Send the ElevenLabs text and voice descriptions (see `production.md`) and wait for the upload. Do nothing else until it arrives.
- Music and on-screen text, and every still → go straight to the storyboard.

## Storyboard review — "Approve the storyboard?"
Send the contact sheet.
- Approve and render ★ · Fix scenes · Change visual style · Back to script

## Ready for approval — "Approve this version?"
Send the files and the delivery package.
- Approve ★ · Request changes · Repurpose · Save as preset

- Request changes → ask in plain text what to change. Apply the review rule (symptom → whole piece → root cause), bump the version, return here.
- Repurpose → multi-select (see `production.md`): Carousel · Story teaser · Trial reels · 16:9 version · 4:5 feed video · Short cut-downs · Discord announcement · Sticker · Soundboard clip.
- Save as preset → ask for a name in plain text; save the menu path to the Brand Profile.

## Projects — "Which project?"
List projects that are not archived, newest first, with their status. Then:
- Continue ★ · Request changes · Log results · Archive

"Log results" asks in plain text for sends, 3-second hold, replays and views per version (or per hook for a hook test), saves them, and for a hook test offers: "Graduate the winner to a regular reel?" Graduate ★ · Not yet.

## Characters & backgrounds — "What do you want to do?"
- New character ★ · New background · View all · Share to library

## Brand Profile — "What do you want to change?"
- Colors & logo · Voices · Series guide · Hooks & results
Each opens the relevant file contents as a short summary, then asks what to change in plain text.

## Studio Library — "What do you want to see?"
- Script types · Visual styles & audio · Sizes & content · Quality check

## Admin
See `admin.md`.
