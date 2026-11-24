// Growth Loops ad v2: silent sitcom. Music + orchestral gags, no words spoken. 16.5 s. Positions tuned per size.
const AR = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ar')) || '916';
const P = (a, b, c) => (AR === '45' ? b : AR === '11' ? c : a);
export const STORY = {
  beats: [
    { at: 0, set: 'casino', music: 'casino', cast: 'T L med serious sweat', sfx: ['chaching@COIN'], items: ['prop ads R s=.8 price=$$$ delay=0', `pill "BUZZTORM" bg=orange size=60 x=${P(270, 270, 330)} y=${P(330, 520, 630)} delay=0`, `say "ONE MORE COIN..." who=TONY y=${P(960, 960, 880)} size=${P(60, 60, 50)} delay=.15`] },
    { at: 1.6, set: 'casino', sfx: ['ding@PING'], cast: 'T L med phone happy', items: [`sign "+1 LEAD!" bg=green size=84 x=700 y=${P(700, 740, 760)} @PING`, 'stars x=700 y=620 @PING'] },
    { at: 3.2, set: 'street', cast: 'T L med happy | folk:3 R smile', items: [] },
    { at: 3.9, set: 'street', cast: 'T L med sad sweat', sfx: ['xylo-fall@GONE'], items: ['poof x=790 y=1400 delay=0', 'stars x=790 y=1300 delay=0', `say "...AND IT'S GONE." who=TONY y=${P(960, 960, 880)} size=${P(60, 60, 50)} delay=.25`] },
    { at: 4.8, set: 'gym', music: 'aerobics', cast: 'T C run tread business sweat', items: [`say "IF I STOP, THEY STOP." who=TONY y=${P(960, 960, 880)} size=${P(60, 60, 50)} delay=.15`] },
    { at: 6.6, set: 'gym', style: 'freeze', music: 'silence', sfx: ['sad-trombone@ME'], cast: 'T cu tired sweat', items: [`title "YEP. THAT'S ME." size=96 color=gold x=540 y=${P(680, 560, 1330)} delay=0`] },
    { at: 8.0, set: 'community', wipe: true, music: 'folk', sfx: ['ding@JOINED'], cast: 'D L med smile', items: [`pill "BUZZTORM" bg=orange size=60 x=540 y=${P(330, 520, 630)} delay=0`, `list "WIN POSTED|FRIEND JOINED|FRIEND JOINED" x=680 y=${P(640, 680, 760)} size=62`] },
    { at: 10.0, set: 'community', cam: 'pull', cast: 'T C med hopeful', sfx: ['xylo-climb@FRIENDS'], items: ['walkers 5', `say "WAIT... THEY BRING FRIENDS?" who=TONY y=${P(960, 960, 880)} size=${P(60, 60, 50)} delay=.2`] },
    { at: 12.0, set: 'community', music: 'happy', cast: 'T L med flex happy | D R med smile', sfx: ['harp-gliss@BRING'], items: ['confetti mid @BRING', `sign "MEMBERS BRING" bg=green size=72 x=540 y=${P(560, 600, 640)} delay=.1`, `sign "MEMBERS" bg=green size=72 x=540 y=${P(720, 760, 800)} delay=.3`] },
    { at: 13.5, set: 'stage', cast: 'T L med point happy | D R med smile', sfx: ['rimshot@SHEET'], items: [`title "GROWTH LOOP" size=110 color=gold x=540 y=${P(520, 560, 640)} delay=0`, `pill "CHEAT SHEET" bg=orange x=540 y=${P(690, 730, 790)} size=60 delay=0`, `cta "FREE 1-PAGE CHEAT SHEET" "Join Buzztorm Academy" y=${P(1030, 950, 800)} delay=0`] },
  ],
  loop: 0.4,
  fns: {},
};
