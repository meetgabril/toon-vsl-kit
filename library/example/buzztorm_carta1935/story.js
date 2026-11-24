// story.js — Buzztorm "A Carta de 1935" · ad viral PT-PT (~58 s, 9:16)
// Hidden detail: the Mãe do Tony is already in the 1935 crowd (frame 1) — pays off at "A três amigas" + loop.

// Envelope rain + growing pile (the 1935 chain letter flood)
function letters(d, gt, A, { n = 26, big = 1 } = {}) {
  const env = (x, y, r, s) => {
    A.push(); A.translate(x, y); A.rotate(r); A.scale(s);
    A.shape(A.rr(-70, -45, 140, 90, 6), { fill: '#f6ead0' });
    A.stroke([[-66, -40], [0, 8], [66, -40]], 5);
    A.shape(A.rect(36, -34, 22, 26), { fill: '#e8574a', lw: 4 });
    A.pop();
  };
  const fr = v => v - Math.floor(v);
  const pile = Math.min(60, Math.floor(10 + d * 9 * big));
  for (let i = 0; i < pile; i++) {
    const h = fr(Math.sin(i * 12.9898) * 43758.5453), h2 = fr(Math.sin(i * 78.233) * 12345.678);
    const row = Math.floor(i / 9), x = 140 + (i % 9) * 100 + h * 40 - 20, y = 1830 - row * 55 - h2 * 20;
    env(x, y, (h - .5) * .8, 1.05 * big);
  }
  for (let i = 0; i < n; i++) {
    const h = fr(Math.sin((i + 3) * 91.7) * 9999.1);
    const T = 1.6 + h * .8, ph = fr((d + h * T * 3) / T);
    const x = 80 + ((i * 137) % 920) + Math.sin(ph * 6 + i) * 30, y = -120 + ph * 1900;
    env(x, y, Math.sin(ph * 8 + i) * .6, .9 * big);
  }
}

export const STORY = {
  style: 'ink', loop: 0.4,
  ui: { cpc: 'CUSTO POR CLIENTE', insert: 'INSERIR €', locale: 'de-DE' },
  beats: [
    // 1935 — HOOK
    { at: 'Mil', set: 'street', style: 'oldfilm', music: 'silence', cam: 'pull',
      cast: 'folk:2 L worried | folk:7 C worried | M RR far smile',
      items: ['fn letters', 'year "1935" "DENVER" high delay=.1', 'sign "CORREIOS" bg=red x=540 y=780 @carta'] },
    { at: 'Pedia', set: 'street', style: 'oldfilm', cam: 'in',
      cast: 'folk:4 C med smile',
      items: ['sign "10 CÊNTIMOS" bg=gold top', 'list "AMIGO 1|AMIGO 2|AMIGO 3" UR at2=enviasses|três|amigos'] },
    { at: 'Em poucas', set: 'street', style: 'oldfilm', music: 'tension',
      cast: 'folk:2 LL fear | folk:7 RR fear',
      items: ['fn lettersBig', 'counter 1000>300000 "CARTAS" dur=2 high @semanas'] },
    { at: 'O chefe', set: 'office', style: 'oldfilm',
      cast: 'D cu worried',
      items: ['sign "CHEFE DOS CORREIOS" bg=navy top', 'pill "TELEFONE DESLIGADO" bg=red x=540 y=520 @desligar'] },
    { at: 'Era um esquema', set: 'street', style: 'oldfilm', music: 'silence',
      cast: 'D cu blank',
      items: ['stamp "ESQUEMA" color=red x=540 y=520 @esquema'] },
    { at: 'E mesmo assim', set: 'street', style: 'oldfilm', cam: 'pull',
      items: ['crowd 9 y=1500 s=.7 happy', 'fn letters', 'title "TODA A GENTE PARTILHOU" size=62 top @partilhou'] },

    // TODAY — TONY
    { at: 'Este é o Tony', set: 'studio', music: 'sitcom', sfx: 'scratch@Este',
      cast: 'T C hips happy',
      items: ['sign "FUNCIONA" bg=green UL @funciona', 'ba x=880 y=1640 s=.85 sport @funciona'] },
    { at: 'E pago', set: 'casino', music: 'casino',
      cast: 'T L worried sweat',
      items: ['prop ads R s=.8 price=200€', 'counter 0>200 "POR CLIENTE" post=€ color=red x=300 y=520 size=120 @duzentos'] },
    { at: 'Ninguém', set: 'content', music: 'silence',
      cast: 'T C sad',
      items: ['sign "0 PARTILHAS" bg=red top @partilha', 'prop mug x=800 y=1500 s=.8'] },
    { at: 'Nem a mãe', set: 'night',
      cast: 'M C wide cheeky @mãe',
      items: ['pill "MÃE DO TONY" bg=violet high @mãe'] },
    { at: 'Eu partilho', set: 'night',
      cast: 'M cu serious',
      items: ['pill "GATOS" bg=teal x=250 y=520 delay=.15', 'pill "RECEITAS" bg=gold x=800 y=420 delay=.45', 'pill "BOM DIA!" bg=violet x=540 y=300 delay=.75'] },
    { at: 'Menos o Tony', set: 'content',
      cast: 'T cu blank',
      items: ['x R @Tony'] },

    // BUZZTORM — the turn
    { at: 'Então', set: 'stage', music: 'happy', sfx: 'whoosh@Então',
      cast: 'T C hips happy',
      items: ['title "COMUNIDADE" size=110 top @comunidade', 'pill "GRÁTIS" bg=green x=540 y=470 @grátis', 'pill "1 LINK" bg=orange x=540 y=640 @link'] },
    { at: 'E um link', set: 'community',
      cast: 'folk:3 L med happy | folk:6 R med happy',
      items: ['title "1 LINK" size=120 x=540 y=600 @link', 'arrow from=L to=R y=1000 color=orange @enviar', 'check R x=790 y=700 @fácil'] },
    { at: 'Um membro', set: 'gym', music: 'build',
      cast: 'T LL hips happy',
      items: ['crowd 3 y=1760 s=.75 happy until=ginásio', 'crowd 12 y=1740 s=.66 happy @ginásio', 'confetti mid @ginásio', 'title "O GINÁSIO INTEIRO" size=60 x=540 y=170 @ginásio'] },
    { at: 'Membros viram', set: 'community',
      items: ['list "MEMBROS|CLIENTES|+ MEMBROS" UR at2=Membros|clientes|trazem', 'counter 120>1680 "MEMBROS" x=360 y=900 @Membros', 'crowd 9 y=1720 s=.6 happy', 'stamp "SEM ANÚNCIOS" color=green x=540 y=1250 @anúncios'] },
    { at: 'A Buzztorm constrói', set: 'stage', cam: 'pull',
      cast: 'D L smile | T R happy',
      items: ['title "BUZZTORM" size=120 top', 'pill "A COMUNIDADE É TUA" bg=green x=540 y=470 @tua', 'sign "BUZZTORM.COM" bg=orange x=540 y=640 @Chamada', 'pill "CHAMADA GRÁTIS" bg=violet x=540 y=790 @grátis'] },

    // BUTTON + LOOP
    { at: 'Mãe...', set: 'content', music: 'silence',
      cast: 'T cu worried',
      items: [] },
    { at: 'Partilhei', set: 'night', music: 'sitcom',
      cast: 'M C med happy',
      items: ['list "AMIGA 1|AMIGA 2|AMIGA 3" UR at2=Partilhei|três|amigas', 'confetti mid @amigas'] },
    { at: 'Exatamente', set: 'street', style: 'oldfilm', music: 'silence', sfx: 'scratch@Exatamente',
      cast: 'folk:2 L worried | folk:7 C worried | M RR far smile',
      items: ['fn letters', 'year "1935" "DENVER" high delay=.1', 'sign "CORREIOS" bg=red x=540 y=780 delay=.3'] },
  ],
  fns: {
    letters: (d, gt, A) => letters(d, gt, A),
    lettersBig: (d, gt, A) => letters(d + 3, gt, A, { n: 40, big: 1.15 }),
  },
};
