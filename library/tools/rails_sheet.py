"""rails_sheet.py <frames_dir> <frames_csv> <out.jpg> — contact sheet of the given frames with the format's unsafe areas shaded red
(safe-zone margins and platform UI from formats.json; zone = $ZONE or the size's default) and time labels."""
import json, os, sys
from PIL import Image, ImageDraw
d, spec, out = sys.argv[1], sys.argv[2], sys.argv[3]
F = json.load(open('formats.json')); AR = os.environ.get('AR', '916').rstrip('p')
Z = F['zones'].get(os.environ.get('ZONE') or F['default_zone'].get(AR, 'feed'))
CV = F['canvases'][Z['canvas']]; S = Z['safe']
TW = 216 if CV['w'] <= CV['h'] else 320; COLS = 6 if CV['w'] <= CV['h'] else 4
tiles = []
for n in [int(x) for x in spec.split(',') if x]:
    p = os.path.join(d, f'f{n:05d}.jpg')
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGB'); k = im.width / CV['w']; W, H = im.size
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); o = ImageDraw.Draw(ov); red = (232, 60, 60, 45)
    for box in [(0, 0, W, S['top'] * k), (0, H - S['bottom'] * k, W, H), (0, 0, S['left'] * k, H), (W - S['right'] * k, 0, W, H)] + [tuple(v * k for v in b['box']) for b in Z.get('blocks', [])]:
        o.rectangle(box, fill=red)
    im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB').resize((TW, int(im.height * TW / im.width)))
    ImageDraw.Draw(im).text((4, 4), f'{n / 24:.1f}s', fill=(255, 255, 0)); tiles.append(im)
if not tiles: sys.exit(f'no frames for the sheet in {d}')
th = max(t.height for t in tiles); rows = (len(tiles) + COLS - 1) // COLS
SH = Image.new('RGB', (COLS * (TW + 2), rows * (th + 2)), 'black')
for i, t in enumerate(tiles): SH.paste(t, ((i % COLS) * (TW + 2), (i // COLS) * (th + 2)))
SH.save(out, quality=85); print(f'sheet {out} ({len(tiles)} frames, zone {os.environ.get("ZONE") or F["default_zone"].get(AR)})')
