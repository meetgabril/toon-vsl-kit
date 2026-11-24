# Hook Library (viral hooks to replicate)

`~/buzztorm-studio/library/hooks/<id>/hook.json`: a viral example taken apart into a recipe any brand can reuse: timeline (seconds, role, visual, sound), rhythm, why it works, variables to fill, rules, how to build, an example for one brand.

## Using a hook
- Make something → (Grow or Sell) → Reel → screen 5 "Which hook?" shows up to 2 brand-written hooks + up to 2 Hook Library hooks that fit the goal (`goals` in hook.json) as "Library: <name> (<duration>)".
- Fill the variables from the Brand Brain (persona need → question; offer benefits → words; cta.json → CTA; the brand's world → bait object). Show them on the Script review card with the timeline.
- Build exactly as `build` says. Bait + kinetic text hooks: engine frames for the bait (QA=1) + `python3 kinetic.py kinetic.json` (copy the hook's kinetic.json and story.js as the starting point). Videos with characters/voice: normal production.
- `script.md` lists every on-screen text line (`ON SCREEN: …`) so the gate can check claims and CTA. Gate `--stage final` before review.

## Adding an example (the team uploads a video)
Menu: Studio Library → Hook Library → Add an example (or the user simply sends a video and asks to replicate it).
1. `python3 deconstruct.py <video> qa/deconstruct` → read `sheet.jpg` frame by frame and `cuts.json` (cuts, shot lengths, loudness, speech-likeness, silences).
2. Write down: what happens in each shot, every on-screen text with its size/position/colours, the sound per shot, the rhythm, the loop, the CTA.
3. Explain why it works (open loop, pattern interrupt, curiosity, payoff, rewatch, send trigger) in 2–4 bullets, and the rules that make it work.
4. Turn the specifics into variables (what changes per brand) and keep the mechanics fixed.
5. Build a version for the brand that asked (or Buzztorm), pass the gate, deliver it.
6. Save `library/hooks/<id>/hook.json` + the build files + the brand example's contact sheet; commit "Library: hook <id>". Never store the original third-party video in the repository; describe it in `source`.
Menu after delivery: Add it to the Hook Library ★ · Adjust the version · Discard.

Never copy the original's footage, music or exact wording; replicate the structure with the brand's own world, words and visuals.
