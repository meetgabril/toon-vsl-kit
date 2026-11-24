#!/usr/bin/env python3
"""meme_template.py — the Studio Library of meme templates (images supplied by the team).

  meme_template.py add <image> <id> --layout rows-right|rows-overlay|cols-top|top-bottom [--name "…"] [--panels 2]
  meme_template.py preview <id>             # draws the text boxes on the template → qa/template_<id>.png (check by eye)
  meme_template.py list

Boxes are stored as fractions of the image (x0, y0, x1, y1), so any size works. Styles:
  plain   = dark bold text on a light area (comparatives with a white text column)
  classic = white uppercase with a black outline (text over the picture)
Edit library/memes/templates/<id>/template.json by hand for odd layouts.
"""
import json, os, shutil, sys
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.expanduser(os.environ.get('STUDIO', '~/buzztorm-studio')), 'library', 'memes', 'templates')
LAYOUTS = {
    # two stacked rows, picture on the left, text column on the right (the classic "prefer / reject")
    'rows-right': lambda n: [{'box': [0.52, i / n + 0.02, 0.98, (i + 1) / n - 0.02], 'style': 'plain'} for i in range(n)],
    # stacked rows, text over the bottom of each picture
    'rows-overlay': lambda n: [{'box': [0.04, (i + 1) / n - 0.30 / n, 0.96, (i + 1) / n - 0.03 / n], 'style': 'classic'} for i in range(n)],
    # side-by-side panels, label over the top of each
    'cols-top': lambda n: [{'box': [i / n + 0.02, 0.02, (i + 1) / n - 0.02, 0.22], 'style': 'classic'} for i in range(n)],
    # one picture, top text and bottom text
    'top-bottom': lambda n: [{'box': [0.04, 0.02, 0.96, 0.22], 'style': 'classic'}, {'box': [0.04, 0.78, 0.96, 0.98], 'style': 'classic'}],
}


def add(img, tid, layout, name=None, panels=2):
    if layout not in LAYOUTS: sys.exit(f'layout must be one of {list(LAYOUTS)}')
    d = os.path.join(ROOT, tid); os.makedirs(d, exist_ok=True)
    ext = os.path.splitext(img)[1].lower() or '.png'; dst = os.path.join(d, 'template' + ext); shutil.copy(img, dst)
    w, h = Image.open(dst).size
    T = {'id': tid, 'name': name or tid.replace('-', ' ').title(), 'image': 'template' + ext, 'size': [w, h], 'layout': layout,
         'kind': 'comparative' if panels >= 2 else 'single', 'panels': panels, 'boxes': LAYOUTS[layout](panels),
         'notes': 'Supplied by the team. Use for organic posts; not for ads (real people, film stills and artwork get ads rejected or claimed).'}
    json.dump(T, open(os.path.join(d, 'template.json'), 'w'), indent=2); print(json.dumps({'template': tid, 'size': [w, h], 'boxes': len(T['boxes'])})); preview(tid)


def preview(tid):
    d = os.path.join(ROOT, tid); T = json.load(open(os.path.join(d, 'template.json'))); im = Image.open(os.path.join(d, T['image'])).convert('RGB')
    dr = ImageDraw.Draw(im); w, h = im.size
    for i, b in enumerate(T['boxes']):
        x0, y0, x1, y1 = b['box']; dr.rectangle((x0 * w, y0 * h, x1 * w, y1 * h), outline=(255, 0, 80), width=max(3, w // 200)); dr.text((x0 * w + 8, y0 * h + 6), f'{i + 1} {b["style"]}', fill=(255, 0, 80))
    os.makedirs('qa', exist_ok=True); out = f'qa/template_{tid}.png'; im.save(out); print('preview:', out)


def lst():
    for t in sorted(os.listdir(ROOT)) if os.path.isdir(ROOT) else []:
        p = os.path.join(ROOT, t, 'template.json')
        if os.path.exists(p): T = json.load(open(p)); print(f"{T['id']:28} {T['kind']:12} {T['layout']:13} {T['name']}")


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == 'add':
        o = dict(zip(a[3::2], a[4::2])); add(a[1], a[2], o.get('--layout', 'rows-right'), o.get('--name'), int(o.get('--panels', 2)))
    elif a[0] == 'preview': preview(a[1])
    elif a[0] == 'list': lst()
    else: sys.exit(__doc__)
