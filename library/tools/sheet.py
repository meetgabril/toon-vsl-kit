"""sheet.py <frames_dir> <out.jpg> [cols=6] [tile_w=270] — contact sheet with frame names (look check)"""
import os, sys
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6; tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
fs = sorted(f for f in os.listdir(d) if f.endswith(('.jpg', '.png'))); ims = []
for f in fs:
    im = Image.open(os.path.join(d, f)).convert('RGB'); im = im.resize((tw, int(im.height * tw / im.width))); ImageDraw.Draw(im).text((4, 4), f, fill=(255, 0, 0)); ims.append(im)
th = max(i.height for i in ims); rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * (tw + 2), rows * (th + 2)), 'black')
for k, im in enumerate(ims): S.paste(im, ((k % cols) * (tw + 2), (k // cols) * (th + 2)))
S.save(out, quality=85); print(out, S.size)
