"""script.py — one script file drives voice + timing.

script.md format (UTF-8):
    # Title
    lang: en
    voice D: Dex — narrator, warm confident male, 30s        (one line per speaker)
    voice T: Tony — energetic fitness coach, upbeat male
    D: [warm] This is Tony. Celebrity fitness coach.
    T: [excited] Twelve weeks. Real results!
    T: [whispers] And they post their progress...
Lines starting with '>' or '//' are notes for Claude (ignored). [tags] are ElevenLabs v3 audio tags.

Usage:
    python3 script.py el    script.md   → work/elevenlabs_dialogue.txt (Text-to-Dialogue / Studio, v3 tags kept)
                                          + work/el_<SP>.txt per voice + checklist on screen
    python3 script.py lines script.md   → work/lines.txt (SP|text without tags) for alignment
    python3 script.py check script.md   → hook length, sentence lengths, duration and the LOOP JOIN (last line → first line)
"""
import re, sys, os, json
TAG = re.compile(r'\[[^\]]*\]')

def parse(path):
    meta, voices, lines = {}, {}, []
    for raw in open(path, encoding='utf-8'):
        s = raw.strip()
        if not s or s.startswith(('>', '//', '# ')) or s == '#': continue
        m = re.match(r'voice\s+(\w+)\s*:\s*(.+)', s, re.I)
        if m: voices[m.group(1)] = m.group(2); continue
        m = re.match(r'(\w+)\s*:\s*(.+)', s)
        if m and m.group(1).lower() in ('lang', 'title', 'fps', 'format'): meta[m.group(1).lower()] = m.group(2).strip(); continue
        if m: lines.append((m.group(1), m.group(2).strip())); continue
    return meta, voices, lines

def clean(t):  # what is actually spoken
    t = TAG.sub(' ', t); t = re.sub(r'\s+', ' ', t).strip(); return t

def main():
    cmd, path = sys.argv[1], sys.argv[2]; os.makedirs('work', exist_ok=True)
    meta, voices, lines = parse(path)
    if cmd == 'lines':
        with open('work/lines.txt', 'w', encoding='utf-8') as f:
            for sp, t in lines: f.write(f'{sp}|{clean(t)}\n')
        json.dump({'meta': meta, 'voices': voices}, open('work/script_meta.json', 'w'), ensure_ascii=False, indent=1)
        print(f'work/lines.txt: {len(lines)} lines, speakers {sorted(set(s for s, _ in lines))}')
    elif cmd == 'el':
        name = lambda sp: (voices.get(sp, sp).split('—')[0].split('-')[0].strip() or sp)
        with open('work/elevenlabs_dialogue.txt', 'w', encoding='utf-8') as f:
            for sp, t in lines: f.write(f'{name(sp)}: {t}\n')
        for sp in sorted(set(s for s, _ in lines)):
            with open(f'work/el_{sp}.txt', 'w', encoding='utf-8') as f:
                f.write('\n\n'.join(t for s, t in lines if s == sp) + '\n')
        words = sum(len(clean(t).split()) for _, t in lines)
        print(f'{len(lines)} lines · {words} words · ~{words / 2.5:.0f}s at 150 wpm')
        print('work/elevenlabs_dialogue.txt  (paste into ElevenLabs Text-to-Dialogue / Studio, model Eleven v3)')
        for sp, v in voices.items(): print(f'  voice {sp}: {v}')
        print('Export ONE file with all lines in order (mp3/wav/mp4). Then upload it here.')

def check(path):
    meta, voices, lines = parse(path); txt = [clean(t) for _, t in lines]
    words = sum(len(t.split()) for t in txt); first = re.split(r'(?<=[.!?])\s+', txt[0])[0] if txt else ''
    print(f'{len(lines)} lines · {words} words · ~{words / 2.5:.0f}s')
    print(f'HOOK ({len(first.split())} words, aim ≤ 12): {first}')
    long = [s for t in txt for s in re.split(r'(?<=[.!?])\s+', t) if len(s.split()) > 15]
    for s_ in long: print(f'  ⚠ long sentence ({len(s_.split())} words): {s_[:80]}')
    last = re.split(r'(?<=[.!?])\s+', txt[-1])[-1] if txt else ''
    print(f'LOOP JOIN — read aloud without pausing:\n  "…{last}" → "{first}"')
    tags = re.findall(r'\[([^\]]+)\]', ' '.join(t for _, t in lines)); print('emotion tags:', ', '.join(sorted(set(tags))) or 'none (add some)')

if __name__ == '__main__':
    if sys.argv[1] == 'check': check(sys.argv[2])
    else: main()
