# STYLES: one cast, many looks

Same characters, sets and story; a different finish. Set `style:` for the whole film (`STORY.style`) or per beat (`{ …, style: 'oldfilm' }`). Preview any look on the whole film with `STYLE=riso node render.mjs stills/x "100,500" 1`. The reference image is `ref/styles_sheet.jpg`.

| style | look | best for |
|---|---|---|
| `ink` (default) | the house look: flat colour, plum ink, soft vignette and grain | everything |
| `oldfilm` | sepia, animated on twos, gate jitter, flicker, scratches, dust and dark corners | **history-bridge hooks**, "back in 1518…", flashbacks. It adds a projector sound automatically. |
| `paper` | stop-motion cut-out: on twos, jitter, paper fibre texture | handmade or craft feel, "anti-AI" pieces, kids and education |
| `riso` | two-ink risograph (pink and blue) with misregistration on paper | trendy posts, covers, carousels, punchy ads |
| `noir` | high-contrast black and white with a cold tint | drama, "the dark truth about…", mystery hooks |
| `comic` | punchy saturation, halftone dots, thick panel border | action, reveals, "meanwhile…" |
| `pastel` | soft, airy, paper texture | wellness, calm, gentle brands |
| `dusk` | saturated with a violet tint | night scenes, nightlife, after-hours |
| `freeze` | desaturated with a warm tint | the "YEP. THAT'S ME." freeze-frame hook (+ `label` item + `scratch` sound) |
| `vhs` | chroma split, scanlines, slight jitter | 80s/90s nostalgia, "found footage", memes |

## Rules
- **Switching is a storytelling tool, not decoration.** Switch style on a cut that means something: past → present, normal → disaster, the fantasy → the reality. Snap back on the pivot word with a sound (`sfx: 'scratch@word'` or `'whoosh'`).
- Keep 70 % or more of a film in one base style. Accent styles are for hooks, flashbacks and gags.
- The cast and outfits never change between styles, only the finish. That is what keeps the brand consistent.
- A custom look is an object: `style: { filter: 'sepia(.4) contrast(1.2)', paper: .3, twos: true, jitter: 2, halftone: .1, tint: 'rgba(…)', edge: .4, border: 12, riso: ['#hex', '#hex'], misreg: 6, chroma: 4, scan: .1, flicker: .05, scratches: true }`.
