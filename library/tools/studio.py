#!/usr/bin/env python3
"""studio.py — Buzztorm Studio internal CLI (the user never sees it; the /studio skill runs it).

  studio.py new <brand> <title> <recipe> [--goal grow|teach|sell|community] [--offer ID]
  studio.py status <brand>/<title> [--set STATUS] [--note TEXT]      # state machine + version bump
  studio.py check <project_dir> [--stage script|final]               # QUALITY GATE
  studio.py package <project_dir>                                    # file names + manifest
  studio.py list <brand>                                             # projects and statuses
  studio.py plan <brand> <YYYY-Www>                                  # weekly calendar skeleton

Environment: STUDIO = repository root (default ~/buzztorm-studio), PROJECTS = working root (default ~/studio).
"""
import glob, json, os, re, subprocess, sys, datetime

STUDIO = os.path.expanduser(os.environ.get('STUDIO', '~/buzztorm-studio'))
PROJECTS = os.path.expanduser(os.environ.get('PROJECTS', '~/studio'))
STATUSES = ['Brief', 'Script review', 'Waiting for voiceover', 'Storyboard review', 'Rendering', 'Ready for approval', 'Approved', 'Published', 'Archived']
NEXT = {'Brief': ['Script review'], 'Script review': ['Waiting for voiceover', 'Storyboard review', 'Rendering', 'Brief'],
        'Waiting for voiceover': ['Storyboard review'], 'Storyboard review': ['Rendering', 'Script review'],
        'Rendering': ['Ready for approval'], 'Ready for approval': ['Approved', 'Script review', 'Storyboard review', 'Rendering'],
        'Approved': ['Published', 'Ready for approval'], 'Published': ['Archived'], 'Archived': []}
SIZES = {(1080, 1920): '9x16', (1400, 1750): '4x5', (1080, 1350): '4x5', (1080, 1080): '1x1', (1920, 1080): '16x9'}
FINAL_W = {'9x16': 1080, '4x5': 1080, '1x1': 1080, '16x9': 1920}
IGNORE_ITEMS = ('set', 'actor', 'stars', 'confetti', 'poof', 'flash', 'money', 'crowd', 'walkers', 'ba', 'prop', 'handle')
LIMIT_HASHTAGS = {'instagram': 5, 'tiktok': 5, 'youtube shorts': 3, 'shorts': 3, 'youtube': 3, 'linkedin': 3, 'story': 0, 'discord': 0, 'ad': 0, 'sales page': 0}

# Claims patterns: (regex, label). Money-making claims are the #1 reason infoproduct ads are rejected.
CLAIMS = [
    (r'\bguarantee[sd]?\b|\bguaranteed\b', 'guarantee'),
    (r'\bget rich\b|\brich quick\b|\bovernight (success|results|money)\b', 'get rich quick'),
    (r'\bpassive income\b|\bfinancial freedom\b|\bquit your (job|9.?to.?5)\b|\bfire your boss\b', 'lifestyle / income promise'),
    (r'\b(little|no) (work|effort)\b|\bon autopilot\b|\bwhile you sleep\b', 'little or no work'),
    (r'(\$|usd|€|£)\s?\d[\d,.]*\s?(k|m)?\b.{0,40}\b(per|a|/)\s?(day|week|month|mo|year|yr)\b', 'earnings amount per period'),
    (r'\b(make|made|earn|earned|making|earning|generate[sd]?)\b.{0,30}(\$|usd|€|£)\s?\d', 'earnings amount'),
    (r'\b(six|seven|eight)[- ]figures?\b|\bmillionaire\b', 'figures claim'),
    (r'\bin (just )?\d+ (days|weeks)\b.{0,40}\b(results?|clients|sales|income|money)\b', 'result in a specific timeframe'),
    (r'\brisk[- ]free\b|\b100% (results|success)\b', 'absolute claim'),
]
YEAR_WORDS = r'\b(fifteen|sixteen|seventeen|eighteen|nineteen)[ -](hundred|oh|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b|\b1[5-9]\d\d\b'


def load(p, d=None):
    try: return json.load(open(p))
    except Exception: return d


def rec_dir(brand, title): return os.path.join(STUDIO, 'brands', brand, 'projects', title)


def find_record(pdir):
    pdir = os.path.abspath(os.path.expanduser(pdir)); title = os.path.basename(pdir); brand = os.path.basename(os.path.dirname(pdir))
    rd = rec_dir(brand, title); return brand, title, rd, load(os.path.join(rd, 'project.json'), {})


def cmd_new(a):
    brand, title, recipe = a[0], a[1], a[2]; opts = dict(zip(a[3::2], a[4::2]))
    R = load(os.path.join(STUDIO, 'library', 'recipes', recipe + '.json'))
    if not R: sys.exit(f'unknown recipe {recipe}; see library/recipes/index.json')
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', title): sys.exit('title must be lowercase-with-hyphens')
    pdir = os.path.join(PROJECTS, brand, title)
    subprocess.run(['bash', os.path.join(STUDIO, 'library', 'tools', 'setup.sh'), pdir, brand], check=True, stdout=subprocess.DEVNULL)
    rd = rec_dir(brand, title); os.makedirs(rd, exist_ok=True); today = datetime.date.today().isoformat()
    P = {'title': title, 'brand': brand, 'recipe': recipe, 'family': R['family'], 'goal': opts.get('--goal', (R.get('goals') or ['grow'])[0]),
         'offer': opts.get('--offer'), 'status': 'Brief', 'version': 1, 'created': today, 'updated': today, 'parent': opts.get('--parent'), 'history': []}
    json.dump(P, open(os.path.join(rd, 'project.json'), 'w'), indent=2)
    print(json.dumps({'project_dir': pdir, 'record': rd, 'recipe': recipe, 'status': 'Brief'}))


def cmd_status(a):
    brand, title = a[0].split('/'); opts = dict(zip(a[1::2], a[2::2])); rd = rec_dir(brand, title); P = load(os.path.join(rd, 'project.json'))
    if not P: sys.exit('no project record')
    if '--set' in opts:
        new = opts['--set']
        if new not in STATUSES: sys.exit(f'unknown status; use one of {STATUSES}')
        if new not in NEXT[P['status']]: sys.exit(f'cannot go from "{P["status"]}" to "{new}"; allowed: {NEXT[P["status"]]}')
        back = STATUSES.index(new) < STATUSES.index(P['status']) and new not in ('Archived',)
        if back: P['version'] += 1   # a request for changes always bumps the version
        P['history'].append({'date': datetime.date.today().isoformat(), 'from': P['status'], 'to': new, 'version': P['version'], 'note': opts.get('--note', '')})
        P['status'] = new; P['updated'] = datetime.date.today().isoformat()
        json.dump(P, open(os.path.join(rd, 'project.json'), 'w'), indent=2)
    print(json.dumps({k: P[k] for k in ('title', 'recipe', 'status', 'version')}))


def cmd_list(a):
    for f in sorted(glob.glob(os.path.join(STUDIO, 'brands', a[0], 'projects', '*', 'project.json'))):
        P = load(f, {}); print(f"{P.get('updated', ''):10}  {P.get('status', ''):22} v{P.get('version', 1)}  {P.get('recipe', P.get('content', '')):20} {P.get('title', '')}")


# —————————————————— QUALITY GATE ——————————————————
class Report:
    def __init__(self): self.checks = {}
    def add(self, check, level, msg): self.checks.setdefault(check, []).append((level, msg))
    def ok(self, check): self.checks.setdefault(check, [])
    def failed(self): return any(l == 'ERROR' for v in self.checks.values() for l, _ in v)


def texts_of(pdir):
    out = []
    for name in ('script.md', 'story.js', 'post.md', 'message.md'):
        for p in glob.glob(os.path.join(pdir, '**', name), recursive=True):
            if 'node_modules' in p or '/ref/' in p: continue
            s = open(p, errors='ignore').read()
            if name == 'story.js': s = '\n'.join(re.findall(r'"([^"\n]{3,})"', s) + re.findall(r"'([^'\n]{6,})'", s))
            out.append((os.path.relpath(p, pdir), s))
    for p in glob.glob(os.path.join(pdir, 'doc', '*.md')): out.append((os.path.relpath(p, pdir), open(p, errors='ignore').read()))
    return out


def check_claims(R, pdir, P, brain, recipe):
    is_ad = recipe.get('family') == 'ads' or P.get('script_type') == 'ad' or P.get('goal') == 'sell'
    proof_ids = {i.get('id') for i in brain.get('proof', {}).get('items', [])}
    found = 0
    for src, s in texts_of(pdir):
        for i, line in enumerate(s.splitlines(), 1):
            low = line.lower()
            for rx, label in CLAIMS:
                if re.search(rx, low):
                    if '[proof:' in low and re.search(r'\[proof:([\w-]+)\]', low).group(1) in proof_ids: continue
                    money = 'earnings' in label or 'figures' in label
                    lvl = 'ERROR' if (is_ad or money or brain.get('claims', {}).get('risk_level') == 'high') else 'WARN'
                    R.add('claims', lvl, f'{src}:{i} {label}: "{line.strip()[:90]}"'); found += 1
    cl = brain.get('claims', {})
    if is_ad and cl.get('ad_disclaimer'):
        post = ''.join(s for src, s in texts_of(pdir) if src.endswith('post.md'))
        if post and cl['ad_disclaimer'].lower()[:20] not in post.lower(): R.add('claims', 'ERROR', f'ad copy is missing the brand disclaimer: "{cl["ad_disclaimer"]}"')
    if not found: R.ok('claims')


def check_facts(R, pdir, brain):
    ids = {f['id'] for f in brain.get('facts', {}).get('facts', [])}
    for p in glob.glob(os.path.join(pdir, '**', 'script.md'), recursive=True):
        s = open(p).read(); declared = re.findall(r'FACTS?:\s*([\w\-, ]+)', s)
        dec = {x.strip() for d in declared for x in d.split(',') if x.strip()}
        historic = re.search(YEAR_WORDS, s.lower()) or re.search(r'history', ' '.join(l for l in s.splitlines() if l.startswith('>')).lower())
        unknown = dec - ids
        if unknown: R.add('facts', 'ERROR', f'{os.path.relpath(p, pdir)}: facts not in facts.json: {sorted(unknown)} — verify and add them first')
        if historic and not dec: R.add('facts', 'ERROR', f'{os.path.relpath(p, pdir)}: the script states a historical fact; add "> FACTS: <id>" with an id from facts.json')
    R.ok('facts')


def check_copy(R, pdir, brain, recipe):
    voice = brain.get('voice', '')
    avoid = []
    m = re.search(r'Avoid:([^\n]+)', voice)
    if m: avoid = [w.strip().strip('"“”') for w in m.group(1).split(',') if w.strip()]
    for src, s in texts_of(pdir):
        for w in avoid:
            w2 = w.strip('. ').lower()
            if w2 and re.search(r'\b' + re.escape(w2) + r'\b', s.lower()): R.add('copy', 'WARN', f'{src}: word the brand avoids: "{w2}"')
        if not src.endswith(('post.md', 'message.md')): continue
        sections = re.split(r'^## +', s, flags=re.M)
        for sec in sections[1:]:
            head, _, body = sec.partition('\n'); key = head.strip().lower()
            tags = re.findall(r'(?<![\w#])#[A-Za-z][\w]*', body)
            lim = next((v for k, v in LIMIT_HASHTAGS.items() if key.startswith(k)), None)
            if lim is not None and len(tags) > lim: R.add('copy', 'ERROR', f'{src} [{head.strip()}]: {len(tags)} hashtags, limit {lim}')
            if key.startswith('instagram'):
                first = next((l for l in body.splitlines() if l.strip()), '')
                if len(first) > 125: R.add('copy', 'WARN', f'{src} [Instagram]: first line is {len(first)} characters (shows before "more" only up to ~125)')
    R.ok('copy')


def check_cta(R, pdir, brain, recipe):
    needs = any(p['id'] in ('cta', 'cta_slide', 'cta_page', 'end_card') for p in recipe.get('parts', []))
    if not needs: return R.ok('cta')
    lib = brain.get('cta', {}).get('by_goal', {})
    keys = set()
    for items in lib.values():
        for c in items:
            if c.get('keyword'): keys.add(c['keyword'].lower())
            keys.add(' '.join(c.get('text', '').lower().split()[:4]))
    offers = brain.get('offers', {}).get('offers', [])
    keys |= {o['name'].lower() for o in offers}
    blob = ' '.join(s.lower() for _, s in texts_of(pdir))
    if not any(k and k in blob for k in keys) and not re.search(r"\bcta\s+\"", blob):
        R.add('cta', 'ERROR', 'no call to action from the brand CTA library (cta.json) or offers (offers.json)')
    else: R.ok('cta')


def check_layout(R, pdir, recipe):
    files = [f for f in glob.glob(os.path.join(pdir, '**', '*.qa.json'), recursive=True) if 'node_modules' not in f]
    if not files:
        if recipe.get('render') in ('video', 'stills', 'meme', 'video+stills', 'video+pdf+stills'): R.add('layout', 'WARN', 'no layout capture found: render the stills or contact sheet with QA=1 (memes: meme.py writes it)')
        return R.ok('layout')
    sizes = {s['id']: s for s in recipe.get('sizes', [])}; minb = recipe.get('text', {}).get('min_px', {}).get('body', 40)
    seen = set()
    for f in sorted(files):
        Q = load(f, {}); cw, ch = Q.get('canvas', [1080, 1920]); sid = SIZES.get((int(cw), int(ch)), '9x16'); k = FINAL_W.get(sid, 1080) / cw
        safe = sizes.get(sid, {}).get('safe', {'top': 0, 'bottom': 0, 'left': 0, 'right': 0}); fw, fh = cw * k, ch * k
        T = [dict(t, x=t['x'] * k, y=t['y'] * k, w=t['w'] * k, h=t['h'] * k, px=t['px'] * k) for t in Q.get('texts', [])]
        name = os.path.relpath(f, pdir).replace('.qa.json', '')
        item = [t for t in T if not t['item'].startswith(IGNORE_ITEMS)]
        for t in item:
            key = (t['item'], t['t'])
            if t['px'] < minb - 0.5 and (name, key) not in seen: R.add('layout', 'ERROR', f'{name}: text too small ({t["px"]:.0f}px < {minb}px): "{t["t"][:40]}"')
            if t['x'] < safe.get('left', 0) - 2 or t['y'] < safe.get('top', 0) - 2 or t['x'] + t['w'] > fw - safe.get('right', 0) + 2 or t['y'] + t['h'] > fh - safe.get('bottom', 0) + 2:
                R.add('layout', 'ERROR', f'{name}: outside the {sid} safe zone: "{t["t"][:40]}"')
            seen.add((name, key))
        for i, a in enumerate(T):
            for b in T[i + 1:]:
                if a['item'] == b['item'] or (a['item'].startswith(IGNORE_ITEMS) and b['item'].startswith(IGNORE_ITEMS)): continue
                if a['item'] == 'actor' or b['item'] == 'actor': continue
                ix = max(0, min(a['x'] + a['w'], b['x'] + b['w']) - max(a['x'], b['x'])); iy = max(0, min(a['y'] + a['h'], b['y'] + b['h']) - max(a['y'], b['y']))
                if ix * iy > 0.12 * min(a['w'] * a['h'], b['w'] * b['h']) and ix * iy > 0:
                    R.add('layout', 'ERROR', f'{name}: text overlaps text: "{a["t"][:30]}" ({a["item"].split(":")[0]}) × "{b["t"][:30]}" ({b["item"].split(":")[0]})')
    R.ok('layout')


def check_files(R, pdir, brand, title, P, recipe):
    d = os.path.join(pdir, 'delivery')
    if not os.path.isdir(d) or not os.listdir(d): R.add('files', 'ERROR', 'delivery/ is empty'); return
    rx = re.compile(rf'^{re.escape(brand)}_[a-z0-9-]+_{re.escape(title)}_v\d+(_(9x16|4x5|1x1|16x9|letter))?(_\d\d)?\.(mp4|png|jpg|gif|apng|pdf|mp3|pptx|docx)$')
    for f in os.listdir(d):
        if f.endswith(('.md', '.qa.json')): continue
        if not rx.match(f): R.add('files', 'ERROR', f'bad file name: {f} (expected {brand}_<content>_{title}_v<N>_<size>.<ext>)')
        if f.endswith(('.mp4', '.png', '.jpg', '.pdf', '.gif')) and os.path.getsize(os.path.join(d, f)) == 0: R.add('files', 'ERROR', f'empty file: {f}')
    if not glob.glob(os.path.join(d, '*.md')) and recipe.get('copy'): R.add('files', 'ERROR', 'post.md (text to post) missing in delivery/')
    L = recipe.get('length', {})
    if L.get('unit') == 'pages':
        for f in os.listdir(d):
            if f.endswith('.pdf'):
                out = subprocess.run(['pdfinfo', os.path.join(d, f)], capture_output=True, text=True).stdout; m = re.search(r'Pages:\s+(\d+)', out)
                if m and not (L.get('min', 1) <= int(m.group(1)) <= L.get('max', 999)): R.add('files', 'ERROR', f'{f}: {m.group(1)} pages; the recipe allows {L.get("min")}–{L.get("max")}')
    lim = recipe.get('limits', {})
    for f in os.listdir(d):
        p = os.path.join(d, f); kb = os.path.getsize(p) / 1024
        if 'sticker' in f and kb > lim.get('sticker', {}).get('max_kb', 1e9): R.add('files', 'ERROR', f'{f}: {kb:.0f} KB > sticker limit')
        if 'emoji' in f and kb > lim.get('emoji', {}).get('max_kb', 1e9): R.add('files', 'ERROR', f'{f}: {kb:.0f} KB > emoji limit')
    R.ok('files')


def brain_of(brand):
    b = os.path.join(STUDIO, 'brands', brand, 'brain'); out = {}
    for n in ('offers', 'cta', 'claims', 'facts', 'proof', 'audience', 'series', 'ideas'): out[n] = load(os.path.join(b, n + '.json'), {})
    v = os.path.join(b, 'voice.md'); out['voice'] = open(v).read() if os.path.exists(v) else ''
    return out


def cmd_check(a):
    pdir = os.path.abspath(os.path.expanduser(a[0])); stage = (dict(zip(a[1::2], a[2::2])).get('--stage') or 'final')
    brand, title, rd, P = find_record(pdir)
    recipe = load(os.path.join(STUDIO, 'library', 'recipes', (P.get('recipe') or P.get('content') or 'reel') + '.json'), {})
    brain = brain_of(brand); R = Report()
    check_claims(R, pdir, P, brain, recipe); check_facts(R, pdir, brain); check_copy(R, pdir, brain, recipe); check_cta(R, pdir, brain, recipe)
    if stage == 'final': check_layout(R, pdir, recipe); check_files(R, pdir, brand, title, P, recipe)
    names = list(R.checks); passed = sum(1 for n in names if not any(l == 'ERROR' for l, _ in R.checks[n]))
    print(f'QUALITY GATE ({stage}) — {brand}/{title} · {P.get("recipe", "?")}: {"PASSED" if not R.failed() else "FAILED"} ({passed}/{len(names)})')
    for n in names:
        errs = R.checks[n]; mark = 'OK ' if not any(l == 'ERROR' for l, _ in errs) else 'FAIL'
        print(f'  [{mark}] {n}' + ('' if not errs else ''))
        for l, m in errs[:25]: print(f'      {l}: {m}')
    os.makedirs(os.path.join(pdir, 'qa'), exist_ok=True)
    json.dump({'stage': stage, 'passed': not R.failed(), 'checks': R.checks}, open(os.path.join(pdir, 'qa', f'report_{stage}.json'), 'w'), indent=1)
    sys.exit(1 if R.failed() else 0)


def cmd_package(a):
    pdir = os.path.abspath(os.path.expanduser(a[0])); brand, title, rd, P = find_record(pdir); d = os.path.join(pdir, 'delivery')
    man = {'brand': brand, 'title': title, 'version': P.get('version'), 'files': sorted(f for f in os.listdir(d) if not f.endswith('.qa.json'))}
    json.dump(man, open(os.path.join(d, 'manifest.json'), 'w'), indent=1)
    for f in ('post.md', 'message.md', 'script.md', 'story.js'):
        for p in glob.glob(os.path.join(pdir, f)) + glob.glob(os.path.join(d, f)):
            subprocess.run(['cp', p, rd])
    print(json.dumps(man))


def cmd_plan(a):
    brand, week = a[0], a[1]; d = os.path.join(STUDIO, 'brands', brand, 'calendar'); os.makedirs(d, exist_ok=True)
    prof = load(os.path.join(STUDIO, 'brands', brand, 'brand-profile.json'), {}); mix = prof.get('weekly_mix', {'grow': 3, 'teach': 2, 'sell': 1, 'community': 1})
    ideas = [i for i in brain_of(brand)['ideas'].get('ideas', []) if i.get('status') == 'new']
    y, w = week.split('-W'); mon = datetime.date.fromisocalendar(int(y), int(w), 1); rows = []; slots = [g for g, n in mix.items() for _ in range(n)]
    for i, g in enumerate(slots):
        day = mon + datetime.timedelta(days=i % 7); idea = next((x for x in ideas if x.get('goal') == g), None)
        if idea: ideas.remove(idea)
        rows.append(f'| {day:%a %d %b} | {g} | {idea["idea"] if idea else "(pick an idea)"} | | Brief |')
    p = os.path.join(d, f'{week}.md')
    open(p, 'w').write(f'# {prof.get("name", brand)} — week {week}\n\nMix: ' + ', '.join(f'{n} {g}' for g, n in mix.items()) + '\n\n| Day | Goal | Idea | Content | Status |\n|---|---|---|---|---|\n' + '\n'.join(rows) + '\n')
    print(p)


if __name__ == '__main__':
    if len(sys.argv) < 3 and not (len(sys.argv) == 2 and sys.argv[1] in ('-h', '--help')): sys.exit(__doc__)
    {'new': cmd_new, 'status': cmd_status, 'check': cmd_check, 'package': cmd_package, 'list': cmd_list, 'plan': cmd_plan}.get(sys.argv[1], lambda a: sys.exit(__doc__))(sys.argv[2:])
