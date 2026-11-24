# Hook Library (viral hooks to replicate)

`~/buzztorm-studio/library/hooks/<id>/`: a viral example taken apart so any brand can replicate it.
- `hook.json`: timeline, rhythm, measured cuts/colours/text boxes, why it works, variables, rules, `modes`.
- `source.mp4`: the example video supplied by the team (kept for exact remakes; rights stay with the owner; organic posts only).
- `remake.json`: the exact-remake spec. `own_version_*`: the same mechanics with the brand's own drawn bait.

## Two modes (ask only if unclear; default = exact remake)
1. **Exact remake (default when the team says "the same", "igual", "with the same video")**: same footage, same audio, same cuts to the frame, same layout. Only the text, the brand colours and the brand font change.
2. **Own version**: same mechanics, the brand's own bait drawn by the engine (no third-party footage). Use for ads and when the brand wants fully original content.

## Using a hook
- Make something → Reel → screen 5 "Which hook?" shows up to 2 brand-written hooks + up to 2 library hooks that fit the goal ("Library: <name> (<duration>)").
- Exact remake: in the project folder `cp $S/library/hooks/<id>/source.mp4 work/example.mp4`, copy `remake.json` to `kinetic.json`, write the brand's texts, `python3 kinetic.py kinetic.json`.
  Text rule: keep each text's length close to the original's (same number of characters ± 2) so sizes match the original; the words in a `group` share one size; question/CTA fit ≤ 0.88 of the width.
- `script.md` lists every on-screen line (`ON SCREEN: …`) for the gate. Run the gate `--stage final`; also compare 6 frames side by side with the original (same cut frames, same fill) before review.

## Adding an example (the team sends a video)
1. Save it as `work/example.mp4`; `python3 deconstruct.py work/example.mp4 qa/deconstruct`:
   - `sheet.jpg` (3 fps contact sheet), `cuts.json` (cuts in seconds and **frames**, every segment with colours, text width/height/centre for flat text cards, audio loudness and speech check), `remake_draft.json` (a ready kinetic spec: original footage until the first card, original audio, one card per text card).
2. Read the sheet and the native frames around each cut; write down every on-screen text, the sound, the loop, the CTA, any motion inside shots (if the cards move, note it: the remake must reproduce it).
3. Write `hook.json` (timeline, measured, why it works, variables, rules, modes). Copy the video to `library/hooks/<id>/source.mp4`.
4. Build the exact remake for the brand that asked (fill the draft's TODO texts), compare frame by frame with the original (same cut frames, same text fill and position), pass the gate, deliver.
5. Save `remake.json` and the comparison image (`remake_vs_original.jpg`); commit "Library: hook <id>".
Menu after delivery: Add it to the Hook Library ★ · Adjust the remake · Make an own version · Discard.

Formats that are not text cards (talking head, character skits, screen recordings): describe the shots in `hook.json` and rebuild them with the engine and the brand's characters (own version); exact remakes only reuse footage the team supplied.
