// sets.custom.js — this brand's own backgrounds. Shared backgrounds (studio, street, office, board, chalk, gym, beach…) are built into the engine.
// Add new ones here:  addSet('name', gt => { ...draw... });  then use  set: 'name'  in story.js.
import { addSet } from './registry.js';
import { W, H, rect, rr, ell, shape, fillOnly, stroke, bands } from './toon.js';
