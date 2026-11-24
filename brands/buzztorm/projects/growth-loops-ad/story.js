// Growth Loops ad: music + on-screen text, no voice. 18.5 s. Positions tuned per size (9:16 · 4:5 · 1:1).
const AR = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ar')) || '916';
const P = (a, b, c) => (AR === '45' ? b : AR === '11' ? c : a);
export const STORY = {
  beats: [
    { at: 0, set: 'casino', music: 'casino', cast: 'T L med serious', items: ['prop ads R s=.8 price=$$$', `pill "BUZZTORM" bg=orange size=60 x=${P(270, 270, 330)} y=${P(330, 520, 630)} delay=0`, 'sign "STILL PAYING" bg=red size=84 x=540 y=780 delay=.1', 'sign "FOR EVERY CLIENT?" bg=red size=64 x=540 y=950 delay=.1'] },
    { at: 2.5, set: 'gym', music: 'tension', cast: 'T C run tread business sweat', items: [`sign "ONE WEEK OFF?" bg=violet y=${P(560, 600, 640)} x=540 delay=.1`] },
    { at: 5, set: 'street', cast: 'T L med worried sweat', items: ['crowd 5 sad y=1560 s=.7 until=GONE.', 'poof x=700 y=1450 @GONE.', `stamp "LEADS GONE." color=red x=560 y=${P(560, 640, 680)} @LEADS`] },
    { at: 7, set: 'board', wipe: true, music: 'build', cast: 'T R med hopeful', items: [`title "TRY A LOOP" size=130 color=gold x=540 y=${P(600, 680, 720)} delay=.1`] },
    { at: 9.5, set: 'board', cast: 'D R med smile', items: [`list "TRIGGER|ACTION|PAYOFF|NEW MEMBER" x=420 y=${P(560, 600, 640)} size=60 at2=TRIGGER|ACTION|PAYOFF|NEW`] },
    { at: 13, set: 'community', music: 'happy', cast: 'T L med happy | D R med smile', items: [`sign "MEMBERS BRING" bg=green size=72 x=540 y=${P(560, 600, 640)} delay=.1`, `sign "MEMBERS" bg=green size=72 x=540 y=${P(720, 760, 800)} delay=.3`, 'walkers 4', 'confetti mid @BRING'] },
    { at: 15.5, set: 'stage', cast: 'T L med point happy | D R med smile', items: [`title "GROWTH LOOP" size=110 color=gold x=540 y=${P(520, 560, 640)} delay=0`, `pill "CHEAT SHEET" bg=orange x=540 y=${P(690, 730, 790)} size=60 delay=0`, `cta "FREE 1-PAGE CHEAT SHEET" "Join Buzztorm Academy" y=${P(1030, 950, 800)} delay=0`] },
  ],
  loop: 0.4,
  fns: {},
};
