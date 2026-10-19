// THE DEMOS AFTER ITERATION 009 (Josh 2026-10-19: "deleting the other demo projects leaving only Wave Dancer, rename Wave Dancer to
// 'WAVE DANCER PROTOTYPE'").  RE-AIMED: this suite opened the molecule demos (WATER, BENZENE, N₂, H₂ σu, 0.4.0 S0 · wave 139) and
// HELIUM (0.5.0 D9) from FOLDERS' DEMOS; those files are gone from lab/demos/, so it now proves what a reader keeps of them and
// what the one starter left becomes, under the same laws (MOLECULES owns the field on the HOMO, the notebook opens, the visitor's
// settings are byte-identical outside the WORKSPACE keys — docs/STATE-SCOPES.md; W129: a demo writes no preference):
//   1 · A FRESH STORE: FOLDERS' DEMOS holds ONE starter, WAVE DANCER PROTOTYPE, read-only and wearing its cover; it opens at KNEE 3;
//   2 · AN OLDER READER'S STORE (what an iteration-008 build seeded: the old WAVE DANCER starter at its old revision, WATER and HELIUM,
//       the eleven ids in `.seeded`, WAVE DANCER in RECENT) through a reload: the starter is refreshed AND renamed in place — one
//       entry, its id and RECENT row kept, no "WAVE DANCER" beside it — and the deleted demos' entries are untouched, never re-seeded;
//   3 · those entries still open from the reader's store (the DEMOS press finds them by seedId): WATER with MOLECULES on its HOMO,
//       HELIUM as SPECTRUM's ATOM at Z = 2; RESTORE THE DEMOS has nothing to put back.
// The old files ride as tests/fixtures/retired-demos/ (as they shipped at 033424d).  Screenshots: SHOTS=<dir>.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { open } from '../tools/gate/gatekit.mjs';
import { go } from '../tools/gate/drv.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?sw=0`, SHOTS = process.env.SHOTS || null;
const fixture = (f) => JSON.parse(readFileSync(new URL('./fixtures/retired-demos/' + f + '.lambdawaves.json', import.meta.url), 'utf8'));
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
    window.__ws = () => { const o = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); for (const k of ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts', 'phoneTr', 'phoneRack']) delete o[k]; return JSON.stringify(o); };
    window.__gum = 0; const md = navigator.mediaDevices; if (md) md.getUserMedia = () => { __gum++; return Promise.reject(new Error('probe: no microphone')); };
    window.__demos = () => __LW.projects.folders.files.entries().filter((e) => e.folder === 'DEMOS')
      .map((e) => ({ id: e.id, name: e.name, seedId: e.facts && e.facts.seedId, readOnly: !!(e.facts && e.facts.readOnly), rev: e.facts && e.facts.seedRevision, thumb: (e.thumb || '').slice(0, 15), knee: e.payload.parts.lambdawaves.data.presentation.mat.knee }));
    return 1;`;
const g = await open(LAB, { width: 1500, height: 1000, script: 120000 });
const ready = async () => { assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1); await g.armErrors(); await g.ev(HELP); };
const shot = async (name) => { if (!SHOTS) return; mkdirSync(SHOTS, { recursive: true }); writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(await g.snap(), 'base64')); console.log('      shot ' + SHOTS + '/' + name + '.png'); };
let failed = false;
try {
  await ready();
  /* ── 1 · A FRESH STORE: one starter, its cover, and it opens at KNEE 3 ── */
  const fresh = await g.ev(`const P = __LW.projects; P.show({ folder: 'DEMOS' }); await __w(900);
    return { demos: __demos(), seeded: JSON.parse(localStorage.getItem('lambdawaves.q0.projects.seeded') || '[]'), errs: __e.slice() };`);
  const why1 = JSON.stringify(fresh);
  assert.equal(fresh.demos.length, 1, why1);
  assert.deepEqual({ ...fresh.demos[0], id: 0 }, { id: 0, name: 'WAVE DANCER PROTOTYPE', seedId: 'demos/wave-dancer', readOnly: true, rev: fresh.demos[0].rev, thumb: 'data:image/jpeg', knee: 3 }, why1);
  assert.deepEqual(fresh.seeded, ['demos/wave-dancer'], why1); assert.deepEqual(fresh.errs, [], why1);
  await shot('1-folders-fresh');
  const opened = await g.ev(`const P = __LW.projects; P.folders.close(); await __w(300); await P.demo('wave-dancer'); await __w(1200); await __LW.settle();
    return { status: P.status, current: P.current, knee: __LW.mat.knee, title: document.querySelector('[data-mir-window="notebook"] .nb-title').value, errs: __e.slice() };`);
  assert.deepEqual(opened, { status: 'opened demo DEMOS/WAVE DANCER PROTOTYPE', current: 'DEMOS/WAVE DANCER PROTOTYPE', knee: 3, title: 'WAVE DANCER PROTOTYPE', errs: [] });
  await shot('2-wave-dancer-prototype-open');
  console.log(`PASS a fresh store: FOLDERS' DEMOS holds one read-only starter, WAVE DANCER PROTOTYPE, wearing its cover (${fresh.demos[0].rev}); its press opens it at KNEE 3 with its notebook titled so`);

  /* ── 2 · AN OLDER READER'S STORE, through a reload ── */
  const OLD = ['wave-dancer', 'water', 'benzene', 'n2', 'h2-sigma-u', 'helium', 'chord', 'bucky', 'break', 'tunnel', 'lda'].map((f) => 'demos/' + f);
  const item = (file, fx, name, id) => { const p = fixture(fx), path = 'DEMOS/' + name;
    return [path, { path, folder: 'DEMOS', name, saved: p.saved, opened: p.saved, data: p.data, notebook: p.notebook, id, facts: { seedId: 'demos/' + file, readOnly: true, seedRevision: p.saved + '·cover' } }]; };
  const store = { items: Object.fromEntries([item('wave-dancer', 'wave-dancer-008', 'WAVE DANCER', 'f1'), item('water', 'water', 'WATER', 'f2'), item('helium', 'helium', 'HELIUM', 'f3')]),
    recent: ['DEMOS/WAVE DANCER', 'DEMOS/WATER'], seq: 3 };
  await g.ev(`localStorage.clear(); localStorage.setItem('lambdawaves.q0.projects', ${JSON.stringify(JSON.stringify(store))});
    localStorage.setItem('lambdawaves.q0.projects.seeded', ${JSON.stringify(JSON.stringify(OLD))}); return 1;`);
  await go(g.s, LAB); await ready();
  const older = await g.ev(`const C = JSON.parse(localStorage.getItem('lambdawaves.q0.projects'));
    return { demos: __demos(), paths: Object.keys(C.items), recent: C.recent, water: JSON.stringify(C.items['DEMOS/WATER'].data), helium: JSON.stringify(C.items['DEMOS/HELIUM'].data),
      seeded: JSON.parse(localStorage.getItem('lambdawaves.q0.projects.seeded') || '[]'), status: __LW.projects.status, errs: __e.slice() };`);
  const why2 = JSON.stringify({ ...older, water: older.water.length, helium: older.helium.length });
  assert.deepEqual(older.paths, ['DEMOS/WAVE DANCER PROTOTYPE', 'DEMOS/WATER', 'DEMOS/HELIUM'], 'the starter was not renamed in place (or a demo came back): ' + why2);
  assert.deepEqual(older.demos.map((d) => [d.id, d.name, d.seedId, d.knee]), [['f1', 'WAVE DANCER PROTOTYPE', 'demos/wave-dancer', 3], ['f2', 'WATER', 'demos/water', 0.6], ['f3', 'HELIUM', 'demos/helium', 0.6]], why2);
  assert.ok(older.demos[0].thumb === 'data:image/jpeg' && older.demos[0].rev !== store.items['DEMOS/WAVE DANCER'].facts.seedRevision, 'the starter was not refreshed with its cover: ' + why2);
  assert.deepEqual(older.recent, ['DEMOS/WAVE DANCER PROTOTYPE', 'DEMOS/WATER'], 'RECENT lost the renamed row: ' + why2);
  assert.equal(older.water, JSON.stringify(store.items['DEMOS/WATER'].data), 'WATER\'s entry moved'); assert.equal(older.helium, JSON.stringify(store.items['DEMOS/HELIUM'].data), 'HELIUM\'s entry moved');
  assert.deepEqual(older.seeded, OLD, 'the seeded list changed: ' + why2); assert.deepEqual(older.errs, [], why2);
  await g.ev(`__LW.projects.show({ folder: 'DEMOS' }); await __w(900); return 1;`);
  await shot('3-folders-older-store');
  console.log('PASS an older reader\'s store: the old WAVE DANCER starter is refreshed and renamed in place — one entry (f1), WAVE DANCER PROTOTYPE at KNEE 3 with its cover, its RECENT row following — and the deleted demos\' entries (WATER, HELIUM) are untouched and never re-seeded');

  /* ── 3 · the deleted demos still open from the reader's store ── */
  const water = await g.ev(`__LW.projects.folders.close(); await __w(300); __LW.saveSettings(); await __w(50); const before = __ws();
    const ok = await __LW.projects.demo('water'); let st = __LW.chem.state();
    for (let i = 0; i < 600 && !(st.on && st.fieldOwner && st.nocc); i++) { await __w(100); st = __LW.chem.state(); }
    await __LW.settle(); await __w(200);
    return { ok, status: __LW.projects.status, preset: __LW.chem.preset(), on: st.on, owner: st.fieldOwner, view: st.view, orbital: st.orbital, nocc: st.nocc, nAO: st.nAO,
      notebookOpen: !document.querySelector('[data-mir-window="notebook"]').hidden, text: __LW.layout.notebook.text.split('\\n')[0], settingsSame: __ws() === before, gum: __gum, errs: __e.slice() };`);
  const why3 = JSON.stringify(water);
  assert.deepEqual({ ok: water.ok, status: water.status, preset: water.preset, on: water.on, owner: water.owner, view: water.view, orbital: water.orbital, nocc: water.nocc, nAO: water.nAO },
    { ok: true, status: 'opened demo DEMOS/WATER', preset: 'H2O', on: true, owner: true, view: 'orbital', orbital: 5, nocc: 5, nAO: 7 }, why3);
  assert.equal(water.notebookOpen, true, why3); assert.ok(water.text.startsWith('# '), why3);
  assert.equal(water.settingsSame, true, 'the open wrote the visitor\'s settings outside the WORKSPACE keys: ' + why3);
  assert.equal(water.gum, 0, why3); assert.deepEqual(water.errs, [], why3);
  await shot('4-water-from-older-store');
  const he = await g.ev(`__LW.saveSettings(); await __w(50); const before = __ws();
    const ok = await __LW.projects.demo('helium'); await __LW.settle(); await __w(300);
    const atoms = document.querySelector('.dev[data-id="atoms"]'), restore = await __LW.projects.restoreDemos();
    return { ok, status: __LW.projects.status, ham: __LW.hamiltonian, Z: __LW.atomZ, populated: __LW.reg.populated(), atomsOpen: !atoms.hidden && !atoms.classList.contains('closed'),
      chemOn: __LW.chem.state().on, settingsSame: __ws() === before, restore: restore.said, paths: Object.keys(JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items), errs: __e.slice() };`);
  const whyHe = JSON.stringify(he);
  assert.deepEqual({ ok: he.ok, status: he.status, ham: he.ham, Z: he.Z, populated: he.populated, atomsOpen: he.atomsOpen, chemOn: he.chemOn },
    { ok: true, status: 'opened demo DEMOS/HELIUM', ham: 'atom', Z: 2, populated: [0], atomsOpen: true, chemOn: false }, whyHe);
  assert.equal(he.settingsSame, true, whyHe);
  assert.equal(he.restore, 'Every demo is here — nothing to restore.', whyHe);
  assert.deepEqual(he.paths, ['DEMOS/WAVE DANCER PROTOTYPE', 'DEMOS/WATER', 'DEMOS/HELIUM'], whyHe); assert.deepEqual(he.errs, [], whyHe);
  console.log(`PASS the deleted demos still open from the reader's store: WATER with MOLECULES on its HOMO (orbital ${water.orbital} of ${water.nAO}), HELIUM as SPECTRUM's ATOM at Z = 2; settings byte-identical outside the WORKSPACE keys; RESTORE THE DEMOS: "${he.restore}"`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED molecule-demos.browser-test' : 'GREEN molecule-demos.browser-test');
process.exit(failed ? 1 : 0);
