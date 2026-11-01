/* w032-shots.mjs — iteration 032 chain W's pictures (a diagnostic, not a gate).
 *   LW_PORT=9699 GD_PORT=5699 node tools/w032-shots.mjs <scene> [out.png]
 * Scenes: field (H₂O on SHELL with SIZE and RADIUS raised, and WAVE's STYLE row) · bar (the CSB on the stage, docked, popped; the timeline's
 * work bar) · event (an EVENT clip on STYLE, then MOLECULES off).  Writes the driver's composite PNGs and prints what it measured. */
import { writeFileSync } from 'node:fs';
import { open } from './gate/gatekit.mjs';

const scene = process.argv[2] || 'field', OUT = process.argv[3] || `.tmp/w032-${scene}.png`;
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9699}/lab/?starter=home`, { width: 1600, height: 1000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (tag) => { const f = OUT.replace(/\.png$/, tag ? '-' + tag + '.png' : '.png'); writeFileSync(f, Buffer.from(await g.snap(), 'base64')); return f; };
const rect = (sel) => g.ev(`const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round);`);
const molecule = async (id) => { await g.ev(`__LW.verbs.run([{ verb: 'molecule', args: { id: ${JSON.stringify(id)} } }], { who: 'SHOTS' }); return 1;`);
  return g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 600, 200); };
try {
  if (!(await g.waitFor('window.__LW?.ready', 400, 100)).ok) throw new Error('the lab never came up');
  await wait(800);
  const info = {};
  if (scene === 'field') {
    info.solved = (await molecule('H2O')).ok;
    await g.ev(`__LW.setStyle('glass'); const ks = [...document.querySelectorAll('.dev[data-id="observer"] .k')];
      const k = (w) => ks.find((x) => (x.querySelector('.k-lbl') || {}).textContent === w).mirKnob; k('SIZE').input(${+(process.env.SIZE ?? 0.3)}); k('RADIUS').input(${+(process.env.RADIUS ?? 0.4)}); if (${JSON.stringify(process.env.THEME || '')}) __LW.setTheme(${JSON.stringify(process.env.THEME || '')}); return 1;`);
    await g.ev(`__LW.layout.reveal ? __LW.layout.reveal('observer') : 0; return 1;`);
    await wait(2500);
    info.style = await g.ev(`return [__LW.mat.style, __LW.mat.atomSize, __LW.mat.stickR, __LW.field.espState().atoms];`);
    info.seg = await g.ev(`return [...document.querySelectorAll('.dev[data-id="observer"] [data-key-action="style"] .seg-b')].filter((b) => !b.hidden).map((b) => b.textContent);`);
    info.out = await shot();
    await g.ev(`const d = document.querySelector('.dev[data-id="observer"]'); if (d.classList.contains('folded')) __LW.run('window.observer.fold'); return 1;`); await wait(1200);
    info.wave = await rect('.dev[data-id="observer"]');
    info.knobs = await g.ev(`return ['atomSizeK', 'stickK'].map((k) => { const n = document.querySelector('.dev[data-id="observer"]'); return [...n.querySelectorAll('.k')].filter((x) => /SIZE|RADIUS/.test(x.textContent)).map((x) => x.textContent.trim() + (x.classList.contains('disabled') ? ' (off)' : '')); })[0];`);
    info.wave2 = await shot('wave');
  }
  if (scene === 'bar') {
    const chip = () => g.ev(`const b = document.querySelector('#transport .dock-btn'), t = document.getElementById('transport'), r = t.getBoundingClientRect();
      return { gly: b && b.dataset.gly, title: b && b.title, place: t.dataset.place, docked: t.classList.contains('docked'), rect: [r.left, r.top, r.width, r.height].map(Math.round),
        seats: [...t.querySelectorAll('.csb-ico [data-key-action], .csb-ico .tr-open, .csb-ico .dock-btn, .csb-ico .mod-exp')].map((e) => (e.dataset.keyAction || e.className.split(' ')[0]) + ':' + (e.dataset.gly || '')).join(' ') };`);
    info.stage = await chip(); info.play = await g.ev(`const p = document.querySelector('#transport .csb-play'), s = getComputedStyle(p); return [p.dataset.mirSurface || '', s.padding, s.backgroundColor, s.borderTopWidth];`);
    info.stageShot = await shot('stage');
    await g.ev(`__LW.timeline.open(); __LW.timeline.controller.seek(17); __LW.clock.t = 12.34; return 1;`); await wait(1500);
    info.time = await g.ev(`return [...document.querySelectorAll('.mir-timeline .tl-transport .ro.time')].map((e) => e.textContent.trim());`);
    info.work =await g.ev(`const p = document.querySelector('.mir-timeline .tl-transport .mir-mod-power'), r = p.getBoundingClientRect(); return [p.dataset.face, p.textContent, Math.round(r.width) + '×' + Math.round(r.height)];`);
    info.workRect = await rect('.mir-timeline .tl-transport');
    info.workShot = await shot('work');
    await g.ev(`__LW.timeline.close(); return 1;`); await wait(800);
    await g.ev(`document.querySelector('#transport .dock-btn').click(); return 1;`); await wait(1200);
    info.rack = await chip(); info.rackShot = await shot('rack');
    await g.ev(`const h = document.querySelector('.dev[data-id="transport"] > .dev-head'); h.tabIndex = h.tabIndex < 0 ? 0 : h.tabIndex; h.focus(); return document.activeElement === h;`);
    await g.press('\uE007'); await wait(1200);
    info.popped = await g.ev(`const d = document.querySelector('.dev[data-id="transport"]'), r = d.getBoundingClientRect(), h = d.querySelector('.dev-head'); return { floating: d.classList.contains('floating'), bare: d.hasAttribute('data-bare'), rect: [r.left, r.top, r.width, r.height].map(Math.round), head: getComputedStyle(h).position };`);
    info.poppedShot = await shot('popped');
    /* C1 · the × road: close the card, then swap from the bar — never an empty slot, never a bar "docked" in a closed card */
    const card = `(() => { const d = document.querySelector('.dev[data-id="transport"]'), t = document.getElementById('transport'); return { closed: d.classList.contains('closed'), hasBar: d.contains(t), docked: t.classList.contains('docked'), place: t.dataset.place }; })()`;
    await g.tap('.dev[data-id="transport"] .dev-close'); await wait(900); info.afterX = await g.ev(`return ${card};`);
    await g.ev(`document.querySelector('#transport .dock-btn').click(); return 1;`); await wait(1200); info.afterSwap = await g.ev(`return ${card};`);
    await g.ev(`document.querySelector('#transport .dock-btn').click(); return 1;`); await wait(1200); info.backToStage = await g.ev(`return ${card};`);
  }
  if (scene === 'side') {   // T13: the bar keeps the side it landed on
    const st = `(() => { const t = document.getElementById('transport'); return { top: t.classList.contains('at-top'), y: Math.round(t.getBoundingClientRect().top), saved: localStorage.getItem('lw.csb.side') }; })()`;
    info.boot = await g.ev(`return ${st};`);
    await g.ev(`__LW.timeline.open(); return 1;`); await wait(1800); info.tlOpen = await g.ev(`return ${st};`);
    await g.ev(`__LW.timeline.close(); return 1;`); await wait(1500); info.tlClosed = await g.ev(`return ${st};`);
    await g.nav(); await g.waitFor('window.__LW?.ready', 400, 100); await wait(1500); info.reload = await g.ev(`return ${st};`);
    await g.ev(`localStorage.removeItem('lw.csb.side'); return 1;`);
  }
  if (scene === 'event') {   // T23: CREATE EVENT on WAVE's STYLE (the control menu), its bands; MOLECULES off → ⚠; COPY VALUE; T24's hold
    info.solved = (await molecule('H2O')).ok;
    await g.ev(`__LW.layout.reveal('observer'); const d = document.querySelector('.dev[data-id="observer"]'); if (d.classList.contains('folded')) __LW.run('window.observer.fold'); return 1;`); await wait(1200);
    const menu = (sel, row) => g.ev(`const b = document.querySelector(${JSON.stringify(sel)}), r = b.getBoundingClientRect();
      b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5, button: 2 }));
      await new Promise((ok) => setTimeout(ok, 400)); const rows = [...document.querySelectorAll('.mir-ctx [data-id]')].map((x) => x.dataset.id + (x.getAttribute('aria-disabled') === 'true' || x.disabled ? '(off)' : ''));
      const it = document.querySelector('.mir-ctx [data-id="' + ${JSON.stringify(row)} + '"]'); if (it) it.click(); return rows;`);
    info.menuRows = await menu('.dev[data-id="observer"] [data-key-action="style"] .seg-b[data-v="6"]', 'event.copy');
    info.copied = await g.ev(`return __LW.timeline.editor.copiedValue;`);
    await menu('.dev[data-id="observer"] [data-key-action="style"] .seg-b[data-v="6"]', 'event.create'); await wait(1500);
    info.clip = await g.ev(`const T = __LW.timeline.model.state(), c = T.curves.find((x) => x.targetId === 'material.style'); return c ? { steps: c.steps, points: c.points.map((p) => +p.v.toFixed(4)) + '', segs: document.querySelectorAll('.tl-band').length, warn: document.querySelectorAll('.tl-clip.steps-off, .steps-off').length } : null;`);
    info.eventShot = await shot('clip');
    await g.ev(`__LW.chem.setOn(false); return 1;`); await wait(1800);
    info.after = await g.ev(`return { steps: __LW.mod.registry.describe('material.style').steps, warn: document.querySelectorAll('.steps-off').length };`);
    info.warnShot = await shot('warn');
    /* T24: the realtime pump held while busy during play, released at zero */
    /* state.index: an EVENT clip on the 140 grid says state 5 at its start → the register is that one state; off the clip nothing moves it */
    info.index = await g.ev(`const tl = __LW.timeline, R = __LW.mod.registry, before = __LW.reg.populated().slice(); const id = tl.editor.createClip('state.index');
      const c = tl.model.state().clips.find((x) => x.id === id), u = R.toNorm('state.index', 5); tl.model.updateCurve(c.curveId, { points: [{ t: 0, v: u, tension: 0, segment: 'hold' }, { t: 1, v: u, tension: 0 }] });
      tl.controller.seek(c.start + 0.5); __LW.mod.host.clock.applyAll(true); await new Promise((r) => setTimeout(r, 400));
      return { before, steps: tl.model.state().curves.find((x) => x.id === c.curveId).steps, after: __LW.reg.populated().slice() };`);
    info.hold = await g.ev(`const C = __LW.mod.host.clock; __LW.mod.play && __LW.mod.play(); await new Promise((r) => setTimeout(r, 300)); const b = __LW.busy; b.begin(); const held = C.isRealtimeSuspended(); b.end(); const after = C.isRealtimeSuspended(); return { playing: C.isPlaying(), held, after };`);
  }
  if (scene === 'demo') {   // the older STYLE lane of WATER ESP, re-read on the open road
    await g.ev(`__LW.projects.demo('water-esp'); return 1;`); await g.waitFor('window.__LW.chem.on && window.__LW.chem.solution()', 600, 200); await wait(1500);
    info.lane = await g.ev(`const c = __LW.timeline.model.state().curves.find((x) => x.targetId === 'material.style'), R = __LW.mod.registry; return c ? { steps: c.steps, values: c.points.map((p) => R.fromNorm('material.style', p.v)) } : null;`);
    info.status = await g.ev(`return __LW.projects.status;`);
  }
  for (const [k, v] of Object.entries({ scene, ...info, errors: (await g.errors()).errs })) console.log(k, JSON.stringify(v));
} finally { await g.close(); }
