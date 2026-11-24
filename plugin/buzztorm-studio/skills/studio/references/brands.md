# Brands

Each brand is a folder in `~/buzztorm-studio/brands/<brand-id>/` with the same structure (copy of `brands/_template/`):
```
brand-profile.json   colors, logo, fonts, voices, hashtags, options, presets, discord
brand-rules.md       rules on top of the Studio Standards
series-guide.md      the series, characters, running gags, audience archetypes, catchphrases
hooks.md             proven hooks and ideas
results.csv          results per version
characters/cast.custom.js     the brand's characters (addCast)
backgrounds/sets.custom.js    the brand's backgrounds (addSet)
props/               reference images for the brand's props
projects/            one record per project
```
A brand never uses another brand's characters, backgrounds, props or hashtags.

## Brand Profile fields
- `colors`: the ten roles every brand fills: `primary`, `primary_dark`, `accent` (the brand and CTAs), `highlight`, `paper` (light backgrounds and cards), `paper_dark`, `positive`, `negative`, `secondary`, `tertiary`. A role left null keeps the studio default. Ink is never a brand colour.
- `fonts`: from the studio shelf (Bungee titles, Baloo 2 labels, VT323 screens) unless the Admin adds a font to the Studio Library.
- `visual_style.default` and `.avoid`; `audio.music` (moods: sitcom, happy, think, casino, aerobics, island, folk, tension, build) and `audio.sonic_logo`.
- `characters`: key letter → name, role, ElevenLabs voice description. Keys must match `cast.custom.js`.
- `hashtags`: `brand`, `series`, `niche` list.
- `options`: defaults for Subtitles, Post copy, Hashtags, Alt text, Mention.
- `presets`: saved menu paths (`name`, `channel`, `content`, `script_type`, `audio`, `repurpose`).
- `discord.boost_level`.

## Add brand
Ask the minimum, then build, then show for approval.
1. Plain text, one message: brand name, website or brand guide (or an upload), what they sell, who the content is for, tone.
2. Read the website or guide. Propose the 10 colour roles from the brand's colours (contrast check: text on `paper` and on `primary` must stay readable).
3. Menu "Who is the main character?" Brand founder ★ · A customer · A mascot · Write my own. Then design 2 characters (main + supporting) with the New character flow, 3 options each on one sheet.
4. Build one home background with the New background flow.
5. Write `series-guide.md` (series idea, running gags, 3–5 audience archetypes) and seed `hooks.md` with 10 ideas for the niche (verified facts only).
6. Show the brand card: colours (style card), characters, background, series idea. Menu: Approve ★ · Change colours · Change characters · Change series.
7. On approval: create the folder from `_template`, fill every file, commit and push ("Add brand <name>"). Offer the pilot: Create content → Reel.

Brand id: lowercase-with-hyphens of the name.

## New character
1. Plain text: who they are, role (hero, narrator, supporting, extra), look, outfit colours, voice.
2. Choose from the Open Peeps catalog (`library/docs/CHARACTERS.md`): head, beard, accessory, standing pose, sitting pose, bust. Pick a free key letter.
3. Add to `characters/cast.custom.js` with `addCast`, add to `characters` in the Brand Profile.
4. In a project folder for this brand: `node shoot_sheet2.mjs cast:<KEY>` and look at the sheet: colours on the right regions, height next to Dex, every mood readable, no spikes, thumb inside the fist.
5. Send the sheet. Menu: Approve ★ · Change look · Change outfit · Start over. Save the sheet to `characters/sheet_<name>.jpg`. Commit and push.

## New background
1. Plain text: what the place is and the props in it.
2. Draw it in `backgrounds/sets.custom.js` with `addSet('<name>', gt => …)` using toon.js shapes: flat fill, hard shade, plum ink, floor line around y 1300, free areas for characters and titles (`library/docs/SCENES.md`). Use role colours (studio defaults) for anything that should follow the brand palette.
3. Render a test scene with a character in it; send it. Menu: Approve ★ · Change · Start over. Commit and push.

## Share to library
A background or prop that is useful for every brand can be proposed to the Studio Library. Make a copy without the brand's logo, names or brand-only colours, put it in `library/shared/<name>.js` with a reference image, and add a line to `library/shared/REQUESTS.md`. Admin approves it.
