// 0.5.0 C7 · THE HAND-OVER (the film verifier's condition 3), re-aimed at the kit's RENDER card in C7b: a finished file reaches the person
// on a browser that shares files.  Linux Firefox has no navigator.share, so the page gets the Web Share rule as a stub — canShare
// permissive (Safari's), share() outside a live activation rejected with NotAllowedError (Chrome's and Safari's) — and every
// <a download> is COUNTED, not followed.  The timers a save sets are caught, so no scene waits minutes.
//   1  a REAL tap on the card's RENDER, then a REAL tap on SAVE: the save runs inside the tap → 1 share, 0 downloads; and the facade's
//      record() from a script (no tap) → 1 download (C7's law, kept on the script road)
//   2  no discard timer any more: the facade film's URL reads and its store copy stays until a REAL tap on DISCARD STORED RENDER; the
//      card's own film leaves the store on a REAL tap on DISCARD RENDER
//   3  TAKE A PICTURE from a script (no activation) → 1 download, 0 shares
//   4  REAL taps on CAPTURE IMAGE then DOWNLOAD IMAGE (the save inside the second tap) → 1 share, 0 downloads
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 300000,
  prefs: { 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
let failed = false;
const pass = (m) => console.log('PASS ' + m);
const ev = async (body) => { const r = await g.ev(body); assert.ok(r !== undefined && r !== null && !r.E, 'page threw: ' + JSON.stringify(r)); return r; };
const until = async (expr, ms) => { const t0 = Date.now(); for (;;) { if (await g.ev(`try { return !!(${expr}); } catch (_) { return false; }`)) return Date.now() - t0;
  assert.ok(Date.now() - t0 < ms, 'timed out waiting for ' + expr); await new Promise((r) => setTimeout(r, 500)); } };
const mark = (id, find) => ev(`const n = (${find})(); if (!n) return { none: true }; n.id = ${JSON.stringify(id)}; n.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); return { ok: 1 };`);
try {
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 3000, 20)).ok, 1);
  const setup = await ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const live = () => !!(navigator.userActivation && navigator.userActivation.isActive);
    const H = window.__H = { shares: [], downloads: [], saves: [], clicks: [], timers: [] };
    H.reset = () => { H.shares.length = 0; H.downloads.length = 0; H.saves.length = 0; };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { const ok = live(); H.shares.push({ names: d.files.map((f) => f.name), live: ok });
      return ok ? Promise.resolve() : Promise.reject(new DOMException('Must be handling a user gesture to perform a share request.', 'NotAllowedError')); } });
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { H.downloads.push({ name: this.download, href: this.href, live: live() }); return; } return click.call(this); };
    window.addEventListener('click', (e) => H.clicks.push({ trusted: e.isTrusted, live: live() }), true);
    /* the facade's saves: the activation at that moment and the timers each sets (handOver's own URL revoke; no discard any more) */
    for (const [who, o] of [['film', __LW.captureUI.exact], ['picture', __LW.captureUI.capture]]) {
      const s = o.save; o.save = function (r) { const st = window.setTimeout, timers = [], l = live();
        window.setTimeout = (fn, ms, ...a) => { timers.push({ fn, ms: +ms || 0, a }); return 0; };
        try { return s.call(this, r); } finally { window.setTimeout = st; H.saves.push({ who, live: l, name: r && r.name, timers }); } }; }
    H.read = async (url) => { try { return (await (await fetch(url)).arrayBuffer()).byteLength; } catch (e) { return e.name; } };
    H.films = async () => { try { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('lambdawaves-recordings'); let n = 0; for await (const _ of d.keys()) n++; return n; } catch (_) { return 0; } };
    H.button = (text) => [...document.querySelectorAll('.dev[data-id="render"] button')].find((b) => b.textContent.trim().startsWith(text) && !b.disabled);
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle();
    __LW.layout.raise('render'); await new Promise((r) => setTimeout(r, 500));
    const C = __LW.render.view.controls, set = (f, v) => { f.value = v; f.dispatchEvent(new Event('change')); };
    set(C.motion, 'still'); set(C.recFormat, 'mp4'); set(C.recDuration, '1'); set(C.recSize, 'current');
    return { userActivation: !!navigator.userActivation, open: !document.querySelector('.dev[data-id="render"]').classList.contains('closed') };`);
  assert.equal(setup.userActivation, true, 'this Firefox has no navigator.userActivation');
  assert.equal(setup.open, true, 'the RENDER card did not open');

  /* ── 1 · a real RENDER tap, then a real SAVE tap: the card's save is inside the second tap → the share sheet; the facade downloads ── */
  assert.equal((await mark('fh-render', `() => __LW.render.view.controls.renderBtn`)).ok, 1);
  assert.equal((await g.tap('#fh-render')).ok, 1, 'the RENDER tap did not land');
  await until(`__LW.render.view.state().done && !__LW.render.view.state().running`, 240000);
  assert.equal((await mark('fh-save', `() => __H.button('SAVE ')`)).ok, 1, 'no SAVE row after the render');
  const n0 = await ev(`return { films: await __H.films() };`);
  assert.equal((await g.tap('#fh-save')).ok, 1, 'the SAVE tap did not land');
  const t1 = await ev(`await new Promise((r) => setTimeout(r, 400)); const st = __LW.render.view.state();
    return { done: st.done, shares: __H.shares.slice(), downloads: __H.downloads.length, click: __H.clicks.filter((c) => c.trusted).pop(), errs: __e.slice() };`);
  assert.ok(t1.click && t1.click.live, 'the SAVE press carried no activation: ' + JSON.stringify(t1.click));
  assert.equal(t1.shares.length, 1, 'a card SAVE inside a live tap did not share: ' + JSON.stringify(t1));
  assert.ok(t1.shares[0].live && /^lambdawaves-.*\.mp4$/.test(t1.shares[0].names[0]) && !/render\.mp4$/.test(t1.shares[0].names[0]), 'the shared film is not under λWAVES\' name (R10): ' + JSON.stringify(t1));
  assert.equal(t1.downloads, 0, 'a card SAVE inside a live tap also downloaded: ' + JSON.stringify(t1));
  const f1 = await ev(`__H.reset(); const r = await __LW.captureUI.record(); await new Promise((q) => setTimeout(q, 300)); const s = __H.saves.find((x) => x.who === 'film');
    return { ok: r && r.ok, save: s && { live: s.live, name: s.name, timers: s.timers.map((t) => t.ms) }, shares: __H.shares.length, downloads: __H.downloads.map((d) => ({ name: d.name, blob: d.href.startsWith('blob:') })), errs: __e.slice() };`);
  assert.equal(f1.ok, true, 'the facade record() did not finish: ' + JSON.stringify(f1));
  assert.equal(f1.save.live, false); assert.equal(f1.shares, 0, 'a scripted film took the share road: ' + JSON.stringify(f1));
  assert.ok(f1.downloads.length === 1 && f1.downloads[0].blob && f1.downloads[0].name === f1.save.name, 'a scripted film did not download: ' + JSON.stringify(f1));
  assert.deepEqual(t1.errs, []);
  pass(`a real RENDER tap, then a real SAVE tap → 1 share (${t1.shares[0].names[0]}), 0 downloads; the facade's record() with no tap → 1 download (${f1.downloads[0].name})`);

  /* ── 2 · no discard timer: the facade film's URL reads and its store copy stays until DISCARD STORED RENDER; DISCARD RENDER removes the card's ── */
  const t2a = await ev(`const url = __H.downloads[0].href, s = __H.saves.find((x) => x.who === 'film'); await __LW.render.view.paint(); await new Promise((r) => setTimeout(r, 600));
    return { at: await __H.read(url), films: await __H.films(), timers: s.timers.map((t) => t.ms), rows: [...document.querySelectorAll('.dev[data-id="render"] button')].map((b) => b.textContent.trim()).filter((x) => /STORED|DISCARD/.test(x)) };`);
  assert.ok(t2a.at > 0, 'the facade film URL does not read: ' + JSON.stringify(t2a));
  assert.ok(t2a.timers.every((ms) => ms === 600000), 'a save set a timer other than the hand-over URL\'s own revoke: ' + JSON.stringify(t2a));
  assert.ok(t2a.films >= 2 && t2a.rows.includes('DISCARD RENDER') && t2a.rows.some((x) => x === 'DISCARD STORED RENDER'), 'the store does not hold both films with their discard rows: ' + JSON.stringify(t2a));
  assert.equal((await mark('fh-discard', `() => __H.button('DISCARD RENDER')`)).ok, 1);
  assert.equal((await g.tap('#fh-discard')).ok, 1, 'the DISCARD RENDER tap did not land');
  const t2b = await ev(`await new Promise((r) => setTimeout(r, 800)); return { films: await __H.films(), done: __LW.render.view.state().done };`);
  assert.ok(t2b.films === t2a.films - 1 && !t2b.done, 'DISCARD RENDER did not remove the card film from the store: ' + JSON.stringify(t2b));
  assert.equal((await mark('fh-stored', `() => __H.button('DISCARD STORED RENDER')`)).ok, 1);
  assert.equal((await g.tap('#fh-stored')).ok, 1, 'the DISCARD STORED RENDER tap did not land');
  const t2c = await ev(`await new Promise((r) => setTimeout(r, 800)); return { films: await __H.films() };`);
  assert.equal(t2c.films, t2b.films - 1, 'DISCARD STORED RENDER did not remove the facade film: ' + JSON.stringify(t2c));
  pass(`no discard timer (the save's only timer is the hand-over URL's ${t2a.timers.join(', ')} ms); the URL read ${t2a.at} B with the copy kept; DISCARD RENDER ${t2a.films} → ${t2b.films}, DISCARD STORED RENDER → ${t2c.films}`);

  /* ── 3 · TAKE A PICTURE from a script: no activation → a download ── */
  const t3 = await ev(`await new Promise((r) => setTimeout(r, 6000)); __H.reset(); await __LW.captureUI.picture();   /* past the last tap's transient activation (5 s) */ await new Promise((r) => setTimeout(r, 400));
    const s = __H.saves.find((x) => x.who === 'picture');
    return { live: s && s.live, name: s && s.name, shares: __H.shares.length, downloads: __H.downloads.map((d) => d.name), errs: __e.slice() };`);
  assert.equal(t3.live, false);
  assert.equal(t3.shares, 0, 'a scripted picture took the share road: ' + JSON.stringify(t3));
  assert.deepEqual(t3.downloads, [t3.name], 'a scripted picture did not download: ' + JSON.stringify(t3));
  pass(`a scripted TAKE A PICTURE (no activation) → 1 download (${t3.name}), 0 shares`);

  /* ── 4 · CAPTURE IMAGE then DOWNLOAD IMAGE, both real taps: the save runs inside the second → the share sheet ── */
  await ev(`__H.reset(); return 1;`);
  assert.equal((await mark('fh-cap', `() => __H.button('CAPTURE IMAGE')`)).ok, 1);
  assert.equal((await g.tap('#fh-cap')).ok, 1, 'the CAPTURE IMAGE tap did not land');
  await until(`__LW.render.view.state().held`, 30000);
  assert.equal((await mark('fh-dl', `() => __H.button('DOWNLOAD IMAGE')`)).ok, 1);
  assert.equal((await g.tap('#fh-dl')).ok, 1, 'the DOWNLOAD IMAGE tap did not land');
  const t4 = await ev(`await new Promise((r) => setTimeout(r, 400)); return { held: __LW.render.view.state().held, shares: __H.shares.map((x) => ({ names: x.names, live: x.live })), downloads: __H.downloads.length, errs: __e.slice() };`);
  assert.equal(t4.shares.length, 1, 'DOWNLOAD IMAGE inside a live tap did not share: ' + JSON.stringify(t4));
  assert.ok(t4.shares[0].live && /\.png$/.test(t4.shares[0].names[0]), 'the shared picture: ' + JSON.stringify(t4));
  assert.equal(t4.downloads, 0, 'DOWNLOAD IMAGE inside a live tap also downloaded: ' + JSON.stringify(t4));
  assert.deepEqual(t4.errs, []);
  pass(`real taps on CAPTURE IMAGE (${t4.held.w} × ${t4.held.h}) then DOWNLOAD IMAGE → 1 share (${t4.shares[0].names[0]}), 0 downloads`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED film-handover' : 'GREEN film-handover');
process.exit(failed ? 1 : 0);
