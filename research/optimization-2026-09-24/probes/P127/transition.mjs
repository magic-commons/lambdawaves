/* transition.mjs — wave 127 · THE A/B TRANSITION OVER AN OPEN.  A running A↔B transition, then a restore of a state whose
 * register is different and whose transition is OFF: the restored register must be what the instrument holds and plays.
 * Three roads, each on a fresh transition (1s ↔ 2p_z at Ω 0.5, played 400 ms):
 *   A · __LW.restore(file)                          (the quick-LOAD / report put-back road)
 *   B · projects.importText + projects.open         (the project road: restore(file, { project: true }))
 *   C · WAVE DANCER opened (it leaves its own transition running), then __LW.restore(the state as found) — the device
 *       report's put-back, WITHOUT its `LW.ab.set(false)` work-around
 * Each road reports: the transition after (must be off), the switch, the register's modes against the file's, and the
 * coefficients the instrument plays at t = 0 (reg.at(0)) against the file's anchor.
 *   LW_PORT=8740 GD_PORT=5253 node research/optimization-2026-09-24/probes/P127/transition.mjs [tag] */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8740', TAG = process.argv[2] || 'run';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 600000 });
let out = null;
try {
  await g.waitFor('window.__LW && __LW.ready && __LW.field.ok', 3000, 20);
  out = await g.ev(`
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), LW = __LW;
    try { if (LW.warning && LW.warning.dismiss) LW.warning.dismiss(); } catch (_) {}
    LW.pause(); await LW.settle();
    /* the FILE: preset 3d+4f-ish register (1s+2s beat), transition OFF, no stores */
    LW.loadPreset('1s+2s'); LW.pause(); LW.scrub(0); await LW.settle();
    const file = JSON.parse(JSON.stringify(LW.serialize()));
    file.presentation.ab = { a: null, b: null, omega: 0.05, on: false };
    const want = file.experiment.modes.map((m) => m.id + ':' + m.re.toFixed(9) + ':' + m.im.toFixed(9)).join(' ');
    const running = async () => { LW.loadPreset('1s'); LW.ab.storeA(); LW.loadPreset('2pz'); LW.ab.storeB(); LW.ab.setOmega(0.5); LW.ab.set(true); LW.play(); await sleep(400); return LW.ab.on; };
    const read = (label, wantModes) => {
      const got = LW.reg.serialize(0).modes.map((m) => m.id + ':' + m.re.toFixed(9) + ':' + m.im.toFixed(9)).join(' ');
      const c = LW.reg.at(0), plays = []; for (let a = 0; a < 91; a++) if (Math.abs(c.re[a]) > 1e-12 || Math.abs(c.im[a]) > 1e-12) plays.push(a);
      return { label, transitionOff: !LW.reg.transition, switchOff: !LW.ab.on, registerIsFile: got === wantModes, playsModes: plays.length, got: got.slice(0, 160), want: wantModes.slice(0, 160) };
    };
    const R = {};
    /* A · __LW.restore */
    R.A_before = await running();
    LW.restore(JSON.parse(JSON.stringify(file))); await LW.settle();
    R.A = read('A · __LW.restore(file)', want);
    /* B · the project road */
    R.B_before = await running();
    const path = LW.projects.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'P127/TRANSITION', name: 'TRANSITION', data: file, notebook: { title: 'T', subtitle: '', text: '' } }));
    R.B_ok = LW.projects.open(path); await LW.settle();
    R.B = read('B · projects.open(file)', want);
    LW.projects.remove(path); LW.projects.markClean();
    /* C · WAVE DANCER, then the state as found */
    LW.loadPreset('1s+2pz'); LW.pause(); LW.scrub(0); await LW.settle();
    if (LW.reg.transition) LW.ab.set(false);
    const found = JSON.parse(JSON.stringify(LW.serialize()));
    const wantC = found.experiment.modes.map((m) => m.id + ':' + m.re.toFixed(9) + ':' + m.im.toFixed(9)).join(' ');
    const dancer = await (await fetch('demos/wave-dancer.lambdawaves.json')).text();
    const pd = LW.projects.importText(dancer); LW.projects.open(pd); await LW.settle();
    R.C_dancerLeavesTransition = !!LW.reg.transition;
    LW.play(); await sleep(400);
    LW.restore(found); await LW.settle();
    R.C = read('C · WAVE DANCER → __LW.restore(state as found)', wantC);
    LW.projects.remove(pd); LW.projects.markClean();
    R.errs = (window.__e || []).map(String).slice(0, 10);
    return R;`);
} catch (e) { out = { error: String(e && e.stack || e) }; }
finally { await g.close(); }
fs.writeFileSync(new URL(`./transition.${TAG}.json`, import.meta.url), JSON.stringify(out, null, 1));
const pass = out && ['A', 'B', 'C'].every((k) => out[k] && out[k].transitionOff && out[k].switchOff && out[k].registerIsFile);
console.log(JSON.stringify(out, null, 1));
console.log(pass ? 'PASS · every road plays the restored register' : 'FAIL');
