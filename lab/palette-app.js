/* palette-app.js — the app's own row in the kit's palette catalogue (0.4.0 S0, wave 136).
 *
 * JET BLACK was asked for by name (Josh, 2026-10): three bands of pure #000000, the cloud drawn as a solid black
 * body.  It is NOT a phase map — every phase is the same black — so it carries `flat: true`, the catalogue's word
 * for a palette whose stops are meant to be identical; a `flat` palette is exempt from the phase-map gates.
 *
 * The row is the APP's until MIR carries it (KIT BRIEF J, PLAN.md §5): the adopted `lab/mir/palette.js` is never
 * edited, so the row is appended here, at module evaluation, to the kit's own PRESETS, PRESET_BY_ID and the
 * 3-point group of PRESET_GROUPS.  rack.js imports this module FIRST, before anything reads the catalogue; a saved
 * project or link naming `jetblack` resolves through PRESET_BY_ID as before.  When MIR ships the row, delete this
 * file and its two imports (rack.js, tests/palette.test.mjs).
 */
import { PRESETS, PRESET_BY_ID, PRESET_GROUPS, hexToRgb } from './mir/palette.js';

const JET_BLACK = {
  id: 'jetblack', label: 'Jet Black', points: 3, constL: true, harsh: false, cvd: false, flat: true,
  note: 'three bands of pure black — a solid body, not a phase map',
  stops: ['#000000', '#000000', '#000000'].map((h, i, all) => ({ at: i / all.length, rgb: hexToRgb(h) })),
};

if (!PRESET_BY_ID.has(JET_BLACK.id)) {   // silent once the kit carries the row itself
  PRESETS.push(JET_BLACK);
  PRESET_BY_ID.set(JET_BLACK.id, JET_BLACK);
  PRESET_GROUPS.find((g) => g.points === JET_BLACK.points).items.push(JET_BLACK);   // the kit has four 3-point rows
}
