#!/usr/bin/env python3
"""import_licensed.py — rebuild the PRIVATE part of the sound library from archives kept on Gabriel's Mac (~/Downloads):
  buzztorm-cartoon-ogg.tar                       The Designer's Choice CARTOON (364 files) → packs/designers-choice + 16 slots
  buzztorm-gdc/buzztorm-gdc-picks.tar            Sonniss GDC 2026 + 2020 picks (100 files: walla, ambiences, reactions, foley) → packs/sonniss-gdc + slots
Usage: python3 import_licensed.py <tar> [<tar> ...]   (stage the tars from the Mac first)
Both licences allow commercial use with no credit but forbid redistributing the files, so they land in git-ignored folders
(files-licensed/, packs/designers-choice/, packs/sonniss-gdc/). sfx.py always prefers a licensed file and falls back to the public one."""
import json, os, re, shutil, subprocess, sys, tarfile, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); PACKS = os.path.join(HERE, 'packs')
def add(i, f, src, dur=None):
    subprocess.run([sys.executable, os.path.join(HERE, 'sfx.py'), 'add', i, f, '--source', src] + (['--dur', str(dur)] if dur else []), check=True, stdin=subprocess.DEVNULL, cwd=HERE, capture_output=True)
def dur_of(p): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout or 0)
def index_pack(name, root, tagfn):
    ip = os.path.join(PACKS, 'index.json'); d = json.load(open(ip)); d['files'] = [x for x in d['files'] if x['pack'] != name]
    for r, _, fs in os.walk(root):
        for f in sorted(fs):
            if f.endswith('.ogg'):
                p = os.path.join(r, f); d['files'].append(dict(file=os.path.relpath(p, PACKS), pack=name, duration=round(dur_of(p), 2), license='royalty-free, private', source=name, **tagfn(p)))
    d['count'] = len(d['files']); json.dump(d, open(ip, 'w'), indent=0)

DC_SLOTS = [("boing", "boing/sproing-classic", 1.4), ("slide-whistle-down", "whistle/slide-down-01", None), ("slide-whistle-up", "whistle/slide-up-01", None),
            ("record-scratch", "zip/record-scratch-quick-comedic", None), ("bonk", "impact/hit-on-the-noggin-the-designer-s-choice-funfx", None),
            ("spring", "boing/spring", 1.2), ("honk", "horn/bicycle-bulb-honking", 0.7), ("squeak", "squeak/little-squerk-anime", None),
            ("gulp", "vocal/gulp-comedic-01", None), ("whoosh-fast", "zip/whizz-out", None), ("zoom-in", "zip/whizz-in", None),
            ("whoosh-long", "swish/windy-swooshes-01", 1.8), ("crickets", "animal/cricket-chirp-quiet-night-awkward-silence", 3.0),
            ("pop", "pop/comical", None), ("sparkle", "musical/xylophone-teakwood-thai-eye-blink", None), ("raspberry", "vocal/raspberry-buzzing", 1.2),
            ("kazoo-wobble", "warble/kazoo-wobble-slow", 1.5), ("slip", "impact/slip-and-fall-01", None), ("egg-splat", "splat/egg-drop-splat", None),
            ("rubber-chicken", "squeak/rubber-chicken-squeaks", 1.0), ("cork-pop", "pop/cork-big-squeak-pop", None), ("ricochet-out", "zip/ricco-out-01", None)]
DC_NEW = {'raspberry': ('comedy_reaction', 'Raspberry', 'Mockery, "pfft", bad idea'), 'kazoo-wobble': ('comedy_reaction', 'Kazoo wobble', 'Wobbly, unsure, silly'),
          'slip': ('comedy_reaction', 'Slip and fall', 'Banana-peel moment'), 'egg-splat': ('impacts', 'Egg splat', 'Mess, failure lands'),
          'rubber-chicken': ('comedy_reaction', 'Rubber chicken', 'Absurd, silly gag'), 'cork-pop': ('text_ui', 'Cork pop', 'Celebration, opening'),
          'ricochet-out': ('transitions', 'Cartoon zip out', 'Exit fast, run away')}

def ensure_catalog(entries):
    p = os.path.join(HERE, 'catalog.json'); c = json.load(open(p)); ids = {e['id'] for v in c['categories'].values() for e in v['effects']}
    for i, (cat, name, use, loop) in entries.items():
        if i in ids: continue
        c['categories'].setdefault(cat, {'what': cat, 'effects': []})['effects'].append({'id': i, 'name': name, 'use': use, 'duration': 2, 'synth': None, 'prompt': name, 'search': name.lower(), **({'loop': True} if loop else {})})
    c['count'] = sum(len(v['effects']) for v in c['categories'].values()); json.dump(c, open(p, 'w'), indent=1)

for tar in sys.argv[1:]:
    tmp = tempfile.mkdtemp(); tarfile.open(tar).extractall(tmp, filter='data')
    if os.path.isdir(os.path.join(tmp, 'buzztorm-cartoon-ogg')):
        dst = os.path.join(PACKS, 'designers-choice'); shutil.rmtree(dst, ignore_errors=True); shutil.copytree(os.path.join(tmp, 'buzztorm-cartoon-ogg'), dst)
        ensure_catalog({k: (v[0], v[1], v[2], False) for k, v in DC_NEW.items()})
        for i, f, d in DC_SLOTS: add(i, f'designers-choice/{f}.ogg', 'designers-choice', d)
        for i, f, d in [('alarm', 'misc/alarm-clock-ring-slowly-rattling-weak-fire-alarm', 3), ('tape-stop', 'warble/vinyl-record-warble', 2), ('reverse-whoosh', 'zip/ricco-reverse-01', None),
                        ('projector', 'misc/camera-movie-hand-crank-start-run-stop-comical', 6)]: add(i, f'designers-choice/{f}.ogg', 'designers-choice', d)
        index_pack('designers-choice', dst, lambda p: {'category': 'cartoon', 'tags': ['cartoon', os.path.basename(os.path.dirname(p))] + [t for t in re.split(r'-|\d+', os.path.basename(p)[:-4]) if t]})
        print('designers-choice:', len(DC_SLOTS), 'slots')
    if os.path.isdir(os.path.join(tmp, 'sel')):
        picks = json.load(open(os.path.join(tmp, 'picks.json'))); dst = os.path.join(PACKS, 'sonniss-gdc'); shutil.rmtree(dst, ignore_errors=True); shutil.copytree(os.path.join(tmp, 'sel'), dst)
        ensure_catalog({i: (cat, name, use, kind == 'loop') for i, cat, name, use, sub, st, du, kind in picks})
        n = 0
        for i, cat, name, use, sub, st, du, kind in picks:
            f = os.path.join(dst, f'{i}.ogg')
            if os.path.exists(f): add(i, f, 'sonniss-gdc'); n += 1
        for i, f in [('gasp', 'extra-surprised-gasp'), ('walla-applause', 'applause'), ('amb-crowd', 'amb-mall'), ('amb-classroom', 'room-tone'), ('amb-gym', 'walla-gym')]:
            add(i, os.path.join(dst, f + '.ogg'), 'sonniss-gdc'); n += 1
        lv = os.path.join(tempfile.mkdtemp(), 'living.wav')   # living room = room tone + a quiet antique clock
        subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', os.path.join(dst, 'room-tone.ogg'), '-i', os.path.join(dst, 'clock-tick.ogg'), '-filter_complex',
                        '[1]aloop=loop=-1:size=2e9,volume=0.35[c];[0][c]amix=inputs=2:duration=first:normalize=0', '-ar', '48000', lv], check=True); add('amb-living-room', lv, 'sonniss-gdc'); n += 1
        meta = {p[0]: p for p in picks}
        index_pack('sonniss-gdc', dst, lambda p: {'category': meta.get(os.path.basename(p)[:-4], [0, 'misc'])[1], 'tags': [os.path.basename(p)[:-4]] + meta.get(os.path.basename(p)[:-4], [0, 0, '', ''])[3].lower().split(', ')})
        print('sonniss-gdc:', n, 'slots')
