// peeps.js — Open Peeps (CC0 illustrations by Pablo Stanley; npm @opeepsfun/open-peeps, MIT) composed and drawn on our canvas.
// A character = body pose + head (hair) + face + optional beard/accessory, recoloured. Origin = neck point; drawn into the toon.js transform.
import { g, getM } from './toon.js';
let PARTS = null, OFF = null, MEAS = null, MOUTH = null;
const CACHE = new Map(); let PENDING = [];
export async function loadPeeps() {
  [PARTS, OFF, MEAS, MOUTH] = await Promise.all(['parts', 'offsets', 'measure', 'mouths'].map(n => fetch(`/peeps/${n}.json`).then(r => r.json())));
}
const SENT = { outline: '#a00000', skin: '#a00001', top: '#a00002', shoes: '#a00003', pants: '#a00004', jacket: '#a00005', hair: '#a00006', cap: '#a00007', blazer: '#a00008', cup: '#a00009', paper: '#a0000a', beard: '#a0000b', computer: '#a0000c', frame: '#a0000d', coat: '#a0000e', pocket: '#a0000f' };
const DEF = { outline: '#1b1422', skin: '#e8b48a', top: '#9fd0ff', shoes: '#ffffff', pants: '#2b2f3a', jacket: '#25385c', hair: '#1b1422', cap: '#e8574a', blazer: '#25385c', cup: '#ffffff', paper: '#ffffff', beard: '#1b1422', computer: '#c9ccd2', frame: '#1b1422', coat: '#ffffff', pocket: '#ffffff' };
function img(key, col) {
  const id = key + '|' + JSON.stringify(col); let e = CACHE.get(id); if (e) return e.ok ? e.im : null;
  const P = PARTS[key]; if (!P) { console.warn('missing part', key); return null; }
  let svg = P.svg; for (const [k, s] of Object.entries(SENT)) svg = svg.split(s).join(col[k] || DEF[k]);
  const vb = P.cfg.viewBox.split(' ').map(Number);
  const im = new Image(); e = { im, ok: false, vb }; CACHE.set(id, e);
  PENDING.push(new Promise(res => { im.onload = () => { e.ok = true; res(); }; im.onerror = () => res(); }));
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${P.cfg.viewBox}" width="${vb[2]}" height="${vb[3]}">${svg}</svg>`);
  return null;
}
export function takePending() { const p = PENDING; PENDING = []; return p; }
function draw(key, col, x, y, alpha = 1) {
  const im = img(key, col); if (!im) return; const e = CACHE.get(key + '|' + JSON.stringify(col));
  const m = getM(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); if (alpha < 1) g.globalAlpha = alpha;
  g.drawImage(im, x + e.vb[0], y + e.vb[1], e.vb[2], e.vb[3]); g.globalAlpha = 1;
}
const xy = (s) => (s || '0 0').split(/[ ,]+/).map(Number);
// head group relative to the neck point (from the Effigy layout: body at 147,639; hair 342,190; face 531,366; beard 495,518; acc 419,421)
const NECK_EFF = [147 + 458, 639];
export function head(P, col) {
  const hk = P.head, ho = xy(OFF.hair[hk]);
  draw('head/' + hk, col, 342 + ho[0] - NECK_EFF[0], 190 + ho[1] - NECK_EFF[1]);
  if (P.face) {
    const fx = 531 - NECK_EFF[0], fy = 366 - NECK_EFF[1];
    draw('faceU/' + (P.blink ? 'EyesClosed' : P.face), col, fx, fy);
    if (P.vis && P.vis !== 'X' && P.talking) shapeMouth(fx, fy, P, col.outline || '#17141c');
    else if (!P.vis && (P.mouthOpen || 0) > .08) viseme(fx, fy, P, col.outline || '#17141c');
    else draw('faceM/' + (P.restMouth || P.face), col, fx, fy);
  }
  if (P.beard) { const bo = xy(OFF.beard[P.beard]); draw('beard/' + P.beard, col, 495 + bo[0] - NECK_EFF[0], 518 + bo[1] - NECK_EFF[1]); }
  if (P.acc) { const ao = xy(OFF.acc[P.acc]); draw('accessory/' + P.acc, col, 419 + ao[0] - NECK_EFF[0], 421 + ao[1] - NECK_EFF[1]); }
}
export function bodyInfo(key) { return MEAS['body/' + key]; }
export function body(key, col) { const m = MEAS['body/' + key]; draw('body/' + key, col, -m.neck.x, 0); return m; }

// hand-made mouth shapes in the Open Peeps brush style (face coordinates, 289x293 box)
function viseme(fx, fy, P, ink) {
  const mo = MOUTH[P.face] || [155, 230, 70, 30]; const o = Math.min(1, P.mouthOpen), c = P.curve ?? .5, wv = P.mouthW ?? 1;
  const cx = fx + mo[0], cy = fy + Math.min(mo[1], 236), W = (84 + 60 * o) * wv, Hh = 18 + 72 * o;
  const m = getM(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  const L = [cx - W / 2, cy - c * 12], R = [cx + W / 2, cy - c * 12];
  g.beginPath(); g.moveTo(L[0], L[1]);
  g.bezierCurveTo(cx - W * .2, cy - 6 + c * 4, cx + W * .2, cy - 6 + c * 4, R[0], R[1]);
  g.bezierCurveTo(cx + W * .45, cy + Hh * (.9 + c * .2), cx - W * .45, cy + Hh * (.9 + c * .2), L[0], L[1]);
  g.closePath(); g.fillStyle = ink; g.fill();
  g.save(); g.clip();
  if (o > .35) { g.fillStyle = '#EC7495'; g.beginPath(); g.ellipse(cx + W * .05, cy + Hh * .95, W * .28, Hh * .38, 0, 0, Math.PI * 2); g.fill(); }
  if (o > .45 && c > .2) { g.fillStyle = '#ffffff'; g.fillRect(cx - W * .32, cy - 16, W * .64, 12 + Hh * .12); }
  g.restore();
  g.lineWidth = 7; g.lineCap = 'round'; g.strokeStyle = ink; g.beginPath(); g.moveTo(L[0] - 4, L[1] - 2 * c); g.lineTo(L[0] + 2, L[1] + 2); g.stroke();
}

// —— phoneme mouth shapes (Hanna-Barbera / Rhubarb set) ——
// A M/B/P lips pressed · B most consonants, clenched teeth · C EH/AE open · D AA wide open · E AO/ER rounded
// F UW/OW/W pucker · G F/V teeth on lower lip · H L tongue up · X rest (the face's own mouth)
const SHAPE = { A: [1.0, 0, 0, 0, 0], B: [1.0, .4, 0, 1, 0], C: [1.0, .62, 0, 1, .5], D: [1.15, 1.0, 0, 1, 1], E: [.78, .6, .55, 0, .4], F: [.5, .42, 1, 0, .2], G: [.95, .3, 0, 2, 0], H: [1.0, .7, 0, 1, 2] };
function shapeMouth(fx, fy, P, ink) {
  const mo = MOUTH[P.face] || [155, 230, 70, 30]; const sh = SHAPE[P.vis] || SHAPE.C, c = P.curve ?? .5;
  const e = .8 + .4 * Math.min(1, P.mouthOpen || 0);          // energy breathes the size a little
  const cx = fx + mo[0], cy = fy + Math.min(mo[1], 236), W = 118 * sh[0] * (P.mouthW ?? 1), Hh = 8 + 82 * sh[1] * e, rd = sh[2];
  const m = getM(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink;
  if (P.vis === 'A') {   // pressed lips: a firm line with tiny corners
    g.lineWidth = 9; g.beginPath(); g.moveTo(cx - W * .42, cy - c * 8); g.quadraticCurveTo(cx, cy + 6 + c * 6, cx + W * .42, cy - c * 8); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(cx - W * .42 - 4, cy - c * 8 - 6); g.lineTo(cx - W * .42 + 3, cy - c * 8 + 3); g.stroke(); return;
  }
  const L = [cx - W / 2, cy - c * 10 * (1 - rd)], R = [cx + W / 2, cy - c * 10 * (1 - rd)];
  g.beginPath();
  if (rd > .3) { g.ellipse(cx, cy + Hh * .35, W / 2, Hh * .62 + 6, 0, 0, Math.PI * 2); }
  else {
    g.moveTo(L[0], L[1]);
    g.bezierCurveTo(cx - W * .2, cy - 6 + c * 4, cx + W * .2, cy - 6 + c * 4, R[0], R[1]);
    g.bezierCurveTo(cx + W * .45, cy + Hh * (.9 + c * .2), cx - W * .45, cy + Hh * (.9 + c * .2), L[0], L[1]); g.closePath();
  }
  g.fillStyle = ink; g.fill(); g.save(); g.clip();
  if (sh[4] >= 2) { g.fillStyle = '#EC7495'; g.beginPath(); g.ellipse(cx, cy + Hh * .2, W * .22, Hh * .4, 0, 0, Math.PI * 2); g.fill(); }        // L: tongue up
  else if (sh[4] > 0) { g.fillStyle = '#EC7495'; g.beginPath(); g.ellipse(cx + W * .05, cy + Hh * .95, W * .3 * sh[4] + 8, Hh * .38, 0, 0, Math.PI * 2); g.fill(); }
  if (sh[3] === 1) { g.fillStyle = '#ffffff'; g.fillRect(cx - W * .34, cy - 18, W * .68, 12 + Hh * .14); }
  if (sh[3] === 2) { g.fillStyle = '#ffffff'; g.fillRect(cx - W * .3, cy - 18, W * .6, 10 + Hh * .5); }                                          // F/V: teeth over lip
  g.restore();
  if (sh[3] === 2) { g.lineWidth = 6; g.beginPath(); g.moveTo(cx - W * .32, cy + Hh * .55); g.lineTo(cx + W * .32, cy + Hh * .55); g.stroke(); }
  if (rd <= .3) { g.lineWidth = 7; g.beginPath(); g.moveTo(L[0] - 4, L[1] - 2 * c); g.lineTo(L[0] + 2, L[1] + 2); g.stroke(); }
}
