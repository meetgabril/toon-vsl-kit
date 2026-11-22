// vsl.js — toon studio film engine: story.js (beats) → shots → frames. Library of sets, props, cast, motion; formats, captions, galleries.
import { clamp, lerp, hash, seg, eo, ei, eio, back, spring, TAU } from '/core/lib.js';
import { setDry, getM, INK, W, H, CW, CH, OX, OY, SC, setView, frame, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, bands, g, S } from './toon.js';
import { C } from './cast.js';
import { peep, folk2, bfaWoman, transformFig, ARMS, CAST } from './chars2.js';
import { loadPeeps, takePending } from './peeps.js';
import { hand } from './chars.js';
import './cast.custom.js';   // your own characters (addCast) — see CHARACTERS.md
import { STORY } from './story.js';         // the film: beats → shots (docs/STORY.md)

export const FPS = 24;
let LIPS = null;
let TIMING = null;
export async function load() { LIPS = await (await fetch('/work/lips.json')).json(); try { TIMING = await (await fetch('/work/timing.json')).json(); } catch (e) {} await loadPeeps(); compileStory(); return LIPS.N; }
// —— optional burned-in captions (shorts/reels/ads): 3-word chunks from timing.json, current word highlighted ——
const CAPTIONS = { on: new URLSearchParams(location.search).get('cap') === '1', y: 1560, size: 84, chunk: 3, col: '#ffffff', hi: '#ffd66b' };
function captions(gt) {
  if (!CAPTIONS.on || !TIMING) return; const W_ = TIMING.words; let i = -1; for (let k = 0; k < W_.length && W_[k][1] - .05 <= gt; k++) i = k; if (i < 0) return;
  const c0 = i - (i % CAPTIONS.chunk), chunk = W_.slice(c0, c0 + CAPTIONS.chunk); if (gt > chunk[chunk.length - 1][2] + .4) return;
  const txt = chunk.map(w => w[0].toUpperCase()); let fs = CAPTIONS.size; g.setTransform(1, 0, 0, 1, 0, 0);
  const meas = () => { g.font = `400 ${fs}px "Bungee"`; return txt.map(t => g.measureText(t).width + fs * .55); };
  let ws = meas(), tot = ws.reduce((a, b) => a + b, 0); if (tot > 960) { fs *= 960 / tot; ws = meas(); tot = ws.reduce((a, b) => a + b, 0); }
  const font = `400 ${fs}px "Bungee"`; let x = 540 - tot / 2;
  txt.forEach((t, k) => { const on = c0 + k === i, sc = on ? 1 + .08 * (1 - Math.min(1, (gt - chunk[k][1]) / .12)) : 1;
    push(); translate(x + ws[k] / 2, CAPTIONS.y); scale(sc); text(t, 0, 0, { font, fill: on ? CAPTIONS.hi : CAPTIONS.col, outlineW: 14, outlineCol: INK }); pop(); x += ws[k]; });
}
const lip = (sp, gt) => { const f = Math.floor(gt * FPS); return LIPS && LIPS.sp[f] === sp ? LIPS.open[f] : 0; };
const mouthOf = (sp, gt, base = {}) => { const o = lip(sp, gt); const k = Math.floor(gt * 12); return { ...base, o: o > 0.06 ? o * (base.amp ?? 0.85) : 0, w: (base.w ?? 1) * (o > 0.06 ? 0.85 + 0.25 * hash(k * 1.7) : 1) }; };
const blink = (gt, seed) => { const p = 2.6 + hash(seed) * 1.8, ph = (gt + hash(seed * 3) * p) % p; return ph < 0.12; };
const visOf = (sp, gt) => { const f = Math.floor(gt * FPS); return LIPS && LIPS.vis && LIPS.sp[f] === sp ? LIPS.vis[f] : undefined; };
const nod = (sp, gt) => lip(sp, gt) * 0.035;
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const pop1 = (lt, at, d = 0.35) => back(seg(lt, at, at + d), 2.2);

// ---------- camera ----------
function cam(cx, cy, z, rot = 0) { push(); translate(W / 2, H / 2); if (rot) rotate(rot); scale(z); translate(-cx, -cy); }
const camEnd = pop;
const shake = (gt, at, amp = 14, d = 0.3) => { const k = seg(gt, at, at + d); return k > 0 && k < 1 ? [(hash(Math.floor(gt * 24)) - .5) * amp * (1 - k), (hash(Math.floor(gt * 24) + 9) - .5) * amp * (1 - k)] : [0, 0]; };

// ---------- shared props ----------
const tag = (s, col, bg) => { shape(rr(48, 70, 30 + s.length * 26, 66, 12), { fill: bg, lw: 6 }); text(s, 66, 104, { font: '400 52px "VT323"', fill: col, align: 'left' }); };
const sign = (x, y, w, h, bg, txt, { font = '400 64px "Bungee"', fg = '#fff3c4', rot = 0, ow = 10 } = {}) => { push(); translate(x, y); rotate(rot); fillOnly(rr(-w / 2 + 10, -h / 2 + 12, w, h, 18), 'rgba(20,12,30,0.28)', { boil: 0 }); shape(rr(-w / 2, -h / 2, w, h, 18), { fill: bg, lw: 7 }); text(txt, 0, 4, { font, fill: fg, outlineW: ow }); pop(); };
const coin = (x, y, r = 22, a = 0) => { push(); translate(x, y); rotate(a); shape(ell(0, 0, r, r * 0.9, 20), { fill: '#f5c842', lw: 5, shade: () => fillOnly(ell(-r * .3, -r * .2, r * .5, r * .4, 12), '#ffe38a', { boil: .3 }) }); text('$', 0, 2, { font: `400 ${r * 1.1}px "Bungee"`, fill: '#a8781a' }); pop(); };
const bill = (x, y, a = 0, s = 1) => { push(); translate(x, y); rotate(a); scale(s); shape(rr(-50, -26, 100, 52, 6), { fill: '#8fd18a', lw: 5, shade: () => fillOnly(ell(0, 0, 18, 18, 14), '#5aa857', { boil: .3 }) }); text('$', 0, 3, { font: '400 30px "Bungee"', fill: '#2f6d2f' }); pop(); };
const mug = (hp) => { push(); translate(hp[0] + 4, hp[1] - 36); shape(rr(-30, -36, 60, 72, 12), { fill: C.mug, lw: 6, shade: () => fillOnly(rect(-40, -40, 22, 90), C.mugS, { boil: .3 }) }); stroke(arc(32, 0, 16, 20, -Math.PI / 2, Math.PI / 2, 12), 7); fillOnly(ell(0, -34, 26, 6, 14), C.tea); pop(); };
const steam = (x, y, t) => { for (let k = 0; k < 2; k++) stroke(spline([[x - 10 + k * 20, y], [x - 2 + k * 20 + Math.sin(t * 3 + k) * 6, y - 22], [x - 12 + k * 20, y - 46]], false), 4, { line: '#9a8f80' }); };
const phone = (hp, scr = '#7fd3ff', txt = '') => { push(); translate(hp[0], hp[1] - 50); rotate(-.12); shape(rr(-34, -64, 68, 128, 14), { fill: '#2b2b33', lw: 6, shade: () => fillOnly(rr(-26, -54, 52, 104, 8), scr) }); if (txt) text(txt, 0, 0, { font: '400 26px "Bungee"', fill: INK }); pop(); };
const tablet = (hp) => { push(); translate(hp[0] + 10, hp[1] - 60); rotate(-.1); shape(rr(-60, -80, 120, 160, 12), { fill: '#3b3540', lw: 6, shade: () => fillOnly(rr(-50, -70, 100, 140, 8), '#ffd88a') }); for (let i = 0; i < 4; i++) stroke([[-34, -44 + i * 30], [30, -44 + i * 30]], 4); pop(); };
const chalk = (hp) => { push(); translate(hp[0] + 4, hp[1] - 24); rotate(.5); shape(rr(-8, -26, 16, 52, 6), { fill: '#ffffff', lw: 4 }); pop(); };
function poof(x, y, k, col = '#ffffff') { if (k <= 0 || k >= 1) return; const r = 30 + 60 * k; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; shape(ell(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .4, r * .45 * (1 - k * .6), r * .4 * (1 - k * .6), 14), { fill: col, lw: 5, alpha: 1 - k }); } }
function stars(x, y, k, n = 5, R = 90) { if (k <= 0 || k >= 1) return; for (let i = 0; i < n; i++) { const a = i / n * TAU + k * 2, r = R * eo(k); push(); translate(x + Math.cos(a) * r, y + Math.sin(a) * r); rotate(k * 3); shape(spline([[0, -22], [6, -6], [22, 0], [6, 6], [0, 22], [-6, 6], [-22, 0], [-6, -6]]), { fill: '#ffd66b', lw: 4, alpha: 1 - k * .5 }); pop(); } }
function arrow(a, b, col = '#e8574a', w = 12, k = 1) { const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; if (k <= 0) return; stroke([a, p], w + 8); stroke([a, p], w, { line: col }); if (k > .9) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); push(); translate(p[0], p[1]); rotate(ang); shape([[10, 0], [-26, -22], [-26, 22]], { fill: col, lw: 5 }); pop(); } }
function xMark(x, y, s, k) { if (k <= 0) return; push(); translate(x, y); scale(s * back(k, 2)); stroke([[-60, -60], [60, 60]], 34); stroke([[-60, -60], [60, 60]], 22, { line: '#e8574a' }); stroke([[60, -60], [-60, 60]], 34); stroke([[60, -60], [-60, 60]], 22, { line: '#e8574a' }); pop(); }
function check(x, y, s, k) { if (k <= 0) return; push(); translate(x, y); scale(s * back(k, 2)); stroke([[-50, 0], [-14, 40], [60, -50]], 34); stroke([[-50, 0], [-14, 40], [60, -50]], 22, { line: '#2f8f4a' }); pop(); }
function clock(x, y, r, hrs, label, face = '#ffffff') { push(); translate(x, y); shape(ell(0, 0, r, r, 40), { fill: face, lw: 7 }); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; stroke([[Math.cos(a) * r * .78, Math.sin(a) * r * .78], [Math.cos(a) * r * .9, Math.sin(a) * r * .9]], 4); } const ha = (hrs % 12) / 12 * TAU - TAU / 4, ma = ((hrs % 1) * 60) / 60 * TAU - TAU / 4; stroke([[0, 0], [Math.cos(ha) * r * .5, Math.sin(ha) * r * .5]], 9); stroke([[0, 0], [Math.cos(ma) * r * .75, Math.sin(ma) * r * .75]], 6); dot(0, 0, 8); if (label) { shape(rr(-80, r + 14, 160, 54, 12), { fill: '#2b2b33', lw: 5 }); text(label, 0, r + 42, { font: '400 46px "VT323"', fill: '#ffd66b' }); } pop(); }
const wall = (col, y0 = 0, y1 = 1300) => fillOnly(rect(-600, y0, W + 1200, y1 - y0), col, { boil: 0 });
const floorB = (col, line, y = 1300) => { fillOnly(rect(-600, y, W + 1200, 1400), col, { boil: 0 }); for (let i = 0; i < 9; i++) stroke([[-600, y + 40 + i * 95], [W + 600, y + 40 + i * 95]], 4, { line }); stroke([[-600, y], [W + 600, y]], 7); };
function door(x, y, w, h, col, label, open = 0, inside = '#fff6e0') { shape(rr(x - w / 2 - 22, y - h - 22, w + 44, h + 22, 14), { fill: '#7a5638', lw: 7 }); fillOnly(rect(x - w / 2, y - h, w, h), inside); push(); translate(x - w / 2, y); scale(1 - open * .85, 1); shape(rect(0, -h, w, h), { fill: col, lw: 7, shade: () => fillOnly(rect(0, -h, w * .14, h), 'rgba(0,0,0,0.12)') }); shape(ell(w * .82, -h * .46, 16, 16, 12), { fill: '#ffd66b', lw: 5 }); pop(); if (label) sign(x, y - h - 70, Math.max(220, label.length * 46), 92, col, label, { font: '400 56px "Bungee"' }); }

// ---------- backgrounds ----------
function bgStudio(gt) {
  wall('#efe4d2'); fillOnly(rect(-600, 980, W + 1200, 320), '#e2cfb2', { boil: 0 }); stroke([[-600, 980], [W + 600, 980]], 5);
  floorB('#c59a6c', '#a97f52');
  // before / after poster: a client's 12-week transformation
  panel(810, 510, 420, 360, '#ffffff', 18);
  text('BEFORE', 705, 362, { font: '400 30px "Bungee"', fill: '#9a8f80' }); text('AFTER', 915, 362, { font: '400 30px "Bungee"', fill: '#e8457a' });
  stroke([[810, 360], [810, 670]], 4);
  transformFig(705, 672, .72, false, gt); transformFig(915, 672, .72, true, gt);
  // dumbbell rack
  shape(rr(70, 1110, 380, 30, 8), { fill: '#3b3540', lw: 6 });
  for (let i = 0; i < 4; i++) { const x = 110 + i * 90; shape(rr(x - 34, 1060, 68, 44, 10), { fill: ['#e8574a', '#5bc0be', '#f2a541', '#9b7fd4'][i], lw: 5 }); }
  sign(260, 330, 330, 110, '#e8574a', 'TONY FIT', { font: '400 58px "Bungee"' });
}
function bgCasino(gt) {
  bands(['#22103f', '#2a1450', '#331a60', '#3c2071'], -400, 1300);
  fillOnly(rect(-600, 1290, W + 1200, 900), '#5b2a8c');
  for (let r = 0; r < 7; r++) for (let c = -2; c < 11; c++) fillOnly([[c * 130 + (r % 2) * 65, 1330 + r * 110], [c * 130 + (r % 2) * 65 + 26, 1352 + r * 110], [c * 130 + (r % 2) * 65, 1374 + r * 110], [c * 130 + (r % 2) * 65 - 26, 1352 + r * 110]], '#7a3fb0', { boil: .3 });
  stroke([[-600, 1290], [W + 600, 1290]], 7);
  for (let i = -3; i < 17; i++) shape(ell(40 + i * 78, 210, 13, 13, 12), { fill: (i + Math.floor(gt * 6)) % 2 ? '#fff3c4' : '#c99a2e', lw: 4 });
}
function adsMachine(x, y, gt, { price = '$200', year = '', on = 1 } = {}) {
  push(); translate(x, y);
  shape(rr(-250, -1000, 500, 1000, 50), { fill: on ? '#f2b632' : '#8a7a52', lw: 8, shade: () => fillOnly(rect(-280, -1020, 110, 1040), on ? '#d1931c' : '#6e6040', { boil: .4 }) });
  shape(rr(-210, -1130, 420, 170, 40), { fill: on ? '#e8574a' : '#6b4a4a', lw: 8 });
  text('ADS', 0, -1040, { font: '400 120px "Bungee"', fill: on ? '#fff3c4' : '#a89a8a', outlineW: 12 });
  shape(rr(-190, -900, 380, 300, 24), { fill: on ? '#2a1450' : '#1a1222', lw: 7 });
  if (on) { text('COST PER CLIENT', 0, -850, { font: '400 44px "VT323"', fill: '#f5c842' }); text(price, 0, -760, { font: '400 120px "VT323"', fill: '#ff6b6b' }); if (year) text(year, 0, -660, { font: '400 52px "VT323"', fill: '#c9b8ff' }); }
  shape(rr(-110, -520, 220, 44, 14), { fill: INK, lw: 4 });
  text('INSERT $', 0, -560, { font: '400 30px "Bungee"', fill: on ? '#2a1450' : '#3a3030' });
  shape(rr(-190, -300, 380, 170, 24), { fill: on ? '#d1931c' : '#6e6040', lw: 7, shade: () => fillOnly(rr(-170, -280, 340, 130, 16), '#1a1222') });
  stroke([[250, -760], [330, -760], [330, -960]], 22); stroke([[250, -760], [330, -760], [330, -960]], 12, { line: '#c9ccd2' });
  shape(ell(330, -990, 40, 40, 20), { fill: '#e8574a', lw: 7 });
  pop();
}
function bgContent(gt, night = 0) {
  bands(night ? ['#1d2a44', '#23324f', '#2a3a5a'] : ['#c8f0dc', '#b9ead2', '#a9e3c8'], -400, 1250);
  fillOnly(rect(-600, 1080, W + 1200, 170), night ? '#26365a' : '#a3dcc1', { boil: 0 }); stroke([[-600, 1080], [W + 600, 1080]], 4, { line: night ? '#1d2a44' : '#8ccbad', boil: 0 });
  // shelf with trophies + plant, framed poster
  shape(rr(40, 760, 240, 22, 6), { fill: '#a9744a', lw: 5 }); shape(rr(70, 700, 40, 60, 8), { fill: '#f5c842', lw: 4 }); shape(rr(130, 690, 50, 70, 8), { fill: '#e9ecef', lw: 4 }); shape(ell(230, 720, 40, 44, 16), { fill: '#5aa857', lw: 4 });
  panel(870, 860, 220, 280, '#fff6e8', 14); text('TONY', 870, 790, { font: '400 40px "Bungee"', fill: '#ff5b4d' }); text('FIT', 870, 840, { font: '400 40px "Bungee"', fill: '#25385c' }); dumbbell([870, 930], 0);
  fillOnly(rect(-600, 1250, W + 1200, 900), night ? '#3b5a6b' : '#7fcfab'); stroke([[-600, 1250], [W + 600, 1250]], 7);
  fillOnly(ell(540, 1640, 460, 90, 30), night ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.18)', { boil: 0 });
}
function bgOffice() { wall('#dfe7ef'); for (let i = -4; i < 14; i++) stroke([[i * 120, 0], [i * 120, 1300]], 3, { line: '#d2dce6', boil: 0 }); shape(rr(820, 1040, 160, 30, 8), { fill: '#a9744a', lw: 5 }); shape(ell(900, 990, 50, 60, 18), { fill: '#5aa857', lw: 5 }); fillOnly(rect(-600, 1300, W + 1200, 900), '#9fb3c8', { boil: 0 }); stroke([[-600, 1300], [W + 600, 1300]], 7); }
function bgBoard() {
  // explainer backdrop: deep brand navy, soft key light, dot grid, faint rings
  g.setTransform(SC, 0, 0, SC, OX, OY); const gr = g.createRadialGradient(W * .5, H * .38, 60, W * .5, H * .5, H * .85); gr.addColorStop(0, '#2c4170'); gr.addColorStop(.55, '#1f2f55'); gr.addColorStop(1, '#141f3b'); g.fillStyle = gr; g.fillRect(-OX / SC, -OY / SC, CW / SC, CH / SC);
  for (let j = -4; j < 26; j++) for (let i = -6; i < 18; i++) dot(i * 80 + 40, j * 80 + 40, 2.2, 'rgba(160,190,255,0.16)');
  for (let k = 0; k < 3; k++) stroke([...ell(540, 900, 300 + k * 190, 300 + k * 190, 96), ell(540, 900, 300 + k * 190, 300 + k * 190, 96)[0]], 2.5, { line: 'rgba(160,190,255,0.10)', boil: 0 });
}
function bgChalk() { fillOnly(rect(-600, -400, W + 1200, H + 800), '#e9dcc4', { boil: 0 }); shape(rr(60, 260, 960, 760, 20), { fill: '#2f4a3f', lw: 9, shade: () => fillOnly(rect(40, 240, 1000, 40), '#26403a') }); shape(rr(40, 1010, 1000, 40, 10), { fill: '#a9744a', lw: 6 }); floorB('#c59a6c', '#a97f52', 1500); }
function bgStreet() { bands(['#9fd8ff', '#b4e2ff', '#c9ebff'], -400, 1180); for (let i = 0; i < 3; i++) shape(ell(160 + i * 380, 300 + (i % 2) * 90, 110, 46, 20), { fill: '#ffffff', lw: 6 }); fillOnly(rect(-600, 1180, W + 1200, 900), '#b7b2a8', { boil: 0 }); stroke([[-600, 1180], [W + 600, 1180]], 7); }
function bgCommunity() { bands(['#f3e7d3', '#efe0c8', '#eadabf'], -400, 1220); for (let i = -3; i < 10; i++) stroke([[i * 170 + 40, 300], [i * 170 + 40, 1220]], 4, { line: '#dcc9a8' }); floorB('#c79a6a', '#a97f52', 1220); }
function bgBeach(gt) { bands(['#7fd3ff', '#9fdcff', '#bfe8ff'], -400, 1000); shape(ell(860, 330, 90, 90, 30), { fill: '#ffd66b', lw: 6 }); fillOnly(rect(-600, 1000, W + 1200, 240), '#3aa7c9'); for (let i = 0; i < 8; i++) stroke(spline([[i * 160 - 100 + (gt * 30) % 160, 1060 + (i % 2) * 60], [i * 160 - 50 + (gt * 30) % 160, 1046 + (i % 2) * 60], [i * 160 + (gt * 30) % 160, 1060 + (i % 2) * 60]], false), 5, { line: '#ffffff' }); fillOnly(rect(-600, 1240, W + 1200, 900), '#f2d39b'); stroke([[-600, 1240], [W + 600, 1240]], 7); }
function bgStage() {
  // Buzztorm studio set: warm slatted wall, orange LED strip, polished floor
  g.setTransform(SC, 0, 0, SC, OX, OY); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#16213a'); gr.addColorStop(.6, '#22325a'); gr.addColorStop(1, '#16213a'); g.fillStyle = gr; g.fillRect(-OX / SC, -OY / SC, CW / SC, CH / SC);
  fillOnly(rect(-600, 520, W + 1200, 800), '#5a3d2c', { boil: 0 });
  for (let i = -8; i < 22; i++) { fillOnly(rect(i * 70, 520, 46, 800), i % 2 ? '#7a5238' : '#6d4a33', { boil: 0 }); stroke([[i * 70, 520], [i * 70, 1320]], 2.5, { line: '#3f2a1e', boil: 0 }); }
  fillOnly(rect(-600, 500, W + 1200, 26), '#ff6a2a', { boil: 0 }); fillOnly(rect(-600, 470, W + 1200, 30), 'rgba(255,120,50,0.25)', { boil: 0 }); fillOnly(rect(-600, 526, W + 1200, 60), 'rgba(255,120,50,0.18)', { boil: 0 });
  stroke([[-600, 512], [W + 600, 512]], 4, { boil: 0 });
  shape(ell(540, 300, 520, 180, 40), { fill: 'rgba(255,240,200,0.07)', stroke: false });
  fillOnly(rect(-600, 1320, W + 1200, 900), '#2a2735', { boil: 0 });
  for (let i = 0; i < 5; i++) fillOnly(rect(-600, 1340 + i * 70, W + 1200, 6), 'rgba(255,255,255,0.04)', { boil: 0 });
  fillOnly(ell(540, 1400, 520, 60, 40), 'rgba(255,140,70,0.10)', { boil: 0 });
  stroke([[-600, 1320], [W + 600, 1320]], 7);
}

// ---------- characters with lip-sync ----------
// Pose filter: every shot is re-evaluated "dry" for the previous 10 frames and the characters' pose params are run through a
// critically-damped spring, so every pose change eases in with a touch of follow-through (no snapping), automatically.
let REC = null, HIST = [], CNT = { D: 0, T: 0 };
const DEF = { D: { armL: { h: [-16, 196], bend: -14 }, armR: { h: [24, 192], bend: 14 } }, T: { armL: { h: [-40, 156], bend: -18 }, armR: { h: [40, 156], bend: 20 } } };
const talkEnergy = (sp, gt) => { if (!LIPS) return 0; const f = Math.floor(gt * FPS); let a = 0; for (let k = 0; k < 14; k++) a += LIPS.sp[f - k] === sp ? LIPS.open[f - k] || 0 : 0; return a / 14; };
function flat(P) { return [P.armL.h[0], P.armL.h[1], P.armL.bend ?? 0, P.armR.h[0], P.armR.h[1], P.armR.bend ?? 0, (P.look || [0, 0])[0], (P.look || [0, 0])[1], P.lean ?? 0, P.headTilt ?? 0, P.eyes ?? 1, P.worry ?? 0, P.brow ?? 0]; }
function unflat(P, v) { return { ...P, armL: { ...P.armL, h: [v[0], v[1]], bend: v[2] }, armR: { ...P.armR, h: [v[3], v[4]], bend: v[5] }, look: [v[6], v[7]], lean: v[8], headTilt: v[9], eyes: v[10], worry: v[11], brow: v[12] }; }
function prep(sp, gt, P) {
  P = { ...DEF[sp], ...P }; P.armL = { ...(P.armL || DEF[sp].armL) }; P.armR = { ...(P.armR || DEF[sp].armR) };
  // talking hands: the free front arm gestures with the speech energy
  const e = talkEnergy(sp, gt);
  if (e > 0.02 && !P.holdR && P.armR.h[1] > 100 && !P.noGesture) { const k = clamp(e * 2.4) * (0.75 + 0.25 * Math.sin(gt * 2.7 + (sp === 'D' ? 0 : 2))); P.armR = { h: [P.armR.h[0] + 70 * k, P.armR.h[1] - 150 * k], bend: (P.armR.bend ?? 0) + 30 * k }; }
  // tiny eye saccades
  const sc = Math.floor(gt * 1.4 + (sp === 'D' ? 0 : .5)); const L = P.look || [0, 0]; P.look = [L[0] + (hash(sc * 3.7) - .5) * .18, L[1] + (hash(sc * 5.3) - .5) * .12];
  return P;
}
function smooth(sp, P) {
  const k = CNT[sp]++; const seq = HIST.map(h => h[sp][k]).filter(Boolean); if (!seq.length) return P;
  const tgt = [...seq.map(flat), flat(P)]; const w = 15, z = .72, dt = 1 / FPS;
  const x = tgt[0].slice(), v = x.map(() => 0);
  for (let j = 1; j < tgt.length; j++) for (let i = 0; i < x.length; i++) { const a = w * w * (tgt[j][i] - x[i]) - 2 * z * w * v[i]; v[i] += a * dt; x[i] += v[i] * dt; }
  return unflat(P, x);
}
const g_ = 0;
function moodOf(P, base) {
  if (P.mood) return P.mood;
  if (P.shades) return 'calm';
  if ((P.eyes ?? 1) > 1.12 && (P.worry ?? 0) > .5) return 'fear';
  if ((P.worry ?? 0) > .5 || (P.sm ?? .4) < -.1) return 'worried';
  if (P.blush) return 'hopeful';
  if ((P.sm ?? .4) >= .85) return 'happy';
  return base;
}
function ringStand(x, y, s, f, off) {   // ring light on a tripod behind the coach
  push(); translate(x - 120 * f * s, y); scale(s);
  for (const dx of [-60, 60]) stroke([[0, -560], [dx, 0]], 9, { line: '#8a8494' }); stroke([[0, -560], [0, -760]], 10, { line: '#8a8494' });
  const R = 120; stroke([...ell(0, -880, R, R, 72), ell(0, -880, R, R, 72)[0]], 34, { line: '#2e2a35' }); stroke([...ell(0, -880, R, R, 72), ell(0, -880, R, R, 72)[0]], 18, { line: off ? '#9c968a' : '#fff6d6' });
  if (!off) fillOnly(ell(0, -880, 260, 260, 40), 'rgba(255,240,200,0.10)', { boil: 0 });
  pop();
}
const sweatDrop = (x, y) => shape(spline([[x, y - 16], [x + 9, y + 4], [x, y + 12], [x - 9, y + 4]]), { fill: '#bfe9ff', lw: 5 });
const DEX = (gt, P) => {
  const Q = { x: P.x, y: P.y, s: (P.s ?? 1), face: P.face ?? 1, t: gt, noShadow: P.bust, pose: P.pose || (P.bust ? 'effigy/BlazerBlackTee' : 'standing/EasingColorPants'), blinkOff: false, mood: moodOf(P, 'calm'), open: lip('D', gt), vis: P.vis ?? visOf('D', gt), talk: talkEnergy('D', gt), tilt: P.tilt ?? (P.look ? P.look[1] * .05 : 0), faceName: P.faceName };
  peep('D', Q);
};
// Any registered character (cast.custom.js): CHAR('M', gt, { x, y, s, face, pose | bust:true, mood, tilt, acc, hold })
const CHAR = (sp, gt, P) => peep(sp, { ...P, t: gt, noShadow: P.bust || P.noShadow, mood: moodOf(P, 'smile'), open: lip(sp, gt), vis: P.vis ?? visOf(sp, gt), talk: talkEnergy(sp, gt), tilt: P.tilt ?? 0 });
// Tony is always shot from the waist up (medium shot): the bust is anchored to the frame bottom or hidden behind a prop.
const frameBottomY = () => { const m = getM(); return (CH + 30 - m[5]) / m[3]; };
// Tony v3: one consistent full body (tank + shorts; bare chest at the beach). bust:true = close-up framing of the same body.
const TONY = (gt, P) => {
  const f = P.face ?? 1, jit = P.nerv ? (hash(Math.floor(gt * 12) * 3.3) - .5) * 10 * P.nerv : 0, s = (P.s ?? 1) * (P.bust ? .25 / .275 : 1), k = .275 * s;
  const y = P.bust ? P.y + (2480 - 860) * k : P.y;
  const arms = P.run ? (Math.sin(gt * 10) > 0 ? 'runB' : 'runA') : P.arms || (P.holdR ? 'hold' : (P.armR && P.armR.h[1] < -60) ? 'point' : 'down');
  const run = P.run ? Math.abs(Math.sin(gt * 10)) * 30 * s : 0, sq = P.squat ? P.squat * 120 * s : 0;
  if (P.ringLight && !P.bust) ringStand(P.x, P.y, s, f, P.ringOff);
  peep('T', { x: P.x + jit, y: y - run + sq, s, face: f, t: gt, arms, legs: P.legs || (P.run ? 'run' : 'stand'), walkPh: gt * 10, bare: P.bare, noShadow: P.bust || P.noShadow, squat: P.squat ? P.squat * .9 : 0,
    mood: moodOf(P, 'smile'), open: P.mouth && P.mouth.o === 0 ? 0 : lip('T', gt), vis: P.mouth && P.mouth.o === 0 ? 'X' : (P.vis ?? visOf('T', gt)), talk: talkEnergy('T', gt), tilt: P.tilt ?? (P.headTilt || 0), acc: P.shades ? 'Sunglasses' : P.acc, faceName: P.faceName });
  const W = ARMS[arms].R[2]; const hx = P.x + W[0] * k * f, hy = y - (2480 - W[1]) * k;
  if (P.holdR) P.holdR([hx, hy]);
  if (P.sweat) { sweatDrop(P.x + 150 * k / .25 * f * .25 * 4, y - 2780 * k); sweatDrop(P.x - 140 * k * f, y - 2700 * k + ((gt * 1.1) % 1) * 30); }
};
const folk = (x, y, s, i, o = {}) => folk2(x, y, s, i, { t: CUR_T, ...o });
let CUR_T = 0;
const runLegs = (gt, sp = 9) => { const p = Math.sin(gt * sp); return { legL: [-40 * p, -26 * Math.max(0, p)], legR: [40 * p, -26 * Math.max(0, -p)] }; };


// ---------- v3 shared design pieces ----------
const pill = (x, y, txt, bg, fg = '#ffffff', size = 46, rot = 0) => { const w = txt.length * size * .78 + size * 1.2, h = size * 1.7; push(); translate(x, y); rotate(rot); fillOnly(rr(-w / 2 + 6, -h / 2 + 8, w, h, h / 2), 'rgba(20,12,30,0.28)', { boil: 0 }); shape(rr(-w / 2, -h / 2, w, h, h / 2), { fill: bg, lw: 6 }); text(txt, 0, 3, { font: `400 ${size}px "Bungee"`, fill: fg }); pop(); };
const panel = (x, y, w, h, fill = '#22325a', r = 34) => { fillOnly(rr(x - w / 2 + 12, y - h / 2 + 14, w, h, r), 'rgba(8,10,25,0.35)', { boil: 0 }); return shape(rr(x - w / 2, y - h / 2, w, h, r), { fill, lw: 8 }); };
const dumbbell = (hp, a = 0) => { push(); translate(hp[0], hp[1]); rotate(a); shape(rr(-46, -6, 92, 12, 5), { fill: '#9aa3ad', lw: 4 }); for (const sx of [-1, 1]) { shape(rr(sx * 46 - 14, -26, 28, 52, 8), { fill: '#3b3540', lw: 5 }); } pop(); };
function umbrella(x, y, h = 760) {
  stroke([[x, y], [x + 60, y - h]], 12, { line: '#efe6d6' }); stroke([[x, y], [x + 60, y - h]], 4);
  const cx = x + 60, cy = y - h, R = 330;
  for (let i = 0; i < 6; i++) { const a0 = Math.PI + i / 6 * Math.PI, a1 = Math.PI + (i + 1) / 6 * Math.PI; shape([[cx, cy - 26], ...arc(cx, cy + 40, R, 150, a0, a1, 8)], { fill: i % 2 ? '#fff6e6' : '#ff6a3d', lw: 6 }); }
  for (let i = 0; i < 6; i++) { const a = Math.PI + (i + .5) / 6 * Math.PI; shape(ell(cx + Math.cos(a) * R, cy + 40 + Math.sin(a) * 150 + 6, 30, 14, 12), { fill: i % 2 ? '#ff6a3d' : '#fff6e6', lw: 4 }); }
}
function lounger(x, y) {   // seat at y; backrest rising up-left behind a reclined back
  for (const lx of [x + 40, x + 400]) stroke([[lx, y + 10], [lx + 10, y + 130]], 10);
  push(); translate(x + 30, y); rotate(-2.52); shape(rr(-20, -24, 340, 40, 16), { fill: '#f2f2ee', lw: 6, shade: () => { for (let i = 0; i < 6; i++) fillOnly(rect(i * 58 - 10, -30, 29, 60), '#5bc0be', { boil: 0 }); } }); pop();
  shape(rr(x, y - 14, 460, 36, 14), { fill: '#f2f2ee', lw: 6, shade: () => { for (let i = 0; i < 8; i++) fillOnly(rect(x + i * 58, y - 20, 29, 60), '#5bc0be', { boil: 0 }); } });
}
function beachSet(gt, lt) {
  bgBeach(gt);
  umbrella(190, 1580, 720);
  // side table with a coconut drink and Tony's phone
  shape(rr(830, 1430, 150, 22, 8), { fill: '#a9744a', lw: 5 }); stroke([[905, 1452], [905, 1600]], 10);
  shape(ell(870, 1400, 34, 30, 18), { fill: '#7a4a2a', lw: 5, shade: () => fillOnly(ell(870, 1380, 30, 10, 12), '#fff6e0') }); stroke([[870, 1380], [890, 1320]], 5, { line: '#ff6a3d' });
  push(); translate(940, 1416); rotate(.08); shape(rr(-30, -12, 60, 22, 6), { fill: '#2b2b33', lw: 4 }); pop();
}
const LOUNGE = { x: 560, y: 1800, s: 1.0, face: 1, bare: true, arms: 'hips' };
function beachChair(x, y) {   // low beach chair seen from the front: frame + striped canvas covers the lower body
  for (const dx of [-220, 220]) stroke([[x + dx, y - 150], [x + dx * 1.05, y + 140]], 14, { line: '#8a5a3a' });
  shape([[x - 230, y - 140], [x + 230, y - 140], [x + 240, y + 60], [x - 240, y + 60]], { fill: '#ffffff', lw: 8, shade: () => { for (let i = 0; i < 6; i++) fillOnly(rect(x - 240 + i * 80, y - 150, 40, 220), '#4fc3c0', { boil: 0 }); } });
  shape(rr(x - 270, y - 160, 80, 30, 10), { fill: '#a9744a', lw: 6 }); shape(rr(x + 190, y - 160, 80, 30, 10), { fill: '#a9744a', lw: 6 });
}


// ---------- recording setups ----------
function tripod(x, y, h, s = 1) { push(); translate(x, y); scale(s); for (const dx of [-80, 80]) stroke([[0, -h + 60], [dx, 0]], 9, { line: '#2b2b33' }); stroke([[0, -h + 60], [0, 18]], 9, { line: '#2b2b33' }); shape(rr(-16, -h + 40, 32, 40, 8), { fill: '#3b3540', lw: 5 }); pop(); }
function recDot(x, y, gt, label = 'REC') { const on = Math.floor(gt * 2) % 2 === 0; shape(rr(x - 70, y - 26, 140, 52, 26), { fill: '#1d1b24', lw: 5 }); shape(ell(x - 38, y, 12, 12, 12), { fill: on ? '#ff3b30' : '#6b2a2a', lw: 3 }); text(label, x + 14, y + 2, { font: '400 34px "Bungee"', fill: '#ffffff' }); }
function phoneRig(x, y, gt, label = 'REC', s = 1) {   // phone in a ring light on a tripod
  tripod(x, y, 520, s); push(); translate(x, y - 560 * s); scale(s);
  fillOnly(ell(0, 0, 210, 210, 40), 'rgba(255,240,200,0.14)', { boil: 0 });
  stroke([...ell(0, 0, 120, 120, 72), ell(0, 0, 120, 120, 72)[0]], 34, { line: '#2e2a35' }); stroke([...ell(0, 0, 120, 120, 72), ell(0, 0, 120, 120, 72)[0]], 18, { line: '#fff6d6' });
  shape(rr(-34, -62, 68, 124, 12), { fill: '#1d1b24', lw: 5, shade: () => fillOnly(rr(-27, -54, 54, 108, 8), '#ff8f8f') });
  pop(); recDot(x, y - 760 * s, gt, label);
}
function cameraRig(x, y, gt, s = 1, flip = 1) {   // pro camera on a tripod
  tripod(x, y, 560, s); push(); translate(x, y - 600 * s); scale(s * flip, s);
  shape(rr(-120, -80, 200, 150, 22), { fill: '#2b2b33', lw: 7 }); shape(rr(-60, -112, 90, 36, 10), { fill: '#3b3540', lw: 5 });
  shape(rr(70, -50, 90, 90, 16), { fill: '#3b3540', lw: 6 }); shape(ell(170, -5, 30, 52, 20), { fill: '#3b3540', lw: 6, shade: () => { fillOnly(ell(176, -5, 22, 40, 18), '#5a7fa8'); fillOnly(ell(170, -20, 7, 12, 10), 'rgba(255,255,255,0.7)'); } });
  shape(rr(-140, -50, 30, 80, 8), { fill: '#3b3540', lw: 5 });
  pop(); recDot(x - 10 * s, y - 760 * s, gt);
}
function softbox(x, y, s = 1, flip = 1) { tripod(x, y, 700, s); push(); translate(x, y - 760 * s); scale(s * flip, s); rotate(-.35); fillOnly(ell(-60, 60, 260, 200, 30), 'rgba(255,245,220,0.12)', { boil: 0 }); shape([[-130, -150], [60, -60], [60, 60], [-130, 150]], { fill: '#fffaf0', lw: 7 }); shape(rr(60, -40, 40, 80, 10), { fill: '#2b2b33', lw: 5 }); pop(); }


// front-view treadmill: back layer (belt toward camera) + front layer (console + uprights)
function treadBack(x, y, s, gt, speed = 1) {
  push(); translate(x, y); scale(s);
  shape([[-170, -60], [170, -60], [250, 130], [-250, 130]], { fill: '#2b2b33', lw: 7 });
  for (let i = 0; i < 6; i++) { const k = ((i / 6) + gt * speed * 1.6) % 1, yy = lerp(-55, 125, k), w = lerp(165, 245, k); stroke([[-w, yy], [w, yy]], 4, { line: '#46424f', boil: 0 }); }
  shape([[-260, 130], [260, 130], [270, 170], [-270, 170]], { fill: '#3b3540', lw: 6 });
  pop();
}
function treadFront(x, y, s, label, val) {
  push(); translate(x, y); scale(s);
  for (const sx of [-1, 1]) { stroke([[sx * 240, 140], [sx * 215, -300]], 18); stroke([[sx * 240, 140], [sx * 215, -300]], 10, { line: '#9aa3ad' }); }
  stroke([[-215, -300], [-150, -330]], 14, { line: '#2b2b33' }); stroke([[215, -300], [150, -330]], 14, { line: '#2b2b33' });
  shape(rr(-170, -400, 340, 96, 20), { fill: '#2b2b33', lw: 7, shade: () => fillOnly(rr(-140, -386, 280, 68, 12), '#14121a') });
  text(label, 0, -365, { font: '400 36px "VT323"', fill: '#ff6b6b' }); text(val, 0, -334, { font: '400 28px "VT323"', fill: '#5bd0c9' });
  pop();
}

// =================== SHOTS (built by the director from story.js) ===================
const SH = [];
const shot = (t0, fn) => SH.push([t0, fn]);   // hand-written shots still work: shot(12.5, (lt, gt) => { ... })
const twoDoors = (lt, gt, open1 = 0, open2 = 0) => {
  wall('#e9dcc4'); floorB('#c59a6c', '#a97f52', 1380);
  door(300, 1380, 300, 560, '#9b5fd4', 'ADS', open1, '#3c2071'); door(780, 1380, 300, 560, '#5bc0a0', 'CONTENT', open2, '#b9ead2');
};
function gymFront(t) {
  // golden-hour sky + skyline
  g.setTransform(SC, 0, 0, SC, OX, OY); const sky = g.createLinearGradient(0, 0, 0, H * .7); sky.addColorStop(0, '#9ccfee'); sky.addColorStop(1, '#f6d9b0'); g.fillStyle = sky; g.fillRect(-OX / SC, -OY / SC, CW / SC, CH / SC);
  for (let i = 0; i < 9; i++) fillOnly(rect(-200 + i * 170, 380 - (i * 37 % 5) * 50, 150, 900), i % 2 ? '#b9c7d6' : '#a9b8c9', { boil: 0 });
  // facade: charcoal with a slatted wood panel
  shape(rect(40, 300, 1000, 960), { fill: '#2b2d36', lw: 8 });
  shape(rect(40, 300, 1000, 210), { fill: '#3a2f2a', lw: 6, shade: () => { for (let i = 0; i < 26; i++) fillOnly(rect(40 + i * 40, 300, 22, 210), i % 2 ? '#8a5a3a' : '#7a4e32', { boil: 0 }); } });
  // channel-letter sign with glow
  fillOnly(ell(540, 405, 300, 90, 30), 'rgba(255,120,50,0.25)', { boil: 0 });
  text('PULSE', 540, 412, { font: '400 120px "Bungee"', fill: '#fff6ea', outlineW: 10, outlineCol: '#ff6a2a' });
  shape(rr(830, 370, 140, 64, 14), { fill: '#ff6a2a', lw: 5 }); text('24/7', 900, 404, { font: '400 40px "Bungee"', fill: '#ffffff' });
  // big glass front with a warm, busy interior
  const glass = (x0, x1) => shape(rect(x0, 560, x1 - x0, 620), { fill: '#f7d9a8', lw: 8, shade: () => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    fillOnly(rect(x0, 560, x1 - x0, 90), '#fbe6c4', { boil: 0 }); for (let k = 0; k < 3; k++) fillOnly(ell(x0 + 80 + k * 120, 600, 34, 10, 12), '#fff7e0', { boil: 0 });
    fillOnly(rect(x0, 1080, x1 - x0, 100), '#c9a074', { boil: 0 });
    // treadmills (side view) and a rack
    for (let k = 0; k < 2; k++) { const tx = x0 + 70 + k * 190; shape(rr(tx - 10, 1050, 170, 30, 10), { fill: '#3b3540', lw: 5 }); stroke([[tx + 140, 1050], [tx + 150, 920]], 9, { line: '#3b3540' }); shape(rr(tx + 118, 890, 60, 38, 8), { fill: '#2b2b33', lw: 4, shade: () => fillOnly(rr(tx + 124, 896, 48, 26, 6), '#5bd0c9') }); }
    for (let k = 0; k < 2; k++) { const fx = x0 + 128 + k * 190, b = Math.abs(Math.sin(t * 7 + k + x0)) * 8; folk(fx, 1050 - b, .62, k + (x0 > 300 ? 4 : 0), { walk: t * 12 + k, face: 1 }); }
    fillOnly([[x0 + 40, 560], [x0 + 140, 560], [x0 - 20, 1180], [x0 - 120, 1180]], 'rgba(255,255,255,0.28)', { boil: 0 }); fillOnly([[x0 + 190, 560], [x0 + 230, 560], [x0 + 70, 1180], [x0 + 30, 1180]], 'rgba(255,255,255,0.18)', { boil: 0 });
  } });
  glass(80, 440); glass(640, 1000);
  for (const x of [80, 440, 640, 1000]) stroke([[x, 560], [x, 1180]], 10, { line: '#1d1e25' });
  // entrance
  shape(rect(460, 620, 160, 600), { fill: '#1d1e25', lw: 7, shade: () => fillOnly(rect(476, 636, 128, 580), '#cfe6f5') }); stroke([[590, 860], [590, 980]], 8, { line: '#c9ccd2' });
  shape(rr(440, 1220, 200, 26, 8), { fill: '#3b3540', lw: 5 });
  for (const px of [395, 685]) { for (let k = 0; k < 7; k++) stroke(spline([[px - 30 + k * 10, 1150], [px - 40 + k * 14, 1060 - (k % 3) * 20], [px - 60 + k * 20, 1000 - (k % 2) * 30]], false), 6, { line: k % 2 ? '#5aa857' : '#4a9348' }); shape(rr(px - 46, 1140, 92, 110, 14), { fill: '#e9e4da', lw: 6 }); }
  // sidewalk + street with a crosswalk
  fillOnly(rect(-600, 1260, W + 1200, 270), '#d8d2c6', { boil: 0 }); for (let i = -4; i < 14; i++) stroke([[i * 140, 1260], [i * 140 - 30, 1530]], 3, { line: '#c4bcac', boil: 0 }); stroke([[-600, 1395], [W + 600, 1395]], 3, { line: '#c4bcac', boil: 0 });
  stroke([[-600, 1260], [W + 600, 1260]], 7); shape(rect(-600, 1530, W + 1200, 26), { fill: '#bdb4a3', lw: 6 });
  fillOnly(rect(-600, 1556, W + 1200, 600), '#4c4b57', { boil: 0 }); for (let i = 0; i < 7; i++) fillOnly(rect(80 + i * 140, 1620, 80, 300), '#eeeae0', { boil: 0 });
}
// =================== DIRECTOR: story.js → shots ===================
// A film is a list of beats. Each beat = one shot, anchored to a word of the voiceover. Grammar in docs/STORY.md.
const SLOT = { LL: 150, L: 290, C: 540, R: 790, RR: 930 };
const POS = { top: [540, 330], high: [540, 560], mid: [540, 820], low: [540, 1480], L: [290, 820], R: [790, 820], UL: [290, 460], UR: [790, 460], LL: [290, 1400], LR: [790, 1400] };
const MOODS = new Set(['calm', 'smile', 'happy', 'serious', 'worried', 'fear', 'awe', 'hopeful', 'driven', 'sad', 'cheeky', 'tired', 'sleep', 'blank']);
const POSES = { stand: 'standing/EasingColorPants', point: 'standing/PointingFingerColorPants', cross: 'standing/CrossArmColorPants', blazer: 'standing/BlazerColorPants', walk: 'standing/WalkingColorPants', rest: 'standing/RestingColorPants', shirt: 'standing/ShirtColorPants', sit: 'sitting/MidColorPants', dancer: 'standing/Dancer' };
const COL = { navy: '#25385c', orange: '#ff6a2a', gold: '#ffd66b', cream: '#fff6e0', green: '#2f8f4a', red: '#e8574a', teal: '#5bc0be', violet: '#a974e0', coral: '#ff5b4d', ink: '#17141c', pink: '#ff8fc7', blue: '#4f6db8' };
const col = (c, d) => c ? (COL[c] || c) : d;
const SETFN = {
  studio: gt => bgStudio(gt), content: gt => bgContent(gt, 0), night: gt => bgContent(gt, 1), casino: gt => bgCasino(gt), board: () => bgBoard(), chalk: () => bgChalk(),
  street: () => bgStreet(), gym: gt => gymFront(gt), community: () => bgCommunity(), beach: gt => { bgBeach(gt); beachSet(gt, 0); }, sea: gt => bgBeach(gt), stage: () => bgStage(), office: () => bgOffice(),
  doors: gt => twoDoors(0, gt, 0, 0),
};
const EVENTS = [], WIPES = [];
const nw = s => String(s).toLowerCase().replace(/[^a-z0-9à-ÿ']/g, '').replace(/'/g, '');
function findWords(phrase, from) {
  const W = TIMING ? TIMING.words : [], toks = phrase.split(/[\s_]+/).map(nw).filter(Boolean);
  for (let i = Math.max(0, from); i < W.length; i++) {
    let ok = true; for (let k = 0; k < toks.length; k++) if (!W[i + k] || nw(W[i + k][0]) !== toks[k]) { ok = false; break; }
    if (ok) return i;
  }
  return -1;
}
// anchor: number (s) | '+0.5' (after beat start) | 'L4' (start of script line 4) | 'word' / 'two words' (+/-offset) — searched forward from the cursor
function anchor(a, cur, base) {
  if (a == null || a === '') return { t: base, idx: cur };
  if (typeof a === 'number') return { t: a, idx: cur };
  if (/^\+[\d.]+$/.test(a)) return { t: base + parseFloat(a), idx: cur };
  if (/^L\d+$/.test(a)) { const l = TIMING.lines[+a.slice(1)]; return { t: l.t0 - 1 / FPS, idx: TIMING.words.findIndex(w => w[3] === l.i) }; }
  let off = 0; const m = String(a).match(/^(.*?)\s*([+-][\d.]+)$/); if (m && m[1]) { a = m[1]; off = parseFloat(m[2]); }
  const i = findWords(a, cur); if (i < 0) { console.warn('anchor not found:', a); return { t: base, idx: cur }; }
  return { t: TIMING.words[i][1] + off - 1.5 / FPS, idx: i };
}
function parseActor(s) {
  const t = s.trim().split(/\s+/), A = { who: t[0], slot: 'C', size: 'wide', flags: {} };
  for (const w of t.slice(1)) {
    if (SLOT[w] != null) A.slot = w; else if (/^x=/.test(w)) A.x = +w.slice(2); else if (/^y=/.test(w)) A.y = +w.slice(2);
    else if (['far', 'wide', 'med', 'cu', 'tiny'].includes(w)) A.size = w; else if (MOODS.has(w)) A.mood = w;
    else if (w === '<' || w === '>') A.face = w === '<' ? -1 : 1; else if (/^enter[<>]$/.test(w)) A.enter = w.endsWith('>') ? 1 : -1;
    else if (/^@/.test(w)) A.at = w.slice(1).replace(/_/g, ' '); else if (ARMS[w] || POSES[w] || w.includes('/')) A.pose = w; else A.flags[w] = true;
  }
  return A;
}
function parseItem(s) {
  const toks = [...s.matchAll(/"([^"]*)"|(\S+)/g)].map(m => m[1] != null ? { q: m[1] } : m[2]);
  const I = { type: toks[0], txt: [], kv: {}, pos: null, at: null, flags: {} };
  for (const t of toks.slice(1)) {
    if (typeof t === 'object') I.txt.push(t.q);
    else if (t.startsWith('@')) I.at = t.slice(1).replace(/_/g, ' ');
    else if (/^[a-z]+=/.test(t)) { const [k, ...v] = t.split('='); I.kv[k] = v.join('=').replace(/_/g, ' '); }
    else if (POS[t]) I.pos = t; else if (/^-?\d+>-?\d+$/.test(t)) I.range = t.split('>').map(Number); else if (/^\d+$/.test(t)) I.n = +t; else I.flags[t] = true;
  }
  return I;
}
const pk = (dt, d = .35) => dt < 0 ? 0 : back(clamp(dt / d), 2.2);   // pop-in scale
function headPos(A) {   // where the actor's face is on screen (for close-up camera)
  const x = A.x ?? SLOT[A.slot]; if (A.size === 'cu') return [x, 1150];
  const s = { far: .55, wide: .95, med: 1.35, tiny: .4 }[A.size] ?? .95, y = A.y ?? { far: 1500, wide: 1820, med: 2150, tiny: 1400 }[A.size];
  return [x, y - 2300 * .275 * s];
}
function drawActor(A, lt, gt, n) {
  const x0 = A.x ?? SLOT[A.slot]; let x = x0, walking = false;
  if (A.enter) { const k = clamp(lt / 1.0); x = lerp(A.enter < 0 ? -260 : 1340, x0, eio(k)); walking = k < 1; }
  const face = A.face ?? (walking ? -A.enter : x0 < 520 ? 1 : x0 > 560 ? -1 : 1), F = A.flags;
  const sz = { far: [.55, 1500], wide: [.95, 1820], med: [1.35, 2150], tiny: [.4, 1400] }[A.size] || [.95, 1820];
  const y = A.y ?? sz[1];
  if (A.who === 'T') {
    const P = { x, face, mood: A.mood, bare: F.bare, shades: F.shades, run: F.run, sweat: F.sweat, nerv: F.nervous ? 1 : 0, ringLight: F.ring };
    if (ARMS[A.pose]) P.arms = A.pose;
    if (A.size === 'cu') Object.assign(P, { bust: true, y: 1960, s: n > 1 ? 2.6 : 3.8 }); else Object.assign(P, { y, s: sz[0] });
    if (walking) P.legs = 'walk';
    if (F.tread) treadBack(x, P.y - 75 * P.s, 1.05 * P.s, gt, F.run ? 1 : 0);
    TONY(gt, P);
    if (F.tread) treadFront(x, P.y - 75 * P.s, 1.05 * P.s, A.flags.business ? 'BUSINESS' : 'SPEED', F.run ? '9.0' : '0.0');
  } else if (A.who === 'D' || CAST[A.who]) {
    const P = { x, face, mood: A.mood, look: [face * .3, 0] };
    if (A.pose) P.pose = POSES[A.pose] || A.pose;
    if (A.size === 'cu') Object.assign(P, { bust: true, y: 1940, s: n > 1 ? 2.6 : 3.8, pose: P.pose && P.pose.startsWith('effigy') ? P.pose : undefined }); else Object.assign(P, { y, s: sz[0] });
    A.who === 'D' ? DEX(gt, P) : CHAR(A.who, gt, P);
  } else if (/^folk/.test(A.who)) {
    const i = +(A.who.split(':')[1] || 0); folk(x, y, sz[0] * 1.6, i, { walk: walking || F.walk ? gt * 10 + i : 0, face, happy: A.mood === 'sad' || A.mood === 'worried' ? 0 : 1 });
  } else if (A.who === 'client') transformFig(x, y, sz[0] * 1.05, !!F.after, gt, !!F.sport);
}
// —— items ——
const ITEM = {
  title(I, x, y, d) { const k = pk(d); if (!k) return; push(); translate(x, y); rotate(-.03); scale(k); text(I.txt[0] || '', 0, 0, { font: `400 ${I.kv.size || 110}px "Bungee"`, fill: col(I.kv.color, '#fff6e0'), outlineW: 14, outlineCol: INK }); pop(); },
  sign(I, x, y, d) { const k = pk(d); if (!k) return; const t = I.txt[0] || '', fs = +(I.kv.size || 64), w = t.length * fs * .72 + fs * 1.6; push(); translate(x, y); scale(k); sign(0, 0, w, fs * 1.9, col(I.kv.bg, '#e8574a'), t, { font: `400 ${fs}px "Bungee"`, rot: -.02 }); pop(); },
  pill(I, x, y, d) { const k = pk(d); if (!k) return; push(); translate(x, y); scale(k); pill(0, 0, I.txt[0] || '', col(I.kv.bg, '#5bc0be'), '#ffffff', +(I.kv.size || 46)); pop(); },
  sub(I, x, y, d) { const k = pk(d, .25); if (!k) return; const t = I.txt[0] || ''; push(); translate(540, 1650); scale(k); shape(rr(-t.length * 15 - 50, -48, t.length * 30 + 100, 96, 26), { fill: '#25385c', lw: 7 }); text(t, 0, 3, { font: '800 46px "Baloo 2"', fill: '#ffffff' }); pop(); },
  counter(I, x, y, d) {
    const k = pk(d); if (!k) return; const [a, b] = I.range || [0, 100], dur = +(I.kv.dur || 1.6), v = Math.round(lerp(a, b, ss(clamp((d - .2) / dur))));
    push(); translate(x, y); scale(k); text((I.kv.pre || '') + v.toLocaleString('en-US') + (I.kv.post || ''), 0, 0, { font: `400 ${I.kv.size || 150}px "Bungee"`, fill: col(I.kv.color, '#2f8f4a'), outlineW: 12, outlineCol: '#fff6e0' });
    if (I.txt[0]) text(I.txt[0], 0, 120, { font: '400 50px "Bungee"', fill: '#25385c', outlineW: 8, outlineCol: '#fff6e0' }); pop();
  },
  phone(I, x, y, d) {   // phone answering a question: checking… → buzz → counter + notification pills
    const k = pk(d); if (!k) return; const hit = +(I.kv.hit || .9), fl = ss(clamp((d - hit) / 1.0)), buzz = d > hit && d < hit + .5 ? Math.sin(d * 90) * 6 * (1 - (d - hit) / .5) : 0;
    const notif = (I.kv.notif || 'New lead,New member').split(','), [a, b] = I.range || [0, 47];
    push(); translate(x + buzz, y); rotate(-.1); scale(k * (+(I.kv.scale || 1)));
    shape(rr(-140, -250, 280, 500, 36), { fill: '#1d1b24', lw: 9, shade: () => {
      fillOnly(rr(-120, -226, 240, 452, 22), '#fff6e0'); fillOnly(rr(-120, -226, 240, 70, 22), '#25385c'); text(I.txt[0] || 'NEW LEADS', 0, -190, { font: '400 30px "Bungee"', fill: '#ffffff' });
      if (d < hit) { for (let i = 0; i < 3; i++) dot(-34 + i * 34, -60, 9 + 5 * Math.max(0, Math.sin(d * 9 - i * .9)), '#8a8494'); text('checking...', 0, 10, { font: '800 30px "Baloo 2"', fill: '#8a8494' }); }
      else { text((b >= a ? '+' : '') + Math.round(lerp(a, b, fl)), 0, -95, { font: '400 92px "Bungee"', fill: '#2f8f4a' });
        for (let i = 0; i < 4; i++) { const kk = clamp((d - hit - .1 - i * .18) / .22); if (kk <= 0) continue; const lb = notif[i % notif.length]; push(); translate((1 - eo(kk)) * 160, -10 + i * 56); shape(rr(-104, -22, 208, 44, 14), { fill: '#ffffff', lw: 4 }); dot(-84, 0, 10, i % 2 ? '#ff6a2a' : '#5bc0be'); text(lb, 14, 2, { font: '800 24px "Baloo 2"', fill: INK }); pop(); } }
    } }); pop(); if (d > hit) stars(x, y - 200, clamp((d - hit - .2) / .8), 6, 220);
  },
  card(I, x, y, d) {   // UI card: title + value (+ stamp) + optional avatar of a cast member
    const k = pk(d); if (!k) return; push(); translate(x, y); scale(k);
    shape(rr(-330, -130, 660, 260, 30), { fill: '#fff6e0', lw: 9, shade: () => fillOnly(rect(-340, -140, 680, 80), '#25385c') });
    text(I.txt[0] || '', 0, -96, { font: '400 40px "Bungee"', fill: '#ffffff' }); text(I.txt[1] || '', I.kv.avatar ? 70 : 0, 30, { font: '400 74px "Bungee"', fill: col(I.kv.color, '#2f8f4a') });
    if (I.kv.avatar) { shape(ell(-220, 30, 70, 70, 40), { fill: '#e6dccb', lw: 6 }); g.save(); const P = new Path2D(); const m = getM(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); P.ellipse(-220, 30, 66, 66, 0, 0, TAU); g.clip(P); const sv = getM(); I.kv.avatar === 'T' ? TONY(CUR_T, { bust: true, x: -220, y: 150, s: .9, mood: 'smile', arms: 'down' }) : DEX(CUR_T, { bust: true, x: -220, y: 150, s: .9 }); g.restore(); }
    pop();
  },
  stamp(I, x, y, d) { if (d < 0) return; const k = clamp(d / .3); push(); translate(x, y); rotate(-.1); scale(lerp(2.0, 1, eo(k))); const t = I.txt[0] || 'DONE', w = t.length * 52 + 80; const c = col(I.kv.color, '#e8574a'); stroke(rr(-w / 2, -60, w, 120, 14).concat([[-w / 2 + 14, -60]]), 10, { line: c }); text(t, 0, 6, { font: '400 84px "Bungee"', fill: c }); pop(); },
  list(I, x, y, d, ts) { const it = (I.txt[0] || '').split('|'); it.forEach((t, i) => { const dd = ts ? CUR_T - ts[i] : d - i * .45; const k = pk(dd); if (!k) return; push(); translate(x, y + i * 120); scale(k); pill(0, 0, t, [COL.teal, COL.orange, COL.violet, COL.green, COL.blue, COL.red][i % 6]); pop(); }); },
  check(I, x, y, d) { check(x, y, +(I.kv.s || 1.4), clamp(d / .35)); },
  x(I, x, y, d) { xMark(x, y, +(I.kv.s || 1.4), clamp(d / .35)); },
  arrow(I, x, y, d) { const a = POS[I.kv.from] || [200, 800], b = POS[I.kv.to] || [880, 800]; arrow(a, b, col(I.kv.color, '#e8574a'), 12, ss(clamp(d / .5))); },
  crowd(I, x, y, d) { const n = I.n || 9, cols = Math.ceil(Math.sqrt(n)); for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols), k = clamp((d - i * .08) / .25); if (k <= 0) continue; folk(160 + c * (760 / Math.max(1, cols - 1)), +(I.kv.y || 1450) + r * 200, +(I.kv.s || .75), i + 3, { happy: I.flags.sad ? 0 : 1, face: c < cols / 2 ? 1 : -1 }); } },
  walkers(I, x, y, d) { const n = I.n || 4; for (let i = 0; i < n; i++) { const ph = ((d * .22 + i / n) % 1); folk(lerp(-140, 1220, ph), 1780 + (i % 2) * 30, .72, i + 1, { walk: CUR_T * 10 + i, face: 1 }); } },
  money(I, x, y, d) { if (d < 0) return; for (let i = 0; i < 14; i++) { const ph = (d * .7 + hash(i) ) % 1; bill(x - 300 + hash(i * 3) * 600, -100 + ph * 2000, Math.sin(CUR_T * 3 + i) * .6, .9); } },
  confetti(I, x, y, d) { if (d < 0 || d > 3) return; for (let i = 0; i < 60; i++) { const vx = (hash(i) - .5) * 900, vy = -900 - hash(i * 7) * 700, t = d; const px = x + vx * t, py = y + vy * t + 900 * t * t; push(); translate(px, py); rotate(t * 6 + i); fillOnly(rect(-10, -5, 20, 10), [COL.orange, COL.gold, COL.teal, COL.violet, COL.red][i % 5], { boil: 0 }); pop(); } },
  stars(I, x, y, d) { stars(x, y, clamp(d / .9), I.n || 7, +(I.kv.r || 180)); },
  poof(I, x, y, d) { poof(x, y, clamp(d / .4)); },
  flash(I, x, y, d) { if (d < 0 || d > .25) return; fillOnly(rect(-600, -400, W + 1200, H + 800), `rgba(255,255,255,${.9 * (1 - d / .25)})`, { boil: 0 }); },
  ba(I, x, y, d) { const after = d >= 0; transformFig(x, I.kv.y ? +I.kv.y : 1700, +(I.kv.s || 1), after, CUR_T, !!I.flags.sport); poof(x, (I.kv.y ? +I.kv.y : 1700) - 250, clamp(d / .4)); stars(x, (I.kv.y ? +I.kv.y : 1700) - 300, clamp((d - .1) / .7), 6, 160); },
  prop(I, x, y, d) {
    const k = pk(d); if (!k) return; const n = I.txt[0] || Object.keys(I.flags)[0] || '', s = +(I.kv.s || 1); push(); translate(x, y); scale(k * s);
    ({ dumbbell: () => dumbbell([0, 0], -.2), mug: () => { mug([0, 40]); steam(0, -50, CUR_T); }, clock: () => clock(0, 0, 120, +(I.kv.h || 9), I.kv.label || ''), umbrella: () => umbrella(0, 300, 700),
       camera: () => cameraRig(0, 400, CUR_T, 1), phonerig: () => phoneRig(0, 400, CUR_T, 'REC', 1), softbox: () => softbox(0, 400, 1), ads: () => adsMachine(0, 300, CUR_T, { price: I.kv.price || '$200', year: I.kv.year || '', on: I.flags.off ? 0 : 1 }),
       door: () => door(0, 250, 220, 380, col(I.kv.color, '#a974e0'), I.kv.label || '', +(I.kv.open || 0)), tripod: () => tripod(0, 300, 420, 1), coin: () => coin(0, 0, 40), bill: () => bill(0, 0, -.2, 1.5), clockface: () => clock(0, 0, 120, 3, '') }[n] || (() => text(n, 0, 0, { font: '400 40px "Bungee"', fill: INK })))();
    pop();
  },
  year(I, x, y, d) { const k = pk(d); if (!k) return; push(); translate(x, y); rotate(-.04); scale(k); shape(rr(-300, -150, 600, 300, 18), { fill: '#f3e6c8', lw: 8, shade: () => fillOnly(rect(-300, 90, 600, 60), '#e2cfa4') }); text(I.txt[0] || '1888', 0, -20, { font: '400 150px "Bungee"', fill: '#3b2a1a' }); if (I.txt[1]) text(I.txt[1], 0, 118, { font: '800 40px "Baloo 2"', fill: '#5a4630' }); pop(); },
  label(I, x, y, d) { const k = pk(d, .2); if (!k) return; push(); translate(x, y); rotate(-.05); scale(k); const t = I.txt[0] || 'YEP. THAT\'S ME.', w = t.length * 30 + 80; shape(rr(-w / 2, -55, w, 110, 12), { fill: '#ffd66b', lw: 8 }); text(t, 0, 4, { font: '400 52px "Bungee"', fill: INK }); pop(); },
  fn(I, x, y, d) { const f = STORY.fns && STORY.fns[I.txt[0] || Object.keys(I.flags)[0]]; if (f && d >= 0) f(d, CUR_T, API); },
};
const DEFPOS = { year: 'high', label: 'low', title: 'top', sign: 'top', pill: 'high', sub: 'low', counter: 'mid', phone: 'R', card: 'high', stamp: 'mid', list: 'UR', check: 'R', x: 'R', crowd: 'mid', walkers: 'low', money: 'mid', confetti: 'mid', stars: 'mid', poof: 'mid', flash: 'mid', ba: 'R', prop: 'R', fn: 'mid', arrow: 'mid' };
const SFX_OF = { year: 'stamp', label: 'scratch', title: 'pop', sign: 'pop', pill: 'pop', sub: 'click', counter: 'count', phone: 'notif', card: 'pop', stamp: 'stamp', list: 'pop', check: 'ding', x: 'buzz', crowd: 'pops', walkers: 'steps', money: 'chaching', confetti: 'cheer', stars: 'sparkle', poof: 'pop', flash: 'whoosh', ba: 'sparkle', prop: 'pop', arrow: 'whoosh' };
const API = { push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, text, dot, pill, sign, TONY, DEX, CHAR, folk, stars, poof, check, xMark, arrow, ss, eo, back, seg, lerp, clamp, COL };
function compileStory() {
  if (!STORY || !STORY.beats || !TIMING) return;
  SH.length = 0; let cur = 0; const dur = LIPS.N / FPS;
  STORY.beats.forEach((B, bi) => {
    const A = anchor(B.at, cur, bi === 0 ? 0 : SH.length ? SH[SH.length - 1][0] + .5 : 0); cur = Math.max(cur, A.idx + 1);
    const t0 = bi === 0 ? 0 : A.t, actors = (B.cast ? (Array.isArray(B.cast) ? B.cast : B.cast.split('|')) : []).map(parseActor);
    actors.forEach(a => { if (a.at) { const r = anchor(a.at, A.idx, t0); a.t = r.t; } });
    const items = (B.items || []).map(s => { const I = parseItem(s); const r = anchor(I.at, A.idx, t0); I.t = I.at ? r.t : t0 + (I.kv.delay ? +I.kv.delay : .25); if (I.kv.at2) I.ts = I.kv.at2.split('|').map(w => anchor(w, A.idx, t0).t); return I; });
    if (B.list) { /* list shorthand */ }
    B._t0 = t0; B._actors = actors; B._items = items;
    EVENTS.push({ t: t0, type: 'cut', music: B.music || null, beat: bi });
    if (B.wipe) { WIPES.push([t0 - .55, t0 + .55]); EVENTS.push({ t: t0 - .5, type: 'portal' }); }
    items.forEach(I => { const e = SFX_OF[I.type]; if (e && !I.flags.silent) EVENTS.push({ t: I.t, type: e, dur: +(I.kv.dur || 1.6), hit: +(I.kv.hit || .9) }); if (I.ts) I.ts.forEach(t => EVENTS.push({ t, type: 'pop' })); });
    actors.forEach(a => { if (a.enter) EVENTS.push({ t: t0, type: 'whoosh' }); });
    if (B.sfx) (Array.isArray(B.sfx) ? B.sfx : [B.sfx]).forEach(s => { const [n, w] = s.split('@'); EVENTS.push({ t: w ? anchor(w.replace(/_/g, ' '), A.idx, t0).t : t0, type: n }); });
    SH.push([t0, (lt, gt) => drawBeat(B, lt, gt)]);
  });
  EVENTS.push({ t: dur, type: 'end' });
}
function drawBeat(B, lt, gt) {
  const n = B._actors.filter(a => !a.at || gt >= a.t).length;
  // camera: push (default, done globally) | pull | cu:<who> | still | tilt
  let cx = 540, cy = 960, z = 1; const cm = B.cam || '';
  if (cm === 'pull') { const k = ss(clamp(lt / 1.2)); z = lerp(1.3, 1, k); }
  else if (cm.startsWith('cu:')) { const a = B._actors.find(a => a.who === cm.slice(3)); if (a) { const [hx, hy] = headPos(a); cx = lerp(540, hx, .85); cy = hy + 220; z = 1.7; } }
  else if (cm === 'in') { const k = ss(clamp(lt / 1.5)); z = lerp(1, 1.25, k); }
  const sh = B.shake ? (() => { const tt = anchor(B.shake, 0, 0).t; const k = clamp((gt - tt) / .3); return k > 0 && k < 1 ? (hash(Math.floor(gt * 24)) - .5) * 24 * (1 - k) : 0; })() : 0;
  cam(cx + sh, cy, z);
  const set = B.set || 'studio';
  if (SETFN[set]) SETFN[set](gt); else if (set.startsWith('#') || COL[set]) { fillOnly(rect(-600, -400, W + 1200, H + 800), col(set), { boil: 0 }); }
  const front = [];
  B._items.forEach(I => { if (I.flags.front || ['title', 'sign', 'stamp', 'flash', 'confetti', 'sub', 'card', 'year', 'label'].includes(I.type)) front.push(I); else drawItem(I, gt); });
  B._actors.forEach(a => { if (!a.at || gt >= a.t) drawActor(a, a.at ? gt - a.t : lt, gt, n); });
  front.forEach(I => drawItem(I, gt));
  camEnd();
}
function drawItem(I, gt) {
  const p = I.kv.x || I.kv.y ? [+(I.kv.x || 540), +(I.kv.y || 820)] : POS[I.pos || DEFPOS[I.type] || 'mid'];
  const f = ITEM[I.type]; if (!f) return; if (I.kv.until && gt > anchor(I.kv.until, 0, 0).t) return;
  f(I, p[0], p[1], gt - I.t, I.ts);
}
export function storyEvents() { return { events: EVENTS.sort((a, b) => a.t - b.t), wipes: WIPES, dur: LIPS.N / FPS, beats: (STORY.beats || []).map(b => ({ t: b._t0, music: b.music || null, set: b.set || 'studio', style: b.style || STORY.style || 'ink' })), loop: STORY.loop || 0 }; }

// =================== render ===================
const WIPE = null;   // legacy single wipe [start, end]; story beats use { wipe: true }
SH.sort((a, b) => a[0] - b[0]);
export async function renderFrame(f) {
  for (let pass = 0; pass < 6; pass++) { drawFrame(f); const p = takePending(); if (!p.length) break; await Promise.all(p); }
  return true;
}
function drawCore(f) {
  let gt = f / FPS; let i = 0; for (let k = 0; k < SH.length; k++) if (gt >= SH[k][0]) i = k;
  const ST = styleAt(i); if (ST && ST.twos) { f -= f % 2; gt = f / FPS; }   // animate on twos (stop-motion / old film feel)
  CUR_T = gt;
  const [t0, fn] = SH[i];
  applyAspect(i);
  frame(gt, { amp: 1.2 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
  const t1 = i + 1 < SH.length ? SH[i + 1][0] : (LIPS ? LIPS.N / FPS : t0 + 5), zk = 1 + .035 * ss(clamp((gt - t0) / (t1 - t0)));
  push(); translate(W / 2, H / 2); scale(zk); translate(-W / 2, -H / 2);
  fn(gt - t0, gt);
  pop();
  // portal swirl wipe (story-specific: set WIPE = null to disable, or move it to your own transition time)
  const wp = WIPE || WIPES.find(w => gt > w[0] && gt < w[1]); const pw = wp ? seg(gt, wp[0], wp[1]) : 0;
  if (pw > 0 && pw < 1) {
    const r = 2400 * ei(pw); push(); translate(540, 960);
    shape(ell(0, 0, r * .9, r, 60), { fill: '#ff5a1f', lw: 9, shade: () => { for (let i = 0; i < 5; i++) fillOnly(arc(0, 0, r * (.8 - i * .14), r * (.9 - i * .16), i * 1.3 + gt * 6, i * 1.3 + gt * 6 + 2.6, 24), ['#ff8a3d', '#ffb547', '#ffd88a', '#fff3d6', '#ffffff'][i], { boil: .5 }); } });
    pop();
  }
  captions(gt);
  post(f);
  stylize(ST, f);
}
// —— loop ending: the last LOOP seconds dissolve into frame 0 so the video replays seamlessly (STORY.loop = 0.4) ——
let LOOPBUF = null;
function drawFrame(f) {
  const L = (typeof STORY !== 'undefined' && STORY && STORY.loop) || 0, dur = LIPS ? LIPS.N / FPS : 0, gt = f / FPS;
  drawCore(f);
  if (L && dur && gt > dur - L) {
    const k = ss(clamp((gt - (dur - L)) / L));
    if (!LOOPBUF || LOOPBUF.width !== CW || LOOPBUF.height !== CH) LOOPBUF = new OffscreenCanvas(CW, CH);
    const lb = LOOPBUF.getContext('2d'); lb.setTransform(1, 0, 0, 1, 0, 0); lb.clearRect(0, 0, CW, CH); lb.drawImage(g.canvas, 0, 0);
    drawCore(0); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - k; g.drawImage(LOOPBUF, 0, 0); g.globalAlpha = 1;
  }
}
let GRAIN = null;
function post(f) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const hd = Math.hypot(CW, CH); const v = g.createRadialGradient(CW / 2, CH * .46, hd * .28, CW / 2, CH * .5, hd * .68); v.addColorStop(0, 'rgba(20,10,30,0)'); v.addColorStop(1, 'rgba(20,10,30,0.26)');
  g.fillStyle = v; g.fillRect(0, 0, CW, CH);
  if (!GRAIN) { GRAIN = []; for (let n = 0; n < 4; n++) { const c = new OffscreenCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256); for (let p = 0; p < d.data.length; p += 4) { const r = Math.random() * 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = r; d.data[p + 3] = 255; } x.putImageData(d, 0, 0); GRAIN.push(g.createPattern(c, 'repeat')); } }
  g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; g.fillStyle = GRAIN[Math.floor(f / 2) % 4]; g.fillRect(0, 0, CW, CH); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
}

// =================== STYLES: one cast, many looks ===================
// story-wide `style:` or per-beat `style:`. ink = the house look. See docs/STYLES.md.
const STYLES = {
  ink: null,
  oldfilm: { filter: 'sepia(1) saturate(.7) contrast(1.3) brightness(.86)', twos: true, jitter: 2, flicker: .07, scratches: true, edge: .55 },
  paper: { twos: true, jitter: 3, paper: .45, filter: 'saturate(.92) contrast(1.05)', shadow: true },
  riso: { riso: ['#ff4f7b', '#2a4bd7'], misreg: 7, paper: .2, halftone: .18 },
  noir: { filter: 'grayscale(1) contrast(1.45) brightness(.92)', tint: 'rgba(30,50,110,0.20)', edge: .6, grainX: 2 },
  comic: { filter: 'saturate(1.3) contrast(1.12)', halftone: .14, border: 18 },
  pastel: { filter: 'saturate(.7) brightness(1.07) contrast(.95)', paper: .15 },
  dusk: { filter: 'saturate(1.5) contrast(1.15) brightness(.88) hue-rotate(-10deg)', tint: 'rgba(110,0,170,0.18)', edge: .45 },
  freeze: { filter: 'grayscale(.85) contrast(1.15)', tint: 'rgba(255,214,107,0.10)' },
  vhs: { filter: 'saturate(1.25) contrast(1.05)', chroma: 5, scan: .12, jitter: 1 },
};
const STYLE_OVERRIDE = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('style') : null;
function styleAt(i) {
  if (STYLE_OVERRIDE) return STYLES[STYLE_OVERRIDE] || null;
  if (typeof STORY === 'undefined' || !STORY) return null;
  const b = STORY.beats && STORY.beats[i], n = (b && b.style) || STORY.style; return n ? (typeof n === 'object' ? n : STYLES[n]) : null;
}
let SBUF = null, PATS = null;
function pats() {
  if (PATS) return PATS; PATS = {};
  const mk = (w, h, fn) => { const c = new OffscreenCanvas(w, h), x = c.getContext('2d'); fn(x, w, h); return g.createPattern(c, 'repeat'); };
  PATS.dots = mk(12, 12, (x) => { x.fillStyle = '#fff'; x.fillRect(0, 0, 12, 12); x.fillStyle = '#000'; x.beginPath(); x.arc(6, 6, 2.6, 0, TAU); x.fill(); });
  PATS.paper = mk(512, 512, (x, w, h) => { const d = x.createImageData(w, h); for (let p = 0; p < d.data.length; p += 4) { const v = 225 + Math.random() * 30; d.data[p] = v; d.data[p + 1] = v - 4; d.data[p + 2] = v - 14; d.data[p + 3] = 255; } x.putImageData(d, 0, 0); x.strokeStyle = 'rgba(120,100,70,0.12)'; for (let i = 0; i < 260; i++) { x.beginPath(); const a = Math.random() * w, b = Math.random() * h; x.moveTo(a, b); x.lineTo(a + (Math.random() - .5) * 40, b + (Math.random() - .5) * 40); x.stroke(); } });
  PATS.scan = mk(4, 4, (x) => { x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 4, 4); x.fillStyle = 'rgba(0,0,0,1)'; x.fillRect(0, 0, 4, 1); });
  return PATS;
}
function stylize(S, f) {
  if (!S) return; const P = pats();
  if (!SBUF || SBUF.width !== CW || SBUF.height !== CH) SBUF = new OffscreenCanvas(CW, CH);
  const b = SBUF.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.filter = 'none'; b.clearRect(0, 0, CW, CH); b.drawImage(g.canvas, 0, 0);
  const r = (n) => hash(Math.floor(f / 2) * 7.13 + n), jx = S.jitter ? (r(1) - .5) * 2 * S.jitter : 0, jy = S.jitter ? (r(2) - .5) * 2 * S.jitter : 0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if (S.riso) {   // two-ink risograph: each ink is a tinted grayscale pass, slightly misregistered, multiplied on paper
    g.fillStyle = '#f4ede0'; g.fillRect(0, 0, CW, CH);
    S.riso.forEach((ink, k) => { const t = new OffscreenCanvas(CW, CH), x = t.getContext('2d'); x.filter = k ? 'grayscale(1) contrast(1.6) brightness(1.15)' : 'grayscale(1) contrast(1.1)'; x.drawImage(SBUF, 0, 0); x.filter = 'none'; x.globalCompositeOperation = 'screen'; x.fillStyle = ink; x.fillRect(0, 0, CW, CH);
      g.globalCompositeOperation = 'multiply'; g.drawImage(t, (k ? 1 : -1) * S.misreg * (.6 + r(3 + k) * .8), (k ? -1 : 1) * S.misreg * .5); });
    g.globalCompositeOperation = 'source-over';
  } else {
    g.filter = S.filter || 'none'; g.clearRect(0, 0, CW, CH);
    if (S.chroma) { g.globalCompositeOperation = 'lighter'; ['rgba(255,0,0,1)', 'rgba(0,255,0,1)', 'rgba(0,0,255,1)'].forEach((c, k) => { const t = new OffscreenCanvas(CW, CH), x = t.getContext('2d'); x.drawImage(SBUF, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = c; x.fillRect(0, 0, CW, CH); g.drawImage(t, (k - 1) * S.chroma + jx, jy); }); g.globalCompositeOperation = 'source-over'; }
    else { if (S.jitter) { g.fillStyle = '#1b1422'; g.fillRect(0, 0, CW, CH); } g.drawImage(SBUF, jx, jy); }
    g.filter = 'none';
  }
  if (S.tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = S.tint; g.fillRect(0, 0, CW, CH); g.globalCompositeOperation = 'source-over'; }
  if (S.paper) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.paper; g.fillStyle = P.paper; g.fillRect(0, 0, CW, CH); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (S.halftone) { g.globalCompositeOperation = 'multiply'; g.globalAlpha = S.halftone; g.fillStyle = P.dots; g.fillRect(0, 0, CW, CH); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if (S.scan) { g.globalAlpha = S.scan; g.fillStyle = P.scan; g.fillRect(0, 0, CW, CH); g.globalAlpha = 1; }
  if (S.flicker) { g.fillStyle = `rgba(20,12,0,${S.flicker * r(5)})`; g.fillRect(0, 0, CW, CH); }
  if (S.scratches) { g.strokeStyle = 'rgba(255,248,230,0.55)'; for (let k = 0; k < 3; k++) if (r(10 + k) > .55) { const x = r(20 + k) * CW; g.lineWidth = 1 + r(30 + k) * 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r(40 + k) - .5) * 30, CH); g.stroke(); }
    g.fillStyle = 'rgba(30,20,10,0.6)'; for (let k = 0; k < 6; k++) if (r(50 + k) > .6) { g.beginPath(); g.arc(r(60 + k) * CW, r(70 + k) * CH, 2 + r(80 + k) * 5, 0, TAU); g.fill(); } }
  if (S.edge) { const hd = Math.hypot(CW, CH), v = g.createRadialGradient(CW / 2, CH / 2, hd * .25, CW / 2, CH / 2, hd * .62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(10,5,0,${S.edge})`); g.fillStyle = v; g.fillRect(0, 0, CW, CH); }
  if (S.border) { g.strokeStyle = '#17141c'; g.lineWidth = S.border * 2; g.strokeRect(0, 0, CW, CH); }
}
export { SH };
// —— output formats ——  The film is composed once in 1080×1920 space; other formats look at it through a window.
// '916' 1080×1920 (native) · '45' 1080×1350 (rendered 1400×1750, downscaled) · '11' 1080×1080 · '169' 1920×1080
// Y0[fmt][shotIndex] = top of the window in composition y (tune per shot after a stills check)
let ASPECT = '916';
export const FMT = {
  '916': { cw: 1080, ch: 1920, sc: 1, y0: 0 },
  '45': { cw: 1400, ch: 1750, sc: 1, y0: 140 },
  '11': { cw: 1080, ch: 1080, sc: .72, y0: 400 },
  '169': { cw: 1920, ch: 1080, sc: .84, y0: 520 },
};
const Y0 = { '45': { 5: 70, 7: 70, 20: 90, 29: 90 }, '11': {}, '169': {} };
function applyAspect(i) {
  const F = FMT[ASPECT]; const y0 = (Y0[ASPECT] || {})[i] ?? F.y0;
  setView(F.cw, F.ch, F.cw / 2 - 540 * F.sc, -y0 * F.sc, F.sc);
}
export function setAspect(a) { ASPECT = a; }
export { bgStudio, bgContent, bgBeach, bgStage, bgCommunity, beachSet, gymFront, bgBoard };

// —— thumbnail: Tony on the beach, buried in new leads ——
function thumbDraw(gt) {
  frame(0.4, { amp: 1.0 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
  bgBeach(0.4); fillOnly(ell(860, 330, 104, 104, 30), '#9fdcff', { boil: 0 });
  // sun burst behind Tony
  push(); translate(430, 1060); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; fillOnly([[0, 0], [Math.cos(a - .09) * 1400, Math.sin(a - .09) * 1400], [Math.cos(a + .09) * 1400, Math.sin(a + .09) * 1400]], 'rgba(255,240,190,0.22)', { boil: 0 }); } pop();
  TONY(gt, { bust: true, x: 420, y: 1880, s: 2.75, mood: 'happy', arms: 'flex', bare: true, shades: true });
  // phone in the air with a flood of leads
  push(); translate(810, 1270); rotate(.1);
  shape(rr(-170, -300, 340, 600, 42), { fill: '#1d1b24', lw: 10, shade: () => {
    fillOnly(rr(-148, -272, 296, 544, 26), '#fff6e0');
    fillOnly(rr(-148, -272, 296, 86, 26), '#25385c'); text('NEW LEADS', 0, -228, { font: '400 36px "Bungee"', fill: '#ffffff' });
    text('+47', 0, -118, { font: '400 120px "Bungee"', fill: '#2f8f4a' });
    [['New lead', '#5bc0be'], ['New member', '#ff6a2a'], ['New lead', '#5bc0be'], ['New member', '#ff6a2a']].forEach(([lb, c], i) => { push(); translate(0, -6 + i * 66); shape(rr(-128, -26, 256, 52, 16), { fill: '#ffffff', lw: 4 }); dot(-100, 0, 12, c); text(lb, -76, 2, { font: '800 30px "Baloo 2"', fill: INK, align: 'left' }); pop(); });
  } });
  shape(ell(150, -290, 52, 52, 30), { fill: '#e8574a', lw: 7 }); text('47', 150, -286, { font: '400 46px "Bungee"', fill: '#ffffff' });
  pop();
  // notification cards flying out
  const cards = [[230, 560, -.12, 'New lead', '#5bc0be'], [800, 620, .1, 'New member', '#ff6a2a'], [200, 820, .08, 'New member', '#ff6a2a'], [840, 860, -.07, 'New lead', '#5bc0be'], [230, 1430, -.06, 'New lead', '#5bc0be']];
  cards.forEach(([x, y, r, lb, c], i) => { push(); translate(x, y); rotate(r); const hw = lb.length > 9 ? 170 : 140; translate(hw - 170, 0); shape(rr(-170, -42, hw + 170, 84, 24), { fill: '#ffffff', lw: 7 }); shape(ell(-122, 0, 26, 26, 24), { fill: c, lw: 5 }); text(['+', '★'][i % 2] , -122, 3, { font: '400 30px "Bungee"', fill: '#ffffff' }); text(lb, -82, 3, { font: '800 36px "Baloo 2"', fill: INK, align: 'left' }); pop(); });
  const spark = (x, y, r, k = 1) => { push(); translate(x, y); scale(k); rotate(r); shape(spline([[0, -26], [7, -7], [26, 0], [7, 7], [0, 26], [-7, 7], [-26, 0], [-7, -7]]), { fill: '#ffd66b', lw: 5 }); pop(); };
  [[540, 470, .2, 1.2], [470, 700, -.3, .9], [990, 470, .4, 1], [100, 1000, .1, 1.1], [600, 960, -.2, .8], [1020, 1180, .3, 1.2], [1000, 1640, .1, 1], [560, 1560, -.4, .9]].forEach(a => spark(...a));
  // headline
  push(); translate(540, 250); rotate(-.04);
  shape(rr(-470, -120, 940, 240, 40), { fill: '#25385c', lw: 10 });
  text('FULL OF LEADS', 0, -22, { font: '400 104px "Bungee"', fill: '#ffd66b' });
  text('...ON VACATION', 0, 70, { font: '400 64px "Bungee"', fill: '#ffffff' });
  pop();
  post(0);
}
function thumbAcademy(gt, lang) {
  frame(0.4, { amp: 1.0 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
  bgStage();
  push(); translate(430, 1060); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; fillOnly([[0, 0], [Math.cos(a - .08) * 1500, Math.sin(a - .08) * 1500], [Math.cos(a + .08) * 1500, Math.sin(a + .08) * 1500]], 'rgba(255,150,70,0.10)', { boil: 0 }); } pop();
  const spark = (x, y, r, k = 1) => { push(); translate(x, y); scale(k); rotate(r); shape(spline([[0, -26], [7, -7], [26, 0], [7, 7], [0, 26], [-7, 7], [-26, 0], [-7, -7]]), { fill: '#ffd66b', lw: 5 }); pop(); };
  // lesson cards
  const lesson = (x, y, r, n, col) => { push(); translate(x, y); rotate(r); shape(rr(-150, -100, 300, 200, 24), { fill: '#fff6e0', lw: 8, shade: () => fillOnly(rr(-150, -100, 300, 130, 24), col) }); shape(ell(0, -36, 40, 40, 30), { fill: '#ffffff', lw: 6 }); fillOnly([[-12, -58], [-12, -14], [24, -36]], col, { boil: 0 }); text((lang === 'pt' ? 'AULA ' : 'LESSON ') + n, 0, 64, { font: '400 36px "Bungee"', fill: '#25385c' }); pop(); };
  lesson(200, 730, -.1, 1, '#5bc0be'); lesson(880, 700, .09, 2, '#ff6a2a'); lesson(180, 1030, .07, 3, '#a974e0'); lesson(890, 1000, -.07, 4, '#2f8f4a');
  TONY(gt, { bust: true, x: 540, y: 1900, s: 2.75, mood: 'happy', arms: 'flex', bare: false });
  // graduation cap on Tony
  push(); translate(CAP[0], CAP[1]); rotate(.06);
  shape([[-150, 0], [0, -62], [150, 0], [0, 62]], { fill: '#1f2230', lw: 8 });
  shape(rr(-80, 10, 160, 70, 12), { fill: '#1f2230', lw: 7 });
  stroke([[0, 0], [118, 34], [124, 120]], 7, { line: '#ffd66b' }); shape(ell(124, 132, 16, 22, 16), { fill: '#ffd66b', lw: 5 });
  pop();
  // diploma
  push(); translate(170, 1330); rotate(.4); scale(.7); shape(rr(-190, -48, 380, 96, 46), { fill: '#fff6e0', lw: 8 }); shape(ell(-190, 0, 30, 48, 20), { fill: '#efe0c2', lw: 6 }); shape(rr(-30, -50, 60, 100, 6), { fill: '#e8574a', lw: 5 }); pop();
  [[110, 520, .2, 1.1], [980, 520, .4, 1], [90, 880, .1, 1], [1000, 870, -.2, .9], [720, 900, .3, .8], [370, 900, -.3, .9]].forEach(a => spark(...a));
  // headline
  push(); translate(540, 230); rotate(-.03);
  text(lang === 'pt' ? 'E TEMOS UMA' : 'AND WE HAVE A', 0, -40, { font: '400 74px "Bungee"', fill: '#ffffff', outlineW: 12, outlineCol: '#16213a' });
  push(); translate(0, 100); rotate(.02); shape(rr(-440, -86, 880, 172, 36), { fill: '#ff6a2a', lw: 10 }); text(lang === 'pt' ? 'FREE ACADEMIA' : 'FREE ACADEMY', 0, 6, { font: '400 100px "Bungee"', fill: '#fff6e0' }); pop();
  push(); translate(0, 262); rotate(-.04); shape(rr(-170, -54, 340, 108, 30), { fill: '#ffd66b', lw: 8 }); text(lang === 'pt' ? 'TAMBÉM!' : 'TOO!', 0, 4, { font: '400 62px "Bungee"', fill: '#25385c' }); pop();
  pop();
  post(0);
}
function thumbAcademy2(gt) {
  frame(0.4, { amp: 1.0 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
  bgStage();
  push(); translate(540, 900); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; fillOnly([[0, 0], [Math.cos(a - .07) * 1600, Math.sin(a - .07) * 1600], [Math.cos(a + .07) * 1600, Math.sin(a + .07) * 1600]], 'rgba(255,150,70,0.10)', { boil: 0 }); } pop();
  const spark = (x, y, r, k = 1) => { push(); translate(x, y); scale(k); rotate(r); shape(spline([[0, -26], [7, -7], [26, 0], [7, 7], [0, 26], [-7, 7], [-26, 0], [-7, -7]]), { fill: '#ffd66b', lw: 5 }); pop(); };
  // —— course window ——
  push(); translate(A2.win[0], A2.win[1]); rotate(.035);
  shape(rr(-390, -300, 780, 600, 34), { fill: '#fff6e0', lw: 10, shade: () => {
    fillOnly(rr(-390, -300, 780, 74, 34), '#25385c'); fillOnly(rect(-390, -250, 780, 24), '#25385c', { boil: 0 });
    ['#e8574a', '#ffd66b', '#5bc0be'].forEach((c, i) => dot(-350 + i * 34, -263, 10, c));
    text('BUZZTORM ACADEMY', -230, -260, { font: '400 34px "Bungee"', fill: '#ffffff', align: 'left' });
    // video player
    fillOnly(rr(-360, -206, 400, 250, 18), '#16213a');
    shape(ell(-160, -86, 52, 52, 30), { fill: '#ff6a2a', lw: 6 }); fillOnly([[-176, -112], [-176, -60], [-130, -86]], '#ffffff', { boil: 0 });
    fillOnly(rr(-340, 16, 360, 10, 5), '#3b4a6e'); fillOnly(rr(-340, 16, 230, 10, 5), '#ff6a2a'); dot(-110, 21, 12, '#ffffff');
    // modules
    [['COMMUNITY', 1], ['ONBOARDING', 1], ['VIRAL LOOP', 0], ['OFFERS', 0]].forEach(([lb, done], i) => {
      const y = -180 + i * 62; shape(rr(64, y - 26, 300, 52, 14), { fill: '#ffffff', lw: 4 });
      shape(ell(94, y, 16, 16, 18), { fill: done ? '#2f8f4a' : '#e6dccb', lw: 4 }); if (done) stroke([[86, y], [93, y + 7], [104, y - 8]], 4, { line: '#ffffff' });
      text(lb, 122, y + 2, { font: '400 25px "Bungee"', fill: '#25385c', align: 'left' }); });
    // lessons row
    [['#5bc0be'], ['#a974e0'], ['#ff6a2a'], ['#2f8f4a']].forEach(([c], i) => { const x = -360 + i * 182; shape(rr(x, 80, 166, 110, 16), { fill: c, lw: 5 }); shape(ell(x + 83, 135, 24, 24, 20), { fill: '#ffffff', lw: 4 }); fillOnly([[x + 76, 122], [x + 76, 148], [x + 96, 135]], c, { boil: 0 }); text('LESSON ' + (i + 1), x + 83, 222, { font: '400 24px "Bungee"', fill: '#25385c' }); });
  } });
  pop();
  // FREE sticker
  push(); translate(A2.stk[0], A2.stk[1]); rotate(.22);
  const star = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, r = i % 2 ? 118 : 140; star.push([Math.cos(a) * r, Math.sin(a) * r]); }
  shape(star, { fill: '#ffd66b', lw: 8 }); text('100%', 0, -32, { font: '400 46px "Bungee"', fill: '#e8574a' }); text('FREE', 0, 28, { font: '400 62px "Bungee"', fill: '#25385c' });
  pop();
  // Tony, graduation cap on, pointing at the course
  TONY(gt, { bust: true, x: A2.tony[0], y: A2.tony[1], s: A2.tony[2], mood: 'happy', arms: 'point', bare: false });
  push(); translate(A2.cap[0], A2.cap[1]); rotate(A2.cap[2]); scale(A2.cap[3]);
  shape(rr(-82, 6, 164, 74, 12), { fill: '#1f2230', lw: 7 });
  shape([[-156, 0], [0, -64], [156, 0], [0, 64]], { fill: '#2a2e40', lw: 8 });
  dot(0, 0, 10, '#ffd66b'); stroke([[0, 0], [122, 30], [128, 118]], 7, { line: '#ffd66b' }); shape(ell(128, 130, 16, 24, 16), { fill: '#ffd66b', lw: 5 });
  pop();
  A2.sparks.forEach(a => spark(...a));
  // headline
  text('AND WE HAVE A', 540, 150, { font: '400 72px "Bungee"', fill: '#ffffff', outlineW: 12, outlineCol: '#16213a' });
  push(); translate(540, 330); rotate(-.03);
  shape(rr(-470, -120, 940, 240, 44), { fill: '#ff6a2a', lw: 11, shade: () => fillOnly(rr(-470, 40, 940, 80, 0), 'rgba(0,0,0,0.10)', { boil: 0 }) });
  text('FREE ACADEMY', 0, 8, { font: '400 112px "Bungee"', fill: '#fff6e0', outlineW: 0 });
  pop();
  push(); translate(540, 520); rotate(.03); shape(rr(-150, -56, 300, 112, 32), { fill: '#ffd66b', lw: 9 }); text('TOO!', 0, 6, { font: '400 72px "Bungee"', fill: '#25385c' }); pop();
  post(0);
}
let A2 = { win: [590, 910], stk: [955, 575], tony: [300, 2010, 2.3], cap: [300, 1252, -.06, .9], sparks: [[110, 560, .2, 1.1], [70, 1270, .1, 1], [1010, 1400, -.2, 1], [870, 1330, .3, .8], [960, 1700, -.2, 1.1]] };

// =================== reference galleries (kit/ref) ===================
// thumb.html?v=sets&i=N  → set N full frame · thumb.html?v=props&w=2160&h=2700 → every prop on one sheet
export const SETS = [
  ['bgStudio', 'coach studio + before/after poster', gt => bgStudio(gt)],
  ['bgContent day', 'creator room (day)', gt => bgContent(gt, 0)],
  ['bgContent night', 'creator room (night)', gt => bgContent(gt, 1)],
  ['bgCasino + adsMachine', 'paid-ads world', gt => { bgCasino(gt); adsMachine(640, 1500, gt, { price: '$200', year: '2024' }); }],
  ['bgBoard', 'navy explainer', gt => bgBoard()],
  ['bgChalk', 'chalkboard', gt => bgChalk()],
  ['bgStreet', 'street', gt => bgStreet()],
  ['gymFront', 'PULSE gym front', gt => gymFront(gt)],
  ['bgCommunity', 'warm community interior', gt => bgCommunity()],
  ['bgBeach + beachSet', 'beach', gt => { bgBeach(gt); beachSet(gt, 0); }],
  ['bgStage', 'Buzztorm studio', gt => bgStage()],
  ['bgOffice', 'office', gt => bgOffice()],
  ['twoDoors', 'two doors: ADS / CONTENT', gt => twoDoors(0, gt, 0, 0)],
];
function gallerySets(i) {
  frame(1, { amp: 1.2 }); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
  SETS[i][2](1.0); post(0);
}
function galleryProps() {
  frame(1, { amp: 1.0 }); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#f6efe2'; g.fillRect(0, 0, CW, CH);
  // each entry draws around (0,0) = bottom-centre of its cell, scaled by sc; labels drawn last so nothing covers them
  const P = [
    ['sign()', 1, () => sign(0, -150, 300, 110, '#e8574a', 'SIGN', { font: '400 56px "Bungee"' })],
    ['pill()', 1, () => pill(0, -150, 'PILL', '#5bc0be')],
    ['panel()', 1, () => panel(0, -160, 280, 220)],
    ['coin() / bill()', 1, () => { coin(-70, -150, 36); bill(50, -150, -.2, 1.3); }],
    ['mug() + steam()', 1.3, () => { mug([0, -60]); steam(0, -140, 1); }],
    ['phone(hp, scr, txt)', 1.2, () => phone([0, -60], '#7fd3ff', '+12')],
    ['tablet() / chalk()', 1.1, () => { tablet([-50, -60]); chalk([80, -80]); }],
    ['dumbbell()', 1.5, () => dumbbell([0, -100], -.2)],
    ['clock()', .9, () => clock(0, -190, 120, 9, '9:00 AM')],
    ['poof() / stars()', 1, () => { poof(-70, -150, .5); stars(70, -150, .5, 5, 70); }],
    ['arrow()', 1, () => arrow([-130, -80], [130, -220], '#e8574a', 12, 1)],
    ['xMark() / check()', 1, () => { xMark(-75, -150, .75, 1); check(80, -150, .75, 1); }],
    ['door()', .8, () => door(0, 0, 200, 340, '#a974e0', 'ADS', .3)],
    ['adsMachine()', .3, () => adsMachine(0, 0, 1, { price: '$200', year: '2024' })],
    ['umbrella()', .45, () => umbrella(0, 0, 700)],
    ['tripod() + recDot()', .7, () => { tripod(0, 0, 420, 1); recDot(0, -500, 0); }],
    ['phoneRig()', .45, () => phoneRig(0, 0, 0, 'REC', 1)],
    ['cameraRig()', .45, () => cameraRig(0, 0, 0, 1)],
    ['softbox()', .42, () => softbox(0, 0, 1)],
    ['ringStand()', .38, () => ringStand(0, 0, 1, 1, 0)],
    ['treadBack/Front()', .42, () => { treadBack(0, -160, 1, 1, 1); treadFront(0, -160, 1, 'SPEED', '8.0'); }],
    ['sweatDrop()', 3, () => sweatDrop(0, -40)],
    ['folk() extras', .62, () => { for (let k = 0; k < 3; k++) folk(-150 + k * 150, 0, 1, k * 3 + 1, {}); }],
    ['transformFig()', .55, () => { transformFig(-120, 0, 1, false, 1); transformFig(120, 0, 1, true, 1); }],
  ];
  const at = (k) => [180 + (k % 6) * 360, 470 + Math.floor(k / 6) * 540];
  P.forEach(([n, sc, fn], k) => { const [x, y] = at(k); push(); translate(x, y); scale(sc); fn(); pop(); });
  P.forEach(([n], k) => { const [x, y] = at(k); text(n, x, y + 50, { font: '800 30px "Baloo 2"', fill: '#25385c' }); });
}
function galleryStyle() {
  frame(1, { amp: 1.0 }); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#f6efe2'; g.fillRect(0, 0, CW, CH);
  fillOnly(rect(0, 0, 2160, 150), '#25385c', { boil: 0 }); fillOnly(rect(0, 150, 2160, 10), '#ff6a2a', { boil: 0 });
  text('STYLE CARD', 60, 75, { font: '400 72px "Bungee"', fill: '#fff6e0', align: 'left' });
  text('flat colour · hard shade blocks · 7 px plum ink at 1080 · boil 12 fps · vignette + grain', 700, 80, { font: '800 34px "Baloo 2"', fill: '#ffd66b', align: 'left' });
  const PAL = [['navy', '#25385c'], ['deep navy', '#16213a'], ['orange · CTA', '#ff6a2a'], ['gold', '#ffd66b'], ['cream', '#fff6e0'], ['paper', '#efe4d2'],
    ['green · growth', '#2f8f4a'], ['red (loss)', '#e8574a'], ['teal', '#5bc0be'], ['violet', '#a974e0'], ['coral (Tony)', '#ff5b4d'], ['ink', '#17141c']];
  PAL.forEach(([n, c], i) => { const x = 80 + (i % 6) * 340, y = 230 + Math.floor(i / 6) * 230; shape(rr(x, y, 300, 130, 22), { fill: c, lw: 6 }); text(n, x, y + 165, { font: '800 30px "Baloo 2"', fill: '#25385c', align: 'left' }); text(c, x + 300, y + 165, { font: '400 30px "VT323"', fill: '#5a5468', align: 'right' }); });
  text('Bungee — TITLES, SIGNS, NUMBERS 123', 80, 760, { font: '400 72px "Bungee"', fill: '#25385c', align: 'left' });
  text('Baloo 2 800 — labels, UI text, captions in cards', 80, 870, { font: '800 64px "Baloo 2"', fill: '#25385c', align: 'left' });
  text('VT323 — SCREENS, COUNTERS  $200  1680', 80, 970, { font: '400 76px "VT323"', fill: '#2f8f4a', align: 'left' });
  // shading + plate examples
  shape(rr(80, 1060, 420, 300, 34), { fill: '#5bc0be', lw: 9, shade: () => fillOnly(rect(80, 1260, 420, 120), '#47a3a1', { boil: .5 }) }); text('fill + hard shade', 290, 1410, { font: '800 30px "Baloo 2"', fill: '#25385c' });
  sign(800, 1200, 440, 150, '#ff6a2a', 'TITLE PLATE', { font: '400 58px "Bungee"' }); text('sign(): plate + drop shadow', 800, 1410, { font: '800 30px "Baloo 2"', fill: '#25385c' });
  pill(1300, 1200, 'PILL', '#2f8f4a'); text('pill()', 1300, 1410, { font: '800 30px "Baloo 2"', fill: '#25385c' });
  push(); translate(1760, 1210); shape(rr(-200, -150, 400, 300, 30), { fill: '#fff6e0', lw: 8, shade: () => { fillOnly(rr(-200, -150, 400, 70, 30), '#25385c'); fillOnly(rect(-200, -110, 400, 30), '#25385c', { boil: 0 }); } }); text('UI CARD', 0, -112, { font: '400 32px "Bungee"', fill: '#ffffff' }); text('+47', 0, 20, { font: '400 90px "Bungee"', fill: '#2f8f4a' }); pop(); text('UI card (cream + navy header)', 1760, 1410, { font: '800 30px "Baloo 2"', fill: '#25385c' });
  [3, 5, 7, 10, 14].forEach((w, i) => { stroke([[100 + i * 200, 1520], [240 + i * 200, 1600]], w); text(w + ' px', 170 + i * 200, 1650, { font: '800 28px "Baloo 2"', fill: '#25385c' }); });
  text('line weights: 4–6 UI · 7 default · 9–11 big plates · 14 caption outline', 1100, 1580, { font: '800 30px "Baloo 2"', fill: '#25385c', align: 'left' });
  post(0);
}
function galleryMouths() {
  frame(1, { amp: 1.0 }); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#f6efe2'; g.fillRect(0, 0, CW, CH);
  const S = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], N = ['rest', 'M B P', 'K S T…', 'EH AE', 'AA', 'AO ER', 'UW OW W', 'F V', 'L'];
  S.forEach((v, i) => { const x = 150 + i * 240;
    g.save(); g.beginPath(); g.rect(x - 115, 60, 230, 420); g.clip(); DEX(1, { bust: true, x, y: 700, s: 1.6, mood: 'smile', vis: v, look: [0, 0] }); g.restore();
    g.save(); g.beginPath(); g.rect(x - 115, 520, 230, 420); g.clip(); TONY(1, { bust: true, x, y: 1170, s: 1.55, mood: 'smile', vis: v, arms: 'down' }); g.restore();
    text(v, x, 990, { font: '400 54px "Bungee"', fill: '#25385c' }); text(N[i], x, 1045, { font: '800 28px "Baloo 2"', fill: '#5a5468' }); });
}
let CAP = [575, 1075];
export async function renderThumb(gt = 143.9) {
  const q = new URLSearchParams(location.search), v = q.get('v');
  setView(+(q.get('w') || 1080), +(q.get('h') || 1920), +(q.get('ox') || 0), +(q.get('oy') || 0), +(q.get('sc') || 1));
  if (q.get('cap')) CAP = q.get('cap').split(',').map(Number);
  for (let pass = 0; pass < 6; pass++) { if (q.get('a2')) A2 = { ...A2, ...JSON.parse(q.get('a2')) }; if (v === 'sets') gallerySets(+(q.get('i') || 0)); else if (v === 'props') galleryProps(); else if (v === 'style') galleryStyle(); else if (v === 'mouths') galleryMouths(); else if (v === 'academy2') thumbAcademy2(gt); else if (v === 'academy') thumbAcademy(gt, q.get('lang') || 'en'); else thumbDraw(gt); const p = takePending(); if (!p.length) break; await Promise.all(p); }
  return true;
}
