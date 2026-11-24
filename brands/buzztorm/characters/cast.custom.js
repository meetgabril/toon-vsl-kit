// cast.custom.js — Buzztorm characters (D Dex and T Tony are built into the engine). Copied into each project by setup.sh.
import { addCast } from './chars2.js';

// Tony's Mom — shares everything (except Tony)
addCast('M', {
  name: "Tony's Mom", head: 'GrayShort', acc: 'GlassesTwo', scale: .255,
  col: { skin: '#f2c9a0', hair: '#cfcfd6', top: '#e46a8c', jacket: '#e46a8c', blazer: '#e46a8c', pants: '#3b3350', shoes: '#3a2a2a', outline: '#17141c' },
  pose: 'standing/CrossArmColorTee', bust: 'effigy/Tee',
  sheet: { title: "TONY'S MOM", sub: 'Open Peeps GrayShort + GlassesTwo · raspberry-pink sweater, dark trousers', poses: ['standing/CrossArmColorTee', 'standing/EasingColorTee', 'sitting/MidColorTee'],
    rules: 'Sweet, proud, mischievous · pink sweater in every scene · always wears glasses', palette: [['skin', '#f2c9a0'], ['hair', '#cfcfd6'], ['top', '#e46a8c'], ['pants', '#3b3350']] },
});
