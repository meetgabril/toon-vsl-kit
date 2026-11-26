// TEMPLATE story — make.sh replaces it with director.py output from script.md; delete this line once you edit by hand.
// story.js — the film, one beat per shot. Grammar: docs/STORY.md. Times come from the voiceover words (work/timing.json).
// This demo restages the first 40 s of the Buzztorm VSL in ~25 lines.
export const STORY = {
  beats: [
    { at: 'This is Tony', set: 'studio', cam: 'pull', music: 'sitcom', cast: 'D L smile | T C hips happy', items: ['ba x=900 y=1640 s=.95 @lose'] },
    { at: 'Twelve weeks', set: 'studio', cast: 'T cu flex happy', items: ['sign "12 WEEKS" bg=green UL', 'stars x=760 y=900'] },
    { at: 'Tony makes good money', set: 'studio', cast: 'T C hips smile', items: ['money mid @good_money', 'counter 0>12000 "PER MONTH" pre=$ x=380 y=520 @good_money'] },
    { at: 'As long as he never stops', set: 'studio', cam: 'in', cast: 'T C worried sweat', items: ['sub "...as long as he never stops"'] },
    { at: "Here's how", set: 'doors', music: 'think', cast: 'T C hips serious', items: ['pill "ADS" bg=violet x=420 y=1000 @ads', 'pill "CONTENT" bg=teal x=660 y=1000 @content'] },
    { at: 'Every client costs', set: 'casino', music: 'casino', cast: 'T L serious', items: ['prop ads R s=.8 price=$200', 'counter 0>200 "PER CLIENT" pre=$ color=red x=300 y=1150 size=120 @two_hundred'] },
    { at: 'every year', set: 'casino', cast: 'T L worried', items: ['prop ads R s=.8 price=$340 year=2026', 'stamp "+70%" x=300 y=1150 @goes_up'] },
    { at: 'Stop paying', set: 'casino', cast: 'T L sad', items: ['prop ads R s=.8 off', 'x R x=790 y=700 @stop'] },
    { at: 'Door number two', set: 'content', music: 'aerobics', cast: 'T C hips happy ring', items: ['sign "CONTENT" bg=teal top'] },
    { at: 'A workout', set: 'content', cast: 'T L flex happy', items: ['list "5 AM WORKOUT|NOON MEAL PREP|LIVE AT NIGHT" UR at2=workout|meal|live', 'sign "EVERY DAY" bg=red top @every_single'] },
    { at: 'If I miss a day', set: 'night', cast: 'T cu tired', items: [] },
    { at: 'He does', set: 'beach', music: 'island', cast: 'T C hips shades bare', items: ['crowd 5 sad y=1560 s=.7 until=disappear', 'poof x=540 y=1500 @disappear', 'stars x=540 y=1450 @disappear'] },
  ],
  fns: {},
};
