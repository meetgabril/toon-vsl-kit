# Sound effects

The house sound (palette, theme and moods, leitmotifs, sonic logo, voice kits, walla, style chains, mix ladder) is `library/docs/SOUND.md`. Read it before scoring or choosing sounds.

Catalog: `~/buzztorm-studio/library/sfx/catalog.json` (128 effects in 11 categories). Approved sources: `library/sfx/sources.json`. Tool: `sfx.py` (copied into every project).

## Library contents
- `library/sfx/files/<id>.wav`: the chosen file for a catalog slot (54 of 128: Kenney CC0 + The Designer's Choice CARTOON; `credits.json` records the source and original file).
- `library/sfx/packs/`: raw packs kept whole for alternates (Kenney Interface, UI, Digital, Impact, RPG, Sci-fi, Music Jingles: 552 files, CC0). `packs/designers-choice/`: 364 cartoon sounds (boings, slide whistles, zips, bonks, squeaks, gulps, vocal FX, vehicles), royalty-free for commercial use and ads, never redistribute the raw files (this repo must stay private). `packs/index.json` lists all files with tags and duration.
- Licensed sounds (cartoon pack + Sonniss walla, ambiences, reactions) live in git-ignored folders. At the start of any session that renders a video: if `library/sfx/files-licensed/` is missing, stage `~/Downloads/buzztorm-cartoon-ogg.tar` and `~/Downloads/buzztorm-gdc/buzztorm-gdc-picks.tar` from the Mac (device_stage_files) and run `python3 library/sfx/import_licensed.py <both tars>`. Without them the studio still works on public sounds (kit reports what falls back or is missing). Never commit licensed files.
- `brands/<brand>/sound-signature.json`: the brand's fixed sound for each engine event (pop, ding, whoosh, stamp…) plus its 3 stings in `brands/<brand>/sfx/`.

## Signature first (every video)
Before autoscore, always run `python3 sfx.py kit`. It copies THE studio sound (library/sound/signature.json: events, gags, leitmotifs, stings, places) into `sfx/`, so every video of every brand uses the same sound for the same idea. Never pick a different sound for an event in one video; change the signature instead (all future videos follow).

## Commands (run in the project folder)
- `python3 sfx.py list [category]`: the catalog. `[file]` = in the shared library, `[synth]` = built-in, `[ai]` = generated on request.
- `python3 sfx.py find <words>`: search by name or use ("reveal", "money", "fail").
- `python3 sfx.py get <id>`: writes `sfx/<id>.wav`. Order: shared library file → ElevenLabs (if `ELEVENLABS_API_KEY`) → built-in synth. If none, it prints search terms and approved sites; ask the team for the file (never download it yourself).
- `python3 sfx.py add <id> <file> --source <source-id>`: registers a file the team sent into the shared library (`library/sfx/files/`, with credits.json). Refuses sources marked "no".
- `python3 sfx.py sources`: what is allowed.
- `python3 sfx.py kit`: the studio sound into `sfx/` (run in every video; reports fallbacks and missing slots).
- `python3 sfx.py signature <brand>`: show the brand's signature.
- `python3 sfx.py browse <words>`: search the 552 raw pack files (alternates, variations).
- `python3 sfx.py add <id> kenney/<pack>/<file> --source kenney`: promote a pack file to a catalog slot.
- `python3 sfx.py session [category]`: ElevenLabs sheet for slots without a file; `sfx.py addall <folder> --source elevenlabs` to register the results.
- `python3 audio/orchestra.py kit`: the studio theme performed by the real orchestra (VSCO 2 CE, CC0) in 8 moods + leitmotifs by role + stings + musical gags, into `library/sound/music/` (.ogg). autoscore uses the same orchestra for every video's score.
- `python3 audio/reactions.py script|split|list`: character voice kits (32 reactions in the character's own voice).

autoscore.py uses `sfx/<name>.wav` when present, else its synth, so a library file automatically upgrades every video.

## Categories
transitions · impacts · text_ui · money_sales · comedy_reaction · phone_social · tension_hook · magic_reveal · office_creator · ambience · brand

## Rules
1. Sources: only "ok" sources for ads; "organic" sources only for organic posts; "credit" adds the credit line to the caption; "no" never (BBC archive, CC BY-NC, meme soundboards).
2. Trending/meme sounds (vine boom, bruh…) are added in the Instagram/TikTok app when posting, never baked into the file. Note them in post.md under "Posting note".
3. No branded sonic logos of other companies (Netflix ta-dum, iPhone ringtone, Windows sounds).
4. Mix: voice at 0 dB, SFX −8 to −12 dB under voice, ambience −24 dB or lower, music −18 dB under voice. Nothing clips.
5. One SFX per idea, not per word. Short-form rhythm: one hit per cut; a riser only before a real reveal; silence before the punchline.
6. First 3 seconds: one tension or hook sound at most. Loops: end on room tone so the loop is seamless.
7. No synth sound is ever delivered: autoscore and kit leave a slot silent and report it. Synth only for drafts with SYNTH_SFX=1.
8. Every brand uses THE studio signature (`sound-signature.json`): one sound per engine event, plus 3 stings (logo-sting, outro, series-bump) in `brands/<brand>/sfx/`. New brand: copy Buzztorm's signature, then change only what the brand's tone needs. Prefer library files over ElevenLabs; generate with AI only for a slot no pack covers, then `add` the approved result so it is never generated again.
8. Remakes of a team-supplied video keep the original audio; don't add SFX on top unless asked.
