// 0.5.0 C7 · THE HAND-OVER (the film verifier's condition 3): a finished file reaches the person on a browser that shares files.
// Linux Firefox has no navigator.share, so the page gets the Web Share rule as a stub — canShare permissive (Safari's), share()
// outside a live activation rejected with NotAllowedError (Chrome's and Safari's) — and every <a download> is COUNTED, not
// followed.  The timers the hand-over sets are caught and run on a virtual clock, so no scene waits minutes.
//   1  a REAL tap on RECORD: about 37 s later film.save runs with the activation spent → 1 download (a blob URL), 0 shares
//   2  that URL still reads past the old 2-minute discard: the store's copy outlives the hand-over's URL; after both
//      lifetimes the URL is revoked and the film's directory has left OPFS
//   3  TAKE A PICTURE from a script (no activation) → 1 download, 0 shares
//   4  a REAL tap on TAKE A PICTURE (its save inside the tap's activation) → 1 share, 0 downloads
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
try {
  assert.equal((await g.waitFor('window.__LW && __LW.ready', 3000, 20)).ok, 1);
  const setup = await ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const live = () => !!(navigator.userActivation && navigator.userActivation.isActive);
    const H = window.__H = { shares: [], downloads: [], saves: [], clicks: [] };
    H.reset = () => { H.shares.length = 0; H.downloads.length = 0; H.saves.length = 0; };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { const ok = live(); H.shares.push({ names: d.files.map((f) => f.name), live: ok });
      return ok ? Promise.resolve() : Promise.reject(new DOMException('Must be handling a user gesture to perform a share request.', 'NotAllowedError')); } });
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download) { H.downloads.push({ name: this.download, href: this.href, live: live() }); return; } return click.call(this); };
    window.addEventListener('click', (e) => H.clicks.push({ trusted: e.isTrusted, live: live() }), true);
    /* each save: the activation at that moment, and the timers it sets, held for the virtual clock */
    for (const [who, o] of [['film', __LW.captureUI.exact], ['picture', __LW.captureUI.capture]]) {
      const s = o.save; o.save = function (r) { const st = window.setTimeout, timers = [], l = live();
        window.setTimeout = (fn, ms, ...a) => { timers.push({ fn, ms: +ms || 0, a }); return 0; };
        try { return s.call(this, r); } finally { window.setTimeout = st; H.saves.push({ who, live: l, name: r && r.name, timers }); } }; }
    H.run = async (upTo) => { const due = H.saves.flatMap((s) => s.timers).filter((t) => !t.done && t.ms <= upTo).sort((a, b) => a.ms - b.ms);
      for (const t of due) { t.done = true; await t.fn(...t.a); } return due.map((t) => t.ms); };
    H.read = async (url) => { try { return (await (await fetch(url)).arrayBuffer()).byteLength; } catch (e) { return e.name; } };
    H.films = async () => { try { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('lambdawaves-recordings'); let n = 0; for await (const _ of d.keys()) n++; return n; } catch (_) { return 0; } };
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle();
    const S = document.querySelector('.dev[data-id="camera"]'); S.classList.remove('closed'); if (S.classList.contains('folded')) S.querySelector('.dev-fold').click();
    const rec = [...S.querySelectorAll('[data-render-cancel]')].find((b) => /RECORD/.test(b.textContent)), pic = [...S.querySelectorAll('.trig, button')].find((b) => /TAKE A PICTURE/.test(b.textContent));
    rec.id = 'fh-rec'; pic.id = 'fh-pic'; rec.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300));
    return { share: 'stubbed', userActivation: !!navigator.userActivation };`);
  assert.equal(setup.userActivation, true, 'this Firefox has no navigator.userActivation');

  /* ── 1 · RECORD by a real tap: the film's save comes with the activation spent, and DOWNLOADS ── */
  assert.equal((await g.tap('#fh-rec')).ok, 1, 'the RECORD tap did not land');
  await until(`__H.saves.some((s) => s.who === 'film') && !__LW.captureUI.busy`, 240000);
  const t1 = await ev(`await new Promise((r) => setTimeout(r, 400)); const s = __H.saves.find((x) => x.who === 'film');
    return { click: __H.clicks.find((c) => c.trusted), save: { live: s.live, name: s.name, timers: s.timers.map((t) => t.ms) }, shares: __H.shares.length, downloads: __H.downloads.map((d) => ({ name: d.name, blob: d.href.startsWith('blob:') })), errs: __e.slice() };`);
  assert.ok(t1.click && t1.click.trusted && t1.click.live, 'the RECORD press carried no activation: ' + JSON.stringify(t1.click));
  assert.equal(t1.save.live, false, 'the film was saved inside the activation (it should be spent ~37 s later): ' + JSON.stringify(t1));
  assert.equal(t1.shares, 0, 'a film with the activation spent took the share road (it is lost there): ' + JSON.stringify(t1));
  assert.equal(t1.downloads.length, 1, 'a film with the activation spent did not download: ' + JSON.stringify(t1));
  assert.ok(t1.downloads[0].blob && /\.mp4$/.test(t1.downloads[0].name) && t1.downloads[0].name === t1.save.name, 'the download is not the film: ' + JSON.stringify(t1));
  assert.deepEqual(t1.errs, []);
  pass(`a real RECORD tap (activation live at the press) → film.save with the activation spent → 1 download (${t1.downloads[0].name}), 0 shares; timers ${JSON.stringify(t1.save.timers)} ms`);

  /* ── 2 · the hand-over's URL dies by its own revoke, never by the store's discard (the old discard ran at 2 minutes under a
     video's 10-minute URL): the save's timers run in delay order, the URL read and the store counted around each ── */
  const t2 = await ev(`const url = __H.downloads[0].href, n0 = await __H.films(), at0 = await __H.read(url), steps = [];
    for (const t of __H.saves.flatMap((s) => s.timers).filter((t) => !t.done).sort((a, b) => a.ms - b.ms)) {
      t.done = true; const n = await __H.films(); await t.fn(...t.a); await new Promise((r) => setTimeout(r, 100));
      steps.push({ ms: t.ms, url: await __H.read(url), left: n - await __H.films() }); }
    return { n0, at0, steps, n1: await __H.films() };`);
  const dead = t2.steps.findIndex((x) => x.url !== t2.at0);
  assert.ok(t2.at0 > 0, 'the film URL does not read at the hand-over: ' + JSON.stringify(t2));
  assert.ok(dead >= 0 && t2.steps[dead].left === 0, 'the film URL died with the store\'s copy (the discard ran inside the URL\'s lifetime): ' + JSON.stringify(t2));
  assert.ok(t2.steps.slice(0, dead).every((x) => x.url === t2.at0) && t2.steps.every((x) => x.ms > 125000 || x.url === t2.at0), 'the URL did not read until its revoke: ' + JSON.stringify(t2));
  assert.ok(t2.n0 >= 1 && t2.n1 === t2.n0 - 1 && t2.steps.some((x) => x.left === 1), 'the film\'s directory did not leave OPFS after the URL: ' + JSON.stringify(t2));
  pass(`the URL read ${t2.at0} B from the hand-over until its revoke at ${t2.steps[dead].ms} ms; the store's copy left at ${t2.steps.find((x) => x.left === 1).ms} ms (${t2.n0} → ${t2.n1}); steps ${JSON.stringify(t2.steps)}`);

  /* ── 3 · TAKE A PICTURE from a script: no activation → a download ── */
  const t3 = await ev(`__H.reset(); await __LW.captureUI.picture(); await new Promise((r) => setTimeout(r, 400)); await __H.run(Infinity);
    const s = __H.saves.find((x) => x.who === 'picture');
    return { live: s && s.live, name: s && s.name, shares: __H.shares.length, downloads: __H.downloads.map((d) => d.name), errs: __e.slice() };`);
  assert.equal(t3.live, false);
  assert.equal(t3.shares, 0, 'a scripted picture took the share road: ' + JSON.stringify(t3));
  assert.deepEqual(t3.downloads, [t3.name], 'a scripted picture did not download: ' + JSON.stringify(t3));
  pass(`a scripted TAKE A PICTURE (no activation) → 1 download (${t3.name}), 0 shares`);

  /* ── 4 · TAKE A PICTURE by a real tap: its save is inside the activation → the share sheet ── */
  await ev(`__H.reset(); document.getElementById('fh-pic').scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); return 1;`);
  assert.equal((await g.tap('#fh-pic')).ok, 1, 'the TAKE A PICTURE tap did not land');
  await until(`__H.saves.some((s) => s.who === 'picture')`, 30000);
  const t4 = await ev(`await new Promise((r) => setTimeout(r, 400)); await __H.run(Infinity); const s = __H.saves.find((x) => x.who === 'picture');
    return { live: s.live, name: s.name, shares: __H.shares.map((x) => ({ names: x.names, live: x.live })), downloads: __H.downloads.length, errs: __e.slice() };`);
  assert.equal(t4.live, true, 'the picture\'s save was not inside the tap\'s activation: ' + JSON.stringify(t4));
  assert.equal(t4.shares.length, 1, 'a picture saved inside a live tap did not share: ' + JSON.stringify(t4));
  assert.deepEqual(t4.shares[0].names, [t4.name]);
  assert.equal(t4.downloads, 0, 'a picture saved inside a live tap also downloaded: ' + JSON.stringify(t4));
  assert.deepEqual(t4.errs, []);
  pass(`a real TAKE A PICTURE tap → saved inside the activation → 1 share (${t4.name}), 0 downloads`);
} catch (e) {
  failed = true; console.error(e);
} finally {
  await g.close();
}
console.log(failed ? 'RED film-handover' : 'GREEN film-handover');
process.exit(failed ? 1 : 0);
