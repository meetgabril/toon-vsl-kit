"""shot_stills.py [fracs=0.1,0.5,0.9] — prints a frame list (3 per shot) for render.mjs from the shot() start times in vsl.js"""
import re, sys, json
fr = [float(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '0.1,0.5,0.9').split(',')]
ts = [float(x) for x in re.findall(r'^shot\(([\d.]+)', open('vsl.js').read(), re.M)]
N = json.load(open('work/lips.json'))['N']; ts.append(N / 24)
print(','.join(str(int((ts[i] + (ts[i + 1] - ts[i]) * q) * 24)) for i in range(len(ts) - 1) for q in fr))
