#!/usr/bin/env python3
"""stylize.py — the sound of each visual style. Runs on the music and SFX buses only; the voice is never touched.
Usage (in the project folder, after autoscore, before mix):  STYLE=<style> python3 stylize.py
   or: python3 stylize.py <style> <in.wav> <out.wav>   (one file, for demos)
Styles mirror the visual styles: ink (Standard), oldfilm, paper, riso, noir, comic, pastel, dusk, freeze, vhs.
Every style starts from the house 'ink bus': gentle tape saturation + a small shared room, the way plum ink + grain glue the picture.
Keeps the untouched buses as music/music_dry.wav and music/sfx_dry.wav (re-running starts from those)."""
import os, sys, shutil, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000; rng = np.random.default_rng(7)
def f(x, kind, fc, o=2): return sosfilt(butter(o, fc, kind, fs=SR, output='sos'), x, axis=0)
def sat(x, d): return np.tanh(d * x) / np.tanh(d)
def norm(x, pk=.8): return x / (np.abs(x).max() + 1e-9) * pk
def room(x, decay=.35, mix=.1, lpf=5000):
    n = int(decay * 4 * SR); t = np.arange(n) / SR
    h = np.stack([f(rng.standard_normal(n), 'low', lpf) * np.exp(-t / decay) for _ in range(2)], 1); h[:int(.012 * SR)] = 0; h /= np.sqrt((h ** 2).sum(0))
    return x * (1 - mix) + np.stack([fftconvolve(x[:, c], h[:, c])[:len(x)] for c in range(2)], 1) * mix
def wow(x, rate=.5, depth_ms=1.5, flutter=0., fl_ms=0.):
    n = len(x); t = np.arange(n) / SR
    d = depth_ms / 1000 * SR * (1 + np.sin(2 * np.pi * rate * t)) / 2 + fl_ms / 1000 * SR * (1 + np.sin(2 * np.pi * flutter * t)) / 2
    i = np.clip(np.arange(n) - d, 0, n - 1); return np.stack([np.interp(i, np.arange(n), x[:, c]) for c in range(2)], 1)
def mono(x, amt=1.): m = x.mean(1, keepdims=True); return x * (1 - amt) + m * amt
def hiss(n, db): return f(rng.standard_normal((n, 2)), 'high', 3000) * 10 ** (db / 20)
def crackle(n, rate=12, db=-34):
    y = np.zeros((n, 2)); k = rng.integers(0, n - 200, int(n / SR * rate))
    for i in k: y[i:i + 60] += f(rng.standard_normal((60, 2)), 'high', 2000) * rng.uniform(.2, 1)
    return y * 10 ** (db / 20) + f(rng.standard_normal((n, 2)), 'low', 300) * 10 ** ((db - 14) / 20)
def crush(x, sr2=16000, bits=10):
    step = SR / sr2; i = (np.floor(np.arange(len(x)) / step) * step).astype(int); y = x[np.clip(i, 0, len(x) - 1)]
    q = 2 ** (bits - 1); return np.round(y * q) / q
def chorus(x, ms=12, depth=2.5, rate=.7):
    n = len(x); t = np.arange(n) / SR; d = (ms + depth * np.sin(2 * np.pi * rate * t)) / 1000 * SR
    i = np.clip(np.arange(n) - d, 0, n - 1); w = np.stack([np.interp(i, np.arange(n), x[:, c]) for c in range(2)], 1); return x * .75 + w[:, ::-1] * .35

def ink(x): return room(f(sat(x, 1.4), 'high', 35), .3, .08)   # the house bus: every style starts here
STYLES = {
 'ink':     ('Standard: warm tape, small room. Dry, close, sitcom.', lambda x, bus: ink(x)),
 'freeze':  ('Freeze frame: same as Standard (the freeze itself gets a tape-stop SFX).', lambda x, bus: ink(x)),
 'oldfilm': ('Old film: mono, 300 Hz to 4 kHz, wow, projector crackle. Sounds like a 1930s short.',
             lambda x, bus: (lambda y: y + (crackle(len(y)) if bus == 'music' else 0))(wow(sat(f(mono(ink(x)), 'band', [300, 4000]), 2.4), .45, 1.6))),
 'paper':   ('Paper cut-out: dry, papery, no room. Close-miked foley, like a desk-top puppet show.',
             lambda x, bus: f(f(sat(x, 1.3), 'high', 120), 'low', 9000) + f(sat(x, 1.3), 'band', [2500, 5000]) * .15),
 'riso':    ('Risograph: printed grain. Slight bit-crush and 16 kHz sample-and-hold, saturated.',
             lambda x, bus: f(sat(crush(ink(x), 16000, 10), 1.9), 'low', 7500)),
 'noir':    ('Noir: dark, smoky, long room. Highs rolled off, more reverb, more saturation.',
             lambda x, bus: room(f(sat(x, 1.8), 'low', 3800), .9, .28, 3500)),
 'comic':   ('Comic: punchy and bright. More drive, presence lift, tight room.',
             lambda x, bus: room(sat(x, 2.3) + f(sat(x, 2.3), 'high', 3000) * .3, .2, .06)),
 'pastel':  ('Pastel: soft and dreamy. Rounded highs, gentle chorus, airy room.',
             lambda x, bus: room(chorus(f(sat(x, 1.1), 'low', 6500)), .6, .16, 4500)),
 'dusk':    ('Dusk: warm and golden. Low-pass 5 kHz, long warm room.',
             lambda x, bus: room(f(sat(x, 1.5), 'low', 5000), .8, .2, 3000)),
 'vhs':     ('VHS: tape wobble and flutter, hiss, narrowed stereo, 9.5 kHz top.',
             lambda x, bus: (lambda y: y + (hiss(len(y), -60) if bus == 'music' else 0))(mono(f(sat(wow(ink(x), .8, 2.4, 7, .25), 1.8), 'low', 9500), .4))),
}
def run(style, x, bus):
    if x.ndim == 1: x = np.stack([x, x], 1)
    return norm(STYLES[style][1](x, bus))

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) == 3:
        x, sr = sf.read(a[1]); assert sr == SR, 'needs 48 kHz'; sf.write(a[2], run(a[0], x, 'music').astype(np.float32), SR); sys.exit()
    st = (a[0] if a else os.environ.get('STYLE') or 'ink').replace('standard', 'ink')
    if st not in STYLES: sys.exit(f'unknown style {st}; one of {list(STYLES)}')
    for bus in ('music', 'lead', 'sfx', 'amb', 'walla'):
        p, dry = f'music/{bus}.wav', f'music/{bus}_dry.wav'
        if not os.path.exists(p) and not os.path.exists(dry): continue
        if not os.path.exists(dry): shutil.copy(p, dry)
        x, sr = sf.read(dry); y = run(st, x, 'music' if bus in ('music', 'amb') else bus); k = (np.abs(x).max() + 1e-9) / (np.abs(y).max() + 1e-9) if bus in ('music', 'lead', 'amb', 'walla') else 1; sf.write(p, (y * k).astype(np.float32), SR)
    print(f'stylize: {st} — {STYLES[st][0]}')
