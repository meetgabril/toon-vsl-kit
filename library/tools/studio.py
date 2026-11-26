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
import glob, json, os, re, shutil, subprocess, sys, datetime

STUDIO = os.path.expanduser(os.environ.get('STUDIO', '~/buzztorm-studio'))
PROJECTS = os.path.expanduser(os.environ.get('PROJECTS', '~/studio'))
STATUSES = ['Brief', 'Script review', 'Waiting for voiceover', 'Storyboard review', 'Rendering', 'Ready for approval', 'Approved', 'Published', 'Archived']
NEXT = {'Brief': ['Script review'], 'Script review': ['Waiting for voiceover', 'Storyboard review', 'Rendering', 'Brief'],
        'Waiting for voiceover': ['Storyboard review'], 'Storyboard review': ['Rendering', 'Script review'],
        'Rendering': ['Ready for approval'], 'Ready for approval': ['Approved', 'Script review', 'Storyboard review', 'Rendering'],
        'Approved': ['Published', 'Ready for approval'], 'Published': ['Archived'], 'Archived': []}
SIZES = {(1080, 1920): '9x16', (540, 960): '9x16', (700, 875): '4x5', (960, 540): '16x9', (540, 540): '1x1', (1400, 1750): '4x5', (1080, 1350): '4x5', (1080, 1080): '1x1', (1920, 1080): '16x9'}
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


def cmd_zone(a):
    """studio.py zone <project_dir> <AR> — the recipe's zone for that size (make.sh uses it when ZONE is not given)."""
    pdir, ar = os.path.abspath(a[0]), a[1].rstrip('p'); P = find_record(pdir)[3]
    R = load(os.path.join(STUDIO, 'library', 'recipes', (P.get('recipe') or 'reel') + '.json'), {})
    F = load(os.path.join(STUDIO, 'library', 'engine', 'formats.json'), {})
    print(next((s.get('zone') for s in R.get('sizes', []) if s.get('ar') == ar and s.get('zone')), F.get('default_zone', {}).get(ar, 'feed')))


def forward_path(cur, new):
    """Shortest chain of forward statuses from cur to new (never backwards, never through Archived)."""
    from collections import deque
    q, seen = deque([(cur, [])]), {cur}
    while q:
        st, path = q.popleft()
        for nx in NEXT.get(st, []):
            if nx in seen or STATUSES.index(nx) < STATUSES.index(st) or nx == 'Archived': continue
            if nx == new: return path + [nx]
            seen.add(nx); q.append((nx, path + [nx]))
    return None


def cmd_status(a):
    brand, title = a[0].split('/'); opts = dict(zip(a[1::2], a[2::2])); rd = rec_dir(brand, title); P = load(os.path.join(rd, 'project.json'))
    if not P: sys.exit('no project record')
    if '--set' in opts:
        new = opts['--set']
        if new not in STATUSES: sys.exit(f'unknown status; use one of {STATUSES}')
        path = [new] if new in NEXT[P['status']] else forward_path(P['status'], new)   # forward jumps walk the chain and log every step
        if not path: sys.exit(f'cannot go from "{P["status"]}" to "{new}"; allowed: {NEXT[P["status"]]}')
        for st in path[:-1]:
            P['history'].append({'date': datetime.date.today().isoformat(), 'from': P['status'], 'to': st, 'version': P['version'], 'note': 'passed'}); P['status'] = st
        back = STATUSES.index(new) < STATUSES.index(P['status']) and new not in ('Archived',)
        if back: P['version'] += 1   # a request for changes always bumps the version
        P['history'].append({'date': datetime.date.today().isoformat(), 'from': P['status'], 'to': new, 'version': P['version'], 'note': opts.get('--note', '')})
        P['status'] = new; P['updated'] = datetime.date.today().isoformat()
        json.dump(P, open(os.path.join(rd, 'project.json'), 'w'), indent=2)
    print(json.dumps({k: P[k] for k in ('title', 'recipe', 'status', 'version')}))


def cmd_list(a):
    for f in sorted(glob.glob(os.path.join(STUDIO, 'brands', a[0], 'projects', '*', 'project.json'))):
        P = load(f, {}); print(f"{P.get('updated', ''):10}  {P.get('status', ''):22} v{P.get('version', 1)}  {P.get('recipe', P.get('content', '')):20} {P.get('title', '')}")


def zone_of(size):
    """A recipe size + its named zone from library/engine/formats.json (the one source of safe zones, platform UI and crops)."""
    F = load(os.path.join(STUDIO, 'library', 'engine', 'formats.json'), {}); z = F.get('zones', {}).get(size.get('zone'), {})
    return dict(size, safe=size.get('safe') or z.get('safe', {}), blocks=size.get('blocks') or z.get('blocks', []), crops=z.get('crops', []))


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
    paid = recipe.get('family') == 'ads' or P.get('script_type') == 'ad'   # the disclaimer is for paid ads, not organic Sell posts
    if paid and cl.get('ad_disclaimer'):
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
    check_screen_text(R, pdir)
    R.ok('copy')


def check_screen_text(R, pdir):
    """Lint for on-screen words ({text} in the script, hud/sign/title items in story.js): short, number and plural agree, numbers match the voice."""
    spoken, shown = '', []
    sp = os.path.join(pdir, 'script.md')
    if os.path.exists(sp):
        for l in open(sp, encoding='utf-8'):
            m = re.match(r'^[A-Z]:\s*(.+)$', l.strip())
            if not m: continue
            spoken += ' ' + re.sub(r'\{[^}]*\}|\[[^\]]*\]', ' ', m.group(1)); shown += re.findall(r'\{([^}]+)\}', m.group(1))
    st = os.path.join(pdir, 'story.js')
    dialogue = []
    if os.path.exists(st):
        src = open(st, encoding='utf-8').read().replace('\\"', '"'); shown += re.findall(r'(?:hud|sign|title|stamp|pill|slidehead|label) "([^"]+)"', src); dialogue = re.findall(r'say "([^"]+)"', src)
    NUM = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'twelve': 12, 'hundred': 100}
    said = {int(n) for n in re.findall(r'\b\d+\b', spoken)} | {v for k, v in NUM.items() if re.search(r'\b' + k + r'\b', spoken, re.I)}
    for t in dict.fromkeys(shown + dialogue):
        w = t.split()
        if len(w) > 6 and t not in dialogue: R.add('copy', 'ERROR', f'screen text "{t}": {len(w)} words (max 6 on screen; the voice carries the rest)')
        for i, x in enumerate(w[:-1]):
            if re.fullmatch(r'\d+', x):
                n, nxt = int(x), w[i + 1]
                if n == 1 and re.fullmatch(r'[A-Za-z]+S', nxt, re.I) and not re.search(r'(SS|US|IS)$', nxt, re.I): R.add('copy', 'ERROR', f'screen text "{t}": "1 {nxt}" should be singular')
                if said and n not in said and not re.fullmatch(r'(AM|PM|A\.M\.|P\.M\.)', nxt, re.I): R.add('copy', 'WARN', f'screen text "{t}": {n} is never said in the voice')


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
    # only the newest capture folder (old contact sheets never fail a new render)
    dirs = {}
    for f in files: dirs.setdefault(os.path.dirname(f), []).append(f)
    files = sorted(max(dirs.values(), key=lambda L: max(os.path.getmtime(x) for x in L)))
    sizes = {s['id']: zone_of(s) for s in recipe.get('sizes', [])}; minb = recipe.get('text', {}).get('min_px', {}).get('body', 40)
    F = load(os.path.join(STUDIO, 'library', 'engine', 'formats.json'), {}); ZN = os.environ.get('ZONE')
    def zone_for(sid):   # the zone the render used: $ZONE when it fits this size, else the recipe's size, else the size's default zone
        z = F.get('zones', {}).get(ZN or '')
        if z and z.get('canvas') == sid: return zone_of({'id': sid, 'zone': ZN})
        if sid in sizes: return sizes[sid]
        ar = (F.get('canvases', {}).get(sid) or {}).get('ar'); return zone_of({'id': sid, 'zone': F.get('default_zone', {}).get(ar, 'feed')})
    all_rest = os.path.exists(os.path.join(os.path.dirname(files[0]), 'REST')) or bool(load(files[0], {}).get('source'))   # preflight, stills, memes and cards: every capture is a rest frame
    fnum = lambda f: int(re.sub(r'\D', '', os.path.basename(f).split('.')[0]) or 0)
    nums = [fnum(f) for f in files]; step = min([b - a for a, b in zip(nums, nums[1:]) if b > a] or [1])
    REST = max(1, round(9 / step))   # pop-in lasts ~0.35 s: judge an item only after 9 frames on screen
    seen_at, issues = {}, {}
    def add(kind, key, n, msg): issues.setdefault((kind, key), [msg, []])[1].append(n)
    for f in files:
        n = fnum(f); Q = load(f, {}); cw, ch = Q.get('canvas', [1080, 1920]); sid = SIZES.get((int(cw), int(ch)), '9x16'); k = FINAL_W.get(sid, 1080) / cw
        Zs = zone_for(sid); safe = Zs.get('safe') or {'top': 0, 'bottom': 0, 'left': 0, 'right': 0}; fw, fh = cw * k, ch * k
        T = [dict(t, x=t['x'] * k, y=t['y'] * k, w=t['w'] * k, h=t['h'] * k, px=t['px'] * k) for t in Q.get('texts', []) if not t['item'].startswith(('body:', 'obst:'))]
        PL = [dict(t, x=t['x'] * k, y=t['y'] * k, w=t['w'] * k, h=t['h'] * k) for t in Q.get('texts', []) if t['item'].startswith('obst:plate:')]   # screen-text plates: no other text may sit on them
        rest = []
        for t in T:
            key = (t['item'].split(':')[0], t['t'][:40]); run = seen_at.get(key)
            run = run if run and run[1] == n - step else [n, n]; run[1] = n; seen_at[key] = run
            if (all_rest or (n - run[0]) / step >= REST) and not t['item'].startswith(IGNORE_ITEMS): rest.append((key, t))   # dense renders: after the pop-in; preflight/stills folders carry a REST marker
        for key, t in rest:
            if t['px'] < minb - 0.5: add('small', key, n, f'text too small ({t["px"]:.0f}px < {minb}px)')
            if t['x'] < safe.get('left', 0) - 2 or t['y'] < safe.get('top', 0) - 2 or t['x'] + t['w'] > fw - safe.get('right', 0) + 2 or t['y'] + t['h'] > fh - safe.get('bottom', 0) + 2:
                add('safe', key, n, f'outside the {sid} safe zone')
            for cr in Zs.get('crops', []):
                cx0, cy0, cx1, cy1 = cr['box']
                if t['x'] < cx0 or t['y'] < cy0 or t['x'] + t['w'] > cx1 or t['y'] + t['h'] > cy1: add('feed', key, n, f'cut in the {cr["name"]}')
            for blk in Zs.get('blocks', []):
                bx0, by0, bx1, by1 = blk['box']
                if t['x'] < bx1 and t['x'] + t['w'] > bx0 and t['y'] < by1 and t['y'] + t['h'] > by0: add('block', key, n, f'under the {blk["name"]}')
        for i, (ka, a) in enumerate(rest):
            for kb, b in rest[i + 1:]:
                if a['item'] == b['item'] or 'actor' in (ka[0], kb[0]): continue
                ix = max(0, min(a['x'] + a['w'], b['x'] + b['w']) - max(a['x'], b['x'])); iy = max(0, min(a['y'] + a['h'], b['y'] + b['h']) - max(a['y'], b['y']))
                if ix * iy > 0.12 * min(a['w'] * a['h'], b['w'] * b['h']): add('overlap', (ka[0], f'{ka[1]}" × "{kb[1]}'), n, 'text overlaps text')
        for key, t in rest:
            for pl in PL:
                if t['item'].startswith('hud:') and t['item'][4:].startswith(pl['item'][11:]): continue   # a text on its own plate (also each line of a wrapped text)
                ix = max(0, min(t['x'] + t['w'], pl['x'] + pl['w']) - max(t['x'], pl['x'])); iy = max(0, min(t['y'] + t['h'], pl['y'] + pl['h']) - max(t['y'], pl['y']))
                if ix * iy > 0.12 * t['w'] * t['h']: add('overlap', (key[0], f'{key[1]}" × plate "{pl["item"][11:]}'), n, 'text sits on another text\'s plate')
    hint = {'small': 'use hud role=label at=auto', 'safe': 'use hud at=auto', 'block': 'use hud (stays left of the buttons)', 'overlap': 'move one with at=', 'feed': ''}
    for (kind, (item, txt)), (msg, ns) in issues.items():
        sec = f'{ns[0] / 24:.1f}–{ns[-1] / 24:.1f}s' if ns[0] != ns[-1] else f'{ns[0] / 24:.1f}s'
        R.add('layout', 'WARN' if kind == 'feed' else 'ERROR', f'{item} "{txt}": {msg} at {sec}' + (f' → {hint[kind]}' if hint[kind] else ''))
    R.ok('layout')


def check_files(R, pdir, brand, title, P, recipe):
    d = os.path.join(pdir, 'delivery')
    if not os.path.isdir(d) or not os.listdir(d): R.add('files', 'ERROR', 'delivery/ is empty'); return
    rx = re.compile(rf'^{re.escape(brand)}_[a-z0-9-]+_{re.escape(title)}_v\d+(_(9x16|4x5|1x1|16x9|letter))?(_\d\d)?\.(mp4|png|jpg|gif|apng|pdf|mp3|pptx|docx)$')
    for f in os.listdir(d):
        if f.endswith(('.md', '.qa.json')) or f == 'manifest.json': continue
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


def cmd_ship(a):
    """studio.py ship <project_dir> — delivery in one step: final files → delivery/ with the naming rule, post.md, full gate, package, status."""
    pdir = os.path.abspath(os.path.expanduser(a[0])); brand, title, rd, P = find_record(pdir); d = os.path.join(pdir, 'delivery'); out = os.path.join(pdir, 'out')
    content, v = P.get('recipe') or 'reel', P.get('version', 1); os.makedirs(d, exist_ok=True)
    SIZE = {(1080, 1920): '9x16', (1080, 1350): '4x5', (1080, 1080): '1x1', (1920, 1080): '16x9'}
    def size_of(f):
        if f.endswith('.pdf'): return 'letter'
        if f.endswith('.mp4'):
            r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip().split(',')
            return SIZE.get(tuple(int(x) for x in r[:2])) if len(r) >= 2 else None
        from PIL import Image
        return SIZE.get(Image.open(f).size)
    picks = [f for f in glob.glob(os.path.join(out, '*')) if re.search(r'(_final\.mp4|_\d\d\.png|_letter\.pdf)$', f)]
    if not picks and not glob.glob(os.path.join(d, f'{brand}_*')): sys.exit('nothing to ship: run make.sh final (video), stills (images), doc (PDF), meme or kinetic first')
    for f in glob.glob(os.path.join(d, f'{brand}_*_{title}_v*')):   # delivery holds only the current version (memes and remakes write here directly)
        m = re.search(r'_v(\d+)', os.path.basename(f)[len(brand):])
        if m and int(m.group(1)) != v: os.remove(f)
    shipped = []
    for f in sorted(picks):
        sz = size_of(f); n = re.search(r'_(\d\d)\.png$', f); ext = f.rsplit('.', 1)[1]
        name = f"{brand}_{content}_{title}_v{v}" + (f'_{sz}' if sz else '') + (f'_{n.group(1)}' if n else '') + f'.{ext}'
        shutil.copy(f, os.path.join(d, name)); shipped.append(name)
    for f in ('post.md', 'message.md'):
        if os.path.exists(os.path.join(pdir, f)): shutil.copy(os.path.join(pdir, f), d)
    g = subprocess.run([sys.executable, os.path.abspath(__file__), 'check', pdir, '--stage', 'final'], capture_output=True, text=True); ok = g.returncode == 0
    if not ok: print('\n'.join(l for l in g.stdout.splitlines() if 'ERROR' in l or l.startswith('QUALITY')))
    if ok: cmd_package([pdir])
    if ok and P and P.get('status') != 'Ready for approval':
        try: cmd_status([f'{brand}/{title}', '--set', 'Ready for approval', '--note', f'v{v} shipped'])
        except SystemExit as e: print(f'status not moved: {e}')
    shipped += sorted(f for f in os.listdir(d) if f.startswith(brand + '_') and f not in shipped and not f.endswith('.qa.json'))
    print(json.dumps({'shipped': shipped, 'gate': 'passed' if ok else 'FAILED (see qa/report_final.json)'}))
    if not ok: sys.exit(2)


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
    {'new': cmd_new, 'status': cmd_status, 'check': cmd_check, 'package': cmd_package, 'list': cmd_list, 'plan': cmd_plan, 'zone': cmd_zone, 'ship': cmd_ship}.get(sys.argv[1], lambda a: sys.exit(__doc__))(sys.argv[2:])
