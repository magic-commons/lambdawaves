/* inv.mjs — Lane C in-page probes, as function-body strings usable by gatekit's ev() (Firefox) and by CDP (wrapped
 * as `(async()=>{ BODY })()`).
 *   INVENTORY: every rendered element (and ::before/::after) whose computed backdrop-filter is not none, its area,
 *   plus counts of filter / will-change / contain / isolation / blurred box-shadows / running animations.
 *   MUTATIONS(ms): a MutationObserver over the whole document while the transport plays for `ms`; records per frame.
 */
export const INVENTORY = String.raw`
const vw = innerWidth, vh = innerHeight;
const short = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (el.classList && el.classList.length ? '.' + [...el.classList].slice(0, 3).join('.') : '');
const clipArea = (r) => { const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(vw, r.right), y1 = Math.min(vh, r.bottom); return x1 > x0 && y1 > y0 ? (x1 - x0) * (y1 - y0) : 0; };
/* the visible part of an element inside its scrolling rack (a rack clips its cards) */
const scrollClip = (el, r) => { const rk = el.closest && el.closest('#rack, #rackL, .m2run'); if (!rk) return clipArea(r); const c = rk.getBoundingClientRect();
  const x0 = Math.max(0, r.left, c.left), y0 = Math.max(0, r.top, c.top), x1 = Math.min(vw, r.right, c.right), y1 = Math.min(vh, r.bottom, c.bottom); return x1 > x0 && y1 > y0 ? (x1 - x0) * (y1 - y0) : 0; };
const bf = [], counts = { elements: 0, filter: 0, willChange: 0, containPaint: 0, isolate: 0, blurShadowEls: 0, blurShadowTerms: 0, textShadow: 0 };
const bfOf = (cs) => cs.backdropFilter && cs.backdropFilter !== 'none' ? cs.backdropFilter : (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none' ? cs.webkitBackdropFilter : null);
for (const el of document.querySelectorAll('body *')) {
  if (!el.getClientRects().length) continue;
  const cs = getComputedStyle(el);
  counts.elements++;
  const f = bfOf(cs);
  if (f && cs.visibility !== 'hidden') { const r = el.getBoundingClientRect(); bf.push({ el: short(el), f, w: Math.round(r.width), h: Math.round(r.height), onScreen: Math.round(clipArea(r)), visible: Math.round(scrollClip(el, r)), op: cs.opacity }); }
  if (el.matches('.crail-chip, .dev-head, .dev-body, #notebook, .glass')) for (const pe of ['::before', '::after']) { const pcs = getComputedStyle(el, pe); if (pcs.content === 'none' || pcs.content === 'normal') continue; const pf = bfOf(pcs); if (pf) { const w = parseFloat(pcs.width) || 0, h = parseFloat(pcs.height) || 0; bf.push({ el: short(el) + pe, f: pf, w: Math.round(w), h: Math.round(h), onScreen: Math.round(w * h), visible: Math.round(w * h) }); } }
  if (cs.visibility === 'hidden') continue;
  if (cs.filter && cs.filter !== 'none') counts.filter++;
  if (cs.willChange && cs.willChange !== 'auto') counts.willChange++;
  if (/paint|strict|content/.test(cs.contain || '')) counts.containPaint++;
  if (cs.isolation === 'isolate') counts.isolate++;
  if (cs.textShadow && cs.textShadow !== 'none') counts.textShadow++;
  if (cs.boxShadow && cs.boxShadow !== 'none') {
    const terms = cs.boxShadow.split(/,(?![^(]*\))/); let n = 0;
    for (const t of terms) { const L = t.replace(/(rgba?|color|oklab|oklch|hsla?)\([^)]*\)/g, '').match(/-?[\d.]+px/g) || []; if (L.length >= 3 && parseFloat(L[2]) > 0) n++; }
    if (n) { counts.blurShadowEls++; counts.blurShadowTerms += n; }
  }
}
const anims = document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.animationName || a.transitionProperty || a.constructor.name) + '@' + (a.effect && a.effect.target ? short(a.effect.target) : '?')) : null;
const body = document.body, sum = (k) => bf.reduce((s, x) => s + x[k], 0);
return { state: { card: body.dataset.card, theme: body.dataset.theme, frost: body.classList.contains('frost'), hold: body.classList.contains('frost-hold'), disc: body.classList.contains('disconnected'), uiHidden: body.classList.contains('ui-hidden'), tablet: body.classList.contains('tablet-motion'), open: document.querySelectorAll('.dev:not(.closed)').length, modwin: !!(window.__LW && __LW.mod && __LW.mod.open), vw, vh, dpr: devicePixelRatio },
  backdrop: { layers: bf.length, onScreenPx: sum('onScreen'), visiblePx: sum('visible'), screens: +(sum('onScreen') / (vw * vh)).toFixed(3), visibleScreens: +(sum('visible') / (vw * vh)).toFixed(3), list: bf },
  counts, anims };
`;

export const MUTATIONS = (ms = 3000) => String.raw`
const recs = new Map(); let n = 0, noop = 0;
const short = (el) => { if (!el || el.nodeType !== 1) { el = el && el.parentElement; } if (!el) return '?'; const dev = el.closest && el.closest('.dev, #transport, #modwin, #badges, #title, .kwin-chiprail'); const d = dev ? (dev.dataset && dev.dataset.id ? dev.dataset.id : dev.id || dev.className.split(' ')[0]) : 'other'; return d + ' ' + (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (el.classList && el.classList.length ? '.' + el.classList[0] : ''); };
const mo = new MutationObserver((list) => { for (const m of list) { n++; const key = m.type + (m.attributeName ? ':' + m.attributeName : '') + ' ' + short(m.target); if (m.type === 'attributes' && m.oldValue === m.target.getAttribute(m.attributeName)) noop++; recs.set(key, (recs.get(key) || 0) + 1); } });
mo.observe(document.documentElement, { subtree: true, attributes: true, attributeOldValue: true, characterData: true, childList: true });
const f0 = __LW.stats.frames; __LW.play(); await new Promise((r) => setTimeout(r, ${ms})); __LW.pause(); await new Promise((r) => setTimeout(r, 60));
mo.disconnect();
const frames = __LW.stats.frames - f0;
const top = [...recs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 45).map(([k, v]) => [k, +(v / Math.max(1, frames)).toFixed(2)]);
return { frames, records: n, perFrame: +(n / Math.max(1, frames)).toFixed(1), noopAttrPerFrame: +(noop / Math.max(1, frames)).toFixed(1), top };
`;
