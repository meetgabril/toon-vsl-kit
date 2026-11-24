import numpy as np, soundfile as sf
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
m = m * (grms(v) / grms(m) * 10 ** (-11 / 20)) * duck[:, None]      # music: -9 dB in gaps, -15 dB under speech
x = x * (grms(v) / grms(x) * 10 ** (-10 / 20))
cap = np.abs(v).max() * .7; pk = np.abs(x).max()
if pk > cap: x *= cap / pk
out = np.stack([v, v], 1) + m + x
print('voice gRMS', round(db(grms(v)), 1), 'music', round(db(grms(m)) - db(grms(v)), 1), 'dB vs voice', 'sfx', round(db(grms(x)) - db(grms(v)), 1))
sf.write('music/mix_raw.wav', out.astype(np.float32), SR)
