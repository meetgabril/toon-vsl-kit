# Sound effects

Catalog: `~/buzztorm-studio/library/sfx/catalog.json` (128 effects in 11 categories). Approved sources: `library/sfx/sources.json`. Tool: `sfx.py` (copied into every project).

## Commands (run in the project folder)
- `python3 sfx.py list [category]`: the catalog. `[file]` = in the shared library, `[synth]` = built-in, `[ai]` = generated on request.
- `python3 sfx.py find <words>`: search by name or use ("reveal", "money", "fail").
- `python3 sfx.py get <id>`: writes `sfx/<id>.wav`. Order: shared library file → ElevenLabs (if `ELEVENLABS_API_KEY`) → built-in synth. If none, it prints search terms and approved sites; ask the team for the file (never download it yourself).
- `python3 sfx.py add <id> <file> --source <source-id>`: registers a file the team sent into the shared library (`library/sfx/files/`, with credits.json). Refuses sources marked "no".
- `python3 sfx.py sources`: what is allowed.

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
7. Every brand should own 3 signature sounds (category brand: logo-sting, outro, series-bump). Generate once, approve, `add` them to the library under the brand's name, reuse everywhere.
8. Remakes of a team-supplied video keep the original audio; don't add SFX on top unless asked.
