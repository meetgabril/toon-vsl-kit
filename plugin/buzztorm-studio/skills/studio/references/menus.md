# Menus

Exact screens. ★ = recommended (first, label ends with "(Recommended)"). Max 4 options. Typed "back"/"home" navigate. Free text is optional, never required.

## Home — "Which brand?"
Fill 4 slots in order, show the first 4: up to 2 brands most recently used (★ first) · Add brand · Studio Library · Admin. Other brands are typed (partial names accepted).

## Brand — "What do you want to do?"
- Make something ★
- Plan the week
- Projects (n waiting) — shown first ★ instead when something waits for the user's review
- Brand Brain

## Make something
### 1 — "What's the goal?"
Grow (reach new people) ★ · Teach (build trust) · Sell (move to an offer) · Community.
If the brand has a preset, add it as the first option ★ ("Monday Episode") and drop the least used goal into "Other". A preset fills screens 1–4.

### 2 — "Which idea?"
Three ideas for that goal: first from `brain/ideas.json` (status new, same goal), then from `brain/series.json` (next episode), then new ones built from `brain/audience.json` pains and `brain/facts.json`. Each option: the idea in one line + which persona it speaks to. Options: Idea A ★ · Idea B · Idea C · My own idea.
New ideas the user picks are saved to `ideas.json`.

### 3 — "What format?"
Top 3 for the goal (from `library/recipes/index.json` → menu_top3, filtered by what the idea suits) + More.
- Grow: Reel ★ · Trial reels · Carousel · Meme · More (Story, YouTube video)  — if this exceeds 4, drop the least used into More
- Teach: Carousel ★ · Lesson pack · Checklist · More (Playbook, E-book, Cheat sheet, Worksheet, YouTube video, Course)
- Sell: Ad concept pack ★ · Sales page video · Story sequence · More (Carousel, Reel)
- Community: Discord announcement ★ · Discord event · Welcome kit · More (Emoji & stickers & sounds)

Follow-ups only when the recipe has a count (ask together with screen 4 in one call):
- Carousel → "How many slides of story?" 7 ★ · 5 · 9 (a CTA slide is added; show the total in the label, e.g. "7 (+ CTA = 8)")
- Story → "How many frames?" 4 ★ · 3 · 5 · 7
- Ad concept pack → "How many concepts?" 3 ★ · 4 · 5
- Playbook → "How many plays?" 7 ★ · 5 · 10
- Emoji & stickers & sounds → "Which set?" Emoji ★ · Stickers · Sounds · All three
- Meme → "Which template?" 3 most used comparative templates ★ · More (all templates, drawn formats, Add a template) — see memes.md

### 4 — conditional screens (one call)
- "Which offer?" only when the goal is Sell or Teach and the brand has more than one active offer (from `brain/offers.json`). Otherwise use the only/first one silently.
- "How should it sound?" only for video: Voiceover ★ · Music and on-screen text. If the Brand Profile has voice ids for every character and ELEVENLABS_API_KEY is set, the label is "Voiceover (recorded for you)".

### 5 — "Which hook?"
Three hooks of different kinds, each with its score (`scripts.md`). Hook A ★ · Hook B · Hook C · Write my own. Trial reels: "Use these 3 hooks?" Approve ★ · Replace one · Write my own. Skipped for formats with no hook (emoji/stickers/sounds, welcome kit, presentation loop).

## Script review (or Outline review for learning formats) — "Approve the script?"
Only after `studio.py check --stage script` passes. Card:
```
<Brand> · <Format> · Goal: <goal> · Offer: <offer> · <length>
Idea: … · For: <persona> · Send trigger: …
CTA: <cta text>     Characters: … · Visual style: … · Size: …
Options: Subtitles OFF · Post copy ON · Hashtags 5 · Alt text ON
<script / outline>
Quality check passed (4/4) · Viral score x/5
```
Approve ★ · Make it funnier · Make it shorter · More…
More → Make it clearer · Change the ending · Change the CTA · Change options

## Storyboard review (video and multi-image formats) — "Approve the storyboard?"
Contact sheet rendered with QA=1 and the layout check passed. Approve and render ★ · Fix a scene · Change visual style · Back to script
"Fix a scene" → "Which one?" (scene numbers as options, max 4 + Other) → "What's wrong?" Too much text · Something overlaps · Doesn't match the line · Other.

## Ready for approval — "Approve this version?"
Only after `studio.py check --stage final` passes. Approve ★ · Fix something · Make another format · Save as preset
- Fix something → "What kind of fix?" Text · Picture · Timing or sound · Other — then the same follow-ups as above.
- Make another format → multi-select of the formats that suit the same idea (each becomes its own project with `--parent`).

## Projects — "Which project?"
Newest first, waiting-for-you first. Then: Continue ★ · Fix something · Log results · Archive.
Log results → plain-number questions one at a time are allowed here (sends, 3-second hold, replays, views), or "I'll paste the screenshot".

## Plan the week — `planning.md`
## Brand Brain — "What do you want to update?"
Offers ★ · Audience · Facts & proof · More (Voice, CTAs, Series, Ideas, Claims policy, Colors & logo, Voices).
## Studio Library — "What do you want to see?"
Formats · Script types · Meme formats · Visual styles & audio.
## Admin — `admin.md`.

## Revisions (rules)
Every revision option maps to a concrete action: funnier = rule-of-three or misdirection on the weakest beat; shorter = cut 25 % keeping hook, payoff and CTA; clearer = one idea per line, replace abstract words with an object on screen; change the ending = 3 endings as a menu; change the CTA = the CTA library for the goal as a menu. After any revision: re-run the gate for the stage, bump the version.
