// One week off · Reel v2: silent sitcom. Music + on-screen words, no voice. 30 s. Positions for 9:16.
const AR = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ar')) || '916';
export const STORY = {
  beats: [
    { at: 0, set: 'studio', music: 'sitcom', cast: 'T C med serious', items: ['hud "ONE WEEK OFF?" role=hook at=auto bg=red', 'pill "BUZZTORM" bg=orange size=60 x=540 y=330 delay=0'] },
    { at: 3, set: 'content', music: 'happy', cast: 'T L med excited', items: ['hud "NO POSTS. NO RING LIGHT!" role=label at=auto delay=0'] },
    { at: 6, set: 'casino', music: 'casino', cast: 'T L med happy phone', items: ['sign "+3 LEADS" bg=green size=84 x=700 y=700 delay=0', 'sign "+2 LEADS" bg=green size=72 x=700 y=860 delay=.6'] },
    { at: 10, set: 'street', music: 'tension', cast: 'T L med sad sweat', items: ['hud "THEN THE MESSAGES STOP." role=label at=auto delay=0'] },
    { at: 13, set: 'street', music: 'think', cast: 'T cu worried sweat', items: ['hud "DID MY LEADS DISAPPEAR?" role=label at=auto delay=0'] },
    { at: 16, set: 'doors', music: 'think', cast: 'T L med serious', items: ['hud "DMS, EMAIL, WHATSAPP, BOOKINGS" role=label at=auto delay=0'] },
    { at: 19, set: 'community', style: 'freeze', music: 'silence', cast: 'D L med smile', items: ['hud "MEMBERS BRING MEMBERS" role=hook at=auto delay=0'] },
    { at: 23, set: 'community', music: 'happy', cast: 'T C med happy flex', items: ['hud "IT KEPT SELLING" role=label at=auto delay=0', 'stars x=760 y=900'] },
    { at: 26, set: 'stage', music: 'happy', cast: 'D R med smile | T L med point happy', items: ['hud "TONY DID IT AGAIN." role=label at=auto delay=0'] },
    { at: 29, set: 'stage', music: 'happy', cast: 'T L med happy', items: ['cta "BOOK A FREE 30-MIN CALL" "You leave with a plan" y=950 delay=0'] },
  ],
  loop: 0.4,
  fns: {},
};
