# Scripts, hooks, CTA, facts

Read before writing: `library/docs/VIRAL.md`, the persona (`brain/audience.json`), the offer and CTA (`brain/offers.json`, `brain/cta.json`), `brain/voice.md`, `brain/claims.json`, the brand's `series-guide.md` and `hooks.md`.

## Script types
| ID | Structure | Best for | Visual style |
|---|---|---|---|
| sitcom-skit | hook → 2–4 escalating beats → twist on the last word → CTA → loop | Reel, YouTube | Standard |
| history-hook | verified bizarre fact → funny pivot → lesson → CTA | Reel, Carousel | Old film → Standard |
| myth-vs-fact | the myth (confident) → proof → the fact → one action → CTA | Carousel, Reel | Noir → Standard |
| yep-thats-me | freeze on the disaster → rewind → cause → fix → CTA | Reel, Story | Freeze frame |
| escalation | rule of three, third absurd → reaction → point | Reel, Meme | Comic |
| before-after | before (pain) → turning point → after (process result, no money amounts unless in proof.json) | Carousel, Post, Reel | Standard |
| how-to | question → 3 steps → result → CTA | Carousel, YouTube, Lesson | Standard on the board |
| comic-strip | one beat per panel, punchline last, CTA slide | Carousel, Post | Comic |
| behind-the-scenes | what you see → what really happens → wink | Story | Paper cut-out |
| poll-gag | poll → reveal → joke → link/CTA frame | Story | Standard |
| quiz-reveal | quiz sticker → answer with explanation → CTA | Story | Standard |
| calm-tip | one gentle problem → one tip → reassurance | Post, Story | Pastel |
| ad | problem 0–3 s with brand visible → solution → proof → CTA end card 2 s | Ads | Standard |
| sales-pitch | hook → problem → agitation → reframe → mechanism → proof → offer → risk reversal → CTA → closing joke | Sales page video | Standard |
| explainer | question → how it works in 3 steps → result → CTA | YouTube, LinkedIn, Lesson | Standard on the board |

## Hooks
Three hooks of different kinds (VIRAL.md has 10). Priority: proven patterns in `hooks.md` → the brand's series and running gags → persona pains and phrases → a verified fact. Each: the line (≤ 15 words), the first image, the score (VIRAL.md scorecard). Rewrite anything under 4/5 before showing it.

## CTA (every piece except pure Grow)
- Take it from `brain/cta.json` for the goal; offers exactly as in `offers.json`.
- Grow pieces end on the send trigger (a question that makes them think of someone) and may add a soft series CTA.
- Comment-to-DM CTAs ("Comment ACADEMY") need the automation tool running on the account; add a posting note reminding the user.
- Video: CTA in the last 15 % and on screen. Carousel: its own last slide. Documents: CTA box on the last page.

## Facts
History and number lines must reference `brain/facts.json`: add `> FACTS: id` under the voice lines in `script.md`. Unverified → web search → add the fact with sources → then use. "Legend says" for anything undocumented.

## Writing
Plain spoken English, numbers as words in voiceovers, ≤ 15 words per sentence, never describe what is already on screen, narrator + hero, one emotion tag per line for ElevenLabs v3 (`[excited] [warm] [curious] [whispers] [sighs] [laughs] [sarcastic] [serious] [shouting] [mysterious] [deadpan] [dry] [proud] [amused]`), about 150 words per minute.

Before Script review: `python3 script.py check script.md` (hook, long sentences, loop) and `python3 studio.py check . --stage script` (claims, facts, copy, CTA). Both must pass.
