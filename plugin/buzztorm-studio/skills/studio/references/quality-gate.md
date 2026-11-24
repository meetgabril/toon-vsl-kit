# Quality Gate

```
python3 studio.py check . --stage script    # before Script/Outline review
python3 studio.py check . --stage final     # before Storyboard review (layout) and Ready for approval (everything)
```
Exit code 1 = failed. Never show the user anything that failed; fix and re-run. Report to the user in one line ("Quality check passed (6/6)") or, if the user must decide something, a menu.

| Check | Stage | What fails | How to fix |
|---|---|---|---|
| claims | script, final | guarantees, get-rich-quick, passive income/quit your job, little or no work, earnings amounts, six/seven figures, results in a timeframe, risk-free (ERROR when the brand risk is high, the piece is an ad/Sell, or money is involved); missing ad disclaimer | Rewrite to process outcomes; numbers only with `[proof:id]` from `proof.json` |
| facts | script, final | a historical/year statement without `> FACTS: id`; an id not in `facts.json` | Verify with a web search, add the fact, reference it |
| copy | script, final | avoided words (voice.md) — WARN; too many hashtags per section; Instagram first line > 125 characters | Edit the text |
| cta | script, final | no CTA from `cta.json` or offer name in script/story/post (for recipes with a CTA part) | Add the CTA for the goal |
| layout | final | text under the recipe's minimum size, text outside the size's safe zone, text overlapping other text (including text painted on backgrounds) — from `*.qa.json` captured with `QA=1` renders or `meme.py` | Move or enlarge the item, shorten the text, or change the scene; re-render with QA=1 |
| files | final | delivery empty, bad file names, empty files, missing post.md, PDF page count outside the recipe, Discord size limits | Rename/rebuild |

What the gate cannot see (always check by eye on the contact sheet or previews): a picture that contradicts its line (e.g. a phone showing "+1 new lead" when the joke is "one viewer"), characters covering text, off-brand colors in props, outfit drift, tone.

Reports are saved in `qa/report_<stage>.json`.
