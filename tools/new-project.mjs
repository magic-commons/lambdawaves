#!/usr/bin/env node
/* tools/new-project.mjs — write lab/new-project.lambdawaves.json, THE EMPTY PROJECT that FILE › NEW opens (0.3.1 · S2,
 * research/release-0.3.1/PLAN.md §3.1, docs/STATE-SCOPES.md).
 *   node tools/new-project.mjs            write the file
 *   node tools/new-project.mjs --check    write nothing; exit 1 if the shipped file is not byte-identical to what this writes
 *   node tools/new-project.mjs --stdout   print the file, write nothing
 *
 * WHAT IS IN IT.  The export envelope (`lambdawaves: 'project'`, version 1 — lab/project-import.js reads it, and its rules
 * want a `path`) around `data: { experiment, presentation }`, where the presentation carries every PROJECT key at the shipped
 * defaults and NOTHING ELSE: no `quality` (the device's budget stands), no `layout` / `modwin` / `notebook {w, h}` (the
 * WORKSPACE stands — a missing key keeps the live value), no PREFERENCE key (theme, material, accents, camera feel, field
 * chrome — S1 took them out of every project).  The register is EMPTY (decision D3: no modes, no preset).  The modulation is
 * one LFO and one AUDIO device with MACRO 1 named LFO on the LFO and MACRO 2 named AUDIO on the audio device's LEVEL socket,
 * no routes — built through the model's own API below, so a MOD_STATE_V bump or a new source field is caught by --check.
 *
 * WHERE THE DEFAULTS COME FROM — one place, this file, in two kinds:
 *   IMPORTED  the objects rack.js itself builds its boot state from, wherever they are importable in node: the Register
 *             (lab/state.js) and the Clock (lab/clock.js) — rack.js:95 and :101 construct exactly these; the boot pose
 *             CAM.HOME (lab/camera-law.js) and quatFromYawPitch / VIEW / STYLE (lab/field.js) — rack.js:104–105; the
 *             Hamiltonian table (lab/hamiltonian.js); the palette catalogue and its normalize (lab/mir/palette.js) with
 *             DEFAULT_PALETTE (lab/paletteview.js) — rack.js:124; and the modulation model (lab/mir/modulation/mod.js).
 *   TABLED    everything that lives inside a closure (rack.js boot() or a view factory) and cannot be imported.  Each
 *             entry below names the line it mirrors.  tests/new-project.browser-test.mjs holds the table honest: a fresh
 *             boot's own serialize() must equal this file on every key a boot does not choose for itself.
 * Change a default: change it where it lives, then here if it is tabled, then run this tool (and the pwa --write). */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Register } from '../lab/state.js';
import { Clock } from '../lab/clock.js';
import { CAM } from '../lab/camera-law.js';
import { quatFromYawPitch, VIEW, STYLE } from '../lab/field.js';
import { HAMILTONIANS, getZ, getHamiltonian } from '../lab/hamiltonian.js';
import { PRESET_BY_ID, normalize } from '../lab/mir/palette.js';
import { DEFAULT_PALETTE } from '../lab/paletteview.js';
import * as M from '../lab/mir/modulation/mod.js';

const OUT = fileURLToPath(new URL('../lab/new-project.lambdawaves.json', import.meta.url));

/* ── the modulation, through the model's API (the same module the page's host drives) ── */
function modulation() {
  M.modReset();                                                       // MACRO 1 and MACRO 2, as every fresh rack has
  const lfo = M.addSource('lfo');                                     // s1: a new LFO is the editable SINE preset (MIR 1.4.3)
  const audio = M.addSource('audio');                                 // s2: never arms the microphone (capture starts at the face's ARM)
  const [m1, m2] = M.macroList();
  const level = M.scalarOutputId(audio.id, 'level');                  // 's2:level' — the socket id a macro binds
  if (!M.setMacro(m1.id, { name: 'LFO', sourceId: lfo.id }) || !M.setMacro(m2.id, { name: 'AUDIO', sourceId: level }))
    throw new Error('the model refused a macro binding');
  const o = M.serialize();
  o.v = M.MOD_STATE_V;                                                // rack.js modRackStamped(): the rack carries its model version
  return o;
}

/* ── the experiment: rack.js serialize()'s own expression over a new Register and a new Clock ── */
function experiment() {
  const reg = new Register(), clock = new Clock();
  return Object.assign(reg.serialize(0), { rate: clock.rate, window: clock.window, damping: reg.damping });
}

function presentation() {
  const H = getHamiltonian();
  const prism = PRESET_BY_ID.get(DEFAULT_PALETTE);
  return {
    obs: { yaw: CAM.HOME.yaw, pitch: CAM.HOME.pitch, dist: CAM.HOME.dist, fov: CAM.HOME.fov, mode: 'free', quat: quatFromYawPitch(CAM.HOME.yaw, CAM.HOME.pitch) },   // rack.js:104; the MODE is the project's (D4's escape hatch)
    /* rack.js:105 minus bg / lightUI / stageCustom and the FIELD_CHROME (S1), plus bow (rack.js:1837) and finish (restore() writes
       'lit' where a file has none).  NOT steps: applyRebuild writes mat.steps from quality.steps — the device's, like quality. */
    mat: { view: VIEW.phase, exposure: 1, softness: 0.7, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, paletteOn: false,
      style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6, dither: 0, boost: { k: [0, 0, 0], on: false }, gamma: 1,
      bow: { gain: 1, curve: 1, limit: 3 }, finish: 'lit' },
    domain: { auto: true },                                           // rack.js:370; `half` under AUTO is computed at the rebuild, never a project value
    shadow: 'phasors',                                                // shadowview.js:16
    paletteId: DEFAULT_PALETTE,
    space: 'x',                                                       // rack.js:321
    palette: { on: false, selected: 0, stops: normalize(prism.stops).map((s) => ({ at: s.at, rgb: Array.from(s.rgb) })) },   // paletteview.js: the editor starts on the preset, normalised
    hamiltonian: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: 'reg' },         // rack.js serialize(); gasAxial starts false
    field: { overlay: 'off', lines: 10, source: 'total' },           // fieldview.js:50
    wigner: { zmax: 8, pmax: 2 },                                     // wignerview.js:41
    readers: { spectrum: { selected: -1, dials: false },              // spectrumview.js:78
      slice: { mode: 'space', half: 8, gain: 1.6, rotor: { qL: [1, 0, 0, 0], qR: [1, 0, 0, 0] } },   // sliceview.js:63
      kepler: { shell: 3 } },                                         // rack.js:2139 (ui.kepShell)
    instruments: {
      molecule: { on: false, R: 2, kind: 'sigma_g' },                 // moleculeview.js:30
      helium: { on: false, basis: 'six', x1: [0, 0, 0.8] },           // heliumview.js:11 (r1 0.8 on the z axis)
      h2: { on: false, R: 6, which: 'triplet', showCI: true, ke: 0.02, kappa: 300 },                 // h2view.js:23
      chem: { preset: 'H2O', basis: 'sto-3g', view: 'density', orbital: null, axis: 'y', kappa: 0.001, speed: 10, dt: 0.01,
        integrator: 'mmut', tda: false, core: false, on: false },     // chemview.js:56–57
      orbitals: { on: false, selection: [] },                         // orbitalsview.js:469
      states: { on: false, view: 'change', ref: 'ground', flow: false, morph: 0, morphOn: false, A: null, B: null,
        drive: { pol: 'x', omega: 0.4, e0: 0.01, envelope: 'cw', duration: 400, phase: 0 }, lanes: [] },   // statesview.js:60
      register: { mode: 'orbital' },                                  // registerview.js:17
      qcd: { kind: 'charm', potential: 'cornell', params: { alphaS: 0.39, sigma: 0.18, C: 0.733 } },  // qcdview.js:10 (qcd.js DEFAULTS)
      pulse: { basis: 'lcao1s', R: 2, dt: 0.05, pulse: { amplitude: 0.02, omega: 0.3929175297217954, duration: 48, phase: 0, start: 0 } },   // pulseview.js:16
      ladder: { nbar: 30, sigma: 2, d: 0, teeth: 8 },                 // ladder.js:13
      particles: { count: 160, trail: 24 } },                         // dynamicsview.js:50, particles.js:21
    mo: { kind: 'lcao1s', lambda: 1.7611, R: 2, electron: 'hold', force: 'exact', connection: true, dt: 5 },   // moview.js:54–55
    rates: new Array(91).fill(1),                                     // rack.js:109
    rotationRates: { z: 0, kz: 0, def: 0 },                           // rack.js:450
    sturmian: { on: false, lambda: 1 },                               // rack.js:113
    modulation: modulation(),
    ui: { stage: { mix: 0.04, custom: [0.12, 0.14, 0.18], follow: true } },   // rack.js:531 and :1331
    camera: { autoRotate: false },                                    // camera-law.js:43
    overlays: { vortex: { on: false, overlay: false }, kepler: false, particles: { on: false, count: 0 }, dials: false },
    ab: { a: null, b: null, omega: 0.05, on: false },                 // rack.js:1763
  };
}

/** the file, as text: projects.exportText()'s own form (1-space indent), stable key order, one trailing newline */
export function newProjectText() {
  const file = { lambdawaves: 'project', version: 1, path: 'NEW', name: 'NEW',
    notebook: { title: 'NOTEBOOK', subtitle: '', text: '' },
    data: { experiment: experiment(), presentation: presentation() } };
  return JSON.stringify(file, null, 1) + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const text = newProjectText();
  if (process.argv.includes('--stdout')) process.stdout.write(text);
  else if (process.argv.includes('--check')) {
    let disk = null; try { disk = readFileSync(OUT, 'utf8'); } catch (_) {}
    if (disk === text) console.log('new-project: lab/new-project.lambdawaves.json is in step (' + text.length + ' B)');
    else { console.log('new-project: lab/new-project.lambdawaves.json is OUT OF STEP — run `node tools/new-project.mjs`'); process.exit(1); }
  } else { writeFileSync(OUT, text); console.error('new-project: wrote lab/new-project.lambdawaves.json (' + text.length + ' B)'); }
}
