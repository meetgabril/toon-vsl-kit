#!/usr/bin/env python3
"""build_doc.py <doc.md> <out.pdf> — branded learning document (e-book, checklist, playbook, worksheet, cheat sheet, lesson).

doc.md starts with a front matter block:
---
type: checklist | ebook | playbook | worksheet | cheat-sheet | lesson
title: The 12-Point Community Launch Checklist
subtitle: …                      (optional)
cover_image: stills/cover.png    (optional, a still rendered by the engine)
cta_title: Join Buzztorm Academy (optional; defaults to the brand's first active offer)
cta_text: Free. Comment ACADEMY for the link.
---
Body: Markdown plus
  - [ ] item                → checkbox item
  :::play|tip|warning|example Title   …   :::   → boxes (play = playbook card, one per page in playbooks)
  ___                       → writing line;  ___ Label → labelled line;  ___tall Label → big box
  [[pagebreak]]
Writes <out.pdf>, <out.html> and PNG previews of every page (<out>-p1.png …) for review.
"""
import json, os, re, subprocess, sys, html
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))


def front(s):
    m = re.match(r'^---\n(.*?)\n---\n', s, re.S); meta = {}
    if not m: return meta, s
    for line in m.group(1).splitlines():
        if ':' in line: k, v = line.split(':', 1); meta[k.strip()] = v.strip()
    return meta, s[m.end():]


def pre(body, kind):
    out, stack = [], []
    for line in body.splitlines():
        m = re.match(r'^:::(\w[\w-]*)\s*(.*)$', line)
        if m:
            k, title = m.group(1), m.group(2).strip(); stack.append(k)
            lab = '<div class="label">PLAY</div>' if k == 'play' else ''
            out.append(f'<div class="box {k}" markdown="1">\n{lab}\n' + (f'### {title}\n' if title else '')); continue
        if line.strip() == ':::' and stack: stack.pop(); out.append('\n</div>\n'); continue
        if line.strip() == '[[pagebreak]]': out.append('\n<div style="page-break-after:always"></div>\n'); continue
        m = re.match(r'^___(tall)?\s*(.*)$', line.strip())
        if m and line.strip().startswith('___'):
            lab = html.escape(m.group(2)); out.append((f'<div class="field-label">{lab}</div>' if lab else '') + f'<div class="field{" tall" if m.group(1) else ""}"></div>'); continue
        out.append(line)
    s = '\n'.join(out)
    # checkbox lists
    s = re.sub(r'(?m)^- \[ \] (.+)$', lambda m: '<li>' + markdown.markdown(m.group(1))[3:-4] + '</li>', s)
    s = re.sub(r'((?:<li>.*</li>\n?)+)', lambda m: '<ul class="check">\n' + m.group(1) + '</ul>\n', s)
    return s


def colors(brand_dir):
    p = json.load(open(os.path.join(brand_dir, 'brand-profile.json')))
    d = {'primary': '#25385c', 'primary_dark': '#16213a', 'accent': '#ff6a2a', 'highlight': '#ffd66b', 'paper': '#fff6e0', 'paper_dark': '#efe4d2', 'positive': '#2f8f4a', 'negative': '#e8574a', 'secondary': '#5bc0be', 'tertiary': '#a974e0'}
    d.update({k: v for k, v in p.get('colors', {}).items() if v}); return p, d


def main(src, out):
    brand_dir = 'brand' if os.path.isdir('brand') else os.path.join(os.path.dirname(src), 'brand')
    prof, C = colors(brand_dir); meta, body = front(open(src).read()); kind = meta.get('type', 'ebook')
    offers = []
    for cand in (os.path.join(os.environ.get('STUDIO', os.path.expanduser('~/buzztorm-studio')), 'brands', prof.get('id', ''), 'brain', 'offers.json'),):
        if os.path.exists(cand): offers = [o for o in json.load(open(cand)).get('offers', []) if o.get('status') == 'active']
    cta_t = meta.get('cta_title') or (offers[0]['name'] if offers else prof.get('name', ''))
    cta_x = meta.get('cta_text') or (offers[0].get('cta') or offers[0].get('promise', '') if offers else '')
    md = markdown.Markdown(extensions=['tables', 'attr_list', 'md_in_html', 'sane_lists'])
    content = md.convert(pre(body, kind))
    css_vars = ';'.join(f'--{k.replace("_", "-")}:{v}' for k, v in C.items())
    brand = html.escape(prof.get('name', '')); title = html.escape(meta.get('title', '')); sub = html.escape(meta.get('subtitle', ''))
    foot = f'<div class="footer"><span>{brand}</span><span>{title}</span></div>'
    cta = f'<div class="cta"><div class="display">{html.escape(cta_t)}</div><p>{html.escape(cta_x)}</p></div>'
    img = f'<img src="{os.path.relpath(os.path.abspath(meta["cover_image"]), os.path.dirname(os.path.abspath(out)))}">' if meta.get('cover_image') else ''
    pages = []
    if kind in ('ebook', 'playbook', 'lesson'):
        pages.append(f'<section class="page cover"><span class="chip">{kind.upper().replace("-", " ")}</span><h1>{title}</h1><div class="sub">{sub}</div>{img}<div class="brand">{brand}</div></section>')
        heads = re.findall(r'<h2[^>]*>(.*?)</h2>', content)
        if kind in ('ebook', 'playbook') and len(heads) > 2:
            pages.append('<section class="page toc"><div class="band"></div><h1>Contents</h1><ol>' + ''.join(f'<li>{h}</li>' for h in heads) + f'</ol>{foot}</section>')
        chunks = re.split(r'(?=<h2)', content)
        intro = chunks[0] if not chunks[0].startswith('<h2') else ''
        if intro.strip(): pages.append(f'<section class="page"><div class="band"></div>{intro}{foot}</section>')
        for ch in chunks[1 if intro or not chunks[0].startswith('<h2') else 0:]:
            if not ch.strip(): continue
            if kind == 'playbook':   # one play per page
                parts = re.split(r'(?=<div class="box play")', ch)
                pages.append(f'<section class="page"><div class="band"></div>{parts[0]}{foot}</section>')
                for p in parts[1:]: pages.append(f'<section class="page"><div class="band"></div>{p}{foot}</section>')
            else: pages.append(f'<section class="page"><div class="band"></div>{ch}{foot}</section>')
        pages.append(f'<section class="page"><div class="band"></div><h1>What\'s next</h1>{cta}{foot}</section>')
    else:   # one-pagers: checklist, worksheet, cheat-sheet
        cls = 'compact cols2' if kind == 'cheat-sheet' else 'compact'
        pages.append(f'<section class="page {cls}"><div class="band"></div><span class="chip">{kind.upper().replace("-", " ")}</span><h1>{title}</h1>' + (f'<p><strong>{sub}</strong></p>' if sub else '') + f'{content}{cta}{foot}</section>')
    doc = f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="{os.path.relpath(os.path.join(HERE, "doc-templates", "base.css") if os.path.exists(os.path.join(HERE, "doc-templates", "base.css")) else os.path.join(HERE, "..", "doc-templates", "base.css"), os.path.dirname(os.path.abspath(out)))}"><style>:root{{{css_vars}}}</style></head><body>{"".join(pages)}</body></html>'
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True); os.makedirs('qa', exist_ok=True)
    htm = os.path.join('qa', os.path.splitext(os.path.basename(out))[0] + '.html')
    doc = doc.replace(f'href="{os.path.relpath(os.path.join(HERE, "doc-templates", "base.css"), os.path.dirname(os.path.abspath(out)))}"', f'href="{os.path.relpath(os.path.join(HERE, "doc-templates", "base.css"), "qa")}"')
    doc = re.sub(r'<img src="([^"]+)"', lambda m: f'<img src="{os.path.relpath(os.path.join(os.path.dirname(os.path.abspath(out)), m.group(1)), os.path.abspath("qa"))}"', doc)
    pm = os.path.join(os.getcwd(), 'print_pdf.mjs') if os.path.exists('print_pdf.mjs') else os.path.join(HERE, 'print_pdf.mjs')
    one_page = kind in ('checklist', 'worksheet', 'cheat-sheet'); size = 11.0
    while True:
        d2 = doc.replace('</style>', f'.compact{{font-size:{size}pt}}</style>') if one_page else doc
        open(htm, 'w').write(d2); subprocess.run(['node', pm, htm, out], check=True, stdout=subprocess.DEVNULL)
        n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', out], capture_output=True, text=True).stdout).group(1))
        if not one_page or n == 1: break
        if size <= 10.0: sys.exit(f'TOO LONG: {kind} must fit on 1 page even at 10pt. Cut items or words (the studio never goes below 10pt).')
        size -= 0.5
    for f in os.listdir('qa'):
        if f.startswith(os.path.splitext(os.path.basename(out))[0] + '-p'): os.remove(os.path.join('qa', f))
    subprocess.run(['pdftoppm', '-png', '-r', '60', out, os.path.join('qa', os.path.splitext(os.path.basename(out))[0] + '-p')], check=False)
    print(json.dumps({'pdf': out, 'pages': n, 'type': kind, 'body_pt': size if one_page else 12.5}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
