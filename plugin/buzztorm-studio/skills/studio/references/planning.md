# Plan the week and series

## Plan the week
1. Menu "Which week?" This week ★ · Next week · Pick a week.
2. `python3 ~/buzztorm-studio/library/tools/studio.py plan <brand> <YYYY-Www>` creates `brands/<brand>/calendar/<week>.md` with slots from the Brand Profile `weekly_mix` (default 3 Grow, 2 Teach, 1 Sell, 1 Community) and new ideas from `ideas.json`.
3. Fill each slot with a format (from the recipes for that goal), the series episode when a series is due (`series.json` cadence), and one idea each. Balance personas across the week.
4. Show the week as a table. Menu: Approve ★ · Swap an idea · Change the mix · Start the first piece.
5. On approval, commit the calendar. Each slot becomes a project when started ("Start the first piece" = Make something with screens 1–3 pre-filled).

## Series engine
Series (`brain/series.json`) are recurring formats with a fixed structure, a name and a hashtag. When the series is due, screen 2 of Make something offers "Next episode of <series>" first. Each episode reuses the structure, the cast and a running gag; the post copy uses the series hashtag. After results, the best episode's hook becomes the series' default hook pattern.
