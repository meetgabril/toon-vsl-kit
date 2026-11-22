# story.js: the film in one beat per line

```js
export const STORY = {
  beats: [
    { at: 'This is Tony', set: 'studio', cam: 'pull', music: 'sitcom', cast: 'D L smile | T C hips happy', items: ['ba x=900 y=1640 @lose'] },
    { at: 'Twelve weeks', set: 'studio', cast: 'T cu flex happy', items: ['sign "12 WEEKS" bg=green UL', 'stars x=760 y=900'] },
  ],
  fns: { myMoment: (d, gt, A) => { /* hand-drawn extra; A = drawing API */ } },
};
```
Each beat is one shot that lasts until the next beat starts. Everything is timed to the voiceover words in `work/timing.json`, so the times never need to be typed.

## Beat keys
| key | value |
|---|---|
| `at` | When the shot cuts in. Can be a word or phrase from the script (`'Door number two'`, searched forward from the previous beat), a phrase with an offset (`'ads -0.3'`), `'L5'` (start of script line 5), `'+1.2'` (seconds after the previous beat) or a number in seconds. The first beat always starts at 0. |
| `set` | `studio` · `content` (creator room, day) · `night` · `casino` (paid-ads world) · `board` (navy explainer) · `chalk` · `street` · `gym` · `community` · `beach` · `sea` (beach without props) · `stage` (Buzztorm studio) · `office` · `doors` (ADS / CONTENT) · any colour `#hex` / `navy`. See `ref/sets_sheet.jpg`. |
| `cast` | Actors separated by `\|`. Grammar below. |
| `items` | List of strings. Grammar below. |
| `cam` | `push` (default slow push-in) · `pull` (starts at 130 % and settles, for reveals) · `in` (pushes to 125 %) · `cu:T` (close-up on the actor T in this shot). |
| `shake` | A word: 0.3 s camera shake on that word. |
| `music` | `sitcom` · `happy` · `think` · `casino` · `aerobics` · `island` · `folk` · `tension` · `build` · `silence`. The style carries over to later beats until changed. |
| `wipe` | `true`: the orange portal transition into this beat. Use it once per film. |
| `sfx` | Extra sounds: `'boing@word'`, `['thud', 'creak@door']`. Names: pop click ding buzz stamp whoosh chaching cheer sparkle steps portal boing thud creak powerdown page waves gulp chalk. |

## Cast grammar
`WHO slot size pose mood flags…`
- **WHO**: `T` Tony · `D` Dex · any key from `cast.custom.js` · `folk:3` (extra number 3) · `client` (plus-size woman; add the flag `after` for the slim version).
- **slot**: `LL L C R RR` (x = 150/290/540/790/930), or `x=…` / `y=…`.
- **size**:
  - `wide`: full body, the default.
  - `med`: cropped at the knees.
  - `cu`: close-up bust. With two or more actors it shrinks automatically.
  - `far` and `tiny`: smaller, further back.
- **pose**:
  - Tony: `down hips flex point phone hold runA runB lean`.
  - Peeps characters: `stand point cross blazer walk rest shirt sit dancer`, or any `standing/…` body.
- **mood**: `calm smile happy serious worried fear hopeful driven sad cheeky tired sleep blank`.
- **flags**:
  - `bare`: shirtless, beach only.
  - `shades`.
  - `run`: runs on the spot. Add `tread` to put him on the front-view treadmill (`business` labels the console BUSINESS).
  - `sweat`, `nervous`, `ring`: ring light behind.
  - `enter<` / `enter>`: walks in from the left or right.
  - `<` / `>`: faces left or right.
  - `@word`: appears on that word.

Actors face the centre automatically. Lip sync, blinks, breathing and head nods are automatic: the mouth moves only for the speaker of that line.

## Item grammar
`type "text" … key=value … position @word`. Positions are `top high mid low L R UL UR LL LR`, or `x=… y=…`. Without `@word`, an item pops 0.25 s after the cut (`delay=…` changes that). `until=word` removes it.

| type | example | notes |
|---|---|---|
| `title` | `title "VIRAL LOOP" size=120 color=gold` | big outlined Bungee title |
| `sign` | `sign "12 WEEKS" bg=green UL` | plate with a drop shadow |
| `pill` | `pill "ADS" bg=violet x=420 y=1000 @ads` | label |
| `sub` | `sub "...as long as he never stops"` | lower-third subtitle |
| `counter` | `counter 0>12000 "PER MONTH" pre=$ post=% dur=1.6 color=red` | counts up, ticks and dings |
| `phone` | `phone "NEW LEADS" 0>47 notif=New_lead,New_member hit=.9 R` | "checking…", buzz, counter, notifications |
| `card` | `card "AD ACCOUNT" "ACTIVE" avatar=T high` | UI card with the cast member's face |
| `stamp` | `stamp "FLAGGED" color=red @flagged` | slams in |
| `list` | `list "5 AM WORKOUT\|NOON MEAL PREP\|LIVE AT NIGHT" UR at2=workout\|meal\|live` | pills pop on each word |
| `check` / `x` | `x R @stop` | verdict marks |
| `arrow` | `arrow from=L to=R color=teal` | drawn on |
| `crowd` | `crowd 9 y=1500 s=.75 sad until=disappear` | grid of extras |
| `walkers` | `walkers 4` | extras walking across |
| `money` | `money mid` | bills raining |
| `confetti` / `stars` / `poof` / `flash` | `confetti mid @won` | effects |
| `ba` | `ba x=900 y=1640 s=.95 sport @lose` | before → after transformation on the word |
| `prop` | `prop ads R s=.8 price=$340 year=2026 off` | ads · door (`label= color= open=`) · clock (`h= label=`) · camera · phonerig · softbox · tripod · umbrella · mug · dumbbell · coin · bill |
| `fn` | `fn myMoment` | your own drawing code in `STORY.fns` |

Every item gets its sound automatically: pop, stamp, ticks + ding, notification dings, cheer, buzz and so on. Add `silent` to mute one.

## Layout tips (free areas per set)
- **studio**: the poster sits top right (x 700–1040, y 0–300). Put text top left or in the middle.
- **casino**: the ads machine sits at x 640–1000. Keep text on the left.
- **content/night**: shelf top left and a sign at the right. Use `top` or the middle.
- **beach**: the horizon is at y 1000–1240. Stand crowds at y ≥ 1500.
- **board/community/stage**: open. Best for diagrams, lists and counters.

## Writing a film fast
1. One beat per sentence or punchline. 25–40 beats for a 2–3 minute VSL, 6–12 for a short.
2. Lead with the actor and the set, then add one item that literally shows the line (a number, a word or an object).
3. Vary the size: `wide` → `cu` → an item-led shot → `med` two-shot. Vary the set at least every 3 beats.
4. Use `music` changes at story turns and `silence` right before the punchline.
5. Something one beat can't express goes in `fns`, using the helpers of `vsl.js` (`A.TONY`, `A.text`, `A.pill`…), or in a hand-written `shot(time, (lt, gt) => …)`.
