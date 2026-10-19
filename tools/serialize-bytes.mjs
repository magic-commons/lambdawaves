/* tools/serialize-bytes.mjs — THE SERIALIZE-BYTES PROBE (0.5.0 C6, BRIEF-C6 §4 commit 2's gate).  FOLDERS took the projects road;
 * `serialize()` must not have moved by one byte.  One fresh Firefox profile, eight readings in order, each the bytes of
 * JSON.stringify(serialize()) and of JSON.stringify(serialize({ scope: 'edit' })) (the undo ring's record) with their sha-256:
 *   1     the demo (WAVE DANCER PROTOTYPE; iteration 009 deleted WATER, BENZENE and N₂ with the other seven), opened by the road both
 *         builds have: fetch the bundled file, projects.importText, projects.open — then paused and settled;
 *   2     the empty project (projects.fresh(), NEW's road);
 *   3–8   six history snapshots: from that NEW, six hand edits through __LW (preset, stage, style, palette, Hamiltonian, rate),
 *         each flushed into the ring as one row, read where it stands.
 * Two numbers a device computes are left as they are: they are this machine's on both trees.  `presentation.layout.at` (a time
 * stamp, when a layout carries one) is zeroed.  Run it on two trees and compare the --out files: every sha must agree.
 *   python3 tools/gate/server.py <root> <LW_PORT>   (stop it by pid)
 *   LW_PORT=… GD_PORT=… node tools/serialize-bytes.mjs [--out .tmp/serialize-bytes.json] [--texts]   (--texts keeps the bytes) */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { open } from './gate/gatekit.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const argv = process.argv.slice(2), OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : null, TEXTS = argv.includes('--texts');
const DEMOS = [['WAVE DANCER PROTOTYPE', 'wave-dancer']];   // iteration 009: the one demo
const EDITS = [['preset 1s+2pz', "__LW.loadPreset('1s+2pz')"], ['stage 0.30', '__LW.setStage(0.3)'], ['style solid', "__LW.setStyle('solid')"],
  ['palette on', '__LW.palette.setOn(true)'], ['hamiltonian qho', "__LW.setHamiltonian('qho')"], ['rate 0 → 1.7', '__LW.setRate(0, 1.7)']];
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
  const md = navigator.mediaDevices; if (md) md.getUserMedia = () => Promise.reject(new Error('probe: no microphone'));
  window.__quiet = async () => { await __LW.settle(); let st = __LW.chem.state();
    for (let i = 0; i < 600 && st.on && !(st.fieldOwner && st.nocc); i++) { await __w(100); st = __LW.chem.state(); }
    if (__LW.clock.playing) __LW.pause(); if (__LW.mod && __LW.mod.playing) __LW.mod.stop && __LW.mod.stop();
    await __LW.settle(); await __w(400); await __LW.settle(); return 1; };
  window.__read = () => { const S = __LW.serialize(); if (S.presentation && S.presentation.layout && 'at' in S.presentation.layout) S.presentation.layout.at = 0;
    return { full: JSON.stringify(S), edit: JSON.stringify(__LW.serialize({ scope: 'edit' })), errs: __e.slice() }; };
  return 1;`;
const sha = (t) => createHash('sha256').update(t).digest('hex');
const g = await open(LAB, { width: 1500, height: 1000, script: 180000 });
const run = { lab: LAB, cases: [] };
let bad = 0;
const keep = (name, r) => {
  const c = { name, bytes: r.full.length, sha: sha(r.full), editBytes: r.edit.length, editSha: sha(r.edit), errs: r.errs };
  if (TEXTS) Object.assign(c, { full: r.full, edit: r.edit });
  if (r.errs.length) bad++;
  run.cases.push(c);
  console.log(name.padEnd(22) + ' ' + String(c.bytes).padStart(6) + ' B ' + c.sha.slice(0, 16) + '  · edit ' + String(c.editBytes).padStart(6) + ' B ' + c.editSha.slice(0, 16) + (r.errs.length ? '  ERRORS ' + JSON.stringify(r.errs) : ''));
};
try {
  if ((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok !== 1) throw new Error('the lab never became ready');
  await g.ev(HELP); await g.ev('return __quiet();');
  for (const [name, file] of DEMOS) {
    const r = await g.ev(`const P = __LW.projects, text = await (await fetch('./demos/${file}.lambdawaves.json', { cache: 'no-cache' })).text();
      const path = P.importText(text), ok = P.open(path); await __quiet(); return { ok, path, ...__read() };`);
    if (!r || r.E || !r.ok) throw new Error(name + ': the open failed — ' + JSON.stringify(r && (r.E || r.path)));
    keep(name, r);
  }
  const fresh = await g.ev(`const ok = await __LW.projects.fresh(); await __quiet(); return { ok, ...__read() };`);
  if (!fresh || fresh.E || !fresh.ok) throw new Error('NEW failed — ' + JSON.stringify(fresh && fresh.E));
  keep('the empty project', fresh);
  for (const [name, js] of EDITS) {
    const r = await g.ev(`${js}; await __w(450); __LW.history.flush(); await __quiet(); return { rows: __LW.history.entries().length, ...__read() };`);
    if (!r || r.E) throw new Error(name + ': the edit threw — ' + JSON.stringify(r && r.E));
    keep('history · ' + name, r);
  }
} catch (e) { bad++; console.error(e); }
finally {
  if (OUT) writeFileSync(OUT, JSON.stringify(run, null, 1) + '\n');
  await g.close();
}
console.log((bad ? 'RED ' : 'DONE ') + run.cases.length + ' readings' + (OUT ? ' → ' + OUT : ''));
process.exit(bad ? 1 : 0);
