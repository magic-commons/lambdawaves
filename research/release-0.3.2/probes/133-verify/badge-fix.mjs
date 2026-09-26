// VERIFIER PROBE · wave 133 — the collapsed build badge: screenshots as shipped, then a CANDIDATE fix injected as a <style> in the
// page (no file under lab/ is touched) and measured at the same sizes.  Candidate (two declarations in lab/lab.css):
//   #badges { left: min(calc(var(--rack-w) + 340px), calc(100% - var(--rack-w) - 266px)); }      — the row never narrower than 210 px
//   #offer::before { left: min(calc(100% - 12px), calc(50% + min(142px, 50vw - var(--rack-w) - 161px))); }   — the caret follows the row's centre
// Also the phone at a true 390 CSS px (window 500 device px at devPixelsPerPx 500/390, no window/rect call).
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/badge-fix.mjs
import { writeFileSync } from 'node:fs';
import { open } from '../../../../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8732;
const URL_ = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`;
const FIX = `#badges { left: min(calc(var(--rack-w) + 340px), calc(100% - var(--rack-w) - 266px)); }
#offer::before { left: min(calc(100% - 12px), calc(50% + min(142px, 50vw - var(--rack-w) - 161px))); }`;
const out = [];
const say = (k, v) => { out.push([k, v]); console.log(k, JSON.stringify(v)); };

const RAISE = `
  const w = (n) => new Promise((r) => setTimeout(r, n));
  try { await __LW.settle(); } catch (e) {}
  if (__LW.history.entries().length < 2) { __LW.loadPreset('2pz'); __LW.history.flush(); }
  __LW.pause(); const sw = __LW.sw; sw.reload = () => {}; sw.state = 'idle'; sw.offered = null; sw.pending = { build: 'probe-' + innerWidth };
  sw.buildReady(() => {}); await w(300); return 1;`;
const MEASURE = `
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
  const pane = document.getElementById('offer'), badge = document.querySelector('#badges > .badge.build'), span = badge.querySelector('span');
  const pr = pane.getBoundingClientRect(), br = badge.getBoundingClientRect();
  const caretX = pr.left + parseFloat(getComputedStyle(pane, '::before').left);
  const over = (a, b) => !!a && !!b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const hitAt = (x, y, e) => { const h = document.elementFromPoint(x, y); return !!h && (h === e || e.contains(h)); };
  const B = R(badge), T = R(document.getElementById('title')), TG = R(document.getElementById('rackToggle'));
  const visibleText = Math.min(span.scrollWidth, badge.clientWidth - 18 - 13);   /* padding 9+9, dot 7 + gap 6 */
  return { viewport: [innerWidth, innerHeight], phone: document.body.classList.contains('phone'), badgesBox: R(document.getElementById('badges')), badge: B, badgeW: Math.round(br.width),
    textNeeds: span.scrollWidth, textShownPx: Math.max(0, Math.round(visibleText)), readable: badge.clientWidth >= span.scrollWidth + 18 + 13 - 1,
    caretOffBy: Math.round((caretX - (br.left + br.width / 2)) * 10) / 10, overlapsTitle: over(B, T), overlapsToggle: over(B, TG),
    badgeHit: hitAt(br.left + br.width / 2, br.top + br.height / 2, badge), pane: R(pane) };`;

for (const [W, H] of [[1500, 1000], [1366, 1024], [1140, 800], [1024, 1366], [1000, 700]]) {
  let g = null;
  try {
    g = await open(URL_, { width: W, height: H, prefs: { 'privacy.reduceTimerPrecision': false } });
    await g.waitFor('window.__LW && __LW.ready', 400, 100);
    await g.ev(RAISE);
    const shipped = await g.ev(MEASURE);
    const png = await g.snap(); writeFileSync(new URL(`./badge-${W}x${H}-shipped.png`, import.meta.url), Buffer.from(png, 'base64'));
    await g.ev(`const s = document.createElement('style'); s.id = 'v133fix'; s.textContent = ${JSON.stringify(FIX)}; document.head.appendChild(s); await new Promise((r) => setTimeout(r, 200)); return 1;`);
    const fixed = await g.ev(MEASURE);
    const png2 = await g.snap(); writeFileSync(new URL(`./badge-${W}x${H}-candidate.png`, import.meta.url), Buffer.from(png2, 'base64'));
    say(`${W}×${H}`, { shipped, candidate: fixed });
  } catch (e) { say(`${W}×${H} ERROR`, String(e && e.stack || e)); }
  finally { if (g) await g.close(); }
}
/* the phone at a true 390 CSS px */
{
  let g = null;
  try {
    g = await open(URL_, { width: 500, height: 1082, prefs: { 'privacy.reduceTimerPrecision': false, 'layout.css.devPixelsPerPx': String(500 / 390) } });
    await g.waitFor('window.__LW && __LW.ready', 400, 100);
    await g.ev(RAISE);
    const m = await g.ev(MEASURE);
    const png = await g.snap(); writeFileSync(new URL('./badge-phone-shipped.png', import.meta.url), Buffer.from(png, 'base64'));
    say('phone', m);
  } catch (e) { say('phone ERROR', String(e && e.stack || e)); }
  finally { if (g) await g.close(); }
}
writeFileSync(new URL('./badge-fix.out.json', import.meta.url), JSON.stringify(out, null, 1));
