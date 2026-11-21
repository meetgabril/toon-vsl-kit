# Score + SFX for "Coach Tony's Treadmill". Instruments come from the scifi-toon demo (MIT); cues and sound design are ours.
import os, sys, numpy as np, soundfile as sf
from scipy.signal import fftconvolve
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instruments.py')).read())
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

# ---------------- music cues ----------------
groove(0.0, 12.9, [Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2'], 'sitcom', .85); melody(THEME, 0.0, .3)
groove(12.9, 14.7, [Dm], ['D3'], 'think', .7)
groove(15.8, 23.1, [Gm, Dm, A7, Dm], ['G2', 'D3', 'A2', 'D3'], 'casino', 1.0)
Hm.add(tuba(0, .45, M('A#2'), .5), 23.4); Hm.add(tuba(0, .45, M('A2'), .5), 23.9); Hm.add(tuba(0, .9, M('G#2'), .5), 24.4)    # wah-wah
groove(25.8, 34.9, [Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2'], 'aerobics', .95)
groove(35.0, 37.4, [DM, GM], ['D3', 'G2'], 'island', 1.0)
groove(39.1, 50.5, [Dm, Gm, Bb, A7], ['D3', 'G2', 'A#2', 'A2'], 'think', .9)
for b in section(39.1, 50.5): Hm.add(pluck(0, .1, M('A5'), .06, .2), b)        # ticking clock pizzicato
Hm.add(strings_trem(4.0, [M('D3'), M('A3')], .25), 50.6)                         # dread under the algorithm
Hm.add(strings_trem(2.6, [M('D2'), M('G#2')], .3), 57.7)
groove(59.4, 66.9, [Dm, Bb], ['D3', 'A#2'], 'think', .7)
groove(66.95, 70.6, [Dm, A7], ['D3', 'A2'], 'aerobics', 1.1)
groove(73.3, 88.6, [Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2'], 'think', .95)
Hm.add(strings_trem(6.4, [M('A2'), M('D3'), M('F3')], .3, rise=5), 88.6); FX.add(noise_riser(3.0, .35), 92.0)
groove(96.1, 126.9, [DM, Bm, GM, AM], ['D3', 'B2', 'G2', 'A2'], 'folk', 1.0); melody(THEME_MAJ, 104.1, .2)
Hm.add(pad(1.6, [M('D4'), M('F#4'), M('A4')], .2), 128.1)
groove(130.1, 139.5, [DM, Bm, GM, AM], ['D3', 'B2', 'G2', 'A2'], 'sitcom', 1.05); melody(THEME_MAJ, 130.1, .3)
D.add(crash(.6), 138.0)
for k, n in enumerate(['D5', 'F#5', 'A5', 'D6']): Hm.add(xylo(M(n), .3), 139.6 + k * .12)
groove(141.0, 146.5, [DM, GM], ['D3', 'G2'], 'island', 1.0)
Hm.add(brass(.9, [M('D4'), M('F#4'), M('A4'), M('D5')], .5), 147.1)
groove(147.6, 168.3, [DM, Bm, GM, AM], ['D3', 'B2', 'G2', 'A2'], 'sitcom', .8); melody(THEME_MAJ, 150.1, .22)
tb = 171.35; st, bt = theremin([(tb, .2, M('D5')), (tb + .22, .2, M('A4')), (tb + .44, .4, M('D5'))], glide=.03, vib=.3); L.add(bt, st, .3)

# ---------------- reverb + cuts ----------------
room, spr = ir(), spring_ir()
send = {'drums': .08, 'bass': .0, 'lead': .28, 'harm': .22, 'fx': .2}
music = sum(b.b for b in BUS.values()) + conv(sum(BUS[k].b * send[k] for k in ['drums', 'harm', 'fx']), room) * .9 + conv(BUS['lead'].b * send['lead'], spr)
def hard_cut(a, b):
    i, j = int(a * SR), int(b * SR); f = int(.01 * SR); music[i - f:i] *= np.linspace(1, 0, f)[:, None]; music[i:j] = 0
for a, b in [(23.1, 23.38), (37.4, 39.05), (54.2, 57.65), (70.6, 73.25), (126.95, 128.05), (168.3, 171.3)]: hard_cut(a, b)
music = np.stack([hp(music[:, c], 30) for c in range(2)], 1)
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
def gulp(): t = T(.2); return np.sin(2 * np.pi * np.cumsum(300 - 600 * t) / SR) * np.exp(-t * 12)

cues = [(4.0, sparkle(), .5), (6.4, whoosh(.3), .3), (7.9, sparkle(), .6), (11.6, whir(1.4), .6), (12.9, whoosh(.4), .4), (14.85, creak(), .7), (15.6, whoosh(.5, True), .5)]
for n in range(3): cues += [(16.4 + n * 1.25, chaching(), .7), (16.95 + n * 1.25, pop(), .6)]
cues += [(20.1, page(), .7), (20.6, page(), .7), (21.1, page(), .7), (20.6, thud(), .5), (21.1, thud(), .6), (23.1, powerdown(), .8), (23.5, slide(True, .5), .5)]
cues += [(24.75, creak(), .7), (25.6, whoosh(.5), .5), (26.7, beep(2200, 3), .4), (28.2, ding(84, .6), .5), (29.6, beep(1200, 1), .4)]
cues += [(31.1 + k * .11, page(), .5) for k in range(12)]
cues += [(32.6, buzz(.5), .4), (34.0, buzz(.3), .3), (35.0, waves(4.0), .4)] + [(37.5 + i * .25, pop(), .6) for i in range(5)]
cues += [(at_, pop(), .7) for at_ in (41.1, 42.4, 43.7, 44.8, 46.0)] + [(48.0 + n * .35, slide(True, .8), .35) for n in range(6)] + [(48.6, stamp(), .6)]
cues += [(51.2, click(), .8), (51.25, powerdown(), .6), (52.6, stamp(), .9), (54.3, whoosh(2.0, False), .4), (57.9, stamp(), .9)]
cues += [(t_, chalk(), .5) for t_ in (61.3, 62.5, 63.8, 64.3, 65.2, 65.7)] + [(66.95, whir(3.5), .6)]
cues += [(74.0 + i * .12, pop(), .4) for i in range(8)] + [(77.6 + i * .16, thud(), .4) for i in range(4)] + [(78.4, slide(True, .9), .4)]
cues += [(81.6, stamp(), .7), (83.8, steps(1.8, 4), .5), (86.0, steps(2.4, 4), .5), (87.6, ding(91, .6), .5), (90.9, stamp(), .7)] + [(91.8 + i * .4, whoosh(.3), .35) for i in range(4)]
cues += [(95.0, portal(), 1.0)] + [(at_, pop(), .7) for at_ in (98.3, 99.1, 100.1, 101.0, 102.0)] + [(103.2, steps(2.0, 6), .45)]
cues += [(106.7, stamp(), .7), (107.5, pop(), .7), (108.5, whoosh(.5), .5), (109.4, whoosh(.5), .5), (111.2, ding(88, .5), .5), (111.5, ding(84, .8), .5), (113.6, sparkle(), .5)]
cues += [(115.4, beep(1800, 1), .3), (116.7, chaching(), .8), (118.7, sparkle(), .6), (121.2, pop(), .7), (121.3, ding(91, .5), .5), (123.5, whoosh(.6, False), .6), (125.4, cheer(1.6), .5), (127.0, stamp(), .7)]
cues += [(128.5 + i * .3, beep(2400 + i * 200, 1), .25) for i in range(4)] + [(130.3, steps(2.2, 5), .45)] + [(at_, pop(), .7) for at_ in (132.8, 133.8, 135.4)]
cues += [(139.6, whoosh(.4), .4), (141.0, waves(5.5), .4), (142.4, gulp(), .6)] + [(144.3 + i * .35, ding(86 + i * 2, .3), .3) for i in range(6)]
cues += [(148.6, click(), .8), (148.62, thud(), .3)] + [(at_, pop(), .7) for at_ in (152.2, 153.0, 153.9, 154.8, 155.8, 156.6, 157.6)] + [(at_ + .25, ding(93, .3), .3) for at_ in (152.2, 153.0, 153.9, 154.8)] + [(158.6, stamp(), .8)]
cues += [(162.7, whoosh(.5), .4), (164.4, sparkle(), .6), (165.8, page(), .7), (171.2, click(), .9), (171.3, boing(), 1.0), (171.65, thud(), .5)]
for t, x, g in cues: put(x, t, g)
sf.write('music/sfx.wav', (fx / (np.abs(fx).max() + 1e-9) * .8).astype(np.float32), SR)
print('ok', len(cues), 'sfx cues')
