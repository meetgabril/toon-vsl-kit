#!/usr/bin/env python3
"""reactions.py — character voice kits: every character's grunts, laughs, gasps and shouts in THEIR OWN voice.
  script <brand> <char>            print the ElevenLabs text (Eleven v3/v4, audio tags) to record ONE take with the character's voice
  split  <brand> <char> <file>     cut that take at the pauses into brands/<brand>/voice-kits/<char>/<id>.wav (checks the count)
  list   <brand>                   what each character's kit has
In a video: copy brands/<b>/voice-kits/<char>/<id>.wav to sfx/voice-<char>-<id>.wav and add an event of type 'voice-<char>-<id>'
in story.js (autoscore mixes 'voice-*' at dialogue level, no pitch boil)."""
import os, sys, json, subprocess
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
# One list for every character, so every cast reacts in the same vocabulary. (id, what it's for, text with audio tags)
KIT = [
 ('chuckle', 'small knowing laugh', '[chuckles] Heh heh.'),
 ('laugh', 'big real laugh', '[laughs] Ha ha ha ha!'),
 ('laugh-nervous', 'caught out, awkward', '[nervous laugh] Heh... heh.'),
 ('laugh-mischief', 'scheming', '[mischievously] [laughs softly] Hehehe.'),
 ('gasp', 'surprise', '[gasps] Oh!'),
 ('gasp-shock', 'big shock', '[gasps loudly] WHAT?!'),
 ('whoa', 'impressed / off balance', '[surprised] Whoa!'),
 ('sigh-tired', 'tired, fed up', '[sighs heavily] Haaah.'),
 ('sigh-relief', 'phew', '[relieved] [exhales] Phew.'),
 ('hmm', 'thinking', '[thoughtful] Hmmm...'),
 ('huh', 'confused', '[confused] Huh?'),
 ('uh-oh', 'something went wrong', '[worried] Uh-oh.'),
 ('ugh', 'disgust / annoyed', '[annoyed] Ugh!'),
 ('pfft', 'dismissive', '[dismissive] Pfft.'),
 ('groan', 'frustrated', '[frustrated] [groans] Uuugh.'),
 ('grunt-effort', 'lifting, pushing', '[strained] [grunts] Hnngh!'),
 ('grunt-angry', 'angry under the breath', '[angry] [growls] Grrr.'),
 ('shout-angry', 'angry shout', '[angry] [shouts] HEY!'),
 ('argh', 'rage', '[furious] ARGH!'),
 ('yes', 'win, small', '[happily] Yes!'),
 ('woohoo', 'big win', '[excited] [shouts] Woo-hoo!'),
 ('aww', 'touched, cute', '[warmly] Awww.'),
 ('ooh', 'interested, tempted', '[intrigued] Ooooh.'),
 ('oof', 'hit / bad news lands', '[pained] Oof!'),
 ('ow', 'hurt, comic', '[in pain] Ow!'),
 ('scream', 'comic scream', '[screams] Aaaah!'),
 ('sob', 'comic crying', '[crying] [sobs] Waaah.'),
 ('gulp', 'nervous swallow', '[nervous] [gulps]'),
 ('shh', 'secret', '[whispers] Shhh.'),
 ('ahem', 'clears throat, attention', '[clears throat] Ahem.'),
 ('hum-happy', 'content, humming', '[happily] [hums] Hm-hm-hmm.'),
 ('whistle', 'impressed whistle', '[whistles]'),
]
GAP = 'Pause.'   # spoken nothing; we ask for a clear pause between reactions with line breaks + ellipses

def kit_dir(b, c): return os.path.join(ROOT, 'brands', b, 'voice-kits', c)
def chars(b):
    return json.load(open(os.path.join(ROOT, 'brands', b, 'brand-profile.json')))['characters']

def script(b, c):
    ch = chars(b)
    who = next((v for k, v in ch.items() if k == c or c.lower() in v['name'].lower()), None) or sys.exit(f'no character {c}')
    print(f"# Voice kit for {who['name']} ({who['voice']}). Model: Eleven v3 or v4. Voice: the SAME voice used for {who['name']}'s lines.")
    print('# Paste everything below as ONE generation. Stability: Creative. Leave the pauses in. Download as MP3/WAV and upload it.\n')
    print('\n\n'.join(f'{t} ...' for _, _, t in KIT))

def split(b, c, f, min_gap=.45, thr_db=-38):
    tmp = '/tmp/_react.wav'; subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', f, '-ar', '48000', '-ac', '1', tmp], check=True)
    x, sr = sf.read(tmp); w = int(.02 * sr); k = len(x) // w
    e = 20 * np.log10(np.sqrt((x[:k * w].reshape(k, w) ** 2).mean(1)) + 1e-9); on = e > (e.max() + thr_db)
    segs, s, quiet = [], None, 0
    for i, v in enumerate(on):
        if v: s = i if s is None else s; quiet = 0
        elif s is not None:
            quiet += 1
            if quiet * w / sr >= min_gap: segs.append((s, i - quiet + 1)); s, quiet = None, 0
    if s is not None: segs.append((s, k))
    segs = [g for g in segs if (g[1] - g[0]) * w / sr > .12]
    if len(segs) != len(KIT):
        sys.exit(f'found {len(segs)} reactions, expected {len(KIT)}: try min_gap/thr, or re-generate with longer pauses')
    d = kit_dir(b, c); os.makedirs(d, exist_ok=True); pad = int(.04 * sr)
    for (a, z), (i, what, _) in zip(segs, KIT):
        y = x[max(0, a * w - pad): min(len(x), z * w + pad)]; fl = int(.01 * sr); y[:fl] *= np.linspace(0, 1, fl); y[-fl:] *= np.linspace(1, 0, fl)
        sf.write(os.path.join(d, f'{i}.wav'), np.stack([y, y], 1).astype(np.float32), sr)
    json.dump([{'id': i, 'use': u} for i, u, _ in KIT], open(os.path.join(d, 'index.json'), 'w'), indent=1); print(f'{len(KIT)} reactions → {d}')

a = sys.argv[1:]
if not a: print(__doc__)
elif a[0] == 'script': script(a[1], a[2])
elif a[0] == 'split': split(a[1], a[2], a[3])
elif a[0] == 'list':
    base = os.path.join(ROOT, 'brands', a[1], 'voice-kits')
    for c in sorted(os.listdir(base)) if os.path.exists(base) else []: print(c, len([f for f in os.listdir(os.path.join(base, c)) if f.endswith('.wav')]), 'reactions')
