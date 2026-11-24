#!/usr/bin/env python3
"""sfx.py — Buzztorm Studio sound effects.
  list [category]                      show the catalog
  find <words>                         search by id/name/use
  get <id> [--dur S]                   put sfx/<id>.wav in the current project (library file → AI → synth)
  add <id> <file> --source <source-id> [--dur S] register a downloaded file in the shared library
  sources                              approved / not approved sources
  browse <words>                       search every raw file in the packs (packs/index.json)
  kit --brand <brand>                  put the brand's signature sounds in sfx/ (same sounds in every video)
  signature <brand>                    show the brand's signature sounds
  addall <folder> --source <id>        add every <id>.mp3/.wav in a folder whose name matches a catalog id
  session [category]                   ElevenLabs Sound Effects sheet for every slot still without a file (generate once, then add)
Files live in ~/buzztorm-studio/library/sfx/files/<id>.wav (+ files/credits.json). autoscore.py and kinetic.py use
sfx/<id>.wav from the project when it exists, else the built-in synth."""
import json, os, sys, subprocess, shutil, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = next((p for p in [os.path.expanduser('~/buzztorm-studio/library/sfx'), HERE] if os.path.exists(os.path.join(p, 'catalog.json'))), HERE)
CAT = json.load(open(os.path.join(LIB, 'catalog.json'))); SRC = json.load(open(os.path.join(LIB, 'sources.json')))['sources']
FILES = os.path.join(LIB, 'files'); CRED = os.path.join(FILES, 'credits.json'); PACKS = os.path.join(LIB, 'packs')
BRANDS = os.path.join(LIB, '..', '..', 'brands')
ALL = {e['id']: dict(e, category=c) for c, v in CAT['categories'].items() for e in v['effects']}

def to_wav(src, dst, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', src, '-ar', '48000', '-ac', '2'] + (['-t', str(dur)] if dur else []) + [dst]
    subprocess.run(cmd, check=True)

def credits():
    return json.load(open(CRED)) if os.path.exists(CRED) else {}

def gen_ai(e, dst, dur):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key: return False
    body = {'text': e['prompt'], 'model_id': 'eleven_text_to_sound_v3', 'prompt_influence': 0.5,
            'duration_seconds': max(0.5, min(30, dur or e['duration'])), 'loop': bool(e.get('loop'))}
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation', json.dumps(body).encode(),
                                 {'xi-api-key': key, 'Content-Type': 'application/json'})
    tmp = dst + '.mp3'
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, 'wb') as f: f.write(r.read())
    to_wav(tmp, dst); os.replace(tmp, dst + '.src.mp3'); return True

def gen_synth(e, dst):
    if not e.get('synth'): return False
    au = os.path.join(LIB, '..', 'audio')
    code = ("import os;os.environ['DUR']='5';import numpy as np,soundfile as sf\n"
            f"exec(open(r'{au}/instruments.py').read())\n"
            f"s=open(r'{au}/autoscore.py').read().split('# ---------------- SFX ----------------')[1].split('cues = []')[0]\n"
            "exec(s)\n"
            f"k='{e['synth']}'\n"
            "x=M_[k]() if k in M_ else globals()[k]()\n"
            "x=x/(np.abs(x).max()+1e-9)*.8\n"
            f"sf.write(r'{dst}', np.stack([x,x],1).astype(np.float32), 48000)")
    r = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True)
    if r.returncode: print(r.stderr[-400:], file=sys.stderr)
    return r.returncode == 0 and os.path.exists(dst)

def get(i, dur=None):
    e = ALL.get(i) or sys.exit(f'unknown effect {i!r}; try: sfx.py find {i}')
    os.makedirs('sfx', exist_ok=True); dst = os.path.join('sfx', f'{i}.wav')
    lib = os.path.join(FILES, f'{i}.wav')
    if os.path.exists(lib):
        shutil.copy(lib, dst); c = credits().get(i, {}); how = 'library (' + c.get('source', '?') + ')'
    elif gen_ai(e, dst, dur): how = 'AI generated (ElevenLabs)'
    elif gen_synth(e, dst): how = 'built-in synth'
    else:
        sys.exit(json.dumps({'missing': i, 'search': e['search'], 'where': [s['url'] for s in SRC if s['status'] == 'ok' and s['url']][:4],
                             'then': f'python3 sfx.py add {i} <file> --source pixabay'}, indent=1))
    if e.get('synth') and e['synth'] != i: shutil.copy(dst, os.path.join('sfx', e['synth'] + '.wav'))   # engine event name (autoscore)
    lic = credits().get(i, {})
    if lic.get('status') == 'credit': print(f"CREDIT REQUIRED in caption: {lic.get('credit')}", file=sys.stderr)
    print(json.dumps({'id': i, 'file': dst, 'how': how}))

def sig(brand):
    p = os.path.join(BRANDS, brand, 'sound-signature.json')
    return json.load(open(p)) if os.path.exists(p) else sys.exit(f'no sound-signature.json for {brand!r}')

def kit(brand):
    s = sig(brand); os.makedirs('sfx', exist_ok=True); out = []
    for ev, r in s['events'].items():
        own = r.get('file') and os.path.join(BRANDS, brand, r['file'])
        lib = os.path.join(FILES, f"{r['id']}.wav")
        src = own if own and os.path.exists(own) else (lib if os.path.exists(lib) else None)
        if src: to_wav(src, os.path.join('sfx', f'{ev}.wav')); out.append((ev, r['id'], 'brand' if src == own else 'library'))
        else: out.append((ev, r['id'], 'synth'))
        for n, alt in enumerate(r.get('alts', []), 2):   # round-robin takes for the 'sound boil'
            a = os.path.join(PACKS, alt)
            if os.path.exists(a): to_wav(a, os.path.join('sfx', f'{ev}~{n}.wav'))
    for i, r in s.get('signature', {}).items():
        own = os.path.join(BRANDS, brand, r['file']) if r.get('file') else None
        if own and os.path.exists(own): to_wav(own, os.path.join('sfx', f'{i}.wav')); out.append((i, i, 'brand ' + r.get('status', '')))
    for ev, i, how in out: print(f'  {ev:<14} {i:<18} {how}')

def add(i, f, source, dur=None):
    if not os.path.exists(f) and os.path.exists(os.path.join(PACKS, f)): f = os.path.join(PACKS, f)
    if i not in ALL: sys.exit(f'unknown effect {i!r} (add it to catalog.json first)')
    s = next((s for s in SRC if s['id'] == source), None) or sys.exit('unknown source; see: sfx.py sources')
    if s['status'] == 'no': sys.exit(f"REFUSED: {s['name']} — {s['notes']}")
    os.makedirs(FILES, exist_ok=True); dst = os.path.join(FILES, f'{i}.wav')
    if dur: subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', f, '-t', str(dur), '-af', f'afade=t=out:st={max(0, dur - .15):.2f}:d=0.15', '-ar', '48000', '-ac', '2', dst], check=True)
    else: to_wav(f, dst)
    c = credits(); c[i] = {'source': source, 'status': s['status'], 'original': os.path.relpath(f, PACKS) if f.startswith(PACKS) else os.path.basename(f),
                           'credit': 'Sound effects from zapsplat.com' if source == 'zapsplat-free' else None}
    json.dump(c, open(CRED, 'w'), indent=1); print(json.dumps({'added': i, 'status': s['status']}))

a = sys.argv[1:]
if not a or a[0] == 'list':
    for c, v in CAT['categories'].items():
        if len(a) > 1 and a[1] != c: continue
        print(f"\n{c.upper()} — {v['what']}")
        for e in v['effects']:
            have = 'file' if os.path.exists(os.path.join(FILES, e['id'] + '.wav')) else ('synth' if e['synth'] else 'ai')
            print(f"  {e['id']:<20} {e['name']:<32} [{have}] {e['use']}")
elif a[0] == 'find':
    q = ' '.join(a[1:]).lower()
    for e in ALL.values():
        if q in (e['id'] + ' ' + e['name'] + ' ' + e['use']).lower(): print(f"{e['id']:<20} {e['name']:<32} {e['use']}")
elif a[0] == 'get': get(a[1], float(a[a.index('--dur') + 1]) if '--dur' in a else None)
elif a[0] == 'add': add(a[1], a[2], a[a.index('--source') + 1] if '--source' in a else sys.exit('--source required'), float(a[a.index('--dur') + 1]) if '--dur' in a else None)
elif a[0] == 'sources':
    for s in SRC: print(f"{s['status']:<8} {s['name']:<45} {s['notes']}")
elif a[0] == 'browse':
    q = [w.lower() for w in a[1:]]; idx = json.load(open(os.path.join(PACKS, 'index.json')))['files']
    for e in idx:
        h = (e['file'] + ' ' + ' '.join(e['tags']) + ' ' + e['category']).lower()
        if all(w in h for w in q): print(f"{e['file']:<55} {e['duration']:>5}s  {e['license']}")
elif a[0] == 'addall':
    src = a[a.index('--source') + 1] if '--source' in a else sys.exit('--source required')
    for f in sorted(os.listdir(a[1])):
        i = os.path.splitext(f)[0].lower()
        if i in ALL: add(i, os.path.join(a[1], f), src)
        else: print(f'skip {f} (no catalog id {i!r})')
elif a[0] == 'session':
    n = 0
    for c, v in CAT['categories'].items():
        if len(a) > 1 and a[1] != c: continue
        miss = [e for e in v['effects'] if not os.path.exists(os.path.join(FILES, e['id'] + '.wav'))]
        if not miss: continue
        print(f"\n## {c} — {v['what']}")
        for e in miss: n += 1; print(f"{e['id']} | {e['duration']}s{' | loop' if e.get('loop') else ''} | {e['prompt']}")
    print(f"\n{n} sounds. Generate each in ElevenLabs Sound Effects (duration as shown), name the file <id>.mp3, upload them all; then: sfx.py add <id> <file> --source elevenlabs")
elif a[0] == 'kit': kit(a[a.index('--brand') + 1] if '--brand' in a else os.environ.get('BRAND') or sys.exit('--brand required'))
elif a[0] == 'signature':
    s = sig(a[1]); print(s.get('_about', ''))
    for ev, r in s['events'].items(): print(f"  {ev:<14} → {r['id']:<18} {r.get('why', '')}")
    for i, r in s.get('signature', {}).items(): print(f"  {i:<14} → {r.get('file') or '(not made yet)':<30} {r.get('status', '')}")
else: print(__doc__)
