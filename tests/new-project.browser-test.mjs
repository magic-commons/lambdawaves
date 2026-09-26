// 0.3.1 · S2 THE EMPTY PROJECT, in the real page (research/release-0.3.1/PLAN.md §3, docs/STATE-SCOPES.md).
// NEW opens lab/new-project.lambdawaves.json through the stored-open road: every PROJECT key comes back to the file's,
// no PREFERENCE and no WORKSPACE key moves, the notebook opens only with text, linked time runs from the first play, no
// microphone is asked for, and a NEW that cannot land puts the instrument back as it was.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
let g = await open(LAB, { width: 1500, height: 1000, script: 30000 }), g2 = null;
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  /* the page's helpers: the file as NEW fetches it, a key-sorted JSON (restore may land a key in another slot of an object),
     the PROJECT keys of serialize() as the file carries them (the two values a device computes — mat.steps from its quality,
     domain.half under AUTO — normalised away, as projectKey() does for the second), the settings minus the WORKSPACE keys */
  await g.ev(`window.__file = async () => JSON.parse(await (await fetch('./new-project.lambdawaves.json', { cache: 'no-cache' })).text());
    window.__canon = (o) => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v);
    window.__proj = (S, keys) => { const P = {}; for (const k of keys) P[k] = JSON.parse(JSON.stringify(S.presentation[k] === undefined ? null : S.presentation[k]));
      if (P.mat) delete P.mat.steps; if (P.domain && P.domain.auto) delete P.domain.half; return P; };
    window.__ws = () => { const o = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); for (const k of ['closed', 'nbW', 'nbH', 'abW', 'abH', 'modwin', 'layouts', 'phoneTr', 'phoneRack']) delete o[k]; return JSON.stringify(o); };
    window.__arr = () => { const L = __LW.layout.captureLayout(); return JSON.stringify({ cards: L.cards, docked: L.docked, rackHidden: L.rackHidden, closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id).sort() }); };
    window.__st = () => document.querySelector('#notebook .pj-status').textContent;
    window.__w = (n) => new Promise((r) => setTimeout(r, n));
    return 1;`);

  /* ── 1 · THE TABLE IS THE SHIPPED DEFAULT.  tools/new-project.mjs tables what it cannot import; a fresh boot's own
         serialize() must equal the file on every key a boot does not choose for itself (the modulation rack a boot builds
         is LFO + ENV, and the greeting's register is the boot's, so those two are left out here and judged after NEW). ── */
  const drift = await g.ev(`const F = await __file(), keys = Object.keys(F.data.presentation).filter((k) => k !== 'modulation');
    const S = __LW.serialize(), boot = __proj(S, keys), file = __proj({ presentation: F.data.presentation }, keys);
    if (boot.mat && !('finish' in boot.mat)) boot.mat.finish = 'lit';     /* restore() writes 'lit' where a state has no finish — the same look */
    const diff = keys.filter((k) => __canon(boot[k]) !== __canon(file[k]));
    return { diff, keys: keys.length, carried: Object.keys(F.data.presentation), errs: __e.slice() };`);
  assert.deepEqual(drift.diff, [], 'the file differs from a fresh boot on ' + drift.diff.join(', '));
  for (const k of ['quality', 'layout', 'modwin', 'notebook']) assert.equal(drift.carried.includes(k), false, 'the file carries ' + k);
  assert.deepEqual(drift.errs, []);
  console.log('PASS the empty project is the shipped default: a fresh boot serialises to the file on all ' + drift.keys + ' non-modulation presentation keys (no quality, layout, modwin or notebook size in it)');

  /* ── 2 · THE DEMO BUTTON ASKS before it discards unsaved changes (the stored open's question), then opens — and an untouched
         open stays CLEAN: WAVE DANCER's mat.steps 240 becomes this device's quality.steps a frame later, which is not an edit
         (projectKey() drops quality and mat.steps); the stage colour is the work and dirties it ── */
  const demo = await g.ev(`const P = __LW.layout.projects; let asked = 0; const c0 = window.confirm;
    __LW.layout.notebook.open('projects'); await __w(150);
    __LW.setStage(0.61); const dirty = P.dirty;
    window.confirm = () => { asked++; return false; }; document.querySelector('.pj-demo').click(); await __w(900);
    const refused = { asked, current: P.current, list: P.list().length, status: __st() };
    window.confirm = () => { asked++; return true; }; document.querySelector('.pj-demo').click();
    for (let i = 0; i < 60 && !/opened demo/.test(__st()); i++) await __w(50);
    window.confirm = c0;
    const steps0 = JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items[P.current].data.presentation.mat.steps; await __w(1000); const clean = { dirty: P.dirty, steps: [steps0, __LW.mat.steps] };
    const sc = document.querySelector('.stage-colour'); sc.value = '#405060'; sc.dispatchEvent(new Event('input', { bubbles: true })); clean.colourDirty = P.dirty;
    return { dirty, refused, asked, current: P.current, status: __st(), modes: __LW.serialize().experiment.modes.length, nbOpen: __LW.layout.notebook.isOpen, clean, errs: __e.slice() };`);
  assert.equal(demo.dirty, true); assert.deepEqual(demo.refused, { asked: 1, current: null, list: 0, status: demo.refused.status });
  assert.doesNotMatch(demo.refused.status, /opened demo/);
  assert.equal(demo.asked, 2); assert.equal(demo.current, 'DEMOS/WAVE DANCER'); assert.match(demo.status, /opened demo DEMOS\/WAVE DANCER/);
  assert.equal(demo.modes, 8); assert.equal(demo.nbOpen, true, 'WAVE DANCER has notebook text: it opens onto its notebook'); assert.deepEqual(demo.errs, []);
  assert.equal(demo.clean.dirty, false, 'the untouched demo reads as edited 1 s after its open (steps ' + demo.clean.steps.join(' → ') + ')');
  assert.equal(demo.clean.colourDirty, true, 'a stage colour change did not dirty the project');
  console.log(`PASS the demo button asks before discarding unsaved changes (Cancel fetched and stored nothing), then opens WAVE DANCER onto its notebook; untouched it is still clean 1 s later (mat.steps ${demo.clean.steps.join(' in the file → ')} on this device), and a stage colour change dirties it`);

  /* ── 3 · NEW over a worked demo: the PROJECT keys are the file's, nothing else moved ── */
  const fresh = await g.ev(`const P = __LW.layout.projects, M = __LW.mod.model;
    /* the edits: a stage colour, an overlay, the A/B stores and a RUNNING transition, notebook text still in its debounce */
    const sc = document.querySelector('.stage-colour'); sc.value = '#304050'; sc.dispatchEvent(new Event('input', { bubbles: true }));
    __LW.kepler.setOn(true); __LW.vortex.setOn(true);
    __LW.loadPreset('1s'); __LW.ab.storeA(); __LW.loadPreset('2p+'); __LW.ab.storeB(); __LW.ab.set(true);
    __LW.layout.notebook.open('notes'); const ta = document.querySelector('.nb-text'); ta.value = 'typed into the demo'; ta.dispatchEvent(new Event('input'));
    __LW.saveSettings(); await __w(50);
    const before = { ws: __ws(), theme: document.body.dataset.theme, arr: __arr(), abOn: __LW.ab.on, dirty: P.dirty };
    let gum = 0, asked = 0; const md = navigator.mediaDevices, gum0 = md && md.getUserMedia, c0 = window.confirm;
    if (md) md.getUserMedia = () => { gum++; return Promise.reject(new Error('probe: no microphone')); };
    window.confirm = () => false; const cancelled = P.requestFresh(), cancel = { promise: !!cancelled && typeof cancelled.then === 'function', value: await cancelled, dirty: P.dirty, abOn: __LW.ab.on };   /* Cancel is a Promise too, and changes nothing */
    window.confirm = () => { asked++; return true; };
    const t0 = performance.now(); const ok = await P.requestFresh(); const ms = performance.now() - t0;
    window.confirm = c0;
    await __LW.settle(); await __LW.settle(); await __w(450);                 /* past the notebook's 300 ms debounce */
    const F = await __file(), keys = Object.keys(F.data.presentation), S = __LW.serialize();
    const live = __proj(S, keys), file = __proj({ presentation: F.data.presentation }, keys);
    const exL = { ...S.experiment, t: 0 }, exF = { ...F.data.experiment, t: 0 };
    const mod = S.presentation.modulation;
    const out = { ok, ms, asked, gum, cancel, status: __st(),
      diff: keys.filter((k) => __canon(live[k]) !== __canon(file[k])), expSame: __canon(exL) === __canon(exF),
      sources: mod.sources.map((s) => s.id + ':' + s.kind), macros: mod.macros.map((m) => [m.name, m.sourceId]), routes: mod.routes.length,
      nb: { open: __LW.layout.notebook.isOpen, face: __LW.layout.notebook.face, text: __LW.notebook.text, title: __LW.notebook.title, subtitle: __LW.notebook.subtitle, stored: localStorage.getItem('lambdawaves.q0.notebook'),
        empty: __LW.layout.notebook.mode === 'view' ? /empty/.test(document.querySelector('.nb-view').textContent) && !/going on/.test(document.querySelector('.nb-view').textContent) : !!document.querySelector('.nb-text').placeholder },
      ab: { on: __LW.ab.on, A: __LW.ab.A, B: __LW.ab.B, transition: !!__LW.reg.transition },
      wsSame: __ws() === before.ws, themeSame: document.body.dataset.theme === before.theme, arrSame: __arr() === before.arr,
      current: P.current, depth: __LW.history.depth, dirty: P.dirty, before, errs: __e.slice() };
    window.__gum = () => gum; window.__gumRestore = () => { if (md) md.getUserMedia = gum0; };
    return out;`);
  assert.equal(fresh.ok, true); assert.equal(fresh.asked, 1, 'NEW over unsaved changes asks once'); assert.equal(fresh.status, 'new');
  assert.equal(fresh.before.dirty, true); assert.equal(fresh.before.abOn, true);
  assert.deepEqual(fresh.cancel, { promise: true, value: false, dirty: true, abOn: true }, 'requestFresh on Cancel: a Promise of false, nothing changed');
  assert.deepEqual(fresh.diff, [], 'PROJECT keys differ from the file: ' + fresh.diff.join(', ')); assert.equal(fresh.expSame, true);
  assert.deepEqual(fresh.sources, ['s1:lfo', 's2:audio']); assert.deepEqual(fresh.macros, [['LFO', 's1'], ['AUDIO', 's2:level']]); assert.equal(fresh.routes, 0);
  assert.deepEqual(fresh.nb, { open: true, face: 'notes', text: '', title: 'NOTEBOOK', subtitle: '', stored: '', empty: true }, 'NEW over an open notebook: it stays open on NOTES, emptied, the empty placeholder shown');
  assert.deepEqual(fresh.ab, { on: false, A: null, B: null, transition: false });
  assert.equal(fresh.wsSame, true, 'a PREFERENCE key moved'); assert.equal(fresh.themeSame, true); assert.equal(fresh.arrSame, true, 'the window arrangement moved');
  assert.equal(fresh.current, null); assert.equal(fresh.depth, 0); assert.equal(fresh.dirty, false); assert.equal(fresh.gum, 0); assert.deepEqual(fresh.errs, []);
  console.log(`PASS NEW (${fresh.ms.toFixed(1)} ms, fetch + restore): every PROJECT key is the file's, modulation = LFO + AUDIO bound (s1, s2:level), no routes; the open notebook stays open on NOTES, emptied, its empty placeholder shown (the debounced keystrokes did not flush back); A/B off, stores empty; settings minus WORKSPACE, theme and window arrangement byte-identical; nothing current, history depth 0, clean; no getUserMedia`);

  /* ── 4 · LINKED TIME ON THE GET-GO: show the modulation window, play the field → the transport plays and macro LFO moves ── */
  const linked = await g.ev(`const M = __LW.mod.model, refused0 = __LW.mod.clock.stats().refusedPlays;
    __LW.layout.modulation.expand(); await __w(300);
    const v0 = M.macroList()[0].value; __LW.play(); let moved = false, playing = false, ms = 0; const t0 = performance.now();
    while (performance.now() - t0 < 1000) { await __w(50); playing = __LW.mod.playing; if (playing && Math.abs(M.macroList()[0].value - v0) > 1e-6) { moved = true; ms = performance.now() - t0; break; } }
    const out = { link: __LW.mod.clockLink, playing, moved, ms, name: M.macroList()[0].name, refused: __LW.mod.clock.stats().refusedPlays - refused0, gum: __gum(), dirty: __LW.layout.projects.dirty, errs: __e.slice() };
    __LW.pause(); await __w(100); __LW.layout.modulation.collapse(); __gumRestore();
    return out;`);
  assert.equal(linked.link, true); assert.equal(linked.name, 'LFO'); assert.equal(linked.playing, true, 'the mod transport did not follow the field');
  assert.equal(linked.moved, true, 'macro LFO did not move within 1 s'); assert.equal(linked.refused, 0, 'a nothing-to-run refusal'); assert.equal(linked.gum, 0);
  assert.equal(linked.dirty, false, 'the LFO moving its own macro made the empty project dirty'); assert.deepEqual(linked.errs, []);
  console.log(`PASS linked time on the get-go: with the modulation window shown, play moved the mod transport and macro LFO in ${linked.ms.toFixed(0)} ms, no refusal, no microphone, still clean`);

  /* ── 5 · THE NOTEBOOK LAW (the coordinator's ruling): an open NEVER CLOSES the notebook, it only declines to OPEN one — a
         project with text opens onto its NOTES; a blank one (NEW's included) leaves the pane's visibility and face as they are ── */
  const law = await g.ev(`const P = __LW.layout.projects, N = __LW.layout.notebook, c0 = window.confirm; window.confirm = () => true;
    const data = JSON.parse(JSON.stringify(__LW.serialize()));
    const put = (path, text) => P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path, data, notebook: { title: path, text } }));
    const blank = put('probe/blank', '  \\n\\t '), hello = put('probe/hello', 'hello');
    const click = (name) => { const it = [...document.querySelectorAll('#notebook .pj-item .pj-name')].find((e) => e.textContent.split('  ·')[0] === name); if (it) it.click(); return !!it; };
    const r = {};
    N.close(); r.a = { ok: await P.requestFresh(), open: N.isOpen };                                   /* (a) NEW with the notebook closed */
    N.close(); r.closedBlank = { ok: P.open(blank), open: N.isOpen };                                   /* a blank open over a closed notebook */
    N.open('projects'); await __w(100);
    r.c = { clicked: click(blank), open: N.isOpen, face: N.face, current: P.current };                /* (c) a blank project from the PROJECTS list */
    r.d = { clicked: click(hello), open: N.isOpen, face: N.face, text: __LW.notebook.text, current: P.current };   /* (d) text opens onto NOTES */
    window.confirm = c0; r.errs = __e.slice(); return r;`);
  assert.deepEqual(law, { a: { ok: true, open: false }, closedBlank: { ok: true, open: false },
    c: { clicked: true, open: true, face: 'projects', current: 'probe/blank' },
    d: { clicked: true, open: true, face: 'notes', text: 'hello', current: 'probe/hello' }, errs: [] });
  console.log('PASS the notebook law: an open never closes the notebook — NEW and a blank project (whitespace only) leave a closed notebook closed and a PROJECTS pane on PROJECTS; a project with text opens onto its NOTES');

  /* ── 6 · A NEW THAT CANNOT LAND CHANGES NOTHING: the file unreachable, and a file whose restore throws half-way (M5b) ── */
  const fail = await g.ev(`const P = __LW.layout.projects, f0 = window.fetch;
    const ser = () => { const o = __LW.serialize(); if (o.presentation.layout) o.presentation.layout.at = 0; return JSON.stringify(o); };
    __LW.setStage(0.37); await __LW.settle();
    const s0 = ser(), cur0 = P.current, dirty0 = P.dirty, nb0 = __LW.notebook.text, depth0 = __LW.history.depth;
    window.fetch = (u, o) => /new-project/.test(String(u)) ? Promise.resolve(new Response('gone', { status: 404 })) : f0(u, o);
    const a = { ok: await P.fresh(), status: __st() }; await __LW.settle();
    Object.assign(a, { same: ser() === s0, current: P.current, dirty: P.dirty, nb: __LW.notebook.text === nb0 });
    const bad = await (await f0('./new-project.lambdawaves.json', { cache: 'no-cache' })).json(); bad.data.presentation.palette.stops = [5];   /* failrestore2.mjs's breaker */
    window.fetch = (u, o) => /new-project/.test(String(u)) ? Promise.resolve(new Response(JSON.stringify(bad), { status: 200 })) : f0(u, o);
    const b = { ok: await P.fresh(), status: __st() }; await __LW.settle(); await __LW.settle();
    Object.assign(b, { same: ser() === s0, current: P.current, dirty: P.dirty, nb: __LW.notebook.text === nb0 });
    window.fetch = f0;
    return { dirty0, cur0, a, b, errs: __e.slice() };`);
  assert.equal(fail.dirty0, true);
  assert.equal(fail.a.ok, false); assert.match(fail.a.status, /^new project failed — HTTP 404; nothing was changed$/);
  assert.deepEqual([fail.a.same, fail.a.current, fail.a.dirty, fail.a.nb], [true, fail.cur0, true, true]);
  assert.equal(fail.b.ok, false); assert.equal(fail.b.status, 'new project failed — the previous state is back');
  assert.deepEqual([fail.b.same, fail.b.current, fail.b.dirty, fail.b.nb], [true, fail.cur0, true, true]);
  assert.deepEqual(fail.errs, []);
  console.log('PASS a NEW that cannot land changes nothing: an unreachable file leaves serialize() byte-identical and says so; a file whose restore throws half-way is rolled back byte-identical (M5b), current and dirty as they were');

  /* ── 7 · A HELD STAGE DOES NOT OUTLIVE ITS PROJECT: WAVE DANCER's "Stage" macro routes material.stage, so while it plays the
         stage is the modulation's; a project open puts the running modulation down FIRST (as a running A/B transition is), so
         the file's stage mix lands — NEW while playing gives the empty project's 0.04, a stored project with mix 0.2 opened over
         the playing demo gives 0.2, and so does NEW after a play with the modulation window folded and then a pause ── */
  const held = await g.ev(`const P = __LW.layout.projects, R = __LW.mod.registry, c0 = window.confirm; window.confirm = () => true;
    const mix = () => __LW.serialize().presentation.ui.stage.mix;
    const playDemo = async () => { P.open('DEMOS/WAVE DANCER'); await __LW.settle(); __LW.play(); await __w(1200); return { held: R.isModulated('material.stage'), playing: __LW.mod.playing, mix: mix() }; };
    const out = {};
    await P.requestFresh(); await __LW.settle(); __LW.setStage(0.2); out.saved = P.save('probe/stage02'); out.savedMix = mix();
    out.a = await playDemo(); out.a.ok = await P.requestFresh(); await __LW.settle(); await __w(300); out.a.after = mix();
    out.b = await playDemo(); out.b.ok = P.requestOpen('probe/stage02'); await __LW.settle(); await __w(300); out.b.after = mix();
    /* …and the same 0.2 as a file without the modulationBases table (serialize()'s own form, another build's save): the road
       that failed before the fix — restoreModulation then takes the stage off the knob, and the held route had written it */
    const d2 = JSON.parse(JSON.stringify(__LW.serialize())); d2.presentation.ui.stage.mix = 0.2; delete d2.presentation.modulationBases;
    const imp = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/stage02-nobases', data: d2, notebook: { title: 'x', text: '' } }));
    out.b2 = await playDemo(); out.b2.ok = P.requestOpen(imp); await __LW.settle(); await __w(300); out.b2.after = mix();
    P.open('DEMOS/WAVE DANCER'); await __LW.settle(); __LW.layout.modulation.expand(); await __w(300); __LW.layout.modulation.collapse();
    __LW.play(); await __w(1200); out.c = { held: R.isModulated('material.stage'), folded: !__LW.mod.expanded }; __LW.pause(); await __w(300);
    out.c.ok = await P.requestFresh(); await __LW.settle(); await __w(300); out.c.after = mix();
    __LW.pause(); window.confirm = c0; out.errs = __e.slice(); return out;`);
  assert.equal(held.saved, true); assert.equal(held.savedMix, 0.2);
  for (const k of ['a', 'b', 'b2']) { assert.equal(held[k].held, true, k + ': the demo was not holding the stage'); assert.equal(held[k].playing, true, k + ': the modulation was not playing'); }
  assert.equal(held.a.ok, true); assert.equal(held.a.after, 0.04, 'NEW over the playing demo left the stage at ' + held.a.after);
  assert.equal(held.b.ok, true); assert.equal(held.b.after, 0.2, 'a stored project opened over the playing demo left the stage at ' + held.b.after);
  assert.equal(held.b2.ok, true); assert.equal(held.b2.after, 0.2, 'a stored project without a bases table opened over the playing demo left the stage at ' + held.b2.after);
  assert.equal(held.c.folded, true); assert.equal(held.c.ok, true); assert.equal(held.c.after, 0.04, 'NEW after a folded play and a pause left the stage at ' + held.c.after);
  assert.deepEqual(held.errs, []);
  console.log(`PASS a held stage does not outlive its project: with WAVE DANCER's Stage route playing (stage ${held.a.mix.toFixed(4)}), NEW lands 0.04, a stored 0.2 project lands 0.2 (saved with its bases table, and without one), and NEW after a folded play and a pause lands 0.04`);
  await g.close(); g = null;

  /* ── 8 · ON A TABLET (an iPad UA: grid ceiling 96³) a saved 128³ × 240 project is clamped as it opens, and mat.steps follows the
         device a frame later — neither is an edit, so the untouched open is clean after 1 s; a stage colour still dirties it; NEW
         there is clean too, and marches at the device's steps (the empty project carries no quality and no mat.steps) ── */
  g2 = await open(LAB, { width: 1500, height: 1000, script: 30000, prefs: { 'general.useragent.override': IPAD } });
  assert.equal((await g2.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  const tab = await g2.ev(`const P = __LW.layout.projects, w = (n) => new Promise((r) => setTimeout(r, n)), c0 = window.confirm; window.confirm = () => true;
    const S = JSON.parse(JSON.stringify(__LW.serialize())); S.presentation.quality = { res: 128, steps: 240, scale: 1, auto: true, autoScale: 1, minScale: 0.35 }; S.presentation.mat.steps = 240;
    const path = P.importText(JSON.stringify({ lambdawaves: 'project', version: 1, path: 'probe/grid128', data: S, notebook: { title: 'grid128', text: '' } }));
    const opened = P.open(path), q = { ...__LW.quality }; await __LW.settle(); await w(1000);
    const out = { tablet: __LW.layout.tablet.on, opened, clamped: [q.res, q.steps], steps: __LW.mat.steps, dirty: P.dirty };
    const sc = document.querySelector('.stage-colour'); sc.value = '#506070'; sc.dispatchEvent(new Event('input', { bubbles: true })); out.colourDirty = P.dirty;
    out.fresh = await P.requestFresh(); await __LW.settle(); await w(1000); out.freshDirty = P.dirty; out.freshSteps = __LW.mat.steps; out.freshQuality = [__LW.quality.res, __LW.quality.steps];
    window.confirm = c0; out.errs = __e.slice(); return out;`);
  assert.equal(tab.tablet, true, 'the iPad UA did not make a tablet'); assert.equal(tab.opened, true);
  assert.deepEqual(tab.clamped, [96, 160], 'the tablet did not clamp the 128³ project'); assert.equal(tab.steps, 160);
  assert.equal(tab.dirty, false, 'the clamped project reads as edited 1 s after its open'); assert.equal(tab.colourDirty, true);
  assert.equal(tab.fresh, true); assert.equal(tab.freshDirty, false); assert.equal(tab.freshSteps, tab.freshQuality[1]); assert.deepEqual(tab.errs, []);
  console.log(`PASS on a tablet a saved 128³ × 240 project opens clamped to ${tab.clamped.join(' × ')} and is still clean 1 s later; a stage colour dirties it; NEW there is clean and marches at the device's ${tab.freshSteps} steps`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  try { await Promise.race([Promise.all([g && g.close(), g2 && g2.close()]), new Promise((_, reject) => setTimeout(() => reject(new Error('driver cleanup exceeded 10 seconds')), 10000))]); }
  catch (error) { failed = true; console.error('INFRASTRUCTURE:', error.message); }
  process.exit(failed ? 1 : 0);
}
