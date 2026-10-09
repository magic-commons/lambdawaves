/* tools/perf/handover-probe.mjs (0.5.0 C7 · the hand-over fix) — which road a finished file takes: the share sheet or an
 * `<a download>`.  film-probe.mjs stubs the hand-over away; this probe is the one that runs it.  Firefox on Linux has no
 * navigator.share, so the probe STUBS navigator.share / canShare (a share outside a live activation rejects with
 * NotAllowedError, as Chrome, Edge and Safari do) and COUNTS anchor downloads instead of making them.  Three hand-overs:
 *   film     EXPORT FRAMES (25 frames, ~4 s of rendering): the activation is spent long before the save
 *   picture  TAKE A PICTURE from a script (a WebDriver script carries no activation): spent
 *   tap      TAKE A PICTURE from a real pointer press on a stand-in button: live (Firefox keeps an activation 5 s)
 * Each row: navigator.userActivation.isActive at the save, the shares, the downloads.  Nothing is written to disk.
 *   LW_PORT=8863 GD_PORT=5333 node tools/perf/handover-probe.mjs [out.json]
 */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
const PORT = process.env.LW_PORT || '8813';
const OUT = process.argv[2] || null;
const g = await open(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, { width: 1400, height: 900, script: 900000,
  prefs: { 'privacy.reduceTimerPrecision': false, 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const res = {};
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  res.env = await g.ev(`
    try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const live = () => !!(navigator.userActivation && navigator.userActivation.isActive);
    const H = window.__H = { shares: [], downloads: [], saves: [] };
    const env = { nativeShare: typeof navigator.share, userActivation: !!navigator.userActivation, ua: navigator.userAgent };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => {
      const ok = live(); H.shares.push({ names: d.files.map((f) => f.name), live: ok });
      return ok ? Promise.resolve() : Promise.reject(new DOMException('the activation is spent', 'NotAllowedError')); } });
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { H.downloads.push({ name: this.download, live: live(), blobUrl: this.href.startsWith('blob:') }); return; }
      return click.call(this); };
    for (const [who, o] of [['film', __LW.captureUI.exact], ['picture', __LW.captureUI.capture]]) {
      const s = o.save; o.save = function (r) { H.saves.push({ who, live: live() }); return s.call(this, r); }; }
    __LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle();
    const b = document.createElement('button'); b.id = 'hp-tap'; b.textContent = 'PICTURE';
    Object.assign(b.style, { position: 'fixed', left: '40px', bottom: '40px', zIndex: 2147483647, width: '120px', height: '48px' });
    b.addEventListener('click', () => { H.tapped = __LW.captureUI.picture(); });
    document.body.appendChild(b);
    return env;`);
  const reset = () => g.ev(`__H.shares.length = 0; __H.downloads.length = 0; __H.saves.length = 0; __H.tapped = null; return true;`);
  const collect = () => g.ev(`await new Promise((r) => setTimeout(r, 400));   /* a rejected share lands */
    return { saves: __H.saves.slice(), shares: __H.shares.length, downloads: __H.downloads.length, detail: { shares: __H.shares.slice(), downloads: __H.downloads.slice() } };`);
  const row = (name, x) => { res[name] = x; console.log(name.padEnd(8), 'live at save', JSON.stringify((x.saves || []).map((s) => s.live)), '· shares', x.shares, '· downloads', x.downloads, x.E ? '· ' + x.E : ''); };
  await reset();
  const film = await g.ev(`const r = await __LW.captureUI.exportFrames({ fps: 24, seconds: 1, scale: 1 }); return { ok: r.ok, message: r.message, files: r.files && r.files.length };`);
  row('film', Object.assign({ result: film }, await collect()));
  await reset();
  await g.ev(`await __LW.captureUI.picture(); return true;`);
  row('picture', await collect());
  await reset();
  const t = await g.tap('#hp-tap');
  await g.waitFor('window.__H.tapped', 100, 50);
  await g.ev(`await __H.tapped; return true;`);
  row('tap', Object.assign({ tap: t }, await collect()));
  res.errors = await g.ev(`return (window.__e || []).slice(0, 5);`);
} finally { await g.close(); }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
