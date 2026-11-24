#!/usr/bin/env python3
"""music_kit.py — a brand's music kit: ONE theme, many moods (theme & variations), character leitmotifs and a sonic logo.
Everything is synthesised with instruments.py (ours, no licences). Same melody in every cue = sonic branding.
Usage: python3 music_kit.py <out_dir> [--theme brands/<b>/music/theme.json]
Writes <out_dir>/<cue>.wav (48 kHz stereo) + index.json (the repo keeps .ogg copies: ffmpeg -c:a libvorbis -q:a 6). Loops are 8 bars at 120 bpm (16 s) and cut on the bar so they loop clean."""
import os, sys, json
os.environ.setdefault('DUR', '24')
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'instruments.py')).read())
B = .5; BAR = 4 * B
OUT = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
os.makedirs(OUT, exist_ok=True)

# ---- the theme (Buzztorm default; a brand can override with theme.json: {"theme": [[beat, dur, "D5"], ...], "key": "D"}) ----
THEME = [(0, 1, 'D5'), (1, .5, 'F5'), (1.5, .5, 'E5'), (2, 1, 'D5'), (3, 1, 'A4'), (4, 1.5, 'A#4'), (5.5, .5, 'A4'), (6, 2, 'G4'),
         (8, 1, 'D5'), (9, .5, 'F5'), (9.5, .5, 'G5'), (10, 1, 'A5'), (11, 1, 'F5'), (12, 1.5, 'E5'), (13.5, .5, 'C#5'), (14, 2, 'D5')]
if '--theme' in sys.argv:
    THEME = [tuple(x) for x in json.load(open(sys.argv[sys.argv.index('--theme') + 1]))['theme']]
MAJ = lambda th: [(b, d, n.replace('F5', 'F#5').replace('A#4', 'B4').replace('C5', 'C#5') if 'C#' not in n else n) for b, d, n in th]
HEAD = [x for x in THEME if x[0] < 4]          # the motif: first bar (D F E D A) = the sonic logo
Dm = ['D3', 'F3', 'A3']; Bb = ['A#2', 'D3', 'F3']; Gm = ['G2', 'A#2', 'D3']; A7 = ['A2', 'C#3', 'E3']
DM = ['D3', 'F#3', 'A3']; GM = ['G2', 'B2', 'D3']; AM = ['A2', 'C#3', 'E3']; Bm = ['B2', 'D3', 'F#3']
MINOR = ([Dm, Bb, Gm, A7], ['D3', 'A#2', 'G2', 'A2']); MAJOR = ([DM, Bm, GM, AM], ['D3', 'B2', 'G2', 'A2'])

def ir(d=2.0, decay=.45, lpf=5000, pre=.015):
    n = int(d * SR); tn = np.arange(n) / SR
    x = np.stack([lp(rng.standard_normal(n), lpf) * np.exp(-tn / decay), lp(rng.standard_normal(n), lpf) * np.exp(-tn / decay)], 1)
    x[:int(pre * SR)] = 0; return x / np.sqrt((x ** 2).sum(0))
ROOM = ir()
def reset():
    for b in BUS.values(): b.b[:] = 0
D_, Bs, L, Hm, FX = BUS['drums'], BUS['bass'], BUS['lead'], BUS['harm'], BUS['fx']

def groove(t0, t1, prog, style, v=1.):
    chords, roots = prog; t = t0; i = 0
    while t < t1 - .05:
        ch = chords[i % 4]; root = M(roots[i % 4])
        if style not in ('tension', 'tiptoe'): Hm.add(pad(BAR, [M(n) + 12 for n in ch], .18 * v, 1800), t)
        for k in range(4):
            tb = t + k * B
            if style == 'sitcom':     # problem / community: upright-bass sitcom
                D_.add(kick(.7 * v), tb) if k % 2 == 0 else D_.add(snare(.45 * v), tb); D_.add(hat(.3 * v), tb + B / 2)
                Bs.add(bass(tb, B * .9, root - 12 + (7 if k == 2 else 0), .5 * v), tb)
            elif style == 'think':    # explaining: rhodes + rim, sparse
                if k == 0: Hm.add(rhodes(BAR * .9, M(ch[0]) + 12, .25 * v), tb); Hm.add(rhodes(BAR * .9, M(ch[2]) + 12, .18 * v), tb + .02)
                D_.add(rim(.16 * v), tb + B / 2) if k % 2 else D_.add(kick(.3 * v), tb)
                if k % 2 == 0: Bs.add(bass(tb, B * .9, root - 12, .35 * v, 600), tb)
            elif style == 'hustle':   # grind / busy: aerobics arps
                D_.add(kick(.85 * v), tb); D_.add(clap(.35 * v), tb) if k % 2 else None; D_.add(hat(.28 * v), tb + B / 2); D_.add(hat(.18 * v), tb + B / 4)
                for s in range(4): Hm.add(pluck(0, B / 4 * .8, M(ch[s % 3]) + 24, .11 * v, .25), tb + s * B / 4)
                Bs.add(bass(tb, B / 2 * .8, root - 12, .5 * v), tb); Bs.add(bass(tb, B / 2 * .8, root, .35 * v), tb + B / 2)
            elif style == 'money':    # ads / sales / casino: brushed swing + brass stabs
                D_.add(ride(.11 * v), tb); D_.add(brush(.13 * v), tb + B / 2 + .04); D_.add(kick(.35 * v), tb) if k % 2 == 0 else None
                Bs.add(bass(tb, B * .9, root - 12 + [0, 4, 7, 4][k], .5 * v, 700), tb)
                if k in (1, 3): Hm.add(brass(.18, [M(n) + 12 for n in ch], .2 * v), tb)
            elif style == 'folk':     # solution: nylon picking, claps
                for s, n in enumerate([ch[0], ch[1], ch[2], ch[1]]): Hm.add(ks(M(n) + 12, .9, .28 * v, .6), tb + s * B / 4 + (0 if s % 2 == 0 else .02))
                D_.add(brush(.3 * v), tb); D_.add(shaker(.22 * v), tb + B / 2)
                if k % 2: D_.add(clap(.22 * v), tb)
                Bs.add(bass(tb, B * .9, root - 12 + (7 if k == 2 else 0), .4 * v, 700), tb)
            elif style == 'tension':  # the drop / algorithm / bad news: tremolo strings + heartbeat, no melody drums
                if k == 0: Hm.add(strings_trem(BAR, [M(n) + 12 for n in ch], .32 * v), tb)
                if k in (0, 1): D_.add(kick(.45 * v) * .8, tb + (0 if k == 0 else .18))
            elif style == 'tiptoe':   # sneaky / awkward / secret: pizzicato + tuba
                if k % 2 == 0: Bs.add(tuba(tb, B * .6, root - 12, .55 * v), tb)
                Hm.add(ks(M(ch[k % 3]) + 12, .25, .3 * v, .3), tb + B / 2)
                D_.add(rim(.12 * v), tb + (B / 2 if k % 2 else 0))
        t += BAR; i += 1

def melody(notes, t0, v=.3, inst='theremin', oct_=0):
    if inst == 'theremin':
        st, sig = theremin([(t0 + b * B, d * B, M(n) + oct_) for b, d, n in notes]); L.add(sig, st, v)
    elif inst == 'wobble':
        st, sig = wobble_lead([(t0 + b * B, d * B, M(n) + oct_) for b, d, n in notes]); L.add(sig, st, v)
    else:
        for b, d, n in notes:
            m = M(n) + oct_; at = t0 + b * B
            if inst == 'xylo': L.add(xylo(m, v), at)
            elif inst == 'vibes': L.add(vibes(d * B, m, v), at)
            elif inst == 'ks': L.add(ks(m, max(.4, d * B + .3), v, .7), at)
            elif inst == 'tuba': L.add(tuba(at, d * B * .85, m, v), at)
            elif inst == 'brass': L.add(brass(d * B * .9, [m, m - 12], v), at)
            elif inst == 'clarinet': L.add(lp(pad(d * B * .9, [m], v * 1.4, 2400, .03), 2600), at)

def render(name, dur, loop=False, send=(.06, 0, .25, .2, .2)):
    mus = sum(b.b for b in BUS.values()) + np.stack([fftconvolve(sum(BUS[k].b * s for k, s in zip(['drums', 'bass', 'lead', 'harm', 'fx'], send))[:, c], ROOM[:, c])[:N] for c in range(2)], 1) * .8
    n = int(dur * SR); y = mus[:n].copy()
    if loop:   # fold the reverb tail into the head so the loop is seamless
        tail = mus[n:n + int(1.5 * SR)]; y[:len(tail)] += tail
        f = int(.008 * SR); y[:f] *= np.linspace(0, 1, f)[:, None]; y[-f:] *= np.linspace(1, 0, f)[:, None]
    else:
        f = int(.03 * SR); y[-f:] *= np.linspace(1, 0, f)[:, None]
    y = np.stack([hp(y[:, c], 30) for c in range(2)], 1); y = y / (np.abs(y).max() + 1e-9) * .8
    sf.write(os.path.join(OUT, name + '.wav'), y.astype(np.float32), SR); reset(); return name

LOOP = 8 * BAR
CUES = [   # (cue = the same mood names story.js uses in `music:`, what it's for, builder)
    ('sitcom', 'Opening problem, the joke set-up (minor sitcom, theme on theremin)', lambda: (groove(0, LOOP + 2, MINOR, 'sitcom', .85), melody(THEME, 0, .28))),
    ('think', 'Explaining, the idea, how it works (rhodes, theme on vibes)', lambda: (groove(0, LOOP + 2, MINOR, 'think'), melody(THEME, 0, .32, 'vibes'))),
    ('aerobics', 'Grinding, posting every day, chaos (fast arps, theme on xylophone)', lambda: (groove(0, LOOP + 2, MINOR, 'hustle'), melody(THEME, 0, .35, 'xylo', 12))),
    ('casino', 'Ads, sales, prices, the casino of paid traffic (swing + brass, theme on muted brass)', lambda: (groove(0, LOOP + 2, MINOR, 'money'), melody(THEME, 0, .22, 'brass', -12))),
    ('tiptoe', 'Awkward, sneaky, the secret, the mistake (pizzicato + tuba, theme on clarinet)', lambda: (groove(0, LOOP + 2, MINOR, 'tiptoe'), melody(THEME, 0, .3, 'clarinet', -12))),
    ('tension', 'The drop, bad news, the algorithm (strings + heartbeat, theme slowed on theremin)', lambda: (groove(0, LOOP + 2, MINOR, 'tension'), melody([(b * 2, d * 2, n) for b, d, n in THEME if b < 8], 0, .2))),
    ('folk', 'The turn, the solution (major folk, theme on nylon guitar)', lambda: (groove(0, LOOP + 2, MAJOR, 'folk'), melody(MAJ(THEME), 0, .32, 'ks'))),
    ('happy', 'Community, win, CTA bed (major sitcom, theme on theremin)', lambda: (groove(0, LOOP + 2, MAJOR, 'sitcom', 1.0), melody(MAJ(THEME), 0, .3))),
]
idx = {'bpm': 120, 'key': 'D minor / D major', 'loop_seconds': LOOP, 'cues': [], 'leitmotifs': [], 'stings': []}
for name, what, build in CUES:
    build(); render(name, LOOP, loop=True); idx['cues'].append({'id': name, 'file': f'{name}.wav', 'use': what})

# ---- character leitmotifs: the same 1-bar head, each character its own instrument ----
MOTIFS = [('motif-dex', 'Dex (narrator): the theme head on theremin, dry and knowing', lambda: (melody(HEAD, 0, .4), Bs.add(bass(0, BAR * .9, M('D3') - 12, .4), 0))),
          ('motif-tony', 'Tony (hero): the head on tuba, a proud oom-pah march', lambda: (melody(HEAD, 0, .7, 'tuba', -24), [D_.add(snare(.35), k * B) for k in range(4)], [Hm.add(brass(.15, [M('D4'), M('F4'), M('A4')], .2), k * B + B / 2) for k in range(4)])),
          ('motif-mom', "Tony's Mom: the head as a music box (vibes), sweet and mischievous", lambda: (melody(MAJ(HEAD), 0, .45, 'vibes', 12), Hm.add(pad(BAR, [M('D4'), M('F#4'), M('A4')], .1, 1400), 0)))]
for name, what, build in MOTIFS:
    build(); render(name, BAR + 1.2); idx['leitmotifs'].append({'id': name, 'file': f'{name}.wav', 'use': what})

# ---- sonic logo and stings, all built from the head (D F E D) ----
def logo():
    for b, d, n in HEAD[:4]: L.add(brass(d * B * .8, [M(n), M(n) - 12], .5), b * B)
    D_.add(crash(.25), 2 * B); Hm.add(brass(1.2, [M('D4'), M('F#4'), M('A4'), M('D5')], .45), 2 * B); [FX.add(xylo(M(n) + 12, .25), 2 * B + .05 + k * .06) for k, n in enumerate(['D5', 'F#5', 'A5', 'D6'])]
def bump():   # series bumper / transition: pizzicato run up the head + rim (the 'Seinfeld slap' role)
    for k, (b, d, n) in enumerate(HEAD): Hm.add(ks(M(n), .5, .5, .5), k * .09)
    D_.add(rim(.35), 0); D_.add(rim(.3), .36); Bs.add(bass(.45, .3, M('D2'), .5), .45)
def outro():
    melody(MAJ(HEAD), 0, .32); Hm.add(pad(2.4, [M('D4'), M('F#4'), M('A4')], .2, 2000), 0); Bs.add(bass(0, 1.8, M('D2'), .4), 0); D_.add(crash(.12), 2 * B)
def button():  # the last-joke button: theremin 'ta-daa'
    st, sig = theremin([(0, .18, M('A4')), (.2, .9, M('D5'))], vib=.5); L.add(sig, st, .45); Bs.add(tuba(0, .15, M('A2'), .5), 0); Bs.add(tuba(.2, .5, M('D2'), .6), .2)
for name, what, build, d in [('logo-sting', 'Sonic logo: the head on brass + sparkle (brand appears)', logo, 3.0),
                             ('series-bump', 'Series bumper / scene transition: pizzicato run (one per video, same every time)', bump, 1.3),
                             ('outro', 'CTA / end card: theme head in major + warm pad', outro, 3.0),
                             ('button', 'Button on the last joke: theremin ta-daa', button, 1.6)]:
    build(); render(name, d); idx['stings'].append({'id': name, 'file': f'{name}.wav', 'use': what})
json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w'), indent=1); print(json.dumps({k: len(v) if isinstance(v, list) else v for k, v in idx.items()}))
