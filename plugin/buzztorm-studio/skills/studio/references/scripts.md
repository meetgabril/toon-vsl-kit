# Scripts

Read `library/docs/VIRAL.md` (hooks, send triggers, loops, scorecard) and the brand's `series-guide.md` and `hooks.md` before writing.

## Script types

| ID | Name in menus | Structure | Best for | Visual style |
|---|---|---|---|---|
| sitcom-skit | Sitcom skit | hook → 2–4 escalating beats → twist on the last word → loop | Reel, YouTube | Standard |
| history-hook | History hook | bizarre true fact → funny pivot to the topic → payoff | Reel, YouTube | Old film → Standard on the pivot |
| myth-vs-fact | Myth vs fact | the myth (stated with confidence) → the proof → the fact → takeaway | Reel, Carousel | Noir → Standard |
| yep-thats-me | "Yep, that's me" | freeze on the disaster → rewind → how it happened → fix | Reel, Story | Freeze frame → Standard |
| escalation | Rule of three | three items, the third absurd → reaction → point | Reel | Comic |
| before-after | Before & after | before (pain) → turning point → after (number) | Reel, Carousel, Post | Standard |
| how-to | 3-step how-to | question → 3 steps → result → call to action | Carousel, YouTube, Reel | Standard on the board background |
| comic-strip | Comic strip | 4–6 panels, one beat each, punchline on the last panel | Carousel, Post | Comic |
| behind-the-scenes | Behind the scenes | "what you see" → "what really happens" → wink | Story, Reel | Paper cut-out |
| throwback-meme | Throwback meme | old-school format → modern twist | Reel, Story | VHS |
| poll-gag | Poll gag | question frame with a poll sticker → reveal frame → joke | Story | Standard |
| calm-tip | Calm tip | one gentle problem → one tip → reassurance | Post, Story | Pastel |
| ad | Ad | problem in 0–3 s (brand visible) → solution → proof number → CTA end card (2 s) | any Social or YouTube | Standard |
| sales-pitch | Sales pitch (VSL) | hook → problem → agitation → reframe → mechanism → proof → offer → risk reversal → CTA → closing joke | Sales page video, YouTube | Standard, one accent style |
| explainer | Explainer | question → how it works in 3 steps → result → CTA | YouTube, LinkedIn | Standard on the board background |

## Top 3 per content (screen 3 order)

| Content | Top 3 | More |
|---|---|---|
| Reel | Sitcom skit · History hook · Myth vs fact | "Yep, that's me" · Before & after · Ad |
| Trial reels | Sitcom skit · History hook · Rule of three | Myth vs fact · "Yep, that's me" · Ad |
| Post (1 slide) | Comic strip · Before & after · Calm tip | Myth vs fact · Ad |
| Carousel | Comic strip · Myth vs fact · 3-step how-to | Before & after · Calm tip · Ad |
| Story | Poll gag · Behind the scenes · "Yep, that's me" | Throwback meme · Calm tip |
| YouTube video | Explainer · Sitcom skit · History hook | Sales pitch · 3-step how-to |
| Sales page video | Sales pitch · Explainer · Before & after | — |
| LinkedIn video | Explainer · Before & after · Myth vs fact | Sitcom skit |
| Discord announcement | see `discord.md` | |

The Brand Profile's `visual_style.avoid` removes styles; a style switch is always a story moment (past → present, myth → fact), never decoration. Keep 70 % or more of a piece in one style.

## Hooks (screen 5)

Write 3 hooks of different kinds (VIRAL.md lists 10 kinds). Prefer, in order: a proven hook pattern from the brand's `hooks.md`, the brand's running gags and archetypes from `series-guide.md`, then a new idea. For each hook give: the line (under 15 words), the first image, and its score from the VIRAL.md scorecard. Verify every historical or numeric fact with a web search before showing it; if it can't be verified, say "legend says" or drop it.

## Writing the script

- Plain spoken English, numbers written as words, no sentence over 15 words, never describe what the viewer already sees.
- A narrator plus a hero who reacts in short lines, using the brand's characters and their voice descriptions from the Brand Profile.
- One emotion tag per line for ElevenLabs v3: `[excited] [warm] [curious] [whispers] [sighs] [laughs] [sarcastic] [serious] [shouting] [mysterious] [deadpan] [dry]`.
- Length: about 150 words per minute.
- Name the send trigger (who the viewer sends it to) on the review card.
- Score with the VIRAL.md scorecard; rewrite anything under 4/5 before showing the review card.
- Run `python3 script.py check script.md` in the project folder: hook length, long sentences, loop join.

Stills (Post, Carousel, Story) and music-only videos still get a script: the on-screen text, one line per slide, frame or scene.
