# Learning formats (lessons, courses, playbooks, e-books, checklists, worksheets, cheat sheets)

Branded PDFs made from Markdown with the brand's colors, fonts and characters:
```
python3 build_doc.py doc/<name>.md delivery/<brand>_<format>_<title>_v<N>_letter.pdf
```
Front matter: `type` (checklist · ebook · playbook · worksheet · cheat-sheet · lesson), `title`, `subtitle`, `cover_image` (a still rendered by the engine, e.g. `stills/cover.png`), `cta_title`, `cta_text` (default: the brand's first active offer).
Markdown extras: `- [ ] item` (checkbox) · `:::play Title` … `:::` (playbook card, one per page) · `:::tip|warning|example Title` … `:::` (boxes) · `___ Label` (writing line) · `___tall Label` (big box) · `[[pagebreak]]`.
One-pagers (checklist, worksheet, cheat sheet) shrink to fit one page down to 10 pt; below that the build stops with TOO LONG → cut words, never shrink further. Previews of every page go to `qa/`; look at them before review. Offer an editable version as a Doc when the client needs to edit.

Illustrations: render brand characters as stills (`QA=1 AR=45 node render.mjs stills/ill "<frame>" 1` with a one-scene `story.js`, or `ALPHA=1` for cut-outs) and reference them in Markdown.

## Formats
| Format | Outline review shows | Rules |
|---|---|---|
| Checklist | title + all items | Specific title with a number ("The 12-Point …"); max 20 items (else split); grouped in 2–4 stages; CTA box |
| Cheat sheet | sections + lines | Two columns, scannable, no paragraph over 2 lines |
| Worksheet | prompts and fields | Tied to one lesson or lead magnet; 1–2 pages |
| E-book / Guide | title, promise, chapter list with one-line summaries | 10–25 pages; one promise; each chapter = one idea that could become a carousel; cover with a character; CTA page |
| Playbook | list of plays | Each play: Situation → The play → Script/template → Common mistake → Metric; one page per play with an illustration |
| Lesson pack | objective, 3 steps, example, action, 3 quiz questions | One objective the learner can act on today; video 2–5 min (16:9, explainer or sitcom with the brand's characters); slides; worksheet PDF; summary card 4:5; quiz (3 questions, plausible wrong answers, explanations); teaser reel 9:16 (15–30 s) that sells the lesson |
| Course | transformation (from → to), modules, lessons | One transformation; 3–6 modules; lessons 2–5 min each, one objective; each lesson ends with an action + recall; course trailer reel + sales page video brief. Produce lesson packs in batches of 3 with their own approvals |

## Slides for lessons
Prefer the Slides artifact type when listed (editable); otherwise a .pptx with the pptx skill, using the brand colors and characters. One idea per slide, 6 words of title max.

## Quality
`studio.py check --stage script` on the outline (claims, facts, CTA, voice), then `--stage final` on the PDFs (page counts, file names, post.md for the promo post).
