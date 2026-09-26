// WAVE 133 · THE OFFER — a new build is seen, taken quietly when nothing is at stake, and explained when something is.
// The page runs in automation mode (no real worker: main.js' bypass), so LW.sw is driven directly and its reload() seam
// is a counter, as the menubar suite does.  Every scene is judged by the act it names: who took the build, with or
// without `alone`, whether the pane is up, whether STATUS TAGS can hide the offer, and whether a press on a dirty
// project asks first.  The glass law: every press is a real pointer on a target that elementFromPoint says is on top.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`;
const PREFS = { 'privacy.reduceTimerPrecision': false };   // the latencies are sub-millisecond; Firefox's default clamp is 1 ms
const TEXT = {
  h3: 'A NEW BUILD IS READY',
  p: ['A newer λWAVES is installed and waiting. Press UPDATE — or the badge above — to reload into it. It takes a few seconds.',
    'KEPT: saved projects, settings, keys, the notebook. LOST: unsaved changes and the undo list — save first.',
    'LATER keeps the badge; ABOUT › UPDATE APP works any time.'],
  b: ['UPDATE', 'KEPT:', 'LOST:', 'LATER'],
  buttons: ['UPDATE', 'LATER'],
};
/* the page-side helpers: what the pane and the five badges show, a hit-test at a centre, and a wait for the ring to be quiet */
const HELPERS = `
  window.__pane = () => { const p = document.getElementById('offer'); if (!p) return { exists: false, shown: false };
    const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
    return { exists: true, hidden: p.hidden, shown: !p.hidden && cs.display !== 'none' && r.width > 0 && r.height > 0 }; };
  window.__badges = () => { const all = [...document.querySelectorAll('#badges > .badge')], build = document.querySelector('#badges > .badge.build');
    return { build: { display: getComputedStyle(build).display, hidden: build.hidden, text: build.lastChild.textContent },
      others: all.filter((b) => b !== build).map((b) => ({ display: getComputedStyle(b).display, hidden: b.hidden })) }; };
  window.__hit = (el) => { const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === el || el.contains(h)); };
  window.__btn = (label) => [...document.querySelectorAll('#offer .offer-row .trig')].find((b) => b.textContent.trim() === label);
  window.__quiet = async () => { await __LW.settle(); for (let i = 0; i < 40; i++) { const h = __LW.history;
    if (h.entries().length === 1 && !h.canUndo && !h.pendingLabel && !h.holding) return true; await new Promise((q) => setTimeout(q, 100)); } return false; };
  window.__reloads = 0; __LW.sw.reload = () => { window.__reloads++; window.__reloadAt = performance.now(); };
  window.__masks = null; { const f = __LW.field, o = f.setOcclusion; f.setOcclusion = function (rects) { window.__masks = rects.map((r) => r.slice()); return o.call(f, rects); }; }
  window.__masked = async () => { await __LW.settle(); await new Promise((q) => setTimeout(q, 350)); await __LW.settle();
    const p = document.getElementById('offer').getBoundingClientRect(), cb = document.getElementById('field').getBoundingClientRect();
    const want = [p.left - cb.left, p.top - cb.top, p.right - cb.left, p.bottom - cb.top];
    return (window.__masks || []).some((r) => r.every((n, i) => Math.abs(n - want[i]) < 1.5)); };
  return 1;`;

let failed = false, scenes = 0, g = null, g2 = null;
const pass = (line) => { scenes++; console.log('PASS ' + line); };
try {
  g = await open(URL_, { width: 1500, height: 1000, script: 60000, prefs: PREFS });
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  await g.ev(HELPERS);

  /* ── 1 · an untouched boot takes the build quietly: alone, no pane, the badge says so ── */
  const s1 = await g.ev(`const quiet = await __quiet();
    const pre = { rows: __LW.history.entries().map((e) => e.label), dirty: __LW.projects.dirty, playing: __LW.clock.playing };
    window.__taken = undefined;
    const t0 = performance.now();
    const r = __LW.sw.buildReady((opt) => { window.__taken = opt; window.__takeAt = performance.now(); __LW.sw.controllerChanged(); });   // the browser's controllerchange, at once
    const out = { quiet, pre, r, taken: window.__taken ?? null, state: __LW.sw.state, asked: __LW.sw.asked, pane: __pane(), badge: __badges().build.text,
      takeMs: window.__takeAt - t0, seamMs: window.__reloadAt - t0, reloads: window.__reloads };
    /* the page's share of the latency, 25 more times (no worker here: activation is the browser's and is not in it) */
    const seam = [];
    for (let i = 0; i < 25; i++) { __LW.sw.state = 'idle'; __LW.sw.reloads = 0; const a = performance.now();
      __LW.sw.buildReady(() => { __LW.sw.controllerChanged(); }); seam.push(window.__reloadAt - a); }
    seam.sort((x, y) => x - y); out.seamMedian = seam[12]; out.seamMax = seam[24];
    return out;`);
  assert.equal(s1.quiet, true, 'the boot ring never went quiet: ' + JSON.stringify(s1.pre));
  assert.deepEqual(s1.pre, { rows: ['boot'], dirty: false, playing: false });
  assert.equal(s1.r, true);
  assert.equal(s1.taken && s1.taken.alone, true, 'a quiet take must ask with alone: true');
  assert.equal(s1.state, 'taking'); assert.equal(s1.asked, true);
  assert.equal(s1.pane.shown, false, 'a quiet take shows no pane');
  assert.equal(s1.badge, 'TAKING THE NEW BUILD…');
  assert.equal(s1.reloads, 1, 'the tab that asked reloads, once');
  pass(`an untouched boot (ring ${JSON.stringify(s1.pre.rows)}, clean, paused) takes the waiting build itself: take({ alone: true }), state taking, no pane, badge "${s1.badge}"; ` +
    `buildReady → take ${s1.takeMs.toFixed(2)} ms, → the reload seam ${s1.seamMs.toFixed(2)} ms (median of 25 more ${s1.seamMedian.toFixed(2)} ms, max ${s1.seamMax.toFixed(2)} ms; the worker's own activation is not in it)`);

  /* ── 2 · the worker refused (a second window): offered — the pane up, the build badge visible under STATUS TAGS off ── */
  const s2 = await g.ev(`__LW.sw.take = (opt) => { window.__taken = opt; }; window.__taken = undefined; __LW.sw.reloads = 0;
    const t0 = performance.now();
    const kind = __LW.sw.message({ type: 'LW_SW_BUSY', windows: 2 });
    const t1 = performance.now(); document.getElementById('offer').getBoundingClientRect(); const t2 = performance.now();
    await new Promise((q) => requestAnimationFrame(() => requestAnimationFrame(q))); const t3 = performance.now();
    /* what building the same pane costs (it is built once, hidden, at boot — sw-client.js — so offer() only shows it) */
    const { el, trig } = await import('./mir/kit.js'); const b0 = performance.now();
    const c = el('section', 'glass', null); el('h3', '', c, 'A NEW BUILD IS READY'); for (let i = 0; i < 3; i++) el('p', '', c).innerHTML = document.querySelectorAll('#offer p')[i].innerHTML;
    const row = el('div', 'offer-row', c); row.appendChild(trig({ label: 'UPDATE' }).root); row.appendChild(trig({ label: 'LATER' }).root); const buildMs = performance.now() - b0;
    const P = document.getElementById('offer'), B = document.querySelector('#badges > .badge.build');
    const cs = getComputedStyle(P, '::before'), pr = P.getBoundingClientRect(), br = B.getBoundingClientRect();
    return { kind, state: __LW.sw.state, asked: __LW.sw.asked, taken: window.__taken ?? null, pane: __pane(), tagsOff: document.body.classList.contains('no-badges'), badges: __badges(),
      hit: { update: __hit(__btn('UPDATE')), later: __hit(__btn('LATER')), badge: __hit(B) },
      text: { h3: P.querySelector('h3').textContent, p: [...P.querySelectorAll('p')].map((p) => p.textContent), b: [...P.querySelectorAll('b')].map((b) => b.textContent),
        buttons: [...P.querySelectorAll('.offer-row .trig')].map((b) => b.textContent.trim()) },
      aria: { role: P.getAttribute('role'), label: P.getAttribute('aria-label'), live: P.getAttribute('aria-live'), glass: P.classList.contains('glass') },
      caretX: pr.left + P.clientLeft + parseFloat(cs.left), badgeX: br.left + br.width / 2, caretTop: pr.top + P.clientTop + parseFloat(cs.top), badgeBottom: br.bottom,
      masked: await __masked(), offerMs: t1 - t0, layoutMs: t2 - t1, frameMs: t3 - t0, buildMs, errors: __e.slice() };`);
  assert.equal(s2.kind, 'busy'); assert.equal(s2.state, 'ready'); assert.equal(s2.asked, false); assert.equal(s2.taken, null);
  assert.equal(s2.pane.shown, true, 'the refused quiet take must be offered visibly');
  assert.equal(s2.tagsOff, true, 'first-run STATUS TAGS is off');
  assert.notEqual(s2.badges.build.display, 'none', 'STATUS TAGS off hid the build offer');
  assert.equal(s2.badges.others.length, 4);
  assert.ok(s2.badges.others.every((b) => b.display === 'none'), 'STATUS TAGS off must still hide the four ψ-badges: ' + JSON.stringify(s2.badges.others));
  assert.deepEqual(s2.hit, { update: true, later: true, badge: true }, 'the glass law: each target is the topmost thing at its own centre');
  assert.deepEqual(s2.text, TEXT);
  assert.deepEqual(s2.aria, { role: 'region', label: 'a new build is ready', live: null, glass: true });
  assert.ok(Math.abs(s2.caretX - s2.badgeX) <= 2, `the caret points at x=${s2.caretX}, the build badge's centre is x=${s2.badgeX}`);
  assert.ok(s2.caretTop < s2.badgeBottom + 4, 'the caret reaches up to the badge row');
  assert.equal(s2.masked, true, 'the pane must be masked out of the frame lines like #sheet, paused');
  assert.deepEqual(s2.errors, []);
  pass(`LW_SW_BUSY → offered: state ready, the pane up (glass, role=region, not live, the offer's exact words), the build badge ${s2.badges.build.display} while the four ψ-badges read none under STATUS TAGS off; ` +
    `UPDATE, LATER and the badge each topmost at their centres; caret x ${s2.caretX.toFixed(1)} on the badge's ${s2.badgeX.toFixed(1)}; masked out of the paused frame; ` +
    `offer() ${s2.offerMs.toFixed(2)} ms + layout ${s2.layoutMs.toFixed(2)} ms (next frame at ${s2.frameMs.toFixed(1)} ms; building the same pane ${s2.buildMs.toFixed(2)} ms, paid once at boot)`);

  /* ── 3 · LATER keeps the badge; the badge's own press takes it, as a press (no alone) ── */
  let t = await g.tap('#offer .offer-row .trig:last-child'); assert.equal(t.ok, 1, 'LATER not pressable: ' + JSON.stringify(t));
  const s3a = await g.ev(`return { pane: __pane(), badge: __badges().build, state: __LW.sw.state, taken: window.__taken ?? null, masked: await __masked() };`);
  assert.equal(s3a.pane.shown, false); assert.equal(s3a.pane.hidden, true);
  assert.notEqual(s3a.badge.display, 'none'); assert.equal(s3a.badge.text, 'A NEW BUILD IS READY · UPDATE');
  assert.equal(s3a.state, 'ready'); assert.equal(s3a.taken, null); assert.equal(s3a.masked, false, 'a hidden pane must leave the mask');
  t = await g.tap('#badges > .badge.build'); assert.equal(t.ok, 1, 'the build badge not pressable: ' + JSON.stringify(t));
  const s3b = await g.ev(`return { taken: window.__taken ?? null, state: __LW.sw.state, badge: __badges().build.text };`);
  assert.ok(s3b.taken && !s3b.taken.alone, 'a press asks without alone: ' + JSON.stringify(s3b.taken));
  assert.equal(s3b.state, 'taking');
  pass(`LATER hid the pane (and its mask) and kept the badge "${s3a.badge.text}"; a real press on the badge took it as a press — take(${JSON.stringify(s3b.taken)}), state ${s3b.state}`);

  /* ── 4 · a touched session is offered, never taken ── */
  const s4 = await g.ev(`__LW.sw.state = 'idle'; window.__taken = undefined;
    __LW.sw.message({ type: 'LW_SW_WAITING', build: 'offer-test-second-build' });   // a new waiting build: the pane shows once per build
    __LW.loadPreset('2pz'); __LW.history.flush(); await __LW.settle();
    const rows = __LW.history.entries().length, depth = __LW.history.depth;
    const r = __LW.sw.buildReady((opt) => { window.__taken = opt; });
    return { rows, depth, r, taken: window.__taken ?? null, state: __LW.sw.state, pane: __pane(), offered: __LW.sw.offered };`);
  assert.ok(s4.rows > 1 || s4.depth > 0, 'the edit made no history row: ' + JSON.stringify(s4));
  assert.equal(s4.r, true); assert.equal(s4.taken, null, 'a touched session was reloaded without a press');
  assert.equal(s4.state, 'ready'); assert.equal(s4.pane.shown, true); assert.equal(s4.offered, 'offer-test-second-build');
  pass(`a touched session (${s4.rows} ring rows, depth ${s4.depth}) is offered — the pane up for build ${s4.offered} — and take is not called`);

  /* ── 5 · a dirty project asks first; no is no, yes marks it clean and takes ── */
  const d0 = await g.ev(`window.__confirms = 0; window.__confirmSaved = window.confirm; window.confirm = () => { window.__confirms++; return false; };
    return { dirty: __LW.projects.dirty, shown: __pane().shown };`);
  assert.equal(d0.dirty, true, 'the edit left the project clean — scene 5 would prove nothing'); assert.equal(d0.shown, true);
  t = await g.tap('#offer .offer-row .trig:first-child'); assert.equal(t.ok, 1, 'UPDATE not pressable: ' + JSON.stringify(t));
  const s5a = await g.ev(`return { confirms: window.__confirms, taken: window.__taken ?? null, state: __LW.sw.state, dirty: __LW.projects.dirty, shown: __pane().shown };`);
  assert.deepEqual(s5a, { confirms: 1, taken: null, state: 'ready', dirty: true, shown: true });
  await g.ev(`window.confirm = () => { window.__confirms++; return true; }; return 1;`);
  t = await g.tap('#offer .offer-row .trig:first-child'); assert.equal(t.ok, 1, 'UPDATE not pressable the second time: ' + JSON.stringify(t));
  const s5b = await g.ev(`const out = { confirms: window.__confirms, taken: window.__taken ?? null, state: __LW.sw.state, dirty: __LW.projects.dirty, shown: __pane().shown, errors: __e.slice() };
    window.confirm = window.__confirmSaved; return out;`);
  assert.equal(s5b.confirms, 2); assert.ok(s5b.taken && !s5b.taken.alone); assert.equal(s5b.state, 'taking');
  assert.equal(s5b.dirty, false, 'yes must mark the project clean before the take'); assert.equal(s5b.shown, false);
  assert.deepEqual(s5b.errors, []);
  pass(`a dirty project asks before the swap: "no" left take uncalled, state ready and the project dirty; "yes" marked it clean and took it as a press (${s5b.confirms} confirms)`);
  await g.close(); g = null;

  /* ── 6 · untouched but PLAYING: offered now, taken quietly when the page hides ── */
  g2 = await open(URL_, { width: 1500, height: 1000, script: 60000, prefs: PREFS });
  assert.equal((await g2.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  await g2.ev(HELPERS);
  const s6 = await g2.ev(`const quiet = await __quiet(); __LW.play(); await __LW.settle();
    window.__taken = undefined;
    const r = __LW.sw.buildReady((opt) => { window.__taken = opt; });
    const now = { r, playing: __LW.clock.playing, taken: window.__taken ?? null, state: __LW.sw.state, pane: __pane() };
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    const hidden = { taken: window.__taken ?? null, state: __LW.sw.state, pane: __pane() };
    delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));
    __LW.pause();
    return { quiet, now, hidden, restored: document.visibilityState, errors: __e.slice() };`);
  assert.equal(s6.quiet, true);
  assert.equal(s6.now.r, true); assert.equal(s6.now.playing, true);
  assert.equal(s6.now.taken, null, 'a playing session was taken while visible'); assert.equal(s6.now.state, 'ready'); assert.equal(s6.now.pane.shown, true);
  assert.equal(s6.hidden.taken && s6.hidden.taken.alone, true, 'the hide must take it quietly'); assert.equal(s6.hidden.state, 'taking'); assert.equal(s6.hidden.pane.shown, false);
  assert.equal(s6.restored, 'visible'); assert.deepEqual(s6.errors, []);
  pass(`an untouched session that is playing is offered (pane up, not taken) and the next hide takes it quietly — take(${JSON.stringify(s6.hidden.taken)}), state ${s6.hidden.state}`);

  /* ── 7 · STATUS TAGS on shows all five as before; off again hides only the four ψ-badges ── */
  const s7 = await g2.ev(`document.body.classList.remove('no-badges'); const on = __badges();
    document.body.classList.add('no-badges'); const off = __badges(); return { on, off };`);
  assert.notEqual(s7.on.build.display, 'none');
  assert.ok(s7.on.others.every((b) => (b.display === 'none') === b.hidden), 'STATUS TAGS on: each ψ-badge shows exactly as its own hidden says: ' + JSON.stringify(s7.on.others));
  assert.ok(s7.on.others.filter((b) => !b.hidden).length >= 2, 'STATE and FIELD show with STATUS TAGS on');
  assert.notEqual(s7.off.build.display, 'none'); assert.ok(s7.off.others.every((b) => b.display === 'none'));
  pass(`STATUS TAGS on: the build badge and ${s7.on.others.filter((b) => b.display !== 'none').length} ψ-badges show (the rest are hidden by their own state); off: only the build badge`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  if (g) await g.close();
  if (g2) await g2.close();
}
console.log((failed ? 'RED' : 'GREEN') + ` offer.browser-test — ${scenes} of 7 scenes`);
process.exit(failed ? 1 : 0);
