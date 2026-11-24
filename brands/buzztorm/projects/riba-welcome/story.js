// story.js — Riba welcome (pt-BR). Grammar: docs/STORY.md. Times from work/timing.json.
const DOORS = [
  'prop door x=150 y=1060 s=.62 label=DROP color=violet',
  'prop door x=380 y=1060 s=.62 label=IMÓVEIS color=teal',
  'prop door x=700 y=1060 s=.62 label=FOOD color=red',
  'prop door x=930 y=1060 s=.62 label=INFO color=green',
];
export const STORY = {
  beats: [
    // 1 — hook: freeze frame, Tony as Riba between the market doors
    { at: 0, set: 'stage', style: 'freeze', music: 'sitcom', cast: 'T C hips worried',
      items: [...DOORS, 'title "RIBA, 22" size=110 color=gold x=540 y=420 delay=0', 'label "É. SOU EU." low'] },
    // 2 — reveal: it's Tony playing Riba
    { at: 'tá', set: 'studio', style: 'ink', cam: 'pull', cast: 'D L smile | T R hips cheeky',
      items: ['sign "RIBA" bg=orange x=790 y=860 delay=0', 'stamp "SEM VERBA" color=red x=500 y=620 @corte'] },
    // 3 — method acting
    { at: 'laboratório', set: 'studio', cast: 'T cu flex happy', items: ['sign "MODO ATOR" bg=violet UL', 'stars x=780 y=900'] },
    // 4 — rule of three: three markets
    { at: 'segunda', set: 'board', music: 'think', cast: 'T R point serious',
      items: ['list "DROPSHIPPING|IMÓVEIS|FOOD TRUCK" x=330 y=520 at2=dropshipping|imóveis|food', 'stamp "PRA GATOS" color=red x=480 y=920 @gatos'] },
    // 5 — the cats didn't pay
    { at: 'os gatos', set: 'board', cast: 'T cu sad', shake: 'pagaram', items: ['stamp "CALOTE" color=red high @pagaram'] },
    // 6 — he picked info: teaching online
    { at: 'aí', set: 'content', music: 'happy', cast: 'T C hips happy',
      items: ['sign "INFO" bg=green top', 'prop tripod x=860 y=1500 s=.7', 'prop camera x=860 y=1180 s=.7', 'check UL @info'] },
    // 7 — who teaches me to teach?
    { at: 'peraí', set: 'content', music: 'silence', cast: 'T cu worried sweat', items: ['title "E AGORA?" size=110 color=gold top'] },
    // 8 — welcome to the Academy (the one transition of the film)
    { at: 'a gente', set: 'community', wipe: true, music: 'build', cast: 'D L happy | T R happy',
      items: ['title "BEM-VINDO!" size=120 color=gold top @bem', 'sign "BUZZTORM ACADEMY" bg=orange high @buzztorm', 'confetti mid @bem'] },
    // 9 — what you learn there
    { at: 'aqui', set: 'community', cast: 'T C happy',
      items: ['crowd 6 happy y=1560 s=.7', 'sign "COMUNIDADE QUE VENDE" bg=green top @comunidade'] },
    // 10 — CTA
    { at: 'comenta', set: 'stage', music: 'happy', cast: 'D C med point smile',
      items: ['sign "COMENTA ACADEMY" bg=orange high', 'pill "É GRÁTIS" bg=green x=540 y=720 @graça'] },
    // 11 — button joke
    { at: 'posso', set: 'studio', cast: 'T cu hopeful', items: ['sign "RIBA" bg=orange UL'] },
    // 12 — callback, same picture as frame 1 → loop
    { at: 'não', set: 'stage', cast: 'T C hips worried', items: [...DOORS, 'title "RIBA, 22" size=110 color=gold x=540 y=420 @riba'] },
  ],
  loop: 0.4,
  style: 'ink',
  fns: {},
};
