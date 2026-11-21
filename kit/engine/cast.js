// cast.js — Buzztorm VSL cast, v2 (original designs)
// DEX: the host. Tall, calm, sharp: navy blazer, open-collar shirt, pocket square in Buzztorm orange, neat side part, trimmed beard.
// TONY: the coach. Compact and athletic: fitted coral training tee, joggers with a side stripe, whistle, smartwatch, headset mic,
//       fresh fade. His content rig (ring light on a backpack pole) is the running gag.
// Same skeleton/param API as v1 so every shot keeps working. Origin at the feet, y down, face=1 faces right (3/4 view).
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text } from './toon.js';
import { eye as eye0, mouth, hand } from './chars.js';

export const C = {
  dexSkin: '#e7bf98', dexSkinS: '#c9996f', blazer: '#25385c', blazerS: '#1a2843', lapel: '#1e2f4f', shirt: '#e4eef8', shirtS: '#bfd0e2',
  trousers: '#3a3f4b', trousersS: '#2b2f39', shoe: '#6b4128', shoeS: '#4a2c1b', dexHair: '#2f2219', dexHairH: '#5a4130', beard: '#4a3426', pocket: '#ff6a2a',
  tonySkin: '#eeb48a', tonySkinS: '#cf8f63', tee: '#ff5b4d', teeS: '#d9443a', teeD: '#b8352c', jog: '#2b2f3a', jogS: '#1f222b', stripe: '#f4f1ea',
  sneaker: '#ffffff', sneakerS: '#d9d4cc', sole: '#e8e2d6', accent: '#ff5b4d', hair: '#2b1d15', fade: '#7d6250', watch: '#20232b', watchF: '#5bd0c9',
  ring: '#fff6d6', ringS: '#e9d9a0', rigDark: '#2e2a35', strap: '#2e2a35', whistle: '#cfd6de',
  white: '#ffffff', sweat: '#bfe9ff', mug: '#f6efe2', mugS: '#d8ccb6', tea: '#c98a4a', badge: '#ffe27a',
  // legacy keys used by shots
  hood: '#25385c', hoodS: '#1a2843', polo: '#ff5b4d', poloS: '#d9443a', collar: '#fff6ea', pants: '#2b2f3a', pantsS: '#1f222b',
};
const LW = 6.5;
// ---------- limbs: two-bone IK (shoulder-elbow-wrist / hip-knee-ankle) ----------
// Elbows choose the solution that hangs lower and further back (gravity), knees point forward.
export function ik(S, T, L1, L2, score) {
  let dx = T[0] - S[0], dy = T[1] - S[1]; const d0 = Math.hypot(dx, dy) || 1; const ux = dx / d0, uy = dy / d0;
  const d = clamp(d0, Math.abs(L1 - L2) + 2, L1 + L2 - 0.5);
  const a = (L1 * L1 + d * d - L2 * L2) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const P = [S[0] + ux * a, S[1] + uy * a], n = [-uy, ux];
  const E1 = [P[0] + n[0] * h, P[1] + n[1] * h], E2 = [P[0] - n[0] * h, P[1] - n[1] * h];
  return { E: score(E1) >= score(E2) ? E1 : E2, H: [S[0] + ux * d, S[1] + uy * d] };
}
const elbowPref = (E) => E[1] + Math.abs(E[0]) * 0.12;
const kneePref = (E) => E[0];
const seg = (A, B, w0, w1, fill, lw = LW) => shape(noodle(A, B, 0, w0, w1), { fill, lw });
// Hands: cartoon 4-finger mitten with a thumb; modes: open (relaxed), fist (holding), point
export function hand2(H, ang, r, col, mode = 'open', lw = 5.5) {
  push(); translate(H[0], H[1]); rotate(ang);
  const up = Math.sin(ang) > 0.25 ? 1 : -1;   // keep the thumb on the upper side of the hand
  if (mode === 'fist') {
    shape(rr(-r * .7, -r * .8, r * 1.7, r * 1.6, r * .55), { fill: col, lw });
    for (let k = 0; k < 2; k++) stroke([[r * .55 + k * .0, -r * .45 + k * r * .5], [r * .95, -r * .45 + k * r * .5]], lw * .55);
    shape(rr(-r * .2, -up * r * .95 - r * .32, r * 1.05, r * .64, r * .3), { fill: col, lw: lw * .85 });
  } else if (mode === 'point') {
    shape(rr(-r * .7, -r * .78, r * 1.5, r * 1.56, r * .55), { fill: col, lw });
    shape(rr(r * .5, -up * r * .55 - r * .26, r * 1.25, r * .52, r * .26), { fill: col, lw: lw * .85 });
    shape(rr(-r * .1, up * r * .5 - r * .3, r * .7, r * .6, r * .3), { fill: col, lw: lw * .85 });
  } else {
    // palm + fingers block with a soft curl
    shape(spline([[-r * .7, -r * .75], [r * .4, -r * .82], [r * 1.35, -r * .62], [r * 1.6, -r * .1], [r * 1.45, r * .55], [r * .9, r * .78], [-r * .2, r * .82], [-r * .75, r * .45]]), { fill: col, lw });
    stroke([[r * .75, -r * .25], [r * 1.42, -r * .18]], lw * .5); stroke([[r * .75, r * .2], [r * 1.38, r * .28]], lw * .5);
    shape(spline([[-r * .1, -up * r * .55], [r * .45, -up * r * 1.15], [r * .85, -up * r * 1.12], [r * .62, -up * r * .62]]), { fill: col, lw: lw * .85 });
  }
  pop();
}

const sweat = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: C.sweat, lw: 5 });
// eye with a catchlight (more life than a bare dot)
function eye(cx, cy, rx, ry, o) { eye0(cx, cy, rx, ry, o); if (!o.closed && (o.lid ?? 0) < .75) { const l = o.look || [0, 0]; dot(cx + l[0] * rx * .55 + (o.jitter || 0) + rx * .16, cy + l[1] * ry * .5 - ry * .18, Math.max(1.6, (o.pupil || 5) * .32), '#ffffff'); } }
const shadowBlob = (w) => fillOnly(ell(0, 4, w, w * .16, 24), 'rgba(20,12,30,0.18)', { boil: 0 });
const breath = (t, seed) => Math.sin(t * 2.1 + seed) * 3.2;

// ================= DEX (the host) =================
export function dex(P) {
  const f = P.face ?? 1, s = P.s ?? 1, t = P.t || 0, br = breath(t, 1.3);
  push(); translate(P.x, P.y); scale(s * f, s);
  shadowBlob(120);
  // legs: slim trousers + leather shoes (IK knees)
  for (const [sx, lg] of [[-1, P.legL || [0, 0]], [1, P.legR || [0, 0]]]) {
    const hip = [sx * 24, -262], { E: K, H: ank } = ik(hip, [sx * 26 + lg[0], -30 + lg[1]], 116.5, 116, kneePref);
    const col = sx < 0 ? C.trousersS : C.trousers;
    seg(K, ank, 36, 30, col); seg(hip, K, 42, 36, col);
    const sh = ank;
    shape(spline([[sh[0] - 24, sh[1] + 30], [sh[0] - 22, sh[1] + 4], [sh[0] + 10, sh[1] - 2], [sh[0] + 44, sh[1] + 14], [sh[0] + 52, sh[1] + 28], [sh[0] + 40, sh[1] + 32]]), { fill: C.shoe, lw: LW, shade: () => fillOnly(rect(sh[0] - 40, sh[1] + 22, 110, 14), C.shoeS, { boil: .2 }) });
  }
  push(); translate(0, -250); rotate(P.lean ?? 0.02); translate(0, 250 + br * .3);
  const shB = [-66, -474 + br], shF = [60, -472 + br];
  const arm = (sh, a, hold, back, mode) => {
    const { E, H } = ik(sh, [sh[0] + a.h[0], sh[1] + a.h[1]], 104, 100, elbowPref);
    const ang = Math.atan2(H[1] - E[1], H[0] - E[0]);
    const col = back ? C.blazerS : C.blazer;
    seg(E, H, 36, 31, col); seg(sh, E, 42, 37, col);
    shape(ell(H[0] - Math.cos(ang) * 10, H[1] - Math.sin(ang) * 10, 13, 16, 14), { fill: C.shirt, lw: 4.5 });   // shirt cuff
    hand2([H[0] + Math.cos(ang) * 4, H[1] + Math.sin(ang) * 4], ang, 19, C.dexSkin, hold ? 'fist' : (mode || 'open'));
    if (hold) hold(H);
  };
  arm(shB, P.armL || { h: [-16, 196], bend: -14 }, P.holdL, true);
  // blazer body
  const body = spline([[-30, -514 + br], [-92, -494 + br], [-90, -420], [-74, -350], [-80, -276], [-6, -262], [76, -272], [72, -348], [88, -420], [90, -492 + br], [30, -514 + br]]);
  shape(body, { fill: C.blazer, lw: LW, shade: () => {
    fillOnly(spline([[-130, -520], [-56, -500], [-70, -360], [-62, -240], [-140, -240]]), C.blazerS, { boil: .3 });
    // shirt V + lapels
    fillOnly([[-22, -512 + br], [34, -512 + br], [8, -392]], C.shirt, { boil: .3 });
    stroke([[-6, -500 + br], [4, -470 + br], [16, -500 + br]], 3, { line: C.shirtS });
  } });
  shape([[-30, -510 + br], [-6, -478 + br], [-24, -456], [8, -392], [-44, -462]], { fill: C.lapel, lw: 4.5 });
  shape([[36, -510 + br], [22, -480 + br], [40, -458], [8, -392], [56, -464]], { fill: C.lapel, lw: 4.5 });
  dot(12, -366, 5, INK); dot(12, -312, 5, INK);                     // buttons
  stroke([[8, -392], [6, -256]], 3, { line: C.blazerS });            // front edge
  stroke([[40, -306], [76, -308]], 3.5, { line: C.blazerS });         // hip pocket flap
  shape([[48, -432], [76, -434], [74, -414], [64, -426], [56, -412]], { fill: C.pocket, lw: 3.5 });   // pocket square
  stroke([[46, -414], [78, -416]], 3.5, { line: C.blazerS });
  dot(-12, -446, 4.5, '#2b2b33');                                      // lapel mic
  // neck
  shape(noodle([10, -512 + br], [16, -552 + br], 2, 34, 34), { fill: C.dexSkin, lw: 5.5, shade: () => fillOnly(rect(-40, -540 + br, 120, 18), C.dexSkinS, { boil: .2 }) });
  // shirt collar points
  shape([[-12, -520 + br], [8, -500 + br], [-18, -488 + br]], { fill: C.shirt, lw: 4 }); shape([[40, -520 + br], [20, -500 + br], [44, -490 + br]], { fill: C.shirt, lw: 4 });
  push(); translate(26, -644 + br); rotate(P.headTilt ?? 0.04); headDex(P); pop();
  arm(shF, P.armR || { h: [24, 192], bend: 14 }, P.holdR, false, P.handR);
  pop();
  pop();
}
function headDex(P) {
  // ear
  shape(ell(-60, 10, 14, 22, 16), { fill: C.dexSkin, lw: 5.5, shade: () => fillOnly(ell(-56, 12, 6, 11, 10), C.dexSkinS, { boil: .2 }) });
  const HD = spline([[-4, -104], [50, -98], [78, -56], [84, 10], [78, 62], [54, 104], [16, 122], [-28, 110], [-60, 72], [-72, 0], [-62, -70]]);
  shape(HD, { fill: C.dexSkin, lw: LW, shade: () => {
    fillOnly(spline([[-80, -20], [-58, -90], [-96, -100], [-100, 60]]), C.dexSkinS, { boil: .2 });
    // trimmed beard (inside the face)
    fillOnly(spline([[-64, 44], [-40, 66], [-8, 76], [30, 78], [60, 70], [84, 46], [92, 130], [-80, 130]]), C.beard, { boil: .2 });
    for (let i = 0; i < 16; i++) dot(-40 + hash(i * 3.1) * 110, 70 + hash(i * 7.7) * 40, 1.6, '#6e5040');
  } });
  shape(spline([[20, 70], [40, 64], [60, 68], [56, 76], [40, 73], [24, 78]]), { fill: C.beard, lw: 3 });   // moustache
  // hair: neat side part with volume
  shape(spline([[-72, -6], [-80, -70], [-48, -122], [10, -140], [66, -126], [96, -86], [94, -46], [78, -62], [46, -84], [10, -88], [-20, -80], [-44, -60], [-60, -26]]), { fill: C.dexHair, lw: LW,
    shade: () => { stroke(spline([[-28, -120], [20, -126], [70, -104]], false), 7, { line: C.dexHairH, boil: .2 }); } });
  stroke(spline([[-30, -128], [-34, -100], [-40, -76]], false), 3.5, { line: '#1a120c' });   // part
  shape(spline([[-62, -30], [-70, 10], [-58, 26], [-54, -6]]), { fill: C.dexHair, lw: 4 });       // sideburn
  // eyes: calm, attentive
  const lid = P.blink ? 1 : clamp(P.lid != null ? P.lid * .4 : .18, 0, 1), look = P.look || [0, 0];
  eye(8, 2, 20, 22, { lid, look, pupil: 9, skin: C.dexSkin, closed: P.closed, lw: 5 });
  eye(54, 0, 16, 20, { lid, look, pupil: 8, skin: C.dexSkin, closed: P.closed, lw: 5 });
  const by = -38 - (P.brow ?? 0) * 12;
  shape(spline([[-18, by + 6], [4, by - 4], [30, by - 2], [30, by + 7], [4, by + 6], [-18, by + 14]]), { fill: C.dexHair, lw: 3.5 });
  shape(spline([[40, by + 1], [58, by - 4], [76, by + 4], [74, by + 11], [58, by + 5], [40, by + 10]]), { fill: C.dexHair, lw: 3.5 });
  // nose
  shape(spline([[32, 2], [42, 30], [60, 44], [54, 56], [34, 54], [28, 42]]), { fill: C.dexSkin, lw: 5.5, shade: () => fillOnly(ell(50, 52, 11, 6, 12), C.dexSkinS, { boil: .2 }) });
  const m = P.mouth || {};
  mouth(40, 92, 42, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? .25, skew: m.skew ?? .1, lw: 5.5 });
}

// ================= TONY (the coach) =================
function ringRig(P) {
  // backpack pole + ring light (with LED segments and a phone clamp)
  shape(rr(-34, -560, 22, 250, 8), { fill: C.rigDark, lw: 5 });
  const R = 128, cx = -20, cy = -604, on = !P.ringOff;
  const O = ell(cx, cy, R + 22, R + 22, 72), I = ell(cx, cy, R - 6, R - 6, 72);
  shape([...O, O[0], ...I.slice().reverse(), I[I.length - 1]], { fill: C.rigDark, lw: 6 });
  stroke([...ell(cx, cy, R + 8, R + 8, 72), ell(cx, cy, R + 8, R + 8, 72)[0]], 16, { line: on ? C.ring : '#9c968a', boil: .4 });
  if (on) for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; dot(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8), 3, '#ffe9a6'); }
  shape(rr(cx - 26, cy + R + 14, 52, 30, 8), { fill: C.rigDark, lw: 5 });
}
export function tony(P) {
  const f = P.face ?? 1, s = P.s ?? 1, ner = P.nerv ?? 0, t = P.t || 0, br = breath(t, 4.1);
  const jit = ner ? (hash(Math.floor(t * 12) * 3.3) - .5) * 8 * ner : 0;
  push(); translate(P.x + jit, P.y); scale(s * f, s * (P.sq ?? 1));
  shadowBlob(130);
  const rl = P.ringLight === true;
  if (rl) ringRig(P);
  // legs: tapered joggers + chunky trainers (IK knees)
  for (const [sx, lg] of [[-1, P.legL || [0, 0]], [1, P.legR || [0, 0]]]) {
    const hip = [sx * 30, -160], { E: K, H: ank } = ik(hip, [sx * 32 + lg[0], -34 + lg[1]], 63.5, 63, kneePref);
    const col = sx < 0 ? C.jogS : C.jog;
    seg(K, ank, 40, 32, col); seg(hip, K, 50, 42, col);
    stroke([[hip[0] + 18, hip[1] + 14], [K[0] + 18, K[1]], [ank[0] + 14, ank[1] - 12]], 4.5, { line: C.stripe });
    shape(rr(ank[0] - 20, ank[1] - 12, 40, 16, 6), { fill: C.jogS, lw: 4 });   // cuff
    shape(spline([[ank[0] - 32, ank[1] + 30], [ank[0] - 30, ank[1] + 2], [ank[0] + 8, ank[1] - 4], [ank[0] + 42, ank[1] + 6], [ank[0] + 58, ank[1] + 22], [ank[0] + 50, ank[1] + 34]]), { fill: C.sneaker, lw: LW,
      shade: () => { fillOnly(rect(ank[0] - 40, ank[1] + 20, 110, 18), C.sole, { boil: .2 }); stroke([[ank[0] - 6, ank[1] + 4], [ank[0] + 18, ank[1] + 14]], 6, { line: C.accent, boil: .2 }); stroke([[ank[0] + 6, ank[1]], [ank[0] + 30, ank[1] + 10]], 6, { line: C.accent, boil: .2 }); } });
  }
  push(); translate(0, -160); rotate(P.lean ?? 0); translate(0, 160 + br * .3);
  const shB = [-92, -336 + br], shF = [86, -336 + br];
  const arm = (sh, a, hold, back, mode) => {
    const { E, H } = ik(sh, [sh[0] + a.h[0], sh[1] + a.h[1]], 90, 84, elbowPref);
    const ang = Math.atan2(H[1] - E[1], H[0] - E[0]), au = Math.atan2(E[1] - sh[1], E[0] - sh[0]);
    const sk = back ? '#dfa279' : C.tonySkin;
    seg(E, H, 38, 31, sk); seg(sh, E, 50, 42, sk);
    // short sleeve over the top half of the upper arm
    push(); translate(sh[0], sh[1]); rotate(au); shape(spline([[-24, -30], [30, -30], [52, -27], [54, 27], [30, 30], [-24, 30]]), { fill: back ? C.teeS : C.tee, lw: LW }); stroke([[46, -24], [46, 24]], 3, { line: C.teeD }); pop();
    if (!back) { push(); translate(H[0] - Math.cos(ang) * 22, H[1] - Math.sin(ang) * 22); rotate(ang); shape(rr(-9, -18, 18, 36, 5), { fill: C.watch, lw: 4 }); fillOnly(rr(-5, -10, 10, 20, 3), C.watchF); pop(); }
    hand2([H[0] + Math.cos(ang) * 4, H[1] + Math.sin(ang) * 4], ang, 21, sk, hold ? 'fist' : (mode || 'open'));
    if (hold) hold(H);
  };
  arm(shB, P.armL || { h: [-40, 156], bend: -18 }, P.holdL, true);
  // athletic V torso in a fitted tee
  const body = spline([[-36, -376 + br], [-114, -362 + br], [-128, -322], [-120, -272], [-98, -222], [-82, -182], [-82, -152], [0, -146], [82, -152], [82, -182], [98, -222], [120, -272], [128, -322], [114, -362 + br], [36, -376 + br]]);
  shape(body, { fill: C.tee, lw: LW, shade: () => {
    fillOnly(spline([[-150, -390], [-74, -366], [-92, -250], [-70, -130], [-160, -130]]), C.teeS, { boil: .3 });
    stroke(quad([-62, -270], [-20, -252], [0, -262], 8), 3.5, { line: C.teeD }); stroke(quad([62, -270], [20, -252], [0, -262], 8), 3.5, { line: C.teeD });   // chest
    stroke([[-30, -214], [-6, -206]], 3, { line: C.teeD }); stroke([[30, -214], [6, -206]], 3, { line: C.teeD });
  } });
  shape(spline([[-40, -370 + br], [0, -346 + br], [40, -370 + br], [30, -380 + br], [0, -360 + br], [-30, -380 + br]]), { fill: C.teeD, lw: 4.5 });   // crew neck
  text('TF', 54, -300, { font: '400 30px "Bungee"', fill: '#fff3e8' });
  // whistle on a lanyard
  stroke(spline([[-34, -366 + br], [-24, -300], [-6, -262]], false), 3.5, { line: '#1f222b' }); stroke(spline([[34, -366 + br], [20, -300], [-2, -262]], false), 3.5, { line: '#1f222b' });
  push(); translate(-4, -250); rotate(.4); shape(rr(-22, -12, 40, 24, 10), { fill: C.whistle, lw: 4.5 }); shape(rr(14, -10, 18, 12, 4), { fill: C.whistle, lw: 4 }); pop();
  // backpack straps for the rig
  if (rl) { stroke(spline([[-70, -362 + br], [-84, -300], [-88, -220]], false), 12, { line: INK }); stroke(spline([[-70, -362 + br], [-84, -300], [-88, -220]], false), 7, { line: C.strap }); }
  // neck
  shape(noodle([2, -366 + br], [6, -396 + br], 2, 54, 54), { fill: C.tonySkin, lw: 5.5, shade: () => fillOnly(rect(-60, -386 + br, 130, 16), C.tonySkinS, { boil: .2 }) });
  push(); translate(10, -478 + br); rotate(P.headTilt ?? 0); scale(.88); headTony(P, jit); pop();
  arm(shF, P.armR || { h: [40, 156], bend: 20 }, P.holdR, false, P.handR);
  pop();
  if (P.sweat) { sweat(140, -620 + ((t * 1.4) % 1) * 30, 1.3); sweat(-120, -560 + ((t * 1.1 + .5) % 1) * 30, 1.0); }
  pop();
}
function headTony(P, jit) {
  for (const sx of [-1, 1]) shape(ell(sx * 104, 16, 16, 24, 16), { fill: C.tonySkin, lw: 5.5, shade: () => fillOnly(ell(sx * 100, 18, 6, 12, 10), C.tonySkinS, { boil: .2 }) });
  const HD = spline([[0, -100], [72, -92], [104, -48], [110, 30], [100, 84], [62, 116], [0, 126], [-62, 116], [-100, 84], [-110, 30], [-104, -48], [-72, -92]]);
  shape(HD, { fill: C.tonySkin, lw: LW, shade: () => {
    fillOnly(spline([[-124, 0], [-92, 100], [-30, 146], [-150, 146]]), C.tonySkinS, { boil: .2 });
    fillOnly(spline([[-120, -90], [-96, -40], [-104, 0], [-130, 0]]), C.fade, { boil: .2, alpha: .55 });   // fade
    fillOnly(spline([[130, -90], [100, -40], [106, 0], [130, 0]]), C.fade, { boil: .2, alpha: .55 });
    for (let i = 0; i < 26; i++) dot(-60 + hash(i * 2.3) * 124, 78 + hash(i * 5.9) * 40, 1.6, '#c58c66');   // stubble
  } });
  // fresh fade: short textured top with a lifted front (hairline high, no bowl)
  shape(spline([[-100, -40], [-100, -86], [-66, -122], [-10, -140], [52, -146], [96, -126], [114, -84], [108, -50], [92, -70], [64, -92], [30, -94], [-6, -88], [-40, -82], [-70, -70], [-88, -50]]), { fill: C.hair, lw: LW,
    shade: () => { for (let i = 0; i < 6; i++) stroke(spline([[-54 + i * 28, -96 + Math.abs(i - 3) * 2], [-44 + i * 28, -118], [-30 + i * 28, -134]], false), 3, { line: '#4a3528', boil: .2 }); } });
  // headset mic
  stroke(spline([[-106, -6], [-92, 44], [-62, 82], [-26, 92]], false), 4.5);
  shape(ell(-20, 92, 10, 8, 12), { fill: '#2b2b33', lw: 4 });
  const lid = P.blink ? 1 : clamp(P.lid ?? 0, 0, 1), look = P.look || [0, 0], ex = P.eyes ?? 1;
  const pj = (P.nerv || 0) * (hash(Math.floor((P.t || 0) * 12) * 5.1) - .5) * 3;
  if (!P.shades) eye(-34, -8, 31 * ex, 35 * ex, { lid, look, pupil: 7, skin: C.tonySkin, jitter: pj, lw: 5.5 });
  if (!P.shades) eye(36, -8, 31 * ex, 35 * ex, { lid, look, pupil: 7, skin: C.tonySkin, jitter: pj, lw: 5.5 });
  if (P.shades) { shape(rr(-74, -42, 80, 58, 22), { fill: '#1d1b24', lw: 5 }); shape(rr(-4, -42, 80, 58, 22), { fill: '#1d1b24', lw: 5 }); stroke([[-6, -24], [4, -24]], 5); fillOnly(rr(-62, -34, 22, 12, 6), 'rgba(255,255,255,0.35)'); fillOnly(rr(8, -34, 22, 12, 6), 'rgba(255,255,255,0.35)'); }
  if (P.bags) for (const ex of [-34, 36]) { stroke(arc(ex, 30, 24, 9, Math.PI * .15, Math.PI * .85, 10), 3.5); stroke(arc(ex, 40, 16, 6, Math.PI * .25, Math.PI * .75, 8), 3); }
  if (P.blush) for (const ex of [-62, 62]) fillOnly(ell(ex, 48, 18, 9, 12), 'rgba(255,120,120,0.45)', { boil: .3 });
  // strong brows carry the emotion: worry = inner ends up, brow>0 = raised
  const w = P.worry ?? 0, by = -64 - (P.brow ?? 0) * 10;
  shape(spline([[-72, by + 8 + w * 10], [-36, by - 6 - w * 6], [-6, by - 2 - w * 14], [-8, by + 12 - w * 14], [-36, by + 8 - w * 6], [-72, by + 18 + w * 10]]), { fill: C.hair, lw: 4 });
  shape(spline([[72, by + 8 + w * 10], [36, by - 6 - w * 6], [6, by - 2 - w * 14], [8, by + 12 - w * 14], [36, by + 8 - w * 6], [72, by + 18 + w * 10]]), { fill: C.hair, lw: 4 });
  shape(spline([[-10, 18], [14, 16], [22, 40], [6, 52], [-16, 46]]), { fill: C.tonySkin, lw: 5.5, shade: () => fillOnly(ell(4, 46, 12, 6, 10), C.tonySkinS, { boil: .2 }) });
  const m = P.mouth || {};
  mouth(0, 84, 80, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? .4, skew: m.skew || 0, lw: 5.5 });
}

// ================= background folk (clients/members: simple, varied, tidy) =================
const FOLK = [['#5bc0be', '#3d9997'], ['#f2a541', '#c98322'], ['#9b7fd4', '#7a5fb3'], ['#ef6f6c', '#c94d4a'], ['#7bc47f', '#559e59'], ['#4f6db8', '#38519a']];
const SKINS = [['#f2c9a0', '#d9a57c'], ['#c88b5e', '#a66e45'], ['#8a5a3b', '#6b4229'], ['#f6d3b3', '#dcb08e']];
const HAIRS = ['#3a2418', '#1e1714', '#c98b4a', '#7a3e22'];
export function folk(x, y, s, i, { happy = 1, look = [0, 0], walk = 0, hold = null, sleep = false, face = 1 } = {}) {
  const [cl, cs] = FOLK[i % FOLK.length], [sk, skS] = SKINS[(i * 3 + 1) % SKINS.length], hc = HAIRS[i % 4];
  push(); translate(x, y); scale(s * face, s);
  fillOnly(ell(0, 2, 46, 8, 16), 'rgba(20,12,30,0.16)', { boil: 0 });
  for (const sx of [-1, 1]) { const st = walk ? Math.sin(walk + (sx > 0 ? Math.PI : 0)) * 16 : 0; shape(noodle([sx * 16, -72], [sx * 18 + st, -8], 0, 22, 18), { fill: '#343846', lw: 5 }); shape(spline([[sx * 18 + st - 12, -2], [sx * 18 + st - 10, -14], [sx * 18 + st + 14, -14], [sx * 18 + st + 24, -2]]), { fill: '#f4f1ea', lw: 4 }); }
  shape(spline([[-44, -152], [-52, -92], [-44, -64], [0, -58], [44, -64], [52, -92], [44, -152], [0, -170]]), { fill: cl, lw: 5, shade: () => fillOnly(spline([[-70, -170], [-30, -160], [-40, -60], [-80, -60]]), cs, { boil: .3 }) });
  for (const sx of [-1, 1]) { const end = [sx * 56, hold && sx > 0 ? -150 : -90]; shape(noodle([sx * 42, -142], end, sx * 6, 18, 15), { fill: cl, lw: 5 }); fillOnly(ell(end[0], end[1] + 4, 9, 9, 10), sk); }
  if (hold && hold.r) hold.r([58, -160]);
  shape(noodle([0, -166], [0, -180], 0, 22, 22), { fill: sk, lw: 4 });
  shape(ell(0, -218, 46, 50, 30), { fill: sk, lw: 5, shade: () => fillOnly(ell(-28, -200, 20, 34, 14), skS, { boil: .3 }) });
  const hs = i % 3;
  if (hs === 0) shape(spline([[-48, -224], [-40, -262], [0, -274], [40, -262], [50, -224], [20, -246], [-20, -244]]), { fill: hc, lw: 4.5 });
  else if (hs === 1) shape(spline([[-50, -200], [-48, -250], [0, -276], [46, -252], [52, -200], [40, -236], [0, -250], [-38, -236]]), { fill: hc, lw: 4.5 });
  else { shape(spline([[-48, -226], [-38, -264], [0, -272], [40, -262], [48, -226], [14, -248]]), { fill: hc, lw: 4.5 }); shape(ell(-30, -262, 18, 16, 12), { fill: hc, lw: 4 }); }
  if (sleep) { stroke(arc(-16, -212, 10, 5, .2, Math.PI - .2, 8), 3.5); stroke(arc(18, -212, 10, 5, .2, Math.PI - .2, 8), 3.5); }
  else { eye(-16, -216, 12, 14, { look, pupil: 4, skin: sk, lw: 3.5 }); eye(18, -216, 12, 14, { look, pupil: 4, skin: sk, lw: 3.5 }); }
  if (happy > 0) stroke(quad([-16, -190], [2, -176], [20, -190], 8), 3.5); else if (sleep) shape(ell(2, -188, 6, 7, 10), { fill: '#4a1a2a', lw: 3 }); else stroke([[-12, -188], [16, -188]], 3.5);
  pop();
}
