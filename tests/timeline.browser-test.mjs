// 0.5.0 C7b · THE TIMELINE AND THE RENDER CARD ARE THE KIT'S (C7B-DESIGN §5.2): the kit's own proofs (TIMELINE.md, RENDER.md)
// re-aimed at λWAVES, through real input where a hand is the claim (every press hit-tested by gatekit's tap).
//   T1  WINDOW › TIMELINE opens it docked at the foot of the span; idle, open or closed, it books no frame
//   T2  THE play's edge: Space starts t AND the playhead, Space stops both; a tap on the ruler moves the beat, never t
//   T3  a held YAW arc (500 ms) → TIMELINE CLIP → CREATE AUTOMATION CLIP; a paused seek previews the curve on obs.yaw
//   T4  the stage mask: the window's panes and chips are masked, its gaps are not; a real drag moves the mask while paused; closed, none
//   T5  THE FOCUS LAW: with the surface focused, E is the timeline's SELECT tool (not a dolly), and Space still plays
//   T9  undo: a clip edit is one row of the timeline's own undo; a λWAVES undo leaves the arrangement; NEW clears it
//   T10 a project with an arrangement saves, reopens and serialises byte-identically; NEW and the demos carry no `timeline`
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import { open, judge, done } from '../tools/gate/gatekit.mjs';
import { actions, relActions } from '../tools/gate/drv.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz&sw=0&warn=0`, { width: 1500, height: 950, script: 300000,
  prefs: { 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true } });
const ev = async (body) => { const r = await g.ev(body); if (r && r.E) throw new Error('page threw: ' + r.E); return r; };
const SPACE = '';
const hold = async (x, y, ms) => { await actions(g.s, [{ type: 'pointer', id: 'h' + Date.now(), parameters: { pointerType: 'mouse' }, actions: [
  { type: 'pointerMove', origin: 'viewport', x, y, duration: 0 }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: ms }, { type: 'pointerUp', button: 0 }] }]); await relActions(g.s); };
try {
  judge('T0 boot', (await g.waitFor('window.__LW && __LW.ready && __LW.timeline', 3000, 20)).ok === 1);
  await ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    window.__w = (ms) => new Promise((r) => setTimeout(r, ms));
    const field = __LW.field, set = field.setOcclusion; window.__masks = [];
    field.setOcclusion = function (rects) { window.__masks = rects.map((r) => r.slice()); return set.call(field, rects); };
    __LW.mat.frame = true; __LW.mat.frameMode = 'lattice'; __LW.pause(); await __LW.settle(); return 1;`);

  /* ── T1 · WINDOW › TIMELINE (a real tap on the row), docked at the foot; no frame booked while it idles ── */
  const t1a = await ev(`await __w(800); const f0 = __LW.stats.frames; await __w(1200); const idleClosed = __LW.stats.frames - f0;
    __LW.layout.menu.open(); const bar = document.getElementById('menubar'), btn = [...bar.querySelectorAll('.mb-btn')].find((b) => b.dataset.menu === 'WINDOW'); btn.click(); await __w(200);
    const it = [...btn.parentElement.querySelectorAll('.mb-item')].find((i) => i.querySelector('.mb-lbl').textContent.trim() === 'TIMELINE'); if (it) it.id = 'tl-row';
    return { idleClosed, row: !!it, open: __LW.timeline.isOpen() };`);
  const tapRow = await g.tap('#tl-row');
  const t1 = await ev(`await __w(700); await __LW.settle(); const tl = __LW.timeline, b = tl.root.getBoundingClientRect(), st = tl.presentation();
    const f0 = __LW.stats.frames; await __w(1200); const idleOpen = __LW.stats.frames - f0;
    return { open: tl.isOpen(), dock: st.dock, box: [b.left, b.top, b.right, b.bottom].map(Math.round), vh: innerHeight, idleOpen, errs: __e.slice() };`);
  judge('T1 WINDOW › TIMELINE (a real tap) opens it docked at the foot of the span; idle it books no frame, open or closed',
    t1a.row && tapRow.ok === 1 && !t1a.open && t1.open && t1.dock === 'bottom' && t1.box[3] > t1.vh - 40 && t1.box[0] > 100 && t1a.idleClosed === 0 && t1.idleOpen === 0 && !t1.errs.length, { t1a, tapRow, t1 });

  /* ── T2 · THE play's edge: a real Space plays t and the beat together, a second pauses both; a tap on the ruler moves the beat only ── */
  await ev(`if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); __LW.timeline.controller.seek(0); await __LW.settle(); return 1;`);
  await g.press(SPACE);
  const t2a = await ev(`await __w(1500); const tl = __LW.timeline; return { playing: __LW.clock.playing, t: __LW.clock.t, beat: tl.controller.state().beat, running: tl.controller.state().playing };`);
  await g.press(SPACE);
  const t2b = await ev(`await __w(300); const tl = __LW.timeline, s = tl.controller.state(); window.__t2 = { t: __LW.clock.t, beat: s.beat };
    const r = tl.root.querySelector('.tl-ruler').getBoundingClientRect(); const ruler = tl.root.querySelector('.tl-ruler'); ruler.id = 'tl-ruler';
    return { playing: __LW.clock.playing, modPlaying: s.playing, t: __LW.clock.t, beat: s.beat };`);
  const rulerAt = await ev(`const r = document.getElementById('tl-ruler').getBoundingClientRect(); return { x: Math.round(r.left + r.width * 0.4), y: Math.round(r.top + r.height / 2) };`);
  await hold(rulerAt.x, rulerAt.y, 40);
  const t2c = await ev(`await __w(300); const s = __LW.timeline.controller.state(); return { t: __LW.clock.t, beat: s.beat, before: window.__t2, playing: __LW.clock.playing };`);
  judge('T2 a real Space starts t AND the playhead, a second stops both; a tap on the ruler moves the beat and leaves t',
    t2a.playing && t2a.running && t2a.t > 0 && t2a.beat > 0 && !t2b.playing && !t2b.modPlaying && Math.abs(t2c.beat - t2c.before.beat) > 0.5 && t2c.t === t2c.before.t && !t2c.playing, { t2a, t2b, t2c });

  /* ── T3 · a held CAMERA dial (ZOOM, 500 ms) opens TIMELINE CLIP without moving; the YAW arc's right-click opens it at once (its hold is the
     sphere's: brief B14), and CREATE AUTOMATION CLIP makes the clip; a paused seek previews the curve on obs.yaw ── */
  const zoom = await ev(`const S = document.querySelector('.dev[data-id="camera"]'); S.classList.remove('closed'); if (S.classList.contains('folded')) S.querySelector('.dev-fold').click();
    const k = document.querySelector('.k[data-param="observer.dist"]'); k.scrollIntoView({ block: 'center', behavior: 'instant' }); await __w(300);
    const d = k.querySelector('.k-dial').getBoundingClientRect(); return { x: Math.round(d.left + d.width / 2), y: Math.round(d.top + d.height / 2), dist: __LW.obs.dist };`);
  await hold(zoom.x, zoom.y, 700);
  const held = await ev(`await __w(150); const p = document.querySelector('.tl-pop'), r = { pop: !!p, create: !!(p && p.querySelector('[data-tl-action="create-clip"]')), moved: __LW.obs.dist !== ${zoom.dist} };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await __w(100); r.closed = !document.querySelector('.tl-pop'); return r;`);
  const yaw = await ev(`const d = document.querySelector('.k[data-param="observer.yaw"] .k-dial').getBoundingClientRect(); return { x: Math.round(d.left + d.width / 2), y: Math.round(d.top + d.height / 2), yaw: __LW.obs.yaw };`);
  await actions(g.s, [{ type: 'pointer', id: 'rc', parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', origin: 'viewport', x: yaw.x, y: yaw.y, duration: 0 }, { type: 'pointerDown', button: 2 }, { type: 'pause', duration: 40 }, { type: 'pointerUp', button: 2 }] }]);
  await relActions(g.s);
  const pop = await ev(`await __w(150); const p = document.querySelector('.tl-pop'); const b = p && p.querySelector('[data-tl-action="create-clip"]'); if (b) b.id = 'tl-create';
    return { pop: !!p, title: p ? p.textContent.slice(0, 60) : null, yawMoved: __LW.obs.yaw !== ${yaw.yaw} };`);
  const tapCreate = await g.tap('#tl-create');
  const t3 = await ev(`await __w(300); const tl = __LW.timeline, doc = tl.model.state(), cv = doc.curves.find((c) => c.targetId === 'observer.yaw'), clip = cv && doc.clips.find((c) => c.curveId === cv.id);
    if (!clip) return { clip: null, doc };
    tl.model.updateCurve(cv.id, { points: [{ t: 0, v: 0.1, tension: 0 }, { t: 1, v: 0.9, tension: 0 }] });
    const R = __LW.mod.host.registry, beat = clip.start + clip.duration / 2; tl.controller.seek(beat); await __w(200); await __LW.settle();
    const want = R.fromNorm('observer.yaw', tl.automation('observer.yaw', beat)), got = R.read('observer.yaw'), yaw1 = __LW.obs.yaw;
    tl.controller.seek(clip.start + clip.duration * 0.25); await __w(200); const got2 = R.read('observer.yaw'), want2 = R.fromNorm('observer.yaw', tl.automation('observer.yaw', clip.start + clip.duration * 0.25));
    return { clip: { start: clip.start, duration: clip.duration }, target: cv.targetId, want, got, want2, got2, stage: [yaw1, __LW.obs.yaw], errs: __e.slice() };`);
  judge('T3 a held ZOOM dial opens TIMELINE CLIP (unmoved); a right-click on the YAW arc opens it; CREATE AUTOMATION CLIP (a real tap) places it; a paused seek previews the curve on YAW (the target; FREE orbits the stage by it)',
    held.pop && held.create && !held.moved && held.closed && pop.pop && !pop.yawMoved && tapCreate.ok === 1 && t3.clip && Math.abs(t3.got - t3.want) < 1e-9 && Math.abs(t3.got2 - t3.want2) < 1e-9 && Math.abs(t3.stage[0] - t3.stage[1]) > 0.1 && !t3.errs.length, { held, pop, tapCreate, t3 });

  /* ── T4 · the stage mask: panes and chips masked, gaps not; a real drag of the rail moves it while paused; closed, nothing of it ── */
  const inspect = `await __LW.settle(); await __w(350); await __LW.settle(); const tl = __LW.timeline, c = document.getElementById('field').getBoundingClientRect();
    const hit = (x, y) => __masks.some((m) => m[0] <= x - c.left && x - c.left < m[2] && m[1] <= y - c.top && y - c.top < m[3]);
    const mid = (e) => { const r = e.getBoundingClientRect(); return [(r.left + r.right) / 2, (r.top + r.bottom) / 2]; };
    const ruler = tl.root.querySelector('.tl-ruler'), panes = [...tl.root.querySelectorAll('.tl-pane')].filter((p) => p.getBoundingClientRect().height > 4).slice(0, 2), chips = [...tl.rail.el.querySelectorAll('.mir-chip')];
    const rr = ruler.getBoundingClientRect(), p0 = panes[0].getBoundingClientRect(), b = tl.root.getBoundingClientRect();
    return { box: [b.left, b.top], ruler: hit(...mid(ruler)), panes: panes.map((p) => hit(...mid(p))), chips: chips.map((x) => hit(...mid(x))), bar: hit(...mid(tl.root.querySelector('.tl-toolbar'))),
      gap: p0.top - rr.bottom > 4 ? hit(rr.left + 40, (rr.bottom + p0.top) / 2) : 'none', whole: __masks.some((m) => Math.abs(m[0] - (b.left - c.left)) < 1 && Math.abs(m[1] - (b.top - c.top)) < 1 && Math.abs(m[2] - (b.right - c.left)) < 1), count: __masks.length };`;
  const t4a = await ev(`__LW.timeline.controller.seek(40); ` + inspect);
  const grip = await ev(`const b = __LW.timeline.rail.grip.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };`);
  await actions(g.s, [{ type: 'pointer', id: 'tl-drag', parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', origin: 'viewport', x: grip.x, y: grip.y, duration: 0 }, { type: 'pointerDown', button: 0 },
    { type: 'pointerMove', origin: 'viewport', x: grip.x + 60, y: grip.y - 260, duration: 200 }, { type: 'pointerUp', button: 0 }] }]);
  await relActions(g.s);
  const t4b = await ev(inspect);
  const t4c = await ev(`__LW.timeline.close(); await __w(500); await __LW.settle(); const c = document.getElementById('field').getBoundingClientRect(), b = __LW.timeline.root.getBoundingClientRect();
    return { count: __masks.length, open: __LW.timeline.isOpen(), playing: __LW.clock.playing };`);
  judge('T4 the stage mask holds the TIMELINE\'s ruler, lanes, work bar and chips, never its clear box or the gap between them; a real drag moves it while paused; closed, it lets go',
    t4a.ruler && t4a.panes.every(Boolean) && t4a.chips.length >= 3 && t4a.chips.every(Boolean) && t4a.bar && t4a.gap !== true && !t4a.whole && t4a.count <= 32
      && t4b.box[1] < t4a.box[1] - 100 && t4b.ruler && t4b.panes.every(Boolean) && !t4b.whole && !t4c.open && t4c.count < t4a.count && !t4c.playing, { t4a, t4b, t4c });

  /* ── T5 · THE FOCUS LAW: the surface focused, E is the SELECT tool and the camera does not dolly; Space still plays ── */
  await ev(`const tl = __LW.timeline; tl.open(); await __w(600); tl.editor.setTool('edit'); const sf = tl.editor.surface, at = sf.matches('[tabindex]') ? sf : sf.querySelector('[tabindex]') || sf; at.focus({ preventScroll: true }); window.__d0 = __LW.obs.dist; return 1;`);
  await g.press('e');
  const t5a = await ev(`await __w(200); const tl = __LW.timeline; return { tool: tl.editor.tool(), dist: __LW.obs.dist, d0: window.__d0, live: tl.editor.keysLive(), active: document.activeElement && (document.activeElement.className || document.activeElement.tagName) };`);
  await g.press(SPACE);
  const t5b = await ev(`await __w(500); const p = __LW.clock.playing; __LW.pause(); return { playing: p };`);
  judge('T5 THE FOCUS LAW: with the TIMELINE\'s surface focused a real E picks its SELECT tool and the camera stays put; Space still plays the one clock',
    t5a.live && t5a.tool === 'select' && t5a.dist === t5a.d0 && t5b.playing, { t5a, t5b });

  /* ── T9 · undo: one clip edit is one row of the timeline's own undo; a λWAVES undo leaves the arrangement; NEW clears it ── */
  const t9 = await ev(`const tl = __LW.timeline, M = tl.model, n0 = M.state().clips.length;
    const id = M.create({ targetId: 'material.hue', name: 'HUE', value: 0.5, start: 8, duration: 4, laneId: M.state().lanes[1].id }); const n1 = M.state().clips.length;
    M.undo(); const n2 = M.state().clips.length; M.redo(); const sig = JSON.stringify(M.state());
    __LW.history.flush(); const d0 = __LW.history.depth; __LW.loadPreset('1s+2s', { hand: true }); await __w(450); __LW.history.flush(); const d1 = __LW.history.depth;
    __LW.history.undo(); await __w(300); const afterUndo = JSON.stringify(M.state()) === sig;
    await __LW.layout.projects.fresh(); await __w(500); const fresh = M.state();
    return { n0, n1, n2, d0, d1, afterUndo, fresh: { clips: fresh.clips.length, active: !!fresh.active, curves: fresh.curves.length }, errs: __e.slice() };`);
  judge('T9 a clip is one row of the TIMELINE\'s own undo; a λWAVES undo leaves the arrangement as it was; NEW clears it',
    t9.n1 === t9.n0 + 1 && t9.n2 === t9.n0 && t9.d1 > t9.d0 && t9.afterUndo && t9.fresh.clips === 0 && !t9.fresh.active && t9.fresh.curves === 0 && !t9.errs.length, t9);

  /* ── T10 · a project carries its arrangement through save, NEW and open, byte for byte; NEW and the demos carry none ── */
  const t10 = await ev(`const tl = __LW.timeline, M = tl.model, P = __LW.layout.projects;
    M.create({ targetId: 'material.hue', name: 'HUE', value: 0.25, start: 4, duration: 8, laneId: M.state().lanes[0].id }); M.setActive({ start: 4, end: 12 });
    const sig = JSON.stringify(M.state()); P.save('tl-suite/arrangement'); const text = P.exportText('tl-suite/arrangement');
    await P.fresh(); await __w(400); const empty = M.state().clips.length, emptyKey = 'timeline' in __LW.serialize().presentation;
    P.open('tl-suite/arrangement'); await __w(500); const back = JSON.stringify(M.state()) === sig; P.save('tl-suite/arrangement'); const again = P.exportText('tl-suite/arrangement');
    const strip = (t) => { const o = JSON.parse(t); delete o.saved; delete o.opened; delete o.data.presentation.layout.at; return JSON.stringify(o); };   // the three stamps a save writes
    const carry = [];
    for (const f of ['new-project', 'demos/wave-dancer', 'demos/water', 'demos/benzene', 'demos/n2', 'demos/h2-sigma-u', 'demos/helium']) {
      const t = await (await fetch('./' + f + '.lambdawaves.json', { cache: 'no-cache' })).text(); if (/"timeline"/.test(t)) carry.push(f); }
    const diff = []; const walk = (x, y, p) => { if (JSON.stringify(x) === JSON.stringify(y)) return; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p + '.' + k); } else diff.push(p); };
    walk(JSON.parse(strip(text)), JSON.parse(strip(again)), '');
    P.remove('tl-suite/arrangement');
    return { inFile: JSON.parse(text).data.presentation.timeline ? JSON.parse(text).data.presentation.timeline.clips.length : -1, empty, emptyKey, back, same: strip(text) === strip(again), diff: diff.slice(0, 12), carry, errs: __e.slice() };`);
  judge('T10 a project with an arrangement saves it (presentation.timeline), NEW empties it with no key, the open brings it back, and a re-save is byte-identical; NEW and the six demos carry none',
    t10.inFile === 1 && t10.empty === 0 && !t10.emptyKey && t10.back && t10.same && !t10.carry.length && !t10.errs.length, t10);
} catch (e) {
  judge('the suite ran to its end', false, String(e && e.message || e).slice(0, 500));
} finally { await g.close(); }
process.exit(done('timeline.browser-test') ? 1 : 0);
