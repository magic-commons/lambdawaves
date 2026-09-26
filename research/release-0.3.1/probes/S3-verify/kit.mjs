// S3 VERIFIER kit (fresh context): open the lab on the gate server, install page helpers, and drive REAL WebDriver pointers.
//   LW_PORT=8745 GD_PORT=5245 node research/release-0.3.1/probes/S3-verify/<probe>.mjs
import { open } from '../../../../tools/gate/gatekit.mjs';
import { actions, relActions } from '../../../../tools/gate/drv.mjs';

export const LAB = `https://127.0.0.1:${process.env.LW_PORT || 8745}/lab/`;
const PREFS = { 'privacy.reduceTimerPrecision': false };

export async function lab(url = LAB, size = { width: 1500, height: 1000 }) {
  const g = await open(url, { ...size, script: 300000, prefs: PREFS });
  const r = await g.waitFor('window.__LW&&__LW.ready', 300, 100);
  if (!r.ok) throw new Error('not ready');
  await g.ev(HELPERS);
  let n = 0;
  /** a real pointer gesture: a list of [x, y] points, pressed with `button` (0 left, 2 right) */
  g.realDrag = async (pts, button = 0, gap = 30, mods = []) => {
    const a = [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: Math.round(pts[0][0]), y: Math.round(pts[0][1]) }, { type: 'pointerDown', button }];
    for (const [x, y] of pts.slice(1)) a.push({ type: 'pointerMove', duration: gap, origin: 'viewport', x: Math.round(x), y: Math.round(y) });
    a.push({ type: 'pointerUp', button });
    const seq = [{ type: 'pointer', id: 'vp' + (++n), parameters: { pointerType: 'mouse' }, actions: a }];
    if (mods.length) {
      const k = [...mods.map((m) => ({ type: 'keyDown', value: m }))]; while (k.length < a.length) k.push({ type: 'pause', duration: 0 });
      seq.push({ type: 'key', id: 'vk' + n, actions: [...k, ...mods.map((m) => ({ type: 'keyUp', value: m }))] });
      while (seq[0].actions.length < seq[1].actions.length) seq[0].actions.push({ type: 'pause', duration: 0 });
    }
    await actions(g.s, seq); await relActions(g.s);
  };
  g.line = (x, y, dx, dy, steps = 8) => { const p = [[x, y]]; for (let i = 1; i <= steps; i++) p.push([x + dx * i / steps, y + dy * i / steps]); return p; };
  g.click = async (x, y, button = 0) => g.realDrag([[x, y]], button, 0);
  g.key = async (value, mods = []) => {
    const a = [...mods.map((m) => ({ type: 'keyDown', value: m })), { type: 'keyDown', value }, { type: 'pause', duration: 30 }, { type: 'keyUp', value }, ...mods.map((m) => ({ type: 'keyUp', value: m }))];
    await actions(g.s, [{ type: 'key', id: 'vk' + (++n), actions: a }]); await relActions(g.s);
  };
  /** ev that throws on a page exception */
  g.run = async (body) => { const r = await g.ev(body); if (r && r.E) throw new Error('page: ' + r.E); return r; };
  return g;
}

/* page-side: waits, the edit-scope reading, controls by caption, the topmost point of an element */
const HELPERS = `
  window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__ser = () => JSON.stringify(__LW.serialize({ scope: 'edit' }));
  window.__rows = () => __LW.history.entries().map((r) => r.label);
  const cap = (e, sel) => ((e.querySelector(sel) || {}).textContent || '').replace(/\\s+/g, ' ').trim();
  window.__knob = (t, dev) => [...document.querySelectorAll((dev ? '.dev[data-id="' + dev + '"] ' : '') + '.k')].find((e) => cap(e, '.k-lbl') === t);
  window.__sw = (t, dev) => [...document.querySelectorAll((dev ? '.dev[data-id="' + dev + '"] ' : '') + '.sw')].find((e) => cap(e, '.sw-lbl') === t);
  window.__trig = (t) => [...document.querySelectorAll('.trig')].find((e) => (cap(e, '.trig-l') || e.textContent.trim()) === t);
  window.__segb = (group, label, dev) => [...document.querySelectorAll((dev ? '.dev[data-id="' + dev + '"] ' : '') + '.seg-b')].find((b) => b.textContent.trim() === label && (!group || cap(b.closest('.segw') || b.closest('.seg') || document.createElement('i'), '.k-lbl') === group));
  window.__show = (el) => { if (!el) return null; const d = el.closest('.dev'); if (d) { d.classList.remove('closed'); d.hidden = false; if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } } el.scrollIntoView({ block: 'center', behavior: 'instant' }); return el; };
  /** the first point of el that elementFromPoint says is el (or inside it) */
  window.__at = (el) => { if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const b = el.getBoundingClientRect();
    for (const [u, v] of [[0.5, 0.5], [0.3, 0.5], [0.7, 0.5], [0.5, 0.3], [0.5, 0.7], [0.2, 0.2], [0.8, 0.8]]) { const x = b.left + b.width * u, y = b.top + b.height * v, h = document.elementFromPoint(x, y); if (h && (h === el || el.contains(h))) return [x, y]; }
    const x = b.left + b.width / 2, y = b.top + b.height / 2, h = document.elementFromPoint(x, y); window.__coveredBy = h ? (h.id || String(h.className) || h.tagName) + ' @' + Math.round(x) + ',' + Math.round(y) + ' box ' + Math.round(b.width) + 'x' + Math.round(b.height) : 'nothing'; return null; };
  let __pid = 900;
  const PE = (el, type, x, y, pointerId) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
  const ctr = (el) => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  /** SYNTHETIC press / drag (used only where a card overlaps the control at this viewport): the document capture sees them the same */
  window.__spress = async (el) => { const id = ++__pid, [x, y] = ctr(el); PE(el, 'pointerdown', x, y, id); PE(el, 'pointerup', x, y, id); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); await __w(30); };
  window.__sdrag = async (el, dx, dy, n = 10, gap = 25) => { const id = ++__pid, [x, y] = ctr(el); PE(el, 'pointerdown', x, y, id); for (let i = 1; i <= n; i++) { PE(el, 'pointermove', x + dx * i / n, y + dy * i / n, id); await __w(gap); } PE(el, 'pointerup', x + dx, y + dy, id); await __w(30); };
  window.__settle = async () => { const H = __LW.history; H.flush(); await __w(460); H.flush(); };
  window.__diff = (a, b, p = '', o = []) => { if (o.length > 30) return o; if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) __diff(a[k], b[k], p + '.' + k, o); } else if (JSON.stringify(a) !== JSON.stringify(b)) o.push(p + ': ' + String(JSON.stringify(a)).slice(0, 70) + ' → ' + String(JSON.stringify(b)).slice(0, 70)); return o; };
  return 1;`;
