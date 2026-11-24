#!/usr/bin/env python3
"""overlay.py <spec.json> — exact remake of a supplied reel: original footage + original audio, brand text added.
spec: {src, fps, size:[W,H], fit: "blurfill"|"cover", out, font, roles(from brand),
       overlays:[{f0, f1|null, kind:"card"|"label", bg, lines:[{text, size, fg, y}], text_from}]}
card  = full-frame solid background (replaces the picture) ; label = rounded pill over the picture.
Writes stills/kinetic/*.qa.json for the Quality Gate."""
import json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = json.load(open(sys.argv[1])); W, H = S['size']; fps = S['fps']
FONT = S['font_path']; roles = S['roles']
col = lambda c: tuple(int(roles.get(c, c).lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
tmp = 'work/ov'; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp); os.makedirs('stills/kinetic', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-i', S['src'], '-vsync', '0', '-q:v', '2', f'{tmp}/s%05d.jpg'], check=True)
src = sorted(f for f in os.listdir(tmp) if f.startswith('s'))
N = len(src)
# audio may run longer than the picture: hold the last frame to the end of the audio
adur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', S['src']], capture_output=True, text=True).stdout)
total = max(N, int(round(adur * fps)))


def frame(i):
    im = Image.open(f'{tmp}/{src[min(i, N - 1)]}').convert('RGB')
    if im.size == (W, H): return im
    if S.get('fit') == 'blurfill':
        k = max(W / im.width, H / im.height); bg = im.resize((int(im.width * k) + 1, int(im.height * k) + 1)).filter(ImageFilter.GaussianBlur(40))
        bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
        k2 = W / im.width; fg = im.resize((W, int(im.height * k2)), Image.LANCZOS)
        bg.paste(fg, (0, (H - fg.height) // 2)); return bg
    k = max(W / im.width, H / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))


qa_done = set()
for i in range(total):
    im = frame(i); dr = ImageDraw.Draw(im); texts = []
    for oi, o in enumerate(S['overlays']):
        f1 = o.get('f1') or total
        if not (o['f0'] <= i < f1): continue
        if o['kind'] == 'card': dr.rectangle([0, 0, W, H], fill=col(o['bg']))
        if i < o.get('text_from', o['f0']): continue
        k = i - o.get('text_from', o['f0'])
        s = 1.0 + (0.10 * (1 - k / 3) if o.get('pop', True) and k < 3 else 0)
        for li, L in enumerate(o['lines']):
            f = ImageFont.truetype(FONT, int(L['size'] * s))
            bb = dr.textbbox((0, 0), L['text'], font=f); tw, th = bb[2] - bb[0], bb[3] - bb[1]
            x, y = (W - tw) / 2 - bb[0], H * L['y'] - th / 2 - bb[1]
            if o['kind'] == 'label':
                p = int(L['size'] * 0.28 * s)
                dr.rounded_rectangle([x + bb[0] - p * 1.4, y + bb[1] - p, x + bb[2] + p * 1.4, y + bb[3] + p], radius=p * 1.6, fill=col(L.get('box', o['bg'])))
            dr.text((x, y), L['text'], font=f, fill=col(L['fg']))
            texts.append({'item': f'ov{oi}_{li}', 't': L['text'], 'x': x + bb[0], 'y': y + bb[1], 'w': tw, 'h': th, 'px': L['size']})
        if k == 3 and oi not in qa_done:
            json.dump({'canvas': [W, H], 'texts': texts, 'source': 'overlay'}, open(f'stills/kinetic/ov{oi}.qa.json', 'w')); qa_done.add(oi)
            im.save(f'stills/kinetic/ov{oi}.jpg', quality=90)
    im.save(f'{tmp}/k{i:05d}.jpg', quality=93)
os.makedirs(os.path.dirname(S['out']), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', f'{tmp}/k%05d.jpg', '-i', S['src'], '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', S['out']], check=True)
print('wrote', S['out'], total, 'frames')
