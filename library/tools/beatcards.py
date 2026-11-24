#!/usr/bin/env python3
"""beatcards.py <spec.json> — bait footage + kinetic text cards locked to the beat, optional zoom per card, audio fade at the end.
Card: {t, text, bg, fg, size, fit, y, group, zoom:[from,to]}  (zoom eases over the card's duration)."""
import json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

S = json.load(open(sys.argv[1])); fps = S['fps']; W, H = S['size']; end = S['end']; roles = S['roles']; FONT = S['font_path']
col = lambda c: tuple(int(roles.get(c, c).lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
tmp = 'work/bc'; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp); os.makedirs('stills/kinetic', exist_ok=True)
nb = int(round(S['bait']['until'] * fps))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', S['bait']['video'], '-vf', f'fps={fps},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}', '-frames:v', str(nb), '-q:v', '2', f'{tmp}/k%05d.jpg'], check=True)
# rename to 0-based
for i in range(nb): os.rename(f'{tmp}/k{i + 1:05d}.jpg', f'{tmp}/b{i:05d}.jpg')
for i in range(nb): os.rename(f'{tmp}/b{i:05d}.jpg', f'{tmp}/k{i:05d}.jpg')
Hd = S['bait'].get('hold')
if Hd:   # freeze one clean bait frame and push in slowly until the next card
    src = Image.open(f"{tmp}/k{Hd['frame']:05d}.jpg").convert('RGB'); n_h = int(round(Hd['until'] * fps)) - nb
    for k in range(n_h):
        u = k / max(1, n_h - 1); z = Hd['zoom'][0] + (Hd['zoom'][1] - Hd['zoom'][0]) * (u * u * (3 - 2 * u))
        w2, h2 = int(W * z), int(H * z); im = src.resize((w2, h2), Image.LANCZOS)
        cy = int(H * Hd.get('center_y', 0.5) * z - H / 2); cy = max(0, min(h2 - H, cy))
        im = im.crop(((w2 - W) // 2, cy, (w2 - W) // 2 + W, cy + H))
        if Hd.get('text'):   # a line of text over the held frame (e.g. in the letterbox bar)
            T = Hd['text']; f = ImageFont.truetype(FONT, T['size']); dr = ImageDraw.Draw(im)
            bb = dr.textbbox((0, 0), T['text'], font=f); tw, th = bb[2] - bb[0], bb[3] - bb[1]; x, y = (W - tw) / 2 - bb[0], H * T['y'] - th / 2 - bb[1]
            dr.text((x, y), T['text'], font=f, fill=col(T['fg']))
            if k == 3: json.dump({'canvas': [W, H], 'texts': [{'item': 'bait_text', 't': T['text'], 'x': x + bb[0], 'y': y + bb[1], 'w': tw, 'h': th, 'px': T['size']}], 'source': 'kinetic'}, open('stills/kinetic/bait.qa.json', 'w'))
        im.save(f'{tmp}/k{nb + k:05d}.jpg', quality=93)
    nb += n_h
cards = S['cards']; d0 = ImageDraw.Draw(Image.new('RGB', (8, 8))); px = {}
for i, c in enumerate(cards):
    p = c['size']; z = max(c.get('zoom', [1, 1]))
    while d0.textlength(c['text'], font=ImageFont.truetype(FONT, int(p * z))) > W * c['fit'] and p > 44: p -= 2
    px[i] = p
for g in {c.get('group') for c in cards if c.get('group')}:
    m = min(px[i] for i, c in enumerate(cards) if c.get('group') == g)
    for i, c in enumerate(cards):
        if c.get('group') == g: px[i] = m
n = nb
for i, c in enumerate(cards):
    f0 = int(round(c['t'] * fps)); f1 = int(round((cards[i + 1]['t'] if i + 1 < len(cards) else end) * fps))
    z0, z1 = c.get('zoom', [1, 1]); L = max(1, f1 - f0)
    for k in range(L):
        u = k / max(1, L - 1); e = u * u * (3 - 2 * u)           # smoothstep
        size = int(px[i] * (z0 + (z1 - z0) * e)); f = ImageFont.truetype(FONT, size)
        im = Image.new('RGB', (W, H), col(c['bg'])); dr = ImageDraw.Draw(im)
        bb = dr.textbbox((0, 0), c['text'], font=f); tw, th = bb[2] - bb[0], bb[3] - bb[1]
        x, y = (W - tw) / 2 - bb[0], H * c.get('y', 0.5) - th / 2 - bb[1]
        dr.text((x, y), c['text'], font=f, fill=col(c['fg'])); subs = []
        if c.get('sub'):
            sf = ImageFont.truetype(FONT, c['sub']['size']); sb = dr.textbbox((0, 0), c['sub']['text'], font=sf)
            sx, sy = (W - (sb[2] - sb[0])) / 2 - sb[0], H * c['sub']['y'] - (sb[3] - sb[1]) / 2 - sb[1]
            dr.text((sx, sy), c['sub']['text'], font=sf, fill=col(c['sub']['fg']))
            subs = [{'item': f'card{i}_sub', 't': c['sub']['text'], 'x': sx + sb[0], 'y': sy + sb[1], 'w': sb[2] - sb[0], 'h': sb[3] - sb[1], 'px': c['sub']['size']}]
        im.save(f'{tmp}/k{n:05d}.jpg', quality=93); n += 1
        if k == L - 1:   # largest state for the layout check
            json.dump({'canvas': [W, H], 'texts': [{'item': f'card{i}', 't': c['text'], 'x': x + bb[0], 'y': y + bb[1], 'w': tw, 'h': th, 'px': px[i]}] + subs, 'source': 'kinetic'}, open(f'stills/kinetic/card{i}.qa.json', 'w'))
os.makedirs(os.path.dirname(S['out']), exist_ok=True); fade = S.get('audio_fade_out', 0)
af = f'afade=t=out:st={end - fade:.3f}:d={fade}' if fade else 'anull'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', f'{tmp}/k%05d.jpg', '-i', S['audio'], '-map', '0:v', '-map', '1:a', '-af', af, '-t', f'{end}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', S['out']], check=True)
print(json.dumps({'video': S['out'], 'frames': n, 'seconds': n / fps}))
