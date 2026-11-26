# Memes

Two ways, chosen in the menu:

1. **Meme templates (default)**: real meme templates supplied by the team, stored once in the Studio Library (`library/memes/templates/<id>/`), shared by every brand. The studio only writes the brand's text into the template's text boxes. Comparatives first (prefer/reject, two options, before/after, expectation/reality).
2. **Drawn formats**: the same joke structures (`library/memes/formats.json`) drawn with the brand's own characters. Use when no template fits, for ads, or when the brand wants its characters in the joke.

## Rules for templates
- Never download or fetch meme images yourself. Templates come only from the team (an upload in the chat or a file in a connected folder). You may search the web to find what is trending and give the team the link to the blank template.
- Templates with real people, film stills or other artists' work: organic posts only, never in ads (ads get rejected or claimed). Ads use drawn formats.
- Add text only; don't alter the picture.

## Always recent: the Trend Radar (run on every meme request)
Memes live a few weeks. Before showing templates:
1. Search the web for what is trending this week (run the searches in parallel, use results from the last 14 days only): Know Your Meme trending and new entries, memeidea.com trending/new (weekly, with brand-safety calls), memebuilder.ai new memes (hourly), Imgflip "Top New", r/MemeTemplatesOfficial new blanks, NapoleonCat monthly trending memes.
2. Keep formats that (a) work as a comparative or fit the idea, (b) are rising or at peak, not dying, (c) pass brand safety.
3. Brand safety tiers:
   - **Green**: pure formats, reactions, fiction, stock-photo or animated scenes with no scandal.
   - **Yellow**: recognisable public figures in a neutral moment (organic only, never implying they endorse the brand).
   - **Red, never**: scandals, affairs, allegations (e.g. accusing a real person of crimes or espionage), crime, tragedies, war, elections and politics, health conditions, private individuals, minors, anything offensive. A trend being huge doesn't change the tier.
4. Show "Which template?" with fresh first: up to 3 options = templates already in the library marked fresh, then trending ones not yet in the library ("Trending now: <name> — add it"), each with one line on why it's trending and its tier · More (cooling/stale/classic templates, drawn formats, Add a template).
5. A trending template not in the library → give the link to its blank template page and ask the team to upload it; register it with `--source <link> --trend <date first seen> --tier green|yellow`.
6. Use a trend within its window: fresh ≤ 14 days, cooling ≤ 45 days (fine if it still fits), stale > 45 days (only under More, unless marked classic). Classics (prefer/reject and similar evergreen comparatives) are always allowed.

## Menu
Make something → Grow → Meme → Trend Radar → "Which template?" (above).
"Add a template" → ask for the image upload, then "What kind of layout?" Text on the right of each row ★ · Text over each row · A label on each side · Top and bottom text. Register it, show the preview with the numbered text boxes, menu: Looks right ★ · Adjust the boxes.

## Commands (inside the project folder)
```
python3 meme_template.py add <uploaded image> <template-id> --layout rows-right|rows-overlay|cols-top|top-bottom --name "Prefer / reject" [--panels 2] [--source <link>] [--trend YYYY-MM-DD] [--tier green|yellow] [--classic yes]
python3 meme_template.py preview <template-id>        # qa/template_<id>.png with the boxes; look at it
python3 meme_template.py list                         # fresh first: age in days, tier, state (fresh, cooling, stale, classic)
```
Odd layouts: edit `template.json` boxes (fractions x0, y0, x1, y1 of the image; style `plain` = dark text on a light area, `classic` = white uppercase with a black outline).
After adding, commit the template folder to the repository ("Library: meme template <id>").

Compose (template mode):
```
{"template": "<template-id>", "texts": ["Posting every day at 5 a.m.", "Building a place where followers meet"], "handle": "@brand",
 "out": "delivery/<brand>_meme_<title>_v1_1x1.png"}
```
`bash make.sh meme meme.json` (runs `meme.py`, then the gate) — fits the template inside the safe margins (1:1, or 4:5 for tall templates), fits each text to its box (refuses below 40 px: shorten it), writes the layout capture for the gate.

Drawn formats: render one still per panel with the brand's characters, then `{"format": "reject-prefer", "size": "4x5", "brand": "brand/brand-profile.json", "panels": [{"image": …, "text": …}, …], "out": …}`; layouts single · rows · cols · grid · tier.

## Writing the text
Each box ≤ 8 words; the left/top side is the old habit or the pain (from `brain/audience.json`), the right/bottom side is the better way (the brand's idea, never a hard sell). `post.md`: one line that continues the joke + the send-trigger question, ≤ 3 hashtags, alt text describing the template and the texts.
