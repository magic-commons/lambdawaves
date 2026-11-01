/* lab/context-menus.js — 022 P2 · ONE MENU DOOR: every right-click, ContextMenu key, Shift+F10 and still hold (500 ms, 8 px: the kit's TAP law)
 * opens the kit's contextMenu (lab/mir/shell/menubar.js, 1.5.6-alpha.4) with a tree of ACTION IDS (lab/actions.js): the label, the key, the
 * icon and the ✓ / • are the registry's; the pressed element rides as `{ el }`, so a row acts on what was pressed (a tile, a knob, a window).
 * A surface with its own door keeps it — a registered knob (the kit's knob menu: the timeline's CLIP › and the modulation window's ROUTES ›;
 * λWAVES adds its rows here, as the part 'app'), FOLDERS (the kit's rows), NODES, the favourites strip — and a surface whose right button is a
 * law keeps that (SPECTRUM's grid: right = REMOVE, paint-stroke.js), its menu on the keys and the hold.  A text field keeps the browser's menu.
 * The stage never shows the browser's menu.  Each menu is ≤ 8 rows.  createContextMenus(app) is seated by rack.js after FOLDERS. */
import { contextMenu, knobMenu, knobMenuPart, setMenuEscape } from './mir/shell/menubar.js';
import { holdTap } from './mir/kit.js';
import { VIEW_NAMES, drawStyle } from './field.js';

export function createContextMenus(app) {
  const A = app.sh.ACTIONS, mat = app.mat, ui = app.ui;
  setMenuEscape((close) => A.escape.push(close));                     // the menus are layers of THE ESCAPE STACK
  const keyOf = (id) => { try { const k = app.sh.kt.keyText(id); return k && k !== '—' ? '\t' + k : ''; } catch (_) { return ''; } };
  /** row(id, word?, o?) — an action as a menu entry: its word (the label's head), its key, ✓ from get(), its icon; o.args run it with arguments,
   *  o.radio / o.on make a choice, o.off greys it; the pressed element always rides along */
  let pressed = null;
  const row = (id, word, o = {}) => {
    const a = A.get(id); if (!a) return null;
    let on; try { on = o.on ? o.on() : a.kind === 'toggle' && a.get ? !!a.get() : undefined; } catch (_) { on = undefined; }
    const icon = typeof a.icon === 'function' ? a.icon() : a.icon, el = pressed;
    return [(word || a.label.split(' — ')[0]) + (o.args ? '' : keyOf(id)), () => A.run(id, { el, ...(o.args || {}) }), !!o.off, a.hint || a.label,
      { id, ...(on !== undefined ? { checked: on } : {}), ...(o.radio ? { radio: o.radio } : {}), ...(icon ? { icon } : {}) }];
  };
  const sub = (word, rows) => [word, rows, null, '', { sub: true }];
  const radio = (id, group, list, cur) => list.map(([v, w]) => row(id, w, { args: { id: v }, radio: group, on: () => cur() === v }));
  const win = (id) => (app.sh.rk ? app.sh.rk.windows().find((w) => w.id === id) : null) || {};

  /* ── THE MENUS (RESEARCH-U §1's table) ── */
  const VIEWS = [['density', 'ρ  density'], ['phase', 'arg ψ  phase'], ['real', 'Re ψ'], ['imag', 'Im ψ']];
  const stage = () => [sub('VIEW', () => radio('view', 'view', VIEWS, () => VIEW_NAMES[mat.view])),
    sub('STYLE', () => radio('style', 'style', ui.styleList(), () => drawStyle(mat.style))),   // 032 O1: the seg's own visible set (it listed five)
    row('palette', 'PALETTE'), row('camReset', 'CAMERA HOME'), row('camera.flip', 'FLIP'), row('camera.lock', 'LOCK'), null, row('copy.picture', 'COPY PICTURE'), row('hide', 'HIDE THE INTERFACE')];
  const title = (id) => [row(`window.${id}.fold`, 'FOLD'), row(`window.${id}.float`, 'FLOAT'), row(`window.${id}.side`, win(id).side === 'right' ? 'TO THE LEFT RACK' : 'TO THE RIGHT RACK'),
    row(`window.${id}.reset`, 'RESET PLACE'), row(`window.${id}.solo`, 'SOLO'), row('notes', 'WINDOW HELP'), null, row(`window.${id}.close`, 'CLOSE')];
  const favRows = (el) => { const f = el.closest('[data-fav]'), F = app.sh.csb; return f && F ? F.rowsFor(f.dataset.fav).map((r) => [r.label, r.run]) : []; };   // ADD TO / REMOVE FROM the CONTROL SURFACE
  /* 032 W3 · CREATE EVENT and COPY VALUE (T23): on a control that names a target (`data-event`) — COPY VALUE on one option (a seg's button, a grid
     state) or a switch */
  const evOff = (el) => { const e = el.closest('[data-event]'), R = app.state.modHost && app.state.modHost.registry; return !e || !R || !R.has(e.dataset.event) || !app.state.tl; };
  const events = (el) => [row('event.create', 'CREATE EVENT', { off: evOff(el) }), row('event.copy', 'COPY VALUE', { off: evOff(el) || !(pressed || el).closest('[data-v], .pk-c, .sw') })];   // the pressed button, not its row
  const control = (el) => [row('control.reset', 'RESET', { off: !el.closest('[data-param]') }), row('control.learn', 'LEARN…', { off: !el.closest('[data-key-action]') }),
    ...events(el), ...favRows(el), row('knob.copyId', 'COPY ID', { off: !el.closest('[data-param], [data-key-action], [data-fav], [data-event]') })];
  const bar = () => [row('dock', 'DOCK'), row('csb.expand', 'EXPAND'), sub('THEME', () => radio('theme', 'theme', [['light', 'LIGHT'], ['dark', 'DARK'], ['system', 'SYSTEM']], () => A.get('theme').get())),
    row('folds', A.get('folds') && A.get('folds').word ? A.get('folds').word().split(' — ')[0] : 'MINIMIZE ALL', { on: () => undefined }), row('modArm', 'MOD'), row('gui', 'MIR OPTIONS'), null, row('hide', 'HIDE THE INTERFACE')];
  const tile = (el) => [row('picker.open', 'OPEN'), row('picker.isomers', 'ISOMERS', { off: !el.querySelector('.mm-iso') }), row('picker.keep', 'KEEP ON THIS DEVICE', { off: !el.querySelector('img[data-vol]') }), null,
    row('copy.name', 'COPY NAME'), row('copy.formula', 'COPY FORMULA')];
  const looks = () => [...document.querySelectorAll('#lwMenu .mm-lk')].map((b) => [b.dataset.look, (b.getAttribute('aria-label') || b.title || b.dataset.look).split(' · ')[0]]);
  const pickerPage = () => [sub('LOOK', () => radio('picker.look', 'look', looks(), () => A.get('picker.look').get())), row('csb.search', 'SEARCH'), row('folders', 'FOLDERS'), row('open', 'OPEN…')];
  const lanes = (el) => [row('state.clear', 'CLEAR'), row('state.normalize', 'NORMALIZE'), row('preset.next', 'NEXT PRESET'), ...events(el), null, row('copy.latex', 'COPY LaTeX'), row('spectrum.solo', 'SOLO SPECTRUM')];   // 032 W3: the 140 grid's EVENT (state.index); PREVIOUS PRESET left (≤ 8 rows), the stepper keeps it
  const notebook = () => [row('notebook', 'NOTEBOOK'), row('notebook.copy', 'COPY TEXT'), row('copy.link', 'COPY LINK'), row('copy.latex', 'COPY LaTeX'), row('export.json', 'EXPORT .json')];
  const finder = (el) => { const id = el.dataset.win, w = win(id); return [w.open ? row(`window.${id}.close`, 'CLOSE') : row(`window.${id}.open`, 'OPEN'), row(`window.${id}.fold`, 'FOLD', { off: !w.open }),
    row(`window.${id}.float`, 'FLOAT', { off: !w.open }), row('notes', 'WINDOW HELP')]; };
  const words = () => [row('view.formula', 'FORMULA'), row('view.labels', 'ATOM LABELS'), row('view.captions', 'CAPTIONS'), row('view.badges', 'STATUS TAGS'),
    sub('ESP BAR SIDE', () => radio('esp.side', 'side', [['right', 'RIGHT'], ['left', 'LEFT'], ['top', 'TOP'], ['bottom', 'BOTTOM']], () => A.get('esp.side').get())), null,
    row('copy.formula', 'COPY FORMULA'), row('copy.latex', 'COPY LaTeX')];
  /* the knob's own rows at the foot of the kit's knob menu (part 'app'; the favourites' ADD / REMOVE ride setTimelineKnobRows): ROUTE, COPY ID */
  const knobApp = (id, root) => { pressed = root; return { entries: [row('knob.route', 'ROUTE THE MACRO', { off: !root.dataset.param }), row('knob.copyId', 'COPY ID')] }; };
  knobMenuPart('app', knobApp);

  /* ── WHERE: the pressed element → its menu (a knob opens the kit's knob menu) ── */
  const inside = (r, x, y) => r && r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  const wordsAt = (x, y) => [...document.querySelectorAll('.lw-espbar:not([hidden]), .lw-stage .mir-info-text')].some((n) => n.getClientRects().length && inside(n.getBoundingClientRect(), x, y));
  const LANES = '.dev[data-id="spectrum"] .pk-c';
  function menuAt(t, x, y) {
    const c = (s) => (t.closest ? t.closest(s) : null); let e;
    if (!t.closest || c('input, textarea, select, [contenteditable="true"], .mir-ctx')) return null;    // a field keeps the browser's own (paste)
    if ((e = c('.wp-row[data-win]'))) return finder(e);
    if ((e = c('#lwMenu'))) return (e = c('.mm-tile')) ? tile(e) : pickerPage();
    if (c('#notebook')) return notebook();
    if ((e = c('.k'))) return { knob: e };
    if ((e = c('[data-fav]'))) return control(e);
    if (c('.mir-transport')) return bar();
    if ((e = c('.dev .sw, .dev .segw, .dev .trig'))) return control(e);
    if ((e = c('.dev[data-id] > .dev-head'))) return title(e.parentElement.dataset.id);
    if ((e = c(LANES))) return lanes(e);
    if (t === app.dom.canvas || t.matches('#stage, #stage > canvas')) return wordsAt(x, y) ? words() : stage();   // the stage, or its words
    return null;
  }
  let held = -1e9;                                                                 // one gesture, one menu: Android fires contextmenu after the hold
  function open(t, x, y, hold = false) {
    if (!hold && performance.now() - held < 700) return true;
    pressed = t; const m = menuAt(t, x, y); if (!m) return false; if (hold) held = performance.now();
    if (m.knob) return !!knobMenu(m.knob, { x, y, appRows: m.knob.dataset.param ? null : (id, root) => knobApp(id, root).entries });
    return !!contextMenu({ x, y, entries: m });
  }
  /* the right button (not where a surface took it first: the kit's knob menu, FOLDERS, NODES, the favourites, a paint law) */
  document.addEventListener('contextmenu', (e) => { if (e.defaultPrevented) return; if (open(e.target, e.clientX, e.clientY)) e.preventDefault(); });
  /* the keys: ContextMenu and Shift+F10 on the focus (SPECTRUM's grid opens here, its right button being REMOVE) */
  document.addEventListener('keydown', (e) => { if (e.defaultPrevented || (e.key !== 'ContextMenu' && !(e.shiftKey && e.key === 'F10'))) return;
    const t = document.activeElement || document.body, r = t.getBoundingClientRect(); if (open(t, r.left + 8, r.bottom)) e.preventDefault(); });
  /* the hold: a still finger (or pen) anywhere a menu is; a mouse only on SPECTRUM's grid; never where a surface holds its own */
  holdTap(document, (e, x, y) => open(e.target, x, y, true), { accept: (e) => { const t = e.target;
    if (!t.closest || t.closest('[data-menu=""], .k[data-param], .has-ring')) return false;
    return (e.pointerType !== 'mouse' || !!t.closest(LANES)) && !!menuAt(t, e.clientX, e.clientY); } });
  return { open };
}
