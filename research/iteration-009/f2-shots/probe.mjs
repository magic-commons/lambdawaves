/* F2 probe (iteration 009): run from the repo root — GD_PORT=5341 LW_PORT=<port> node research/iteration-009/f2-shots/probe.mjs <before|after> .tmp/f2/<before|after>; then python3 research/iteration-009/f2-shots/compose.py .tmp/f2 research/iteration-009/f2-shots */
import fs from 'node:fs';
import { open, judge, done } from '../../../tools/gate/gatekit.mjs';
import * as drv from '../../../tools/gate/drv.mjs';
const TAG = process.argv[2] || 'after', OUT = process.argv[3] || '.tmp/f2';
const PORT = process.env.LW_PORT || 9341;
const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1150, script: 300000 });
const HELP = `
  const wait = (f, n = 600) => new Promise((res) => { let i = 0; const tick = () => { let v = null; try { v = f(); } catch (e) { v = null; } if (v || ++i > n) res(v); else setTimeout(tick, 50); }; tick(); });
  const frames = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 150)); };
  const ready = () => wait(() => __LW.states.ladder() && __LW.states.state().lanes.every((l) => l.ready) && __LW.states.state().pending === 0);
`;
const park = async () => { await drv.actions(g.s, [{ type: 'pointer', id: 'park' + Math.random(), parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', duration: 0, origin: 'viewport', x: 1480, y: 1040 }] }]); await drv.relActions(g.s); };
const shot = async (name, sel) => {   // one element, cropped later out of the driver's composited page (the real pointer parked away: no hover tip)
  await park();
  const r = await g.ev(`${HELP} const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); await frames(4);
    const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height, devicePixelRatio];`);
  const b64 = await g.snap(); fs.writeFileSync(`${OUT}/full-${name}.png`, Buffer.from(b64, 'base64'));
  fs.writeFileSync(`${OUT}/rect-${name}.json`, JSON.stringify(r)); return r;
};
const SP = '.dev[data-id="spectrum"]', REG = '.dev[data-id="chem"] .reg-pane:not([hidden])';
try {
  judge('boot', (await g.waitFor('window.__LW&&__LW.ready', 600, 100)).ok === 1);
  /* 1 · SPECTRUM's head: populated (EMPTY shown), then empty (FILL ALL shown), then a real press of FILL ALL */
  const s1 = await g.ev(`${HELP} const c = document.querySelector('${SP}'); c.classList.remove('closed', 'folded'); await frames(6);
    const b = c.querySelector('.sp-head .reg-fill'); return { n: __LW.reg.populated().length, state: b.dataset.state, svg: !!b.querySelector('svg'), text: b.textContent, label: b.getAttribute('aria-label'), title: b.title };`);
  judge('SPECTRUM fill button read', true, s1);
  await shot('spectrum-head-empty-shown', SP + ' .sp-head');
  await shot('spectrum-ladder', SP + ' .ladder');
  const s2 = await g.ev(`${HELP} __LW.reg.clear(); await frames(6); const b = document.querySelector('${SP} .sp-head .reg-fill'); b.dispatchEvent(new PointerEvent('pointerenter')); await frames(2);
    return { n: __LW.reg.populated().length, state: b.dataset.state, svg: !!b.querySelector('svg'), label: b.getAttribute('aria-label'), title: b.title };`);
  judge('SPECTRUM emptied', true, s2);
  await shot('spectrum-head-fill-shown', SP + ' .sp-head');
  const tapFill = await g.tap(SP + ' .sp-head .reg-fill');
  const s3 = await g.ev(`${HELP} await frames(6); const b = document.querySelector('${SP} .sp-head .reg-fill'); return { n: __LW.reg.populated().length, state: b.dataset.state, label: b.getAttribute('aria-label') };`);
  judge('SPECTRUM FILL ALL by a real press', s3.n > 0 && s3.state === 'empty', { tapFill, s3 });
  await shot('spectrum-ladder-filled', SP + ' .ladder');
  /* 2 · ORBITAL and STATES ladders on water */
  const o1 = await g.ev(`${HELP} __LW.chem.setOn(true); await __LW.chem.solve('H2O'); const c = document.querySelector('.dev[data-id="chem"]'); c.classList.remove('closed', 'folded');
    __LW.register.setMode('orbital'); await wait(() => __LW.states.ladder()); await frames(8);
    const b = document.querySelector('${REG} .reg-fill'); return { mode: __LW.register.mode, state: b && b.dataset.state, sel: __LW.orbitals.save().selection.length };`);
  judge('ORBITAL ladder', true, o1);
  await shot('orbital-head', REG + ' .sp-head');
  await shot('orbital-ladder', REG + ' canvas.mol-c');
  const st = await g.ev(`${HELP} __LW.register.setMode('states'); __LW.states.preset('BEAT'); await ready(); await frames(8); return { mode: __LW.register.mode, lanes: __LW.states.state().lanes.length };`);
  judge('STATES ladder', true, st);
  await shot('states-ladder', REG + ' canvas.reg-ladder');
  /* 3 · STATES MORPH by hand, saved, the page reloaded, the project opened through FOLDERS' door */
  const m1 = await g.ev(`${HELP} __LW.states.preset('BEAT'); await ready(); const A = !!__LW.states.store('A'); __LW.states.preset('KICK Y'); await ready(); const B = !!__LW.states.store('B');
    const m = __LW.states.setMorph(true, 0.4); await ready(); await frames(6);
    const rows = document.querySelector('${REG} .sp-rows'); if (rows.hidden) document.querySelector('${REG} .sp-head > .trig').click(); await frames(4);   // HIDE off: the lanes on view
    return { shown: !rows.hidden, A, B, m, morphOn: __LW.states.state().morphOn, dim: rows.classList.contains('reg-morphing'), opacity: getComputedStyle(rows).opacity, data: JSON.stringify(__LW.serialize()) };`);
  judge('STATES MORPH by hand dims the lanes', m1.m === true && m1.dim === true, { ...m1, data: m1.data.length });
  await shot('states-morph-hand', REG);
  fs.writeFileSync(`${OUT}/morph-project.json`, m1.data);
  await g.nav();
  await g.waitFor('window.__LW&&__LW.ready', 600, 100);
  const m2 = await g.ev(`${HELP} const data = JSON.parse(arguments[0]);
    const r = await __LW.projects.folders.intake.ingest(new File([JSON.stringify({ lambdawaves: 'project', version: 1, path: 'f2/morph', data, notebook: { title: 'f2 morph', subtitle: '', text: '' } })], 'morph.lambdawaves.json', { type: 'application/json' }), { source: 'drop' });
    await wait(() => __LW.states.ladder() && __LW.states.state().morphOn); await ready(); await frames(10);
    const c = document.querySelector('.dev[data-id="chem"]'); c.classList.remove('closed', 'folded'); __LW.register.setMode('states'); await frames(8);
    const rows = document.querySelector('${REG} .sp-rows'); if (rows.hidden) document.querySelector('${REG} .sp-head > .trig').click(); await frames(4);
    return { shown: !rows.hidden, ok: r && r.ok, current: __LW.projects.current, mode: __LW.register.mode, morphOn: __LW.states.state().morphOn, s: __LW.states.state().morph, dim: !!rows && rows.classList.contains('reg-morphing'), opacity: rows && getComputedStyle(rows).opacity, errs: (window.__e || []).slice() };`, [m1.data]);
  judge('a saved STATES MORPH project reopened: MORPH on, the lanes dimmed as under a hand-set MORPH', m2.ok && m2.morphOn === true && m2.dim === true, m2);
  await shot('states-morph-restored', REG);
  fs.writeFileSync(`${OUT}/result-${TAG}.json`, JSON.stringify({ s1, s2, s3, o1, st, m1: { ...m1, data: m1.data.length }, m2 }, null, 1));
} finally { await g.close(); }
process.exit(done('f2 probe ' + TAG) ? 1 : 0);
