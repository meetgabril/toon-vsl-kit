# VIRAL.md: built to be **sent**, not just watched

Shares to friends (DMs, "you need to see this") drive reach to new people. Instagram's head has said sends per reach is one of the platform's most important ranking signals, especially for people who don't follow you yet. TikTok and Shorts reward completion and replays. So every script optimises in this order:
1. Hook: they stay.
2. Payoff: they feel something.
3. Send trigger: they think of a specific person.
4. Loop: they watch it again.

## The science in one table (Berger's STEPPS + arousal)
| driver | in our videos |
|---|---|
| **Social currency**: sharing makes *me* look smart or funny | a fact almost nobody knows, or an "insider" reveal. The sender looks interesting |
| **Triggers**: everyday cues that bring it back to mind | tie the joke to a daily thing: Mondays, the gym, the boss, the group chat, coffee, 5 a.m. |
| **Emotion (high arousal)** | awe, amusement, surprise, righteous anger beat calm or sad. Sad and "nice" content isn't sent |
| **Public**: visible behaviour copies | a catchphrase, a gesture or a format people can repeat ("Can I finally take off the ring light?") |
| **Practical value**: useful = sendable | one concrete tip or number someone needs *now* |
| **Stories**: a vehicle carrying the message | the brand is the turning point of a story, never an ad break |

Berger & Milkman's study of almost 7,000 NYT articles found that content evoking high-arousal emotions (awe, anger, anxiety) was shared more, and low-arousal sadness less. Aim for **awe + laughter**.

## HOOKS (first 1–3 s): pick one, never "Hi, today…"
Frame 1 is already the hook image (no fade-in, no logo). The first line is said over a visual that is already strange.
1. **History bridge**: a bizarre, true historical fact, then a funny pivot to the topic.
   - "In 1518, in Strasbourg, hundreds of people started dancing in the street… and couldn't stop for weeks. *[beat]* Anyway, that's Tony's posting schedule." (the dancing plague is documented, but crowd sizes are disputed, so say "hundreds", not an exact number)
   - Use the `oldfilm` style, a `year "1518" "STRASBOURG"` item and a `projector` sound. Snap back to `ink` on the pivot word, with a `scratch` sound.
   - Facts must be verified (web search) and phrased with confidence only when documented. Otherwise say "legend says…".
2. **Paradox as fact**: "The busiest gym in town never runs ads."
3. **Wrong-on-purpose**: "Posting every day is killing your business." (then prove it)
4. **Freeze-frame "yep, that's me"**: start at the disaster, then rewind. Use the `freeze` style + `label "YEP. THAT'S ME."` + `scratch`.
5. **Impossible number**: "$200 per client. Every year it goes up." (big counter on frame 1)
6. **Direct accusation (playful)**: "You're paying rent on your own audience."
7. **Mid-action cold open**: the character is already mid-disaster on frame 1 (treadmill, money flying).
8. **Question with a stake**: "What happens to your clients if you disappear for a week?"
9. **Visual oddity**: something wrong in frame 1 that the eye must resolve (a door labelled ADS swallowing money).
10. **Callback hook**: a recurring character catchphrase that fans recognise (series, see below).

Make every hook visual *and* verbal, with the text on screen within 0.5 s (`title`/`sign` at `delay=.1`).

## SEND TRIGGERS (make them think of one specific person)
- **The archetype**: build the joke around a recognisable type ("the coach who posts at 5 a.m.", "the friend who buys every course"). Viewers send it *to that person*. Name the type on screen once.
- **The mirror**: "If you've ever said 'I'll start Monday'…" Self-recognition gets shared to the group chat.
- **The settle-a-debate**: one surprising, checkable fact people use to win an argument.
- **The inside joke**: a running gag across videos (the ring light, Tony's bandana). Fans send it to each other.
- **The useful thing**: a 3-step list or one number to remember. This is the bookmark-and-send kind.
- **Unspoken prompt**: never say "share this". The last beat makes them *think* of someone: "Your friend with three side hustles needs to see this…" works only as a joke delivered by a character, never as a call to action.

## LOOPS (rewatch without noticing)
- **Sentence loop**: the last line flows grammatically into the first. Test: read the last line, then the first, with no pause. (`python3 script.py check` prints the join.)
  - *Last:* "…and that's why Tony never runs ads, because" → *First:* "the busiest gym in town never runs ads."
- **Visual match**: the last frame equals the first frame. Use `loop: 0.4` in `story.js`: the last 0.4 s dissolve into frame 1.
- **Hidden detail**: put a background gag in the first 2 seconds that only pays off at the end (a sign, an extra doing something absurd). Rewatches go up and comments point it out.
- **Ending punchline that recontextualises the hook**: after the twist, the first line means something else.

## FUNNY ON PURPOSE (comedy devices that animate well)
- **Rule of three**, with the third item absurd ("A workout at five a.m. A meal prep at noon. A live at… 3 a.m. for one viewer").
- **Escalation**: each beat bigger (price climbs, treadmill speed climbs).
- **Deadpan reaction cut**: a beat of silence plus the character's blank face (`music: silence`, `cu` + `blank`).
- **Misdirection**: set up an expected word, deliver another.
- **Callback**: the last line returns to an object or line from the start (pairs with the loop).
- **Physical gag at the end**: the ring light falls, a boing, a confetti cannon misfires. A smile at the end gets sent.

## STRUCTURE TEMPLATES
**Viral short (20–45 s)**: hook (0–3 s) → bridge/pivot (3–6 s) → 2–3 escalating beats with one visual gag each → twist (the brand or the idea is the twist) → button joke → loop join.

**VSL (2–3 min)** (see SKILL.md for the arc): open with a history bridge or cold open, plant one running gag early and pay it off at the CTA. End with a physical gag + loop.

**Series ("episode N")**: same characters, the same catchphrase, a recurring "Tony did it again" format. Recognition drives sends among fans.

## SCORECARD (fill it in before sending the script; rewrite anything under 4/5)
| check | 1–5 |
|---|---|
| Hook: line 1 creates a question or a "wait, what?" in under 3 s, with a strange image on frame 1 | |
| Arousal: at least one moment of awe or a real laugh (not just "nice") | |
| Send trigger: who exactly will this be sent to? (write the archetype) | |
| Social currency: does sharing make the sender look smart or funny? | |
| Loop: does the last line or frame flow into the first? | |
| Literal visuals: every line has an on-screen image that shows it | |
| Brand: the idea is the hero, not an ad break; the CTA is earned by the story | |
| Length: no sentence over 15 words; total time fits the format | |

## Packaging (give the user with each video)
- **Cover frame**: the hook image plus 3–5 words.
- **Caption**: one line that continues the joke plus a question that invites a tag without asking for it ("Which friend is the 5 a.m. one?").
- **On-screen text** in the first second (muted autoplay).
- Post 2–3 cut-downs from one long video: the hook, the funniest beat, the twist.

## Never
- Fake facts, fake quotes from real people, or stolen characters or songs.
- Begging for shares, "link in bio" mid-story, or slow intros, logos or "hey guys".
- Sad or low-energy endings. End on a laugh, awe or a "wait, what?".
