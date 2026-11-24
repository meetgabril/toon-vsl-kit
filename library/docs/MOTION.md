# Motion library

Every movement in the approved film, with a frame strip in `ref/motion/` (frame times in red) and the technique that makes it. Reuse these timings and techniques so every new video moves the same way. Line numbers refer to `example/buzztorm_vsl.js`. The full per-shot list is in `ref/CATALOG.md`, which has its own strips in `ref/scenes/`.

## House timing (24 fps)
| element | duration | curve |
|---|---|---|
| pop-in of a sign, pill or card | 0.35 s | `pop1(t, at)` = `back(seg(t, at, at + .35), 2.2)`, which overshoots to about 108 % and settles |
| stagger between items in a list | 0.18–1.3 s, landing on each word | each item's `at` = its word time from timing.json minus 1–3 frames |
| stamp (FLAGGED, RENTED) | 0.3 s | scale 2.0 → 0.82 with `eo`, rotated −0.1, plus a `stamp()` SFX |
| poof swap (before → after) | 0.3 s | swap the drawing at the midpoint behind `poof()` and `stars()` |
| counter climbing | 1–2.5 s | `Math.round(lerp(a, b, ss(seg(t, t0, t1))))`, with bars growing alongside |
| camera move between framings | 0.8–1.2 s | `ss(seg(...))` on cam x, y and zoom |
| global push-in per shot | the whole shot | +3.5 % (`zk` in drawFrame); never fully static |
| camera shake on an impact | 0.3 s | `shake(gt, at, 14)` adds to the cam position |
| blink | every 2.6–4.4 s | built in |
| breathing / sway | continuous | built in (peep: ±0.7 % scale, ±0.8 % rotation) |
| head nod while talking | continuous | built in from `lips.json` energy |
| walking | about 1.2 steps per second | `folk(..., { walk: gt * 10 })` with x lerped across the frame |
| running (Tony) | 10 rad/s | `TONY({ run: true })`: arms alternate runA/runB, legs `run`, body bob ±30·s |
| transition | 1.1 s (once per film) | the orange portal swirl: an `ell` growing to 2400 px with 5 rotating colour bands (`WIPE`) |

## Strips (`ref/motion/*.jpg`)
| strip | shows | how |
|---|---|---|
| `transform_before_after` | the client turns from plus-size into a model at 4.45 s | `transformFig(..., tk < .5 ? before : after)` + `poof` + `stars` (L261) |
| `pop_sign_flex` | the "12 WEEKS" sign pops while Tony flexes in close-up | `pop1` scale on the `sign()`; TONY `bust`, arms `flex` |
| `treadmill_run_cycle` | Tony running, front view | `treadBack` → `TONY({ run: true })` → `treadFront`; arms pump in front of the belly |
| `treadmill_bills` | money flying off the business treadmill | `bill(x, y, a)` on parabolic paths with `hash` per bill, cycled with `%` |
| `door_open_push_in` | door 1 opens and the camera pushes through | `door(..., open)`, `open = ss(seg)`; cam zoom 1 → 1.45 |
| `price_climb` | cost per client $200 → $260 → $340 by year | `adsMachine({ price, year })` switched on beats (L325) |
| `machine_powerdown` | stop paying and the machine goes dark | `adsMachine({ on: 0 })` plus a grey overlay and a `powerdown()` SFX |
| `calendar_pages` | "every single day": pages fly off | `DAY` number = `200 + floor(lt*9)`, calendar wobble `sin(gt*20)*.03`, torn pages fly up-right with rotation |
| `beach_leads_poof` | one week off and the leads vanish | 5 folk in a row; each `poof` at `2.3 + i*0.25` s, figure hidden once k > .15 |
| `apps_pop_in` | DMs, EMAIL, WHATSAPP… cards pop on each word | `APPS` list `[label, colour, time]` + `pop1`; folk inside each card |
| `flagged_stamp` | AD ACCOUNT flagged | stamp recipe (L416); the ACTIVE pill hides once flagged |
| `chalkboard_writing` | 2× INCOME = 2× ADS or 2× POSTS | each chalk line reveals on its word (`bgChalk` + text with `seg` alpha or clip) |
| `folk_walk_in` | a passer-by walks in and the ONCE pill follows | `folk(lerp(1180, 560, k), …, { walk: t * 10, face: -1 })` + a `pill` tracking x (L519) |
| `portal_wipe` | the one stylised transition | `WIPE = [95.0, 96.1]` in drawFrame |
| `sources_to_community` | ADS, POSTS, REFERRALS… arrows into the FREE door, then people stream in | `SRC` list + `arrow(..., eo(seg))` drawn on; folk lerp from the sources to the door, shrinking (L554–555) |
| `viral_loop` | followers → members → buyers around a ring | folk orbiting a ring by angle `+ t`; labels pop on their words; "VIRAL LOOP" pops at 138.0 |
| `phone_leads_flood` | "Did my leads disappear?" → checking… → +47 leads | phone recipe in SCENES.md: "?" bubble, dots, 0.5 s buzz, counter, staggered notification pills, stars |
| `members_counter` | MEMBERS 1200 → 2060 with growing bars | counter recipe |
| `dex_lipsync_cu` | the narrator talking in close-up | viseme mouths from `lips.json`, blinks and head nods (all automatic) |
| `ring_light_fall` | the final gag: the ring light falls off | x `lerp(846,1000,fk)`, y `lerp(896,1760,fk²)` (gravity), `rotate(fk*4)`; Tony switches hips → flex; `boing()` + `thud()` |

## Rules
- Every new element enters with motion (a pop, slide or draw-on). Nothing just appears, except on a hard cut.
- Any motion that matters lands on its word, 0–3 frames early.
- At most one camera move and one main action per beat. Hold half a second after a punchline before cutting.
- Tony's running arms pump in front of the belly, the legs reach high, and he runs front-view only on a front-view treadmill.
- Characters never freeze. Even in a "hold", breathing, blinks and the push-in keep the frame alive.
