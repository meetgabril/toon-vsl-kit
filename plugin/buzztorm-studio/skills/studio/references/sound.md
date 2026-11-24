# Sound effects

Catalog: `~/buzztorm-studio/library/sfx/catalog.json` (128 effects in 11 categories). Approved sources: `library/sfx/sources.json`. Tool: `sfx.py` (copied into every project).

## Library contents
- `library/sfx/files/<id>.wav`: the chosen file for a catalog slot (54 of 128: Kenney CC0 + The Designer's Choice CARTOON; `credits.json` records the source and original file).
- `library/sfx/packs/`: raw packs kept whole for alternates (Kenney Interface, UI, Digital, Impact, RPG, Sci-fi, Music Jingles: 552 files, CC0). `packs/designers-choice/`: 364 cartoon sounds (boings, slide whistles, zips, bonks, squeaks, gulps, vocal FX, vehicles), royalty-free for commercial use and ads, never redistribute the raw files (this repo must stay private). `packs/index.json` lists all 916 files with tags and duration.
- `brands/<brand>/sound-signature.json`: the brand's fixed sound for each engine event (pop, ding, whoosh, stamp…) plus its 3 stings in `brands/<brand>/sfx/`.

## Signature first (every video)
Before autoscore, always run `python3 sfx.py kit --brand <brand>`. It copies the brand's signature sounds into `sfx/`, so autoscore uses the same sound for the same idea in every video. Never pick a different sound for an event in one video; to change it, change `sound-signature.json` (all future videos follow). Stings with status `candidate` are used but must be approved by the user on the Sound Library page before the brand is called finished.

## Commands (run in the project folder)
- `python3 sfx.py list [category]`: the catalog. `[file]` = in the shared library, `[synth]` = built-in, `[ai]` = generated on request.
- `python3 sfx.py find <words>`: search by name or use ("reveal", "money", "fail").
- `python3 sfx.py get <id>`: writes `sfx/<id>.wav`. Order: shared library file → ElevenLabs (if `ELEVENLABS_API_KEY`) → built-in synth. If none, it prints search terms and approved sites; ask the team for the file (never download it yourself).
- `python3 sfx.py add <id> <file> --source <source-id>`: registers a file the team sent into the shared library (`library/sfx/files/`, with credits.json). Refuses sources marked "no".
- `python3 sfx.py sources`: what is allowed.
- `python3 sfx.py kit --brand <brand>`: the brand's signature sounds into `sfx/` (run in every video).
- `python3 sfx.py signature <brand>`: show the brand's signature.
- `python3 sfx.py browse <words>`: search the 552 raw pack files (alternates, variations).
- `python3 sfx.py add <id> kenney/<pack>/<file> --source kenney`: promote a pack file to a catalog slot.

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
7. Every brand owns a sound signature (`sound-signature.json`): one sound per engine event, plus 3 stings (logo-sting, outro, series-bump) in `brands/<brand>/sfx/`. New brand: copy Buzztorm's signature, then change only what the brand's tone needs. Prefer library files over ElevenLabs; generate with AI only for a slot no pack covers, then `add` the approved result so it is never generated again.
8. Remakes of a team-supplied video keep the original audio; don't add SFX on top unless asked.
