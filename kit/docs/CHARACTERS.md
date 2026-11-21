# Characters: cast, API and how to build new ones

Always render a character sheet (`node shoot_sheet2.mjs <name>` → `ref/sheet_<name>.png`) and **look at it** before a new or changed character goes into a scene. The sheet is where bugs show up: colours landing on the wrong region, a missing hand, a wrong height, or spikes.

## Built-in cast (from chars2.js `CAST`)
| key | who | rig | look |
|---|---|---|---|
| `D` | **Dex**, narrator | Open Peeps | Pomp hair + Chin beard, navy casual jacket `#2c3e66`, dark tee, beige chinos, brown shoes. Standing pose `standing/EasingColorPants`; close-up `effigy/BlazerBlackTee`. |
| `T` | **Tony**, celebrity fitness coach | custom `coach` rig (tonyBody3) | Blond ShortFour hair `#f2cd6b`, coral bandana, gold chain, black tank "TF", coral shorts with white stripe, socks and black sneakers. Bare chest with abs only at the beach. |
| extras | members, leads, clients | `folk2(x,y,s,i,{walk,face,look,happy,sleep,t})` | `i` picks a gendered head, light skin and a bright top. Gender is unambiguous by design. |
| client | before → after | `transformFig(x,y,s,after,t,sport)` | Before: plus-size woman in a dark tee. After: slim model pose in a bikini, or `sport` for a sports top and leggings. |

Reference sheets: `ref/sheet_tony.jpg`, `ref/sheet_dex.jpg`, `ref/sheet_extras.jpg`.

## Drawing them in a shot (wrappers in vsl.js; they handle lip sync, blinks, breathing and moods)
```js
DEX(gt, { x, y, s, face: 1|-1, bust: true, mood, look: [dx,dy], tilt, pose })
TONY(gt, { x, y, s, face, bust, arms, legs, bare, shades, mood, run, squat, holdR: (p)=>prop(p), ringLight, sweat, nerv, acc })
CHAR('M', gt, { x, y, s, face, pose | bust: true, mood, tilt, acc, hold })   // any character registered in cast.custom.js
folk(x, y, s, i, { walk: gt*12, face, look, happy: 1|0, sleep })
transformFig(x, y, s, after, gt, sport)
```
- `x, y`: the feet position in composition space. With `bust:true`, `y` is the chest line near the frame bottom (for example `y: 1960, s: 3.8`).
- `s`: scale. Full body is about 1.0 with feet at y around 1800. Medium shots use 1.3–1.6; close-ups use `bust:true` with s 2.5–4.
- **Moods**: `calm smile happy serious worried fear awe hopeful driven sad cheeky tired sleep blank`. `awe` reads like goggles on Tony, so avoid it.
- **Tony `arms`**: `down hips flex point phone hold runA runB lean`.
  - `run:true` alternates runA and runB and uses the `run` legs. In a front-view treadmill shot, use `treadBack` / `treadFront` (see SCENES.md).
  - `holdR(p)` gives the right-hand position, for drawing a prop in it.
- **Tony `legs`**: `stand walk run sit` (walk needs `walkPh`).
- Tony and Dex are the same height at the same `s` (SCALE T .275 vs D .27 compensates). Keep it that way.

## Adding a new character (do this for every new project)
1. Choose the look from the Open Peeps catalog:
   - **Heads (hair)**: Afro Bald Bangs BangsTwo BantuKnots Beanie Bear Bun BunClip BunKnots BunTwo ColorBun ColorMedium Cornrows CornrowsLight DocOne DocThree DocTwo DreadsOne DreadsTwo FlatTop FlatTopLong GrayShort HatHip Hijab LongAfro LongBangs LongCurly LongHair MediumBangs MediumBangsColor MediumBangsOne MediumOne MediumStraight MediumThree MediumTwo Mohawk MohawkKnots NoHairThree NoHairTwo Pomp Shaved ShavedOne ShavedThree ShortFive ShortFour ShortOne ShortThree ShortTwo Turban Twists TwistsTwo Wavy
   - **Beards**: Chin Full FullColor FullMax FullMedium Goatee GoateeFull MustacheBull MustacheEight MustacheFive MustacheNine MustacheSeven MustacheSix MustacheThin MustacheThinBull MustacheYosemite
   - **Accessories**: Glasses GlassesTwo–Six Sunglasses SunglassesTwo Eyepatch
   - **Standing bodies**: BlazerColorPants/Tee CrossArmColorPants/Tee Dancer Doc DocHazardous DocStethoscope EasingColorPants/Tee PointingFingerColorPants/Tee Polkadots RestingColorPants/Tee ShirtColorPants/Tee WalkingColorPants/Tee (+ Prothesis variants)
   - **Sitting bodies**: Bike ClosedLegsColorPants/Tee CrossedLegs HandsBackColorPants/Tee MidColorPants/Tee OneLegColorPants/Tee Wheelchair
   - **Busts for close-ups (effigy/)**: BlazerBlackTee ButtonPocketShirt ButtonShirt Coffee Computer Dress Explaining Gaming GymShirt Hoodie Jacket Paper PointingUp PolkadotJacket PoloSweater ShirtCoat SportyTee StripedTee StrippedPocketTee SweaterDots Tee TeeArmsCrossed TeeSelena ThunderTee Turtleneck Whatever
2. Register it in `cast.custom.js`:
   ```js
   addCast('M', { name, head, beard, acc, scale: .265, col: { skin, hair, top, jacket, blazer, pants, shoes, outline: '#17141c' }, pose, bust, sheet: { title, sub, poses: [...], rules, palette: [[name, hex], ...] } })
   ```
   The key letter must match the speaker letter in `work/lines.txt`.
3. Run `node shoot_sheet2.mjs cast:M` and look at `ref/sheet_cast_M.png`. Check:
   - **Colours.** Each body uses its own colour slots: the same `top` colour paints the jacket on Blazer, the shirt on Dancer, and nothing on some poses. Most hairs are solid ink and don't recolour (ShortFour and ColorBun/ColorMedium do). If a pose comes out wrong, pick another pose or set the right slot.
   - **Height** next to Dex, so the scale is right.
   - **Expressions**: every mood portrait should read clearly.
4. Keep the outfit identical in every scene. Close-ups use the matching `effigy/` bust.

## Custom rigs (when Open Peeps bodies aren't enough)
Tony's `coach` rig (chars2.js: `ARMS`, `armShape`, `fist`, `legShape`, `STANCE`, `tonyBody3`) is the model for a muscular or athletic lead who needs his own outfit and poses.
- It uses neck-origin units: neck (0,0), shoulders at about ±300 / 210, waist at 1000, feet at y 2480.
- Arms are quadratic shoulder → elbow → wrist chains with a tapered outline and rounded tops.
- Draw order: legs → shorts → back arms → neck → torso (fill plus partial strokes, so the shoulder lines meet the arm edges) → tank or bare chest → front arms → props → chain.
- New poses are rows in `ARMS` / `STANCE`. Add a pose, then check it on the sheet (`tony` page) at a large size.
- Fists are drawn at 1.25× with a back of hand, curled fingers, three crease lines and the thumb inside the silhouette. Mode `point` draws an index finger. Phone grip is arm mode `none` plus fingers drawn around the phone.

Lessons the client flagged (check every time):
- Shoulder spikes
- Thin legs
- Blocky fists
- A thumb poking outside the hand
- Hands hidden behind the torso on `hips` (they must draw in front)
- The lower body missing in medium shots
- Outfit drift between scenes
- Running arms flailing (they must pump in front of the belly)
- A front-view runner on a side-view treadmill
