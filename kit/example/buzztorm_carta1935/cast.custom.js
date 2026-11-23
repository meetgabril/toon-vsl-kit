// cast.custom.js — YOUR project's characters. Key = speaker letter in work/lines.txt.
import { addCast } from './chars2.js';

// Mãe do Tony — a mãe que partilha tudo (menos o Tony)
addCast('M', {
  name: 'Mãe do Tony', head: 'GrayShort', acc: 'GlassesTwo', scale: .255,
  col: { skin: '#f2c9a0', hair: '#cfcfd6', top: '#e46a8c', jacket: '#e46a8c', blazer: '#e46a8c', pants: '#3b3350', shoes: '#3a2a2a', outline: '#17141c' },
  pose: 'standing/CrossArmColorTee', bust: 'effigy/Tee',
  sheet: { title: 'MÃE DO TONY', sub: 'Open Peeps GrayShort + GlassesTwo · rosa-framboesa, calças escuras', poses: ['standing/CrossArmColorTee', 'standing/EasingColorTee', 'sitting/MidColorTee'],
    rules: 'Doce, orgulhosa, travessa · camisola rosa em todas as cenas · óculos sempre', palette: [['skin', '#f2c9a0'], ['hair', '#cfcfd6'], ['top', '#e46a8c'], ['pants', '#3b3350']] },
});
