import os, numpy as np, soundfile as sf
from scipy.signal import resample_poly
SR = 48000
v, sr = sf.read('work/voice_clean.wav'); v = v if v.ndim == 1 else v.mean(1)
assert sr == SR
m, _ = sf.read('music/music.wav')
from scipy.signal import butter, sosfiltfilt
m = sosfiltfilt(butter(2, 9000, 'low', fs=SR, output='sos'), m, axis=0); x, _ = sf.read('music/sfx.wav')
N = max(len(v), len(m)); pad = lambda a: np.pad(a, [(0, N - len(a))] + [(0, 0)] * (a.ndim - 1))
v, m, x = pad(v), pad(m), pad(x)
def grms(a):
    a = a if a.ndim == 1 else a.mean(1); w = int(.4 * SR); k = len(a) // w
    r = np.sqrt((a[:k * w].reshape(k, w) ** 2).mean(1)); g = r[r > r.max() * .1]; return np.sqrt((g ** 2).mean())
db = lambda r: 20 * np.log10(r)
# speech envelope -> duck music 6 dB extra while Dex/Tony talk
env = np.abs(v); w = int(.05 * SR); env = np.convolve(env, np.ones(w) / w, 'same'); talk = (env > env.max() * .04).astype(float)
sm = int(.25 * SR); talk = np.convolve(np.maximum.accumulate(talk[::-1])[::-1] * 0 + talk, np.ones(sm) / sm, 'same')
duck = 10 ** ((-8 * np.clip(talk * 1.5, 0, 1)) / 20)
# the melody stem ducks further than the bed: a tune under a sentence fights the words (production-music practice)
L = sf.read('music/lead.wav')[0] if os.path.exists('music/lead.wav') else np.zeros_like(m)
L = pad(sosfiltfilt(butter(2, 9000, 'low', fs=SR, output='sos'), L, axis=0)); full = m + L
g = grms(v) / grms(full) * 10 ** (-11 / 20)
m = m * g * duck[:, None] + L * g * (duck ** 2)[:, None]      # bed: -11 dB in gaps, -19 under speech · melody: -27 under speech
def layer(name, rel_db):   # places: ambience and walla on the ladder (SOUND.md), ducked a little under speech
    if not os.path.exists(name): return 0
    a = pad(sf.read(name)[0]); r = grms(a)
    return 0 if not np.isfinite(r) or r < 1e-6 else a * (grms(v) / r * 10 ** (rel_db / 20)) * (10 ** ((-4 * np.clip(talk * 1.5, 0, 1)) / 20))[:, None]
m = m + layer('music/amb.wav', -30) + layer('music/walla.wav', -22)
x = x * (grms(v) / grms(x) * 10 ** (-10 / 20)) * (10 ** ((-3 * np.clip(talk * 1.5, 0, 1)) / 20))[:, None]   # SFX: -10 dB, 3 dB lower while someone talks
cap = np.abs(v).max() * .7; pk = np.abs(x).max()
if pk > cap: x *= cap / pk
out = np.stack([v, v], 1) + m + x
print('voice gRMS', round(db(grms(v)), 1), 'music', round(db(grms(m)) - db(grms(v)), 1), 'dB vs voice', 'sfx', round(db(grms(x)) - db(grms(v)), 1))
sf.write('music/mix_raw.wav', out.astype(np.float32), SR)
