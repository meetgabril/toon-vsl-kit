import re, json
from pocketsphinx import Decoder
L=[l.rstrip('\n').split('|',1) for l in open('lines.txt') if l.strip()]
words=[]; owner=[]
for i,(sp,tx) in enumerate(L):
    for w in re.findall(r"[A-Za-z']+",tx): words.append(w.lower()); owner.append(i)
d=Decoder(samprate=16000,bestpath=False)
d.add_word('buzztorm','B AH Z T AO R M',True); d.add_word('onboarding','AA N B AO R D IH NG',True)
d.set_align_text(' '.join(words))
raw=open('voice16.raw','rb').read()
d.start_utt(); d.process_raw(raw,full_utt=True); d.end_utt()
d.set_alignment(); d.start_utt(); d.process_raw(raw,full_utt=True); d.end_utt()
out=[]
for w in d.get_alignment():
    if w.name in ('<s>','</s>','<sil>','(NULL)') or w.name.startswith('+'): continue
    out.append([re.sub(r'\(\d\)','',w.name),w.start/100,(w.start+w.duration)/100])
print(len(words),len(out))
for o,i in zip(out,owner): o.append(i)
lines=[]
for i,(sp,tx) in enumerate(L):
    ws=[o for o in out if o[3]==i]
    lines.append(dict(i=i,sp=sp,t0=ws[0][1],t1=ws[-1][2],text=tx))
json.dump(dict(words=out,lines=lines),open('timing.json','w'),indent=0)
for l in lines: print(l['sp'],f"{l['t0']:.2f}-{l['t1']:.2f}",l['text'][:50])
