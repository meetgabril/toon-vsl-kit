#!/usr/bin/env python3
"""Rebuild the Designer's Choice CARTOON part of the sound library from the converted archive.
Usage: python3 import_designers_choice.py <buzztorm-cartoon-ogg.tar or folder>
The archive lives on Gabriel's Mac: ~/Downloads/buzztorm-cartoon-ogg.tar (364 OGG files, 48 kHz).
License: commercial use incl. ads, credit optional, NO redistribution of the raw files:
only commit packs/designers-choice/ and the files it fills while the repo is PRIVATE (remove the .gitignore lines then)."""
import json, os, re, shutil, subprocess, sys, tarfile, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); DST = os.path.join(HERE, 'packs', 'designers-choice')
src = sys.argv[1] if len(sys.argv) > 1 else sys.exit(__doc__)
if src.endswith('.tar'):
    tmp = tempfile.mkdtemp(); tarfile.open(src).extractall(tmp, filter='data'); src = os.path.join(tmp, 'buzztorm-cartoon-ogg')
shutil.rmtree(DST, ignore_errors=True); shutil.copytree(src, DST)
SLOTS = [("boing", "boing/sproing-classic", 1.4), ("slide-whistle-down", "whistle/slide-down-01", None), ("slide-whistle-up", "whistle/slide-up-01", None),
         ("record-scratch", "zip/record-scratch-quick-comedic", None), ("bonk", "impact/hit-on-the-noggin-the-designer-s-choice-funfx", None),
         ("spring", "boing/spring", 1.2), ("honk", "horn/bicycle-bulb-honking", 0.7), ("squeak", "squeak/little-squerk-anime", None),
         ("gulp", "vocal/gulp-comedic-01", None), ("whoosh-fast", "zip/whizz-out", None), ("swish", "zip/up", None), ("zoom-in", "zip/whizz-in", None),
         ("whoosh-long", "swish/windy-swooshes-01", 1.8), ("crickets", "animal/cricket-chirp-quiet-night-awkward-silence", 3.0),
         ("pop", "pop/comical", None), ("sparkle", "musical/xylophone-teakwood-thai-eye-blink", None)]
for i, f, d in SLOTS:
    subprocess.run([sys.executable, os.path.join(HERE, 'sfx.py'), 'add', i, f'designers-choice/{f}.ogg', '--source', 'designers-choice'] + (['--dur', str(d)] if d else []),
                   check=True, stdin=subprocess.DEVNULL, cwd=HERE)
CM = {'boing': 'comedy_reaction', 'squeak': 'comedy_reaction', 'whistle': 'comedy_reaction', 'horn': 'comedy_reaction', 'splat': 'comedy_reaction', 'warble': 'comedy_reaction',
      'vocal': 'comedy_reaction', 'animal': 'comedy_reaction', 'twang': 'comedy_reaction', 'impact': 'impacts', 'swish': 'transitions', 'zip': 'transitions', 'pop': 'text_ui',
      'pluck': 'text_ui', 'musical': 'magic_reveal', 'shake': 'office_creator', 'machine': 'office_creator'}
ip = os.path.join(HERE, 'packs', 'index.json'); d = json.load(open(ip)); d['files'] = [x for x in d['files'] if x['pack'] != 'designers-choice']
for root, _, fs in os.walk(DST):
    for f in sorted(fs):
        if not f.endswith('.ogg'): continue
        p = os.path.join(root, f); c = os.path.basename(root); rel = os.path.relpath(p, os.path.join(HERE, 'packs'))
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout or 0)
        tags = [t for t in re.split(r'-|\d+', f[:-4].replace('the-designer-s-choice', '')) if t and t not in ('funfx', 'gnrl', 's')]
        d['files'].append({'file': rel, 'pack': 'designers-choice', 'category': CM.get(c, 'misc'), 'tags': ['cartoon', c] + tags, 'duration': round(dur, 2),
                           'license': 'royalty-free, no redistribution', 'source': 'designers-choice'})
d['count'] = len(d['files']); json.dump(d, open(ip, 'w'), indent=0); print('designers-choice:', len(SLOTS), 'slots,', d['count'], 'files in index')
