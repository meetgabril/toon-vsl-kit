# Brand Brain

`~/buzztorm-studio/brands/<brand>/brain/` — the brand's strategy, read before every idea, script and caption.

| File | Holds | Used for |
|---|---|---|
| `audience.json` | 2–4 personas: who, pains, desires, objections, phrases they say | ideas, hooks, ad concepts (one persona × one pain per concept), send triggers |
| `offers.json` | the offer ladder: free → low ticket → course → high ticket; promise, price, link, DM keyword, status | CTA and Sell content; quote offers exactly, never improvise prices or promises |
| `cta.json` | CTAs per goal (grow, teach, sell, community), comment-to-DM keywords, automation note | the CTA on every piece |
| `voice.md` | tone, words to avoid, good/bad examples | all copy; the gate warns on avoided words |
| `claims.json` | risk level, never-say list, allowed claims, numbers rule, ad disclaimer | the Claims check |
| `facts.json` | verified facts with sources and cautions | history hooks and every factual line |
| `proof.json` | real results with permission and evidence | the only source of client results and testimonials |
| `series.json` | recurring formats with structure and cadence | ideas and Plan the week |
| `ideas.json` | idea bank with goal and status (new, in-progress, used, winner) | screen 2 of Make something |

Brand look lives next to it: `brand-profile.json` (colors, fonts, signs on shared backgrounds, characters and voices, hashtags, options, presets, weekly mix, archive folder), `characters/`, `backgrounds/`, `props/`.

## Rules
- Before writing anything, read: the persona, the offer, the CTA for the goal, `voice.md`, `claims.json`.
- A fact used in content must exist in `facts.json`. New fact → web search → add with sources and date → then use. Mark the script with `> FACTS: id1, id2`.
- A result, number about clients or testimonial must exist in `proof.json` (with permission). Otherwise leave it out. Fictional characters (e.g. Tony) can have story outcomes, never money amounts.
- After each project: move the idea to `used` (or `winner` after results), add new proven hooks to `hooks.md`, add any new verified fact.
- Missing data (e.g. an offer link marked TODO) → ask once with a menu ("I'll add it now" / "Skip for now") when it is needed, then save it.

## Brand Brain interview (new brand, or a brand with no offers)
Menus first, free text only where a name or link is needed. One screen at a time:
1. "What does the brand sell first?" Free community ★ · Low-ticket product · Course · Service/high ticket — then name, promise and link (text).
2. "Anything else on the ladder?" Add another offer · That's all ★
3. "Who is it for?" — propose 3 personas from the website/guide and the offers (name + main pain); multi-select to keep; "Add one" for text.
4. "How risky are the claims in this niche?" High (money, business, health, fitness results) ★ for infoproducts · Medium · Low.
5. "How does the brand sound?" 3 tone options written from their content + "Write my own".
6. "Which CTAs can we use?" multi-select: Comment a keyword for a link · Join the free community · Book a call · Buy now · Save/share.
Write all files, show a one-screen summary, menu: Approve ★ · Change offers · Change personas · Change voice. Commit "<brand>: Brand Brain".
