---
name: studio
description: 'Buzztorm Studio, the agency''s menu-driven content studio for its own infoproduct brands and its client brands. This skill should be used when the user types "/studio" (optionally followed by a brand name), or asks to "create content", "make a reel", "make trial reels", "make a carousel", "make a post", "make a story", "make a meme", "make an ad", "make a lesson", "make a course", "make a playbook", "make an ebook", "make a checklist", "make a worksheet", "make a cheat sheet", "make a YouTube video", "make a sales page video", "make a Discord announcement", "plan the week", "add a brand", "add a character", "add a background", "continue a project" or "log results", or anything else about producing content for a Buzztorm brand.'
metadata:
  version: "0.2.2"
---

# Buzztorm Studio

One studio, many brands. Every brand (Buzztorm included) shares the Studio Standards, the Recipes and the Quality Gate. Each brand owns its **Brand Brain** (audience, offers, voice, proof, claims policy, facts, CTAs, series, ideas), its look (colors, characters, backgrounds, props) and its results.

Three layers, always in this order:
1. **Brand Brain**: why this piece exists (goal, idea, audience, offer, CTA).
2. **Content Factory**: how it is made (the format's Recipe in `library/recipes/<id>.json`).
3. **Quality Gate**: proof it is right before anyone sees it (`python3 studio.py check`).

Everything is driven by menus. The user never types a command, a file name or a required free-text answer.

## Vocabulary (use only these words with the user)
Brand · Brand Brain · Goal (Grow, Teach, Sell, Community) · Idea · Offer · CTA · Format (Reel, Trial reels, Carousel, Post, Story, Meme, Ad concept pack, YouTube video, Sales page video, LinkedIn video, Presentation loop, Lesson pack, Course, Playbook, E-book, Checklist, Worksheet, Cheat sheet, Discord announcement, Discord event, Emoji & stickers & sounds, Welcome kit) · Script type · Hook · Visual style · Size · Characters · Backgrounds · Props · Options (Subtitles, Post copy, Hashtags, Alt text, Mention) · Preset · Series · Hook test · Quality check · Delivery package · Studio Library · Studio Standards.
Never say recipe, studio.py, JSON, story.js, beats, engine, kit or file paths to the user. Speak the user's language in chat; all content is in English.

## Menu rules (Hick's law, KISS)
1. AskUserQuestion for every decision: at most 4 options, recommended first with "(Recommended)". Typed "back" and "home" navigate.
2. Screen titles are questions; buttons are verbs.
3. Ask only what changes the result; skip screens whose answer is implied; ask independent screens in one call.
4. Defaults (characters, visual style, size, options, CTA) are shown on the review card, never asked.
5. Revisions are menus too (`references/menus.md` → Revisions). Free text is always optional, never required.
6. Without AskUserQuestion, show the same menu as a numbered list.

## Start of every session
1. `git -C ~/buzztorm-studio pull --ff-only` if it exists, else `git clone https://github.com/meetgabril/toon-vsl-kit ~/buzztorm-studio` (if refused: add_repo owner `meetgabril`, repo `toon-vsl-kit`, access `push`, then clone).
2. Tools live in `~/buzztorm-studio/library/tools/`. A project is created with `python3 ~/buzztorm-studio/library/tools/studio.py new <brand> <title> <recipe> --goal <goal> [--offer <id>]` and built in `~/studio/<brand>/<title>` (all tools are copied there; run them from that folder).
3. Brands = folders in `~/buzztorm-studio/brands/` with `brand-profile.json`, except `_template`. A brand whose Brand Brain has no offers gets the Brand Brain interview before its first content (`references/brain.md`).
4. Show Home, or open the brand the user named.

## Producing anything
Follow `references/menus.md` exactly, then the reference for the format's family:

| Need | Read |
|---|---|
| Menus, conditions, revisions | `references/menus.md` |
| Brand Brain: reading it, the interview, keeping it current | `references/brain.md` |
| Recipes and the format catalog | `references/recipes.md` |
| Scripts, hooks, CTA, facts | `references/scripts.md` |
| Video and image production, hook test | `references/production.md` |
| Lessons, courses, playbooks, e-books, checklists, worksheets, cheat sheets | `references/learning.md` |
| Memes | `references/memes.md` |
| Ads | `references/ads.md` |
| Discord | `references/discord.md` |
| Delivery package, post copy, hashtags, file names | `references/delivery.md` |
| Quality Gate: what it checks and how to fix | `references/quality-gate.md` |
| Projects, statuses, archive, results | `references/projects.md` |
| Plan the week, series | `references/planning.md` |
| Add brand, characters, backgrounds | `references/brands.md` |
| Admin, goldens, engine updates | `references/admin.md` |

Engine documentation: `~/buzztorm-studio/library/docs/` (read VIRAL.md, STYLE.md and STORY.md before any script or storyboard).

## Non-negotiable
- Never show the user a script, storyboard, file or text that has not passed the Quality Gate for its stage (`--stage script` before Script review, `--stage final` before Ready for approval). Fix and re-run until it passes; tell the user one line: "Quality check passed (6/6)".
- Every piece has a goal and an idea; every piece except pure Grow content has an offer and a CTA from the Brand Brain.
- Never invent results, testimonials, numbers or facts. Facts come from `brain/facts.json` (verify with a web search and add them first); results from `brain/proof.json`.
- Never search for or download third-party images yourself. Pictures come from the brand's characters, backgrounds and props, or from meme templates the team supplied to the Studio Library (organic posts only, never ads; text added, picture untouched).
- The house drawing style never changes; brands change colors, characters, backgrounds and words.
- The voiceover is never altered. The picture follows the voice.
- Every request for changes is a symptom: fix that class of problem in the whole piece, bump the version, re-run the gate.
- Never mix brands.

## After each approval
Update the status with `studio.py status`, package with `studio.py package`, commit and push the brand folder (`references/projects.md`), archive media (Google Drive when connected), deliver files with SendUserFile and the post text in a code block. Keep chat short: what was made, the delivery package, the next menu.
