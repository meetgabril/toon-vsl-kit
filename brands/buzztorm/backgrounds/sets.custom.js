// sets.custom.js — Buzztorm's own backgrounds. Buzztorm's original sets (stage, casino, doors, community…) are built into the engine.
// Add new ones here:  addSet('name', gt => { ...draw... });  then use  set: 'name'  in story.js.
import { addSet } from './registry.js';
import { W, H, rect, rr, ell, shape, fillOnly, stroke, bands } from './toon.js';
