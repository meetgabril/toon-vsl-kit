# Recipes (Content Factory)

Every format is a Recipe: `~/buzztorm-studio/library/recipes/<id>.json`. Read the recipe before producing; the Quality Gate checks the output against it. Index and menu order: `library/recipes/index.json`.

Recipe fields: `family`, `goals`, `render` (video · stills · meme · pdf · assets), `sizes` (with safe zones in final pixels), `length`, `count`, `parts` (required parts and their rule), `layout`, `text.min_px`, `copy` (fields of the text to post), `hashtags` (limits per platform), `options`, `script_types`, `files`, `limits`, `notes`.

## Catalog
| Family | Formats (recipe id) | How it is made |
|---|---|---|
| Social | Reel (`reel`), Trial reels (`trial-reels`), Carousel (`carousel`), Post (`post`), Story sequence (`story`), Meme (`meme`) | `production.md`, `memes.md` |
| Web | YouTube video, Sales page video, LinkedIn video, Presentation loop | `production.md` |
| Ads | Ad concept pack (`ad-concept-pack`) | `ads.md` |
| Learning | Lesson pack, Course, Playbook, E-book, Checklist, Worksheet, Cheat sheet | `learning.md` |
| Community | Discord announcement, Discord event, Emoji & stickers & sounds, Welcome kit | `discord.md` |

## Platform facts built into the recipes (Nov 2026)
- Instagram ranks mostly on watch time, likes per reach and sends per reach; sends drive reach to non-followers → every Grow piece names who the viewer will send it to.
- Accounts posting mostly unoriginal content (reposts, untransformed templates) stop being recommended → only the brand's own drawings.
- Carousels: up to 20 slides organic (10 in ads); 7–10 for teaching, 3–5 for emotional stories.
- Hashtags: max 5 on Instagram posts and Reels.
- Reels organic safe zone used here: top 220, bottom 340, sides 60/120 px; Meta ads 9:16: top 14 %, bottom 35 %, sides 6 % (269/672/65 px at 1080×1920).
- Stories: leave 250 px top and 340 px bottom for UI and the sticker.
- Micro-lessons: one objective, 2–5 minutes, recall questions after.
- Lead magnets: short and specific beats long and generic (checklist with a number in the title).
