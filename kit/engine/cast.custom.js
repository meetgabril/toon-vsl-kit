// cast.custom.js — YOUR project's characters. Imported by vsl.js and charsheet.html.
// Key = the speaker letter used in work/lines.txt ("M|line…") and lips.json. D (Dex) and T (Tony) are built in (chars2.js).
// Recipe: pick a head (hair) + optional beard/acc from the Open Peeps catalog (CHARACTERS.md), a body pose, and a palette.
// col keys: skin hair top jacket blazer pants shoes outline (+ cap coat …). Always keep outline '#17141c'.
import { addCast } from './chars2.js';

// Example: Maya, a yoga/pilates coach (delete or replace)
addCast('M', {
  name: 'Maya', head: 'LongHair', scale: .265,
  col: { skin: '#f2c9a0', hair: '#4a2c1d', top: '#2ec4b6', jacket: '#2ec4b6', blazer: '#2ec4b6', pants: '#22252e', shoes: '#ffffff', outline: '#17141c' },
  pose: 'standing/BlazerColorPants', bust: 'effigy/SportyTee',
  sheet: { title: 'MAYA', sub: 'Yoga coach · Open Peeps LongHair · teal top, black leggings', poses: ['standing/BlazerColorPants', 'standing/CrossArmColorPants', 'standing/Dancer', 'sitting/MidColorPants'],
    rules: 'Calm, confident, friendly · teal top in every scene · speaks to camera in busts', palette: [['skin', '#f2c9a0'], ['hair', '#4a2c1d'], ['top', '#2ec4b6'], ['leggings', '#22252e']] },
});
