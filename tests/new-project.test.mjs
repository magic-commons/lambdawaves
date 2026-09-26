// 0.3.1 · S2 THE EMPTY PROJECT, in node: lab/new-project.lambdawaves.json is what tools/new-project.mjs writes, it opens
// under the import envelope's rules, it carries PROJECT keys only (no PREFERENCE, no quality, no WORKSPACE), its register is
// empty, and its modulation is LFO + AUDIO bound to MACRO LFO and MACRO AUDIO, no routes — and round-trips through the model.
// research/release-0.3.1/PLAN.md §3.1, docs/STATE-SCOPES.md; the page's side is tests/new-project.browser-test.mjs.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseProjectImport } from '../lab/project-import.js';
import * as M from '../lab/mir/modulation/mod.js';

const at = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const FILE = at('../lab/new-project.lambdawaves.json');
const text = readFileSync(FILE, 'utf8');

/* 1 · the generator's --check: the shipped bytes are exactly what the tool writes (a MOD_STATE_V bump, a new source field or
       a moved default is caught here, not on a user's NEW) */
const check = spawnSync(process.execPath, [at('../tools/new-project.mjs'), '--check'], { encoding: 'utf8' });
assert.equal(check.status, 0, 'tools/new-project.mjs --check: ' + check.stdout + check.stderr);
assert.match(check.stdout, /in step/);

/* 2 · the envelope: lab/project-import.js reads it (version 1), and it is not a demo (the PROJECTS face lists lab/demos/ only) */
const env = JSON.parse(text);
assert.equal(env.lambdawaves, 'project'); assert.equal(env.version, 1); assert.equal(env.name, 'NEW');
const parsed = parseProjectImport(text);
assert.deepEqual(parsed.notebook, { title: 'NOTEBOOK', subtitle: '', text: '' });
assert.deepEqual(Object.keys(parsed.data), ['experiment', 'presentation']);
assert.equal(existsSync(at('../lab/demos/new-project.lambdawaves.json')), false);
assert.ok(readFileSync(at('../lab/rack.js'), 'utf8').includes("fetch('./new-project.lambdawaves.json'"), 'rack.js no longer fetches the file NEW opens');
assert.ok(readFileSync(at('../lab/sw.js'), 'utf8').includes("'./new-project.lambdawaves.json'"), 'the empty project is not precached — NEW would fail offline');

/* 3 · PROJECT keys only */
const P = parsed.data.presentation;
for (const k of ['quality', 'layout', 'modwin', 'notebook', 'modulationBases']) assert.equal(k in P, false, 'the empty project carries ' + k);
assert.deepEqual(Object.keys(P.ui), ['stage'], 'ui carries a PREFERENCE key');
assert.deepEqual(Object.keys(P.camera), ['autoRotate'], 'camera carries its feel');
for (const k of ['bg', 'lightUI', 'stageCustom', 'frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk', 'steps'])
  assert.equal(k in P.mat, false, 'mat carries ' + k);
const PREF = new Set(['theme', 'card', 'cardSet', 'frost', 'disc', 'blur', 'accent', 'friction', 'spin', 'speed', 'dragGain', 'fling', 'camMode',
  'badges', 'controlHints', 'captions', 'gamut', 'p3Mode', 'warned', 'audioDevice', 'nativeLayout', 'phoneTr', 'phoneRack',
  'auto', 'governor', 'keepFrames', 'perfMode', 'modCadence', 'modArm', 'clockLink']);
/* the bundled demos' own law (tests/first-run.test.mjs, "A BUNDLED DEMO CARRIES NO LOOK"), with its same three lists — the
   camera block itself is allowed here: the empty project carries auto-rotate, which is PROJECT */
const LOOK = ['theme', 'card', 'frost', 'disc', 'accent'], FEEL = ['friction', 'spin', 'speed', 'dragGain', 'fling'],
  CHROME = ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'];
assert.deepEqual({ ui: LOOK.filter((k) => k in P.ui), camera: FEEL.filter((k) => k in P.camera), mat: CHROME.filter((k) => k in P.mat) },
  { ui: [], camera: [], mat: [] }, 'the empty project carries a look');
/* where a PREFERENCE key has ever ridden in a project: the presentation's top level, ui, camera, mat and obs (S1's list) */
const leaks = [['', P], ['ui.', P.ui], ['camera.', P.camera], ['mat.', P.mat], ['obs.', P.obs]].flatMap(([at, o]) => Object.keys(o).filter((k) => PREF.has(k)).map((k) => at + k));
assert.deepEqual(leaks, [], 'PREFERENCE keys in the empty project');

/* 4 · the register is empty (D3), the field off, time at zero */
const E = parsed.data.experiment;
assert.deepEqual(E.modes, []); assert.equal(E.preset, null); assert.deepEqual(E.field, { Bz: 0, Fz: 0 }); assert.equal(E.t, 0); assert.equal(E.damping, 0);

/* 5 · the modulation: LFO + AUDIO, MACRO LFO on the LFO, MACRO AUDIO on the audio device's LEVEL socket, no routes, the
       model's own version — and the rack deserialises and re-serialises byte-identical through the model */
const mod = P.modulation;
assert.equal(mod.v, M.MOD_STATE_V);
assert.deepEqual(mod.sources.map((s) => [s.id, s.kind]), [['s1', 'lfo'], ['s2', 'audio']]);
assert.equal(mod.sources[0].shapeMode, 'curve'); assert.equal(mod.sources[0].wave, 'sine');
assert.deepEqual(mod.routes, []); assert.equal(mod.transport.bpm, 60);
assert.equal(M.deserialize(mod), true);
assert.equal(M.scalarOutputId('s2', 'level'), 's2:level');
assert.deepEqual(M.macroList().map((m) => [m.name, m.named, m.sourceId]), [['LFO', true, 's1'], ['AUDIO', true, M.scalarOutputId('s2', 'level')]]);
const again = M.serialize(); again.v = M.MOD_STATE_V;
assert.equal(JSON.stringify(again), JSON.stringify(mod), 'the rack does not round-trip through the model');

console.log(`GREEN new-project: the empty project (${text.length} B) is the tool's bytes, opens under the v1 envelope, carries PROJECT keys only, an empty register, and LFO → MACRO LFO + AUDIO level → MACRO AUDIO with no routes (model ${M.MOD_STATE_V}, round-trips byte-identical)`);
