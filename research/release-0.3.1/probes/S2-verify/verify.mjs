/* verify.mjs — S2 verifier (fresh context): tries to break THE EMPTY PROJECT in the browser.
 * Each scene is its own Firefox session (a fresh profile).
 *   LW_PORT=8739 GD_PORT=5239 node research/release-0.3.1/probes/S2-verify/verify.mjs [scene …]
 *   look: LW_URL2=https://127.0.0.1:8741/lab/ (a pre-S2 tree served elsewhere) adds the comparison
 * Writes verify.<scene>.json beside this file.
 * Also here: verify.storedOpenPlaying.preS2.json (the same scene against `git archive 283f109`, served on 8741) and
 * verify.stage{Stale,Trace}.trialfix.json (against a /tmp copy of this tree whose restore() stands the running modulation
 * down first, `if (opt && opt.project && modHost) { modHost.clock.pause(); modHost.registry.restoreAll(); }` — the
 * verifier's trial of the fix it proposes; lab/ in this worktree was never edited). */
import { open } from '../../../../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const PORT = process.env.LW_PORT || '8739';
const URL0 = process.env.LW_URL || `https://127.0.0.1:${PORT}/lab/`;
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/* in-page helpers, prepended to every evaluation */
const H = `const L = __LW, P = __LW.layout.projects, w = (n) => new Promise((r) => setTimeout(r, n));
  const WS = ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts', 'phoneTr', 'phoneRack'];
  const rawS = () => localStorage.getItem('lambdawaves.q0.settings') || '{}';
  const strip = () => { const o = JSON.parse(rawS()); for (const k of WS) delete o[k]; return JSON.stringify(o); };
  const canon = (o) => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v);
  const st = () => document.querySelector('#notebook .pj-status').textContent;
  const file = async () => JSON.parse(await (await fetch('./new-project.lambdawaves.json', { cache: 'no-cache' })).text());
  const arr = () => { const Lc = L.layout.captureLayout(); return canon({ cards: Lc.cards, docked: Lc.docked, rackHidden: Lc.rackHidden, nb: Lc.nb, closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id).sort(), modwin: L.mod.presentation ? L.mod.presentation() : null, modOpen: L.layout.modulation.open }); };
  const leafDiff = (a, b, p = '', out = []) => { if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) leafDiff(a[k], b[k], p ? p + '.' + k : k, out); } else if (JSON.stringify(a) !== JSON.stringify(b)) out.push(p + ': ' + String(JSON.stringify(a)).slice(0, 90) + ' | ' + String(JSON.stringify(b)).slice(0, 90)); return out; };
  const waitSt = async (re, n = 100) => { for (let i = 0; i < n && !re.test(st()); i++) await w(50); return st(); };
  const openDemo = async () => { const c0 = window.confirm; window.confirm = () => true; L.layout.notebook.open('projects'); await w(150); document.querySelector('.pj-demo').click(); const s = await waitSt(/opened demo|failed/); window.confirm = c0; return s; };
  const errs = () => (window.__e || []).map(String).slice(0, 8);`;

async function session(fn, opts = {}) {
  const g = await open(URL0, { width: 1600, height: 1000, script: 240000, ...opts });
  try {
    const r = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
    if (!r || !r.ok) throw new Error('lab never became ready');
    await g.ev('window.__e = window.__e || []; addEventListener("error", (e) => __e.push("ERR " + e.message)); addEventListener("unhandledrejection", (e) => __e.push("REJ " + String(e.reason && e.reason.message || e.reason))); try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;');
    const ev = (body, args) => g.ev(H + body, args);
    return await fn({ ev, g });
  } finally { await g.close(); }
}

const SCENES = {
  /* items 1, 5 (debounce), 6, 7 (demo clean, colour dirties, LFO macro), 11 */
  async afterDemo() {
    return session(async ({ ev }) => {
      const demo = await ev(`const s = await openDemo(); const d0 = P.dirty; await w(1000); const clean1s = !P.dirty;
        const sc = document.querySelector('.stage-colour'); sc.value = '#304050'; sc.dispatchEvent(new Event('input', { bubbles: true })); await w(50);
        return { status: s, dirtyAtOpen: d0, clean1s, colourDirty: P.dirty, current: P.current, modOpen: L.layout.modulation.open, errs: errs() };`);
      /* the busy state: overlays, particles, A/B stores + a RUNNING transition, played 1.5 s (trail, dynamics, particles advance) */
      const busy = await ev(`L.kepler.setOn(true); L.vortex.setOn(true); L.seedParticles(160);
        L.ab.storeA(); L.loadPreset('2p+'); L.ab.storeB(); L.ab.set(true); L.play(); await w(1500);
        return { t: L.clock.t, playing: L.clock.playing, abOn: L.ab.on, transition: !!L.reg.transition, particles: L.particles.points.length, pOn: L.particles.on, kepler: L.kepler.on, vortex: L.vortex.on, pop: L.reg.populated().length, dirty: P.dirty };`);
      const fresh = await ev(`
        const spy = {}; const wrap = (o, m, tag) => { const f = o[m]; o[m] = function (...a) { spy[tag] = (spy[tag] || 0) + 1; return f.apply(this, a); }; return () => { o[m] = f; }; };
        const un = [wrap(L.shadowView, 'clearTrail', 'trail'), wrap(L.dynamics, 'clearHistory', 'dyn'), wrap(L.particles, 'resetClock', 'pclock'), wrap(L.reg, 'restore', 'regRestore'), wrap(L.reg, 'clearTransition', 'clearTransition'), wrap(L.clock, 'pause', 'clockPause'), wrap(L.clock, 'scrub', 'clockScrub')];
        L.layout.notebook.open('notes'); const ta = document.querySelector('.nb-text'); ta.value = 'typed into the demo, twelve words here to count after NEW maybe'; ta.dispatchEvent(new Event('input'));
        const ti = document.querySelector('.nb-title'); ti.value = 'TYPED TITLE'; ti.dispatchEvent(new Event('input'));
        L.saveSettings(); await w(20);
        const before = { ws: strip(), rawS: rawS(), theme: document.body.dataset.theme, choice: L.themeChoice, arr: arr(), abOn: L.ab.on, dirty: P.dirty, nbStored: localStorage.getItem('lambdawaves.q0.notebook'), pjColl: localStorage.getItem('lambdawaves.q0.projects') };
        let gum = 0, asked = 0; const md = navigator.mediaDevices; if (md) md.getUserMedia = () => { gum++; return Promise.reject(new Error('probe')); };
        window.__gum = () => gum;
        const c0 = window.confirm; window.confirm = () => { asked++; return true; };
        const t0 = performance.now(); const pr = P.requestFresh(); const isPromise = !!(pr && typeof pr.then === 'function'); const ok = await pr; const ms = performance.now() - t0;
        window.confirm = c0; for (const u of un) u();
        await L.settle(); await L.settle(); await w(500);
        const F = await file(), S = __LW.serialize();
        const keys = Object.keys(F.data.presentation);
        const liveP = {}; for (const k of keys) liveP[k] = S.presentation[k];
        const rawDiff = leafDiff(JSON.parse(JSON.stringify(liveP)), F.data.presentation);
        const expDiff = leafDiff({ ...S.experiment, t: 0 }, { ...F.data.experiment, t: 0 });
        const extraKeys = Object.keys(S.presentation).filter((k) => !keys.includes(k));
        const M = L.mod.model, mod = S.presentation.modulation;
        const nbEl = document.getElementById('notebook');
        const hist = L.history.entries ? L.history.entries() : null;
        return { ok, isPromise, ms, asked, status: st(), spy,
          rawDiff, expDiff, extraKeys,
          mod: { sources: mod.sources.map((s) => s.id + ':' + s.kind + ':' + (s.shapeMode || '') + ':' + (s.wave || '')), macros: mod.macros.map((m) => [m.id, m.name, m.named, m.sourceId, m.masterDepth]), routes: mod.routes.length, bpm: mod.transport && mod.transport.bpm, v: mod.v, modelMacros: M.macroList().map((m) => [m.name, m.sourceId]) },
          nb: { hidden: nbEl.hidden, isOpen: L.layout.notebook.isOpen, text: L.notebook.text, title: L.notebook.title, subtitle: L.notebook.subtitle, count: (nbEl.querySelector('.nb-count') || {}).textContent, stored: localStorage.getItem('lambdawaves.q0.notebook'), storedTitle: localStorage.getItem('lambdawaves.q0.notebook.title') },
          ab: { on: L.ab.on, A: L.ab.A, B: L.ab.B, transition: !!L.reg.transition, abGet: S.presentation.ab, status: L.ab.status },
          after11: { pop: L.reg.populated().length, t: L.clock.t, playing: L.clock.playing, particlesOn: L.particles.on, particles: L.particles.points.length, kepler: L.kepler.on, vortex: L.vortex.on, preset: L.reg.preset },
          ws: { same: strip() === before.ws, rawSame: rawS() === before.rawS, len: before.ws.length }, theme: [before.theme, document.body.dataset.theme, before.choice, L.themeChoice],
          arrSame: arr() === before.arr, arrBefore: before.arr, arrAfter: arr(),
          current: P.current, depth: L.history.depth, histRows: hist ? hist.map((h) => h && (h.name || h.label || h.kind || JSON.stringify(h).slice(0, 60))) : null, dirty: P.dirty, before: { abOn: before.abOn, dirty: before.dirty }, pjCollSame: localStorage.getItem('lambdawaves.q0.projects') === before.pjColl,
          matSteps: L.mat.steps, qSteps: L.quality.steps, domainHalf: L.domain.half, domainAuto: L.domain.auto, gum, errs: errs() };`);
      const late = await ev(`await w(700); return { stored: localStorage.getItem('lambdawaves.q0.notebook'), storedTitle: localStorage.getItem('lambdawaves.q0.notebook.title'), text: L.notebook.text };`);
      const linked = await ev(`const M = L.mod.model, r0 = L.mod.clock ? L.mod.clock.stats().refusedPlays : null;
        L.layout.modulation.expand(); await w(300);
        const v0 = M.macroList()[0].value, v1s = M.macroList()[1].value; L.play(); let moved = false, ms = 0; const t0 = performance.now();
        while (performance.now() - t0 < 1000) { await w(50); if (L.mod.playing && Math.abs(M.macroList()[0].value - v0) > 1e-6) { moved = true; ms = performance.now() - t0; break; } }
        await w(600);
        const out = { link: L.mod.clockLink, playing: L.mod.playing, fieldPlaying: L.clock.playing, moved, ms, name: M.macroList()[0].name, v0, vNow: M.macroList()[0].value, audioMacro: [v1s, M.macroList()[1].value], refused: r0 === null ? null : L.mod.clock.stats().refusedPlays - r0, gum: __gum(), dirty: P.dirty, armed: L.mod.armed, errs: errs() };
        L.pause(); await w(100); return out;`);
      return { demo, busy, fresh, late, linked };
    });
  },

  /* item 2: NEW then loadPreset('1s+2pz') vs a fresh boot */
  async bootCompare() {
    const a = await session(async ({ ev }) => ev(`const c0 = window.confirm; window.confirm = () => true; const ok = await P.requestFresh(); window.confirm = c0; await L.settle(); await w(300);
      L.loadPreset('1s+2pz'); await L.settle(); await w(300); const S = L.serialize(); return { ok, S, status: st(), view: L.mat.view, rate: L.clock.rate, window: L.clock.window };`));
    const b = await session(async ({ ev }) => ev(`await L.settle(); await w(600); const S = L.serialize(); return { S, view: L.mat.view, rate: L.clock.rate, window: L.clock.window };`));
    const leafDiff = (x, y, p = '', out = []) => { if (x && y && typeof x === 'object' && typeof y === 'object' && Array.isArray(x) === Array.isArray(y)) { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) leafDiff(x[k], y[k], p ? p + '.' + k : k, out); } else if (JSON.stringify(x) !== JSON.stringify(y)) out.push(p + ': NEW+preset ' + String(JSON.stringify(x)).slice(0, 100) + ' | boot ' + String(JSON.stringify(y)).slice(0, 100)); return out; };
    const A = a.S, B = b.S;
    const exp = leafDiff({ ...A.experiment, t: 0 }, { ...B.experiment, t: 0 });
    const pres = {};
    for (const k of new Set([...Object.keys(A.presentation), ...Object.keys(B.presentation)])) { const d = leafDiff(A.presentation[k], B.presentation[k], k); if (d.length) pres[k] = d.length > 12 ? [...d.slice(0, 12), '… ' + d.length + ' leaves'] : d; }
    return { ok: a.ok, status: a.status, scalars: { A: { view: a.view, rate: a.rate, window: a.window }, B: { view: b.view, rate: b.rate, window: b.window } }, exp, pres,
      modA: { sources: A.presentation.modulation.sources.map((s) => s.id + ':' + s.kind), macros: A.presentation.modulation.macros.map((m) => [m.name, m.sourceId]), routes: A.presentation.modulation.routes.length },
      modB: { sources: B.presentation.modulation.sources.map((s) => s.id + ':' + s.kind), macros: B.presentation.modulation.macros.map((m) => [m.name, m.sourceId]), routes: B.presentation.modulation.routes.length } };
  },

  /* item 3: failure roads, over a dirty demo (so a roll-back must bring back its 3 macros / 5 routes / 8 modes) */
  async fail() {
    return session(async ({ ev }) => ev(`await openDemo(); await w(500); L.setStage(0.37); await L.settle();
      const ser = () => { const o = L.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; return JSON.stringify(o); };
      const f0 = window.fetch, good = await file();
      const mk = (fn) => () => { const b = JSON.parse(JSON.stringify(good)); fn(b); return Promise.resolve(new Response(JSON.stringify(b), { status: 200 })); };
      const cases = {
        http404: () => Promise.resolve(new Response('gone', { status: 404 })),
        netReject: () => Promise.reject(new TypeError('NetworkError when attempting to fetch resource.')),
        notJson: () => Promise.resolve(new Response('{not json', { status: 200 })),
        badEnvelope: () => Promise.resolve(new Response(JSON.stringify({ lambdawaves: 'project', version: 99, path: 'NEW', data: good.data }), { status: 200 })),
        paletteStops: mk((b) => { b.data.presentation.palette.stops = [5]; }),
        expModes: mk((b) => { b.data.experiment.modes = 5; }),
        readersLate: mk((b) => { b.data.presentation.readers = { slice: 7, spectrum: { selected: 'x', dials: 3 }, kepler: { shell: 'q' } }; }),
        modwinLate: mk((b) => { b.data.presentation.modwin = { open: true, modes: 5, folder: 7, lane: {}, x: 'a' }; }),
        modulationBad: mk((b) => { b.data.presentation.modulation = { v: b.data.presentation.modulation.v, sources: 5, macros: 'x', routes: 7 }; }),
        abBad: mk((b) => { b.data.presentation.ab = { a: { re: 5 }, b: 'x', omega: 'y', on: true }; }),
      };
      const out = {};
      for (const [name, resp] of Object.entries(cases)) {
        const s0 = ser(), cur0 = P.current, dirty0 = P.dirty, nb0 = L.notebook.text, depth0 = L.history.depth, nbOpen0 = L.layout.notebook.isOpen, ws0 = strip();
        const mod0 = JSON.stringify(L.serialize().presentation.modulation);
        let fetched = 0; window.fetch = (u, o) => { if (/new-project/.test(String(u))) { fetched++; return resp(); } return f0(u, o); };
        let ok; try { ok = await P.fresh(); } catch (e) { ok = 'THREW ' + e.message; }
        window.fetch = f0; await L.settle(); await L.settle(); await w(100);
        const s1 = ser();
        let firstDiff = null; if (s1 !== s0) firstDiff = leafDiff(JSON.parse(s0), JSON.parse(s1)).slice(0, 6);
        out[name] = { ok, fetched, status: st(), same: s1 === s0, firstDiff, modSame: JSON.stringify(L.serialize().presentation.modulation) === mod0, current: [cur0, P.current], dirty: [dirty0, P.dirty], nbSame: L.notebook.text === nb0, nbOpen: [nbOpen0, L.layout.notebook.isOpen], depth: [depth0, L.history.depth], wsSame: strip() === ws0 };
        if (out[name].ok === true) { out[name].landed = true; const c0 = window.confirm; window.confirm = () => true; await openDemo(); window.confirm = c0; await w(500); L.setStage(0.37); await L.settle(); }
      }
      out.errs = errs(); return out;`));
  },

  /* item 4: the prompts */
  async prompts() {
    return session(async ({ ev }) => ev(`const f0 = window.fetch; let fetches = []; window.fetch = (u, o) => { fetches.push(String(u)); return f0(u, o); };
      const ser = () => { const o = L.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; return JSON.stringify(o); };
      const r = {};
      let asked = 0; window.confirm = () => { asked++; return false; };
      r.bootDirty = P.dirty;
      fetches = []; const okNew = await P.requestFresh(); await L.settle(); r.cleanNew = { asked, ok: okNew, status: st(), fetched: fetches.filter((u) => /new-project/.test(u)).length };
      asked = 0; fetches = []; L.layout.notebook.open('projects'); await w(150); document.querySelector('.pj-demo').click(); await waitSt(/opened demo|failed/); r.cleanDemo = { asked, status: st(), fetched: fetches.filter((u) => /demos\\//.test(u)).length, current: P.current };
      await w(1000);
      L.setStage(0.61); await L.settle(); r.dirty = P.dirty;
      let s0 = ser(), pj0 = localStorage.getItem('lambdawaves.q0.projects'); asked = 0; fetches = [];
      const res = P.requestFresh(); r.newCancel = { asked, returned: res, isPromise: !!(res && res.then), fetched: fetches.filter((u) => /new-project/.test(u)).length };
      await w(300); r.newCancel.same = ser() === s0; r.newCancel.pjSame = localStorage.getItem('lambdawaves.q0.projects') === pj0; r.newCancel.status = st(); r.newCancel.current = P.current; r.newCancel.stillDirty = P.dirty;
      P.remove('DEMOS/WAVE DANCER'); s0 = ser(); pj0 = localStorage.getItem('lambdawaves.q0.projects'); asked = 0; fetches = [];
      const wasDirty = P.dirty;
      document.querySelector('.pj-demo').click(); const syncAsked = asked; await w(800);
      r.demoCancel = { wasDirty, syncAsked, asked, fetched: fetches.filter((u) => /demos\\//.test(u)).length, same: ser() === s0, pjSame: localStorage.getItem('lambdawaves.q0.projects') === pj0, stored: Object.keys(JSON.parse(localStorage.getItem('lambdawaves.q0.projects') || '{"items":{}}').items), status: st(), current: P.current };
      asked = 0; window.confirm = () => { asked++; return true; }; fetches = [];
      const okY = await P.requestFresh(); await L.settle(); r.newAccept = { asked, ok: okY, status: st(), current: P.current, dirty: P.dirty };
      asked = 0; window.confirm = () => { asked++; return false; };
      const okN2 = await P.requestFresh(); r.newAfterNew = { asked, ok: okN2, status: st() };
      document.querySelector('.pj-demo').click(); await waitSt(/opened demo|failed/); r.demoAfterNew = { asked, status: st() };
      window.fetch = f0; r.errs = errs(); return r;`));
  },

  /* item 5: the notebook law on stored projects + the word count */
  async nblaw() {
    return session(async ({ ev }) => ev(`const data = JSON.parse(JSON.stringify(L.serialize()));
      const put = (path, text) => P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path, data, notebook: { title: path, text } }));
      const blank = put('probe/blank', ''), ws = put('probe/ws', '  \\n\\t '), hello = put('probe/hello', 'hello'), many = put('probe/many', 'one two three four five');
      const cnt = () => (document.querySelector('#notebook .nb-count') || {}).textContent;
      const r = {};
      L.layout.notebook.close(); r.blank = { ok: P.open(blank), open: L.layout.notebook.isOpen, count: cnt(), text: L.notebook.text };
      r.hello = { ok: P.open(hello), open: L.layout.notebook.isOpen, face: L.layout.notebook.face, mode: L.layout.notebook.mode, count: cnt() };
      r.many = { ok: P.open(many), open: L.layout.notebook.isOpen, count: cnt() };
      L.layout.notebook.open('notes'); r.wsOverOpen = { ok: P.open(ws), open: L.layout.notebook.isOpen, count: cnt(), text: JSON.stringify(L.notebook.text) };
      L.layout.notebook.open('projects'); r.blankOverProjectsFace = { ok: P.open(blank), open: L.layout.notebook.isOpen };
      P.open(hello); const ta = document.querySelector('.nb-text'); ta.value = 'typed then opened'; ta.dispatchEvent(new Event('input'));
      P.open(blank); await w(700); r.debounceOpen = { stored: localStorage.getItem('lambdawaves.q0.notebook'), text: L.notebook.text };
      P.open(hello); ta.value = 'typed then NEW'; ta.dispatchEvent(new Event('input')); const c0 = window.confirm; window.confirm = () => true;
      const t0 = performance.now(); await P.requestFresh(); const ms = performance.now() - t0; window.confirm = c0; await w(700);
      r.debounceNew = { ms, stored: localStorage.getItem('lambdawaves.q0.notebook'), text: L.notebook.text, count: cnt(), open: L.layout.notebook.isOpen, status: st() };
      r.errs = errs(); return r;`));
  },

  /* item 7: the unsaved mark */
  async dirty() {
    return session(async ({ ev }) => ev(`const r = {};
      await openDemo(); await w(1200); r.demoClean1s = !P.dirty;
      L.layout.modulation.expand(); await w(200); L.play(); await w(2500); r.demoPlaying = { dirty: P.dirty, modPlaying: L.mod.playing }; L.pause(); await w(300); r.demoPaused = P.dirty;
      P.markClean(); const g0 = L.quality.res;
      const cand = [...document.querySelectorAll('button, [role=radio], .opt')].filter((b) => /^(64|96|128)³$/.test((b.textContent || '').trim()) && (b.textContent || '').trim() !== String(g0) + '³');
      const seg = cand[0]; if (seg) { seg.click(); await L.settle(); await w(400); } r.grid = { from: g0, to: L.quality.res, clicked: seg ? seg.textContent.trim() : null, candidates: cand.length, dirty: P.dirty, steps: L.mat.steps };
      const c0 = window.confirm; window.confirm = () => true; await P.requestFresh(); window.confirm = c0; await L.settle(); await w(300);
      const M = L.mod.model; r.newClean = !P.dirty; L.layout.modulation.expand(); await w(200); L.play(); await w(1500); r.lfoPlaying = { dirty: P.dirty, v: M.macroList()[0].value, modPlaying: L.mod.playing }; L.pause(); await w(200); r.lfoPaused = P.dirty; P.markClean();
      const mid = L.mod.addMacro ? L.mod.addMacro() : null; await w(50); r.addMacroDirty = P.dirty; P.markClean();
      const um = M.macroList().find((m) => !m.sourceId); if (um) { M.setMacro(um.id, { value: 0.77 }); await w(50); } r.unboundTurned = { found: !!um, dirty: P.dirty }; P.markClean();
      M.setMacro(M.macroList()[0].id, { name: 'LFO2' }); await w(50); r.renamed = P.dirty; P.markClean();
      M.setMacro(M.macroList()[0].id, { masterDepth: 0.5 }); await w(50); r.depthDirty = P.dirty; P.markClean();
      const sc = document.querySelector('.stage-colour'); sc.value = '#123456'; sc.dispatchEvent(new Event('input', { bubbles: true })); r.colour = P.dirty; P.markClean();
      L.setStage(0.5); r.stageMix = P.dirty; P.markClean();
      r.errs = errs(); return r;`));
  },

  /* item 1, the break: a demo route holds the STAGE (material.stage) when NEW lands — does the file's 0.04 win? */
  async stageStale() {
    return session(async ({ ev }) => ev(`const c0 = window.confirm; window.confirm = () => true; const r = {};
      const read = () => ({ mix: L.serialize().presentation.ui.stage.mix, exposure: L.mat.exposure, softness: L.mat.softness, iso: L.mat.iso, fov: L.obs.fov, knob: document.querySelector('.stage-colour') ? null : null });
      const F = await file(); r.file = { mix: F.data.presentation.ui.stage.mix, exposure: F.data.presentation.mat.exposure, softness: F.data.presentation.mat.softness, iso: F.data.presentation.mat.iso, fov: F.data.presentation.obs.fov };
      await openDemo(); await w(400); r.demoOpen = read();
      await P.requestFresh(); await L.settle(); await w(200); r.newNoPlay = read();
      await openDemo(); await w(400); L.play(); await w(1500); r.demoPlaying = read(); L.pause(); await w(300); r.demoPaused = read();
      await P.requestFresh(); await L.settle(); await w(200); r.newAfterPlayPause = read(); r.newAfterPlayPauseDirty = P.dirty;
      await openDemo(); await w(400); L.play(); await w(1500); r.demoPlaying2 = read();
      await P.requestFresh(); await L.settle(); await w(200); r.newWhilePlaying = read(); r.newWhilePlayingDirty = P.dirty;
      /* the modulation window shut: is the stage held? */
      await openDemo(); await w(400); L.layout.modulation.collapse(); await w(200); L.play(); await w(1500); r.demoPlayingShut = read(); L.pause();
      await P.requestFresh(); await L.settle(); await w(200); r.newAfterShutPlay = read();
      /* the same road for a STORED project (not NEW): open the demo, play, open a stored project whose stage mix is 0.2 */
      const S = JSON.parse(JSON.stringify(F.data)); S.presentation.ui.stage.mix = 0.2; const path = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/stage02', data: S, notebook: { title: 's', text: '' } }));
      await openDemo(); await w(400); L.layout.modulation.expand(); await w(200); L.play(); await w(1500); L.pause(); await w(200);
      r.storedOpen = { ok: P.open(path), ...read(), wanted: 0.2 };
      window.confirm = c0; r.errs = errs(); return r;`));
  },

  /* root cause of stageStale: trace the registry's material.stage record through a NEW that lands while the demo plays */
  async stageTrace() {
    return session(async ({ ev }) => ev(`const c0 = window.confirm; window.confirm = () => true;
      await openDemo(); await w(400); L.play(); await w(1500);
      const R = L.mod.registry, log = [], mix = () => L.serialize().presentation.ui.stage.mix;
      const s0 = R.state('material.stage'); log.push(['before', JSON.stringify(s0), mix(), 'modPlaying', L.mod.playing]);
      const wrap = (m) => { const f = R[m]; R[m] = function (...a) { const out = f.apply(this, a); if (m === 'restoreAll' || String(a[0]) === 'material.stage') log.push([m, JSON.stringify(a).slice(0, 60), JSON.stringify(R.state('material.stage')).slice(0, 160)]); return out; }; };
      for (const m of ['setBase', 'write', 'restoreBase', 'restoreAll', 'applyModulated', 'applyModulatedNorm']) if (typeof R[m] === 'function') wrap(m);
      await P.requestFresh(); log.push(['after NEW (sync)', mix(), JSON.stringify(R.state('material.stage')).slice(0, 160)]);
      await L.settle(); await w(300); log.push(['after settle', mix(), JSON.stringify(R.state('material.stage')).slice(0, 160)]);
      /* storing a project while playing, then opening another stored project while playing: is this road old? */
      const F = await file(); const S = JSON.parse(JSON.stringify(F.data)); S.presentation.ui.stage.mix = 0.2; const path = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/stage02', data: S, notebook: { title: 's', text: '' } }));
      await openDemo(); await w(400); L.layout.modulation.expand(); await w(200); L.play(); await w(1500);
      const ok = P.open(path); await L.settle(); await w(300); log.push(['stored open while playing', ok, mix(), 'wanted 0.2']);
      window.confirm = c0; return { log, errs: errs() };`));
  },

  /* is the stale stage old?  A STORED open (no new-project file needed) over a playing demo, on any tree */
  async storedOpenPlaying() {
    return session(async ({ ev }) => ev(`const c0 = window.confirm; window.confirm = () => true;
      const S = JSON.parse(JSON.stringify(L.serialize())); S.presentation.ui = { stage: { mix: 0.2, custom: [0.12, 0.14, 0.18], follow: true } };
      const path = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/stage02', data: S, notebook: { title: 's', text: '' } }));
      await openDemo(); await w(400); L.layout.modulation.expand(); await w(200); L.play(); await w(1500);
      const ok = P.open(path); await L.settle(); await w(300); const mix = L.serialize().presentation.ui.stage.mix;
      window.confirm = c0; return { ok, mix, wanted: 0.2, errs: errs() };`));
  },

  /* a double NEW (two clicks before the first fetch lands), and NEW racing a demo open */
  async race() {
    return session(async ({ ev }) => ev(`const c0 = window.confirm; let asked = 0; window.confirm = () => { asked++; return true; };
      const F = await file(), keys = Object.keys(F.data.presentation);
      const same = () => { const S = L.serialize(); const live = {}; for (const k of keys) live[k] = S.presentation[k]; return leafDiff(JSON.parse(JSON.stringify(live)), F.data.presentation).filter((d) => !/^(mat\\.steps|domain\\.half)/.test(d)); };
      await openDemo(); await w(500); L.setStage(0.3);
      asked = 0; const a = P.requestFresh(), b = P.requestFresh(); const r1 = [await a, await b]; await L.settle(); await w(300);
      const dbl = { results: r1, asked, status: st(), diff: same(), current: P.current, dirty: P.dirty, depth: L.history.depth };
      /* demo click then NEW at once: whichever lands last wins, no error, and the state is one of the two */
      asked = 0; L.layout.notebook.open('projects'); await w(100); document.querySelector('.pj-demo').click(); const n = P.requestFresh(); await n; await w(1500); await L.settle();
      const mix = { asked, status: st(), current: P.current, modes: L.serialize().experiment.modes.length, dirty: P.dirty, diffVsFile: same().length };
      window.confirm = c0; return { dbl, mix, errs: errs() };`));
  },

  /* item 7 (tablet) */
  async tablet() {
    return session(async ({ ev }) => ev(`const c0 = window.confirm; window.confirm = () => true;
      const S = JSON.parse(JSON.stringify(L.serialize())); S.presentation.quality = { res: 128, steps: 240, scale: 1, auto: true, autoScale: 1, minScale: 0.35 }; S.presentation.mat.steps = 240;
      const path = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/grid128', data: S, notebook: { title: 'grid128', text: 'x' } }));
      const opened = P.open(path); await L.settle(); await w(1200);
      const r = { tablet: L.layout.tablet && L.layout.tablet.on, opened, q: [L.quality.res, L.quality.steps], steps: L.mat.steps, dirty: P.dirty };
      await openDemo(); await L.settle(); await w(1200); r.demo = { q: [L.quality.res, L.quality.steps], steps: L.mat.steps, dirty: P.dirty };
      r.fresh = await P.requestFresh(); await L.settle(); await w(1000); r.afterNew = { q: [L.quality.res, L.quality.steps], steps: L.mat.steps, dirty: P.dirty };
      window.confirm = c0; r.errs = errs(); return r;`), { prefs: { 'general.useragent.override': IPAD } });
  },

  /* item 10: the demo's picture — this tree vs another server (LW_URL2) */
  async look() {
    const one = async (url) => { const g = await open(url, { width: 1600, height: 1000, script: 240000 }); try {
      await g.waitFor('window.__LW && __LW.ready', 3000, 20);
      await g.ev('try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} return 1;');
      return await g.ev(H + `await openDemo(); L.pause(); await L.settle(); await w(1500); await L.settle(); await L.settle();
        const px = await L.readPixels(); let h = 0, n = 0; const d = px && (px.data || px.pixels || px); if (d && d.length) { n = d.length; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) >>> 0; }
        const S = L.serialize(); const m = { ...L.mat }; const pres = { ...S.presentation, layout: null, modwin: null };
        const fd = await L.fieldDigest(); let sig = null, last = null; for (let i = 0; i < 40; i++) { const p = window.__M4 ? await __M4.presentSig('main', 4).catch(() => null) : null; const hh = p ? p.hash : null; if (hh != null && hh === last) { sig = hh; break; } last = hh; await w(150); } return { status: st(), fieldDigest: fd, presentSig: sig, pxStats: px, pxHash: h, pxLen: n, t: L.clock.t, chrome: ['frame', 'axis', 'invert', 'axisInk', 'cornerSide'].map((k) => m[k]), q: [L.quality.res, L.quality.steps], steps: L.mat.steps, matCanon: canon(S.presentation.mat), presCanon: canon(pres) };`);
    } finally { await g.close(); } };
    const a = await one(URL0), b = process.env.LW_URL2 ? await one(process.env.LW_URL2) : null;
    const cmp = b ? { pxStats: JSON.stringify(a.pxStats) === JSON.stringify(b.pxStats), fieldDigest: JSON.stringify(a.fieldDigest) === JSON.stringify(b.fieldDigest), pxHash: a.pxHash === b.pxHash, mat: a.matCanon === b.matCanon, pres: a.presCanon === b.presCanon } : null;
    return { cmp, thisTree: { ...a, presCanon: a.presCanon.length }, preS2: b ? { ...b, presCanon: b.presCanon.length } : null, matA: a.matCanon, matB: b && b.matCanon };
  },
};

const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
for (const name of want) {
  const t0 = Date.now(); let out;
  try { out = await SCENES[name](); } catch (e) { out = { ERROR: String(e && e.stack || e) }; }
  fs.writeFileSync(path.join(here, 'verify.' + name + '.json'), JSON.stringify(out, null, 1) + '\n');
  console.log('== ' + name + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)'); console.log(JSON.stringify(out, null, 1).slice(0, 8000));
}
