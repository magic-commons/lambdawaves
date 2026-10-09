/* a4-window-probe.mjs — 0.5.0 A4's parity probe for the floating rack (a diagnostic, not a gate).
 *   LW_PORT=8763 GD_PORT=5233 node tools/a4-window-probe.mjs <out.json>
 * Drives every window verb through the 0.4.0 names both trees answer to (popOut, dockWindow, reopen, captureLayout,
 * applyLayout, raise, setCompact, moveFloat, the four favourite slots, RESET LAYOUT, the transport's dock, the rack's
 * hide, the card's own ×, TAB's cycle, the WINDOW menu's rows, a retired id in a loaded record, and the phone crossing
 * with a float parked and replayed) and writes what the page shows after each step: the WORKSPACE record (its clock
 * masked), the float stack, the closed set, the rack orders, the settings key's layout-side keys.  Run it on two trees
 * and diff the two files: the floating rack moved, so every line must match. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const OUT = process.argv[2] || '.tmp/a4-window-probe.json';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8763}/lab/?warn=0`, { width: 1920, height: 1080 });
const rect = (width, height) => fetch(`http://127.0.0.1:${process.env.GD_PORT || 4444}/session/${g.s}/window/rect`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ width, height }) });
const steps = [];
const snap = async (name, extra = '') => {
  const s = await g.ev(`await __LW.settle();
    const L = __LW.layout, cap = L.captureLayout(); cap.at = 0;
    const S = __LW.settings, X = ${extra ? '(() => { ' + extra + ' })()' : 'null'};
    return { cap, floating: L.floating(), floats: L.floating().map((id) => L.floatOf(id)), closed: L.closed(), orderAll: L.orderAll(),
      order: L.order(), docked: L.docked, dockSide: L.dockSide, dockIndex: L.dockIndex, rackHidden: document.body.classList.contains('rack-hidden'),
      rackPeek: document.body.classList.contains('rack-peek'), phone: L.phone.on, parked: L.phone.parkedFloats,
      settings: { closed: S.closed, layouts: S.layouts ? Object.fromEntries(Object.entries(S.layouts).map(([k, v]) => [k, { ...v, at: 0 }])) : null, phoneTr: S.phoneTr, phoneRack: S.phoneRack },
      zs: [...document.querySelectorAll('#floats .dev')].map((d) => d.dataset.id + ':' + d.style.zIndex + ':' + d.style.left + ':' + d.style.top + ':' + d.className),
      transportParent: (document.getElementById('transport').parentElement || {}).className || '', X, errors: (window.__e || []).slice() };`);
  steps.push([name, s]);
};
try {
  if (!(await g.waitFor('window.__LW?.ready', 300, 100)).ok) throw new Error('the lab never came up');
  await snap('boot');
  await g.ev(`__LW.layout.popOut('shadow', { x: 700, y: 160, w: 280 }); __LW.layout.popOut('spectrum'); return 1;`);
  await snap('two floats');
  await g.ev(`__LW.layout.raise('shadow'); __LW.layout.setCompact('spectrum', true); __LW.layout.moveFloat('shadow', 5000, -40); return 1;`);
  await snap('raise, compact, clamp');
  await g.ev(`__LW.layout.raiseFloat('spectrum'); __LW.keys.resetTabs(); __LW.keys.cycleWindow(1); __LW.keys.cycleWindow(1); __LW.keys.cycleWindow(-1); return 1;`);
  await snap('the raise stack and TAB', 'return __LW.keys.tabOrder;');
  await g.ev(`return __LW.layout.saveLayout(2);`);
  await snap('saved slot 2', 'return __LW.layout.layouts().map((l) => [l.slot, l.label.replace(/\\d\\d:\\d\\d$/, "hh:mm")]);');
  await g.ev(`__LW.layout.dockWindow('shadow'); __LW.layout.dockAll(false); __LW.layout.moveToRack('state', 'L'); __LW.layout.moveCard('palette', 0); return 1;`);
  await snap('docked all, moved two');
  await g.ev(`return __LW.layout.loadLayout(2);`);
  await snap('loaded slot 2');
  await g.ev(`const L = __LW.layout.captureLayout();
    L.cards = L.cards.filter((c) => c.id !== 'observer').concat([{ id: 'style', side: 'L', folded: false, closed: false, off: false, float: { x: 333, y: 222, w: 300, compact: false, z: 9, index: 1 } },
      { id: 'dynamics', side: 'R', folded: true, closed: false, off: false, float: null }]);
    return __LW.layout.applyLayout(L);`);
  await snap('a record naming retired ids');
  await g.ev(`document.querySelector('.dev[data-id="wigner"]').classList.remove('closed'); document.querySelector('.dev[data-id="wigner"] .dev-close').click(); return 1;`);
  await snap('the card’s own ×');
  await g.ev(`__LW.layout.reopen('wigner', 'L'); return 1;`);
  await snap('reopened left');
  await g.ev(`__LW.layout.menu.open(); const bar = document.getElementById('menubar');
    const btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.textContent === 'WINDOW'); btn.click();
    window.__rows = [...btn.parentElement.querySelectorAll('.mb-item')].map((i) => [i.querySelector('.mb-lbl').textContent, i.title || '']); btn.click(); __LW.layout.menu.close(); return 1;`);
  await snap('the WINDOW menu', 'return window.__rows;');
  await g.ev(`__LW.layout.dockTransport(); __LW.layout.toggleRack(); return 1;`);
  await snap('transport and rack toggled');
  await g.ev(`__LW.layout.dockTransport(); __LW.layout.toggleRack(); __LW.layout.forgetLayout(2); __LW.layout.resetLayout(); return 1;`);
  await snap('reset');
  await g.ev(`__LW.layout.popOut('shadow', { x: 640, y: 200, w: 300 }); __LW.layout.popOut('vortex', { x: 900, y: 120, w: 260, compact: true }); return 1;`);
  await snap('two floats before the phone');
  await rect(500, 930);
  if (!(await g.waitFor('__LW.layout.phone.on===true', 60, 50)).ok) throw new Error('no phone');
  await snap('phone');
  await rect(1920, 1080);
  if (!(await g.waitFor('__LW.layout.phone.on===false', 60, 50)).ok) throw new Error('no desktop');
  await snap('back from the phone');
  writeFileSync(OUT, JSON.stringify(steps, null, 1) + '\n');
  console.log(`a4-window-probe: ${steps.length} steps -> ${OUT}`);
} finally { await g.close(); }
