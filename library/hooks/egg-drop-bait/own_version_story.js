// Bait shot (0–2.13 s): Buzztorm's ring light creeping to the edge of the desk. It never falls.
function creep(d, gt, A) {
  const t = Math.min(gt, 2.13), u = t / 2.13, ease = 1 - Math.pow(1 - u, 2.2);
  // plain wall and floor
  A.fillOnly(A.rect(-600, -400, 2280, 1700), '#efe4d2', { boil: 0 }); A.fillOnly(A.rect(-600, 1300, 2280, 900), '#c9a27a', { boil: 0 }); A.stroke([[-600, 1300], [1680, 1300]], 7);
  // desk
  A.shape(A.rr(80, 1130, 760, 46, 10), { fill: '#a9744a', lw: 7, shade: () => A.fillOnly(A.rect(80, 1158, 760, 18), 'rgba(0,0,0,0.18)') });
  for (const x of [130, 790]) A.shape(A.rect(x - 16, 1176, 32, 560), { fill: '#8a5a36', lw: 6 });
  // ring light on a desk tripod, sliding right with a little wobble
  const x = 330 + ease * 462, wob = Math.sin(gt * 9) * 0.035 * u + 0.06 * u * u;
  A.push(); A.translate(x, 1130); A.rotate(wob);
  for (const dx of [-70, 70]) A.stroke([[0, -300], [dx, 0]], 9, { line: '#3a3644' });
  A.stroke([[0, -300], [0, -420]], 10, { line: '#3a3644' });
  const R = 130, ring = A.ell(0, -560, R, R, 72); A.stroke([...ring, ring[0]], 36, { line: '#2e2a35' }); A.stroke([...ring, ring[0]], 20, { line: '#fff6d6' });
  A.fillOnly(A.ell(0, -560, 290, 290, 40), 'rgba(255,240,200,0.12)', { boil: 0 });
  A.pop();
}
export const STORY = { beats: [ { at: 0, set: 'none', cam: 'push', items: ['fn creep delay=0'] } ], fns: { creep } };
