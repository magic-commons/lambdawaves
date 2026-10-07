// THE MOLECULE DEMOS (0.4.0 S0 · wave 139): WATER, BENZENE and N₂ open from the PROJECTS face's own buttons, through the
// road WAVE DANCER takes (fetch → projects.importText → projects.open).  Each one: MOLECULES is the field owner on the right
// molecule, viewing its HOMO; its notebook opens with its text; and the visitor's settings are byte-identical outside the
// WORKSPACE keys after the open (docs/STATE-SCOPES.md; W129: a demo carries no look and writes no preference).  Benzene is
// the cap: its open solves for seconds, and the status line says so — that is correct, and this waits for it.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width: 1500, height: 1000, script: 120000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok, 1);
  await g.ev(`window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
    window.__ws = () => { const o = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); for (const k of ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts', 'phoneTr', 'phoneRack']) delete o[k]; return JSON.stringify(o); };
    window.__gum = 0; const md = navigator.mediaDevices; if (md) md.getUserMedia = () => { __gum++; return Promise.reject(new Error('probe: no microphone')); };
    return 1;`);
  const DEMOS = [['water', 'H2O', 'DEMOS/WATER', 5, 7], ['benzene', 'C6H6', 'DEMOS/BENZENE', 21, 36], ['n2', 'N2', 'DEMOS/N₂', 7, 10]];
  for (const [file, id, path, homo, nAO] of DEMOS) {
    const r = await g.ev(`__LW.saveSettings(); await __w(50); const before = __ws(), t0 = performance.now();
      __LW.layout.notebook.open('projects'); await __w(200);
      const btn = document.querySelector('.pj-demo[data-file="${file}"]'); btn.click();
      const status = () => document.querySelector('.pj-status').textContent;
      for (let i = 0; i < 100 && !status().includes(${JSON.stringify(path)}); i++) await __w(100);
      let st = __LW.chem.state();
      for (let i = 0; i < 600 && !(st.on && st.fieldOwner && st.nocc); i++) { await __w(100); st = __LW.chem.state(); }
      await __LW.settle(); await __w(200);
      const nb = document.getElementById('notebook');
      return { label: btn.textContent, status: status(), ms: performance.now() - t0, preset: __LW.chem.preset(), on: st.on, owner: st.fieldOwner, view: st.view,
        orbital: st.orbital, nocc: st.nocc, nAO: st.nAO, notebookOpen: !nb.hidden, text: __LW.layout.notebook.text.split('\\n')[0],
        settingsSame: __ws() === before, gum: __gum, errs: __e.slice() };`);
    const why = JSON.stringify(r);
    assert.ok(r.status.includes('opened demo ' + path), why);
    assert.equal(r.preset, id, why); assert.equal(r.on, true, why); assert.equal(r.owner, true, 'MOLECULES is the field owner: ' + why);
    assert.equal(r.view, 'orbital', why); assert.equal(r.nocc, homo, why); assert.equal(r.nAO, nAO, why); assert.equal(r.orbital, homo, 'VIEW ORBITAL on the HOMO: ' + why);
    assert.equal(r.notebookOpen, true, why); assert.ok(r.text.startsWith('# '), why);
    assert.equal(r.settingsSame, true, 'the open wrote the visitor\'s settings outside the WORKSPACE keys: ' + why);
    assert.equal(r.gum, 0, 'a demo asked for the microphone: ' + why); assert.deepEqual(r.errs, [], why);
    console.log(`PASS ${r.label} opens ${path} in ${(r.ms / 1000).toFixed(1)} s: MOLECULES owns the field on ${id}, ORBITAL ${r.orbital} of ${r.nAO} (the HOMO), its notebook open ("${r.text}"), settings byte-identical outside the WORKSPACE keys`);
  }
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED molecule-demos.browser-test' : 'GREEN molecule-demos.browser-test');
process.exit(failed ? 1 : 0);
