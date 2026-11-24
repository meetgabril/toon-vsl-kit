#!/usr/bin/env python3
"""voice.py script.md [out.mp3] — record the voiceover with the ElevenLabs API (Text to Dialogue, Eleven v3).

Optional. Needs ELEVENLABS_API_KEY in the environment and a "voice_id" for every speaker in brand/brand-profile.json → characters.
Without them, the studio uses the manual route (python3 script.py el script.md → the user records and uploads one file).
The output goes to ingest.py exactly like an uploaded file:  python3 ingest.py work/voice_api.mp3 script.md
"""
import json, os, re, subprocess, sys, urllib.request

API = 'https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128'


def lines(path):
    out = []
    for l in open(path):
        m = re.match(r'^([A-Z]):\s*(.+)$', l.strip())
        if m: out.append((m.group(1), m.group(2)))
    return out


def main(src, dst='work/voice_api.mp3'):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key: sys.exit('NO_KEY: set ELEVENLABS_API_KEY, or use the manual route (script.py el).')
    chars = json.load(open('brand/brand-profile.json')).get('characters', {})
    missing = sorted({sp for sp, _ in lines(src) if not (chars.get(sp) or {}).get('voice_id')})
    if missing: sys.exit(f'NO_VOICE_ID for {missing}: add "voice_id" to those characters in the Brand Profile.')
    L = lines(src); chunks, cur, n = [], [], 0
    for sp, t in L:   # ElevenLabs recommends at most ~2,000 characters per request
        if cur and n + len(t) > 1800: chunks.append(cur); cur, n = [], 0
        cur.append({'text': t, 'voice_id': chars[sp]['voice_id']}); n += len(t)
    if cur: chunks.append(cur)
    os.makedirs('work', exist_ok=True); parts = []
    for i, c in enumerate(chunks):
        req = urllib.request.Request(API, data=json.dumps({'inputs': c, 'model_id': 'eleven_v3'}).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        p = f'work/voice_part{i}.mp3'; open(p, 'wb').write(urllib.request.urlopen(req, timeout=300).read()); parts.append(p)
    if len(parts) == 1: os.replace(parts[0], dst)
    else:
        open('work/voice_parts.txt', 'w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'work/voice_parts.txt', '-c', 'copy', dst], check=True)
    print(json.dumps({'voice': dst, 'requests': len(parts), 'lines': len(L)}))


if __name__ == '__main__':
    main(*sys.argv[1:])
