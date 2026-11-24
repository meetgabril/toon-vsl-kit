// chars2.js — Buzztorm cast v4 built on Open Peeps illustrations (CC0, Pablo Stanley).
// Dex (host): pompadour, chin beard, navy blazer, grey trousers. Tony (coach): flat top, coral tee, black joggers, white sneakers.
// Animation: pose swaps, head tilt/nod, face swaps (mood + lip sync), breathing, sway, walk bounce, squats.
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { push, pop, translate, scale, rotate, fillOnly, ell, arc, shape, stroke, spline, dot, noodle, quad, rr, text } from './toon.js';
import { body, head, bodyInfo } from './peeps.js';
import { g, getM, zoom } from './toon.js';

export const DEXC = { skin: '#f0c7a0', jacket: '#2c3e66', blazer: '#2c3e66', pants: '#c8bba2', shoes: '#6b4128', top: '#232030', outline: '#17141c' };
export const TONYC = { skin: '#e9ad80', top: '#17141c', pants: '#e9ad80', shoes: '#ffffff', jacket: '#17141c', hair: '#f2cd6b', outline: '#17141c' };
const FACES = {   // [eyes+nose face, resting mouth face, mouth curve for speech]
  calm: ['Smile', 'Smile', .4], smile: ['Smile', 'Smile', .5], happy: ['SmileTeeth', 'BigSmile', .9], serious: ['Serious', 'Serious', 0],
  worried: ['Concerned', 'Tired', -.5], fear: ['ConcernedFear', 'ConcernedFear', -.6], awe: ['Awe', 'Awe', .2], hopeful: ['Cute', 'Cute', .7], driven: ['Driven', 'Driven', .3],
  panic: ['Fear', 'Fear', -.7], hectic: ['Hectic', 'Hectic', -.4], sad: ['Solemn', 'Solemn', -.5], cheeky: ['Cheeky', 'Cheeky', .6], tired: ['Tired', 'Tired', -.3], sleep: ['EyesClosed', 'EyesClosed', 0], blank: ['Blank', 'Blank', 0],
};
// —— cast registry: one entry per speaking character (key = speaker letter used in lines.txt / lips.json) ——
// rig 'peeps' = Open Peeps body (pose = 'standing/…' | 'sitting/…' | 'effigy/…' bust) · rig 'coach' = Tony's custom muscular rig (tonyBody3)
export const CAST = {
  D: { name: 'Dex', rig: 'peeps', head: 'Pomp', beard: 'Chin', col: DEXC, scale: .27, seed: 1.7, pose: 'standing/EasingColorPants', bust: 'effigy/BlazerBlackTee' },
  T: { name: 'Tony', rig: 'coach', head: 'ShortFour', col: TONYC, scale: .275, seed: 4.3, bandana: true },
};
export function addCast(sp, def) { CAST[sp] = { rig: 'peeps', scale: .27, seed: 1 + Object.keys(CAST).length * 1.3, pose: 'standing/BlazerColorPants', bust: 'effigy/Tee', ...def }; return CAST[sp]; }
const HEADS = new Proxy({}, { get: (o, sp) => CAST[sp] ? { head: CAST[sp].head, beard: CAST[sp].beard, acc: CAST[sp].acc } : {} });
const SCALE = new Proxy({ TF: .275 }, { get: (o, sp) => CAST[sp] ? CAST[sp].scale : o[sp] });
const ANCH = { 'standing/CrossArmColorTee': [1083, 1190], 'standing/WalkingColorTee': [1083, 1190], 'standing/Dancer': [1083, 1190], 'standing/Dancer': [1472, 716], 'standing/BlazerColorPants': [1232, 828], 'sitting/HandsBackColorTee': [1320, 1172], 'standing/PointingFingerColorPants': [1552, 300] };

// P: { x, y (feet), s, face (1/-1), pose, mood, open (0..1 mouth), talk (0..1 energy), t, tilt, squat (0..1), bounce, acc, alpha, hold(fn(hx,hy)) }
// Tony's hero build: an Open Peeps bust (scaled up for a big chest/shoulders/arms) over a pair of legs from a standing pose
const TONY_UP = 1.2, NECKX = { 'effigy/PointingUp': 452 };
const FISTS = { 'effigy/GymShirt': [[-378, 735], [290, 735]], 'effigy/Explaining': [[262, 720]] };
function heroBody(pose, legs, col) {
  const mu = bodyInfo(pose), ml = bodyInfo(legs); const cut = mu.bbox.y1 * TONY_UP - 40;
  const M = getM(); g.save(); g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); g.beginPath(); g.rect(-4000, cut, 8000, 6000); g.clip();
  push(); scale(1.14, 1); body(legs, col); socks(); pop(); g.restore();
  shorts(cut);
  push(); scale(TONY_UP); if (NECKX[pose]) translate(mu.neck.x - NECKX[pose], 0); body(pose, col); if (pose === 'effigy/GymShirt') muscles();
  for (const [fx, fy] of FISTS[pose] || []) { shape(spline([[fx - 46, fy - 14], [fx + 46, fy - 14], [fx + 54, fy + 60], [fx + 36, fy + 118], [fx - 10, fy + 128], [fx - 44, fy + 96], [fx - 54, fy + 40]]), { fill: col.skin, lw: 9, boil: .2 }); stroke([[fx - 20, fy + 70], [fx + 30, fy + 64]], 6, { boil: .2 }); stroke([[fx - 18, fy + 96], [fx + 26, fy + 92]], 6, { boil: .2 }); }
  pop();
  return ml;
}
export function peep(sp, P) {
  const hero = false, CI = CAST[sp] || CAST.D, full = CI.rig === 'coach';
  const pose = P.pose || (P.bust ? CI.bust : CI.pose), m = full ? { bbox: { y1: 2480 }, neck: { x: 0 } } : bodyInfo(pose); if (!m) { console.warn('pose?', pose); return; }
  const col = P.col || CI.col || DEXC, k = SCALE[sp] * (P.s ?? 1), t = P.t || 0, f = P.face ?? 1;
  const seed = CI.seed;
  const breath = 1 + Math.sin(t * 2.2 + seed) * .007, sway = Math.sin(t * .9 + seed) * .008 + (P.lean || 0);
  const squat = P.squat || 0, bounce = P.bounce || 0;
  push(); translate(P.x, P.y - bounce);
  if (!P.noShadow) fillOnly(ell(0, 4 + bounce, 150 * k / .25 * (1 - bounce / 400), 22 * k / .25, 24), 'rgba(20,12,30,0.16)', { boil: 0 });
  rotate(sway); scale(k * f, k * breath * (1 - squat * .16));
  translate(0, -m.bbox.y1);
  if (full) { P.handOut = tonyBody3(P); }
  else if (hero) { heroBody(pose, P.legs || 'standing/CrossArmColorPants', col); push(); scale(TONY_UP); chain(); pop(); }
  else body(pose, col);
  // head: tilt + speech nods, pivot slightly above the neck
  const nod = (P.talk || 0) * Math.sin(t * 7.3 + seed) * .05;
  push(); translate(0, -30); rotate((P.tilt || 0) + nod + Math.sin(t * 1.3 + seed) * .02); translate(0, 30);
  const fm = FACES[P.mood || 'smile'] || FACES.smile;
  const bl = P.blinkOff ? false : ((t + seed * 1.7) % 3.4) < .11;
  const mw = .8 + .35 * hash(Math.floor(t * 9) * 1.3 + seed);
  head({ ...HEADS[sp], face: P.faceName || fm[0], restMouth: P.faceName || fm[1], curve: fm[2], mouthOpen: P.open || 0, mouthW: mw, blink: bl, vis: P.vis, talking: !!P.vis && P.vis !== 'X', acc: P.acc || CI.acc }, col);
  if (CI.bandana && !P.noBandana) bandana(t);
  pop();
  if (P.hold) { if (full && P.handOut) P.hold(P.handOut[0], P.handOut[1] - m.bbox.y1); else { const a = ANCH[pose]; if (a) P.hold(a[0] - m.neck.x, a[1]); } }
  pop();
}

// background people: varied Open Peeps (clients, members, leads)
const FPOSE = ['standing/CrossArmColorTee', 'standing/Dancer', 'standing/CrossArmColorTee', 'standing/Dancer', 'standing/ShirtColorPants'];
const FWALK = ['standing/WalkingColorTee', 'standing/WalkingColorTee'];
const FHEAD_W = ['LongHair', 'Bun', 'BunClip', 'MediumStraight', 'LongBangs', 'ColorBun', 'MediumBangs', 'LongCurly', 'MediumOne'], FHEAD_M = ['ShortTwo', 'ShortThree', 'ShortOne', 'Pomp', 'ShavedOne', 'ShortFive', 'GrayShort', 'NoHairTwo'];
const FSKIN = ['#f6d3b3', '#f2c9a0', '#efc19a', '#f8dcc2', '#ecbf98'];
const FTOP = ['#ff5b6e', '#2ec4b6', '#b5e655', '#ff8fc7', '#3d7bff', '#ffffff', '#ffb02e', '#9b6bff'];
const FPANTS = ['#22252e', '#3a3f4b', '#2b3a5c', '#22252e', '#4a3a5a'];
export function folk2(x, y, s, i, { happy = 1, look = [0, 0], walk = 0, face = 1, sleep = false, t = 0, alpha, pose: forcePose } = {}) {
  const h = (n) => Math.floor(hash(i * 7.31 + n * 3.17) * 1e6);
  const pose = forcePose || (walk ? FWALK[i % 2] : FPOSE[h(1) % FPOSE.length]);
  const m = bodyInfo(pose); if (!m) return;
  const col = { skin: FSKIN[h(2) % FSKIN.length], top: FTOP[h(3) % FTOP.length], pants: FPANTS[h(4) % FPANTS.length], jacket: FTOP[h(5) % FTOP.length], shoes: ['#ffffff', '#ff5b6e', '#2ec4b6', '#ffffff'][h(11) % 4], outline: '#17141c', hair: ['#3a2418', '#7a4a26', '#d9a441', '#1b1422'][h(13) % 4] };
  const k = .125 * s; const fdir = walk ? face : (look[0] < -.3 ? -1 : look[0] > .3 ? 1 : (h(6) % 2 ? 1 : -1)) * (face < 0 && !walk ? -1 : 1);
  const b = walk ? Math.abs(Math.sin(walk * .5)) * 26 * s : Math.max(0, Math.sin(t * 2 + i)) * 0;
  push(); translate(x, y - b);
  fillOnly(ell(0, 3 + b, 44 * s, 8 * s, 16), 'rgba(20,12,30,0.15)', { boil: 0 });
  scale(k * fdir, k * (1 + Math.sin(t * 2.1 + i) * .006)); translate(0, -m.bbox.y1);
  body(pose, col);
  const fc = sleep ? 'EyesClosed' : happy > 0 ? ['Smile', 'Cute', 'SmileTeeth', 'Smile', 'Cheeky'][h(7) % 5] : ['Concerned', 'Serious', 'Tired', 'Solemn'][h(8) % 4];
  const fem = h(12) % 2 === 0; head({ head: fem ? FHEAD_W[h(9) % FHEAD_W.length] : FHEAD_M[h(9) % FHEAD_M.length], face: fc, restMouth: fc, beard: !fem && h(10) % 3 === 0 ? 'Chin' : undefined, blink: ((t + i * .77) % 3.7) < .1 }, col);
  pop();
}

// Tony's signature: coral bandana tied as a headband (tails behind), and a gold chain
function bandana(t) {
  const w = Math.sin(t * 6) * 5;
  shape(spline([[-200, -216], [-150, -272], [-40, -306], [80, -310], [172, -292], [200, -268], [198, -214], [168, -228], [80, -244], [-40, -238], [-150, -208], [-198, -176]]), { fill: '#ff5b4d', lw: 9, boil: .3,
    shade: () => { for (let i = 0; i < 7; i++) dot(-140 + i * 50, -258 + Math.abs(i - 3) * 3, 8, '#fff3e8'); } });
  shape(spline([[-196, -214], [-250, -196 + w], [-292, -150 + w], [-252, -160 + w], [-214, -182]]), { fill: '#ff5b4d', lw: 8, boil: .3 });
  shape(spline([[-198, -204], [-226, -146 - w], [-232, -96 - w], [-210, -120 - w], [-202, -176]]), { fill: '#e2453a', lw: 8, boil: .3 });
}
function chain() { const z = zoom(); stroke(spline([[-70, 12], [-40, 110], [0, 150], [40, 110], [70, 12]], false), 22 * z, { line: '#17141c', boil: .2 }); stroke(spline([[-70, 12], [-40, 110], [0, 150], [40, 110], [70, 12]], false), 12 * z, { line: '#f2c14e', boil: .2 }); }

// before/after poster: plus-size woman -> fit, confident woman (tasteful athletic pose)
export function bfaWoman(x, y, s, after) {
  push(); translate(x, y); scale(s);
  const sk = '#f4cfae', hair = '#8a4b2a';
  if (!after) {
    shape(spline([[-34, -60], [-40, -4], [-14, 0], [-6, -56]]), { fill: '#5b6478', lw: 5 }); shape(spline([[34, -60], [40, -4], [14, 0], [6, -56]]), { fill: '#5b6478', lw: 5 });
    shape(spline([[-30, -178], [-74, -150], [-82, -90], [-62, -56], [0, -48], [62, -56], [82, -90], [74, -150], [30, -178]]), { fill: '#b9b4ab', lw: 5 });
    for (const sx of [-1, 1]) shape(noodle([sx * 66, -150], [sx * 82, -70], 0, 26, 22), { fill: '#b9b4ab', lw: 5 });
    for (const sx of [-1, 1]) shape(ell(sx * 82, -64, 12, 12, 12), { fill: sk, lw: 4 });
    shape(ell(0, -214, 44, 44, 30), { fill: sk, lw: 5 }); shape(spline([[-48, -200], [-50, -250], [0, -268], [50, -250], [48, -200], [30, -238], [-30, -238]]), { fill: hair, lw: 5 });
    dot(-14, -214, 4); dot(14, -214, 4); stroke(quad([-12, -192], [0, -198], [12, -192], 8), 3.5);
  } else {
    // leggings, one hip out
    shape(spline([[-6, -92], [-26, -50], [-34, -2], [-20, 2], [-8, -48], [8, -92]]), { fill: '#22252e', lw: 5 }); shape(spline([[6, -92], [22, -48], [34, -2], [20, 2], [4, -48], [-8, -92]]), { fill: '#22252e', lw: 5 });
    stroke([[-24, -50], [-30, -4]], 3, { line: '#ff5b6e' }); stroke([[22, -48], [30, -4]], 3, { line: '#ff5b6e' });
    shape(spline([[-26, -100], [26, -100], [22, -86], [-22, -86]]), { fill: '#22252e', lw: 4 });   // waistband
    shape(spline([[-24, -102], [-22, -132], [22, -132], [24, -102]]), { fill: sk, lw: 5 });          // midriff
    shape(spline([[-30, -132], [-32, -170], [0, -178], [32, -170], [30, -132]]), { fill: '#ff5b6e', lw: 5 });   // sports top
    shape(noodle([-30, -166], [-46, -112], 4, 15, 13), { fill: sk, lw: 4.5 }); shape(noodle([-46, -112], [-22, -100], 0, 13, 12), { fill: sk, lw: 4.5 });   // hand on hip
    shape(noodle([30, -166], [56, -196], -6, 15, 13), { fill: sk, lw: 4.5 }); shape(noodle([56, -196], [48, -232], 0, 13, 12), { fill: sk, lw: 4.5 });   // flex
    shape(ell(48, -238, 9, 9, 10), { fill: sk, lw: 4 });
    shape(noodle([0, -178], [0, -188], 0, 14, 14), { fill: sk, lw: 4 });
    shape(ell(0, -212, 30, 34, 24), { fill: sk, lw: 5 });
    shape(spline([[-32, -212], [-30, -246], [0, -254], [30, -246], [32, -212], [18, -236], [-18, -236]]), { fill: hair, lw: 5 });
    shape(spline([[20, -244], [52, -260], [62, -224], [46, -196], [42, -226], [26, -236]]), { fill: hair, lw: 5 });   // ponytail
    dot(-10, -212, 3.5); dot(12, -212, 3.5); stroke(quad([-10, -196], [2, -186], [14, -196], 8), 3.5);
  }
  pop();
}

// Muscle definition + sheen over the GymShirt tank bust (coords relative to the neck)
function muscles() {
  const z = zoom(), sk = (pts, w) => stroke(spline(pts, false), w * z, { line: '#a86640', boil: 0 });
  sk([[-300, 170], [-345, 250], [-352, 330]], 9); sk([[-385, 380], [-362, 470], [-370, 560]], 7);
  sk([[230, 190], [262, 270], [268, 350]], 9); sk([[296, 420], [290, 500]], 7);
  const tk = (pts, w) => stroke(spline(pts, false), w * z, { line: '#36323f', boil: 0 });
  tk([[-170, 420], [-60, 470], [0, 455]], 7); tk([[170, 420], [60, 470], [0, 455]], 7); tk([[0, 470], [0, 640]], 6);
}
// Full-body muscular Tony: legs from a standing pose + GymShirt tank torso (scaled to match) + hanging arms with fists
const CUT = { 'standing/CrossArmColorTee': 930, 'standing/WalkingColorTee': 1000, 'standing/Dancer': 960 };
function tonyFull(pose, col, m) {
  const cut = CUT[pose] || 950, z = zoom(), L = 13 * z;
  const M = getM(); g.save(); g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); g.beginPath(); g.rect(-2000, cut, 4000, 3000); g.clip();
  body(pose, col); g.restore();
  shape([[-361, 760], [310, 760], [285, cut + 40], [-315, cut + 40]], { fill: '#17141c', stroke: false });
  const arm = (x0, x1, xb0, xb1) => {
    shape([[x0, 750], [x1, 750], [xb1, 1140], [xb0, 1140]], { fill: col.skin, stroke: false });
    stroke([[x0, 730], [xb0, 1140]], L); stroke([[x1, 730], [xb1, 1140]], L);
    const cx = (xb0 + xb1) / 2; shape(spline([[cx - 80, 1118], [cx + 80, 1116], [cx + 90, 1190], [cx + 52, 1254], [cx - 52, 1256], [cx - 90, 1190]]), { fill: col.skin, lw: L });
    stroke(spline([[cx - 52, 1204], [cx, 1216], [cx + 52, 1204]], false), L * .7);
  };
  arm(-527, -363, -478, -340); arm(306, 407, 292, 392);
  push(); scale(1.232, 1.12); body('effigy/GymShirt', col); muscles(); pop();
  push(); scale(1.12, 1.12); chain(); pop();
}

// Tony's training shorts over bare legs (legs come from a standing pose with skin-coloured trousers)
function shorts(cut) {
  shape(spline([[-330, cut - 20], [300, cut - 20], [304, cut + 160], [262, 1400], [40, 1410], [-12, 1150], [-60, 1410], [-300, 1400], [-336, cut + 160]]), { fill: '#ff5b4d', lw: 9 * zoom() / zoom(), boil: .2,
    shade: () => { fillOnly(rect0(-340, cut - 30, 700, 70), '#17141c'); stroke([[-318, cut + 60], [-296, 1392]], 22, { line: '#ffffff', boil: .2 }); stroke([[296, cut + 60], [258, 1392]], 22, { line: '#ffffff', boil: .2 }); } });
}
const rect0 = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// After: bikini model pose (hand on hip, hand behind head), drawn in Open Peeps proportions; neck at (0,0), feet at 2480
function bikiniBody(sk, sport) {
  const lw = 9, S = (pts, f) => shape(spline(pts), { fill: f || sk, lw }), LEG = sport ? '#22252e' : null, TOP = sport ? '#ff5b4d' : '#ff4f8b';
  S([[-215, 120], [-300, -60], [-330, -250], [-250, -360], [-120, -410], [-90, -350], [-200, -300], [-250, -200], [-200, -40], [-150, 150]]);   // raised arm, hand behind head
  S([[-265, 1020], [-285, 1320], [-215, 1700], [-200, 1980], [-160, 2330], [-60, 2330], [-50, 1990], [-20, 1700], [10, 1300], [0, 1100]], LEG);       // standing leg
  S([[30, 1100], [275, 1050], [255, 1400], [140, 1740], [60, 2050], [10, 2310], [-90, 2300], [-50, 2040], [-10, 1720], [40, 1380]], LEG);             // crossed leg
  shape(spline([[-170, 2320], [-40, 2320], [-20, 2410], [-190, 2410]]), { fill: '#ff4f8b', lw }); shape(spline([[-90, 2290], [20, 2290], [60, 2390], [-80, 2390]]), { fill: '#ff4f8b', lw });
  S([[-70, 0], [70, 0], [74, 90], [-74, 90]]);
  S([[-60, 70], [-235, 110], [-215, 340], [-150, 640], [-180, 860], [-270, 1040], [-140, 1160], [0, 1180], [160, 1160], [290, 1040], [215, 860], [160, 640], [215, 340], [235, 110], [60, 70]]);
  if (sport) shape(spline([[-215, 270], [0, 300], [215, 270], [210, 470], [0, 500], [-210, 470]]), { fill: TOP, lw }); else { shape(spline([[-205, 280], [-30, 300], [-115, 450]]), { fill: TOP, lw }); shape(spline([[30, 300], [205, 280], [115, 450]]), { fill: TOP, lw }); }
  stroke([[-30, 300], [30, 300]], 6, { line: '#17141c' }); stroke([[-185, 285], [-60, 80]], 5, { line: '#17141c' }); stroke([[185, 285], [60, 80]], 5, { line: '#17141c' });
  if (sport) shape(spline([[-270, 940], [290, 920], [280, 1120], [0, 1200], [-270, 1130]]), { fill: '#22252e', lw }); else shape(spline([[-255, 960], [285, 940], [100, 1170], [0, 1180]]), { fill: TOP, lw });
  stroke(spline([[-25, 720], [0, 750], [25, 720]], false), 5, { line: '#c98a63' });
  S([[215, 120], [330, 300], [390, 560], [300, 800], [250, 960], [180, 940], [240, 780], [300, 560], [250, 330], [160, 160]]);   // hand on hip
}
export function transformFig(x, y, s, after, t = 0, sport = false) {
  const k = .125 * s; push(); translate(x, y); scale(k, k);
  if (after) {
    translate(0, -2480); const sk = '#f3cfae';
    bikiniBody(sk, sport);
    head({ head: 'LongHair', face: 'Cheeky', restMouth: 'Cheeky', blink: ((t * 1.1) % 3.6) < .1 }, { skin: sk, outline: '#17141c', hair: '#5a341f' });
  } else {
    const pose = 'standing/RestingColorTee', m = bodyInfo(pose); translate(0, -m.bbox.y1);
    const col = { skin: '#f3cfae', top: '#9aa3b5', pants: '#5b6273', shoes: '#cfd3da', outline: '#17141c' };
    push(); scale(1.5, 1); body(pose, col); pop();
    head({ head: 'Bun', face: 'Solemn', restMouth: 'Solemn', blink: ((t * 1.1) % 3.6) < .1 }, col);
  }
  pop();
}

function socks() {
  for (const [x0, x1] of [[-445, -300], [118, 226]]) shape([[x0 - 8, 2090], [x1 + 8, 2090], [x1 + 6, 2240], [x0 - 6, 2240]], { fill: '#ffffff', lw: 9, boil: .2, shade: () => stroke([[x0 - 10, 2130], [x1 + 10, 2130]], 18, { line: '#ff5b4d', boil: .2 }) });
}

// ===== Tony full body, hand-drawn below the GymShirt bust (same units: neck at 0,0; feet at 2250) =====
// walk: phase in radians (0 = standing). Draw order: back leg, front leg, shorts, lower tank, forearms + hands, then the bust.
function tonyBody(col, t, walk) {
  const z = zoom(), L = 12 * z, sk = col.skin, ink = '#17141c';
  const fill = (pts, c) => shape(spline(pts), { fill: c, lw: L, boil: 0 });
  const sw = walk ? Math.sin(walk) : 0;
  const leg = (side) => {   // side -1 = left (viewer), 1 = right; swing rotates about the hip
    const hx = side < 0 ? -140 : 110, lift = walk ? Math.max(0, sw * side) * 90 : 0;
    push(); translate(hx, 1250 - lift);
    const o = side < 0 ? -1 : 1;
    // thigh + calf (one silhouette): outer edge, then inner edge back up
    fill([[o * 115, 0], [o * 120, 240], [o * 104, 330], [o * 122, 480], [o * 82, 800], [o * 60, 830], [-o * 20, 830], [-o * 30, 800], [-o * 40, 500], [-o * 30, 330], [-o * 85, 240], [-o * 110, 0]], sk);
    stroke(spline([[-o * 10, 300], [o * 30, 330], [o * 70, 310]], false), 6 * z, { line: '#a86640', boil: 0 });   // knee
    // sock + sneaker
    fill([[o * 66, 760], [-o * 34, 760], [-o * 36, 880], [o * 70, 880]], '#ffffff');
    stroke([[o * 70, 790], [-o * 36, 790]], 14 * z, { line: '#ff5b4d', boil: 0 });
    fill([[-o * 50, 880], [o * 80, 870], [o * 170 * (side > 0 ? 1 : .55) + (side < 0 ? -20 : 0), 930], [o * 180 * (side > 0 ? 1 : .6), 990], [-o * 60, 1000]], '#ffffff');
    stroke([[-o * 55, 985], [o * 175 * (side > 0 ? 1 : .6), 975]], 18 * z, { line: ink, boil: 0 });
    stroke([[o * 10, 905], [o * 60, 925]], 8 * z, { line: '#ff5b4d', boil: 0 }); stroke([[o * 30, 890], [o * 80, 910]], 8 * z, { line: '#ff5b4d', boil: 0 });
    pop();
  };
  leg(-1); leg(1);
  // shorts: coral with white side stripes and a black waistband
  fill([[-275, 900], [240, 900], [262, 1120], [250, 1380], [30, 1395], [-12, 1230], [-55, 1395], [-285, 1380], [-295, 1120]], '#ff5b4d');
  fill([[-280, 890], [245, 890], [242, 960], [-282, 960]], ink);
  stroke([[-282, 975], [-290, 1372]], 22 * z, { line: '#ffffff', boil: 0 }); stroke([[246, 975], [252, 1372]], 22 * z, { line: '#ffffff', boil: 0 });
  // tank continues to the waist
  fill([[-300, 640], [256, 640], [240, 905], [-282, 905]], ink);
  // forearms + relaxed hands (continuing the bust's arms down)
  const arm = (x0, x1, xb0, xb1, side) => {
    fill([[x0, 660], [x1, 660], [xb1, 1110], [xb0, 1110]], sk);
    const cx = (xb0 + xb1) / 2;
    fill([[cx - 58, 1080], [cx + 58, 1080], [cx + 66, 1150], [cx + 44, 1215], [cx, 1230], [cx - 46, 1212], [cx - 66, 1150]], sk);
    stroke(spline([[cx - 40, 1170], [cx, 1182], [cx + 40, 1170]], false), 6 * z, { line: ink, boil: 0 });
  };
  arm(-428, -296, -400, -300, -1); arm(250, 332, 250, 340, 1);
  body('effigy/GymShirt', col);
}

// ================= TONY v3: one consistent hand-built body =================
// Tank (Open Peeps GymShirt torso, arms clipped away) or bare chest, our own muscular arms in masculine poses,
// coral training shorts, bare legs, white socks, sneakers. Units: neck at (0,0), feet at y=2480.
const TSK = '#e9ad80', TSKS = '#d4935f', INKC = '#17141c';
export const ARMS = {
  down:  { L: [[-318, 205], [-350, 560], [-335, 960]], R: [[282, 215], [305, 570], [290, 960]] },
  hips:  { L: [[-318, 205], [-480, 540], [-290, 940]], R: [[282, 215], [440, 550], [250, 950]] },
  flex:  { L: [[-318, 205], [-480, 540], [-290, 940]], R: [[282, 215], [500, 250], [410, -80]] },
  point: { L: [[-318, 205], [-350, 560], [-335, 960]], R: [[282, 215], [440, 380], [600, 170]] },
  phone: { L: [[-318, 205], [-350, 560], [-335, 960]], R: [[282, 215], [330, 640], [150, 520]] },
  hold:  { L: [[-318, 205], [-350, 560], [-335, 960]], R: [[282, 215], [380, 560], [520, 500]] },
  runA:  { L: [[-318, 205], [-440, 600], [-220, 760]], R: [[282, 215], [400, 520], [190, 590]] },
  runB:  { L: [[-318, 205], [-440, 520], [-220, 590]], R: [[282, 215], [400, 600], [190, 760]] },
  lean:  { L: [[-318, 205], [-470, 640], [-520, 1080]], R: [[282, 215], [430, 650], [480, 1080]] },
  hang:  { L: [[-318, 205], [-470, -260], [-330, -780]], R: [[282, 215], [430, -260], [300, -780]] },   // hanging from a ledge (hands above the head)
  hangL: { L: [[-318, 205], [-470, -260], [-330, -780]], R: [[282, 215], [330, 600], [360, 960]] },   // hanging by the left hand only
};
function armShape(S, E, Wp, sk) {
  const pts = []; const N = 26;
  const P = (t) => { const u = 1 - t; return [u * u * S[0] + 2 * u * t * (2 * E[0] - (S[0] + Wp[0]) / 2) + t * t * Wp[0], u * u * S[1] + 2 * u * t * (2 * E[1] - (S[1] + Wp[1]) / 2) + t * t * Wp[1]]; };
  const wd = (t) => t < .3 ? lerp(185, 160, t / .3) + Math.sin(t / .3 * Math.PI) * 30 : t < .5 ? lerp(160, 112, (t - .3) / .2) : t < .72 ? lerp(112, 138, (t - .5) / .22) : lerp(138, 96, (t - .72) / .28);
  const A = [], B = [];
  for (let i = 0; i <= N; i++) { const t = i / N, p = P(t), q = P(Math.min(1, t + .02)), o = P(Math.max(0, t - .02)); let dx = q[0] - o[0], dy = q[1] - o[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const w = wd(t) / 2; A.push([p[0] - dy * w, p[1] + dx * w]); B.push([p[0] + dy * w, p[1] - dx * w]); }
  const d0 = P(0), d1 = P(.04); let ux = d0[0] - d1[0], uy = d0[1] - d1[1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const top = [d0[0] + ux * 70, d0[1] + uy * 70];
  shape(spline([top, ...A, ...B.reverse()]), { fill: sk, lw: 15 * zoom(), boil: .15 });
  const bm = P(.2), bn = P(.36); stroke(spline([[bm[0] + 20, bm[1] + 10], [(bm[0] + bn[0]) / 2 + 26, (bm[1] + bn[1]) / 2], [bn[0] + 14, bn[1]]], false), 7 * zoom(), { line: TSKS, boil: .15 });
  return P;
}
function fist(Wp, dir, sk, mode) {
  // hand drawn in the Open Peeps brush style: back of hand, curled fingers with creases, thumb on top
  const z = zoom(), L = 13 * z, l2 = 7 * z;
  push(); translate(Wp[0], Wp[1]); rotate(Math.atan2(dir[1], dir[0])); scale(1.25);
  const side = dir[0] < 0 ? -1 : 1;   // keep the thumb on the camera side
  shape(spline([[-12, -50], [60, -58], [96, -50], [104, 0], [96, 50], [60, 58], [-12, 52]]), { fill: sk, lw: L, boil: .15 });   // back of hand
  if (mode === 'point') {
    shape(spline([[86, -22 * side], [200, -26 * side], [214, -10 * side], [200, 6 * side], [86, 10 * side]]), { fill: sk, lw: L, boil: .15 });    // index finger
    shape(spline([[84, 8 * side], [128, 12 * side], [132, 44 * side], [98, 54 * side], [80, 40 * side]]), { fill: sk, lw: L, boil: .15 });       // curled fingers
    stroke([[96, 30 * side], [126, 30 * side]], l2, { boil: .15 });
  } else {
    shape(spline([[82, -58], [128, -54], [140, -20], [140, 20], [128, 54], [82, 58]]), { fill: sk, lw: L, boil: .15 });                      // curled fingers
    for (const y of [-28, 0, 28]) stroke([[100, y], [138, y]], l2, { boil: .15 });
  }
  shape(spline([[30, 18 * side], [92, 22 * side], [110, 38 * side], [94, 54 * side], [30, 48 * side]]), { fill: sk, lw: L, boil: .15 });       // thumb (inside the hand silhouette)
  pop();
}
function armDraw(chain, sk, mode) {
  const [S, E, Wp] = chain; const P = armShape(S, E, Wp, sk);
  const a = P(.94), b = P(1); if (mode !== 'none') fist(b, [b[0] - a[0], b[1] - a[1]], sk, mode);
}
function legShape(hip, knee, ank, sk) {
  const L = [[hip[0] - 145, hip[1]], [knee[0] - 105, knee[1] - 120], [knee[0] - 78, knee[1] + 40], [ank[0] - 100, (knee[1] + ank[1]) / 2 - 40], [ank[0] - 50, ank[1]]];
  const R = [[ank[0] + 50, ank[1]], [ank[0] + 78, (knee[1] + ank[1]) / 2 - 60], [knee[0] + 80, knee[1] + 30], [knee[0] + 104, knee[1] - 120], [hip[0] + 145, hip[1]]];
  shape(spline([...L, ...R]), { fill: sk, lw: 15 * zoom(), boil: .15 });
  stroke(spline([[knee[0] - 30, knee[1] - 10], [knee[0], knee[1] + 14], [knee[0] + 30, knee[1] - 10]], false), 7 * zoom(), { line: TSKS, boil: .15 });
  shape(rr(ank[0] - 52, ank[1] - 40, 104, 90, 14), { fill: '#ffffff', lw: 13 * zoom(), boil: .15, shade: () => stroke([[ank[0] - 60, ank[1] - 12], [ank[0] + 60, ank[1] - 12]], 16 * zoom(), { line: '#ff5b4d', boil: 0 }) });
  shape(spline([[ank[0] - 80, ank[1] + 150], [ank[0] - 76, ank[1] + 50], [ank[0] + 40, ank[1] + 36], [ank[0] + 150, ank[1] + 90], [ank[0] + 170, ank[1] + 150]]), { fill: '#17141c', lw: 13 * zoom(), boil: .15, shade: () => { fillOnly(rect0(ank[0] - 100, ank[1] + 120, 300, 40), '#ffffff'); stroke([[ank[0] - 10, ank[1] + 60], [ank[0] + 60, ank[1] + 90]], 14 * zoom(), { line: '#ff5b4d', boil: 0 }); } });
}
const STANCE = {
  stand: { L: [[-150, 1250], [-200, 1820], [-220, 2300]], R: [[130, 1250], [180, 1820], [200, 2300]] },
  sit:   { L: [[-150, 1250], [-330, 1080], [-300, 1560]], R: [[130, 1250], [310, 1080], [280, 1560]] },
};
function stance(name, ph) {
  if (name === 'run') {   // front-view jog: alternating high knee lifts
    const a = Math.max(0, Math.sin(ph)), b = Math.max(0, -Math.sin(ph));
    return { L: [[-150, 1250], [-170, 1820 - a * 330], [-190, 2300 - a * 470]], R: [[130, 1250], [150, 1820 - b * 330], [170, 2300 - b * 470]] };
  }
  if (name !== 'walk') return STANCE[name] || STANCE.stand;
  const a = Math.max(0, Math.sin(ph)), b = Math.max(0, -Math.sin(ph));
  return { L: [[-150, 1250], [-200, 1820 - a * 110], [-215, 2300 - a * 130]], R: [[130, 1250], [180, 1820 - b * 110], [195, 2300 - b * 130]] };
}
function tonyBody3(P) {
  const sk = TSK, arms = ARMS[P.arms || 'down'], st = stance(P.legs || 'stand', P.walkPh || 0), bare = !!P.bare;
  // legs + shorts
  for (const side of ['L', 'R']) legShape(...st[side], sk);
  shape(spline([[-300, 960], [282, 960], [300, 1180], [292, 1430], [30, 1440], [-8, 1290], [-50, 1440], [-312, 1430], [-318, 1180]]), { fill: '#ff5b4d', lw: 15 * zoom(), boil: .15,
    shade: () => { fillOnly(rect0(-340, 950, 680, 60), '#17141c'); stroke([[-296, 1010], [-290, 1420]], 30 * zoom(), { line: '#ffffff', boil: 0 }); stroke([[278, 1010], [272, 1420]], 30 * zoom(), { line: '#ffffff', boil: 0 }); } });
  const raised = (side) => arms[side][2][1] < 720 || Math.abs(arms[side][2][0]) < 230 || P.arms === 'hips' || P.arms === 'flex' && side === 'L';   // hands up/in front: arm goes over the torso
  for (const side of ['L', 'R']) if (!raised(side)) armDraw(arms[side], sk, 'fist');
  // neck + torso (bare chest underneath; the tank is drawn over it)
  shape(rr(-66, -90, 132, 170, 40), { fill: sk, lw: 14 * zoom(), boil: .15 });
  const TORSO = [[-90, 30], [-290, 100], [-396, 250], [-330, 470], [-262, 760], [-256, 1000], [0, 1012], [246, 1000], [252, 760], [318, 470], [362, 250], [274, 100], [90, 30]];
  fillOnly(spline(TORSO), sk, { boil: .15 });
  const L15 = 15 * zoom();
  stroke(spline([[-60, 40], [-180, 60], [-300, 112], [-380, 200], [-404, 268]], false), L15, { boil: .15 }); stroke(spline([[60, 40], [180, 60], [286, 112], [350, 200], [370, 268]], false), L15, { boil: .15 });
  stroke(spline([[-318, 560], [-276, 760], [-256, 1000]], false), L15, { boil: .15 }); stroke(spline([[306, 560], [262, 760], [246, 1000]], false), L15, { boil: .15 });
  const tl = (pts, w = 8) => stroke(spline(pts, false), w * zoom(), { line: TSKS, boil: .15 });
  if (bare) {
    tl([[-230, 420], [-110, 470], [-10, 430]]); tl([[210, 420], [100, 470], [10, 430]]); tl([[0, 470], [0, 900]], 7);
    for (const y of [590, 700, 810]) { tl([[-120, y], [-20, y + 10]], 6); tl([[110, y], [20, y + 10]], 6); }
    tl([[-250, 760], [-180, 960]], 7); tl([[240, 760], [170, 960]], 7);
  } else {
    tl([[-150, 150], [-40, 120]], 6); tl([[140, 150], [40, 120]], 6);   // collarbones
    shape(spline([[-175, 60], [-120, 60], [-108, 230], [-50, 330], [0, 350], [50, 330], [100, 230], [112, 60], [165, 60], [190, 300], [280, 430], [268, 740], [248, 1002], [0, 1014], [-258, 1002], [-276, 740], [-290, 430], [-200, 300]]), { fill: '#17141c', lw: 15 * zoom(), boil: .15 });
    text('TF', 150, 640, { font: '400 110px "Bungee"', fill: '#ff5b4d' });
  }
  for (const side of ['L', 'R']) if (raised(side)) armDraw(arms[side], sk, side === 'R' && P.arms === 'point' ? 'point' : side === 'R' && P.arms === 'phone' ? 'none' : 'fist');
  if (P.arms === 'point' && !raised('R')) {}
  if (P.arms === 'phone') { const w = arms.R[2], z = zoom(); push(); translate(w[0] + 70, w[1] - 30); rotate(-.12);
    shape(rr(-70, -130, 140, 250, 20), { fill: '#1d1b24', lw: 12 * z, shade: () => fillOnly(rr(-56, -114, 112, 218, 12), '#fff6e0') });
    for (let k = 0; k < 3; k++) shape(rr(-96, -20 + k * 46, 46, 42, 18), { fill: TSK, lw: 11 * z, boil: .15 });   // fingers around the edge
    shape(spline([[52, 10], [92, -20], [104, 10], [80, 44], [54, 40]]), { fill: TSK, lw: 11 * z, boil: .15 });   // thumb
    pop(); }
  chain();
  return arms.R[2];
}
