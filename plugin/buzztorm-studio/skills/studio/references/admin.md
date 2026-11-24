# Admin

Menu "What do you want to manage?" All brands ★ · Engine updates · Library requests · Portfolio.

## All brands
Table per brand: projects by status, last project, last results, Brand Brain gaps (TODO fields, offers without links, personas missing). Then: Open a brand ★ · Fill the gaps · Export the table.

## Engine updates (affect every brand)
1. Change `library/` (engine, tools, recipes, templates), never a brand's project.
2. Regression with the goldens (`library/goldens/`): rebuild each golden in a fresh project (`studio.py new` for two brands: buzztorm and one other), render with `QA=1`, run `studio.py check --stage final`; every golden must pass and look the same on its contact sheet.
3. Bump the plugin version in `plugin/buzztorm-studio/.claude-plugin/plugin.json` and the skill metadata when behaviour changes; validate with `claude plugin validate plugin/buzztorm-studio --profile directory --strict`.
4. Commit "Library: …" and push.

## Library requests
`library/shared/REQUESTS.md`: show each request's reference image. Add to library ★ · Ask for changes · Decline. On add: remove brand traces, register it, document it in `library/docs/SCENES.md`, commit.

## Portfolio
Approved projects of brands with `"portfolio": true` (ask per brand the first time). Deliver a contact sheet of the best frames and the list of files.
