/* m5-info.probe.js — A0 spike PASS 2 (Opus, 2026-10-08): the INFORMATIONAL on a device, through the kit's remote probe
 * (MIR 1.5 tools/probe.mjs; docs/PROBE.md).  Run: node <kit>/tools/probe.mjs run latest research/release-0.5.0/canary-a0/m5-info.probe.js --timeout 120000
 * against an ADOPTED copy (lab/mir/info/ must exist) served by `probe.mjs serve`.  Below: pass 2's page kit (spike-page.js), then the run. */
// spike-page.js — runs IN THE PAGE (injected by spike-lib.mjs).  Mounts the kit's createInfoLayer over the lab's stage.
window.__spikeInit = async function () {
  if (window.__spike) return 'again';
  const [L, F, MOL, FR] = await Promise.all([import('/lab/mir/info/layer.js'), import('/lab/field.js'), import('/lab/molecules.js'), import('/lab/mir/core/frame.js')]);
  for (const href of ['/lab/mir/info/faces.css', '/lab/mir/info/info.css']) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
    await new Promise((r) => { l.onload = r; l.onerror = r; });
  }
  const canvas = document.getElementById('field'), host = document.getElementById('stage'), obs = __LW.obs;
  /* the kit's one frame, timed: every read / write / coalesced callback that goes through it (the layer's frame work) */
  const acc = { read: 0, write: 0, coalesce: 0, nread: 0, nwrite: 0, ncoalesce: 0 };
  for (const name of ['read', 'write', 'coalesce']) {
    const o = FR.frame[name].bind(FR.frame);
    FR.frame[name] = name === 'coalesce'
      ? (key, fn, ...r) => o(key, (t) => { const s = performance.now(); try { return fn(t); } finally { acc.coalesce += performance.now() - s; acc.ncoalesce++; } }, ...r)
      : (fn, ...r) => o((t) => { const s = performance.now(); try { return fn(t); } finally { acc[name] += performance.now() - s; acc['n' + name]++; } }, ...r);
  }
  let pKey = '', pS = null;
  /* PASS 2 (Opus): with window.__spikeCached the canvas size is read once and on resize (a ResizeObserver), as an app that knows
     its own canvas would; without it, proj() reads clientWidth/clientHeight every call (pass 1), which forces a style recalc
     and layout after the layer's writes */
  let cW = canvas.clientWidth, cH = canvas.clientHeight;
  new ResizeObserver(() => { cW = canvas.clientWidth; cH = canvas.clientHeight; }).observe(canvas);
  const proj = () => {
    const W = window.__spikeCached ? cW : canvas.clientWidth, H = window.__spikeCached ? cH : canvas.clientHeight, k = F.cameraKey(obs) + '|' + obs.dist + '|' + obs.fov + '|' + __LW.domain.half + '|' + W + 'x' + H;
    if (k !== pKey) { pKey = k; pS = F.toScreen(obs, __LW.domain.half, W, H); }
    return pS;
  };
  const S = window.__spike = { L, F, MOL, acc, layer: null, items: [], hook: { on: false, calls: 0, ms: 0 }, avoidSets: 'none' };
  S.points = (id, n) => {
    const atoms = MOL.moleculeAtoms(id), pts = atoms.map((a) => [a.x, a.y, a.z, a.Z]);
    for (let i = atoms.length; i < n; i++) { const a = atoms[i % atoms.length], t = i * 2.4; pts.push([a.x + 2.2 * Math.cos(t), a.y + 2.2 * Math.sin(t), a.z + ((i % 3) - 1) * 1.3, 0]); }
    return pts.slice(0, Math.max(n, 0));
  };
  S.anchorAt = (p) => () => { const q = proj().at(p[0], p[1], p[2]); return q ? { x: q[0], y: q[1], r: 7 } : null; };
  const SYM = { 1: 'H', 6: 'C', 7: 'N', 8: 'O' };
  /** make(opts): destroy any layer, mount a fresh one over the canvas, add a block and n labels; resolves once the entrances ran */
  S.make = async ({ n = 0, pane = false, id = 'H2O', block = true, title = null, avoid = null, md = null, pts: customPts = null, labels: customLabels = null } = {}) => {
    S.stop(); if (S.layer) { try { S.layer.destroy(); } catch (_) {} S.layer = null; }
    const layer = S.layer = L.createInfoLayer({ stage: canvas, host, pane, subject: null, avoid });
    S.items = [];
    if (block) S.items.push(layer.addBlock({ md: md || '# Water\nA bent molecule, $\\mathrm{H_2O}$: two lone pairs on oxygen.\n\n$$E = \\sum_i n_i\\,\\varepsilon_i$$', pane }));
    const pts = customPts || S.points(id, n);
    for (let i = 0; i < pts.length; i++) S.items.push(layer.addLabel({ anchor: S.anchorAt(pts[i]), title: customLabels ? customLabels[i].title : (SYM[pts[i][3]] || '·') + ' ' + (i + 1), md: customLabels ? customLabels[i].md : 'A label with maths, $Z = ' + (pts[i][3] || 0) + '$, at the nucleus.' }));
    await new Promise((r) => setTimeout(r, 1800));
    layer.viewChanged();
    await new Promise((r) => setTimeout(r, 1200));
    return { labels: layer.root.querySelectorAll('.mir-info-label').length, blocks: layer.root.querySelectorAll('.mir-info-block').length };
  };
  /** the app calls viewChanged() only when cameraKey changes (one rAF check) */
  S.start = () => {
    const h = S.hook; h.on = true; h.calls = 0; h.ms = 0; let last = '';
    const loop = () => { if (!h.on) return; const k = proj() && pKey; if (k !== last) { last = k; if (S.layer) { const t0 = performance.now(); S.layer.viewChanged(); h.ms += performance.now() - t0; h.calls++; } } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  S.stop = () => { S.hook.on = false; };
  S.reset = () => { for (const k of Object.keys(acc)) acc[k] = 0; S.hook.calls = 0; S.hook.ms = 0; };
  S.snapshot = () => ({ acc: { ...acc }, hook: { calls: S.hook.calls, ms: S.hook.ms }, stats: { frames: __LW.stats.frames, presents: __LW.stats.presents, skipped: __LW.stats.skipped },
    mir: (window.__MIR && __MIR.perf) ? __MIR.perf.snapshot() : null, field: { ok: !!(__LW.field && __LW.field.ok) } });
  S.destroy = () => { S.stop(); if (S.layer) { try { S.layer.destroy(); } catch (_) {} S.layer = null; } };
  /** the viewport rects a label could be hidden under: the two rack columns showing a window, the transport bar, the floating windows */
  S.keepClear = () => {
    const out = [];
    const take = (el, name) => { if (!el) return; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return; const r = el.getBoundingClientRect(); if (r.width > 1 && r.height > 1) out.push({ name, left: r.left, top: r.top, right: r.right, bottom: r.bottom }); };
    for (const id of ['rack', 'rackL']) { const el = document.getElementById(id); if (el && el.querySelector('.dev')) take(el, '#' + id); }
    take(document.getElementById('transport'), '#transport');
    const fl = document.getElementById('floats'); if (fl) for (const c of fl.children) take(c, '#floats>' + (c.id || c.className));
    return out;
  };
  S.meets = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  return 'ok';
};

/* ── the run (the body of the probe's async function; `probe` is its one argument) ──────────────────────────────────────────
   On the device: water's HOMO under AUTO-ROTATE, 10 s with no words, then 10 s with the kit's layer (8 bare labels + 1 block,
   viewChanged() only on a cameraKey change); the display's frames (probe.frames) and the app's presents for each window. */
await window.__spikeInit();
const c = __LW.chem; await c.solve('H2O'); c.setOn(true); c.setView('orbital'); c.orbital(c.state().nocc); await __LW.settle();
__LW.camera.setAutoRotate(true);
const ms = 10000, f = __LW.field || {};
const out = { ua: navigator.userAgent, touch: navigator.maxTouchPoints, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight],
  field: { ok: !!f.ok, error: f.error ? String(f.error) : null, adapter: f.adapterInfo ? (f.adapterInfo.description || f.adapterInfo.vendor || null) : null } };
let p0 = __LW.stats.presents; out.none = await probe.frames(ms); out.none.presentsPerS = +((__LW.stats.presents - p0) / (ms / 1000)).toFixed(1);
out.made = await __spike.make({ n: 8 }); __spike.start(); __spike.reset();
p0 = __LW.stats.presents; out.bare8 = await probe.frames(ms); out.bare8.presentsPerS = +((__LW.stats.presents - p0) / (ms / 1000)).toFixed(1);
const s = __spike.snapshot(); out.bare8.layerFrameMsPerS = +((s.acc.read + s.acc.write + s.acc.coalesce) / (ms / 1000)).toFixed(2); out.bare8.viewChangedCalls = s.hook.calls;
__spike.destroy(); __LW.camera.setAutoRotate(false);
return out;
