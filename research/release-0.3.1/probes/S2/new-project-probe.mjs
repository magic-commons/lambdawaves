/* new-project-probe.mjs — 0.3.1 · S2 THE EMPTY PROJECT, measured.  One page, written beside this file as
 * new-project-probe.<tag>.json (tag = argv[2], default 'run'), so a before/after pair is two runs on two trees:
 *   BYTES    serialize() (layout.at and quality.autoScale pinned, the two fields two identical sessions disagree on) at boot,
 *            after WAVE DANCER opens, after a few edits (stage colour, two overlays, A/B stores + a running transition,
 *            notebook text), and after NEW — plus which presentation keys NEW changed, and (S2) whether every PROJECT key
 *            the empty project carries is back to the file's.
 *   TIMING   NEW over the opened demo, seven times: the whole road (projects.fresh() → resolved), the fetch of the file
 *            (window.fetch wrapped: call → body read), and the rest (parse + restore + the notebook + the mark).
 *   SETTINGS lambdawaves.q0.settings minus the WORKSPACE keys and the theme, before and after NEW; getUserMedia calls.
 * It drives the projects API directly (importText + open for the demo), so the same file runs on a tree before S2.
 *   LW_PORT=8735 GD_PORT=5235 node research/release-0.3.1/probes/S2/new-project-probe.mjs <tag> */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
const PORT = process.env.LW_PORT || '8735';
const g = await open(`https://127.0.0.1:${PORT}/lab/?sw=0`, { width: 1600, height: 1000, script: 300000, prefs: { 'privacy.reduceTimerPrecision': false } });
const R = {};
try {
  const w = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  if (!w || !w.ok) throw new Error('lab never became ready');
  R.out = await g.ev(`const P = __LW.layout.projects, wait = (n) => new Promise((r) => setTimeout(r, n));
    window.confirm = () => true;
    const WS = ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts', 'phoneTr', 'phoneRack'];
    const ws = () => { const o = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); for (const k of WS) delete o[k]; return JSON.stringify(o); };
    const canon = (o) => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v);
    const snap = () => { const o = JSON.parse(JSON.stringify(__LW.serialize())); if (o.presentation.layout) o.presentation.layout.at = 0; o.presentation.quality.autoScale = 1; return o; };
    const bytes = (o) => JSON.stringify(o).length;
    let gum = 0; if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => { gum++; return Promise.reject(new Error('probe')); };
    const f0 = window.fetch; let fetchMs = null;
    window.fetch = async (u, o) => { const t = performance.now(), r = await f0(u, o); if (!/new-project/.test(String(u))) return r;
      const body = await r.text(); fetchMs = performance.now() - t; return new Response(body, { status: r.status, headers: r.headers }); };
    const demoText = await (await f0('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' })).text(), demo = P.importText(demoText);
    const out = { build: document.querySelector('.ab-version') ? document.querySelector('.ab-version').textContent : null };
    __LW.pause(); await __LW.settle(); out.boot = bytes(snap());
    P.open(demo); await __LW.settle(); await wait(300); const sDemo = snap(); out.demo = bytes(sDemo);
    const sc = document.querySelector('.stage-colour'); sc.value = '#304050'; sc.dispatchEvent(new Event('input', { bubbles: true }));
    __LW.kepler.setOn(true); __LW.vortex.setOn(true); __LW.loadPreset('1s'); __LW.ab.storeA(); __LW.loadPreset('2p+'); __LW.ab.storeB(); __LW.ab.set(true);
    __LW.layout.notebook.text = 'typed into the demo'; __LW.saveSettings(); await wait(50);
    const sEdit = snap(); out.edited = bytes(sEdit);
    const ws0 = ws(), theme0 = document.body.dataset.theme;
    const t0 = performance.now(); const r = await P.fresh(); const totalMs = performance.now() - t0;
    await __LW.settle(); await wait(400);
    const sNew = snap(); out.afterNew = bytes(sNew); out.freshReturned = r;
    out.newChanged = Object.keys(sEdit.presentation).filter((k) => canon(sEdit.presentation[k]) !== canon(sNew.presentation[k]));
    out.newKept = Object.keys(sEdit.presentation).filter((k) => canon(sEdit.presentation[k]) === canon(sNew.presentation[k]));
    out.experimentModes = sNew.experiment.modes.length;
    const mw0 = sEdit.presentation.modwin || {}, mw1 = sNew.presentation.modwin || {};
    out.modwinChanged = Object.keys({ ...mw0, ...mw1 }).filter((k) => canon(mw0[k]) !== canon(mw1[k]));   /* the window's per-source memory follows the rack; its placement is WORKSPACE */
    out.settings = { bytes: ws0.length, identical: ws() === ws0, theme: [theme0, document.body.dataset.theme] };
    out.notebook = { open: __LW.layout.notebook.isOpen, text: __LW.notebook.text, stored: localStorage.getItem('lambdawaves.q0.notebook') };
    out.abOn = __LW.ab.on; out.current = P.current; out.dirty = P.dirty; out.depth = __LW.history.depth;
    /* S2 only: the empty project's PROJECT keys against the file (mat.steps and domain.half-under-AUTO are the device's) */
    try { const F = JSON.parse(await (await f0('./new-project.lambdawaves.json', { cache: 'no-cache' })).text()), keys = Object.keys(F.data.presentation);
      const norm = (P0) => { const o = {}; for (const k of keys) o[k] = JSON.parse(JSON.stringify(P0[k] === undefined ? null : P0[k])); if (o.mat) delete o.mat.steps; if (o.domain && o.domain.auto) delete o.domain.half; return o; };
      out.file = { bytes: new TextEncoder().encode(JSON.stringify(F, null, 1) + '\\n').length, dataBytes: bytes(F.data), keys: keys.length,
        projectKeysDiffer: keys.filter((k) => canon(norm(sNew.presentation)[k]) !== canon(norm(F.data.presentation)[k])),
        experimentSame: canon({ ...sNew.experiment, t: 0 }) === canon({ ...F.data.experiment, t: 0 }),
        notCarried: Object.keys(sNew.presentation).filter((k) => !keys.includes(k)) };
    } catch (e) { out.file = { none: String(e.message) }; }
    /* TIMING: NEW over the opened demo, seven times */
    const runs = [];
    for (let i = 0; i < 7; i++) {
      P.open(demo); await __LW.settle(); await wait(200); fetchMs = null;
      const t = performance.now(); await P.fresh(); const ms = performance.now() - t;
      runs.push({ totalMs: +ms.toFixed(2), fetchMs: fetchMs === null ? null : +fetchMs.toFixed(2), restMs: fetchMs === null ? +ms.toFixed(2) : +(ms - fetchMs).toFixed(2) });
      await __LW.settle(); await wait(150);
    }
    runs.unshift({ totalMs: +totalMs.toFixed(2), first: true });
    const med = (a) => { const s = a.filter((x) => x !== null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
    const rest = runs.slice(1);
    out.timing = { runs, median: { totalMs: med(rest.map((x) => x.totalMs)), fetchMs: med(rest.map((x) => x.fetchMs)), restMs: med(rest.map((x) => x.restMs)) } };
    out.gum = gum; out.errs = (window.__e || []).map(String).slice(0, 10);
    window.fetch = f0;
    return out;`);
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R, null, 1));
const me = path.basename(new URL(import.meta.url).pathname, '.mjs'), tag = process.argv[2] || 'run';
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), `${me}.${tag}.json`), JSON.stringify(R, null, 1));
