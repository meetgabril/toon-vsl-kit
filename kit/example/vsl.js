// vsl.js — "Coach Tony's Treadmill" · Buzztorm VSL in the sitcom-toon style (24 fps, 1080x1920)
import { clamp, lerp, hash, seg, eo, ei, eio, back, spring, TAU } from '/core/lib.js';
import { setDry, getM, INK, W, H, CW, CH, OX, OY, SC, setView, frame, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, bands, g, S } from './toon.js';
import { C } from './cast.js';
import { peep, folk2, bfaWoman, transformFig, ARMS } from './chars2.js';
import { loadPeeps, takePending } from './peeps.js';
import { hand } from './chars.js';
import './cast.custom.js';   // your own characters (addCast) — see CHARACTERS.md

export const FPS = 24;
let LIPS = null;
let TIMING = null;
export async function load() { LIPS = await (await fetch('/work/lips.json')).json(); try { TIMING = await (await fetch('/work/timing.json')).json(); } catch (e) {} await loadPeeps(); return LIPS.N; }
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
  const Q = { x: P.x, y: P.y, s: (P.s ?? 1), face: P.face ?? 1, t: gt, noShadow: P.bust, pose: P.pose || (P.bust ? 'effigy/BlazerBlackTee' : 'standing/EasingColorPants'), blinkOff: false, mood: moodOf(P, 'calm'), open: lip('D', gt), talk: talkEnergy('D', gt), tilt: P.tilt ?? (P.look ? P.look[1] * .05 : 0), faceName: P.faceName };
  peep('D', Q);
};
// Any registered character (cast.custom.js): CHAR('M', gt, { x, y, s, face, pose | bust:true, mood, tilt, acc, hold })
const CHAR = (sp, gt, P) => peep(sp, { ...P, t: gt, noShadow: P.bust || P.noShadow, mood: moodOf(P, 'smile'), open: lip(sp, gt), talk: talkEnergy(sp, gt), tilt: P.tilt ?? 0 });
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
    mood: moodOf(P, 'smile'), open: P.mouth && P.mouth.o === 0 ? 0 : lip('T', gt), talk: talkEnergy('T', gt), tilt: P.tilt ?? (P.headTilt || 0), acc: P.shades ? 'Sunglasses' : P.acc, faceName: P.faceName });
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

// =================== SHOTS ===================
// each: [start seconds, fn(lt, gt)]
const SH = [];
const shot = (t0, fn) => SH.push([t0, fn]);

// 1. This is Tony (studio): start on Tony, pull back to reveal Dex presenting
shot(0, (lt, gt) => {
  const k = ss(seg(lt, 0.9, 2.2)); cam(lerp(600, 540, k), lerp(1200, 1010, k), lerp(1.5, 1.0, k));
  bgStudio(gt);
  // client: overweight -> fit model ("lose the weight and keep it off")
  const tk = seg(lt, 4.45, 4.75);
  if (tk < .5) transformFig(880, 1620, 1.0, false, gt); else transformFig(880, 1620, 1.0, true, gt, true);
  poof(880, 1400, tk); stars(880, 1250, seg(lt, 4.6, 5.6), 6, 150);
  TONY(gt, { x: 590, y: 1790, s: 1.05, face: 1, mood: lt > 4.6 ? 'happy' : 'smile', arms: lt > 3.9 ? 'point' : 'hips' });
  DEX(gt, { x: 190, y: 1880, s: 1.05, face: 1, look: [1, 0] });
  camEnd();
});
// 2. Twelve weeks. Real results. (Tony close-up, proud flex)
shot(6.25, (lt, gt) => {
  cam(540, 960, 1.0 + lt * 0.012);
  bgStudio(gt);
  sign(300, 560, 420, 120, '#2f8f4a', '12 WEEKS', { font: '400 70px "Bungee"' });
  TONY(gt, { bust: true, x: 540, y: 1940, s: 4.0, mood: 'happy', arms: 'flex' });
  stars(540, 640, seg(lt, 1.4, 2.6), 6, 260);
  camEnd();
});
// 3. Good money... as long as he never stops (desk -> treadmill reveal)
shot(9.5, (lt, gt) => {
  const k = ss(seg(lt, 1.7, 2.7)); cam(540, lerp(1000, 1080, k), lerp(1.45, 1.0, k));
  bgStudio(gt);
  // treadmill, seen from the front: he runs toward us
  const run = k > 0.05;
  treadBack(540, 1660, 1.05, gt, run ? 1 : 0);
  TONY(gt, { x: 540, y: 1735, s: 1.0, face: 1, sm: k > .5 ? -.2 : .8, worry: k * .8, sweat: k > .5, run: run });
  treadFront(540, 1660, 1.05, 'SPEED', run ? '9.0' : '0.0');
  for (let i = 0; i < 5; i++) bill(680, 1220 - i * 20, 0, .8);   // money stacked on the console
  camEnd();
});
// 4. Here's how Tony gets clients (two doors)
const twoDoors = (lt, gt, open1 = 0, open2 = 0) => {
  wall('#e9dcc4'); floorB('#c59a6c', '#a97f52', 1380);
  door(300, 1380, 300, 560, '#9b5fd4', 'ADS', open1, '#3c2071'); door(780, 1380, 300, 560, '#5bc0a0', 'CONTENT', open2, '#b9ead2');
};
shot(12.9, (lt, gt) => {
  cam(540, 1060, 1.0 + lt * 0.03);
  twoDoors(lt, gt);
  TONY(gt, { arms: 'hips', x: 540, y: 1840, s: 1.05, face: lt < 1.0 ? -1 : 1, look: [lt < 1.0 ? -1 : 1, -.3], sm: .5, armR: { h: [100, 40], bend: -30 } });
  camEnd();
});
// 5a. Door number one: ads (door opens, push in)
shot(14.7, (lt, gt) => {
  const o = ss(seg(lt, 0.15, 0.75)); cam(lerp(540, 300, ss(seg(lt, 0.2, 1.05))), lerp(1060, 1120, ss(seg(lt, 0.2, 1.05))), lerp(1.0, 2.6, ei(seg(lt, 0.3, 1.1))));
  twoDoors(lt, gt, o, 0);
  camEnd();
});
// 5b. Ads world: every client costs ~$200
shot(15.8, (lt, gt) => {
  cam(560, 1020, 1.0);
  bgCasino(gt);
  adsMachine(760, 1300, gt, { price: '$200' });
  // a bill goes in, a client pops out with a $200 tag
  for (let n = 0; n < 3; n++) {
    const t0 = 0.6 + n * 1.25, k = seg(lt, t0, t0 + .5);
    if (k > 0 && k < 1) bill(lerp(520, 760, k), lerp(1150, 790, k), k * 2, 1);
    const kp = seg(lt, t0 + .55, t0 + 1.0);
    if (kp > 0) { const x = 640 + n * 150, y = lerp(1170, 1560 + n * 40, eo(kp)); folk(x - 20 * n, y, .62, n + 1, { happy: 1, look: [-1, 0] }); push(); translate(x - 20 * n + 40, y - 190); shape(rr(-44, -20, 88, 40, 8), { fill: '#fff3c4', lw: 4 }); text('$200', 0, 2, { font: '400 26px "Bungee"', fill: '#e8574a' }); pop(); }
  }
  TONY(gt, { x: 380, y: 1760, s: 1.15, face: 1, look: [1, -.2], sm: .3, worry: .3, armR: { h: [170, -120], bend: -40 }, holdR: (hp) => bill(hp[0] + 30, hp[1] - 20, -.3, .9) });
  camEnd();
});
// 5c. Insert: every year the number goes up
shot(19.7, (lt, gt) => {
  const [sx, sy] = shake(gt, 19.7 + 0.5, 16); const k = Math.min(2, Math.floor(seg(lt, 0.4, 1.9) * 3));
  cam(760 + sx, 520 + sy, 2.4);
  bgCasino(gt);
  adsMachine(760, 1300, gt, { price: ['$200', '$260', '$340'][k], year: ['2024', '2025', '2026'][k] });
  camEnd();
});
// 5d. Stop paying, and the clients stop (machine goes dark)
shot(21.9, (lt, gt) => {
  cam(560, 1020, 1.0);
  bgCasino(gt);
  const on = lt < 1.25;
  adsMachine(760, 1300, gt, { price: '$340', on: on ? 1 : 0 });
  if (!on) fillOnly(rect(-600, -400, W + 1200, H + 800), 'rgba(10,5,25,0.35)', { boil: 0 });
  const kc = seg(lt, 1.4, 2.0); if (kc > 0) folk(700, lerp(1170, 1060, Math.sin(kc * Math.PI)), .42, 2, { happy: 0, look: [0, -1] });
  TONY(gt, { x: 380, y: 1760, s: 1.15, face: 1, look: [1, 0], sm: on ? .2 : -.5, worry: on ? .3 : 1, armL: { h: [-60, 120], bend: -10 }, armR: on ? { h: [150, -40], bend: -30 } : { h: [60, 150], bend: 20 }, holdR: on ? (hp) => bill(hp[0] + 30, hp[1] - 20, -.3, .9) : undefined });
  camEnd();
});
// 6a. Door number two: content
shot(24.6, (lt, gt) => {
  const o = ss(seg(lt, 0.15, 0.75)); cam(lerp(540, 780, ss(seg(lt, 0.2, 1.0))), lerp(1060, 1120, ss(seg(lt, 0.2, 1.0))), lerp(1.0, 2.6, ei(seg(lt, 0.3, 1.1))));
  twoDoors(lt, gt, 1, o);
  camEnd();
});
// 6b. 5 a.m. workout / noon meal prep / live at night / every single day (fast inserts)
shot(26.6, (lt, gt) => {
  const part = lt < 1.55 ? 0 : lt < 2.95 ? 1 : 2;
  cam(540, 1060, 1.0 + (lt % 1.4) * 0.03);
  bgContent(gt, part === 0 || part === 2 ? 1 : 0);
  // window with moon / sun
  shape(rr(620, 300, 360, 320, 16), { fill: part === 1 ? '#9fdcff' : '#24345a', lw: 7 }); stroke([[800, 300], [800, 620]], 6); stroke([[620, 460], [980, 460]], 6);
  if (part === 1) shape(ell(900, 380, 44, 44, 20), { fill: '#ffd66b', lw: 5 }); else shape(ell(700, 380, 40, 40, 20), { fill: '#f6efe2', lw: 5, shade: () => fillOnly(ell(718, 370, 30, 34, 16), '#24345a') });
  clock(250, 430, 110, [5, 12, 21][part], ['5:00 AM', '12:00 PM', '9:00 PM'][part]);
  // tripod phone
  phoneRig(780, 1600, gt, part === 2 ? 'LIVE' : 'REC', .8); softbox(1000, 1600, .7, -1);
  if (part === 0) { const c = (Math.sin(gt * 6) + 1) / 2; TONY(gt, { x: 420, y: 1640, s: .95, face: 1, squat: c, mood: 'driven' }); }
  if (part === 1) { shape(rr(200, 1360, 520, 40, 10), { fill: '#a9744a', lw: 6 }); shape(rr(420, 1300, 140, 60, 10), { fill: '#e9ecef', lw: 5 }); shape(ell(490, 1290, 50, 24, 16), { fill: '#f2c48a', lw: 5 }); text('200g', 490, 1340, { font: '400 28px "VT323"', fill: INK }); TONY(gt, { x: 330, y: 1700, s: .95, face: 1, look: [1, .6], sm: .3, bags: true, armR: { h: [130, 40], bend: -20 } }); }
  if (part === 2) { TONY(gt, { arms: 'point', x: 420, y: 1640, s: 1.0, face: 1, look: [1, 0], sm: .9, bags: true, armR: { h: [120, -140], bend: -40 } }); shape(rr(640, 960, 300, 80, 14), { fill: '#2b2b33', lw: 6 }); text('3 WATCHING', 790, 1000, { font: '400 40px "VT323"', fill: '#ff6b6b' }); }
  camEnd();
});
shot(31.0, (lt, gt) => {      // every single day: calendar pages flying
  cam(540, 960, 1.0);
  bgContent(gt, 0);
  const n = Math.floor(lt * 9) % 31;
  push(); translate(540, 900); rotate(Math.sin(gt * 20) * .03);
  shape(rr(-260, -300, 520, 560, 30), { fill: '#ffffff', lw: 9, shade: () => fillOnly(rect(-280, -320, 560, 140), '#e8574a') });
  text('DAY', 0, -230, { font: '400 70px "Bungee"', fill: '#ffffff' }); text(String(200 + n), 0, 40, { font: '400 230px "Bungee"', fill: INK });
  pop();
  for (let i = 0; i < 6; i++) { const k = ((lt * 2 + i / 6) % 1); push(); translate(lerp(560, 1100 + i * 40, k), lerp(900, 200 - i * 60, k)); rotate(k * 6); shape(rr(-60, -70, 120, 140, 10), { fill: '#ffffff', lw: 5 }); pop(); }
  camEnd();
});
// 7. Tony: "If I miss a day, I feel it." (exhausted close-up, flickering ring light)
shot(32.5, (lt, gt) => {
  cam(540, 960, 1.0 + lt * .01); { const off = Math.floor(gt * 12) % 5 === 0; stroke([...ell(540, 900, 380, 380, 90), ell(540, 900, 380, 380, 90)[0]], 60, { line: '#2e2a35' }); stroke([...ell(540, 900, 380, 380, 90), ell(540, 900, 380, 380, 90)[0]], 34, { line: off ? '#9c968a' : '#fff6d6' }); }
  bgContent(gt, 1);
  TONY(gt, { bust: true, x: 540, y: 1940, s: 4.0, mood: 'tired', tilt: .05 }); sweatDrop(800, 720 + ((gt * 1.4) % 1) * 40); sweatDrop(300, 800 + ((gt * 1.1 + .5) % 1) * 40);
  camEnd();
});
// 8. He does. One week off -> leads disappear (beach lounger, then poof)
shot(35.0, (lt, gt) => {
  cam(560, 1250 + lt * 6, 1.12 + lt * .01);
  beachSet(gt, lt);
  TONY(gt, { ...LOUNGE, look: [.4, -.3], sm: .9, shades: true, ringLight: false });
  // leads waiting on the sand, then vanishing one by one
  for (let i = 0; i < 5; i++) { const at = 2.3 + i * 0.25, k = seg(lt, at, at + 0.4); if (k < 0.15) folk(170 + i * 180, 1900, .8, i, { happy: 0, look: [-.3, -1] }); poof(170 + i * 180, 1780, k); }
  camEnd();
});
// 9. Leads are everywhere: DMs, email, WhatsApp, booking page, course platform; every jump loses people
const APPS = [['DMs', '#e8574a', 41.1], ['EMAIL', '#4f6db8', 42.4], ['WHATSAPP', '#2f8f4a', 43.7], ['BOOKING', '#f2a541', 44.8], ['COURSES', '#9b7fd4', 46.0]];
shot(39.1, (lt, gt) => {
  const gtt = gt; cam(540, 980, 1.0);
  bgOffice();
  shape(rr(200, 1600, 680, 46, 10), { fill: '#a9744a', lw: 6 }); stroke([[250, 1640], [250, 1940]], 14); stroke([[830, 1640], [830, 1940]], 14);
  TONY(gt, { x: 540, y: 1960, s: 1.2, face: 1, look: [Math.sin(gt * 2), -.5], sm: -.2, worry: .7, nerv: seg(lt, 8.5, 9.5) * .6 });
  APPS.forEach(([lab, col, at], i) => {
    const k = pop1(gtt, at); if (k <= 0) return;
    const x = [200, 540, 880, 370, 710][i], y = [430, 380, 430, 820, 820][i];
    push(); translate(x, y); scale(k * 1.45); shape(rr(-90, -120, 180, 240, 26), { fill: col, lw: 7 }); text(lab, 0, -78, { font: `400 ${lab.length > 6 ? 26 : 34}px "Bungee"`, fill: '#ffffff', outlineW: 6 });
    folk(-34, 104, .32, i, { happy: 1 }); folk(36, 104, .32, i + 2, { happy: 1 }); pop();
  });
  // every jump between apps loses people
  const AX = [200, 540, 880, 370, 710], AY = [520, 470, 520, 910, 910]; for (let n = 0; n < 6; n++) { const at = 48.0 + n * 0.35, k = seg(gtt, at, at + 1.0); if (k <= 0 || k >= 1) continue; const i = n % 4, x0 = AX[i], x1 = AX[i + 1], y0 = AY[i], y1 = AY[i + 1]; const x = lerp(x0, x1, Math.min(1, k * 1.8)), y = lerp(y0, y1, Math.min(1, k * 1.8)) - Math.sin(Math.min(1, k * 1.8) * Math.PI) * 140 + Math.max(0, k - .55) * 1800; folk(x, y, .5, n, { happy: 0, look: [0, 1] }); }
  if (gtt > 48.6) text('LOST', 540, 1300, { font: '400 90px "Bungee"', fill: '#e8574a', outlineW: 10, rot: -.08 });
  camEnd();
});
// 10. Algorithm changes / ad account flagged / traffic gone / never his
shot(50.6, (lt, gt) => {
  cam(540, 960, 1.0);
  bgBoard();
  // ad account card
  const flag = gt >= 52.6;
  panel(540, 400, 800, 320, '#fff6e8');
  shape(ell(260, 400, 96, 96, 30), { fill: '#e8eef8', lw: 6, shade: () => TONY(gt, { bust: true, x: 262, y: 520, s: .78, mood: flag ? 'worried' : 'happy' }) });
  text('AD ACCOUNT', 380, 350, { font: '400 58px "Bungee"', fill: INK, align: 'left' });
  if (!flag) pill(500, 450, 'ACTIVE', '#2f8f4a', '#ffffff', 34);
  const fk = seg(gt, 52.6, 52.9); if (fk > 0) { push(); translate(600, 462); rotate(-.1); scale(lerp(2.0, .82, eo(fk))); stroke(rr(-200, -58, 400, 116, 14).concat([[-186, -58]]), 10, { line: '#e8574a' }); text('FLAGGED', 0, 6, { font: '400 80px "Bungee"', fill: '#e8574a' }); pop(); }
  // Tony's door, lit by the algorithm
  const pk = ss(seg(gt, 51.1, 51.6)), lit = pk < .5;
  door(560, 1700, 360, 560, '#ff7a6b', 'TONY', 1, lit ? '#fff3c4' : '#5a5f75');
  if (lit) fillOnly(ell(560, 1660, 300, 70, 30), 'rgba(255,230,150,0.25)', { boil: 0 });
  // wall socket + ALGORITHM plug
  panel(930, 1380, 150, 190, '#e9ecef', 22); for (const dy of [-30, 30]) shape(rr(910, 1380 + dy - 8, 40, 16, 6), { fill: INK, lw: 3 });
  const px = 830 - pk * 120, py = 1380 + pk * 160;
  stroke(spline([[px - 70, py], [px - 110, py - 160], [760, 1120], [700, 1090]], false), 14);
  stroke(spline([[px - 70, py], [px - 110, py - 160], [760, 1120], [700, 1090]], false), 7, { line: '#3b3540' });
  shape(rr(px - 80, py - 50, 120, 100, 18), { fill: '#3b3540', lw: 7 }); for (const dy of [-22, 22]) stroke([[px + 40, py + dy], [px + 80, py + dy]], 10);
  pill(px - 20, py + 96, 'ALGORITHM', '#ffd66b', INK, 28);
  // traffic: a stream of people walking into the door (dries up)
  const dry = seg(gt, 54.3, 56.8);
  for (let i = 0; i < 9; i++) { const ph = ((gt * .3 + i / 9) % 1); if (ph < dry * 1.05) continue; folk(lerp(-120, 450, ph), 1760 + (i % 2) * 24, .72, i, { happy: 1, walk: gt * 10 + i, look: [1, 0] }); }
  const rk = pop1(gt, 57.9); if (rk > 0) { push(); translate(560, 1260); scale(rk * 1.25); rotate(-.08); sign(0, 0, 380, 120, '#e8574a', 'RENTED', { font: '400 76px "Bungee"' }); pop(); }
  camEnd();
});
// 11-13. The math on the chalkboard
shot(59.4, (lt, gt) => {
  cam(540, 960, 1.0);
  bgChalk();
  const t = gt;
  text('2× INCOME', 540, 420, { font: '400 110px "Bungee"', fill: '#ffffff' });
  if (t > 63.8) text('=', 540, 560, { font: '400 110px "Bungee"', fill: '#ffffff' });
  if (t > 64.3) text('2× ADS', 540, 700, { font: '400 100px "Bungee"', fill: '#ffd66b' });
  if (t > 65.2) text('OR', 540, 810, { font: '400 60px "Bungee"', fill: '#ffffff' });
  if (t > 65.7) text('2× POSTS', 540, 930, { font: '400 100px "Bungee"', fill: '#ff8f7a' });
  if (t < 63.8 && t > 62.4) { text('= 2× CLIENTS?', 540, 600, { font: '400 80px "Bungee"', fill: '#bfe9ff' }); }
  const hopeful = t > 62.4 && t < 63.8;
  TONY(gt, { arms: 'point', x: 540, y: 1850, s: hopeful ? 1.15 : 1.0, face: 1, look: [0, -1], sm: hopeful ? .9 : (t > 64.3 ? -.6 : .3), worry: t > 64.3 ? 1 : 0, eyes: hopeful ? 1.15 : 1, armR: { h: [110, -160], bend: -40 }, holdR: chalk, blush: hopeful });
  camEnd();
});
// 14. He's running on a treadmill (the business is a treadmill)
shot(66.95, (lt, gt) => {
  const z = lerp(1.0, 1.2, ss(seg(lt, 0, 3.5))); cam(540, 1180, z);
  bgStudio(gt);
  treadBack(540, 1680, 1.1, gt, 1.6);
  TONY(gt, { x: 540, y: 1760, s: 1.05, face: 1, sm: -.4, worry: 1, sweat: true, nerv: .4, run: true });
  treadFront(540, 1680, 1.1, 'BUSINESS', 'SPEED 12');
  for (let i = 0; i < 4; i++) { const k = (lt * .8 + i / 4) % 1; bill(lerp(540 + (i % 2 ? 120 : -120), (i % 2 ? 1000 : 80), k), lerp(1800, 2050, k), k * 5, lerp(.8, 1.3, k)); }
  camEnd();
});
// 15. Tony: "So how do the big coaches grow?" (on the floor, Dex arrives)
shot(70.7, (lt, gt) => {
  cam(540, 1180, 1.25);
  bgStudio(gt);
  TONY(gt, { x: 700, y: 1960, s: 1.0, face: -1, arms: 'down', mood: 'tired' });
  DEX(gt, { pose: 'standing/EasingColorPants', x: 230, y: 1960, s: 1.05, face: 1, look: [1, .4], holdR: mug, armR: { h: [40, 40], bend: 50 } });
  camEnd();
});
// 16. Look at Tony's clients: all from Tony, none from each other
shot(73.3, (lt, gt) => {
  cam(540, 960, 1.0);
  bgBoard();
  const N = 8, R = 400, cx = 540, cy = 960;
  for (let i = 0; i < N; i++) { const a = i / N * TAU - TAU / 4, k = seg(gt, 74.0 + i * .12, 74.4 + i * .12), x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; arrow([cx + Math.cos(a) * 120, cy + Math.sin(a) * 120], [x - Math.cos(a) * 70, y - Math.sin(a) * 70], '#ff7a6b', 10, eo(k)); if (k > 0) folk(x, y + 100, .72, i, { happy: 1, look: gt > 77.2 ? [Math.cos(a + 1.5), 0] : [-Math.cos(a), -Math.sin(a)] }); }
  // client-to-client links that don't exist
  if (gt > 77.2) for (let i = 0; i < N; i += 2) { const a = i / N * TAU - TAU / 4, b = (i + 1) / N * TAU - TAU / 4; const p = [cx + Math.cos(a) * R, cy + Math.sin(a) * R], q = [cx + Math.cos(b) * R, cy + Math.sin(b) * R]; for (let d = 0; d < 6; d++) stroke([[lerp(p[0], q[0], d / 6), lerp(p[1], q[1], d / 6)], [lerp(p[0], q[0], (d + .5) / 6), lerp(p[1], q[1], (d + .5) / 6)]], 6, { line: '#7a86a8' }); xMark((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, .35, seg(gt, 77.6 + i * .08, 77.9 + i * .08)); }
  shape(ell(cx, cy, 130, 130, 48), { fill: '#fff6e8', lw: 8, shade: () => TONY(gt, { bust: true, x: cx, y: cy + 150, s: 1.0, mood: 'smile' }) });
  text('0 REFERRALS', 540, 1620, { font: '400 84px "Bungee"', fill: gt > 78.3 ? '#ff8f7a' : 'rgba(0,0,0,0)', outlineW: gt > 78.3 ? 10 : 0 });
  camEnd();
});
// 17. The busiest gym in town
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
shot(79.4, (lt, gt) => {
  const t = gt; cam(540, 1000, 1.0 + lt * .006);
  gymFront(t);
  // a rooftop ad billboard gets an X
  push(); translate(900, 1380); shape([[-110, 0], [-80, -260], [80, -260], [110, 0]], { fill: '#ffd66b', lw: 7 }); stroke([[-90, 0], [-120, 40]], 8); stroke([[90, 0], [120, 40]], 8); text('50%', 0, -180, { font: '400 54px "Bungee"', fill: INK }); text('OFF', 0, -120, { font: '400 44px "Bungee"', fill: '#e8574a' }); text('AD', 0, -62, { font: '400 30px "Bungee"', fill: '#6b5a2a' }); pop();
  xMark(900, 1250, .9, seg(t, 81.6, 81.9));
  // an ad brings someone in once
  if (t > 83.8 && t < 85.9) { const k = seg(t, 83.8, 85.6); const x = lerp(1180, 560, k); folk(x, 1500, 1.0, 1, { walk: k < 1 ? t * 10 : 0, look: [-1, 0], face: -1 }); pill(x, 1150, 'ONCE', '#e8574a', '#ffffff', 40); }
  // a member comes back... and brings a friend
  if (t > 85.9) { const k = seg(t, 85.9, 88.4), x = lerp(-120, 470, k); folk(x, 1500, 1.0, 4, { walk: k < 1 ? t * 10 : 0, look: [1, 0] }); if (t > 87.4) { const k2 = seg(t, 87.4, 88.6), x2 = lerp(-260, 300, k2); folk(x2, 1510, 1.0, 2, { walk: k2 < 1 ? t * 10 + 1 : 0, look: [1, 0] }); if (t > 87.6) pill(x2, 1160, '+1 FRIEND', '#2f8f4a', '#ffffff', 40); } }
  camEnd();
});
// 18. Not views. People sharing. One place to belong.
shot(88.6, (lt, gt) => {
  const t = gt; cam(540, 960, 1.0);
  bgBoard();
  text('VIRAL IS...', 540, 250, { font: '400 110px "Bungee"', fill: '#ffd66b', outlineW: 12 });
  // VIEWS panel
  panel(280, 950, 450, 900, '#25385c');
  pill(280, 560, 'VIEWS', '#4f6db8', '#ffffff', 40);
  push(); translate(280, 840); shape(ell(0, 0, 150, 96, 40), { fill: '#ffffff', lw: 7 }); shape(ell(0, 0, 62, 62, 30), { fill: '#4f6db8', lw: 6 }); dot(0, 0, 24); dot(16, -16, 8, '#ffffff'); pop();
  text(String(Math.floor(1e6 + t * 98765) % 9999999).padStart(7, '0'), 280, 1040, { font: '400 92px "VT323"', fill: '#bfe9ff' });
  for (let i = 0; i < 3; i++) { folk(170 + i * 110, 1330, .55, i + 3, { happy: 0, look: [0, -1] }); }
  text('watch & leave', 280, 1440, { font: '800 40px "Baloo 2"', fill: '#9fb0d8' });
  xMark(280, 900, 1.3, seg(t, 90.9, 91.2));
  // SHARING panel
  panel(800, 950, 450, 900, '#24452f');
  pill(800, 560, 'SHARING', '#2f8f4a', '#ffffff', 40);
  const kk = seg(t, 91.6, 93.1);
  for (let i = 0; i < 4; i++) { const k = seg(kk, i * .22, i * .22 + .3); if (k <= 0 && i > 0) continue; const x = 720 + (i % 2) * 170, y = 860 + i * 160; folk(x, y, .5, i + 1, { happy: 1, look: [i % 2 ? -1 : 1, 0] }); if (i < 3 && seg(kk, i * .22 + .15, i * .22 + .4) > 0) arrow([x + (i % 2 ? -50 : 50), y - 60], [x + (i % 2 ? -120 : 120), y + 90], '#7fe08f', 8, seg(kk, i * .22 + .15, i * .22 + .4)); }
  if (t > 92.2) text('bring & stay', 800, 1440, { font: '800 40px "Baloo 2"', fill: '#a9e3b5' });
  if (t > 93.2) { const k = ss(seg(t, 93.2, 94)); fillOnly(rect(-600, -400, W + 1200, H + 800), `rgba(15,20,40,${.7 * k})`, { boil: 0 }); const kp = pop1(t, 93.3); push(); translate(540, 1000); scale(kp); panel(0, 0, 820, 360, '#fff6e8', 40); text('ONE PLACE', 0, -60, { font: '400 110px "Bungee"', fill: '#25385c' }); text('TO BELONG', 0, 70, { font: '400 110px "Bungee"', fill: '#ff6a2a' }); pop(); }
  camEnd();
});
// 19. So Tony gets a free community: every source sends people to one place
const SRC = [['ADS', '#9b5fd4', 98.3], ['POSTS', '#5bc0a0', 99.1], ['REFERRALS', '#f2a541', 100.1], ['AFFILIATES', '#4f6db8', 101.0], ['PARTNERS', '#e8574a', 102.0]];
const SRCP = [[190, 1520], [330, 1760], [540, 1600], [750, 1760], [890, 1520]];
shot(96.1, (lt, gt) => {
  const t = gt; cam(540, 1040, 1.0);
  bgCommunity();
  door(540, 1220, 380, 600, '#e8574a', 'FREE', 1, '#fff6e0');
  pill(540, 1262, 'COMMUNITY', '#25385c', '#fff3c4', 34);
  SRC.forEach(([lab, col, at], i) => { const k = pop1(t, at); if (k <= 0) return; const [x, y] = SRCP[i]; arrow([x + (540 - x) * .18, y - 60], [540 + (x - 540) * .2, 1300], col, 12, eo(seg(t, at + .1, at + .6))); push(); translate(x, y); scale(k * 1.25); pill(0, 0, lab, col, '#ffffff', lab.length > 7 ? 28 : 36); pop(); });
  if (t > 103.1) for (let i = 0; i < 10; i++) { const k = ((t - 103.1) * .55 + i / 10) % 1, [x0, y0] = SRCP[i % 5]; folk(lerp(x0, 540, k), lerp(y0 + 40, 1215, k), lerp(.8, .42, k), i, { happy: 1, walk: t * 10 }); }
  if (t < 98.2) TONY(gt, { arms: 'hips', x: 860, y: 1840, s: 1.0, face: -1, look: [-1, -.4], sm: .8, eyes: 1.1 });
  camEnd();
});
// 20. Joining is free. No checkout. Just a link. Easy to share.
shot(105.2, (lt, gt) => {
  const t = gt; cam(540, 960, 1.0);
  bgCommunity();
  // checkout register crossed out
  push(); translate(330, 620); scale(1.4); shape(rr(-160, -110, 320, 220, 20), { fill: '#c9ccd2', lw: 7 }); shape(rr(-120, -80, 240, 70, 10), { fill: '#2b2b33', lw: 5 }); text('$$$', 0, -42, { font: '400 46px "VT323"', fill: '#8fd18a' }); text('CHECKOUT', 0, 60, { font: '400 36px "Bungee"', fill: INK }); pop();
  xMark(330, 620, 1.7, seg(t, 106.7, 107.0));
  // a big link icon
  const lk = pop1(t, 107.5); if (lk > 0) { push(); translate(700, 1060); scale(lk * 1.5); rotate(-.6); for (const dx of [-60, 60]) { stroke(rr(dx - 80, -40, 160, 80, 40).concat([[dx - 40, -40]]), 30); stroke(rr(dx - 80, -40, 160, 80, 40).concat([[dx - 40, -40]]), 18, { line: '#5bc0be' }); } pop(); text('JUST A LINK', 700, 1290, { font: '400 74px "Bungee"', fill: '#2f6d5a', outlineW: 0 }); }
  // the link passed hand to hand
  if (t > 108.3) { for (let i = 0; i < 3; i++) folk(210 + i * 330, 1840, .95, i + 1, { happy: 1, look: [1, 0] }); const k = seg(t, 108.5, 110.3) * 2; const i = Math.min(1, Math.floor(k)), f = k - Math.floor(k); push(); translate(lerp(270 + i * 330, 600 + i * 330, eio(f)), 1560 - Math.sin(f * Math.PI) * 160); scale(1.4); shape(rr(-40, -24, 80, 48, 10), { fill: '#fff3c4', lw: 5 }); text('LINK', 0, 2, { font: '400 24px "Bungee"', fill: INK }); pop(); }
  camEnd();
});
// 21. Inside: onboarding welcomes each person and shows them their path
shot(110.5, (lt, gt) => {
  const t = gt; cam(540, 1000, 1.0);
  bgCommunity();
  sign(540, 400, 700, 160, '#2f6d5a', 'WELCOME!', { font: '400 110px "Bungee"' });
  // path signs
  push(); translate(720, 760); scale(1.25); stroke([[0, 0], [0, 420]], 14); sign(40, 0, 340, 90, '#5bc0be', 'LOSE FAT →', { font: '400 44px "Bungee"', rot: -.05 }); sign(40, 120, 340, 90, '#f2a541', 'GET STRONG →', { font: '400 40px "Bungee"', rot: .05 }); pop();
  // onboarding guide (a friendly member host) welcoming newcomers
  folk(300, 1700, 1.15, 4, { happy: 1, look: [1, 0] }); shape(rr(200, 1210, 200, 70, 12), { fill: '#fff3c4', lw: 5 }); text('GUIDE', 300, 1248, { font: '400 32px "Bungee"', fill: INK });
  for (let i = 0; i < 3; i++) { const at = 111.2 + i * 1.1, k = seg(t, at, at + 1.4); if (k <= 0) continue; folk(lerp(1160, 620 + i * 150, eo(k)), 1800 + i * 40, .85, i + 1, { happy: 1, walk: k < 1 ? t * 10 : 0, look: [-1, 0] }); }
  if (t > 113.6) { stars(760, 830, seg(t, 113.6, 114.6), 4, 160); }
  camEnd();
});
// 22. 5 minutes -> buy; day one -> results; week one -> full program
shot(115.3, (lt, gt) => {
  const t = gt; const part = t < 117.65 ? 0 : t < 120.15 ? 1 : 2;
  cam(540, 1000, 1.0 + (t - [115.3, 117.65, 120.15][part]) * .02);
  bgCommunity();
  if (part === 0) { clock(540, 560, 220, 0.083 + 0, 'MIN 5'); panel(800, 1420, 340, 300, '#fff6e8', 22); for (let r = 0; r < 4; r++) { shape(rr(670, 1320 + r * 64, 34, 34, 8), { fill: t > 116.6 ? '#2f8f4a' : '#ffffff', lw: 5 }); stroke([[724, 1337 + r * 64], [910 - r * 30, 1337 + r * 64]], 10, { line: '#c9bfae' }); } sign(800, 1220, 400, 100, '#5bc0be', 'STARTER PLAN', { font: '400 42px "Bungee"' }); folk(380, 1800, 1.2, 2, { happy: 1, look: [1, 0], hold: { r: (hp) => { if (t > 116.6) { shape(rr(hp[0] - 30, hp[1] - 60, 70, 74, 10), { fill: '#ffd66b', lw: 5 }); stroke(arc(hp[0] + 5, hp[1] - 60, 22, 22, Math.PI, TAU, 10), 5); } } } }); if (t > 116.6) check(800, 1040, 1.0, seg(t, 116.7, 117.0)); }
  if (part === 1) { sign(540, 460, 520, 150, '#f2a541', 'DAY 1', { font: '400 120px "Bungee"' }); shape(rr(340, 1700, 400, 90, 24), { fill: '#e9ecef', lw: 7 }); text('-2 kg', 540, 1610, { font: '400 100px "VT323"', fill: '#2f8f4a' }); folk(540, 1720, 1.3, 2, { happy: 1, look: [0, 1] }); stars(540, 1100, seg(t, 118.7, 119.9), 6, 200); }
  if (part === 2) { sign(540, 460, 560, 150, '#9b7fd4', 'WEEK 1', { font: '400 120px "Bungee"' }); push(); translate(760, 1200); const k = pop1(t, 121.2); scale(k * 1.3); shape(rr(-150, -110, 300, 220, 20), { fill: '#e8574a', lw: 7 }); text('12-WEEK', 0, -30, { font: '400 50px "Bungee"', fill: '#fff3c4' }); text('PROGRAM', 0, 30, { font: '400 50px "Bungee"', fill: '#fff3c4' }); pop(); folk(330, 1820, 1.25, 2, { happy: 1, look: [1, -.4] }); }
  camEnd();
});
// 23. 30-day challenge: they're already inside. No ads.
shot(123.0, (lt, gt) => {
  const t = gt; cam(540, 1000, 1.0);
  bgCommunity();
  const bk = back(seg(t, 123.5, 124.1), 1.6); push(); translate(540, 200); shape(rect(-360, 0, 720, 300 * bk), { fill: '#e8574a', lw: 8 }); if (bk > .8) { text('30-DAY', 540 - 540, 110, { font: '400 100px "Bungee"', fill: '#fff3c4', outlineW: 10 }); text('CHALLENGE', 0, 220, { font: '400 90px "Bungee"', fill: '#fff3c4', outlineW: 10 }); } pop();
  for (let i = 0; i < 9; i++) { const r = Math.floor(i / 3), c = i % 3; const jump = t > 125.4 ? Math.abs(Math.sin(t * 7 + i)) * 40 : 0; folk(200 + c * 340 + (r % 2) * 60, 1000 + r * 330 - jump, .85, i, { happy: 1, look: [0, -1] }); }
  if (t > 126.9) { fillOnly(rect(-600, -400, W + 1200, H + 800), 'rgba(40,20,10,0.25)', { boil: 0 }); push(); translate(540, 1500); scale(.75); adsMachine(0, 0, t, { on: 0 }); pop(); xMark(540, 1000, 2.0, seg(t, 127.0, 127.3)); text('NO ADS', 540, 1600, { font: '400 64px "Bungee"', fill: '#e8574a', outlineW: 10 }); }
  camEnd();
});
// 24. Tony whispers: "And they post their progress..."
shot(128.1, (lt, gt) => {
  cam(540, 960, 1.0);
  bgCommunity();
  for (let i = 0; i < 3; i++) { push(); translate(200 + i * 340, 380 + (i % 2) * 60); rotate((i - 1) * .12); shape(rr(-100, -170, 200, 340, 24), { fill: '#2b2b33', lw: 7, shade: () => fillOnly(rr(-86, -150, 172, 290, 14), '#fff6e0') }); folk(0, 80, .42, i + 2, { happy: 1 }); text('♥ ' + (12 + i * 31 + Math.floor((gt - 128) * 20)), 0, 120, { font: '400 34px "Baloo 2"', fill: '#e8574a' }); pop(); }
  TONY(gt, { bust: true, x: 540, y: 1940, s: 4.0, mood: 'cheeky', tilt: -.06, arms: 'hips' });
  camEnd();
});
// 25. And bring their gym buddy... the viral loop
shot(130.1, (lt, gt) => {
  const t = gt;
  if (t < 132.7) {
    cam(540, 1150, 1.15); bgCommunity(); door(540, 1220, 340, 520, '#e8574a', 'FREE', 1, '#fff6e0');
    for (let p = 0; p < 3; p++) { const k = seg(t, 130.3 + p * .7, 131.9 + p * .7); if (k <= 0) continue; const x = lerp(-120 - p * 60, 470, k), y = 1720 - p * 60; folk(x, y, .9, p * 2, { walk: t * 10, look: [1, 0] }); folk(x - 200, y + 30, .9, p * 2 + 1, { walk: t * 10 + 1, look: [1, 0] }); }
    camEnd(); return;
  }
  cam(540, 1010, 1.1);
  bgBoard();
  const R = 400, cx = 540, cy = 1000;
  stroke([...ell(cx, cy, R, R, 80), ell(cx, cy, R, R, 80)[0]], 26); stroke([...ell(cx, cy, R, R, 80), ell(cx, cy, R, R, 80)[0]], 14, { line: '#ff7a3a' });
  const ST = [['FOLLOWERS', -Math.PI / 2, 132.8], ['MEMBERS', Math.PI / 6, 133.8], ['BUYERS', Math.PI * 5 / 6, 135.4]];
  // runners accelerate around the loop and the crowd grows
  const speed = 0.25 + seg(t, 136, 139) * .7, n = 4 + Math.floor(seg(t, 136.2, 139.5) * 12);
  for (let i = 0; i < n; i++) { const a = ((t * speed + i / n) % 1) * TAU - Math.PI / 2; folk(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10) + 70, .6, i, { happy: 1, walk: t * 12 + i }); }
  for (const [lab, a, at] of ST) { const k = pop1(t, at); if (k > 0) { push(); translate(cx + Math.cos(a) * R, cy + Math.sin(a) * R); scale(k * 1.25); shape(rr(-150, -50, 300, 100, 20), { fill: '#fff3c4', lw: 7 }); text(lab, 0, 4, { font: '400 44px "Bungee"', fill: INK }); pop(); } }
  if (t > 136.2) arrow([cx + 150, cy + R + 120], [cx - 120, cy + R + 120], '#2f8f4a', 10, seg(t, 136.2, 136.8));
  if (t > 138.0) { const k = pop1(t, 138.0); push(); translate(cx, cy); scale(k); text('VIRAL', 0, -30, { font: '400 120px "Bungee"', fill: '#ffd66b', outlineW: 12 }); text('LOOP', 0, 90, { font: '400 120px "Bungee"', fill: '#ffd66b', outlineW: 12 }); pop(); }
  camEnd();
});
// 26. One month later... a week off (beach); "Did my leads disappear?"; "kept growing"
shot(139.6, (lt, gt) => {
  const t = gt;
  if (t < 141.0) { bgBoard(); const k = pop1(t, 139.65); push(); translate(540, 960); scale(k); shape(rr(-330, -230, 660, 380, 40), { fill: '#fff6e0', lw: 9, shade: () => fillOnly(rect(-340, -240, 680, 90), '#ff6a2a') }); for (const sx of [-1, 1]) shape(rr(sx * 180 - 16, -270, 32, 80, 14), { fill: '#3b3540', lw: 6 }); text('ONE MONTH', 0, -40, { font: '400 100px "Bungee"', fill: '#25385c' }); text('LATER', 0, 80, { font: '400 100px "Bungee"', fill: '#ff6a2a' }); pop(); return; text('ONE MONTH', 540, 900, { font: '400 120px "Bungee"', fill: '#fff3c4', outlineW: 10 }); text('LATER', 540, 1040, { font: '400 120px "Bungee"', fill: '#fff3c4', outlineW: 10 }); return; }
  const cu = t > 142.2 && t < 144.0; cam(cu ? 540 : 560, cu ? 960 : 1250, cu ? 1.0 : 1.12);
  if (t < 144.0) { if (cu) bgBeach(t); else beachSet(t, 0); if (cu) {
      // "Did my leads disappear?" — he checks, worried... and the phone floods with new leads
      const hit = 143.15, flood = ss(seg(t, hit, 143.95));
      TONY(gt, { bust: true, x: 540, y: 1960, s: 3.8, mood: t < 143.4 ? 'worried' : 'happy', arms: 'down', bare: true });
      const qk = seg(t, 142.3, 143.2); if (qk > 0 && qk < 1) { const a = Math.min(1, qk * 6, (1 - qk) * 6); push(); translate(300, 560 - 20 * qk); rotate(-.15 + Math.sin(t * 9) * .05); scale(back(seg(t, 142.3, 142.6), 2.2)); text('?', 0, 0, { font: '400 170px "Bungee"', fill: '#ff6a2a', outlineW: 12, outlineCol: '#fff6e0' }); pop(); }
      const buzz = t > hit && t < hit + .5 ? Math.sin(t * 90) * 6 * (1 - (t - hit) / .5) : 0;
      push(); translate(820 + buzz, 1540); rotate(-.12);
      shape(rr(-140, -250, 280, 500, 36), { fill: '#1d1b24', lw: 9, shade: () => {
        fillOnly(rr(-120, -226, 240, 452, 22), '#fff6e0');
        fillOnly(rr(-120, -226, 240, 70, 22), '#25385c'); text('NEW LEADS', 0, -190, { font: '400 30px "Bungee"', fill: '#ffffff' });
        if (t < hit) { for (let i = 0; i < 3; i++) dot(-34 + i * 34, -60, 9 + 5 * Math.max(0, Math.sin(t * 9 - i * .9)), '#8a8494'); text('checking...', 0, 10, { font: '800 30px "Baloo 2"', fill: '#8a8494' }); }
        else {
          text('+' + Math.round(flood * 47), 0, -95, { font: '400 92px "Bungee"', fill: '#2f8f4a' });
          const items = [['New lead', '#5bc0be'], ['New member', '#ff6a2a'], ['New lead', '#5bc0be'], ['New member', '#ff6a2a']];
          items.forEach(([lb, c], i) => { const k = seg(t, hit + .1 + i * .18, hit + .32 + i * .18); if (k <= 0) return; const y = -10 + i * 56; push(); translate((1 - eo(k)) * 160, y); shape(rr(-104, -22, 208, 44, 14), { fill: '#ffffff', lw: 4 }); dot(-84, 0, 10, c); text(lb, 14, 2, { font: '800 24px "Baloo 2"', fill: INK }); pop(); });
        } } });
      pop();
      stars(820, 1300, seg(t, 143.3, 144.0), 6, 220);
    } else TONY(gt, { ...LOUNGE, mood: 'happy', shades: true }); }
  else { bgBeach(t);
    TONY(gt, { x: 330, y: 1960, s: 1.15, face: 1, mood: 'happy', arms: 'phone', bare: true, shades: false });
    push(); translate(760, 1020); scale(1.15); shape(rr(-170, -300, 340, 600, 30), { fill: '#2b2b33', lw: 8, shade: () => fillOnly(rr(-150, -270, 300, 540, 18), '#fff6e0') }); text('MEMBERS', 0, -200, { font: '400 40px "Bungee"', fill: INK }); text(String(1200 + Math.floor(seg(t, 144.2, 146.6) * 860)), 0, -100, { font: '400 100px "VT323"', fill: '#2f8f4a' }); for (let i = 0; i < 6; i++) { const h = 40 + i * 30 * (0.4 + seg(t, 144.2, 146.6) * .6); shape(rect(-120 + i * 42, 220 - h, 30, h), { fill: '#5bc0be', lw: 4 }); } pop();
  }
  camEnd();
});
// 27. That's what Buzztorm builds
shot(146.6, (lt, gt) => {
  const t = gt; const intro = t < 148.5; cam(540, intro ? 1000 - seg(t, 146.6, 148.5) * 60 : 1000, intro ? 1.0 + seg(t, 146.6, 148.5) * .06 : 1.0);
  bgStage();
  if (intro) { const k = pop1(t, 147.2); push(); translate(540, 300); scale(.6 + .4 * k); sign(0, 0, 700, 170, '#ff5a1f', 'BUZZTORM', { font: '400 130px "Bungee"', fg: '#fff3c4' }); pop();
    for (let i = 0; i < 7; i++) { const a = t * 2 + i * .9; text('✦', 540 + Math.cos(a) * (420 + i * 9), 300 + Math.sin(a) * 140, { font: '400 46px "Bungee"', fill: '#ffd66b', outlineW: 0 }); }
    DEX(gt, { x: 1200 - seg(t, 146.6, 147.4) * 660, y: 1950, s: 1.15, face: 1, look: [.2, -.8], armR: { h: [120, -170], bend: -20 } }); }
  else sign(540, 300, 700, 170, '#ff5a1f', 'BUZZTORM', { font: '400 130px "Bungee"', fg: '#fff3c4' });
  if (t >= 148.5 && t < 151.7) { softbox(960, 1700, 1.0, -1); cameraRig(760, 1700, gt, 1.05, -1); TONY(gt, { arms: 'point', x: 330, y: 1900, s: 1.2, face: 1, look: [1, 0], sm: .9, ringLight: false, armR: { h: [120, -120], bend: -30 } }); }
  if (t >= 151.7 && t < 155.6) { const L = [['COMMUNITY', 152.2], ['ONBOARDING', 153.0], ['OFFERS', 153.9], ['PAYMENTS', 154.8]]; L.forEach(([lab, at], i) => { const k = pop1(t, at); if (k <= 0) return; push(); translate(600, 620 + i * 200); scale(k * 1.15); shape(rr(-300, -60, 600, 120, 22), { fill: ['#5bc0be', '#f2a541', '#9b7fd4', '#2f8f4a'][i], lw: 7 }); text(lab, 0, 4, { font: '400 60px "Bungee"', fill: '#ffffff', outlineW: 8 }); pop(); check(990, 620 + i * 200, .6, seg(t, at + .2, at + .45)); }); DEX(gt, { x: 230, y: 2000, s: 1.05, face: 1, look: [1, -.5], holdR: tablet, armR: { h: [40, 30], bend: 50 } }); }
  if (t >= 155.6) { ['MEMBERS', 'CONTENT', 'SALES'].forEach((lab, i) => { const at = [155.8, 156.6, 157.6][i], k = pop1(t, at); if (k <= 0) return; push(); translate(540, 700 + i * 230); scale(k * 1.3); shape(rr(-260, -70, 520, 140, 22), { fill: '#fff3c4', lw: 7 }); text(lab, -40, 4, { font: '400 60px "Bungee"', fill: INK }); pop(); }); if (t > 158.5) { push(); translate(540, 1500); rotate(-.12); scale(pop1(t, 158.6) * 1.4); sign(0, 0, 420, 130, '#e8574a', 'YOURS', { font: '400 100px "Bungee"' }); pop(); } }
  camEnd();
});
// 28. Honest fit: we'll tell you before you pay (Dex close-up)
shot(159.7, (lt, gt) => {
  cam(540, 960, 1.0 + lt * .01);
  bgStage();
  DEX(gt, { bust: true, x: 540, y: 1940, s: 3.8, mood: 'calm', pose: 'effigy/BlazerBlackTee' });
  camEnd();
});
// 29. CTA: book a free 30-minute call at buzztorm.com — you'll leave with a plan
shot(162.6, (lt, gt) => {
  const t = gt; cam(540, 1060, 1.0 + seg(t, 164.3, 165.4) * .05);
  bgStage();
  push(); translate(540, 700); scale(1.1); shape(rr(-430, -260, 860, 520, 34), { fill: '#fff3c4', lw: 9, shade: () => fillOnly(rect(-460, 150, 920, 140), '#ffd66b') }); text('FREE 30-MIN CALL', 0, -150, { font: '400 64px "Bungee"', fill: INK }); text('buzztorm.com', 0, 10, { font: '400 104px "Bungee"', fill: '#ff5a1f', outlineW: 12 }); text('LEAVE WITH A PLAN', 0, 200, { font: '400 50px "Bungee"', fill: INK }); pop();
  stars(540, 650, seg(t, 164.4, 165.6), 7, 480);
  DEX(gt, { pose: 'standing/EasingColorPants', x: 230, y: 2000, s: 1.1, face: 1, look: [1, -.6], armR: { h: [120, -200], bend: -50 } });
  TONY(gt, { arms: 'hips', x: 790, y: 1990, s: 1.1, face: -1, look: [-1, -.6], sm: .8, ringLight: false, holdL: t > 165.8 ? (hp) => { push(); translate(hp[0], hp[1] - 40); shape(rr(-50, -70, 100, 140, 10), { fill: '#ffffff', lw: 5 }); text('PLAN', 0, 0, { font: '400 30px "Bungee"', fill: '#2f6d5a' }); pop(); } : undefined, armL: { h: [-120, -60], bend: 30 } });
  camEnd();
});
// 30. "Can I finally take off the ring light?" / "Please." / boing
shot(168.4, (lt, gt) => {
  const t = gt, cu = t < 170.85; cam(cu ? 540 : 520, cu ? 960 : 1300, cu ? 1.0 : 1.25);
  bgStage();
  const off = t > 171.2, fk = seg(t, 171.2, 171.75);
  if (!cu) DEX(gt, { x: 210, y: 1900, s: 1.0, face: 1, look: [1, 0], lid: .65, holdR: mug, armR: { h: [40, 40], bend: 50 } });
  if (cu) { stroke([...ell(540, 900, 380, 380, 90), ell(540, 900, 380, 380, 90)[0]], 60, { line: '#2e2a35' }); stroke([...ell(540, 900, 380, 380, 90), ell(540, 900, 380, 380, 90)[0]], 34, { line: '#fff6d6' }); TONY(gt, { bust: true, x: 540, y: 1940, s: 4.0, mood: 'hopeful', arms: 'down' }); }
  else TONY(gt, { x: 720, y: 1820, s: 1.05, face: -1, mood: off ? 'happy' : 'smile', arms: off ? 'flex' : 'hips', ringLight: !off });
  if (off) { push(); translate(lerp(846, 1000, fk), lerp(896, 1760, fk * fk)); rotate(fk * 4); stroke([...ell(0, 0, 110, 110, 48), ell(0, 0, 110, 110, 48)[0]], 32); stroke([...ell(0, 0, 110, 110, 48), ell(0, 0, 110, 110, 48)[0]], 22, { line: '#bdb6a3' }); pop(); }
  camEnd();
});

// =================== render ===================
const WIPE = [95.0, 96.1];   // [start, end] seconds of the orange portal swirl transition, or null
SH.sort((a, b) => a[0] - b[0]);
export async function renderFrame(f) {
  for (let pass = 0; pass < 6; pass++) { drawFrame(f); const p = takePending(); if (!p.length) break; await Promise.all(p); }
  return true;
}
function drawFrame(f) {
  const gt = f / FPS; CUR_T = gt;
  let i = 0; for (let k = 0; k < SH.length; k++) if (gt >= SH[k][0]) i = k;
  const [t0, fn] = SH[i];
  applyAspect(i);
  frame(gt, { amp: 1.2 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
  const t1 = i + 1 < SH.length ? SH[i + 1][0] : (LIPS ? LIPS.N / FPS : t0 + 5), zk = 1 + .035 * ss(clamp((gt - t0) / (t1 - t0)));
  push(); translate(W / 2, H / 2); scale(zk); translate(-W / 2, -H / 2);
  fn(gt - t0, gt);
  pop();
  // portal swirl wipe (story-specific: set WIPE = null to disable, or move it to your own transition time)
  const pw = WIPE ? seg(gt, WIPE[0], WIPE[1]) : 0;
  if (pw > 0 && pw < 1) {
    const r = 2400 * ei(pw); push(); translate(540, 960);
    shape(ell(0, 0, r * .9, r, 60), { fill: '#ff5a1f', lw: 9, shade: () => { for (let i = 0; i < 5; i++) fillOnly(arc(0, 0, r * (.8 - i * .14), r * (.9 - i * .16), i * 1.3 + gt * 6, i * 1.3 + gt * 6 + 2.6, 24), ['#ff8a3d', '#ffb547', '#ffd88a', '#fff3d6', '#ffffff'][i], { boil: .5 }); } });
    pop();
  }
  captions(gt);
  post(f);
}
let GRAIN = null;
function post(f) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const hd = Math.hypot(CW, CH); const v = g.createRadialGradient(CW / 2, CH * .46, hd * .28, CW / 2, CH * .5, hd * .68); v.addColorStop(0, 'rgba(20,10,30,0)'); v.addColorStop(1, 'rgba(20,10,30,0.26)');
  g.fillStyle = v; g.fillRect(0, 0, CW, CH);
  if (!GRAIN) { GRAIN = []; for (let n = 0; n < 4; n++) { const c = new OffscreenCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256); for (let p = 0; p < d.data.length; p += 4) { const r = Math.random() * 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = r; d.data[p + 3] = 255; } x.putImageData(d, 0, 0); GRAIN.push(g.createPattern(c, 'repeat')); } }
  g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; g.fillStyle = GRAIN[Math.floor(f / 2) % 4]; g.fillRect(0, 0, CW, CH); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
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
let CAP = [575, 1075];
export async function renderThumb(gt = 143.9) {
  const q = new URLSearchParams(location.search), v = q.get('v');
  setView(+(q.get('w') || 1080), +(q.get('h') || 1920), +(q.get('ox') || 0), +(q.get('oy') || 0), +(q.get('sc') || 1));
  if (q.get('cap')) CAP = q.get('cap').split(',').map(Number);
  for (let pass = 0; pass < 6; pass++) { if (q.get('a2')) A2 = { ...A2, ...JSON.parse(q.get('a2')) }; if (v === 'sets') gallerySets(+(q.get('i') || 0)); else if (v === 'props') galleryProps(); else if (v === 'style') galleryStyle(); else if (v === 'academy2') thumbAcademy2(gt); else if (v === 'academy') thumbAcademy(gt, q.get('lang') || 'en'); else thumbDraw(gt); const p = takePending(); if (!p.length) break; await Promise.all(p); }
  return true;
}
