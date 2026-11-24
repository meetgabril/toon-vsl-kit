# Admin

For Buzztorm staff. Menu "What do you want to manage?":
- All brands ★ · Engine updates · Library requests · Portfolio

## All brands
A table: brand, number of projects by status, last project date, last logged results. Then: Open a brand ★ · Export the table.

## Engine updates
Changes to `library/` (engine, docs, tools) affect every brand. Rules:
1. Make the change on the engine, never inside one brand's project folder.
2. Test with at least two brands: run setup for `buzztorm` and one other brand, render the same test scene, compare.
3. Bump `version` in `plugin/buzztorm-studio/.claude-plugin/plugin.json` when the plugin's behaviour changes.
4. Commit with a message that says what every brand gets ("Library: …"), push.

## Library requests
Read `library/shared/REQUESTS.md`. For each request: show the reference image. Menu: Add to library ★ · Ask for changes · Decline. On add: register the background with `addSet` in the engine's `sets.custom.js` default or document it in `library/docs/SCENES.md`, remove brand traces, commit.

## Portfolio
A list of approved projects whose brands allow showing them (ask the user per brand the first time and save `"portfolio": true|false` in the Brand Profile). Deliver a contact sheet of the best frames and the list of files.
