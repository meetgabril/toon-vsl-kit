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
    R = {'source': os.path.basename(src), 'duration': round(dur, 2), 'size': [v['width'], v['height']], 'fps': v['r_frame_rate'], 'cuts': cuts,
         'shots': [round(b - a, 2) for a, b in zip([0] + cuts, cuts + [dur])], 'audio': audio}
    json.dump(R, open(os.path.join(out, 'cuts.json'), 'w'), indent=1); print(json.dumps({k: R[k] for k in ('duration', 'size', 'cuts', 'shots')}))


if __name__ == '__main__':
    main(*sys.argv[1:])
