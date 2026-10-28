/* bar-probe.mjs — iteration 020 chain T: THE CONTROL SURFACE's PLAY states, its FOLDS / NODES seats and its place above the windows
 * (a diagnostic, not a gate).   LW_PORT=9681 GD_PORT=5681 node tools/bar-probe.mjs <play | seats | z> [outdir]
 *   play  — PLAY and a .trig chip at rest / hover / pressed (pointerdown held) / on: computed faces + one PNG per state
 *   seats — the bar's width and the right group's grid on the stage, FREE and docked; FOLDS and NODES pressed
 *   z     — the bar's centre pixel under the keyboard editor + MIR OPTIONS, then TIMELINE + MODULATION (the dodge), then no seat free */
import { writeFileSync, mkdirSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';
const drv = await import(new URL('./gate/drv.mjs', import.meta.url).href);

const scene = process.argv[2] || 'play', OUT = process.argv[3] || '.tmp/bar-probe';
mkdirSync(OUT, { recursive: true });
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9681}/lab/?starter=home`, { width: 1600, height: scene === 'z' ? 1300 : 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => writeFileSync(`${OUT}/${name}.png`, Buffer.from(await g.snap(), 'base64'));
let n = 0;
const ptr = (acts) => drv.actions(g.s, [{ type: 'pointer', id: 'bp' + (++n), parameters: { pointerType: 'mouse' }, actions: acts }]);
const centre = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];`);
const face = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const c = getComputedStyle(e), p = getComputedStyle(e.parentElement);
  return { bg: c.backgroundColor, shadow: c.boxShadow.slice(0, 160), translate: c.translate, color: c.color, svg: e.querySelector('svg') ? getComputedStyle(e.querySelector('svg')).transform : '-', parentShadow: p.boxShadow.slice(0, 80), active: e.matches(':active'), hover: e.matches(':hover'), playing: !!window.__LW?.mod?.playing };`);
/* who is at the bar's centre: BAR, or the window that covers it */
const hit = () => g.ev(`const e = document.getElementById('transport'); const r = e.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!h) return 'nothing'; if (e.contains(h)) return 'BAR'; const w = h.closest('[data-id], [id]'); return w ? (w.dataset.id || w.id) : h.tagName;`);
const rectOf = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(1500);
  if (scene === 'play') {
    const PLAY = '#transport .csb-play > .tbtn.play';
    await g.ev(`document.querySelector('#transport .mod-exp')?.click(); return 1;`); await wait(1500);   // the modulation window's TAP · SYNC chips are .trig
    const trig = await g.ev(`const t = [...document.querySelectorAll('.trig')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.top > 0 && r.bottom < innerHeight && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === e; });
      if (!t) return null; t.id ||= 'probeTrig'; return '#' + t.id;`);
    if (!trig) console.log('trigs', JSON.stringify(await g.ev(`return [...document.querySelectorAll('.trig')].slice(0, 30).map((e) => { const r = e.getBoundingClientRect(); return [e.closest('[data-id]')?.dataset.id, e.textContent.trim().slice(0, 12), Math.round(r.left), Math.round(r.top), Math.round(r.width)]; });`)));
    const p = await centre(PLAY), c = trig ? await centre(trig) : null;
    console.log('play', JSON.stringify(p), 'chip', trig, JSON.stringify(c));
    for (const [name, how] of [['rest', null], ['hover', 'move'], ['pressed', 'down'], ['on', 'on']]) {
      for (const [who, at, sel] of [['play', p, PLAY], ['chip', c, trig]]) {
        if (!at) continue;
        if (how === 'on') { await ptr([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 800, y: 400 }]); await g.ev(`document.querySelector(${JSON.stringify(sel)}).classList.add('on'); return 1;`); }
        else if (how) await ptr([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: at[0], y: at[1] }, ...(how === 'down' ? [{ type: 'pointerDown', button: 0 }] : [])]);
        await wait(350);
        console.log(name.padEnd(8), who.padEnd(5), JSON.stringify(await face(sel)));
        await shot(`${who}-${name}`);
        if (how === 'down') await ptr([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 800, y: 400 }, { type: 'pointerUp', button: 0 }]); await drv.relActions(g.s);   // let go OFF the button: no click
        if (how === 'on') await g.ev(`document.querySelector(${JSON.stringify(sel)}).classList.remove('on'); return 1;`);
        await ptr([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 800, y: 400 }]); await wait(200);
      }
    }
    console.log('rects', JSON.stringify({ play: p, chip: c }));
  }
  if (scene === 'seats') {
    const row = async (what) => console.log(what.padEnd(22), JSON.stringify(await g.ev(`const t = document.getElementById('transport'), r = t.getBoundingClientRect(), R = t.querySelector('.csb-right');
      const q = (s) => { const b = t.querySelector(s); if (!b) return null; const x = b.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top)]; };
      return { place: t.dataset.place || (t.classList.contains('docked') ? 'rack' : 'stage'), w: Math.round(r.width), h: Math.round(r.height), right: R ? getComputedStyle(R).gridTemplateColumns : '-',
        folds: q('.csb-folds'), nodes: q('.csb-nodes'), foldsWord: t.querySelector('.csb-folds')?.getAttribute('aria-label'), nodesOn: t.querySelector('.csb-nodes')?.getAttribute('aria-pressed') };`)));
    const census = () => g.ev(`const ws = [...document.querySelectorAll('#rack > .dev:not(.closed), #rackL > .dev:not(.closed), #rack .dev:not(.closed), #rackL .dev:not(.closed)')]; const u = [...new Set(ws)]; return u.filter((d) => d.classList.contains('folded')).length + ' folded of ' + u.length + ' open';`);
    await row('boot'); await shot('seats-stage'); console.log('  racks', await census());
    for (const k of [1, 2, 3]) { await g.tap('#transport .csb-folds'); await wait(900); await row('after FOLDS ' + k); console.log('  racks', await census()); }
    await g.tap('#transport .csb-nodes'); await wait(900); await row('NODES pressed'); console.log('  nodes open', await g.ev(`return __LW.nodes.win.isOpen();`));
    await g.ev(`__LW.nodes.win.root.querySelector('.mir-win-x, [aria-label*="lose"], .win-close')?.click() || __LW.nodes.close(); return 1;`); await wait(600); await row('NODES closed by ×');
    await g.tap('#transport .csb-nodes'); await wait(700); await g.tap('#transport .csb-nodes'); await wait(700); await row('NODES twice'); console.log('  nodes open', await g.ev(`return __LW.nodes.win.isOpen();`));
    for (const name of ['free', 'rack']) { await g.ev(`document.querySelector('#transport .dock-btn').click(); return 1;`); await wait(1500); await row(name); await shot('seats-' + name); }
  }
  if (scene === 'z') {
    const state = async (what) => console.log(what.padEnd(34), (await hit()).padEnd(14), JSON.stringify(await g.ev(`const t = document.getElementById('transport'), r = t.getBoundingClientRect();
      return { z: getComputedStyle(t).zIndex, under: document.body.classList.contains('transport-under'), top: Math.round(r.top), seat: t.classList.contains('at-top') ? 'top' : 'bottom',
        tl: __LW.timeline.isOpen() ? [__LW.timeline.root.getBoundingClientRect()].map((q) => [q.left, q.top, q.width, q.height].map(Math.round))[0] : null,
        mod: __LW.layout.modulation.open ? [document.querySelector('[data-mir-window="modulation"]').getBoundingClientRect()].map((q) => [q.left, q.top, q.width, q.height].map(Math.round))[0] : null };`)));
    /* the chrome that stacks at the bar's height or above, and whether it follows the bar in the document (a tie goes to the later one) */
    console.log('layers', JSON.stringify(await g.ev(`const t = document.getElementById('transport'), out = [];
      for (const e of document.querySelectorAll('body *')) { const c = getComputedStyle(e); if (c.position === 'static' || c.zIndex === 'auto' || +c.zIndex < 32) continue; if (t.contains(e) || e.closest('#floats')) continue;
        out.push((e.id || e.className.toString().split(' ')[0]) + ':' + c.zIndex + (t.compareDocumentPosition(e) & 4 ? ' after' : ' before')); } return out;`)));
    const over = (sel) => g.ev(`const w = document.querySelector(${JSON.stringify(sel)}); if (!w) return 'no window'; const b = document.getElementById('transport').getBoundingClientRect();
      w.style.left = Math.round(b.left + b.width / 2 - w.offsetWidth / 2) + 'px'; w.style.top = Math.round(b.top + b.height / 2 - w.offsetHeight / 2) + 'px'; return w.offsetWidth + 'x' + w.offsetHeight;`);
    await state('alone');
    await g.ev(`__LW.keymap.open(); return 1;`); await wait(900);
    const kbSel = await g.ev(`const w = [...document.querySelectorAll('#floats > *')].find((e) => !e.hidden && e.offsetWidth && /key/i.test((e.dataset.id || '') + (e.dataset.mirWindow || '') + e.className)); if (!w) return null; w.id ||= 'probeKb'; return '#' + w.id;`);
    console.log('keyboard', kbSel, await over(kbSel)); await wait(300); await state('keyboard over the bar'); await shot('z-keyboard');
    await g.ev(`__LW.keymap.close(); return 1;`); await wait(600);
    await g.tap('#transport .csb-gear'); await wait(1200);
    const optSel = await g.ev(`const w = [...document.querySelectorAll('#floats > *, .mir-window')].find((e) => !e.hidden && e.offsetWidth && /option|mir-gui/i.test((e.dataset.id || '') + (e.dataset.mirWindow || '') + e.className)); if (!w) return null; w.id ||= 'probeOpt'; return '#' + w.id;`);
    console.log('options', optSel, optSel && await over(optSel)); await wait(300); await state('MIR OPTIONS over the bar'); await shot('z-options');
    await g.ev(`document.querySelector(${JSON.stringify(optSel || 'none')})?.querySelector('[aria-label="close"], .mir-win-x, .win-x')?.click(); return 1;`); await wait(400);
    await g.ev(`document.querySelector(${JSON.stringify(optSel || 'none')}) && (document.querySelector(${JSON.stringify(optSel || 'none')}).hidden || 0); return 1;`);
    await g.press('\uE00C'); await wait(500);   // Escape
    await state('options closed');
    await g.ev(`__LW.timeline.open(); return 1;`); await wait(1500); await state('TIMELINE open');
    await g.tap('#transport .mod-exp'); await wait(1500); await state('+ MODULATION'); await shot('z-tl-mod');
    /* pin both: drag the modulation window by its grip until it covers the top seat too (a real drag: the kit's onMoved → modDodge) */
    const grip = await g.ev(`const mw = document.querySelector('[data-mir-window="modulation"]'); const gr = [...document.querySelectorAll('.crail-grip')].find((e) => e.offsetWidth > 6);
      const r = (gr || mw).getBoundingClientRect(), m = mw.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + Math.min(r.height / 2, 10)), top: Math.round(m.top), cls: gr ? gr.className.toString().slice(0, 40) : 'none' };`);
    console.log('grip', JSON.stringify(grip));
    const dy = 60 - grip.top, steps = 8;
    await ptr([{ type: 'pointerMove', duration: 0, origin: 'viewport', x: grip.x, y: grip.y }, { type: 'pointerDown', button: 0 },
      ...Array.from({ length: steps }, (_, i) => ({ type: 'pointerMove', duration: 30, origin: 'viewport', x: grip.x, y: Math.round(grip.y + dy * (i + 1) / steps) })), { type: 'pointerUp', button: 0 }]);
    await drv.relActions(g.s);
    await wait(1200); await state('both pinned'); await shot('z-pinned');
    await g.ev(`__LW.timeline.close(); __LW.layout.modulation.collapse(); return 1;`); await wait(1500); await state('both closed');
  }
  console.log('errors', JSON.stringify((await g.errors()).errs));
} finally { await g.close(); }
