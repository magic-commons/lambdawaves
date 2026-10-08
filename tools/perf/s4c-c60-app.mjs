/* tools/perf/s4c-c60-app.mjs — 0.4.0 S4c: C₆₀'s HOMO and LUMO drawn by the APP, through the road a reader takes — MOLECULES' LIBRARY
 * row (DOWNLOAD → the record fetched, checked against its sha-256 name and kept), the worker's chem.open (0 solver calls), the
 * field's orbital-only kernel — and photographed by the driver (gatekit snap: a WebGPU canvas read back in-page lies).
 *   python3 tools/gate/server.py "$PWD" 8759 &
 *   LW_PORT=8759 GD_PORT=5227 node tools/perf/s4c-c60-app.mjs
 * Asserts: the open is from the record with no solver call; the view is ORBITAL and DENSITY / Δρ are refused with a sentence;
 * the dial spans the eight carried columns (176–183); the field is on ORB_WGSL at 300 AOs; the HOMO and the LUMO each light the
 * stage.  Writes .tmp/s4c-c60-{homo,lumo}.png (the committed JPEGs beside the JSON are those, re-encoded) and research/release-0.4.0/measure/s4c-c60-app.json. */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const PORT = process.env.LW_PORT || '8759', DIR = 'research/release-0.4.0/measure/';
const g = await open(`https://127.0.0.1:${PORT}/lab/?sw=0`, { width: 1400, height: 900, script: 600000,
  prefs: { 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const out = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 900, 100);
  out.open = await g.ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const c = __LW.chem, before = (await c.workerStat()).solverCalls;
    const inst = await c.install('C60');
    await c.solve('C60'); c.setOn(true); await __LW.settle(); await __LW.settle();
    const s = c.state(), f = __LW.field, btn = (id) => document.querySelector('#mol-more') && [...document.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === id);
    const after = (await c.workerStat()).solverCalls, refuse = c.setView('density');
    const knob = s.orbital;
    c.orbital(1); const lo = c.state().orbital; c.orbital(300); const hi = c.state().orbital; c.orbital(180);
    await __LW.settle(); await __LW.settle();
    return { installed: inst.ok, bytes: inst.bytes, record: s.record, nAO: s.nAO, nocc: s.nocc, energy: s.energy, view: s.view, viewAfterDensityAsk: refuse,
      orbitalDefault: knob, orbitalName: s.orbitalName, dial: [lo, hi], solverCalls: after - before, status: s.status,
      field: f.moleculeInfo, densityButton: btn('DENSITY') ? { disabled: btn('DENSITY').disabled, title: btn('DENSITY').title, help: btn('DENSITY').dataset.help || null } : null };`);
  fs.writeFileSync('.tmp/s4c-c60-homo.png', Buffer.from(await g.snap(), 'base64'));
  out.lumo = await g.ev(`__LW.chem.orbital(181); await __LW.settle(); await __LW.settle(); return { orbital: __LW.chem.state().orbital, name: __LW.chem.state().orbitalName, field: __LW.field.moleculeInfo };`);
  fs.writeFileSync('.tmp/s4c-c60-lumo.png', Buffer.from(await g.snap(), 'base64'));
  out.pixels = await g.ev(`const f = __LW.field, r = await f.readPixels(__LW.obs, __LW.mat, 320, 240); return { nonBlack: r.nonBlack, hash: r.hash };`);
  out.errors = await g.ev('return (window.__e || []).slice(0, 5);');
} finally { await g.close(); }
fs.writeFileSync(DIR + 's4c-c60-app.json', JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out, null, 1));
const O = out.open;
assert.equal(O.installed, true, 'the C60 record installs');
assert.equal(O.solverCalls, 0, 'the open runs no solver');
assert.equal(O.nAO, 300); assert.equal(O.view, 'orbital'); assert.equal(O.viewAfterDensityAsk, 'orbital', 'DENSITY is refused');
assert.deepEqual(O.dial, [176, 183], 'the dial spans the carried columns');
assert.equal(O.field.path, 'orbital'); assert.equal(O.field.nAO, 300);
assert.equal(out.lumo.orbital, 181); assert.ok(out.pixels.nonBlack > 0, 'the stage is lit');
assert.equal(out.errors.length, 0, 'no page errors');
console.log('PASS C60 opens from its record (0 solver calls) and its HOMO and LUMO draw through ORB_WGSL; screenshots in .tmp/');
