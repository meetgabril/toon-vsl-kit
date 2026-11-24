"""ingest.py <voice.mp4|mp3|wav> [script.md] — the uploaded ElevenLabs file → everything the film is timed to.

Writes (never alters the voice itself):
  work/voice_clean.wav   48 kHz mono, 70 Hz high-pass + gentle 2:1 comp (the only processing allowed)
  work/timing.json       {words:[[w,t0,t1,line]], lines:[{i,sp,t0,t1,text}], phones:[[ph,t0,t1]], dur}
  work/lips.json         {N,fps,open[],sp[],vis[]}  vis = mouth shape per frame: A B C D E F G H X (Hanna-Barbera set)
  work/ingest_report.txt line times, pauses and anything suspicious
English → pocketsphinx forced alignment to the script (word + phoneme accurate).
Other languages / failed alignment → energy-based line alignment, words spread by syllables, shapes from letters.
"""
import sys, os, re, json, subprocess, numpy as np, soundfile as sf
FPS = 24
here = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1]; script = sys.argv[2] if len(sys.argv) > 2 else ('script.md' if os.path.exists('script.md') else None)
os.makedirs('work', exist_ok=True)
if script: subprocess.run([sys.executable, os.path.join(here, 'script.py'), 'lines', script], check=True)
meta = json.load(open('work/script_meta.json')) if os.path.exists('work/script_meta.json') else {'meta': {}}
lang = meta['meta'].get('lang', 'en')
L = [l.rstrip('\n').split('|', 1) for l in open('work/lines.txt', encoding='utf-8') if l.strip()]

# ---------- audio ----------
ext = os.path.splitext(src)[1]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '48000', 'work/voice_orig.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'work/voice_orig.wav', '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=2:attack=15:release=200:makeup=1', 'work/voice_clean.wav'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'work/voice_orig.wav', '-ac', '1', '-ar', '16000', '-f', 's16le', 'work/voice16.raw'], check=True)
v, sr = sf.read('work/voice_clean.wav'); dur = len(v) / sr; N = int(dur * FPS) + 1
hop = sr // FPS; rms = np.array([np.sqrt((v[i * hop:(i + 1) * hop] ** 2).mean() + 1e-12) for i in range(N)])

# ---------- tiny English G2P for words missing from the dictionary (brand names etc.) ----------
DIG = [('tion', 'SH AH N'), ('ough', 'AO'), ('igh', 'AY'), ('ch', 'CH'), ('sh', 'SH'), ('th', 'TH'), ('ph', 'F'), ('ck', 'K'), ('ng', 'NG'), ('qu', 'K W'), ('ee', 'IY'), ('ea', 'IY'),
       ('oo', 'UW'), ('ou', 'AW'), ('ow', 'OW'), ('ai', 'EY'), ('ay', 'EY'), ('oa', 'OW'), ('oi', 'OY'), ('oy', 'OY'), ('er', 'ER'), ('ir', 'ER'), ('ur', 'ER'), ('ar', 'AA R'), ('or', 'AO R'), ('zz', 'Z'), ('ll', 'L'), ('ss', 'S'), ('tt', 'T'), ('pp', 'P'), ('mm', 'M'), ('nn', 'N')]
ONE = dict(a='AE', b='B', c='K', d='D', e='EH', f='F', g='G', h='HH', i='IH', j='JH', k='K', l='L', m='M', n='N', o='AA', p='P', q='K', r='R', s='S', t='T', u='AH', v='V', w='W', x='K S', y='Y', z='Z')
def g2p(w):
    w = re.sub(r'[^a-z]', '', w.lower()); out = []; i = 0
    if len(w) > 2 and w.endswith('e') and w[-2] not in 'aeiou': w = w[:-1]
    while i < len(w):
        for d, p in DIG:
            if w.startswith(d, i): out.append(p); i += len(d); break
        else:
            c = w[i]; out.append('IY' if c == 'y' and i == len(w) - 1 and i > 0 else ONE[c]); i += 1
    return ' '.join(out)

VIS = {}
for k, ps in dict(A='P B M', B='K S T D G N NG CH JH SH ZH Z TH DH Y HH R IY IH', C='EH AE EY AH', D='AA AY AW', E='AO ER OY', F='UW OW W UH', G='F V', H='L').items():
    for p in ps.split(): VIS[p] = k

words, phones, lines, how = [], [], [], ''
def forced():
    from pocketsphinx import Decoder
    toks, owner = [], []
    for i, (sp, tx) in enumerate(L):
        for w in re.findall(r"[A-Za-z']+", tx): toks.append(w.lower()); owner.append(i)
    d = Decoder(samprate=16000, bestpath=False)
    for w in set(toks):
        if d.lookup_word(w) is None and d.lookup_word(w.replace("'", '')) is None: d.add_word(w, g2p(w), False)
    d.set_align_text(' '.join(toks)); raw = open('work/voice16.raw', 'rb').read()
    d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
    d.set_alignment(); d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
    al = d.get_alignment(); ws = []
    for w in al.words():
        if w.name in ('<s>', '</s>', '<sil>', '(NULL)') or w.name.startswith('+'): continue
        ws.append([re.sub(r'\(\d\)', '', w.name), w.start / 100, (w.start + w.duration) / 100])
    if len(ws) != len(toks): raise RuntimeError(f'aligned {len(ws)} of {len(toks)} words')
    for w, o in zip(ws, owner): w.append(o)
    ph = [[re.sub(r'\d', '', p.name), p.start / 100, (p.start + p.duration) / 100] for p in al.phones()]
    return ws, ph

def energy():
    # speech segments from RMS → sentences ↔ segments by dynamic programming on syllable counts
    on = rms > max(rms.max() * .035, np.percentile(rms, 20) * 2.5); segs = []; i = 0
    while i < N:
        if on[i]:
            j = i
            while j < N and (on[j] or (j + 4 < N and on[j:j + 4].any())): j += 1
            segs.append([i / FPS, j / FPS]); i = j
        else: i += 1
    syl = lambda t: max(1, len(re.findall(r'[aeiouyàáâãéêíóôõú]+', t.lower())))
    units = []   # (line index, sentence text)
    for li, (sp, tx) in enumerate(L):
        for sn in re.split(r'(?<=[.!?…])\s+', tx):
            if sn.strip(): units.append((li, sn.strip()))
    S = [syl(t) for _, t in units]; nU, nS = len(units), len(segs)
    rate = sum(S) / max(1e-6, sum(b - a for a, b in segs))
    INF = 1e18; cost = np.full((nU + 1, nS + 1), INF); back = {}; cost[0][0] = 0
    for i in range(1, nU + 1):
        for j in range(1, nS + 1):
            for k in range(max(0, j - 10), j):
                if cost[i - 1][k] >= INF: continue
                span = segs[j - 1][1] - segs[k][0]; exp = S[i - 1] / rate
                inner = sum(segs[q + 1][0] - segs[q][1] for q in range(k, j - 1))   # pauses swallowed inside a sentence
                c = cost[i - 1][k] + ((exp - span) / max(.4, exp)) ** 2 + .6 * inner
                if c < cost[i][j]: cost[i][j] = c; back[(i, j)] = k
    j = nS; spans = []
    for i in range(nU, 0, -1): k = back[(i, j)]; spans.append((segs[k][0], segs[j - 1][1])); j = k
    spans.reverse(); ws, ph = [], []
    for (li, tx), (a, b) in zip(units, spans):
        toks = re.findall(r"[\wÀ-ÿ']+", tx); tot = sum(syl(t) for t in toks); t = a
        for tk in toks:
            d = (b - a) * syl(tk) / tot; ws.append([tk.lower(), t, t + d, li])
            vs = re.findall(r'[aeiouyàáâãéêíóôõú]+|[^aeiouyàáâãéêíóôõú]+', tk.lower()); dd = d / max(1, len(vs))
            for q, chunk in enumerate(vs):
                p = {'a': 'AA', 'e': 'EH', 'i': 'IY', 'o': 'AO', 'u': 'UW', 'y': 'IY'}.get(chunk[0], 'AH') if chunk[0] in 'aeiouyàáâãéêíóôõú' else ('M' if chunk[0] in 'mbp' else 'F' if chunk[0] in 'fv' else 'L' if chunk[0] == 'l' else 'T')
                ph.append([p, t + q * dd, t + (q + 1) * dd])
            t += d
    return ws, ph

try:
    if lang.startswith('en'): words, phones = forced(); how = 'pocketsphinx forced alignment (word + phoneme)'
    else: raise RuntimeError('non-English script')
except Exception as e:
    words, phones = energy(); how = f'energy alignment (lines) — {e}'
for i, (sp, tx) in enumerate(L):
    ws = [w for w in words if w[3] == i]
    lines.append(dict(i=i, sp=sp, t0=ws[0][1] if ws else 0, t1=ws[-1][2] if ws else 0, text=tx))
json.dump(dict(words=words, lines=lines, phones=phones, dur=dur), open('work/timing.json', 'w'), indent=0, ensure_ascii=False)

# ---------- lips: openness from energy, shape from phonemes, speaker from line spans ----------
sp = [''] * N
for l in lines:
    for f in range(max(0, int(l['t0'] * FPS) - 1), min(N, int(l['t1'] * FPS) + 2)): sp[f] = l['sp']
talk = np.array([s != '' for s in sp]); ref = np.percentile(rms[talk], 92) if talk.any() else rms.max()
op = np.clip((rms / ref - .08) / .92, 0, 1) * talk; op = np.convolve(op, [.25, .5, .25], 'same')
vis = ['X'] * N
for p, a, b in phones:
    k = VIS.get(p, 'X') if p not in ('SIL', 'NSN') else 'X'
    for f in range(int(a * FPS), min(N, max(int(a * FPS) + 1, int(b * FPS)))): vis[f] = k
for f in range(N):
    if not talk[f]: vis[f] = 'X'; op[f] = 0
    elif vis[f] == 'A': op[f] = 0.02        # lips pressed on M/B/P
    elif vis[f] == 'X' and op[f] > .15: vis[f] = 'C'
# hold every shape at least 2 frames (animating on twos reads cleaner)
for f in range(1, N - 1):
    if vis[f] != vis[f - 1] and vis[f] != vis[f + 1]: vis[f] = vis[f - 1]
json.dump(dict(N=N, fps=FPS, open=[round(float(x), 3) for x in op], sp=sp, vis=''.join(vis)), open('work/lips.json', 'w'))

rep = [f'source: {src} · {dur:.2f}s · {N} frames @{FPS} · {how}', '']
prev = 0
for l in lines:
    gap = l['t0'] - prev; prev = l['t1']
    rep.append(f"{l['i']:3d} {l['sp']} {l['t0']:7.2f}-{l['t1']:7.2f}  (gap {gap:4.2f})  {l['text'][:70]}")
    if l['t1'] - l['t0'] < .25: rep.append('    ⚠ very short — check the script matches the audio')
open('work/ingest_report.txt', 'w').write('\n'.join(rep) + '\n'); print('\n'.join(rep[:3] + rep[-4:]))
print(f'lips: {N} frames · shapes used: {"".join(sorted(set(vis)))}')
