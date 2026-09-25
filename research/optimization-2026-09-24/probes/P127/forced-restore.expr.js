window.__F127='restore';
/* forced.expr.js — wave 127: which reads inside a project open force a style/layout flush.  Every layout-reading getter and
 * method on the prototypes is wrapped for the open's extent only; a read slower than 0.4 ms is recorded with its stack.
 * Playing, as the device report does; WAVE DANCER through the button's own road (importText → open). */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW;
  LW.pause(); await LW.settle(); await sleep(1500);
  const text = await (await fetch('demos/wave-dancer.lambdawaves.json')).text();
  const path = LW.projects.importText(text);
  LW.play(); await sleep(1500);
  const rec = [], undo = [];
  const wrapGet = (proto, key) => { const d = Object.getOwnPropertyDescriptor(proto, key); if (!d || !d.get) return;
    Object.defineProperty(proto, key, { configurable: true, enumerable: d.enumerable, get() { const t = performance.now(); const v = d.get.call(this); const dt = performance.now() - t; if (dt > 0.4) rec.push({ what: key, ms: +dt.toFixed(2), el: (this.id || this.className || this.tagName || '').toString().slice(0, 40), stack: new Error().stack.split('\n').slice(2, 7).map((s) => s.replace(/https?:\/\/[^/]+\/lab\//, '').trim()).join(' < ') }); return v; }, set: d.set });
    undo.push(() => Object.defineProperty(proto, key, d)); };
  const wrapFn = (proto, key) => { const f = proto[key]; if (typeof f !== 'function') return;
    proto[key] = function (...a) { const t = performance.now(); const v = f.apply(this, a); const dt = performance.now() - t; if (dt > 0.4) rec.push({ what: key + '()', ms: +dt.toFixed(2), el: (this.id || this.className || this.tagName || '').toString().slice(0, 40), stack: new Error().stack.split('\n').slice(2, 7).map((s) => s.replace(/https?:\/\/[^/]+\/lab\//, '').trim()).join(' < ') }); return v; };
    undo.push(() => { proto[key] = f; }); };
  const wrapAll = () => {
    for (const k of ['offsetWidth', 'offsetHeight', 'offsetTop', 'offsetLeft', 'offsetParent', 'innerText']) wrapGet(HTMLElement.prototype, k);
    for (const k of ['clientWidth', 'clientHeight', 'clientTop', 'clientLeft', 'scrollWidth', 'scrollHeight', 'scrollTop', 'scrollLeft']) wrapGet(Element.prototype, k);
    for (const k of ['getBoundingClientRect', 'getClientRects', 'scrollIntoView', 'checkVisibility']) wrapFn(Element.prototype, k);
    wrapFn(HTMLElement.prototype, 'focus'); wrapFn(CSSStyleDeclaration.prototype, 'getPropertyValue'); };
  wrapAll();
  /* window.__F127 === 'restore': open the demo unwrapped first, then record the restore of the state as found (the report's second half) */
  const found = JSON.parse(JSON.stringify(LW.serialize()));
  if (window.__F127 === 'restore') { for (let i = undo.length - 1; i >= 0; i--) undo[i](); LW.projects.open(path); await sleep(1500); undo.length = 0; rec.length = 0; wrapAll(); }
  const t0 = performance.now();
  const ok = window.__F127 === 'restore' ? LW.restore(found) : LW.projects.open(path);
  const sync = performance.now() - t0;
  for (let i = undo.length - 1; i >= 0; i--) undo[i]();
  const t1 = performance.now(); void document.body.offsetHeight; const sl = performance.now() - t1;
  await sleep(500);
  const total = rec.reduce((a, r) => a + r.ms, 0);
  return { ok, syncMs: +sync.toFixed(1), afterStyleLayoutMs: +sl.toFixed(1), forcedMs: +total.toFixed(1), n: rec.length, rec };
})()
