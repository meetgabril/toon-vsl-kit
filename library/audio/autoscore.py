# autoscore.py — music + SFX written from work/events.json (made by `node events.mjs` from story.js). No hand cue sheet needed.
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instruments.py')).read())
import json
if not os.environ.get('DUR'): pass
B = .5   # 120 bpm
def swing(b, amt=.16): return b + (amt if (b * 2) % 2 == 1 else 0)
def ir(d=2.0, decay=.45, lpf=5000, pre=.015):
    n = int(d * SR); tn = np.arange(n) / SR
    x = np.stack([lp(rng.standard_normal(n), lpf) * np.exp(-tn / decay), lp(rng.standard_normal(n), lpf) * np.exp(-tn / decay)], 1)
    x[:int(pre * SR)] = 0; return x / np.sqrt((x ** 2).sum(0))
def spring_ir(d=1.2):
    n = int(d * SR); tn = np.arange(n) / SR; ch = np.sin(2 * np.pi * (1800 * tn - 700 * tn ** 2)) * np.exp(-tn / .05) * .3
    x = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-tn / .35)[:, None]; x[:, 0] += ch; x[:, 1] += np.roll(ch, 300)
    x = np.stack([bp(x[:, 0], 300, 4500), bp(x[:, 1], 300, 4500)], 1); x[:int(.02 * SR)] = 0; return x / np.sqrt((x ** 2).sum(0))
def conv(x, h): return np.stack([fftconvolve(x[:, c], h[:, c])[:N] for c in range(2)], 1)


def section(t0, t1):
    """beat grid helper: yields beat times in [t0, t1)"""
    t = t0
    while t < t1 - 1e-6: yield t; t += B

D, Bs, L, Hm, FX = BUS['drums'], BUS['bass'], BUS['lead'], BUS['harm'], BUS['fx']
Dm = ['D3', 'F3', 'A3']; Bb = ['A#2', 'D3', 'F3']; Gm = ['G2', 'A#2', 'D3']; A7 = ['A2', 'C#3', 'E3']
DM = ['D3', 'F#3', 'A3']; GM = ['G2', 'B2', 'D3']; AM = ['A2', 'C#3', 'E3']; Bm = ['B2', 'D3', 'F#3']

def groove(t0, t1, chords, bassroot, style='sitcom', v=1.):
    bar = 4 * B; i = 0; t = t0
    while t < t1 - .05:
        ch = chords[i % len(chords)]; root = M(bassroot[i % len(bassroot)])
        d = min(bar, t1 - t)
        Hm.add(pad(d, [M(n) + 12 for n in ch], .22 * v, 1800), t)
        for k in range(4):
            tb = t + k * B
            if tb >= t1: break
            if style == 'sitcom':
                D.add(kick(.8 * v), tb) if k % 2 == 0 else D.add(snare(.5 * v), tb)
                D.add(hat(.35 * v), tb + B / 2)
                Bs.add(bass(tb, B * .9, root - 12 + (7 if k == 2 else 0), .5 * v), tb)
            elif style == 'casino':
                D.add(ride(.28 * v), tb); D.add(brush(.3 * v), swing(tb + B / 2, .08))
                Bs.add(bass(tb, B * .9, root - 12 + [0, 4, 7, 4][k], .5 * v, 700), tb)
                if k in (1, 3): Hm.add(brass(.18, [M(n) + 12 for n in ch], .22 * v), tb)
            elif style == 'aerobics':
                D.add(kick(.9 * v), tb); D.add(clap(.4 * v), tb) if k % 2 else None; D.add(hat(.3 * v), tb + B / 2); D.add(hat(.2 * v), tb + B / 4)
                for s in range(4): Hm.add(pluck(0, B / 4 * .8, M(ch[s % 3]) + 24, .12 * v, .25), tb + s * B / 4)
                Bs.add(bass(tb, B / 2 * .8, root - 12, .55 * v), tb); Bs.add(bass(tb, B / 2 * .8, root, .4 * v), tb + B / 2)
            elif style == 'think':
                if k == 0: Hm.add(rhodes(bar * .9, M(ch[0]) + 12, .25 * v), tb); Hm.add(rhodes(bar * .9, M(ch[2]) + 12, .18 * v), tb + .02)
                D.add(rim(.18 * v), tb + B / 2) if k % 2 else D.add(kick(.35 * v), tb)
                Bs.add(bass(tb, B * .9, root - 12, .35 * v, 600), tb) if k % 2 == 0 else None
            elif style == 'folk':
                for s, n in enumerate([ch[0], ch[1], ch[2], ch[1]]): Hm.add(ks(M(n) + 12, .9, .3 * v, .6), tb + s * B / 4 + (.0 if s % 2 == 0 else .02))
                D.add(brush(.35 * v), tb); D.add(shaker(.25 * v), tb + B / 2)
                if k % 2 == 1: D.add(clap(.25 * v), tb)
                Bs.add(bass(tb, B * .9, root - 12 + (7 if k == 2 else 0), .4 * v, 700), tb)
            elif style == 'island':
                for s, n in enumerate([ch[0], ch[2], ch[1], ch[2]]): Hm.add(ks(M(n) + 24, .6, .22 * v, .8), tb + s * B / 4)
                if k == 0: Hm.add(vibes(1, M(ch[1]) + 24, .15 * v), tb)
                D.add(shaker(.2 * v), tb + B / 2)
                Bs.add(bass(tb, B * .9, root - 12, .3 * v, 600), tb) if k % 2 == 0 else None
        t += bar; i += 1

def melody(notes, t0, v=.35, **kw):   # notes: (beat, dur_beats, 'D5')
    st, sig = theremin([(t0 + b * B, d * B, M(n)) for b, d, n in notes], **kw); L.add(sig, st, v)

THEME = [(0, 1, 'D5'), (1, .5, 'F5'), (1.5, .5, 'E5'), (2, 1, 'D5'), (3, 1, 'A4'), (4, 1.5, 'A#4'), (5.5, .5, 'A4'), (6, 2, 'G4'),
         (8, 1, 'D5'), (9, .5, 'F5'), (9.5, .5, 'G5'), (10, 1, 'A5'), (11, 1, 'F5'), (12, 1.5, 'E5'), (13.5, .5, 'C#5'), (14, 2, 'D5')]
THEME_MAJ = [(b, d, n.replace('F5', 'F#5').replace('A#4', 'B4').replace('C#5', 'C#5')) for b, d, n in THEME]

# ---------------- music from the story ----------------
EV = json.load(open('work/events.json'))
STY = {   # style → (groove style, chords, bass roots, melody?)
  'sitcom':   ('sitcom',   [Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2'], True),
  'happy':    ('sitcom',   [DM, Bm, GM, AM], ['D3', 'B2', 'G2', 'A2'], True),
  'think':    ('think',    [Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2'], False),
  'casino':   ('casino',   [Gm, Dm, A7, Dm], ['G2', 'D3', 'A2', 'D3'], False),
  'aerobics': ('aerobics', [Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2'], False),
  'island':   ('island',   [DM, GM], ['D3', 'G2'], False),
  'folk':     ('folk',     [DM, Bm, GM, AM], ['D3', 'B2', 'G2', 'A2'], True),
}
secs, cur = [], None
for b in EV['beats']:
    m = b['music'] or cur or 'sitcom'
    if m != cur: secs.append([b['t'], m]); cur = m
secs.append([EV['dur'], None])
for (t0, m), (t1, _) in zip(secs, secs[1:]):
    if m in ('silence', 'none'): continue
    if m == 'tension': Hm.add(strings_trem(t1 - t0, [M('D3'), M('A3')], .25), t0); continue
    if m == 'build': Hm.add(strings_trem(t1 - t0, [M('A2'), M('D3'), M('F3')], .3, rise=t1 - t0 - .5), t0); FX.add(noise_riser(min(3, t1 - t0), .35), max(t0, t1 - 3)); continue
    st, ch, br, mel = STY.get(m, STY['sitcom'])
    groove(t0, t1 - .05, ch, br, st, 1.0)
    if mel and t1 - t0 > 8: melody(THEME_MAJ if ch[0] is DM else THEME, t0, .25)
for e in EV['events']:
    if e['type'] == 'portal': D.add(crash(.5), e['t'] + .5)
# ---------------- reverb + cuts ----------------
room, spr = ir(), spring_ir()
send = {'drums': .08, 'bass': .0, 'lead': .28, 'harm': .22, 'fx': .2}
music = sum(b.b for b in BUS.values()) + conv(sum(BUS[k].b * send[k] for k in ['drums', 'harm', 'fx']), room) * .9 + conv(BUS['lead'].b * send['lead'], spr)
def hard_cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.01 * SR); (i >= f) and music.__setitem__(slice(i - f, i), music[i - f:i] * np.linspace(1, 0, f)[:, None]); music[i:j] = 0
music = np.stack([hp(music[:, c], 30) for c in range(2)], 1)
for (t0, m), (t1, _) in zip(secs, secs[1:]):
    if m in ('silence', 'none'): hard_cut(t0, t1)
sf.write('music/music.wav', (music / np.abs(music).max() * .8).astype(np.float32), SR)


# ---------------- SFX ----------------
fx = np.zeros((N, 2))
def put(x, t, g=1., pan=0.):
    if x.ndim == 1: x = np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], 1)
    i = int(t * SR); j = min(N, i + len(x));
    if j > i: fx[i:j] += x[:j - i] * g / (np.abs(x).max() + 1e-9)
T = lambda d: np.arange(int(d * SR)) / SR
def pop(): t = T(.12); return np.sin(2 * np.pi * np.cumsum(500 + 900 * np.exp(-t * 60)) / SR) * np.exp(-t * 35)
def boing(): t = T(.5); return np.sin(2 * np.pi * np.cumsum(220 + 120 * np.sin(2 * np.pi * 10 * t) * np.exp(-t * 5)) / SR) * np.exp(-t * 6)
def whoosh(d=.5, up=True): t = T(d); x = rng.standard_normal(len(t)); m = t / d if up else 1 - t / d; return (lp(x, 900) * (1 - m) + hp(x, 2500) * m) * np.sin(np.pi * t / d) ** 2
def thud(): t = T(.3); return np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t * 40)) / SR) * np.exp(-t * 16) + lp(rng.standard_normal(len(t)), 500) * np.exp(-t * 25) * .5
def stamp(): x = thud(); x[:int(.03 * SR)] += hp(rng.standard_normal(int(.03 * SR)), 1500) * .6; return x
def ding(m=88, d=.8): t = T(d); f = mf(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 4)
def chaching(): x = np.zeros(int(.7 * SR)); a = ding(96, .4); x[:len(a)] += a; b = ding(100, .5); x[int(.08 * SR):int(.08 * SR) + len(b)] += b * .8; c = hp(rng.standard_normal(int(.06 * SR)), 3000); x[:len(c)] += c * .4; return x
def coin(): return ding(98, .35) * .7 + 0
def slide(down=True, d=.7): t = T(d); f = (1500 - 1100 * t / d) if down else (400 + 1100 * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, (d - t) * 8) * .7
def powerdown(): t = T(1.0); return np.sin(2 * np.pi * np.cumsum(400 * np.exp(-t * 2.5) + 40) / SR) * np.exp(-t * 2) * .8
def creak(): t = T(.6); return lp(saw(np.cumsum(90 + 30 * np.sin(2 * np.pi * 3 * t)) / SR) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 34 * t))), 1500) * np.sin(np.pi * t / .6) * .5
def beep(f=2000, n=3): x = np.zeros(int(n * .18 * SR)); b = np.sin(2 * np.pi * f * T(.1)); [x.__setitem__(slice(int(k * .18 * SR), int(k * .18 * SR) + len(b)), b) for k in range(n)]; return x
def page(): t = T(.12); return bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 30)
def buzz(d=.4): t = T(d); return lp(saw(np.cumsum(np.full(len(t), 120.)) / SR), 2000) * (np.sin(2 * np.pi * 9 * t) > 0) * .5
def chalk(d=.35): t = T(d); return bp(rng.standard_normal(len(t)), 2500, 7000) * (.5 + .5 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / d)
def steps(d=1.5, rate=4): x = np.zeros(int(d * SR)); s = lp(rng.standard_normal(int(.05 * SR)), 900) * np.exp(-T(.05) * 60); [x.__setitem__(slice(int(k / rate * SR), int(k / rate * SR) + len(s)), s) for k in range(int(d * rate))]; return x
def cheer(d=1.6): t = T(d); return bp(rng.standard_normal(len(t)), 500, 3000) * (np.sin(np.pi * t / d) ** .5) * (.7 + .3 * np.sin(2 * np.pi * 7 * t))
def portal(): t = T(1.6); return (np.sin(2 * np.pi * np.cumsum(45 + 20 * t) / SR) * np.exp(-t * 1.5) + whoosh(1.6, True) * .6 + np.sin(2 * np.pi * np.cumsum(300 + 600 * t) / SR) * .25 * np.sin(np.pi * t / 1.6))
def click(): return hp(rng.standard_normal(int(.02 * SR)), 3000) * np.exp(-T(.02) * 300)
def sparkle(): x = np.zeros(int(.8 * SR)); [x.__setitem__(slice(int(k * .07 * SR), int(k * .07 * SR) + int(.4 * SR)), ding(96 + 3 * k, .4) * .5) for k in range(4)]; return x
def whir(d): t = T(d); return lp(saw(np.cumsum(np.full(len(t), 55.)) / SR) + .4 * rng.standard_normal(len(t)), 700) * .4 * np.minimum(1, t * 5) * np.minimum(1, (d - t) * 5)
def waves(d): t = T(d); return lp(rng.standard_normal(len(t)), 700) * (.5 + .5 * np.sin(2 * np.pi * .25 * t)) * np.minimum(1, t) * np.minimum(1, d - t)
def scratch(): t = T(.35); f = 900 * np.exp(-t * 6) + 120; return (bp(rng.standard_normal(len(t)), 300, 4000) * .6 + np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .25) * np.exp(-t * 5)
def projector(d): t = T(d); x = np.zeros(len(t)); k = int(SR / 18); [x.__setitem__(slice(i, i + 200), hp(rng.standard_normal(200), 2000) * .5) for i in range(0, len(t) - 200, k)]; return x + lp(rng.standard_normal(len(t)), 300) * .15
def gulp(): t = T(.2); return np.sin(2 * np.pi * np.cumsum(300 - 600 * t) / SR) * np.exp(-t * 12)

M_ = {'pop': lambda: pop(), 'pops': lambda: pop(), 'click': lambda: click(), 'ding': lambda: ding(88, .6), 'buzz': lambda: buzz(.4), 'stamp': lambda: stamp(), 'whoosh': lambda: whoosh(.45),
      'chaching': lambda: chaching(), 'cheer': lambda: cheer(1.6), 'sparkle': lambda: sparkle(), 'steps': lambda: steps(1.8, 4), 'portal': lambda: portal(), 'boing': lambda: boing(),
      'thud': lambda: thud(), 'creak': lambda: creak(), 'powerdown': lambda: powerdown(), 'page': lambda: page(), 'waves': lambda: waves(4.0), 'gulp': lambda: gulp(), 'chalk': lambda: chalk(), 'scratch': lambda: scratch()}
cues = []
bts = EV['beats'] + [{'t': EV['dur'], 'style': None}]
for b0, b1 in zip(bts, bts[1:]):
    if b0.get('style') == 'oldfilm': cues.append((b0['t'], projector(b1['t'] - b0['t']), .35))
for e in EV['events']:
    t, k = e['t'], e['type']
    if k in ('cut', 'end'): continue
    if k == 'count':   # ticking up, ding at the end
        d = e.get('dur', 1.6); cues += [(t + .2 + d * q / 8, beep(1600 + 120 * q, 1), .18) for q in range(8)] + [(t + .2 + d, ding(91, .5), .5)]
    elif k == 'notif':
        h = e.get('hit', .9); cues += [(t + h, gulp(), .3)] + [(t + h + .1 + i * .18, ding(86 + i * 2, .3), .35) for i in range(4)]
    elif k == 'pops': cues += [(t + i * .08, pop(), .5) for i in range(5)]
    elif os.path.exists(f'sfx/{k}.wav'):   # file from sfx.py (library / AI) wins over the synth
        y, r = sf.read(f'sfx/{k}.wav'); y = y.mean(1) if y.ndim > 1 else y; cues.append((t, y, .7))
    elif k in M_: cues.append((t, M_[k](), .7))
for t, x, g in cues: put(x, t, g)
sf.write('music/sfx.wav', (fx / (np.abs(fx).max() + 1e-9) * .8).astype(np.float32), SR)
print('autoscore:', len(secs) - 1, 'music sections ·', len(cues), 'sfx cues')
