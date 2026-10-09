/* tools/camera-routes.mjs — THE CAMERA ROUTES (0.5.0 C1's closer, NEW): the saved observer.* modulation routes still resolve after
 * MIR's CAMERA panel took the CAMERA card.  One fresh Firefox, five scenes in order: the four bundled demos through their PROJECTS
 * buttons (WAVE DANCER, WATER, BENZENE, N₂) and NEW (the empty project).  For each, against the FILE it opened:
 *   1 · every saved route on an observer.* target is live with the same id, target, macro, min and max, and the registry has it;
 *   2 · every observer.* base is the file's: its `modulationBases` entry, else its pose (yaw modulo 2π) — a routed one too;
 *   3 · the six observer.* targets are registered under the saved-route law below (map, min, max: a changed range re-means a depth);
 *   4 · each target has a dial on the glass ([data-param]), and on a ROUTED one a key on that dial moves the BASE (the hand's law),
 *       the route stays, and the base is put back.  (Before C1 YAW and PITCH had no dial — the camera was dragged, not dialled —
 *       so a pre-C1 tree reds on those two dials and on nothing else: 2026-10-08, `3a60679` vs C1, routes/bases/law SAME on all 5.)
 * --out keeps the fingerprint (routes, bases, the law, the dials) so a tree served from `git archive` can be compared with this one;
 * --against FILE compares this run's routes, bases and law with that file's and reds on any difference (the dials are reported).
 *   python3 tools/gate/server.py <root> <LW_PORT>   (stop it by pid)
 *   LW_PORT=… GD_PORT=… node tools/camera-routes.mjs [--out .tmp/routes.json] [--against .tmp/routes-base.json] */
import { readFileSync, writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const OUT = arg('--out'), AGAINST = arg('--against');
const SCENES = [['WAVE DANCER', 'wave-dancer'], ['WATER', 'water'], ['BENZENE', 'benzene'], ['N₂', 'n2'], ['NEW']];
/** the saved-route law of the six observer.* targets (rack.js' defs; CAM in lab/camera-law.js) */
const LAW = { 'observer.yaw': ['wrap', 0, 2 * Math.PI], 'observer.pitch': ['bipolar', -1.52, 1.52], 'observer.dist': ['log', 1.2, 8],
  'observer.fov': ['linear', 0.25, 1.2], 'observer.panx': ['bipolar', -1, 1], 'observer.pany': ['bipolar', -1, 1] };
const HELP = `window.__w = (n) => new Promise((r) => setTimeout(r, n)); window.confirm = () => true;
  const md = navigator.mediaDevices; if (md) md.getUserMedia = () => Promise.reject(new Error('routes: no microphone'));
  window.__quiet = async () => { await __LW.settle(); let st = __LW.chem.state();
    for (let i = 0; i < 600 && st.on && !(st.fieldOwner && st.nocc); i++) { await __w(100); st = __LW.chem.state(); }
    await __LW.settle(); await __w(400); return 1; };
  return 1;`;
const g = await open(LAB, { width: 1500, height: 1000, script: 180000 });
const run = { lab: LAB, scenes: [] };
let red = 0;
const fail = (scene, why) => { red++; console.log('RED   ' + scene + '  ' + why); };
try {
  if ((await g.waitFor('window.__LW&&__LW.ready', 300, 100)).ok !== 1) throw new Error('the lab never became ready');
  await g.ev(HELP); await g.ev('return __quiet();');
  for (const [name, file] of SCENES) {
    const r = await g.ev(`__LW.layout.notebook.open('projects'); await __w(200);
      if (${JSON.stringify(!!file)}) { document.querySelector('.pj-demo[data-file=${JSON.stringify(file || '')}]').click();
        for (let i = 0; i < 100 && !/opened demo/.test(document.querySelector('.pj-status').textContent); i++) await __w(100); }
      else await __LW.layout.projects.requestFresh();
      await __quiet();
      const P = (await (await fetch(${JSON.stringify(file ? 'demos/' + file + '.lambdawaves.json' : 'new-project.lambdawaves.json')}, { cache: 'no-cache' })).json()).data.presentation;
      const R = __LW.mod.registry, M = __LW.mod.model, ids = ${JSON.stringify(Object.keys(LAW))};
      const pick = (rt) => ({ id: rt.id, target: rt.targetId, macro: rt.macroId, min: rt.min, max: rt.max });
      const saved = { routes: (P.modulation.routes || []).filter((rt) => /^observer\\./.test(rt.targetId)).map(pick),
        bases: Object.fromEntries(Object.entries(P.modulationBases || {}).filter(([k]) => /^observer\\./.test(k))),
        pose: { 'observer.yaw': P.obs.yaw, 'observer.pitch': P.obs.pitch, 'observer.dist': P.obs.dist, 'observer.fov': P.obs.fov,
          'observer.panx': (P.obs.shift || [0, 0])[0], 'observer.pany': (P.obs.shift || [0, 0])[1] } };
      const live = { routes: M.routeList().filter((rt) => /^observer\\./.test(rt.targetId)).map(pick),
        has: Object.fromEntries(ids.map((id) => [id, R.has(id)])),
        law: Object.fromEntries(R.describe().filter((d) => ids.includes(d.id)).map((d) => [d.id, [d.map, d.min, d.max]])),
        bases: Object.fromEntries(ids.map((id) => [id, R.baseOf(id)])),
        modulated: Object.fromEntries(ids.map((id) => [id, !!R.isModulated(id)])),
        dials: Object.fromEntries(ids.map((id) => { const k = document.querySelector('[data-param="' + id + '"]');
          return [id, k ? (k.closest('.mir-camera') ? 'panel' : k.closest('.dev') ? 'card:' + k.closest('.dev').dataset.id : 'elsewhere') : null]; })) };
      /* 4 · a key on a ROUTED dial is the hand: it moves the base, the route stays; the base is put back */
      const hands = {}, routedIds = [...new Set(saved.routes.map((rt) => rt.target))], started = routedIds.length && !routedIds.every((id) => R.isModulated(id));
      if (started) { __LW.mod.play(); await __w(400); }   /* a saved route that is not playing yet: the modulation clock runs for the check, and stops after */
      for (const id of ids) { if (!R.isModulated(id)) continue; const k = document.querySelector('[data-param="' + id + '"]'); if (!k) { hands[id] = { dial: false }; continue; }
        const b0 = R.baseOf(id), key = R.toNorm(id, b0) > 0.5 ? 'ArrowLeft' : 'ArrowRight';   /* inward: a base at its end cannot move outward */
        k.focus(); k.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true })); await __w(80);
        const b1 = R.baseOf(id), still = M.routeList().some((rt) => rt.targetId === id), mod = !!R.isModulated(id); R.write(id, b0); await __w(50);
        hands[id] = { dial: true, moved: b1 !== b0, b0, b1, routeKept: still, stillModulated: mod, putBack: R.baseOf(id) === b0 }; k.blur(); }
      if (started) __LW.mod.stop();
      for (const id of routedIds) if (!hands[id]) hands[id] = { dial: !!document.querySelector('[data-param="' + id + '"]'), moved: false, why: 'never modulated, even playing' };
      return { status: document.querySelector('.pj-status').textContent, saved, live, hands, errs: __e.slice() };`);
    if (!r || r.E) throw new Error(name + ': the open threw in the page — ' + (r && r.E));
    const s = { name, ...r }; run.scenes.push(s);
    const why = [];
    for (const sr of r.saved.routes) {
      const lr = r.live.routes.find((x) => x.id === sr.id);
      if (!lr) why.push('route ' + sr.id + ' → ' + sr.target + ' is gone');
      else if (JSON.stringify(lr) !== JSON.stringify(sr)) why.push('route ' + sr.id + ' differs: ' + JSON.stringify(lr) + ' vs saved ' + JSON.stringify(sr));
      if (!r.live.has[sr.target]) why.push('the registry has no ' + sr.target);
    }
    for (const [id, [map, min, max]] of Object.entries(LAW)) {
      const l = r.live.law[id];
      if (!r.live.has[id] || !l) { why.push(id + ' is not registered'); continue; }
      if (l[0] !== map || Math.abs(l[1] - min) > 1e-12 || Math.abs(l[2] - max) > 1e-12) why.push(id + ' law ' + JSON.stringify(l) + ' ≠ ' + JSON.stringify([map, min, max]));
      const want = id in r.saved.bases ? r.saved.bases[id] : r.saved.pose[id], got = r.live.bases[id];
      const d = id === 'observer.yaw' ? Math.abs(((got - want) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) : Math.abs(got - want);
      if (!(d < 1e-9)) why.push(id + ' base ' + got + ' ≠ the file\'s ' + want);
      if (!r.live.dials[id]) why.push(id + ' has no dial on the glass');
    }
    for (const [id, h] of Object.entries(r.hands)) if (!h.dial || !h.moved || !h.routeKept || !h.putBack) why.push(id + ' (routed): the hand on its dial ' + JSON.stringify(h));
    if (r.errs.length) why.push('page errors ' + JSON.stringify(r.errs));
    const routed = r.saved.routes.map((x) => x.id + '→' + x.target).join(', ') || 'none';
    if (why.length) fail(name, why.join('; '));
    else console.log(`GREEN ${name.padEnd(11)} routes on observer.*: ${routed}; 6 targets, bases = the file's, law kept; dials ${JSON.stringify(Object.values(r.live.dials))}` +
      (Object.keys(r.hands).length ? `; the hand on ${Object.keys(r.hands).join(', ')} moved the base and kept the route` : ''));
  }
} finally { await g.close(); }
const print = (sc) => ({ name: sc.name, routes: sc.live.routes, bases: sc.live.bases, law: sc.live.law });
if (AGAINST) {
  const was = JSON.parse(readFileSync(AGAINST, 'utf8'));
  for (const sc of run.scenes) {
    const w = was.scenes.find((x) => x.name === sc.name);
    if (!w) { fail(sc.name, 'not in ' + AGAINST); continue; }
    const a = JSON.stringify(print(sc)), b = JSON.stringify(print(w));
    if (a !== b) fail(sc.name, 'differs from ' + AGAINST + ': ' + a + ' vs ' + b);
    else console.log(`SAME  ${sc.name.padEnd(11)} routes, bases and law byte-identical to ${AGAINST} (dials then ${JSON.stringify(Object.values(w.live.dials))}, now ${JSON.stringify(Object.values(sc.live.dials))})`);
  }
}
if (OUT) writeFileSync(OUT, JSON.stringify(run, null, 1));
console.log(red ? `RED camera-routes — ${red} failing` : `GREEN camera-routes — ${run.scenes.length} projects`);
process.exit(red ? 1 : 0);
