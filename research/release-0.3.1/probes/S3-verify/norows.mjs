// VERIFY item 2 (no row from a view, the arrangement, the notebook, GRID, the window's visibility and EVERY preference control) and
// item 8 (the unsaved-changes mark vs the history), with real pointers and real keys.  Each case: a clean ring (clear('probe')) and a
// clean project mark → the action → 550 ms → flush → rows added, canUndo, projects.dirty, the pending name left standing.
import { lab } from './kit.mjs';
const g = await lab();
const out = {};
const pt = (expr) => g.ev(`const e = ${expr}; if (!e) return { E: 'missing: ' + ${JSON.stringify(expr)} }; __show(e); await __w(80); const p = __at(e); return p || { E: 'covered (' + __coveredBy + '): ' + ${JSON.stringify(expr)} };`);
const begin = () => g.run(`await __settle(); __LW.history.clear('probe'); __LW.layout.projects.markClean(); window.__s0 = __ser(); window.__set0 = localStorage.getItem('lambdawaves.q0.settings'); return 1;`);
const end = (label) => g.run(`const H = __LW.history; await __w(550); const pendingBeforeFlush = H.pendingLabel; H.flush();
  const s = __ser(); return { label: ${JSON.stringify(label)}, rows: H.entries().length - 1, names: __rows().slice(1), canUndo: H.canUndo, dirty: __LW.layout.projects.dirty,
    editMoved: s !== __s0, diff: s !== __s0 ? __diff(JSON.parse(__s0), JSON.parse(s)).slice(0, 4) : [], pending: pendingBeforeFlush, settingsMoved: localStorage.getItem('lambdawaves.q0.settings') !== __set0, errs: __e.slice() };`);
let lastVia = '';
const run = async (label, act) => { await begin(); lastVia = ''; try { await act(); } catch (e) { out[label] = { label, E: String(e.message || e) }; console.log(label, 'ERROR', e.message); return; } const r = await end(label); r.via = lastVia; out[label] = r; console.log(JSON.stringify(r)); };
/** a real click where the control is the topmost thing at its centre, else a synthetic press on it (recorded in .via) */
const pressExpr = (expr) => async () => { const p = await pt(expr); if (!p.E) { lastVia = 'real'; return g.click(p[0], p[1]); }
  lastVia = 'synthetic (' + p.E.split(':')[0] + ')'; const r = await g.run(`const e = ${expr}; if (!e) return { E: 'missing' }; __show(e); await __w(60); await __spress(e); return 1;`); if (r && r.E) throw new Error(r.E); };
const dragExpr = (expr, dy = -30) => async () => { const p = await pt(expr); if (!p.E) { lastVia = 'real'; return g.realDrag(g.line(p[0], p[1], 0, dy, 10), 0, 25); }
  lastVia = 'synthetic (' + p.E.split(':')[0] + ')'; const r = await g.run(`const e = ${expr}; if (!e) return { E: 'missing' }; __show(e); await __w(60); await __sdrag(e, 0, ${dy}); return 1;`); if (r && r.E) throw new Error(r.E); };
const segClick = (group, lbl, dev = 'settings') => pressExpr(`__segb(${JSON.stringify(group)}, ${JSON.stringify(lbl)}, ${JSON.stringify(dev)})`);
const swClick = (lbl, dev = 'settings') => pressExpr(`(__sw(${JSON.stringify(lbl)}, ${JSON.stringify(dev)}) || null) && (__sw(${JSON.stringify(lbl)}, ${JSON.stringify(dev)}).querySelector('button') || __sw(${JSON.stringify(lbl)}, ${JSON.stringify(dev)}))`);
const knobDrag = (lbl, dev, dy = -30) => dragExpr(`(__knob(${JSON.stringify(lbl)}, ${JSON.stringify(dev)}) || null) && __knob(${JSON.stringify(lbl)}, ${JSON.stringify(dev)}).querySelector('.k-dial')`, dy);
const tab = async (name) => { await g.run(`const b = __segb('', ${JSON.stringify(name)}, 'settings'); __show(b); await __spress(b); await __w(200); return 1;`); };
try {
  await g.run(`__LW.camera.setAutoRotate(false); return 1;`);
  /* ── the view, the arrangement, the notebook, GRID, the modulation window ── */
  await run('camera orbit (real drag on the stage)', async () => { const p = await g.run(`const e = document.querySelector('#field'); for (let y = 140; y < innerHeight - 80; y += 40) for (let x = 220; x < innerWidth - 220; x += 40) if (document.elementFromPoint(x, y) === e) return [x, y]; return { E: 'covered' };`); await g.realDrag(g.line(p[0], p[1], 160, 40, 10), 0, 30); await g.run(`__LW.camera.stop(); return 1;`); });
  await run('window drag (STATE eyebrow)', async () => { const p = await pt(`document.querySelector('.dev[data-id="state"] .dev-eyebrow')`); await g.realDrag(g.line(p[0], p[1], -90, 50, 8), 0, 30); });
  await run('notebook typing (real keys)', async () => { await g.run(`__LW.layout.notebook.open('notes'); await __w(200); document.querySelector('.nb-text').focus(); return 1;`); for (const ch of 'hello') await g.key(ch); });
  await run('notebook resize (real drag on its grip)', async () => { const p = await pt(`document.querySelector('#notebook .nb-grip')`); await g.realDrag(g.line(p[0], p[1], 50, 40, 6), 0, 30); });
  await g.run(`__LW.layout.notebook.close(); await __w(200); return 1;`);
  await tab('QUALITY');
  await run('GRID 96³ (real click)', segClick('GRID', '96³'));
  await run('GRID 64³ (real click)', segClick('GRID', '64³'));
  await run('modulation window toggled twice (real clicks on its logo)', async () => { for (let i = 0; i < 2; i++) { const p = await pt(`document.querySelector('.mod-logo')`); await g.click(p[0], p[1]); await g.run(`await __w(350); return 1;`); } });
  /* ── every PREFERENCE control, through its own UI ── */
  await tab('DISPLAY');
  await run('THEME LIGHT (real click)', segClick('THEME', 'LIGHT'));
  await run('THEME DARK (real click)', segClick('THEME', 'DARK'));
  await run('CARD STYLE TINTED (real click)', segClick('CARD STYLE', 'TINTED'));
  await run('CARD STYLE REFRACTIVE (real click)', segClick('CARD STYLE', 'REFRACTIVE'));
  await run('FROST OFF (real click)', segClick('FROST', 'OFF'));
  await run('FROST ALWAYS (real click)', segClick('FROST', 'ALWAYS'));
  await run('GLASS BLUR knob drag', knobDrag('GLASS BLUR', 'settings'));
  await run('ACCENT A knob drag', knobDrag('ACCENT A', 'settings'));
  await run('VIVID knob drag', knobDrag('VIVID', 'settings'));
  await run('STATUS TAGS switch', swClick('STATUS TAGS'));
  await run('CONTROL HINTS switch', swClick('CONTROL HINTS'));
  await run('DISCONNECTED switch', swClick('DISCONNECTED'));
  await run('DISPLAY P3 switch', swClick('DISPLAY P3'));
  await tab('LOOK');
  await run('FRAME OFF (real click)', segClick('FRAME', 'OFF'));
  out.frameAfter = await g.run(`return { frame: __LW.mat.frame, frameMode: __LW.mat.frameMode };`);
  /* an unrelated edit, then undo — the frame must stay OFF */
  out.frameUndo = await g.run(`const H = __LW.history; __LW.setStage(0.23); H.flush(); const rows = __rows(); const ok = H.undo(); await __w(200); return { rows, undid: ok, frame: __LW.mat.frame, frameMode: __LW.mat.frameMode, sw: (document.querySelector('.dev[data-id="settings"]') || document).querySelectorAll('.seg-b.on').length };`);
  console.log('frame after', JSON.stringify(out.frameAfter), 'after an undo', JSON.stringify(out.frameUndo));
  await run('FRAME BOX (real click)', segClick('FRAME', 'BOX'));
  await run('AXES OFF (real click)', segClick('AXES', 'OFF'));
  out.axisUndo = await g.run(`const H = __LW.history; __LW.setStage(0.29); H.flush(); H.undo(); await __w(200); return { axis: __LW.mat.axis, axisMode: __LW.mat.axisMode };`);
  console.log('axes after an undo', JSON.stringify(out.axisUndo));
  await run('AXES BOX (real click)', segClick('AXES', 'BOX'));
  await run('AXIS COLOUR RGB (real click)', segClick('AXIS COLOUR', 'RGB'));
  await run('palette INVERT switch', swClick('INVERT', 'palette'));
  await tab('QUALITY');
  await run('AUTO SCALE switch off', swClick('AUTO SCALE'));
  await run('AUTO SCALE switch on', swClick('AUTO SCALE'));
  await run('GOVERNOR switch off', swClick('GOVERNOR'));
  await run('GOVERNOR switch on', swClick('GOVERNOR'));
  await run('KEEP FRAMES switch', swClick('KEEP FRAMES'));
  await run('FIELD CLOCK cap 30 Hz', segClick('FIELD CLOCK cap', '30 Hz'));
  await run('DOMAIN AUTO switch (PROJECT by the table: expected a row)', swClick('DOMAIN AUTO'));
  /* camera feel (PREFERENCE, D4) and the camera mode (PROJECT, not in history) */
  await run('camera SPIN knob', knobDrag('SPIN', 'camera'));
  await run('camera FRICTION knob', knobDrag('FRICTION', 'camera'));
  await run('camera DRAG GAIN knob', knobDrag('DRAG GAIN', 'camera'));
  await run('camera TURNTABLE (real click)', segClick('', 'TURNTABLE', 'camera'));
  await run('camera FREE (real click)', segClick('', 'FREE', 'camera'));
  await run('camera ZOOM knob (a view)', knobDrag('ZOOM', 'camera'));
  await run('camera FOV knob (a view)', knobDrag('FOV', 'camera'));
  await run('AUTOROTATE switch (PROJECT, not in history)', swClick('AUTOROTATE', 'camera'));
  await g.run(`__LW.camera.setAutoRotate(false); return 1;`);
  await run('METERS PERFORMANCE 120 Hz', segClick('PERFORMANCE', '120 Hz', 'meters'));
  out.errs = await g.run(`return __e.slice();`);
} catch (e) { console.error(e); out.error = String(e && e.stack || e); }
finally { await g.close(); }
console.log('\nSUMMARY');
for (const [k, r] of Object.entries(out)) if (r && r.label) console.log(`${r.E ? 'ERR' : r.rows ? 'ROW' : '  0'} ${k}: ${r.E || `rows ${r.rows} ${JSON.stringify(r.names)} canUndo ${r.canUndo} dirty ${r.dirty} editMoved ${r.editMoved} pending ${JSON.stringify(r.pending)} settingsMoved ${r.settingsMoved} via ${r.via}${r.diff.length ? ' DIFF ' + JSON.stringify(r.diff) : ''}${r.errs.length ? ' ERRS ' + JSON.stringify(r.errs) : ''}`}`);
console.log('frame', JSON.stringify(out.frameAfter), JSON.stringify(out.frameUndo), 'axes', JSON.stringify(out.axisUndo));
console.log('errs', JSON.stringify(out.errs), out.error || '');
