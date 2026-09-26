/* scope-keys.mjs — 0.3.1 · S1 THE SCOPE LAW, measured.  One page, three reads, written beside this file as
 * scope-keys.<tag>.json (tag = argv[2], default 'run'), so the before/after pair is two runs on two trees:
 *   1. KEYS    every key path serialize().presentation carries (ui, camera, mat, obs, layout.look, layout.cam and the
 *              top level), with the bytes of the whole state — the diff of two runs is the list of keys that left.
 *   2. D4      is a camera pose mode-independent?  (a) a TURNTABLE orbit: how far the record's `quat` is from the pose the
 *              angles describe (a stale rotor means a FREE reader would draw another shot); (b) a FREE loop: the roll it
 *              leaves (right·ẑ), and how far a TURNTABLE reading of that record is from the FREE picture.
 *   3. SETTINGS the strong gate's evidence: lambdawaves.q0.settings minus the WORKSPACE keys, and the theme, before and
 *              after restore() of a project carrying foreign theme / card / frost / disc / accent, camera feel, chrome
 *              and obs.mode keys.
 *   LW_PORT=8731 GD_PORT=5231 node research/release-0.3.1/probes/S1/scope-keys.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
const PORT = process.env.LW_PORT || '8731';
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1600, height: 1000, script: 120000 });
const R = {};
try {
  const w = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  if (!w || !w.ok) throw new Error('lab never became ready');
  await g.ev('try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;');
  R.keys = await g.ev(`const S = __LW.serialize(), P = S.presentation, out = {};
    const sub = (o) => o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o).sort() : null;
    out.top = Object.keys(P).sort();
    for (const k of ['ui', 'camera', 'mat', 'obs']) out[k] = sub(P[k]);
    out['layout.look'] = P.layout ? sub(P.layout.look) : null; out['layout.cam'] = P.layout ? sub(P.layout.cam) : null;
    out.bytes = JSON.stringify(S).length; return out;`);
  R.d4 = await g.ev(`const L = __LW, fm = await import('/lab/field.js'), out = {};
    const basisDiff = (a, b) => Math.max(...['dir', 'up', 'right'].flatMap((k) => [0, 1, 2].map((i) => Math.abs(a[k][i] - b[k][i]))));
    L.camera.stop(); L.setCamMode('turntable', true); L.camera.reset(); L.orbitBy(0.4, 0.2);
    let o = JSON.parse(JSON.stringify(L.serialize().presentation.obs));
    const fresh = fm.quatFromYawPitch(o.yaw, o.pitch);
    out.turntableQuatStale = +Math.max(...fresh.map((v, i) => Math.abs(v - o.quat[i]))).toFixed(6);
    out.turntableReadAsFree = +basisDiff(fm.cameraBasis({ ...o, mode: 'turntable' }), fm.cameraBasis({ ...o, mode: 'free' })).toFixed(6);
    L.setCamMode('free'); L.camera.reset();
    const N = 24, a = 0.8; for (let i = 0; i < N; i++) L.orbitBy(a * Math.cos(2 * Math.PI * i / N) * 2 * Math.PI / N, a * Math.sin(2 * Math.PI * i / N) * 2 * Math.PI / N);
    o = JSON.parse(JSON.stringify(L.serialize().presentation.obs));
    const bf = fm.cameraBasis({ ...o, mode: 'free' }), bt = fm.cameraBasis({ ...o, mode: 'turntable' });
    out.freeRoll = +Math.abs(bf.right[2]).toFixed(6);
    out.freeReadAsTurntable = +basisDiff(bf, bt).toFixed(6);
    L.camera.reset(); return out;`);
  R.settings = await g.ev(`const w = (n) => new Promise((r) => setTimeout(r, n)), WS = ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts'];
    const strip = () => { const o = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); for (const k of WS) delete o[k]; return JSON.stringify(o); };
    __LW.saveSettings(); await w(50);
    const before = strip(), theme0 = document.body.dataset.theme, fric0 = __LW.camera.friction;
    const S = JSON.parse(JSON.stringify(__LW.serialize())), P = S.presentation;
    P.ui = Object.assign({}, P.ui, { theme: theme0 === 'light' ? 'dark' : 'light', card: document.body.dataset.card === 'tinted' ? 'refractive' : 'tinted', frost: __LW.frost === 'off' ? 'always' : 'off', disc: !__LW.disconnected, accent: { a: 123, b: 234, vivid: 0.9 } });
    P.camera = Object.assign({}, P.camera, { friction: 0.31, speed: 0.9, dragGain: 3.3, fling: 1.7 });
    P.mat = Object.assign({}, P.mat, { frame: false, axis: false, frameMode: 'dots', axisMode: 'corner', cornerSide: 'left', invert: true, axisInk: 'rgb' });
    P.obs = Object.assign({}, P.obs, { mode: __LW.camMode === 'free' ? 'turntable' : 'free' });
    const ok = __LW.restore(S); await w(600);
    const after = strip();
    const diff = []; const A = JSON.parse(before), B = JSON.parse(after); for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) diff.push(k + ': ' + JSON.stringify(A[k]) + ' → ' + JSON.stringify(B[k]));
    return { ok, bytesBefore: before.length, bytesAfter: after.length, identical: before === after, changed: diff,
      theme0, themeAfter: document.body.dataset.theme, friction0: fric0, frictionAfter: __LW.camera.friction, camModeAfter: __LW.camMode, errs: (window.__e || []).map(String).slice(0, 5) };`);
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R, null, 1));
const tag = process.argv[2] || 'run';
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), `scope-keys.${tag}.json`), JSON.stringify(R, null, 1));
