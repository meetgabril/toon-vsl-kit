"""lips.py — per-frame mouth openness + speaker from the voice and work/timing.json (made by audio/align.py)
writes work/lips.json = {N, fps, open[0..1], sp['D'|'T'|...|'']}. Usage: python3 lips.py [fps=24]"""
import json, sys, numpy as np, soundfile as sf
FPS = int(sys.argv[1]) if len(sys.argv) > 1 else 24
v, sr = sf.read('work/voice_clean.wav'); v = v if v.ndim == 1 else v.mean(1)
T = json.load(open('work/timing.json')); N = int(len(v) / sr * FPS) + 1
hop = sr // FPS; rms = np.array([np.sqrt((v[i * hop:(i + 1) * hop] ** 2).mean() + 1e-12) for i in range(N)])
sp = [''] * N
for L in T['lines']:
    for f in range(max(0, int(L['t0'] * FPS) - 1), min(N, int(L['t1'] * FPS) + 2)): sp[f] = L['sp']
talk = np.array([s != '' for s in sp]); ref = np.percentile(rms[talk], 92) if talk.any() else rms.max()
o = np.clip((rms / ref - .08) / .92, 0, 1) * talk
o = np.convolve(o, [.25, .5, .25], 'same')          # soften frame-to-frame jitter
# close the mouth in the gaps between words
for a, b in zip(T['words'], T['words'][1:]):
    if b[1] - a[2] > .12: o[int(a[2] * FPS) + 1:int(b[1] * FPS)] = 0
json.dump(dict(N=N, fps=FPS, open=[round(float(x), 3) for x in o], sp=sp), open('work/lips.json', 'w'))
print('lips.json', N, 'frames; speakers', sorted(set(sp) - {''}))
