/* pre.js — installed as the FIRST script of probes/D/lab-i/index.html: counters on the storage, JSON, canvas and
   layout-read APIs, so a probe can say how much of each the boot and a project open do.  No behaviour changes. */
(function () {
  performance.mark('html-start');
  const P = (window.__P = window.__P || { cnt: {}, t: {}, log: [] });
  const c = (k, dt) => { P.cnt[k] = (P.cnt[k] || 0) + 1; if (dt !== undefined) P.t[k] = (P.t[k] || 0) + dt; };
  const wrap = (obj, name, key, timed) => { const f = obj[name]; if (typeof f !== 'function') return;
    obj[name] = function (...a) { if (!timed) { c(key); return f.apply(this, a); } const t0 = performance.now(); try { return f.apply(this, a); } finally { c(key, performance.now() - t0); } }; };
  const S = Storage.prototype, gi = S.getItem, si = S.setItem;
  S.getItem = function (k) { const t0 = performance.now(); const v = gi.call(this, k); c('ls.get', performance.now() - t0); P.cnt['ls.getBytes'] = (P.cnt['ls.getBytes'] || 0) + (v ? v.length : 0); return v; };
  S.setItem = function (k, v) { const t0 = performance.now(); try { return si.call(this, k, v); } finally { c('ls.set', performance.now() - t0); c('ls.set:' + k); P.cnt['ls.setBytes'] = (P.cnt['ls.setBytes'] || 0) + String(v).length; } };
  wrap(JSON, 'parse', 'JSON.parse', true); wrap(JSON, 'stringify', 'JSON.stringify', true);
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, o) { c('getContext:' + type); return gc.call(this, type, o); };
  wrap(window, 'getComputedStyle', 'getComputedStyle', true);
  wrap(Element.prototype, 'getBoundingClientRect', 'getBoundingClientRect', true);
  /* the SLOW layout reads (a forced style/layout flush shows up as one read that costs milliseconds) */
  P.slow = [];
  const slowWrap = (obj, name, key) => { const d = Object.getOwnPropertyDescriptor(obj, name); if (!d) return;
    const timed = (f) => function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { const dt = performance.now() - t0; if (dt > 1 && P.slow.length < 80) P.slow.push([key, +t0.toFixed(1), +dt.toFixed(2), new Error().stack.split('\n').slice(1, 5).map((l) => l.replace(/^(.*?)@.*\/(lab-[a-z]|lab)\//, '$1@').replace(/:\d+$/, '')).join(' < ').slice(0, 260)]); } };
    if (d.get) Object.defineProperty(obj, name, { ...d, get: timed(d.get) }); else if (typeof d.value === 'function') obj[name] = timed(d.value); };
  slowWrap(Element.prototype, 'getBoundingClientRect', 'gBCR');
  slowWrap(CSSStyleDeclaration.prototype, 'getPropertyValue', 'cs.getPropertyValue');
  slowWrap(HTMLElement.prototype, 'offsetWidth', 'offsetWidth'); slowWrap(HTMLElement.prototype, 'offsetHeight', 'offsetHeight');
  slowWrap(Element.prototype, 'clientWidth', 'clientWidth'); slowWrap(Element.prototype, 'scrollHeight', 'scrollHeight');
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (t, o) { c('createElement'); return ce.call(this, t, o); };
  document.addEventListener('DOMContentLoaded', () => performance.mark('dcl'));
  if (document.fonts) document.fonts.ready.then(() => performance.mark('fonts-ready'));
})();
