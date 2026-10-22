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
import { N_COLOR, N_RGB, N_RGB_LIGHT } from './mir/kit.js';

/** the palette a boot and the empty project wear (0.5.0 C1: it lived in paletteview.js, which left; tools/new-project.mjs reads it) */
export const DEFAULT_PALETTE = 'prism';

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

/* THE POTENTIAL MAP's ramp (iteration 014 B3; Josh's answer 3: the standard, RED negative … BLUE positive): five stops, the colours field.js'
   espColour draws (keep the two equal) and the colour bar paints.  As the PALETTE row ESP (a phase map must close its circle, tests/palette.test.mjs)
   the five ride 0 … 0.8 of the wheel and a magenta stop at 0.9 carries blue back round to red. */
export const ESP_RAMP = Object.freeze(['#db1712', '#fadb1f', '#38cc42', '#1acce6', '#1238db']);
const ESP_PAL = { id: 'esp', label: 'ESP', points: 6, constL: false, harsh: false, cvd: true, note: 'the electrostatic potential’s standard map: red negative → yellow → green → cyan → blue positive',
  stops: [...ESP_RAMP, '#b0189c'].map((h, i) => ({ at: i < 5 ? i * 0.2 : 0.9, rgb: hexToRgb(h) })) };
if (!PRESET_BY_ID.has(ESP_PAL.id)) { PRESETS.push(ESP_PAL); PRESET_BY_ID.set(ESP_PAL.id, ESP_PAL); PRESET_GROUPS.find((g) => g.points === ESP_PAL.points).items.push(ESP_PAL); }

/* THE SEVENTH SHELL (iteration 008 A7): the register reaches n = 7 and the kit's shell set has six.  Appended here, as JET BLACK is, until
   MIR carries it (a KIT BRIEF line): hue 350 (the rose the six leave free), dark hsl(350 85% 76%), light hsl(350 97% 47%) — 3.46 : 1 on the
   well (220,225,232) and 3.94 : 1 on the light card, the wave-46 rule.  lab.css defines --n7 for both themes. */
if (N_COLOR.length === 7) { N_COLOR.push('var(--n7)'); N_RGB.push([246, 142, 159]); N_RGB_LIGHT.push([236, 4, 42]); }
