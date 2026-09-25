/* demo-click.expr.js — wave 127: the demo button's road from the CLICK to projects.importText, split by Resource Timing.
 * The iPad's report read importText.afterClickMs 1004 (25.7 KB): is that the fetch or code?  Playing, as the report does:
 * the button is clicked, importText/open are wrapped only to stamp their call time, and the demo file's PerformanceResourceTiming
 * gives the network phases (worker, connect, TLS, request → first byte → last byte) relative to the click. */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW, P = LW.projects, r1 = (x) => (Number.isFinite(x) ? +x.toFixed(1) : x);
  LW.pause(); await LW.settle(); await sleep(800);
  const nb = document.getElementById('notebook'); nb.hidden = false;
  const btn = document.querySelector('#notebook .pj-demo[data-file="wave-dancer"]');
  performance.clearResourceTimings();
  LW.play(); await sleep(1500);
  const oi = P.importText, oo = P.open; let tImport = null, tOpen = null, tOpenEnd = null;
  P.importText = function (t) { tImport = performance.now(); return oi.call(this, t); };
  P.open = function (p) { tOpen = performance.now(); const r = oo.call(this, p); tOpenEnd = performance.now(); return r; };
  const t0 = performance.now();
  btn.click();
  const tClickSync = performance.now() - t0;
  for (let i = 0; i < 200 && tOpenEnd === null; i++) await sleep(25);
  P.importText = oi; P.open = oo;
  const e = performance.getEntriesByType('resource').filter((x) => /wave-dancer/.test(x.name)).pop();
  const rel = (x) => (e && x ? r1(x - t0) : null);
  const out = { clickSyncMs: r1(tClickSync), importTextAfterClickMs: r1(tImport - t0), openAfterClickMs: r1(tOpen - t0), openSyncMs: r1(tOpenEnd - tOpen),
    resource: e ? { name: e.name.replace(/^https?:\/\/[^/]+/, ''), protocol: e.nextHopProtocol, fetchStart: rel(e.fetchStart), workerStart: rel(e.workerStart), connectStart: rel(e.connectStart), secureConnectionStart: rel(e.secureConnectionStart), connectEnd: rel(e.connectEnd),
      requestStart: rel(e.requestStart), responseStart: rel(e.responseStart), responseEnd: rel(e.responseEnd), transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, durationMs: r1(e.duration) } : null,
    afterResponseToImportMs: e ? r1(tImport - e.responseEnd) : null, swControlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller) };
  const path = P.current; LW.pause();
  if (path) { P.remove(path); P.markClean(); }
  return out;
})()
