// VERIFIER PROBE · wave 133 — THE PANE AND THE BADGE at the sizes that matter.  Automation mode; the offer is raised the way a
// touched session gets it (LW.sw.buildReady after an edit).  At each viewport: the build badge's box and text (and whether its text
// is clipped), the caret's x against the badge's centre, overlap with + / ☆ / the hide toggle / the menubar / the title chip,
// elementFromPoint at UPDATE, LATER and the badge, and whether the pane is in the field's occlusion list while paused.
// Phone: headless Firefox floors windows at 500 CSS px, so 390 × 844 is reached with layout.css.devPixelsPerPx = 500/390.
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/pane-sizes.mjs
import { writeFileSync } from 'node:fs';
import { open } from '../../../../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8732, GD = process.env.GD_PORT || 5232;
const URL_ = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`;
const SIZES = [[1500, 1000], [1366, 1024], [1024, 1366], [1140, 800], [1000, 700], [390, 844, 'phone']];
const out = [];
const say = (k, v) => { out.push([k, v]); console.log(k, JSON.stringify(v)); };

const MEASURE = `
  const w = (n) => new Promise((r) => setTimeout(r, n));
  await __LW.settle();
  /* a touched session: one edit, so buildReady offers instead of taking */
  if (__LW.history.entries().length < 2) { __LW.loadPreset('2pz'); __LW.history.flush(); }
  let masks = null; const f = __LW.field, so = f.setOcclusion; f.setOcclusion = function (rects) { masks = rects.map((r) => r.slice()); return so.call(f, rects); };
  __LW.pause(); const sw = __LW.sw; sw.reload = () => {}; sw.state = 'idle'; sw.offered = null; sw.pending = { build: 'probe-' + innerWidth };
  sw.buildReady(() => { window.__took = 1; });
  await w(80); await __LW.settle(); await w(400); await __LW.settle();
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
  const pane = document.getElementById('offer'), badge = document.querySelector('#badges > .badge.build'), span = badge.querySelector('span');
  const pr = pane.getBoundingClientRect(), br = badge.getBoundingClientRect();
  const before = getComputedStyle(pane, '::before');
  const caretX = pr.left + parseFloat(before.left);            /* translateX(-50%) centres the square on its left edge */
  const hit = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const h = document.elementFromPoint(x, y); return { ok: !!h && (h === e || e.contains(h)), by: h ? (h.id || String(h.className).slice(0, 30) || h.tagName) : null }; };
  const btn = (l) => [...pane.querySelectorAll('.offer-row .trig')].find((b) => b.textContent.trim() === l);
  const over = (a, b) => !!a && !!b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const P = R(pane);
  const others = {}; for (const id of ['rackToggle', 'rackAdd', 'rackFav', 'menubar', 'title', 'transport', 'rack', 'rackL']) { const e = document.getElementById(id); const r = e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 ? R(e) : null; others[id] = { rect: r, overlapped: over(P, r) }; }
  const cb = document.getElementById('field').getBoundingClientRect();
  const want = [pr.left - cb.left, pr.top - cb.top, pr.right - cb.left, pr.bottom - cb.top];
  return { viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, phone: document.body.classList.contains('phone'), took: !!window.__took, state: sw.state,
    paneShown: !pane.hidden && pr.width > 0, pane: P, badgesBox: R(document.getElementById('badges')),
    badge: { rect: R(badge), w: Math.round(br.width), text: span.textContent, clipped: span.scrollWidth > span.clientWidth + 1, spanW: span.clientWidth, spanScrollW: span.scrollWidth, lines: Math.round(br.height / 14) },
    caret: { x: Math.round(caretX * 10) / 10, badgeCentre: Math.round((br.left + br.width / 2) * 10) / 10, offBy: Math.round((caretX - (br.left + br.width / 2)) * 10) / 10, insideBadge: caretX > br.left && caretX < br.right },
    hits: { UPDATE: hit(btn('UPDATE')), LATER: hit(btn('LATER')), badge: hit(badge) }, others,
    masked: (masks || []).some((r) => r.every((n, i) => Math.abs(n - want[i]) < 1.5)), maskCount: masks ? masks.length : null };`;

for (const [W, H, kind] of SIZES) {
  const phone = kind === 'phone';
  const scale = phone ? 500 / W : 1;
  const winW = Math.round(W * scale), winH = Math.round(H * scale);
  let g = null;
  try {
    g = await open(URL_, { width: winW, height: winH, prefs: Object.assign({ 'privacy.reduceTimerPrecision': false }, phone ? { 'layout.css.devPixelsPerPx': String(scale) } : {}) });
    await fetch(`http://127.0.0.1:${GD}/session/${g.s}/window/rect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ width: winW, height: winH }) });
    await g.waitFor('window.__LW && __LW.ready', 400, 100);
    const m = await g.ev(MEASURE);
    say(`${W}×${H}${phone ? ' phone' : ''}`, m);
  } catch (e) { say(`${W}×${H} ERROR`, String(e && e.stack || e)); }
  finally { if (g) await g.close(); }
}
writeFileSync(new URL('./pane-sizes.out.json', import.meta.url), JSON.stringify(out, null, 1));
