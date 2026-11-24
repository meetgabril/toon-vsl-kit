# Projects

## Statuses (enforced by `studio.py status`)
Brief → Script review → (Waiting for voiceover) → Storyboard review → Rendering → Ready for approval → Approved → Published → Archived.
Going back (a request for changes) bumps the version automatically. Invalid jumps are refused.

## Records
`~/buzztorm-studio/brands/<brand>/projects/<title>/project.json` (created by `studio.py new`), plus `script.md`, `story.js`, `post.md` copied by `studio.py package`. `studio.py list <brand>` lists projects. Working files live in `~/studio/<brand>/<title>` and are never committed.

## After approval
```
python3 studio.py status <brand>/<title> --set Approved
python3 studio.py package .
cd ~/buzztorm-studio && git add brands/<brand> && git commit -m "<brand>: <title> v<N> approved" && git pull --rebase && git push
```
Commit only `brands/<brand>/` (and `library/` changes made on purpose). Never media.

## Archive (media)
When a Google Drive connector is available: upload `delivery/` and `work/voice_clean.wav` (and the uploaded voice file) to the brand's `archive.google_drive_folder` → `<title>/v<N>/`, and save the folder link in `project.json` (`archive`). Without Drive, tell the user once that media lives only in this session and offer to send the voice file back for safekeeping. To reopen a project later: `studio.py new` into the same title (records stay), copy `script.md`/`story.js` back from the record, fetch the voice from the archive, `ingest.py`, render.

## Results
Projects → Log results: append to `brands/<brand>/results.csv` (`date,project,content,version,hook,channel,sends,hold_3s,replays,views,notes`), set the idea's status in `ideas.json` (`used` or `winner`), add winning hooks to `hooks.md` "Proven", status Published.
