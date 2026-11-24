# Brands (look, characters, backgrounds)

Each brand: `~/buzztorm-studio/brands/<brand-id>/` copied from `brands/_template/`:
```
brand-profile.json   colors (10 roles), fonts, signs (text painted on shared backgrounds), logo, visual style, audio,
                     characters (name, role, voice description, voice_id), hashtags, options, presets, weekly_mix, archive, portfolio
brain/               Brand Brain (brain.md)
brand-rules.md · series-guide.md · hooks.md · results.csv
characters/cast.custom.js · backgrounds/sets.custom.js · props/ · projects/ · calendar/
```
Colour roles: primary, primary_dark, accent (brand and CTAs), highlight, paper, paper_dark, positive, negative, secondary, tertiary. Null keeps the studio default. Ink never changes. `signs` replaces the brand names painted on shared backgrounds (e.g. the studio poster, the gym sign) so another brand's name never appears.

## Add brand
1. Plain text, one message: name, website or brand guide, what they sell, who it's for.
2. Read the site/guide; propose the 10 colour roles (contrast: text on paper and on primary must be readable) and the signs.
3. "Who is the main character?" Founder ★ · A customer · A mascot · Write my own → New character flow for a main and a supporting character.
4. One home background (New background flow).
5. Brand Brain interview (`brain.md`).
6. Brand card for approval: Approve ★ · Change colours · Change characters · Change Brand Brain. On approval: create the folder from `_template`, fill everything, commit and push "Add brand <name>", offer the first piece.

## New character
Open Peeps parts (`library/docs/CHARACTERS.md`), `addCast` in `characters/cast.custom.js`, entry in `brand-profile.json` → characters. In a project of the brand: `node shoot_sheet2.mjs cast:<KEY>`, look at the sheet (colours on the right regions, height next to Dex, every mood readable, no spikes, thumb inside the fist). Menu: Approve ★ · Change look · Change outfit · Start over. Save the sheet as `characters/sheet_<name>.jpg`, commit.

## New background
`addSet('<name>', gt => …)` in `backgrounds/sets.custom.js` with toon.js shapes (flat fill, hard shade, plum ink, floor ≈ y 1300, free areas for characters and titles); use role colours so it follows the palette. Test scene with a character, render with `QA=1`, check, send. Menu: Approve ★ · Change · Start over. Commit.

## Share to library
Generic backgrounds/props can be proposed to every brand: copy without logo/names to `library/shared/<name>.js` + reference image; add a line in `library/shared/REQUESTS.md`.
