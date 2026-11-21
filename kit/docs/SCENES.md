# Scenes: engine, shot file and recipes

## Files in a project
| file | role |
|---|---|
| `toon.js` | 2D vector engine: its own matrix stack, screen-space line width, boil, flat fill + shade + ink. `setView` for 4:5. |
| `peeps.js` | Open Peeps parts loader and recolourer (async SVG images; `takePending` must be awaited). |
| `chars2.js` | Cast: `peep`, `CAST`/`addCast`, Tony's rig (`ARMS`), `folk2`, `transformFig`. |
| `cast.custom.js` | **Your** characters. |
| `vsl.js` | **The film.** Helpers, backgrounds and props at the top, shots in the middle, render and thumbnails at the bottom. |
| `vsl.html` / `vsl45.html` / `thumb.html` / `charsheet.html` | Pages for 9:16, 4:5, thumbnails and character sheets. |
| `render.mjs` | Playwright renderer: `node render.mjs <outdir> "0-4125,5000" <workers>`; `HTML=vsl45.html` for 4:5; `RESUME=1` to continue. About 40–70 ms per frame. |
| `work/lines.txt` | Script, one line per speech turn: `D|text…` or `T|text…`. |
| `work/timing.json` | Word and line times (from `audio/align.py`). |
| `work/lips.json` | Per-frame mouth openness and speaker (from `lips.py`). |

## Starting a new film from the example
`vsl.js` is the finished Buzztorm film, used as a template.
- **Keep** everything above `// =================== SHOTS ===================`: imports, camera, props, backgrounds, character wrappers, recording rigs and treadmill. Also keep everything from `// =================== render ===================` down, including the thumbnails.
- **Replace** the shots. Delete the Buzztorm-specific shots and write yours. Set `WIPE` (portal transition) to your time or `null`, and reset `Y0 = {}` (4:5 framing).
- Delete backgrounds and props you don't need only after the film renders. Unused ones cost nothing.

## Shot anatomy
```js
// 7. Tony: "If I miss a day, I feel it." (tired close-up)
shot(31.0, (lt, gt) => {           // start time in seconds (from timing.json); lt = local time, gt = global time
  cam(540, 960, 1.0);               // camera centre and zoom (1 = full frame); cam(cx, cy, z, rot)
  bgContent(gt, 1);                 // background
  TONY(gt, { bust: true, x: 540, y: 1960, s: 3.8, mood: gt < 32.2 ? 'tired' : 'worried' });
  const k = pop1(gt, 31.6);         // back-eased 0→1 (overshoot) starting at 31.6 s
  if (k > 0) { push(); translate(800, 600); scale(k); sign(0, 0, 360, 120, '#e8574a', 'DAY 212'); pop(); }
  camEnd();
});
```
- Shots switch at their start time (hard cuts), and drawFrame adds the slow push-in.
- **Timing helpers** (`/core/lib.js` plus vsl.js):
  - `seg(t,a,b)` gives 0..1 across a→b.
  - Easings: `ss` (smoothstep), `eo` / `ei` / `eio` (ease out / in / in-out), `back(k,2.2)` (overshoot), `spring`.
  - `pop1(t, at, d)` is a pop-in. `shake(gt, at, amp)` returns an [x,y] kick.
- Inside a shot, branch by time (`if (gt < 142.2) … else …`) to make sub-beats. Reaction frames land 0–3 frames before the word.
- The pose filter (`prep` / `smooth`) re-evaluates the previous 10 frames "dry" and springs pose parameters, so pose changes ease in on their own.

## toon.js drawing API (composition space 1080×1920)
- **Transforms**: `push() pop() translate(x,y) rotate(a) scale(sx,sy) zoom() getM()`
- **Shape builders**:
  - `rect(x,y,w,h)`, `rr(x,y,w,h,r)` (rounded), `ell(cx,cy,rx,ry,n)`, `arc(cx,cy,rx,ry,a0,a1,n)`
  - `spline(pts, closed, k)` (Catmull-Rom), `quad(a,c,b)`, `noodle(a,b,bend,w0,w1)` (tapered limb)
- **Drawing**:
  - `shape(pts, { fill, lw: 7, line: INK, shade: () => {...}, boil: 1, alpha, closed })`
  - `fillOnly(pts, col, {boil:0})`, `stroke(pts, lw, {line})`, `dot(x,y,r,col)`, `bands([cols], y0, y1)`
  - `text(str, x, y, { font: '400 64px "Bungee"', fill, align, base, outlineW, outlineCol, rot })`
- The `shade` callback runs clipped to the shape. Put the hard shadow blocks, screen contents and UI rows there.
- Line width is in screen pixels (7 by default). Use `lw` of 4–6 on small UI elements and 9–11 on big title plates.

## Ready-made pieces in vsl.js
- **Backgrounds**:
  - `bgStudio(gt)`: Tony's studio with the before/after poster.
  - `bgContent(gt, night)`: the creator room.
  - `bgCasino`: the ads world, with `adsMachine(x,y,gt,{price,year,on})`.
  - `bgBoard`: navy explainer. `bgChalk`: chalkboard.
  - `bgStreet`, `gymFront(t)`: the PULSE gym front.
  - `bgCommunity`: warm interior.
  - `bgBeach(gt)` + `beachSet`: umbrella and side table.
  - `bgStage`: Buzztorm studio, slatted wood with an orange LED strip.
  - `bgOffice`; `wall`, `floorB`, `door(x,y,w,h,col,label,open)`.
- **Props**:
  - `sign(x,y,w,h,bg,txt,{font,fg,rot})`, `pill(x,y,txt,bg,fg,size,rot)`, `panel(x,y,w,h,fill)`, `tag`
  - `coin`, `bill`, `mug`, `steam`, `phone(hp)`, `tablet`, `chalk`, `dumbbell`, `clock(x,y,r,hrs,label)`
  - `poof`, `stars(x,y,k,n,R)`, `arrow(a,b,col,w,k)`, `xMark`, `check`, `sweatDrop`, `umbrella`
- **Recording setups** (whenever someone records content; "REC" only here):
  - `tripod`, `recDot`, `phoneRig(x,y,gt,label,s)`
  - `cameraRig(x,y,gt,s,flip)`, `softbox(x,y,s,flip)`, `ringStand` (via TONY `ringLight:true`)
- **Treadmill, front view**: `treadBack(x,y,s,gt,speed)`, then `TONY({run:true,...})`, then `treadFront(x,y,s,label,val)`.

## Recipes that worked
- **A number that changes**: draw it with `String(Math.round(lerp(a,b,ss(seg(gt,t0,t1)))))` in VT323 or Bungee, with a coloured bar chart that grows alongside it.
- **Phone or app screen answering a question**:
  1. First show "checking…" with three bouncing dots.
  2. At the answer word: shake the phone for 0.5 s (`Math.sin(t*90)*6*(1-k)`).
  3. The counter shoots up and notification pills slide in one after another (`seg` staggered by 0.18 s).
  4. Finish with stars.
- **UI cards** (ad account, CTA): a cream `rr` with a navy header, the real character's bust as the avatar (clip a circle and draw `TONY({bust:true})` inside), a status pill, and stamps (`FLAGGED`) rotated about −0.1.
- **Before/after**: `transformFig(..., after = gt > T)` plus `poof` and `stars` at T.
- **A lot of people**: a grid of `folk(x,y,s,i,{walk})` with different `i`. Each `i` is stable, so the same person keeps their look.
- **A concept diagram** on `bgBoard`: nodes are folk or pills, edges are `arrow(…, k)` drawn on with staggered `k`, and labels go on top of everything else.

## 4:5 version
`vsl45.html` calls `setAspect('45')`. drawFrame then calls `setView(1400, 1750, 160, -Y0[i])` for each shot, so the composition is seen through a window 1400 wide and 1750 tall (160 px of extra world on each side, top at Y0, default 140). Render with `HTML=vsl45.html node render.mjs frames45 "0-N" 3`, and `finish.sh` scales it to 1080×1350.
- Backgrounds already extend to x −600…1680. Any new full-screen fill must use `g.setTransform(1,0,0,1,OX,OY)` and `fillRect(-OX,-OY,CW,CH)`. Never use the raw `fillRect(0,0,W,H)`.
- Check one still per shot (`python3 shot_stills.py` gives the frame list) and set `Y0[shotIndex]` lower (70–90) when a sign touches the top.

## Thumbnails (thumb.html + shoot_thumb.mjs)
`renderThumb()` in vsl.js picks a function by `?v=`. The examples are `thumbDraw` (Tony on the beach full of leads) and `thumbAcademy2` (FREE ACADEMY). `node shoot_thumb.mjs out/x.png "?v=academy2"` writes a 1080×1920 PNG.

A winning layout:
1. A headline plate at the top: a white kicker plus a big Bungee title on an orange or navy plate, about 100 px.
2. One hero object in the middle: a phone or course window showing the payoff (a number, a checklist).
3. The character at the bottom as a bust, `happy`, pointing at or holding the hero object.
4. Sunburst rays behind, five or six hand-placed sparkles (never over faces or text), and 3–5 floating notification pills.
5. Check overlaps at full size. Stickers ("100% FREE") go on a corner, never over the hero's text.
