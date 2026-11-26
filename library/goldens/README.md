# Goldens

Reference pieces that must keep passing the Quality Gate and look the same after any engine change (admin.md → Engine updates).

| Golden | Recipe | Rebuild |
|---|---|---|
| carousel/ | carousel | `studio.py new <brand> golden-carousel carousel`, copy story.js, closed lips/timing (24 fps × 20 s), `QA=1 AR=45 node render.mjs stills/q "60,132,204,276,348,420" 3`, compare with contact_sheet.jpg |
| checklist/ | checklist | `studio.py new <brand> golden-checklist checklist`, `python3 build_doc.py checklist.md delivery/<brand>_checklist_golden-checklist_v1_letter.pdf` → 1 page, compare with preview.png |
| meme/ | meme | `studio.py new <brand> golden-meme meme`, copy story.js + meme.json, render frames 48 and 120 at AR=45 with QA=1, `python3 meme.py meme.json`, compare with preview.jpg |
| rails/ | reel (+ 16:9, 4:5, thumbnail) | `setup.sh ~/studio/<brand>/golden-rails <brand>`, copy script.md + story.js, voice.mp3 to `work/`; `bash make.sh preview` then `AR=169` and `AR=45` → compare `work/sheet.jpg` with sheet_916/169/45.jpg (gate must pass, no text on faces, captions clear of the Reels buttons). Thumbnail: story.js ← thumb_story.js, `AR=169 ZONE=thumbnail bash make.sh stills 30` → compare with thumb.jpg |
