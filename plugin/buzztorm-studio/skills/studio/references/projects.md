# Projects

## Statuses
```
Brief → Script review → Waiting for voiceover → Storyboard review → Rendering → Ready for approval → Approved → Published → Archived
```
Music-only and still content skip "Waiting for voiceover". "Request changes" returns to the step that needs the change and bumps the version.

## Project record
`~/buzztorm-studio/brands/<brand>/projects/<title>/project.json`:
```json
{
  "title": "daily-posting",
  "brand": "buzztorm",
  "channel": "social",
  "content": "reel",
  "script_type": "sitcom-skit",
  "audio": "voiceover",
  "hook": "The busiest gym in town never runs ads.",
  "options": { "subtitles": false, "post_copy": true, "hashtags": true, "alt_text": true },
  "status": "Ready for approval",
  "version": 2,
  "created": "2026-11-24",
  "updated": "2026-11-24",
  "parent": null,
  "history": [ { "date": "2026-11-24", "version": 1, "status": "Request changes", "note": "Tony too small in scene 3" } ]
}
```
Next to it keep `script.md`, `story.js` and the latest `post.md` (text only). Repurposed content gets its own folder with `"parent": "<title>"`.

The working files (frames, audio, video) live in `~/studio/<brand>/<title>` and are never committed. Before continuing a project in a new session, run setup again into the same folder if it is missing, then copy `script.md`, `story.js` back from the record; ask for the voiceover file again if `work/` is empty.

## Saving to GitHub
Commit and push to `main` of `meetgabril/toon-vsl-kit` after: a brand is added or its profile changes, a character or background is approved, a project is approved, results are logged, a preset is saved.
```
cd ~/buzztorm-studio && git add brands/<brand> && git commit -m "<brand>: <what changed>" && git pull --rebase && git push
```
Commit only files under `brands/<brand>/` (and `library/shared/` for Share to library). Never commit media, `node_modules` or project working folders.

## Log results
Append one row per version (or per hook) to `brands/<brand>/results.csv`:
`date,project,content,version,hook,channel,sends,hold_3s,replays,views,notes`
For a hook test, mark the winner (most sends per view, then 3-second hold) and add its hook to the top of "Proven" in `hooks.md`. Set the status to Published when the user confirms it is live.
