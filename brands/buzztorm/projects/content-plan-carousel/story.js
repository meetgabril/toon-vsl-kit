// Tony's Content Plan — carousel, 5 slides (one beat per slide, rendered as stills at 4:5)
function lunchboxes(d, gt, A) {
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
    const k = A.clamp((d - (r * 6 + i) * .04) / .2); if (k <= 0) continue;
    A.push(); A.translate(180 + i * 144, 1180 + r * 70); A.scale(A.back ? A.back(k) : k);
    A.shape(A.rr(-60, -30, 120, 60, 12), { fill: '#fff6e0', lw: 6, shade: () => A.fillOnly(A.rect(-60, -30, 120, 18), '#5bc0be') });
    A.fillOnly(A.ell(-20, 8, 14, 10, 10), '#2f8f4a'); A.fillOnly(A.ell(18, 8, 16, 11, 10), '#ffd66b'); A.pop();
  }
}
function hearts(d, gt, A) {
  const H = (x, y, s) => { A.push(); A.translate(x, y + Math.sin(gt * 3 + x) * 10); A.scale(s); A.shape([[0, 30], [-40, -6], [-34, -34], [-12, -40], [0, -24], [12, -40], [34, -34], [40, -6]], { fill: '#ff5b4d', lw: 5 }); A.pop(); };
  [[220, 820, .9], [180, 1080, .7], [880, 1130, .8], [900, 1320, 1]].forEach(([x, y, s], i) => { const k = A.clamp((d - i * .12) / .25); if (k > 0) H(x, y, s * k); });
}
export const STORY = {
  style: 'comic',
  beats: [
    { at: 0, set: 'night', cast: 'T C med phone tired', items: ['slidehead "TONY\'S CONTENT PLAN" n=1 of=6 bg=orange size=68', 'list "5 AM WORKOUT|NOON MEAL PREP|3 AM LIVE" size=62 x=330 y=520', 'counter 0>1 "VIEWER" color=red x=860 y=1100 size=110', 'swipe'] },
    { at: 3, set: 'gym', cast: 'T C run tread sweat', items: ['slidehead "5 A.M. WORKOUT" n=2 of=6 bg=navy size=68', 'counter 0>12 "VIEWS" x=860 y=1150 size=120', 'swipe'] },
    { at: 6, set: 'content', cast: 'T C med hips happy', items: ['slidehead "NOON MEAL PREP" n=3 of=6 bg=green size=68', 'fn lunchboxes', 'counter 0>9 "VIEWS" x=540 y=600 size=120', 'swipe'] },
    { at: 9, set: 'night', cast: 'T C med phone happy ring', items: ['slidehead "3 A.M. LIVE" n=4 of=6 bg=violet size=68', 'counter 0>1 "VIEWER" color=red x=820 y=560 size=110', 'say "Thanks for coming... whoever you are!" who=TONY', 'swipe'] },
    { at: 12, set: 'night', cast: 'M C cu smile', items: ['slidehead "THE 1 VIEWER" n=5 of=6 bg=red size=68', 'fn hearts', 'say "Sent it to the family group!" who=MOM', 'swipe'] },
    { at: 15, set: 'community', cast: 'T C far happy hips y=1290 | folk:1 L far y=1300 | folk:2 R far y=1300 | folk:3 LL far y=1260 | folk:4 RR far y=1260', items: ['slidehead "GATHER, DON\'T POST" n=6 of=6 bg=orange size=68', 'cta "JOIN BUZZTORM ACADEMY" "It\'s free. Comment ACADEMY and we\'ll DM you the link."'] },
  ],
  fns: { lunchboxes, hearts },
};
