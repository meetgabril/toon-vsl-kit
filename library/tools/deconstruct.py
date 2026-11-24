#!/usr/bin/env python3
"""deconstruct.py <video> [outdir] — first pass on a viral example for the Hook Library.

Writes to outdir (default qa/deconstruct/):
  sheet.jpg      contact sheet at 3 fps (read every frame: on-screen text, framing, what changes)
  cuts.json      duration, size, scene cuts (seconds), audio loudness every 0.25 s, speech-likeness, silent stretches
Then the studio writes library/hooks/<id>/hook.json by hand from what it sees (see references/hooks.md).
"""
import glob, json, os, re, subprocess, sys
import numpy as np, soundfile as sf
from PIL import Image


def run(*a): return subprocess.run(a, capture_output=True, text=True)


def main(src, out='qa/deconstruct'):
    os.makedirs(out, exist_ok=True)
    for f in glob.glob(os.path.join(out, 'f*.jpg')): os.remove(f)
    pr = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', src).stdout)
    dur = float(pr['format']['duration']); v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
    run('ffmpeg', '-v', 'error', '-i', src, '-vf', 'fps=3,scale=240:-1', os.path.join(out, 'f%03d.jpg'))
    fs = sorted(glob.glob(os.path.join(out, 'f*.jpg'))); ims = [Image.open(f) for f in fs]; w, h = ims[0].size; cols = 8; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w, rows * h), 'white'); [sheet.paste(x, ((i % cols) * w, (i // cols) * h)) for i, x in enumerate(ims)]; sheet.save(os.path.join(out, 'sheet.jpg'))
    for f in fs: os.remove(f)
    cuts = [round(float(t), 2) for t in re.findall(r'pts_time:([0-9.]+)', run('ffmpeg', '-i', src, '-vf', "select='gt(scene,0.08)',showinfo", '-an', '-f', 'null', '-').stderr)]
    audio = {}
    if any(s['codec_type'] == 'audio' for s in pr['streams']):
        wav = os.path.join(out, 'a.wav'); run('ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '16000', wav)
        x, sr = sf.read(wav); step = int(sr * .25)
        rms = [round(float(np.sqrt(np.mean(x[i:i + step] ** 2))), 3) for i in range(0, len(x), step)]
        S = np.abs(np.fft.rfft(x)); f = np.fft.rfftfreq(len(x), 1 / sr); tot = S.sum() or 1
        voice_band = float(S[(f >= 300) & (f < 3000)].sum() / tot)
        silent = [i * .25 for i, r in enumerate(rms) if r < .003]
        audio = {'rms_every_0_25s': rms, 'voice_band_share': round(voice_band, 2), 'likely_speech': voice_band > .55, 'silent_seconds': silent}
        os.remove(wav)
    # frame-exact pass at native fps: hard cuts (frame numbers), and for flat-colour text cards: colours and text box
    num, den = (int(x) for x in v['r_frame_rate'].split('/')); fps = num / den
    tmp = os.path.join(out, 'native'); os.makedirs(tmp, exist_ok=True)
    for f in glob.glob(os.path.join(tmp, '*.png')): os.remove(f)
    run('ffmpeg', '-v', 'error', '-i', src, '-vf', 'scale=360:-2', os.path.join(tmp, 'n%05d.png'))
    nf = sorted(glob.glob(os.path.join(tmp, 'n*.png'))); prev = None; hard = []
    for i, f in enumerate(nf):
        a = np.asarray(Image.open(f).convert('RGB')).astype(int)
        if prev is not None and np.abs(a - prev).mean() > 40: hard.append(i)
        prev = a
    segs = []; bounds = [0] + hard + [len(nf)]
    for a0, a1 in zip(bounds[:-1], bounds[1:]):
        mid = np.asarray(Image.open(nf[(a0 + a1) // 2]).convert('RGB')).astype(int); H0, W0 = mid.shape[:2]
        bg = np.median(mid.reshape(-1, 3), axis=0).astype(int); flat = float((np.abs(mid - bg).sum(2) < 30).mean())
        seg = {'frames': [a0, a1 - 1], 't': round(a0 / fps, 4), 'seconds': round((a1 - a0) / fps, 3), 'flat_card': flat > .6}
        if seg['flat_card']:
            m = np.abs(mid - bg).sum(2) > 90; ys, xs = np.where(m)
            if len(xs):
                fg = np.median(mid[m], axis=0).astype(int)
                seg.update({'bg': '#%02x%02x%02x' % tuple(bg), 'fg': '#%02x%02x%02x' % tuple(fg), 'text_width_frac': round((xs.max() - xs.min()) / W0, 3),
                            'text_height_frac': round((ys.max() - ys.min()) / H0, 3), 'text_center_y': round((ys.min() + ys.max()) / 2 / H0, 3)})
        segs.append(seg)
    for f in nf: os.remove(f)
    os.rmdir(tmp)
    R = {'source': os.path.basename(src), 'duration': round(dur, 2), 'size': [v['width'], v['height']], 'fps': round(fps, 3), 'cuts': cuts, 'hard_cut_frames': hard,
         'shots': [round(b - a, 2) for a, b in zip([0] + cuts, cuts + [dur])], 'segments': segs, 'audio': audio}
    # remake draft: original footage until the first card, original audio, one card per flat segment (fill in text, roles and colours)
    cards = [s for s in segs if s.get('flat_card')]
    if cards:
        draft = {'fps': round(fps), 'size': [1080, 1920], 'pop': False, 'font': 'baloo',
                 'bait': {'video': 'work/example.mp4', 'until': cards[0]['t']}, 'audio': {'source': 'work/example.mp4'},
                 'cards': [{'t': c['t'], 'text': 'TODO (same length as the original)', 'bg': 'paper' if sum(int(c['bg'][i:i + 2], 16) for i in (1, 3, 5)) > 384 else 'primary_dark',
                            'fg': 'primary_dark' if sum(int(c['bg'][i:i + 2], 16) for i in (1, 3, 5)) > 384 else 'paper', 'size': 320 if c['text_height_frac'] > .08 else 150,
                            'fit': min(.88, round(c['text_width_frac'], 2)), 'y': c['text_center_y'], **({'group': 'words'} if c['text_height_frac'] > .08 else {})} for c in cards],
                 'brand': 'brand/brand-profile.json', 'out': 'delivery/<brand>_reel_<title>_v1_9x16.mp4'}
        grp = [c for c in draft['cards'] if c.get('group')]
        if grp:
            gfit = min(.88, max(c['fit'] for c in grp))
            for c in grp: c['fit'] = gfit   # the original sizes words together; the widest word sets the width
        json.dump(draft, open(os.path.join(out, 'remake_draft.json'), 'w'), indent=1)
    json.dump(R, open(os.path.join(out, 'cuts.json'), 'w'), indent=1); print(json.dumps({k: R[k] for k in ('duration', 'size', 'cuts', 'shots')}))


if __name__ == '__main__':
    main(*sys.argv[1:])
