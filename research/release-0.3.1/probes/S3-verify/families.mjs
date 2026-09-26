// VERIFY item 1 (one row per edit, byte-identical undo/redo, per family) and item 5 (the skip is correct), with REAL pointers where
// a hand uses one.  Each scene: settle → pre reading → the edit → 550 ms → flush → rows/post → undo → 300 ms → redo → 300 ms → 500 ms.
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
const pre = () => g.run(`await __settle(); const H = __LW.history;
  const run = document.querySelector('#modwin .m2run'); window.__mwNode = document.querySelector('#modwin .m2dev');
  window.__pre = { n0: H.entries().length, s: __ser(), rows: __rows() }; return __pre.n0;`);
const post = (label) => g.run(`const H = __LW.history; await __w(550); H.flush();
  const rows = H.entries(), s = __ser(), P = window.__pre;
  const run = document.querySelector('#modwin .m2run'); let removed = 0;
  const ndev = run ? run.querySelectorAll('.m2dev').length : 0, dev0 = run ? run.querySelector('.m2dev') : null;
  const mo = run ? new MutationObserver((rs) => { for (const r of rs) for (const x of r.removedNodes) if (x.classList && x.classList.contains('m2dev')) removed++; }) : null;
  if (mo) mo.observe(run, { childList: true, subtree: true });
  const t0 = performance.now(), undid = __LW.history.undo(), ms = performance.now() - t0, u0 = __ser();
  await __w(0); if (mo) mo.disconnect(); const sameNode = run ? dev0 === run.querySelector('.m2dev') : null;
  await __w(300); const u1 = __ser();
  const redid = __LW.history.redo(), r0 = __ser(); await __w(300); const r1 = __ser();
  await __w(500); H.flush();
  return { label: ${JSON.stringify(label)}, added: rows.length - P.n0, names: rows.slice(P.n0).map((r) => r.label), changed: P.s !== s, undid, redid,
    undoSame: u0 === P.s && u1 === P.s, undoDiff: u1 === P.s ? [] : __diff(JSON.parse(P.s), JSON.parse(u1)).slice(0, 6),
    redoSame: r0 === s && r1 === s, redoDiff: r1 === s ? [] : __diff(JSON.parse(s), JSON.parse(r1)).slice(0, 6),
    stable: H.entries().length === rows.length, undoMs: +ms.toFixed(2), rebuilds: run ? +(removed / Math.max(1, ndev)).toFixed(2) : null, sameNode, errs: __e.slice() };`);
const scene = async (label, edit) => { await pre(); await edit(); const r = await post(label); out[label] = r; console.log(JSON.stringify(r)); return r; };
const pt = (expr) => g.run(`const e = ${expr}; if (!e) return { E: 'missing: ' + ${JSON.stringify(expr)} }; __show(e); await __w(60); const p = __at(e); return p || { E: 'covered: ' + ${JSON.stringify(expr)} };`);
try {
  out.boot = await g.run(`return { rows: __rows(), depth: __LW.history.depth, canUndo: __LW.history.canUndo };`);
  console.log('boot', JSON.stringify(out.boot));

  /* LOOK knob drag: 20 real pointermoves → one row */
  await scene('LOOK EXPOSURE drag (20 real moves)', async () => { const [x, y] = await pt(`__knob('EXPOSURE').querySelector('.k-dial')`); await g.realDrag(g.line(x, y, 0, -60, 20), 0, 25); });
  /* stage colour well: a picker's stream — one press, ten input events 40 ms apart, one change */
  await scene('stage colour (10 inputs + change)', async () => g.run(`const el = __show(document.querySelector('.stage-colour')); await __w(60);
    const [x, y] = __at(el) || [0, 0]; el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 91, button: 0, buttons: 1, clientX: x, clientY: y })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 91, button: 0, clientX: x, clientY: y }));
    for (let i = 0; i < 10; i++) { el.value = '#' + (0x30 + i * 8).toString(16) + '5070'; el.dispatchEvent(new Event('input', { bubbles: true })); await __w(40); }
    el.dispatchEvent(new Event('change', { bubbles: true })); return 1;`));
  /* overlay switches, real clicks */
  await scene('overlay KEPLER ORBIT (real click)', async () => { const [x, y] = await pt(`__sw('KEPLER ORBIT').querySelector('button') || __sw('KEPLER ORBIT')`); await g.click(x, y); });
  await scene('overlay VORTEX OVERLAY ON FIELD (real click)', async () => { const [x, y] = await pt(`__sw('OVERLAY ON FIELD').querySelector('button') || __sw('OVERLAY ON FIELD')`); await g.click(x, y); });
  /* a preset through its select */
  await scene('preset select → 2p+', async () => g.run(`const s = __show(document.querySelector('select[aria-label="preset superposition"]')); await __w(40);
    const [x, y] = __at(s) || [0, 0]; s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 92, button: 0, buttons: 1, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 92, button: 0, clientX: x, clientY: y }));
    s.value = '2p+'; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return 1;`));
  /* the element: ELEMENT Z knob, real drag */
  await scene('element ELEMENT Z drag (real)', async () => { const [x, y] = await pt(`__knob('ELEMENT Z').querySelector('.k-dial')`); await g.realDrag(g.line(x, y, 0, -30, 10), 0, 25); });
  /* A/B: STORE A, change the register, STORE B, TRANSITION on — real clicks */
  await scene('A/B STORE A (real click)', async () => { const [x, y] = await pt(`__trig('STORE A')`); await g.click(x, y); });
  await g.run(`const s = document.querySelector('select[aria-label="preset superposition"]'); s.value = '1s+2pz'; s.dispatchEvent(new Event('change', { bubbles: true })); await __settle(); return 1;`);
  await scene('A/B STORE B (real click)', async () => { const [x, y] = await pt(`__trig('STORE B')`); await g.click(x, y); });
  await scene('A/B TRANSITION on (real click)', async () => { const [x, y] = await pt(`__sw('TRANSITION').querySelector('button') || __sw('TRANSITION')`); await g.click(x, y); });
  { const [x, y] = await pt(`__sw('TRANSITION').querySelector('button') || __sw('TRANSITION')`); await g.click(x, y); await g.run(`await __settle(); return __LW.ab.on;`); }
  /* palette: a choice, and a custom stop */
  await scene('palette select (another palette)', async () => g.run(`const s = __show(document.querySelector('select[aria-label="palette"]')); await __w(40);
    s.value = [...s.options].map((o) => o.value).find((v) => v !== s.value); s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); return s.value;`));
  await scene('palette custom stop (colour well)', async () => g.run(`const el = __show(document.querySelector('.dev[data-id="palette"] input.pal-color')); await __w(40);
    el.value = '#a04020'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 1;`));

  /* the modulation window, through its own UI */
  await g.run(`__LW.layout.modulation.expand(); await __w(500); return 1;`);
  await scene('modulation ADD DEVICE → ADD LFO (real clicks)', async () => {
    const [x, y] = await pt(`document.querySelector('#modwin .m2devadd')`); await g.click(x, y);
    await g.run(`await __w(200); return 1;`);
    const [x2, y2] = await pt(`[...document.querySelectorAll('#modwin button')].find((b) => b.textContent.trim() === 'ADD LFO')`); await g.click(x2, y2);
  });
  await scene('modulation LFO dial drag (real, 12 moves)', async () => { const [x, y] = await pt(`document.querySelector('#modwin .m2dev.lfo .m2kd')`); await g.realDrag(g.line(x, y, 0, -40, 12), 0, 25); });
  /* a route: MACRO 1's grip dragged onto a routable dial the window does not cover */
  const target = await g.run(`for (const k of [__knob('SOFT'), __knob('ISO'), __knob('GRAIN'), ...document.querySelectorAll('.dev .k[data-param]')]) { if (!k || !k.dataset.param) continue; __show(k);
      for (const block of ['center', 'start', 'end']) { k.scrollIntoView({ block, behavior: 'instant' }); const b = k.querySelector('.k-dial').getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, h = document.elementFromPoint(x, y);
        const gr = document.querySelector('#modwin .m2slot .m2grip').getBoundingClientRect(); if (h && k.contains(h)) return { param: k.dataset.param, k: [x, y], g: [gr.left + gr.width / 2, gr.top + gr.height / 2] }; } } return { E: 'no drop target' };`);
  await scene('modulation route MACRO 1 grip → ' + target.param + ' (real drag)', async () => { const [gx, gy] = target.g, [kx, ky] = target.k; await g.realDrag(g.line(gx, gy, kx - gx, ky - gy, 12), 0, 30); });
  out.routes = await g.run(`return __LW.mod.model.routeList().map((r) => r.targetId);`);
  console.log('routes', JSON.stringify(out.routes));

  /* ITEM 5 · THE SKIP: undo a modulation edit (the rack reloads), redo — the edit scope and the window show the redone state */
  out.skip = await g.run(`const H = __LW.history, M = __LW.mod.model; await __settle();
    const read = () => ({ sources: M.sourceList().length, routes: M.routeList().length, devs: document.querySelectorAll('#modwin .m2run .m2dev').length,
      rings: document.querySelectorAll('.k .m2depthring, .k.routed, .k [class*="route"]').length });
    const s0 = __ser(), w0 = read(); __LW.mod.addSource('lfo'); await __w(550); H.flush(); const s1 = __ser(), w1 = read();
    H.undo(); await __w(300); const su = __ser(), wu = read(); H.redo(); await __w(300); const sr = __ser(), wr = read();
    return { w0, w1, wu, wr, undoSame: su === s0, redoSame: sr === s1, rows: __rows().slice(-3) };`);
  console.log('skip', JSON.stringify(out.skip));
  /* …then an OVERLAY-only undo: the modulation section must not reload (same #modwin .m2dev node, no removals) */
  await scene('ITEM5 overlay-only undo with the window open (KEPLER real click)', async () => { const [x, y] = await pt(`__sw('KEPLER ORBIT').querySelector('button') || __sw('KEPLER ORBIT')`); await g.click(x, y); });

  /* STATES lane change: MOLECULES on, MO-REGISTRY on in STATES mode, a lane added, its |b|² fader dragged by a real pointer */
  await g.run(`__LW.layout.modulation.collapse(); await __w(200); return 1;`);
  out.chemOn = await scene('MOLECULES ON (real click on its switch)', async () => { const [x, y] = await pt(`__sw('MOLECULES ON').querySelector('button') || __sw('MOLECULES ON')`); await g.click(x, y); });
  out.chemRows = await g.run(`await __w(3000); __LW.history.flush(); return { rows: __rows(), depth: __LW.history.depth, canRedo: __LW.history.canRedo };`);
  console.log('chem rows after 3 s', JSON.stringify(out.chemRows));
  /* the MOLECULES fill's consequence: an edit after the fill, undone — is redo still available? */
  out.chemRedo = await g.run(`const H = __LW.history; __LW.chem.setOn(false); await __w(1500); await __settle(); const n0 = H.entries().length;
    __LW.chem.setOn(true); H.note('MOLECULES probe'); await __w(600); H.flush(); const afterOn = __rows().slice(n0);
    await __w(2500); const dirtyAfterFill = H.depth > H.cursor;
    __LW.setStage(0.61); H.flush(); const afterStage = __rows().slice(n0);
    H.undo(); await __w(2500); const after = { canRedo: H.canRedo, redoDepth: H.redoDepth, depth: H.depth, cursor: H.cursor };
    H.undo(); await __w(2500); const after2 = { canRedo: H.canRedo, redoDepth: H.redoDepth, depth: H.depth, cursor: H.cursor, chemOn: __LW.chem.on };
    return { afterOn, dirtyAfterFill, afterStage, afterUndoStage: after, afterUndoOn: after2, rows: __rows().slice(n0 - 1) };`);
  console.log('chem redo', JSON.stringify(out.chemRedo));
  out.states = await g.run(`const H = __LW.history; if (!__LW.chem.on) __LW.chem.setOn(true); for (let i = 0; i < 80 && !(__LW.orbitals.ladder && __LW.orbitals.ladder()); i++) await __w(100);
    __LW.register.setMode('states'); await __w(300); const d = document.querySelector('.dev[data-id="orbitals"]'); d.classList.remove('closed');
    const sw = [...d.querySelectorAll('.sw')].filter((s) => (s.querySelector('.sw-lbl') || {}).textContent === 'MO-REGISTRY ON');
    let on = null; for (let i = 0; i < 60; i++) { try { on = __LW.states.setOn ? __LW.states.setOn(true) : null; } catch (e) {} if (d.querySelectorAll('.sp-row').length) break; await __w(150); }
    const lad = __LW.states.ladder ? __LW.states.ladder() : null; const keys = lad && lad.omega ? lad.omega.length : 0;
    __LW.states.select(1, 0.45, 0); __LW.states.select(2, 0.3, 0); await __w(400); await __settle();
    return { rowsDom: d.querySelectorAll('.sp-row').length, keys, mode: __LW.register.mode, lanes: (__LW.serialize({ scope: 'edit' }).presentation.instruments.states || {}).lanes };`);
  console.log('states setup', JSON.stringify(out.states).slice(0, 400));
  await scene('STATES lane |b|² fader drag (real)', async () => { const [x, y] = await pt(`[...document.querySelectorAll('.dev[data-id="orbitals"] .sp-row')].slice(-1)[0].querySelector('.fd')`); await g.realDrag(g.line(x, y, 0, -25, 10), 0, 25); });
  await scene('STATES lane phase knob drag (real)', async () => { const [x, y] = await pt(`[...document.querySelectorAll('.dev[data-id="orbitals"] .sp-row')].slice(-1)[0].querySelector('.k .k-dial, .k')`); await g.realDrag(g.line(x, y, 0, -25, 10), 0, 25); });
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('\nSUMMARY');
for (const [k, r] of Object.entries(out)) if (r && r.label) console.log(`${r.added === 1 && r.undoSame && r.redoSame && r.stable ? 'OK ' : 'BAD'} ${k}: added ${r.added} ${JSON.stringify(r.names)} undo ${r.undoSame} redo ${r.redoSame} stable ${r.stable} ${r.undoMs} ms rebuilds ${r.rebuilds} sameNode ${r.sameNode}${r.undoDiff.length ? ' UNDO-DIFF ' + JSON.stringify(r.undoDiff) : ''}${r.redoDiff.length ? ' REDO-DIFF ' + JSON.stringify(r.redoDiff) : ''}${r.errs.length ? ' ERRS ' + JSON.stringify(r.errs) : ''}`);
console.log('errs', JSON.stringify(out.errs));
