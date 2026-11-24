#!/usr/bin/env python3
"""meme_template.py — the Studio Library of meme templates (images supplied by the team).

  meme_template.py add <image> <id> --layout rows-right|rows-overlay|cols-top|top-bottom [--name "…"] [--panels 2]
                    [--source <url of the blank template>] [--trend YYYY-MM-DD] [--tier green|yellow] [--classic yes]
  meme_template.py preview <id>             # draws the text boxes on the template → qa/template_<id>.png (check by eye)
  meme_template.py list

Boxes are stored as fractions of the image (x0, y0, x1, y1), so any size works. Styles:
  plain   = dark bold text on a light area (comparatives with a white text column)
  classic = white uppercase with a black outline (text over the picture)
Edit library/memes/templates/<id>/template.json by hand for odd layouts.
"""
import datetime, json, os, shutil, sys
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


def add(img, tid, layout, name=None, panels=2, source=None, trend=None, tier='green', classic=False):
    if layout not in LAYOUTS: sys.exit(f'layout must be one of {list(LAYOUTS)}')
    if tier not in ('green', 'yellow'): sys.exit('tier must be green or yellow; red memes (scandals, allegations, crime, tragedies, politics, private people, minors) are never added')
    d = os.path.join(ROOT, tid); os.makedirs(d, exist_ok=True)
    ext = os.path.splitext(img)[1].lower() or '.png'; dst = os.path.join(d, 'template' + ext); shutil.copy(img, dst)
    w, h = Image.open(dst).size
    T = {'id': tid, 'name': name or tid.replace('-', ' ').title(), 'image': 'template' + ext, 'size': [w, h], 'layout': layout,
         'kind': 'comparative' if panels >= 2 else 'single', 'panels': panels, 'boxes': LAYOUTS[layout](panels),
         'source': source, 'trend_date': trend or datetime.date.today().isoformat(), 'added': datetime.date.today().isoformat(), 'tier': tier, 'classic': bool(classic),
         'notes': 'Supplied by the team. Organic posts only; not for ads (real people, film stills and artwork get ads rejected or claimed).'}
    json.dump(T, open(os.path.join(d, 'template.json'), 'w'), indent=2); print(json.dumps({'template': tid, 'size': [w, h], 'boxes': len(T['boxes'])})); preview(tid)


def preview(tid):
    d = os.path.join(ROOT, tid); T = json.load(open(os.path.join(d, 'template.json'))); im = Image.open(os.path.join(d, T['image'])).convert('RGB')
    dr = ImageDraw.Draw(im); w, h = im.size
    for i, b in enumerate(T['boxes']):
        x0, y0, x1, y1 = b['box']; dr.rectangle((x0 * w, y0 * h, x1 * w, y1 * h), outline=(255, 0, 80), width=max(3, w // 200)); dr.text((x0 * w + 8, y0 * h + 6), f'{i + 1} {b["style"]}', fill=(255, 0, 80))
    os.makedirs('qa', exist_ok=True); out = f'qa/template_{tid}.png'; im.save(out); print('preview:', out)


def lst():
    """Fresh first: trend age in days; classics last. 'stale' = non-classic trend older than 45 days (offer only under More)."""
    rows, today = [], datetime.date.today()
    for t in sorted(os.listdir(ROOT)) if os.path.isdir(ROOT) else []:
        p = os.path.join(ROOT, t, 'template.json')
        if not os.path.exists(p): continue
        T = json.load(open(p)); age = (today - datetime.date.fromisoformat(T.get('trend_date') or T.get('added') or today.isoformat())).days
        state = 'classic' if T.get('classic') else ('fresh' if age <= 14 else 'cooling' if age <= 45 else 'stale')
        rows.append((T.get('classic', False), age, f"{T['id']:28} {state:8} {age:4}d {T.get('tier', 'green'):6} {T['kind']:12} {T['layout']:13} {T['name']}"))
    for _, _, r in sorted(rows): print(r)


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if a[0] == 'add':
        o = dict(zip(a[3::2], a[4::2])); add(a[1], a[2], o.get('--layout', 'rows-right'), o.get('--name'), int(o.get('--panels', 2)), o.get('--source'), o.get('--trend'), o.get('--tier', 'green'), o.get('--classic') == 'yes')
    elif a[0] == 'preview': preview(a[1])
    elif a[0] == 'list': lst()
    else: sys.exit(__doc__)
