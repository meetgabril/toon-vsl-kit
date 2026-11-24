#!/usr/bin/env python3
"""kinetic.py <spec.json> — viral "bait + kinetic text cards" videos (Hook Library), in the brand's colours and fonts.

Spec:
{
  "fps": 24, "size": [1080, 1920], "end": 7.15,
  "bait": {"frames": "frames", "until": 2.13},             # engine frames (f00000.jpg…) or {"video": "clip.mp4", "until": 2.13}
  "cards": [{"t": 2.13, "text": "need clients that stay?", "bg": "paper", "fg": "primary", "size": 76},
            {"t": 2.87, "text": "community.", "bg": "primary", "fg": "paper", "size": 200}, …],
  "font": "baloo" | "bungee" | "inter",  "pop": true,
  "audio": {"ambient": 0.006, "hit": true, "silent_tail": true},
  "brand": "brand/brand-profile.json", "out": "delivery/<brand>_reel_<title>_v1_9x16.mp4"
}
Colours accept role names (primary, paper, accent…) from the brand profile or hex. Writes the MP4 and a layout capture per card
(stills/kinetic/*.qa.json) for `studio.py check`.
"""
import json, math, os, shutil, subprocess, sys
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = {'baloo': 'baloo-2-latin-800-normal.ttf', 'bungee': 'bungee-latin-400-normal.ttf', 'inter': 'inter-latin-700-normal.ttf', 'anton': 'anton-latin-400-normal.ttf'}
ROLES = {'primary': '#25385c', 'primary_dark': '#16213a', 'accent': '#ff6a2a', 'highlight': '#ffd66b', 'paper': '#fff6e0', 'paper_dark': '#efe4d2', 'positive': '#2f8f4a', 'negative': '#e8574a', 'secondary': '#5bc0be', 'tertiary': '#a974e0', 'ink': '#17141c'}


def font(name, px):
    for d in (os.path.join(HERE, 'fonts', 'ttf'), os.path.join(HERE, '..', 'engine', 'fonts', 'ttf')):
        p = os.path.join(d, FONTS[name])
        if os.path.exists(p): return ImageFont.truetype(p, px)
    if name == 'inter':   # Inter has no TTF in the kit by default: fall back to Baloo
        return font('baloo', px)
    raise SystemExit(f'font {name} missing')


def col(c, roles):
    c = roles.get(c, c); c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def main(spec):
    S = json.load(open(spec)); fps = S.get('fps', 24); W, H = S.get('size', [1080, 1920]); end = S['end']
    roles = dict(ROLES)
    if S.get('brand') and os.path.exists(S['brand']): roles.update({k: v for k, v in json.load(open(S['brand'])).get('colors', {}).items() if v})
    tmp = 'work/kinetic'; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp); os.makedirs('stills/kinetic', exist_ok=True)
    n = 0; B = S.get('bait')
    if B:
        until = B['until']; nb = int(round(until * fps))
        if B.get('frames'):
            for i in range(nb):
                src = os.path.join(B['frames'], f'f{min(i, len(os.listdir(B["frames"])) - 1):05d}.jpg')
                Image.open(src).convert('RGB').resize((W, H)).save(f'{tmp}/k{n:05d}.jpg', quality=93); n += 1
        else:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', B['video'], '-vf', f'fps={fps},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}', '-frames:v', str(nb), '-q:v', '2', f'{tmp}/b%05d.jpg'], check=True)
            for f in sorted(os.listdir(tmp)):
                if f.startswith('b'): os.rename(f'{tmp}/{f}', f'{tmp}/k{n:05d}.jpg'); n += 1
    cards = S['cards']; fam = S.get('font', 'baloo')
    # cards in the same "group" share one size (the largest that fits every one of them), like the original's three words
    d0 = ImageDraw.Draw(Image.new('RGB', (10, 10))); fitted = {}
    for ci, c in enumerate(cards):
        px = int(c.get('size', 160)); maxw = (W * float(c['fit'])) if c.get('fit') else W - 2 * int(S.get('side_margin', 130))
        while d0.textlength(c['text'], font=font(c.get('font', fam), px)) > maxw and px > 44: px -= 2
        fitted[ci] = px
    for g in {c.get('group') for c in cards if c.get('group')}:
        m = min(fitted[i] for i, c in enumerate(cards) if c.get('group') == g)
        for i, c in enumerate(cards):
            if c.get('group') == g: fitted[i] = m
    for ci, c in enumerate(cards):
        t1 = cards[ci + 1]['t'] if ci + 1 < len(cards) else end
        f0, f1 = int(round(c['t'] * fps)), int(round(t1 * fps))
        cf = c.get('font', fam); px = fitted[ci]; fnt = font(cf, px)
        bg, fg = col(c.get('bg', 'paper'), roles), col(c.get('fg', 'primary'), roles)
        for k in range(max(1, f1 - f0)):
            im = Image.new('RGB', (W, H), bg); dr = ImageDraw.Draw(im)
            s = 1.0 + (0.12 * (1 - k / 3) if S.get('pop', True) and k < 3 else 0)
            f = font(cf, int(px * s)) if s != 1.0 else fnt
            tw = dr.textlength(c['text'], font=f); bb = dr.textbbox((0, 0), c['text'], font=f); th = bb[3] - bb[1]
            x, y = (W - tw) / 2, H * c.get('y', 0.5) - th / 2 - bb[1]
            dr.text((x, y), c['text'], font=f, fill=fg)
            im.save(f'{tmp}/k{n:05d}.jpg', quality=93); n += 1
            if k == 3 or (k == 0 and f1 - f0 < 4):
                json.dump({'canvas': [W, H], 'texts': [{'item': f'card{ci}', 't': c['text'], 'x': x, 'y': y + bb[1], 'w': tw, 'h': th, 'px': px}], 'source': 'kinetic'},
                          open(f'stills/kinetic/card{ci:02d}.jpg.qa.json', 'w'))
                im.save(f'stills/kinetic/card{ci:02d}.jpg', quality=90)
    out = S['out']; os.makedirs(os.path.dirname(out) or '.', exist_ok=True); A = S.get('audio', {})
    if A.get('source'):   # remake: keep the example's own audio track untouched
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', f'{tmp}/k%05d.jpg', '-i', A['source'], '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17',
                        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], check=True)
        print(json.dumps({'video': out, 'frames': n, 'seconds': round(n / fps, 3), 'cards': len(cards), 'audio': 'original'})); return
    # audio: room tone during the bait, a hit on every card, silent tail (makes the loop seamless)
    sr = 48000; total = n / fps; a = np.zeros(int(total * sr))
    rng = np.random.default_rng(7); until = B['until'] if B else 0
    if A.get('ambient', 0.006): a[:int(until * sr)] += rng.normal(0, A.get('ambient', 0.006), int(until * sr))
    if A.get('hit', True):
        for c in cards:
            i0 = int(c['t'] * sr); L = int(0.07 * sr); env = np.exp(-np.linspace(0, 9, L))
            click = rng.normal(0, 0.5, L) * env; thump = np.sin(2 * math.pi * 70 * np.arange(L) / sr) * env * 0.6
            seg = a[i0:i0 + L]; a[i0:i0 + len(seg)] += (click + thump)[:len(seg)]
    if A.get('silent_tail', True) and cards: a[int(cards[-1]['t'] * sr) + int(0.1 * sr):] *= 0
    a = np.clip(a, -0.98, 0.98); sf.write('work/kinetic.wav', a, sr)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', f'{tmp}/k%05d.jpg', '-i', 'work/kinetic.wav', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], check=True)
    print(json.dumps({'video': out, 'frames': n, 'seconds': round(n / fps, 2), 'cards': len(cards)}))


if __name__ == '__main__':
    main(sys.argv[1])
