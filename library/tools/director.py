#!/usr/bin/env python3
"""director.py script.md [story.js] — first storyboard from the script, no hand-written beats.

Script lines may carry the on-screen words in braces:  D: [deadpan] Tony goes live at three in the morning. {LIVE 3 AM}
Rules: one shot per line · speaker → cast and camera · emotion tag → mood and music · keywords → set ·
first line = hook: the hero alone, close · first {text} = role=hook · last line = CTA card (green) · other {text} = label.
Every screen text uses at=auto: the engine places it clear of faces, set signs and platform buttons, in any size (9:16, 4:5, 16:9).
Sets rotate: the same set is never used for more than 2 shots in a row.
Overrides stay possible: lines starting with '@ ' after a voice line are copied into that shot as raw beat keys,
e.g.  @ set: 'gym', cam: 'cu:T'
"""
import json, re, sys

src = sys.argv[1]; dst = sys.argv[2] if len(sys.argv) > 2 else 'story.js'
MOOD = {'excited': 'happy', 'cheerful': 'happy', 'proud': 'happy', 'laughs': 'happy', 'amused': 'smile', 'warm': 'smile',
        'deadpan': 'serious', 'dry': 'serious', 'serious': 'serious', 'sarcastic': 'cheeky', 'sighs': 'tired', 'whispers': 'worried',
        'curious': 'hopeful', 'mysterious': 'serious', 'shouting': 'fear'}
MUSIC = {'warm': 'happy', 'cheerful': 'happy', 'proud': 'build', 'serious': 'think', 'mysterious': 'tension'}
SETS = [(r'\b(night|a\.m\.|morning|sleep|bed|awake)\b', 'night'), (r'\b(community|members|club)\b', 'community'),
        (r'\b(ads?|money|dollars|pay)\b', 'casino'), (r'\b(gym|workout|train)\b', 'gym'), (r'\b(post|posting|content|live|video)\b', 'content')]
ROTATE = ['studio', 'content', 'stage', 'community', 'night']
REACT = {'happy': 'happy', 'smile': 'smile', 'serious': 'worried', 'tired': 'sad', 'worried': 'worried', 'cheeky': 'smile', 'hopeful': 'hopeful', 'fear': 'fear'}

lines, over = [], {}
for raw in open(src):
    l = raw.strip()
    m = re.match(r'^([A-Z]):\s*(?:\[(\w+)\]\s*)?(.+?)\s*(?:\{([^}]+)\})?$', l)
    if m: lines.append(dict(sp=m.group(1), tag=m.group(2) or '', txt=m.group(3), hud=m.group(4))); continue
    if l.startswith('@ ') and lines: over[len(lines) - 1] = l[2:]

beats, prev_set, music, hook_done = [], None, None, False
for i, L in enumerate(lines):
    words = re.sub(r'[^\w\s\']', ' ', L['txt']).split(); at = ' '.join(words[:3])
    mood = MOOD.get(L['tag'], 'smile'); last = i == len(lines) - 1
    st = next((s for rx, s in SETS if re.search(rx, L['txt'], re.I)), None) or prev_set or 'studio'
    if len(beats) >= 2 and beats[-1]['set'] == beats[-2]['set'] == st: st = next(x for x in ROTATE if x != st)   # never 3 shots in a row on one set
    hero = 'T' if any(x['sp'] == 'T' for x in lines) else L['sp']
    if i == 0:   # the hook: the hero alone, close enough to read the face in a scroll
        cast, cam = f"{hero} C {'hips ' if mood == 'happy' and hero == 'T' else ''}{mood}", 'pull'
    elif L['sp'] == 'T':
        cast, cam = f"T {'cu' if L['tag'] in ('sighs', 'whispers') else 'C hips'} {mood}", 'in'
    else:
        cast, cam = f"D L {mood} | T C {'hips ' if mood == 'happy' else ''}{REACT.get(mood, 'smile')}", ('pull' if i == 0 else 'push')
    items = []
    if L['hud']:
        if not hook_done: items.append(f'hud "{L["hud"]}" role=hook at=auto'); hook_done = True
        elif last: items.append(f'hud "{L["hud"]}" at=auto bg=green')
        else: items.append(f'hud "{L["hud"]}" at=auto bg={["teal", "orange", "red"][i % 3]}')
    b = {'at': at, 'set': st, 'cam': cam, 'cast': cast, 'items': items}
    mu = 'sitcom' if i == 0 else MUSIC.get(L['tag'])
    if mu and mu != music: b['music'] = mu; music = mu
    beats.append(b); prev_set = st

out = ['// story.js — written by director.py from the script; edit any shot, or add "@ key: value" lines in the script.', 'export const STORY = {', '  beats: [']
for i, b in enumerate(beats):
    keys = ', '.join([f"at: {json.dumps(b['at'])}", f"set: '{b['set']}'"] + ([f"music: '{b['music']}'"] if 'music' in b else []) +
                     [f"cam: '{b['cam']}'", f"cast: '{b['cast']}'", f"items: {json.dumps(b['items'])}"] + ([over[i]] if i in over else []))
    out.append(f'    {{ {keys} }},')
out += ['  ],', '  loop: 0.4,', "  style: 'ink',", '  fns: {},', '};', '']
open(dst, 'w').write('\n'.join(out)); print(f'{dst}: {len(beats)} shots, {sum(1 for b in beats if b["items"])} on-screen texts')
