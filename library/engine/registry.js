// registry.js — lets a brand add its own backgrounds without touching vsl.js.
// In sets.custom.js: import { addSet } from './registry.js'; addSet('clinic', gt => { ...draw with toon.js... });
// Then use it in story.js: { set: 'clinic', ... }
export const CUSTOM_SETS = {};
export function addSet(name, draw) { CUSTOM_SETS[name] = draw; }
