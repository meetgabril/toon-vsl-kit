#!/usr/bin/env python3
"""meme.py <spec.json> — compose a meme from rendered panels (the brand's own characters) and text.

Layouts (library/memes/formats.json): single · rows · cols · grid · tier.
Spec: {"format": "reject-prefer", "size": "4x5"|"1x1", "caption": "text\\nsecond line", "title": "…",
       "panels": [{"image": "stills/m/f00010.jpg", "text": "…", "label": "…"}], "labels": ["…", "…"],
       "tiers": [{"label": "S", "items": ["…"]}], "handle": "@brand", "brand": "brand/brand-profile.json", "out": "delivery/x.png"}
Writes the PNG and <out>.qa.json (text boxes and sizes) for `studio.py check`.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIRS = [os.path.join(HERE, 'fonts', 'ttf'), os.path.join(HERE, '..', 'engine', 'fonts', 'ttf'), os.path.join(os.getcwd(), 'fonts', 'ttf')]
INK = (23, 20, 28)
MIN_PX = 40


def font(name, px):
    files = {'baloo': 'baloo-2-latin-800-normal.ttf', 'bungee': 'bungee-latin-400-normal.ttf'}
    for d in FONT_DIRS:
        p = os.path.join(d, files[name])
        if os.path.exists(p):
            return ImageFont.truetype(p, px)
    raise SystemExit(f'font {name} not found in {FONT_DIRS}')


def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


class Canvas:
    def __init__(self, w, h):
        self.im = Image.new('RGB', (w, h), 'white'); self.d = ImageDraw.Draw(self.im); self.qa = []; self.W, self.H = w, h

    def wrap(self, text, f, maxw):
        lines = []
        for para in text.split('\n'):
            words, cur = para.split(' '), ''
            for wd in words:
                t = (cur + ' ' + wd).strip()
                if self.d.textlength(t, font=f) <= maxw: cur = t
                else:
                    if cur: lines.append(cur)
                    cur = wd
            lines.append(cur)
        return lines

    def text_box(self, text, box, fam='baloo', start=72, align='left', fill=INK, valign='center', item='text'):
        x0, y0, x1, y1 = box; px = start
        while px >= MIN_PX:
            f = font(fam, px); lines = self.wrap(text, f, x1 - x0); lh = int(px * 1.18)
            if lh * len(lines) <= (y1 - y0) and all(self.d.textlength(l, font=f) <= (x1 - x0) for l in lines): break
            px -= 2
        else:
            raise SystemExit(f'TEXT DOES NOT FIT at {MIN_PX}px: "{text[:40]}…" — shorten it')
        th = lh * len(lines); y = y0 + ((y1 - y0 - th) // 2 if valign == 'center' else 0)
        for l in lines:
            tw = self.d.textlength(l, font=f); x = x0 if align == 'left' else x0 + (x1 - x0 - tw) / 2
            self.d.text((x, y), l, font=f, fill=fill)
            self.qa.append({'item': item, 't': l, 'x': x, 'y': y, 'w': tw, 'h': lh, 'px': px}); y += lh
        return px

    def panel(self, path, box, border=6):
        x0, y0, x1, y1 = [int(v) for v in box]; w, h = x1 - x0, y1 - y0
        im = Image.open(path).convert('RGB'); iw, ih = im.size; s = max(w / iw, h / ih)
        im = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS); iw, ih = im.size
        im = im.crop(((iw - w) // 2, (ih - h) // 2, (iw - w) // 2 + w, (ih - h) // 2 + h)); self.im.paste(im, (x0, y0))
        self.d.rectangle((x0, y0, x1 - 1, y1 - 1), outline=INK, width=border)


def main(spec_path):
    S = json.load(open(spec_path)); size = S.get('size', '4x5'); W, H = (1080, 1350) if size == '4x5' else (1080, 1080)
    fp = next((p for p in (os.path.join(HERE, 'memes', 'formats.json'), os.path.join(HERE, '..', 'memes', 'formats.json')) if os.path.exists(p)), None)
    if not fp: raise SystemExit('memes/formats.json not found')
    fmts = {f['id']: f for f in json.load(open(fp))['formats']}
    if S.get('format') not in fmts and not S.get('layout'): raise SystemExit(f'unknown meme format "{S.get("format")}"; use one of {sorted(fmts)}')
    lay = S.get('layout') or fmts[S['format']]['layout']
    need = fmts.get(S.get('format'), {}).get('panels', 1)
    if lay in ('rows', 'cols') and len(S.get('panels', [])) < min(need, 2): raise SystemExit(f'format {S["format"]} needs {need} panels')
    if lay == 'single' and not S.get('caption'): raise SystemExit('a single-panel meme needs a caption (the joke)')
    roles = {}
    if S.get('brand') and os.path.exists(S['brand']): roles = json.load(open(S['brand'])).get('colors', {})
    C = Canvas(W, H); M = 64; y = M
    if S.get('caption'):
        f = font('baloo', 60); n = len(C.wrap(S['caption'], f, W - 2 * M)); ch = min(int(n * 60 * 1.18) + 30, 420)
        C.text_box(S['caption'], (M, y, W - M, y + ch), start=64, item='caption'); y += ch + 24
    if S.get('title'):
        C.text_box(S['title'].upper(), (M, y, W - M, y + 120), fam='bungee', start=62, align='center', item='title'); y += 140
    foot = 70 if S.get('handle') else M; area = (M, y, W - M, H - foot); P = S.get('panels', [])
    if lay == 'single':
        C.panel(P[0]['image'], area)
    elif lay == 'rows':
        n = len(P); rh = (area[3] - area[1] - (n - 1) * 16) / n
        for i, p in enumerate(P):
            ty = area[1] + i * (rh + 16); C.panel(p['image'], (M, ty, M + (W - 2 * M) * .5, ty + rh))
            C.text_box(p.get('text', ''), (M + (W - 2 * M) * .5 + 28, ty + 10, W - M, ty + rh - 10), start=64, item=f'row{i}')
    elif lay == 'cols':
        labels = S.get('labels') or [p.get('label', '') for p in P]; cw = (W - 2 * M - 20) / 2; lh = 90
        for i, p in enumerate(P[:2]):
            x = M + i * (cw + 20)
            C.text_box(labels[i].upper(), (x, area[1], x + cw, area[1] + lh), fam='bungee', start=52, align='center', item=f'label{i}')
            C.panel(p['image'], (x, area[1] + lh, x + cw, area[3]))
    elif lay == 'grid':
        cols, rows = 2, 3; cw = (W - 2 * M - 20) / cols; rh = (area[3] - area[1] - 2 * 20) / rows
        for i, p in enumerate(P[:6]):
            x = M + (i % cols) * (cw + 20); ty = area[1] + (i // cols) * (rh + 20)
            C.panel(p['image'], (x, ty, x + cw, ty + rh - 64)); C.text_box(p.get('text', ''), (x, ty + rh - 60, x + cw, ty + rh), start=44, align='center', item=f'cell{i}')
    elif lay == 'tier':
        tiers = S['tiers']; n = len(tiers); rh = (area[3] - area[1] - (n - 1) * 10) / n
        cols = [roles.get('negative', '#e8574a'), roles.get('accent', '#ff6a2a'), roles.get('highlight', '#ffd66b'), roles.get('positive', '#2f8f4a'), roles.get('secondary', '#5bc0be')]
        for i, t in enumerate(tiers):
            ty = area[1] + i * (rh + 10); C.d.rectangle((M, ty, M + 140, ty + rh), fill=hexrgb(cols[i % 5]), outline=INK, width=6)
            C.text_box(t['label'], (M, ty, M + 140, ty + rh), fam='bungee', start=80, align='center', item=f'tier{i}')
            C.d.rectangle((M + 140, ty, W - M, ty + rh), outline=INK, width=6)
            C.text_box(' · '.join(t['items']), (M + 170, ty + 8, W - M - 20, ty + rh - 8), start=52, item=f'tieritems{i}')
    if S.get('handle'):
        C.text_box(S['handle'], (M, H - 62, W - M, H - 12), start=40, align='center', fill=(110, 105, 120), item='handle')
    out = S.get('out', 'delivery/meme.png'); os.makedirs(os.path.dirname(out) or '.', exist_ok=True); C.im.save(out)
    json.dump({'canvas': [W, H], 'final_w': W, 'texts': C.qa, 'source': 'meme'}, open(out + '.qa.json', 'w'), indent=1)
    print('meme:', out, f'({W}x{H}, {len(C.qa)} text lines, min {min([t["px"] for t in C.qa] or [0])}px)')


if __name__ == '__main__':
    main(sys.argv[1])
