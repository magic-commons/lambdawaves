// WAVE 133 · THE OFFER — a new build is seen, taken quietly when nothing is at stake, and explained when something is.
// The page runs in automation mode (no real worker: main.js' bypass), so LW.sw is driven directly and its reload() seam
// is a counter, as the menubar suite does.  Every scene is judged by the act it names: who took the build, with or
// without `alone`, whether the pane is up, whether STATUS TAGS can hide the offer, and whether a press on a dirty
// project asks first.  The glass law: every press is a real pointer on a target that elementFromPoint says is on top.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
// The fix pass (wave 133, from the fresh verifier's report) added scenes 8–13: a moved clock and a capture in flight are
// offered, never taken; the badge is readable, first and aimed at from 500 to 1500 px, tags on and off, the window really
// resized; a replaced tab's badge reloads; a build announced mid-take restarts nothing; main.js arms each worker once; and a
// real boot at a link is clean and taken quietly.  The last pass added 14–16: LATER disarms the take-on-hide; the caret
// follows STATUS TAGS switched with the pane up; a link pasted over an edit asks first (the hashchange road, wave 56's hole).
// 032 (Josh 11-01): the pane became a popup — the kit's notice (the photosensitivity warning's look), UPDATE AVAILABLE · RELOAD PAGE ·
// LATER; the caret and the mask left with the pane, and scene 15 proves Escape is LATER (the popup holds the focus).
import assert from 'node:assert/strict';
import http from 'node:http';
import { open } from '../tools/gate/gatekit.mjs';

const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`;
const PREFS = { 'privacy.reduceTimerPrecision': false };   // the latencies are sub-millisecond; Firefox's default clamp is 1 ms
/* WebDriver's Set Window Rect, on the session gatekit opened: the real window resized, so the page's own `resize` fires */
const setRect = (s, width, height) => new Promise((res, rej) => {
  const body = JSON.stringify({ width, height });
  const r = http.request({ host: '127.0.0.1', port: process.env.GD_PORT || 4444, path: '/session/' + s + '/window/rect', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (x) => {
    let b = ''; x.on('data', (d) => { b += d; }); x.on('end', () => { try { res(JSON.parse(b).value); } catch (e) { rej(e); } });
  });
  r.on('error', rej); r.end(body);
});
const TEXT = {
  title: 'UPDATE AVAILABLE',
  body: 'A newer λWAVES is ready. Reload the page to start using it; it takes a few seconds. Saved projects, settings and the notebook are kept; unsaved changes are lost, so save first.',
  buttons: ['RELOAD PAGE', 'LATER'],
};
/* the page-side helpers: what the pane and the five badges show, a hit-test at a centre, and a wait for the ring to be quiet */
const HELPERS = `
  window.__pane = () => { const p = __LW.sw.offering; for (const o of document.querySelectorAll('#lwOffer')) if (o !== p) o.removeAttribute('id');
    if (!p) return { exists: false, hidden: true, shown: false }; p.id = 'lwOffer';   /* 032: the live popup, named so a real press can find it */
    const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
    return { exists: true, hidden: p.hidden, shown: !p.hidden && cs.display !== 'none' && r.width > 0 && r.height > 0 }; };
  window.__badges = () => { const all = [...document.querySelectorAll('#badges > .badge')], build = document.querySelector('#badges > .badge.build');
    return { build: { display: getComputedStyle(build).display, hidden: build.hidden, text: build.lastChild.textContent },
      others: all.filter((b) => b !== build).map((b) => ({ display: getComputedStyle(b).display, hidden: b.hidden })) }; };
  window.__hit = (el) => { const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === el || el.contains(h)); };
  window.__btn = (label) => { __pane(); return [...document.querySelectorAll('#lwOffer .mir-dialog-actions .trig')].find((b) => b.textContent.trim() === label); };
  window.__quiet = async () => { await __LW.settle(); for (let i = 0; i < 40; i++) { const h = __LW.history;
    if (h.entries().length === 1 && !h.canUndo && !h.pendingLabel && !h.holding) return true; await new Promise((q) => setTimeout(q, 100)); } return false; };
  window.__reloads = 0; __LW.sw.reload = () => { window.__reloads++; window.__reloadAt = performance.now(); };
  window.__masks = null; { const f = __LW.field, o = f.setOcclusion; f.setOcclusion = function (rects) { window.__masks = rects.map((r) => r.slice()); return o.call(f, rects); }; }
  /* what buildReady does with THIS session right now — taken quietly (untouched) or offered — and then put back */
  window.__pn = 0;
  window.__probe = () => { const sw = __LW.sw; let took = null;
    sw.state = 'idle'; sw.asked = false; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'probe-' + (++window.__pn) };
    sw.buildReady((o) => { took = o || {}; });
    const out = { quiet: !!(took && took.alone), taken: !!took, pane: __pane().shown };
    sw.state = 'idle'; sw.asked = false; sw.pending = null; sw.offered = null; sw.closeOffer();
    return out; };
  /* the build badge at this size, raised the way a touched session sees it (offer()), tags on or off */
  window.__sizeRead = async (tagsOn) => {
    document.body.classList.toggle('no-badges', !tagsOn);
    await new Promise((q) => requestAnimationFrame(() => requestAnimationFrame(q)));
    const sw = __LW.sw; sw.state = 'ready'; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'size-' + innerWidth + '-' + tagsOn }; sw.offer();
    return __caret(); };
  window.__caret = () => {
    const B = document.querySelector('#badges > .badge.build'), S = B.querySelector('span'), row = document.getElementById('badges');
    const br = B.getBoundingClientRect(), sr = S.getBoundingClientRect(), rr = row.getBoundingClientRect();
    const others = [...row.querySelectorAll('.badge:not(.build)')].filter((b) => getComputedStyle(b).display !== 'none');
    const first = others.every((o) => { const r = o.getBoundingClientRect(); return br.top < r.top - 1 || br.right <= r.left + 1; });
    const over = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const phone = document.body.classList.contains('phone'), clip = getComputedStyle(row).overflow === 'hidden' ? rr : { left: 0, right: innerWidth };
    return { vw: innerWidth, phone, text: B.lastChild.textContent, badge: [Math.round(br.left), Math.round(br.right)], rowW: Math.round(rr.width),
      textFits: sr.left >= br.left + 1 && sr.right <= br.right - 1, onScreen: br.left >= clip.left - 1 && br.right <= clip.right + 1,
      hit: __hit(B), first, others: others.length, paneShown: __pane().shown,
      overTitle: over(br, document.getElementById('title').getBoundingClientRect()), overToggle: !phone && over(br, document.getElementById('rackToggle').getBoundingClientRect()) }; };
  return 1;`;

let failed = false, scenes = 0, g = null, g2 = null, g3 = null;
const TOTAL = 16;
const pass = (line) => { scenes++; console.log('PASS ' + line); };
try {
  g = await open(URL_, { width: 1500, height: 1000, script: 60000, prefs: PREFS });
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 150, 100)).ok, 1);
  await g.ev(HELPERS);

  /* ── 1 · an untouched boot takes the build quietly: alone, no pane, the badge says so ── */
  const s1 = await g.ev(`const quiet = await __quiet();
    const pre = { rows: __LW.history.entries().map((e) => e.label), dirty: __LW.projects.dirty, playing: __LW.clock.playing, t: __LW.clock.t };
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
  assert.deepEqual(s1.pre, { rows: ['boot'], dirty: false, playing: false, t: 0 });
  assert.equal(s1.r, true);
  assert.equal(s1.taken && s1.taken.alone, true, 'a quiet take must ask with alone: true');
  assert.equal(s1.state, 'taking'); assert.equal(s1.asked, true);
  assert.equal(s1.pane.shown, false, 'a quiet take shows no pane');
  assert.equal(s1.badge, 'TAKING THE NEW BUILD…');
  assert.equal(s1.reloads, 1, 'the tab that asked reloads, once');
  pass(`an untouched boot (ring ${JSON.stringify(s1.pre.rows)}, clean, paused at t = 0) takes the waiting build itself: take({ alone: true }), state taking, no pane, badge "${s1.badge}"; ` +
    `buildReady → take ${s1.takeMs.toFixed(2)} ms, → the reload seam ${s1.seamMs.toFixed(2)} ms (median of 25 more ${s1.seamMedian.toFixed(2)} ms, max ${s1.seamMax.toFixed(2)} ms; the worker's own activation is not in it)`);

  /* ── 2 · the worker refused (a second window): offered — the popup up (032), the build badge visible under STATUS TAGS off ── */
  const s2 = await g.ev(`__LW.sw.take = (opt) => { window.__taken = opt; }; window.__taken = undefined; __LW.sw.reloads = 0;
    const t0 = performance.now();
    const kind = __LW.sw.message({ type: 'LW_SW_BUSY', windows: 2 });
    const t1 = performance.now();
    await new Promise((q) => setTimeout(q, 400));   // the popup's own entrance
    const P = __LW.sw.offering, B = document.querySelector('#badges > .badge.build');
    return { kind, state: __LW.sw.state, asked: __LW.sw.asked, taken: window.__taken ?? null, pane: __pane(), tagsOff: document.body.classList.contains('no-badges'), badges: __badges(),
      hit: { update: __hit(__btn('RELOAD PAGE')), later: __hit(__btn('LATER')), badge: __hit(B) },
      text: { title: P.querySelector('.mir-dialog-title').textContent, body: P.querySelector('.mir-dialog-body').textContent,
        buttons: [...P.querySelectorAll('.mir-dialog-actions .trig')].map((b) => b.textContent.trim()) },
      look: { kind: P.dataset.kind, role: P.getAttribute('role'), modal: P.getAttribute('aria-modal'), glass: P.classList.contains('glass'), art: (P.querySelector('.lw-update-art') || {}).getAttribute?.('src') || null,
        focus: document.activeElement && document.activeElement.textContent.trim() },
      offerMs: t1 - t0, errors: __e.slice() };`);
  assert.equal(s2.kind, 'busy'); assert.equal(s2.state, 'ready'); assert.equal(s2.asked, false); assert.equal(s2.taken, null);
  assert.equal(s2.pane.shown, true, 'the refused quiet take must be offered visibly');
  assert.equal(s2.tagsOff, true, 'first-run STATUS TAGS is off');
  assert.notEqual(s2.badges.build.display, 'none', 'STATUS TAGS off hid the build offer');
  assert.equal(s2.badges.others.length, 4);
  assert.ok(s2.badges.others.every((b) => b.display === 'none'), 'STATUS TAGS off must still hide the four ψ-badges: ' + JSON.stringify(s2.badges.others));
  assert.deepEqual(s2.hit, { update: true, later: true, badge: true }, 'the glass law: each target is the topmost thing at its own centre');
  assert.deepEqual(s2.text, TEXT);
  assert.deepEqual(s2.look, { kind: 'notice', role: 'alertdialog', modal: 'true', glass: true, art: './img/icon.svg', focus: 'RELOAD PAGE' });
  assert.deepEqual(s2.errors, []);
  pass(`LW_SW_BUSY → offered: state ready, the popup up (the kit's notice — glass, alertdialog, λWAVES' icon, the offer's exact words, RELOAD PAGE holding the focus), the build badge ${s2.badges.build.display} while the four ψ-badges read none under STATUS TAGS off; ` +
    `RELOAD PAGE, LATER and the badge each topmost at their centres; offer() ${s2.offerMs.toFixed(2)} ms`);

  /* ── 3 · LATER keeps the badge; the badge's own press takes it, as a press (no alone) ── */
  await g.ev('__pane(); return 1;');
  let t = await g.tap('#lwOffer .mir-dialog-actions .trig:last-child'); assert.equal(t.ok, 1, 'LATER not pressable: ' + JSON.stringify(t));
  const s3a = await g.ev(`await new Promise((q) => setTimeout(q, 50)); return { pane: __pane(), badge: __badges().build, state: __LW.sw.state, taken: window.__taken ?? null };`);
  assert.equal(s3a.pane.shown, false); assert.equal(s3a.pane.hidden, true);
  assert.notEqual(s3a.badge.display, 'none'); assert.equal(s3a.badge.text, 'A NEW BUILD IS READY · UPDATE');
  assert.equal(s3a.state, 'ready'); assert.equal(s3a.taken, null);
  await g.ev('await new Promise((q) => setTimeout(q, 400)); return 1;');   // the popup's leave, then the badge's own press
  t = await g.tap('#badges > .badge.build'); assert.equal(t.ok, 1, 'the build badge not pressable: ' + JSON.stringify(t));
  const s3b = await g.ev(`return { taken: window.__taken ?? null, state: __LW.sw.state, badge: __badges().build.text };`);
  assert.ok(s3b.taken && !s3b.taken.alone, 'a press asks without alone: ' + JSON.stringify(s3b.taken));
  assert.equal(s3b.state, 'taking');
  pass(`LATER put the popup away and kept the badge "${s3a.badge.text}"; a real press on the badge took it as a press — take(${JSON.stringify(s3b.taken)}), state ${s3b.state}`);

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
  await g.ev('await new Promise((q) => setTimeout(q, 400)); __pane(); return 1;');
  t = await g.tap('#lwOffer .mir-dialog-actions .trig:first-child'); assert.equal(t.ok, 1, 'RELOAD PAGE not pressable: ' + JSON.stringify(t));
  const s5a = await g.ev(`await new Promise((q) => setTimeout(q, 50)); return { confirms: window.__confirms, taken: window.__taken ?? null, state: __LW.sw.state, dirty: __LW.projects.dirty, shown: __pane().shown };`);
  assert.deepEqual(s5a, { confirms: 1, taken: null, state: 'ready', dirty: true, shown: true });
  await g.ev(`window.confirm = () => { window.__confirms++; return true; }; return 1;`);
  await g.ev('await new Promise((q) => setTimeout(q, 400)); __pane(); return 1;');
  t = await g.tap('#lwOffer .mir-dialog-actions .trig:first-child'); assert.equal(t.ok, 1, 'RELOAD PAGE not pressable the second time: ' + JSON.stringify(t));
  const s5b = await g.ev(`await new Promise((q) => setTimeout(q, 50)); const out = { confirms: window.__confirms, taken: window.__taken ?? null, state: __LW.sw.state, dirty: __LW.projects.dirty, shown: __pane().shown, errors: __e.slice() };
    window.confirm = window.__confirmSaved; return out;`);
  assert.equal(s5b.confirms, 2); assert.ok(s5b.taken && !s5b.taken.alone); assert.equal(s5b.state, 'taking');
  assert.equal(s5b.dirty, false, 'yes must mark the project clean before the take'); assert.equal(s5b.shown, false);
  assert.deepEqual(s5b.errors, []);
  pass(`a dirty project asks before the swap: "no" left take uncalled, state ready, the project dirty and the popup back up; "yes" marked it clean and took it as a press (${s5b.confirms} confirms)`);
  const linkHref = await g.ev(`return __LW.link.mint().href;`);   // for scene 13: a real boot at a link
  const linkB = await g.ev(`__LW.mat.exposure = 1.9; return __LW.link.mint().href;`);   // for scene 16: a second link to paste over it
  assert.equal(typeof linkB, 'string', 'no second link minted: ' + JSON.stringify(linkB));
  assert.equal(typeof linkHref, 'string', 'no link minted: ' + JSON.stringify(linkHref));
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

  /* ── 8 · a moved clock is offered in the foreground — a reload would return it to t = 0 — and the hide still takes it ── */
  const s8 = await g2.ev(`__LW.scrub(0); await __LW.settle(); const zero = __probe();
    __LW.scrub(5); await __LW.settle(); const scrubbed = __probe();
    __LW.scrub(0); __LW.play(); await new Promise((q) => setTimeout(q, 500)); __LW.pause(); await __LW.settle(); const tPlayed = __LW.clock.t; const played = __probe();
    window.__taken = undefined; const sw = __LW.sw; sw.state = 'idle'; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'clock-hide' };
    sw.buildReady((o) => { window.__taken = o; });
    const shown = { taken: window.__taken ?? null, pane: __pane().shown };
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    const hid = { taken: window.__taken ?? null, state: sw.state };
    delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));
    sw.state = 'idle'; sw.asked = false; __LW.scrub(0); await __LW.settle();
    return { zero, scrubbed, tPlayed, played, shown, hid };`);
  assert.equal(s8.zero.quiet, true, 'control: at t = 0 the session must still be taken quietly');
  assert.deepEqual([s8.scrubbed.taken, s8.scrubbed.pane], [false, true], 'a scrubbed clock (t = 5) must be offered, not taken');
  assert.ok(s8.tPlayed > 0); assert.deepEqual([s8.played.taken, s8.played.pane], [false, true], 'a played-then-paused clock must be offered, not taken');
  assert.deepEqual(s8.shown, { taken: null, pane: true });
  assert.equal(s8.hid.taken && s8.hid.taken.alone, true, 'the take-on-hide road ignores the clock'); assert.equal(s8.hid.state, 'taking');
  pass(`a moved clock is offered in the foreground (scrubbed to t = 5; played to t = ${s8.tPlayed.toFixed(2)} and paused), taken quietly at t = 0, and the next hide still takes it — take(${JSON.stringify(s8.hid.taken)})`);

  /* ── 9 · a capture in flight is offered, never taken ── */
  const s9 = await g2.ev(`const before = __probe();
    window.__exp = __LW.captureUI.exportFrames({ download: false, fps: 24, seconds: 6 });   /* 0.5.0 C7: a film runs at the kit's rates (24, 30, 48, 60) */
    let busy = false; for (let i = 0; i < 100 && !(busy = __LW.captureUI.busy); i++) await new Promise((q) => setTimeout(q, 20));
    const during = __probe();
    __LW.captureUI.exportFrames();   // the same act again is STOP EXPORT
    let r = null; try { r = await Promise.race([window.__exp, new Promise((q) => setTimeout(() => q('timeout'), 30000))]); } catch (e) { r = String(e); }
    let idle = false; for (let i = 0; i < 300 && !(idle = !__LW.captureUI.busy); i++) await new Promise((q) => setTimeout(q, 50));
    await __LW.settle(); await new Promise((q) => setTimeout(q, 500)); __LW.scrub(0); await __LW.settle();
    const after = __probe();
    return { before, busy, during, result: r && typeof r === 'object' ? { ok: !!r.ok, stopped: !!r.stopped } : r, idle, after, errors: __e.slice() };`);
  assert.equal(s9.before.quiet, true, 'control: before the export the session is taken quietly');
  assert.equal(s9.busy, true, 'the export never reported busy');
  assert.deepEqual([s9.during.taken, s9.during.pane], [false, true], 'a capture in flight must be offered, never taken');
  assert.equal(s9.idle, true, 'STOP EXPORT did not end the capture: ' + JSON.stringify(s9.result));
  assert.deepEqual(s9.errors, []);
  pass(`a capture in flight (EXPORT FRAMES, busy) is offered with the pane, never taken; taken quietly before it${s9.after.quiet ? ' and again once STOP EXPORT ended it' : ' (after STOP it read ' + JSON.stringify(s9.after) + ')'}`);

  /* ── 10 · the badge at six sizes, the window really resized: readable, first with STATUS TAGS on (032: the popup is centred, no caret) ── */
  const SIZES = [[1500, 1000], [1366, 1024], [1024, 1366], [1140, 800], [1000, 700], [500, 930]];
  const reads = [];
  for (const [W, H] of SIZES) {
    await setRect(g2.s, W, H);
    await g2.ev(`await new Promise((q) => setTimeout(q, 500)); try { await __LW.settle(); } catch (e) {} return 1;`);
    const off = await g2.ev(`const m = await __sizeRead(false); await new Promise((q) => setTimeout(q, 400)); m.paneShown = __pane().shown; return m;`), on = await g2.ev(`const m = await __sizeRead(true); await new Promise((q) => setTimeout(q, 400)); m.paneShown = __pane().shown; return m;`);
    reads.push({ W, H, off, on });
  }
  await g2.ev(`document.body.classList.add('no-badges'); __LW.sw.closeOffer(); __LW.sw.state = 'idle'; return 1;`);
  await setRect(g2.s, 1500, 1000); await g2.ev(`await new Promise((q) => setTimeout(q, 500)); return 1;`);
  for (const r of reads) {
    for (const [tag, m] of [['off', r.off], ['on', r.on]]) {
      const at = `${r.W}×${r.H} tags ${tag}`;
      assert.equal(m.text, 'A NEW BUILD IS READY · UPDATE', at);
      assert.ok(m.textFits, `${at}: the badge's text is cut (badge ${JSON.stringify(m.badge)})`);
      assert.ok(m.onScreen, `${at}: the badge is off the screen or the phone's strip`);
      assert.ok(m.hit, `${at}: the badge is not topmost at its centre`);
      assert.ok(!m.overTitle && !m.overToggle, `${at}: the badge overlaps the title or the hide toggle`);
      if (!m.phone) assert.ok(m.rowW >= 209, `${at}: the badge row is ${m.rowW} px`);
      assert.ok(m.paneShown, `${at}: the popup is not up`);
    }
    assert.ok(r.on.first && r.on.others >= 2, `${r.W}×${r.H}: with STATUS TAGS on the build badge must come first (${r.on.others} others)`);
  }
  const phoneRead = reads.find((r) => r.W === 500);
  assert.equal(phoneRead.off.phone, true, 'the 500 px window did not become the phone layout');
  const narrowest = Math.min(...reads.filter((r) => !r.off.phone).map((r) => r.off.rowW));
  pass(`the badge at ${SIZES.map(([W, H]) => W + '×' + H).join(', ')} (the last is the phone), the window resized for real: its text whole, on screen, topmost, first with STATUS TAGS on, ` +
    `the desktop row ≥ ${narrowest} px, tags on and off, the popup up at every size`);

  /* ── 11 · a tab whose build another tab replaced (iteration 028 R-03): one holding no work reloads at once; one holding work (a moved
     clock) is told RELOAD NOW, and its badge's press reloads.  And a PRESS the worker refused (other windows open) is re-offered with the
     count, its UPDATE reads UPDATE ALL, and a real press on it asks with force: true ── */
  const s11 = await g2.ev(`const sw = __LW.sw; const arm = (b) => { sw.state = 'ready'; sw.asked = false; sw.reloads = 0; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: b }; sw.offer(); };
    __LW.scrub(0); await __LW.settle(); window.__reloads = 0; arm('replaced-clean');
    const clean = { told: sw.controllerChanged(), reloads: window.__reloads };
    __LW.scrub(5); await __LW.settle(); window.__reloads = 0; arm('replaced');
    const told = sw.controllerChanged();
    return { clean, told: { told, state: sw.state, pane: __pane().shown, badge: __badges().build.text } };`);
  assert.deepEqual(s11.clean, { told: 'reloaded', reloads: 1 }, 'a tab holding no work whose build another tab replaced must reload at once');
  assert.deepEqual(s11.told, { told: 'told', state: 'replaced', pane: false, badge: 'THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD NOW' });
  t = await g2.tap('#badges > .badge.build'); assert.equal(t.ok, 1, 'the replaced badge not pressable: ' + JSON.stringify(t));
  const s11b = await g2.ev(`return { reloads: window.__reloads, state: __LW.sw.state };`);
  assert.equal(s11b.reloads, 1, 'a press on the replaced badge must reload');
  const s11c = await g2.ev(`const sw = __LW.sw; window.__taken = undefined; sw.take = (o) => { window.__taken = o; };
    sw.state = 'ready'; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'busy-press' }; sw.accept();
    const kind = sw.message({ type: 'LW_SW_BUSY', windows: 3 });
    await new Promise((q) => setTimeout(q, 400)); const P = __LW.sw.offering;
    return { kind, state: sw.state, others: sw.others, pane: __pane().shown, lead: P.querySelector('.mir-dialog-body').textContent,
      buttons: [...P.querySelectorAll('.mir-dialog-actions .trig')].map((b) => b.textContent.trim()) };`);
  assert.deepEqual([s11c.kind, s11c.state, s11c.others, s11c.pane], ['busy', 'ready', 2, true], 'a refused press must be re-offered with the count: ' + JSON.stringify(s11c));
  assert.match(s11c.lead, /^2 other windows are open on this build\. RELOAD ALL /);
  assert.deepEqual(s11c.buttons, ['RELOAD ALL', 'LATER']);
  await g2.ev('__pane(); return 1;');
  t = await g2.tap('#lwOffer .mir-dialog-actions .trig:first-child'); assert.equal(t.ok, 1, 'RELOAD ALL not pressable: ' + JSON.stringify(t));
  const s11d = await g2.ev(`await new Promise((q) => setTimeout(q, 50)); return { taken: window.__taken ?? null, state: __LW.sw.state };`);
  assert.deepEqual(s11d, { taken: { force: true }, state: 'taking' }, 'RELOAD ALL must take with force: true');
  await g2.ev(`__LW.sw.others = 0; __LW.scrub(0); await __LW.settle(); return 1;`);
  pass(`a replaced tab holding no work reloads at once (${s11.clean.reloads}); one holding work is told ("${s11.told.badge}") and a real press on its badge reloads; ` +
    `a refused press is re-offered — "${s11c.lead.slice(0, 40)}…", ${s11c.buttons.join(' · ')} — and RELOAD ALL takes with force: true`);

  /* ── 12 · a build announced while UPDATE APP runs, or while a take is under way, restarts nothing ── */
  const s12 = await g2.ev(`const sw = __LW.sw, out = {};
    for (const st of ['refreshing', 'taking']) { let called = 0; const t2 = () => { called++; }; sw.state = st;
      const r = sw.buildReady(t2); out[st] = { r, state: sw.state, stored: sw.take === t2, called, pane: __pane().shown }; }
    sw.state = 'idle'; return out;`);
  for (const st of ['refreshing', 'taking']) assert.deepEqual(s12[st], { r: false, state: st, stored: true, called: 0, pane: false }, st);
  pass(`buildReady during ${Object.keys(s12).join(' and ')} returns false, keeps the state, stores the newer take and calls nothing`);

  /* ── 14 · LATER disarms the take-on-hide: the reader chose to wait, so switching away takes nothing and the badge stays ── */
  const s14a = await g2.ev(`const sw = __LW.sw; __LW.scrub(137); await __LW.settle(); window.__taken = undefined;
    sw.state = 'idle'; sw.asked = false; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'later-disarms' };
    const r = sw.buildReady((o) => { window.__taken = o; });
    return { r, taken: window.__taken ?? null, pane: __pane().shown, state: sw.state };`);
  assert.deepEqual(s14a, { r: true, taken: null, pane: true, state: 'ready' }, 'at t = 137 the session is offered, with the take-on-hide armed');
  await g2.ev('await new Promise((q) => setTimeout(q, 400)); __pane(); return 1;');
  t = await g2.tap('#lwOffer .mir-dialog-actions .trig:last-child'); assert.equal(t.ok, 1, 'LATER not pressable: ' + JSON.stringify(t));
  const s14b = await g2.ev(`await new Promise((q) => setTimeout(q, 900));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    const b = __badges().build, hid = { taken: window.__taken ?? null, state: __LW.sw.state, badge: b.text, badgeShown: b.display !== 'none', pane: __pane().shown };
    delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));
    __LW.scrub(0); await __LW.settle(); return hid;`);
  assert.deepEqual(s14b, { taken: null, state: 'ready', badge: 'A NEW BUILD IS READY · UPDATE', badgeShown: true, pane: false }, 'after LATER a hide must take nothing');
  pass(`LATER disarms the take-on-hide: scrubbed to t = 137, offered, LATER pressed, the page hidden 0.9 s later — nothing taken, state ${s14b.state}, the badge "${s14b.badge}" stays`);

  /* ── 15 · (032) the popup holds the focus, and Escape — a real key — is LATER: nothing taken, the badge stays, the hide takes nothing ── */
  const s15a = await g2.ev(`const sw = __LW.sw; __LW.scrub(42); await __LW.settle(); window.__taken = undefined;
    sw.state = 'idle'; sw.asked = false; sw.offered = null; sw.pending = { type: 'LW_SW_WAITING', build: 'escape-is-later' };
    sw.buildReady((o) => { window.__taken = o; }); await new Promise((q) => setTimeout(q, 400));
    return { pane: __pane().shown, focus: document.activeElement && document.activeElement.textContent.trim(), inside: !!(sw.offering && sw.offering.contains(document.activeElement)) };`);
  assert.deepEqual(s15a, { pane: true, focus: 'RELOAD PAGE', inside: true }, 'the popup must be up with RELOAD PAGE holding the focus');
  await g2.press('\uE00C');
  const s15b = await g2.ev(`await new Promise((q) => setTimeout(q, 100));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    const out = { pane: __pane().shown, taken: window.__taken ?? null, state: __LW.sw.state, badge: __badges().build.text };
    delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));
    __LW.scrub(0); await __LW.settle(); __LW.sw.state = 'idle'; return out;`);
  assert.deepEqual(s15b, { pane: false, taken: null, state: 'ready', badge: 'A NEW BUILD IS READY · UPDATE' }, 'Escape must be LATER');
  pass(`the popup holds the focus (RELOAD PAGE) and a real Escape is LATER: the popup gone, nothing taken (even on a hide), state ${s15b.state}, the badge "${s15b.badge}" stays`);
  await g2.close(); g2 = null;

  /* ── 13 · main.js arms each worker ONCE (a fake container under ?sw=1), and a real boot at a link is clean and taken quietly ── */
  const lu = new URL(linkHref); lu.search = '?sw=1';
  g3 = await open(lu.href, { width: 1500, height: 1000, script: 60000, prefs: PREFS });
  const s13a = await g3.ev(`for (let i = 0; i < 3000 && !(window.__LW && __LW.ready); i++) await new Promise((q) => setTimeout(q, 5));
    const early = { dirty: __LW.projects.dirty, rows: __LW.history.entries().map((e) => e.label), mode: __LW.sw.mode };
    /* in before main.js' deferred register() (≥ 1.5 s after load): one worker, a registration that names it, a container */
    window.__W = { state: 'installed', sent: [], postMessage(m) { this.sent.push(m); }, addEventListener(t, fn) { (this.h ||= {})[t] = fn; } };
    window.__SWH = {}; window.__REGH = {};
    const reg = window.__REG = { waiting: __W, installing: null, addEventListener: (t, fn) => { __REGH[t] = fn; }, update: async () => {} };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { controller: { postMessage() {} }, register: async () => reg,
      addEventListener: (t, fn) => { __SWH[t] = fn; }, getRegistration: async () => reg } });
    window.__br = 0; const orig = __LW.sw.buildReady; __LW.sw.buildReady = function (t) { window.__br++; return orig.call(this, t); };
    window.__reloads = 0; __LW.sw.reload = () => { window.__reloads++; };
    return early;`);
  const s13b = await g3.ev(`for (let i = 0; i < 300 && !(__LW.sw.mode === 'registered' && window.__br > 0); i++) await new Promise((q) => setTimeout(q, 50));
    const first = { br: __br, sent: __W.sent.slice(), state: __LW.sw.state, mode: __LW.sw.mode };
    __REG.installing = __W; if (__REGH.updatefound) __REGH.updatefound();                                // the install's statechange road names it again
    if (__SWH.message) await __SWH.message({ data: { type: 'LW_SW_WAITING', build: 'fake-build' } });   // and §3's announcement a third time
    await new Promise((q) => setTimeout(q, 100));
    const after = { br: __br, sent: __W.sent.slice(), state: __LW.sw.state };
    if (__SWH.controllerchange) __SWH.controllerchange();
    return { first, after, late: { dirty: __LW.projects.dirty, rows: __LW.history.entries().map((e) => e.label), reloads: __reloads }, errors: __e.slice() };`);
  assert.deepEqual(s13a, { dirty: false, rows: ['link'], mode: 'arming' }, 'a real link boot at LW.ready');
  assert.equal(s13b.first.mode, 'registered'); assert.equal(s13b.first.br, 1);
  assert.deepEqual(s13b.first.sent, [{ type: 'LW_SW_SKIP_WAITING', alone: true }], 'the clean link session must be taken quietly');
  assert.equal(s13b.after.br, 1, 'the same worker named three times must reach buildReady once');
  assert.equal(s13b.after.sent.length, 1, 'a second SKIP_WAITING was posted');
  assert.deepEqual(s13b.late, { dirty: false, rows: ['link'], reloads: 1 });
  assert.deepEqual(s13b.errors, []);
  pass(`a real boot at a link reads clean at LW.ready and after register() (origin ${JSON.stringify(s13b.late.rows)}) and is taken quietly — one SKIP_WAITING { alone: true } — while main.js armed its worker once though reg.waiting, the install's statechange and LW_SW_WAITING all named it; controllerchange reloaded it (${s13b.late.reloads})`);

  /* ── 16 · a link pasted into the address bar (the hashchange road): over an unedited session it opens and reads clean; over
          an edited one it asks first — no keeps the edit and the ring, yes opens it clean; an in-page anchor asks nothing ── */
  const hashB = new URL(linkB).hash, hashA = new URL(linkHref).hash;
  const s16 = await g3.ev(`const w = (n) => new Promise((q) => setTimeout(q, n)), H = __LW.history;
    const read = () => ({ exposure: +__LW.mat.exposure.toFixed(3), rows: H.entries().map((e) => e.label), dirty: __LW.projects.dirty, canUndo: H.canUndo, confirms: window.__confirms });
    window.__confirms = 0; const saved = window.confirm; let answer = false; window.confirm = () => { window.__confirms++; return answer; };
    await __LW.settle(); const start = read();
    location.hash = ${JSON.stringify(hashB)}; await w(400); await __LW.settle(); const unedited = read();
    __LW.loadPreset('1s'); H.flush(); await __LW.settle(); const edited = read();
    location.hash = ${JSON.stringify(hashA)}; await w(400); await __LW.settle(); const no = read();
    answer = true; location.hash = ${JSON.stringify(hashB)}; await w(400); await __LW.settle(); const yes = read();
    __LW.loadPreset('1s'); H.flush(); await __LW.settle(); location.hash = '#rack'; await w(400); const anchor = read();
    window.confirm = saved;
    return { start, unedited, edited, no, yes, anchor, errors: __e.slice() };`);
  assert.equal(s16.start.dirty, false);
  assert.deepEqual([s16.unedited.exposure, s16.unedited.rows, s16.unedited.dirty, s16.unedited.confirms], [1.9, ['link'], false, 0], 'an unedited session: the link opens, clean, no question');
  assert.ok(s16.edited.dirty && s16.edited.rows.length === 2 && s16.edited.canUndo, 'the edit made no row: ' + JSON.stringify(s16.edited));
  assert.deepEqual({ ...s16.no, confirms: s16.no.confirms }, { ...s16.edited, confirms: 1 }, 'a "no" must keep the scene, the ring and the unsaved mark');
  assert.deepEqual([s16.yes.exposure, s16.yes.rows, s16.yes.dirty, s16.yes.confirms], [1.9, ['link'], false, 2], 'a "yes" opens the link as the clean state');
  assert.equal(s16.anchor.confirms, 2, 'an in-page anchor (#rack) must not ask'); assert.equal(s16.anchor.rows.length, 2);
  assert.deepEqual(s16.errors, []);
  pass(`a pasted link over an unedited session opens clean with no question (ring ${JSON.stringify(s16.unedited.rows)}); over an edit it asks — "no" kept the scene, the ring ${JSON.stringify(s16.no.rows)} and the unsaved mark; "yes" opened it clean (ring ${JSON.stringify(s16.yes.rows)}); the skip links' #rack asked nothing`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  if (g) await g.close();
  if (g2) await g2.close();
  if (g3) await g3.close();
}
console.log((failed ? 'RED' : 'GREEN') + ` offer.browser-test — ${scenes} of ${TOTAL} scenes`);
process.exit(failed ? 1 : 0);
