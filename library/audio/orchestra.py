#!/usr/bin/env python3
"""orchestra.py — the studio's real orchestra. Plays music with recorded instruments (VS Chamber Orchestra CE, CC0) instead of synthesis.
Every note is a real recording: nearest sampled pitch, the velocity layer that fits, round-robin takes, human timing and dynamics, one shared room.
  python3 orchestra.py kit <brand>                 render the brand's music kit (8 moods, leitmotifs, stings, musical SFX) into brands/<b>/music
  python3 orchestra.py section <brand> <mood> <seconds> <out.wav>   one bed of any length (autoscore uses render_section)
  python3 orchestra.py audition <brand>            render every theme in identity['theme_candidates'] as logo + 8 bars, to choose the brand's theme
The brand's theme, key, tempo and instruments come from brands/<b>/sound-identity.json (see brands/_template)."""
import os, sys, json, functools
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = next(p for p in [os.path.join(HERE, '..', '..'), os.path.expanduser('~/buzztorm-studio')] if os.path.exists(os.path.join(p, 'library', 'instruments')))
LIB = os.path.join(ROOT, 'library', 'instruments', 'vsco'); SR = 48000
MAP = json.load(open(os.path.join(LIB, 'map.json')))['instruments']
rng = np.random.default_rng(3)
NOTES = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def M(s):
    if isinstance(s, (int, float)): return int(s)
    n = NOTES[s[0]] + (1 if '#' in s else -1 if s[1:2] == 'b' else 0); return 12 * (int(s.lstrip('ABCDEFG#b')) + 1) + n

@functools.lru_cache(maxsize=4096)
def load(inst, f):
    x, sr = sf.read(os.path.join(LIB, inst, f), dtype='float32', always_2d=True)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    if sr != SR: from scipy.signal import resample_poly; x = resample_poly(x, SR, sr, axis=0).astype(np.float32)
    return x

class Band:
    """A take: a stereo buffer plus a round-robin memory, so repeated notes never use the same recording twice in a row."""
    def __init__(s, dur, tight=.012):
        s.N = int(dur * SR) + SR * 4; s.b = np.zeros((s.N, 2), np.float32); s.rr = {}; s.tight = tight
    def _pick(s, inst, m, vel):
        ent = [e for e in MAP[inst] if e['note'] is not None]
        near = min(abs(e['note'] - m) for e in ent); ent = [e for e in ent if abs(e['note'] - m) == near]
        layers = sorted({e['vel'] for e in ent}); L = layers[min(len(layers) - 1, int(vel * len(layers)))]
        ent = [e for e in ent if e['vel'] == L]; k = (inst, ent[0]['note'], L); i = s.rr.get(k, rng.integers(len(ent))); s.rr[k] = i + 1
        return ent[i % len(ent)]
    def put(s, x, t, g=1., pan=0.):
        t += rng.normal(0, s.tight); i = max(0, int(t * SR)); j = min(s.N, i + len(x))
        if j <= i: return
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        s.b[i:j] += x[:j - i] * np.array([l, r], np.float32) * g * 10 ** (rng.normal(0, 1.2) / 20)
    def note(s, inst, n, t, dur=None, vel=.6, g=1., pan=0., rel=.09):
        m = M(n); e = s._pick(inst, m, vel); x = load(inst, e['file'])
        if e['note'] != m:   # small transposition by resampling (a real player's pitch, not a synth)
            q = 2 ** ((m - e['note']) / 12); idx = np.arange(0, len(x) - 1, q); x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], 1).astype(np.float32)
        if dur is not None:
            n_ = int((dur + rel) * SR)
            if n_ < len(x): x = x[:n_].copy(); f = int(rel * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
        s.put(x, t, g * (.55 + .45 * vel), pan)
    def hit(s, inst, tag, t, g=1., pan=0.):
        ent = [e for e in MAP[inst] if tag in e['tag'] or tag in e['file'].lower()]
        if not ent: raise KeyError(f'{inst}:{tag}')
        k = (inst, tag); i = s.rr.get(k, 0); s.rr[k] = i + 1; s.put(load(inst, ent[i % len(ent)]['file']), t, g, pan)
    def chord(s, inst, notes, t, dur=None, vel=.5, g=1., pan=0., spread=.012):
        for k, n in enumerate(notes): s.note(inst, n, t + k * spread * rng.random(), dur, vel, g / np.sqrt(len(notes)), pan)
    def lead(s, short, long_, notes, t0, beat, vel=.65, g=1., pan=0., oct_=0, cut=.5):
        """Theme on a real instrument: staccato samples for short notes, sustained samples for long ones."""
        for b, d, n in notes:
            m = M(n) + oct_; dd = d * beat
            if long_ and dd >= cut: s.note(long_, m, t0 + b * beat, dd * .95, vel, g, pan, .18)
            else: s.note(short, m, t0 + b * beat, min(dd, .6), vel, g, pan)

def ir(d=1.6, decay=.38, lpf=6500):
    n = int(d * SR); t = np.arange(n) / SR; lp = butter(2, lpf, 'low', fs=SR, output='sos')
    h = np.stack([sosfilt(lp, rng.standard_normal(n)) * np.exp(-t / decay) for _ in range(2)], 1); h[:int(.018 * SR)] = 0; return h / np.sqrt((h ** 2).sum(0))
ROOM = ir()
def finish(band, dur, loop=False, wet=.16):
    x = band.b; y = x + np.stack([fftconvolve(x[:, c], ROOM[:, c])[:len(x)] for c in range(2)], 1) * wet
    n = int(dur * SR); out = y[:n].copy()
    if loop: tail = y[n:n + 2 * SR]; out[:len(tail)] += tail; f = int(.006 * SR); out[:f] *= np.linspace(0, 1, f)[:, None]; out[-f:] *= np.linspace(1, 0, f)[:, None]
    else: f = int(.05 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None]
    out = np.tanh(1.15 * out / (np.abs(out).max() + 1e-9)) ; return (out / (np.abs(out).max() + 1e-9) * .8).astype(np.float32)

# ---------------- harmony helpers ----------------
def identity(brand):
    p = os.path.join(ROOT, 'brands', brand, 'sound-identity.json')
    return json.load(open(p if os.path.exists(p) else os.path.join(ROOT, 'brands', '_template', 'sound-identity.json')))
def tr(n, k): return M(n) + k
def to_major(theme):   # the minor theme brightened: b3 → 3, b6 → 6 (relative to the key)
    return [(b, d, n) for b, d, n in theme]
def progs(I):
    r = M(I['key'] + '3') if isinstance(I['key'], str) else I['key']
    mi = [[r, r + 3, r + 7], [r - 4, r, r + 3], [r - 7, r - 4, r], [r - 5, r - 1, r + 2]]       # i  VI  iv  V(7)
    ma = [[r, r + 4, r + 7], [r - 3, r, r + 4], [r - 7, r - 3, r], [r - 5, r - 1, r + 2]]       # I  vi  IV  V
    return mi, ma
def walk(root, nxt, beat_):   # walking bass: root, 3rd/5th, 5th, chromatic approach
    return [root, root + (7 if beat_ % 2 else 3), root + 7, nxt + (1 if nxt < root else -1)]

def section(I, mood, dur, t0=0.):
    """Render one bed of `dur` seconds in `mood` for identity I. Returns (band, loop_len)."""
    bpm = I.get('tempo', {}).get(mood, I.get('bpm', 120)); B = 60 / bpm; BAR = 4 * B
    TH = [tuple(x) for x in I['theme']]; THM = [tuple(x) for x in I.get('theme_major', I['theme'])]
    mi, ma = progs(I); band = Band(dur); bars = int(np.ceil(dur / BAR)); sw = .12 * B
    for k in range(bars):
        t = t0 + k * BAR; c = (mi if mood not in ('folk', 'happy') else ma)[k % 4]; nx = (mi if mood not in ('folk', 'happy') else ma)[(k + 1) % 4]; root = c[0] - 12
        if mood == 'sitcom':
            for q, n in enumerate(walk(root, nx[0] - 12, k)): band.note('bass_pizz', n, t + q * B, None, .55 + .1 * (q == 0), .9, -.1)
            for q in (1, 3): band.chord('piano', [n + 12 for n in c], t + q * B + sw, .22, .45, .55, .15)
            for q in range(4): band.hit('wood', 'wood_click', t + q * B + B / 2 + sw, .1, .35)
            band.hit('snare', 'click', t + B, .22, .1); band.hit('snare', 'click', t + 3 * B, .22, .1)
        elif mood == 'think':
            for q in range(8): band.note('harp', [c[0], c[1], c[2], c[1] + 12][q % 4] + 12, t + q * B / 2, None, .45, .5, -.25)
            band.note('cello_sus', root + 12, t, BAR * .98, .35, .35, .2); band.note('bass_pizz', root, t, None, .45, .6)
        elif mood == 'aerobics':
            for q in range(8): band.note('violin_spic', [c[0], c[2], c[1], c[2]][q % 4] + 24, t + q * B / 2, None, .55 + .2 * (q % 2 == 0), .5, .3)
            for q in range(4): band.note('tuba_stac', root - 12 + (7 if q % 2 else 0), t + q * B, None, .6, .7, -.1)
            band.hit('bassdrum', 'bdrum_mp', t, .5); band.hit('bassdrum', 'bdrum_mp', t + 2 * B, .45)
            for q in (1, 3): band.hit('snare', 'snare1_f', t + q * B, .45, .1)
            for q in range(8): band.hit('wood', 'maraca', t + q * B / 2, .12, .4)
        elif mood == 'casino':
            for q, n in enumerate(walk(root, nx[0] - 12, k)): band.note('bass_pizz', n, t + q * B, None, .6, .9, -.1)
            for q in (0, 2): band.chord('piano', [n + 12 for n in c], t + q * B + B / 2 + sw, .18, .5, .55, .2)
            for q in range(4): band.hit('metal', 'susp', t + q * B, .05, .35) if q == 0 else band.hit('snare', 'click', t + q * B + sw, .12, .15)
        elif mood == 'tiptoe':
            for q in range(4): band.note('violin_pizz' if q % 2 else 'cello_pizz', (c[q % 3] + 12) if q % 2 else root + 12, t + q * B, None, .5, .6, .25 if q % 2 else -.25)
            for q in range(4): band.hit('wood', 'wood_click', t + q * B + (B / 2 if q % 2 else 0), .16, .5 if q % 2 else -.5)
        elif mood == 'tension':
            band.chord('violin_trem', [n + 12 for n in c], t, BAR * .98, .45, .55)
            band.note('bass_pizz', root - 12 + 12, t, None, .7, .8); band.hit('timpani', 'hit_v3', t, .55)
            if k % 2 == 1: band.hit('timpani', 'hit_v1', t + 3.5 * B, .35)
        elif mood == 'folk':
            for q in range(8): band.note('harp', [c[0], c[1], c[2], c[1]][q % 4] + 12, t + q * B / 2, None, .5, .45, -.3)
            for q in range(8): band.note('marimba', [c[2], c[0] + 12][q % 2] + 12, t + q * B / 2 + B / 4, None, .4, .3, .3)
            band.chord('violin_sus', [n + 12 for n in c], t, BAR * .98, .3, .35); band.note('bass_pizz', root, t, None, .5, .7); band.note('bass_pizz', root + 7, t + 2 * B, None, .45, .6)
        elif mood == 'happy':
            for q in range(4):
                if q % 2 == 0: band.note('tuba_stac', root - 12 + (0 if q == 0 else 7), t + q * B, None, .65, .85, -.1)
                else: band.chord('trombone_stac', [n for n in c], t + q * B, .2, .5, .5, .15)
            band.hit('bassdrum', 'bdrum_f', t, .45); [band.hit('snare', 'snare1_mp', t + q * B / 2, .25 + .1 * (q % 2 == 1), .1) for q in range(8)]
            if k % 4 == 0: band.hit('metal', 'clash', t, .25)
    # the theme, once per 8 bars, on the mood's lead (brand identity decides the instruments)
    lead = I['leads'].get(mood)
    if lead:
        th = THM if mood in ('folk', 'happy') else TH
        if mood == 'tension': th = [(b * 2, d * 2, n) for b, d, n in th if b < 8]
        for rep in range(int(np.ceil(dur / (8 * BAR)))):
            band.lead(lead[0], lead[1], th, t0 + rep * 8 * BAR, B, .62, lead[2] if len(lead) > 2 else 1., .05, lead[3] if len(lead) > 3 else 0)
    return band, 8 * BAR

def render_section(brand, mood, dur, I=None):
    I = I or identity(brand); band, _ = section(I, mood, dur); return finish(band, dur)

def kit(brand):
    I = identity(brand); out = os.path.join(ROOT, 'brands', brand, 'music'); os.makedirs(out, exist_ok=True); idx = {'cues': [], 'leitmotifs': [], 'stings': [], 'musical_sfx': []}
    for mood in I['moods']:
        _, L = section(I, mood, 0); band, L = section(I, mood, L); sf.write(f'{out}/{mood}.wav', finish(band, L, loop=True), SR); idx['cues'].append({'id': mood, 'seconds': round(L, 2)})
    B = 60 / I.get('bpm', 120); head = [tuple(x) for x in I['theme'] if x[0] < 4]; headM = [tuple(x) for x in I.get('theme_major', I['theme']) if x[0] < 4]
    for ch in I['characters']:
        band = Band(4); band.lead(ch['short'], ch.get('long'), headM if ch.get('major') else head, 0, B, .65, 1., 0, ch.get('oct', 0))
        for extra in ch.get('with', []):
            if extra == 'march': [band.hit('snare', 'snare1_mp', q * B / 2, .3) for q in range(8)]; band.hit('bassdrum', 'bdrum_mp', 0, .4)
            if extra == 'harp': [band.note('harp', n, q * B / 2, None, .4, .35) for q, n in enumerate([M(I['key'] + '4'), M(I['key'] + '4') + 4, M(I['key'] + '4') + 7, M(I['key'] + '4') + 12] * 2)]
            if extra == 'pizz': [band.note('bass_pizz', M(I['key'] + '2') + (7 if q % 2 else 0), q * B, None, .5, .7) for q in range(4)]
        sf.write(f"{out}/motif-{ch['id']}.wav", finish(band, 4 * B + 1.2), SR); idx['leitmotifs'].append({'id': f"motif-{ch['id']}", 'use': ch['what']})
    key = M(I['key'] + '4'); maj = [key, key + 4, key + 7, key + 12]
    def logo(b):
        b.lead('trumpet_stac', 'trumpet_sus', head, 0, B * .8, .8, 1.); b.lead('xylo', None, head, 0, B * .8, .6, .5, .2, 12)
        tt = 2 * B * .8; b.chord('horn_sus', [n - 12 for n in maj], tt, 1.6, .7, .8); b.chord('violin_sus', maj, tt, 1.6, .6, .5); b.hit('timpani', 'hit_v4', tt, .7); b.hit('metal', 'clash', tt, .35)
        [b.note('glock', n + 12, tt + .06 + q * .07, None, .6, .45) for q, n in enumerate(maj)]
    def bump(b):
        for q, (_, _, n) in enumerate(head): b.note('violin_pizz', M(n), q * .085, None, .7, .7, .2); b.note('xylo', M(n) + 12, q * .085, None, .6, .45, -.2)
        b.hit('wood', 'slapstick', .5, .6); b.note('bass_pizz', M(I['key'] + '2'), .5, None, .8, .9)
    def outro(b):
        b.lead('flute_stac', 'flute_sus', headM, 0, B, .6, .9); b.chord('violin_sus', [n - 12 for n in maj], 0, 2.6, .4, .5); b.chord('harp', maj, 2 * B, None, .5, .5, spread=.06); b.note('cello_sus', key - 24, 0, 2.6, .4, .45)
    def button(b):
        b.note('bassoon_stac', key - 17, 0, .15, .8, .9); b.note('bassoon_stac', key - 24, .2, .3, .9, 1.); b.note('tuba_stac', key - 36, .2, None, .8, .7); b.hit('snare', 'snare1_ff', .2, .35); b.hit('metal', 'clash', .2, .18)
    for name, fn, d, use in [('logo-sting', logo, 3.4, 'Sonic logo: the theme head on trumpet + xylophone, horn/strings chord, timpani, cymbal, glock'),
                             ('series-bump', bump, 1.4, 'Series bumper / the one stylised transition: pizzicato + xylophone run up the head, slapstick'),
                             ('outro', outro, 3.2, 'CTA / end card: the head in major on flute over strings and harp'),
                             ('button', button, 1.5, 'Last-joke button: bassoon + tuba "bwomp", snare, cymbal')]:
        b = Band(d + 1); fn(b); sf.write(f'{out}/{name}.wav', finish(b, d, wet=.2), SR); idx['stings'].append({'id': name, 'use': use})
    # musical SFX: the cartoon orchestra's classic gags, all real players
    def sad(b): [b.note('trombone_sus', key - 12 - q, q * .45, .4 if q < 3 else 1.1, .6, .9) for q in range(4)]
    def climb(b): [b.note('xylo', key + s, q * .05, None, .55, .6) for q, s in enumerate([0, 2, 4, 5, 7, 9, 11, 12, 14, 16])]
    def fall(b): [b.note('xylo', key + 16 - s, q * .05, None, .55, .6) for q, s in enumerate([0, 2, 4, 5, 7, 9, 11, 12, 14, 16])]
    def harp_up(b): [b.note('harp', key - 12 + s, q * .03, None, .5, .55) for q, s in enumerate([0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31])]
    def sting(b): b.chord('horn_sus', [key - 12, key - 9, key - 6], 0, 1.0, .9, .9); b.chord('violin_trem', [key, key + 3, key + 6], 0, 1.0, .8, .6); b.hit('timpani', 'hit_v4', 0, .8)
    def rimshot(b): b.hit('snare', 'snare1_f', 0, .7); b.hit('snare', 'snare1_ff', .18, .8); b.hit('metal', 'clash', .18, .3)
    def tiptoes(b): [b.note('violin_pizz', key + s, q * .22, None, .4, .6, (-1) ** q * .3) for q, s in enumerate([0, 7, 2, 9, 4, 11])]
    def drumroll(b): b.hit('timpani', 'roll', 0, .6)
    def wah(b): [b.note('trumpet_harmon', key + s, q * .32, .3 if q < 3 else .8, .6, .8) for q, s in enumerate([0, -1, -2, -3])]
    def plonk(b): b.note('tuba_stac', key - 29, 0, None, .8, 1.)
    for name, fn, d, use in [('sad-trombone', sad, 2.6, 'Fail: wah wah wah waaah on real trombone'), ('xylo-climb', climb, 1.0, 'Climbing up, rising, getting an idea'),
                             ('xylo-fall', fall, 1.0, 'Falling, losing, sliding down'), ('harp-gliss', harp_up, 1.6, 'Dream, flashback, magic'),
                             ('dramatic-sting', sting, 1.8, 'Dun dun DUN: shock reveal'), ('rimshot', rimshot, 1.0, 'Badum-tss after a pun'),
                             ('tiptoe-pizz', tiptoes, 1.6, 'Sneaking, tiptoe steps'), ('drumroll', drumroll, 3.0, 'Before a reveal'),
                             ('wah-trumpet', wah, 2.0, 'Muted trumpet wah-wah: disappointment'), ('tuba-plonk', plonk, .9, 'Something heavy and dumb lands')]:
        b = Band(d + 1); fn(b); sf.write(f'{out}/{name}.wav', finish(b, d, wet=.14), SR); idx['musical_sfx'].append({'id': name, 'use': use})
    json.dump(idx, open(f'{out}/index.json', 'w'), indent=1); print(json.dumps({k: len(v) for k, v in idx.items()}))

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__)
    elif a[0] == 'kit': kit(a[1])
    elif a[0] == 'audition':
        I = identity(a[1]); out = os.path.join(ROOT, 'brands', a[1], 'music', 'audition'); os.makedirs(out, exist_ok=True)
        for n, c in enumerate(I.get('theme_candidates', []), 1):
            J = dict(I, theme=c['theme'], theme_major=c.get('theme_major', c['theme'])); B = 60 / J.get('bpm', 120); head = [tuple(x) for x in c['theme'] if x[0] < 4]
            b = Band(4); b.lead('trumpet_stac', 'trumpet_sus', head, 0, B * .8, .8); b.lead('xylo', None, head, 0, B * .8, .6, .5, .2, 12); b.hit('timpani', 'hit_v4', 2 * B * .8, .6)
            sf.write(f'{out}/{n}-logo.wav', finish(b, 3), SR); band, L = section(J, 'sitcom', 16 * B); sf.write(f'{out}/{n}-sitcom.wav', finish(band, 16 * B), SR)
            print(n, c.get('name', ''), '→', out)
    elif a[0] == 'section': sf.write(a[4], render_section(a[1], a[2], float(a[3])), SR)
