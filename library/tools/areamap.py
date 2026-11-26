# areamap.py <capture_dir> [--hud] — one line per shot: which named screen areas are free, which are taken and by what.
# Reads the layout capture of the preflight (one rest frame per shot first; extra end frames are skipped): character heads and
# bodies, set signs and panels. Areas = 4 rows (top, upper, mid, lower) × 3 columns (L, C, R) inside the format's safe zone
# (formats.json; zone = $ZONE or the size's default). --hud also counts the screen texts (to audit a finished storyboard).
import json, os, sys, glob
D = sys.argv[1]; HUD = '--hud' in sys.argv
F = json.load(open('formats.json'))
def hit(a, b): return not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])
ev = json.load(open('work/events.json')); beats = ev['beats']; ts = [b['t'] for b in beats] + [ev['dur']]
files = sorted(glob.glob(D + '/f*.jpg.qa.json')); by_shot = {}
for f in files:   # keep the first capture inside each shot (the rest frame)
    t = int(os.path.basename(f)[1:6]) / 24; i = max(j for j in range(len(beats)) if ts[j] <= t + 1e-6); by_shot.setdefault(i, f)
for i, f in sorted(by_shot.items()):
    q = json.load(open(f)); cw, ch = q['canvas']
    Z = F['zones'][os.environ.get('ZONE') or F['default_zone'].get(os.environ.get('AR', '916').rstrip('p'), 'feed')]; CV = F['canvases'][Z['canvas']]
    k = CV['w'] / cw; S = Z['safe']; x0, x1, y0, y1 = S['left'], CV['w'] - S['right'], S['top'], CV['h'] - S['bottom']
    ROWS = {n: (y0 + (y1 - y0) * a, y0 + (y1 - y0) * b) for n, a, b in [('top', 0, .2), ('upper', .2, .45), ('mid', .45, .7), ('lower', .7, 1)]}
    COLS = {n: (x0 + (x1 - x0) * a, x0 + (x1 - x0) * b) for n, a, b in [('L', 0, 1 / 3), ('C', 1 / 3, 2 / 3), ('R', 2 / 3, 1)]}
    obs = [(b['name'].split(' (')[0], b['box']) for b in Z.get('blocks', [])]
    for t in q['texts']:
        box = [t['x'] * k, t['y'] * k, (t['x'] + t['w']) * k, (t['y'] + t['h']) * k]
        if t['item'].startswith('body:'):
            who = t['item'][5:]; hx, hy = t['head'][0] * k, t['head'][1] * k; r = 120 * CV['w'] / 1080 if CV['w'] <= CV['h'] else 120 * CV['h'] / 1080
            obs += [(f'{who} head', [hx - r, hy - r * 1.15, hx + r, hy + r]), (f'{who} body', [box[0], hy + r, box[2], box[3]])]
        elif t['item'] == 'obst:panel': obs.append(('set panel', box))
        elif t['item'] == 'set' and t['px'] * k >= 14: obs.append(('set sign', [box[0] - 30, box[1] - 30, box[2] + 30, box[3] + 30]))
        elif HUD and not t['item'].startswith(('actor', 'set', 'caption')): obs.append((f'text "{t["t"][:14]}"', box))
    free, busy = [], {}
    for r, (ya, yb) in ROWS.items():
        cells = []
        for c, (xa, xb) in COLS.items():
            who = sorted({n for n, b in obs if hit([xa, ya, xb, yb], b)})
            (busy.setdefault(', '.join(who), []).append(f'{r}-{c}') if who else cells.append(c))
        if len(cells) == 3: free.append(r)
        elif cells: free.append(f'{r}-{"".join(cells)}')
    b = beats[i]
    print(f"#{i + 1} {b.get('t', 0):.1f}s {b.get('set', '?')}: free {' '.join(free) or 'none'} | taken " + '; '.join(f"{'/'.join(v)} ({n})" for n, v in busy.items()))
