// S4 VERIFY items 6, 7, 10 (fresh context): segment names by REAL clicks (STYLE → a row named for the group; FRAME, a preference →
// no row; VIEW, whose caption native-ui removes); SEPARATE and LINKED transports through an undo/redo of a route; the undo action's
// label in the keyboard editor and the EDIT menu.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/seg-sep.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const out = {};
const reveal = `const pg = e.closest('.settings-page'); if (pg && pg.hidden) { const vp = pg.parentElement, i = [...vp.children].indexOf(pg), lbl = ['LOOK', 'DISPLAY', 'QUALITY'][i]; const tb = [...vp.parentElement.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === lbl && !vp.contains(b)); if (tb) tb.click(); await __w(120); }`;
const segPress = async (label, sel) => {
  const at = await g.run(`await __settle(); if (__LW.history.entries().length > 40) __LW.history.clear(); window.__n0 = __LW.history.entries().length; window.__pre = __ser(); const e = ${sel}; if (!e) return { E: 'missing' }; ${reveal} const d = e.closest('.dev'); if (d) __LW.layout.raise(d.dataset.id); await __w(150); __show(e); await __w(100); return __at(e) || { E: window.__coveredBy };`);
  if (!at || at.E) { out[label] = at; console.log(label, JSON.stringify(at)); return; }
  await g.click(at[0], at[1]);
  out[label] = await g.run(`await __w(600); __LW.history.flush(); return { rows: __LW.history.entries().slice(window.__n0).map((e) => e.label), moved: __ser() !== window.__pre };`);
  console.log(label, JSON.stringify(out[label]));
};
try {
  const styleB = `[...document.querySelectorAll('.dev[data-id="observer"] .seg-b')].find((b) => b.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === 'STYLE' && !b.classList.contains('on') && !b.disabled)`;
  out.styleOpt = await g.run(`const b = ${styleB}; return b ? [b.textContent.trim(), b.closest('.dev').querySelector('.dev-eyebrow')?.textContent.trim()] : null;`);
  if (!process.env.SKIP_SEG) await segPress('STYLE segment', styleB);
  if (!process.env.SKIP_SEG) await segPress('FRAME segment LATTICE (a preference)', `__segb('FRAME', 'LATTICE', 'settings')`);
  if (!process.env.SKIP_SEG) await segPress('FRAME segment BOX (back)', `__segb('FRAME', 'BOX', 'settings')`);
  if (!process.env.SKIP_SEG) await segPress('FINISH segment GLASS', `[...document.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === 'GLASS' && !b.disabled)`);
  if (!process.env.SKIP_SEG) await segPress('VIEW segment (caption removed by native-ui)', `(() => { const s = __LW.serialize().presentation.mat.view; const segs = [...document.querySelectorAll('.dev[data-id="observer"] .seg-b, .dev[data-id="state"] .seg-b')]; return segs.find((b) => /^(ORBITAL|DENSITY|Δρ|RE|IM|PHASE)$/i.test(b.textContent.trim()) && !b.classList.contains('on') && !b.disabled); })()`);
  console.log('style option', JSON.stringify(out.styleOpt));

  /* item 7 · SEPARATE */
  const sepRun = (link, fieldPlays, modPlays) => g.run(`const H = __LW.history, M = __LW.mod.model, R = __LW.mod.registry, live = () => __LW.serialize().presentation.ui.stage.mix;
    const link0 = __LW.mod.clockLink; __LW.mod.clockLink = ${link}; __LW.pause(); __LW.mod.stop && __LW.mod.stop(); await __w(150);
    const lfo = M.sourceList().find((s) => s.kind === 'lfo'); __LW.mod.bind(M.macroList()[0].id, lfo.id); for (const r of M.routeList()) __LW.mod.unroute(r.id);
    __LW.setStage(0.3); await __settle();
    ${fieldPlays ? '__LW.play();' : ''} ${modPlays ? '__LW.mod.play();' : ''} await __w(500);
    const s0 = { mod: __LW.mod.playing, field: __LW.clock.playing };
    __LW.mod.route(M.macroList()[0].id, 'material.stage', 0, 1); H.flush(); await __w(500);
    const routed = { mod: __LW.mod.playing, modulated: R.isModulated('material.stage'), live: +live().toFixed(3) };
    H.undo(); const t0 = performance.now(); let refollow = null; for (let i = 0; i < 40; i++) { await __w(25); if (__LW.mod.playing && refollow === null) refollow = Math.round(performance.now() - t0); }
    const undone = { mod: __LW.mod.playing, modulated: R.isModulated('material.stage'), base: R.baseOf('material.stage'), live: +live().toFixed(3), playingAgainAfterMs: refollow };
    H.redo(); await __w(600);
    const redone = { mod: __LW.mod.playing, modulated: R.isModulated('material.stage'), base: R.baseOf('material.stage'), live: +live().toFixed(3) };
    __LW.mod.stop && __LW.mod.stop(); __LW.pause(); for (const r of M.routeList()) __LW.mod.unroute(r.id); __LW.mod.clockLink = link0; await __settle();
    return { link: ${link}, s0, routed, undone, redone };`);
  await g.run(`__LW.layout.modulation.expand(); await __w(700); return 1;`);   /* a transport with no route plays only with its window open (host.js 'nothing-to-run') */
  out.separatePlaying = await sepRun(false, false, true); console.log('SEPARATE, MOD playing', JSON.stringify(out.separatePlaying));
  out.separatePaused = await sepRun(false, false, false); console.log('SEPARATE, MOD paused', JSON.stringify(out.separatePaused));
  out.linkedPlaying = await sepRun(true, true, false); console.log('LINKED, field playing', JSON.stringify(out.linkedPlaying));

  /* item 10 · the labels */
  out.labels = await g.run(`__LW.layout.keymap.open(); await __w(400); const km = document.querySelector('.keymap, #keymap, [aria-label="Keyboard shortcuts and bindings"]');
    const txt = km ? km.textContent : ''; const r = { undoNew: /undo the last edit/.test(txt), undoOld: /undo the last edit to ψ or its law/.test(txt), redo: /redo it \\(Ctrl\\+Y too\\)/.test(txt) };
    const s = km && km.querySelector('input[type="search"], input'); if (s) { s.value = 'undo'; s.dispatchEvent(new Event('input', { bubbles: true })); await __w(200); r.searchHits = [...km.querySelectorAll('li, [role="option"], .km-row, button')].map((e) => e.textContent.trim()).filter((t) => /undo/i.test(t) && t.length < 120).slice(0, 6); }
    __LW.layout.keymap.close(); await __w(200); return r;`);
  console.log('labels', JSON.stringify(out.labels));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('errs', JSON.stringify(out.errs), out.error || '');
