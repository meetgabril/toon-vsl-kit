# Buzztorm Studio (plugin)

Buzztorm's menu-driven cartoon content studio. Type `/studio`, pick a brand, and follow the menus.

- **One house style, many brands.** Every brand (Buzztorm included) shares the Studio Standards; each brand has its own colours, characters, backgrounds, series guide, hooks and results.
- **Content:** Reel, Trial reels (hook test), Post, Carousel, Story, YouTube video, Sales page video, LinkedIn video, Presentation loop, Discord announcement, event, emoji, stickers, soundboard sounds and server assets.
- **Delivery package:** the files plus the text to post (post copy, hashtags, alt text, YouTube titles and chapters, Discord message). Subtitles, post copy, hashtags and alt text are options with brand defaults.

The studio itself (engine, Studio Library, brands) lives in the same repository: https://github.com/meetgabril/toon-vsl-kit

## Install
In Claude Code: `/plugin marketplace add meetgabril/toon-vsl-kit`, then `/plugin install buzztorm-studio@buzztorm`.
In the Claude app: install the `buzztorm-studio.plugin` file.

## Use
- `/studio` — Home: choose a brand, add a brand, Studio Library, Admin.
- `/studio <brand>` — open a brand directly.

Voiceovers are recorded by the user in ElevenLabs (the studio writes the text and voice descriptions) and uploaded as one file.
