// 0.5.0 C7b · THE TIMELINE AND THE RENDER CARD ARE THE KIT'S (C7B-DESIGN §5.2): the kit's own proofs (TIMELINE.md, RENDER.md)
// re-aimed at λWAVES, through real input where a hand is the claim (every press hit-tested by gatekit's tap).
//   T1  WINDOW › TIMELINE opens it docked at the foot of the span; idle, open or closed, it books no frame
//   T2  THE play's edge: Space starts t AND the playhead, Space stops both; a tap on the ruler moves the beat, never t
//   T3  a held YAW arc (500 ms) → TIMELINE CLIP → CREATE AUTOMATION CLIP; a paused seek previews the curve on obs.yaw
//   T4  the stage mask: the window's panes and chips are masked, its gaps are not; a real drag moves the mask while paused; closed, none
//   T5  THE FOCUS LAW: with the surface focused, E is the timeline's SELECT tool (not a dolly), and Space still plays
//   T9  undo: a clip edit is one row of the timeline's own undo; a λWAVES undo leaves the arrangement; NEW clears it
//   T10 a project with an arrangement saves, reopens and serialises byte-identically; NEW and the demos carry no `timeline`
//   T6  PLACE ONE PERIOD → the period clip, ACTIVE over it, the card armed; a real RENDER = captureUI.loop(), digest for digest, MP4 bytes too
//   T7  the card's STILL (6 s, 30 fps, CURRENT, MODULATION OFF, TIMELINE OFF) = captureUI.record(); its PNG FRAMES are the same frames
//   T8  MODULATION ON with a routed LFO: frame zero is the lab's t, RATE integrates, two runs identical
//   T11 the stored rows: Escape at frame 75 (a scrub refused meanwhile) → RESUME WITH MATCHING PROJECT = the uninterrupted frames; a state
//       change → RESUME refused, DISCARD STORED RENDER removes it; CANCEL then a reload → RECOVER COMPLETED FRAMES hands over a valid MP4
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import { open, judge, done } from '../tools/gate/gatekit.mjs';
import { actions, relActions, go } from '../tools/gate/drv.mjs';

const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz&sw=0&warn=0`;
const g = await open(URL_, { width: 1500, height: 950, script: 300000,
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

  /* ── the RENDER card's roads (C7B-DESIGN §5.2 4–8): a card film is the facade's film, digest for digest, when the take is the same ── */
  await ev(`const tl = __LW.timeline; tl.model.restore(null); __LW.loadPreset('1s+2pz'); __LW.pause(); __LW.scrub(0); await __LW.settle();
    try { await (await navigator.storage.getDirectory()).removeEntry('lambdawaves-recordings', { recursive: true }); } catch (_) {}
    const F = __LW.captureUI.exact; window.__saved = []; F.save = (r) => { __saved.push(r); return true; };   /* the facade's hand-over, counted not followed */
    window.__R = __LW.render; window.__C = __R.view.controls; window.__set = (f, v) => { f.value = v; f.dispatchEvent(new Event('change')); };
    window.__log = () => { const L = __LW.captureUI.exact.last; return L ? { kind: L.kind, n: L.log.length, d: L.log.map((x) => x.digest), t: L.log.map((x) => x.t), k: L.log.map((x) => x.k) } : null; };
    window.__fac = (r) => r && r.manifest ? { n: r.frames, d: r.manifest.frames.map((x) => x.digest), t: r.manifest.frames.map((x) => x.t), bytes: r.bytes } : { none: true };
    window.__same = (a, b) => !!(a && b && a.d && b.d && a.d.length === b.d.length && a.d.every((x, i) => x === b.d[i]) && a.t.every((x, i) => x === b.t[i]));
    window.__films = async () => { try { const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('lambdawaves-recordings'); let n = 0; for await (const _ of d.keys()) n++; return n; } catch (_) { return 0; } };
    window.__btn = (text) => [...document.querySelectorAll('.dev[data-id="render"] button')].find((b) => b.textContent.trim() === text && !b.disabled);
    if (__LW.mod.armed) __LW.mod.arm(false);   /* MOD off: the facade freezes, as the card's MODULATION OFF does */
    __LW.layout.raise('render'); tl.close(); await __w(800); await __LW.settle(); await __w(500); return 1;`);
  const tapRender0 = async () => { await ev(`__C.renderBtn.id = 'tl-render'; __C.renderBtn.scrollIntoView({ block: 'center', behavior: 'instant' }); await __w(500); await __LW.settle(); await __w(400); return 1;`); return g.tap('#tl-render'); };
  const tapRender = async () => { const t = await tapRender0(); await g.waitFor('__R.recorder.running()', 200, 50); await g.waitFor('!__R.recorder.running()', 560, 500); await ev(`await __w(300); return 1;`); return t; };

  /* ── T6 · PLACE ONE PERIOD → the period clip at beat 0, ACTIVE over it, the card on TIMELINE · ACTIVE with MODULATION OFF; a real RENDER
     films the facade's ONE PERIOD, every frame's digest and time, and the MP4's bytes ── */
  const t6a = await ev(`const id = __R.place(); await __w(600); const opened = __LW.timeline.isOpen(); __LW.timeline.close(); await __w(500); await __LW.settle(); await __w(400); const st = __R.view.state(), doc = __LW.timeline.model.state(), c = doc.clips.find((x) => x.id === id), cv = c && doc.curves.find((x) => x.id === c.curveId);
    return { id, opened, clip: c && { start: c.start, duration: c.duration }, kind: cv && cv.kind, active: doc.active, motion: st.motion, mod: __C.modSelect.value, plan: st.plan };`);
  const t6tap = await tapRender();
  const t6 = await ev(`const card = __log(), done = __R.view.state().done; const fac = __fac(await __LW.captureUI.loop());
    return { card: card && { kind: card.kind, n: card.n }, fac: { n: fac.n, bytes: fac.bytes }, done, same: __same(card, fac), bytes: !!done && fac.bytes === done.bytes, errs: __e.slice() };`);
  judge('T6 PLACE ONE PERIOD places a lw-period clip at beat 0 with ACTIVE over it and arms the card (TIMELINE · ACTIVE, MODULATION OFF); a real RENDER films ONE PERIOD: every digest, every time and the MP4 bytes equal the facade\'s',
    t6a.opened && t6a.kind === 'lw-period' && t6a.clip.start === 0 && t6a.active && t6a.active.start === 0 && t6a.active.end === t6a.clip.duration && t6a.motion === 'timeline-active' && t6a.mod === 'off' && t6tap.ok === 1
      && t6.card.kind === 'loop' && t6.same && t6.bytes && !t6.errs.length, { t6a, t6tap, t6 });

  /* ── T7 · the card's STILL (6 s, 30 fps, CURRENT, MODULATION OFF, TIMELINE OFF) is C7's RECORD, digest for digest; its PNG FRAMES are the same frames ── */
  await ev(`__set(__C.motion, 'still'); __set(__C.recFormat, 'mp4'); __set(__C.recDuration, '6'); __set(__C.recFps, '30'); __set(__C.recSize, 'current'); __set(__C.modSelect, 'off'); __set(__C.timelineSelect, 'off');
    __LW.scrub(0); await __LW.settle(); return 1;`);
  const t7tap = await tapRender();
  const t7a = await ev(`window.__T7 = __log(); __LW.scrub(0); await __LW.settle(); const fac = __fac(await __LW.captureUI.record()); __set(__C.recDuration, '1'); __LW.scrub(0); await __LW.settle();
    __C.renderBtn.click(); await __w(300); for (let i = 0; i < 300 && __R.recorder.running(); i++) await __w(200); await __w(300); window.__T7s = __log(); __set(__C.recFormat, 'png'); __LW.scrub(0); await __LW.settle();   /* 1 s: 6 s of PNG overflows a test profile's store */
    return { card: __T7.n, fac: fac.n, same: __same(__T7, fac) };`);
  const t7ptap = await tapRender();
  const t7 = await ev(`const png = __log(), done = __R.view.state().done; __set(__C.recFormat, 'mp4'); __set(__C.recDuration, '6'); return { png: png.n, mp4: __T7s.n, pngSame: __same(png, __T7s), file: done && done.name, status: __R.view.state().status, errs: __e.slice() };`);
  judge('T7 the card\'s STILL (6 s · 30 fps · CURRENT · MODULATION OFF · TIMELINE OFF, a real RENDER) equals captureUI.record() frame for frame; its PNG FRAMES are the same frames as its MP4 (1 s, 30 frames each)',
    t7tap.ok === 1 && t7ptap.ok === 1 && t7a.card === 180 && t7a.same && t7.png === 30 && t7.mp4 === 30 && t7.pngSame && /\.zip$/.test(t7.file || '') && !t7.errs.length, { t7a, t7, t7tap, t7ptap });

  /* ── T8 · MODULATION ON with a routed LFO: frame zero is the lab's time, RATE integrates from it, the picture moves, two runs are identical ── */
  const t8 = await ev(`__LW.mod.arm(true); const M = __LW.mod.model, audio = M.sourceList().filter((x) => x.kind === 'audio' && x.on !== false); for (const a of audio) M.setSource(a.id, { on: false });   /* NEW's AUDIO level: a live input cannot replay (the kit's refusal) */
    const s = __LW.mod.addSource('lfo'), m = __LW.mod.addMacro(); __LW.mod.bind(m, s); const route = __LW.mod.route(m, 'material.hue', 0, 0.6);
    __set(__C.recDuration, '1'); __set(__C.modSelect, 'on'); __set(__C.timelineSelect, 'off'); __LW.scrub(2); await __LW.settle(); await __w(300);
    const run = async () => { __C.renderBtn.click(); await __w(400); for (let i = 0; i < 600 && (__R.view.state().running || __R.recorder.running()); i++) await __w(200); await __w(200); return __log(); };
    const a = await run(); __LW.scrub(2); await __LW.settle(); const b = await run(); const rate = __LW.clock.rate;
    __LW.mod.unroute(route); for (const a of audio) M.setSource(a.id, { on: true }); __LW.mod.arm(false); __set(__C.modSelect, 'off'); __set(__C.recDuration, '6');
    return { route: !!route, status: __R.view.state().status, err: __R.recorder.state().lastError, n: a.n, same: __same(a, b), t0: a.t[0], dt: a.t[1] - a.t[0], want: rate / 30, moved: a.d[0] !== a.d[a.n - 1], errs: __e.slice() };`);
  judge('T8 MODULATION ON with a routed LFO: frame zero is the lab\'s t (2), each frame advances RATE/fps, the picture moves, and two runs are identical',
    t8.route && t8.n === 30 && t8.same && t8.t0 === 2 && Math.abs(t8.dt - t8.want) < 1e-9 && t8.moved && !t8.errs.length, t8);

  /* ── T11 · THE STORED ROWS.  A film cancelled by a real Escape at frame 75 (a scrub refused while it ran) is RESUMED WITH MATCHING PROJECT and
     its frames are an uninterrupted run's; one cancelled before a state change is refused with the kit's sentence and DISCARD STORED RENDER
     removes it; one cancelled by a real CANCEL tap is still listed after a reload, and RECOVER COMPLETED FRAMES hands over a valid MP4 ── */
  const runTo = async (frame) => { await ev(`__LW.scrub(0); await __LW.settle(); window.__p0 = __R.recorder.state().progress; __C.renderBtn.click(); return 1;`); await g.waitFor('__R.recorder.running()', 200, 50);   /* the RENDER press is T6's and T7's claim; here the film is the setting */ return g.waitFor(`__R.recorder.running() && __R.recorder.state().progress !== __p0 && /^(resolve|capture)$/.test((__R.recorder.state().progress || {}).phase) && __R.recorder.state().progress.frame >= ${frame}`, 1200, 100); };   /* the last run's progress object stands until this run's first */
  await runTo(75);
  const scrub = await ev(`const C = __LW.timeline.controller, began = C.beginScrub(); if (began) C.endScrub({ cancel: true }); return { refused: began === false, running: __R.recorder.running() };`);
  await g.press('');
  const t11a = await ev(`for (let i = 0; i < 100 && __R.recorder.running(); i++) await __w(200); await __w(600); __R.view.paint(); await __w(900);
    const b = __btn('RESUME WITH MATCHING PROJECT'); if (b) { b.id = 'tl-resume'; b.scrollIntoView({ block: 'center', behavior: 'instant' }); } await __w(400);
    return { phase: __R.recorder.state().phase, resume: !!b, recover: !!__btn('RECOVER COMPLETED FRAMES') };`);
  const resumeTap = await g.tap('#tl-resume');
  await g.waitFor('!__R.recorder.running() && (!!__R.view.state().done || !!__R.view.state().status)', 560, 500);
  const t11b = await ev(`await __w(300); const L = __log(), ref = __T7, bad = L.k.filter((k, j) => L.d[j] !== ref.d[k] || L.t[j] !== ref.t[k]);
    return { n: L.n, first: L.k[0], last: L.k[L.n - 1], bad: bad.length, status: __R.view.state().status, err: __R.recorder.state().lastError };`);
  judge('T11a a real Escape cancels a film at frame 75 (a scrub refused while it ran); RESUME WITH MATCHING PROJECT (a real tap) finishes it, and its frames are the uninterrupted run\'s, digest and time',
    scrub.refused && scrub.running && t11a.phase === 'cancelled' && t11a.resume && t11a.recover && resumeTap.ok === 1 && t11b.n > 0 && t11b.last === 179 && t11b.bad === 0, { scrub, t11a, resumeTap, t11b });
  await runTo(75);
  await ev(`__C.cancel.id = 'tl-cancel'; return 1;`);
  const cancelTap = await g.tap('#tl-cancel');
  const t11c = await ev(`for (let i = 0; i < 100 && __R.recorder.running(); i++) await __w(200); await __w(600); const n0 = await __films();
    __LW.loadPreset('1s+2s'); await __LW.settle(); for (let i = 0; i < 25 && !__btn('RESUME WITH MATCHING PROJECT'); i++) { __R.view.paint(); await __w(500); } const b = __btn('RESUME WITH MATCHING PROJECT'); if (b) { b.id = 'tl-resume2'; b.scrollIntoView({ block: 'center', behavior: 'instant' }); } await __w(400);
    const jobs = (await __R.recorder.recoveries()).map((j) => [j.frames, j.files.length, j.store.manifest.state, j.spec.frames]); return { n0, resume: !!b, phase: __R.recorder.state().phase, err: __R.recorder.state().lastError, jobs };`);
  const resume2 = await g.tap('#tl-resume2');
  const t11d = await ev(`for (let i = 0; i < 50 && __R.recorder.running(); i++) await __w(200); await __w(500); const status = __R.view.state().status;
    __R.view.paint(); await __w(1500); const it = [...document.querySelectorAll('.dev[data-id="render"] button')].find((x) => x.textContent.trim() === 'RESUME WITH MATCHING PROJECT');
    const d = it && [...it.parentElement.querySelectorAll('button')].find((x) => x.textContent.trim() === 'DISCARD STORED RENDER'); if (d) { d.id = 'tl-discard'; d.scrollIntoView({ block: 'center', behavior: 'instant' }); } await __w(400); return { status, discard: !!d };`);
  const discardTap = await g.tap('#tl-discard');
  const t11e = await ev(`await __w(900); return { n1: await __films(), resume: !!__btn('RESUME WITH MATCHING PROJECT') };`);
  judge('T11b a film cancelled by a real CANCEL tap, then a state change: RESUME is refused with the kit\'s sentence; DISCARD STORED RENDER (a real tap) removes its directory',
    cancelTap.ok === 1 && t11c.resume && resume2.ok === 1 && /changed/.test(t11d.status) && t11d.discard && discardTap.ok === 1 && t11e.n1 === t11c.n0 - 1 && !t11e.resume, { cancelTap, t11c, t11d, t11e });
  await ev(`__LW.loadPreset('1s+2pz'); await __LW.settle(); return 1;`);
  await runTo(75);
  await g.tap('#tl-cancel');
  await ev(`for (let i = 0; i < 100 && __R.recorder.running(); i++) await __w(200); await __w(800); __LW.layout.projects.markClean(); window.__before = 1; return 1;`);   /* clean: no beforeunload question */
  await go(g.s, URL_);
  await g.waitFor('window.__LW && __LW.ready && __LW.render', 3000, 20);
  const t11f = await ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    const live = () => !!(navigator.userActivation && navigator.userActivation.isActive); window.__H = { shares: [], downloads: [] };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: (d) => { __H.shares.push({ names: d.files.map((f) => f.name), blob: d.files[0] }); return live() ? Promise.resolve() : Promise.reject(new DOMException('no gesture', 'NotAllowedError')); } });
    const click = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { __H.downloads.push({ name: this.download, href: this.href }); return; } return click.call(this); };
    __LW.layout.raise('render'); await new Promise((r) => setTimeout(r, 1500)); const find = () => [...document.querySelectorAll('.dev[data-id="render"] button')].find((x) => x.textContent.trim() === 'RECOVER COMPLETED FRAMES');
    for (let i = 0; i < 25 && !find(); i++) { __LW.render.view.paint(); await new Promise((r) => setTimeout(r, 500)); } const b = find(); if (b) { b.id = 'tl-recover'; b.scrollIntoView({ block: 'center', behavior: 'instant' }); }
    await new Promise((r) => setTimeout(r, 400)); return { recover: !!b, reloaded: !window.__before };`);
  const recoverTap = await g.tap('#tl-recover');
  const t11g = await ev(`for (let i = 0; i < 60 && !(__H.shares.length + __H.downloads.length); i++) await new Promise((r) => setTimeout(r, 250));
    const blob = __H.downloads[0] ? await (await fetch(__H.downloads[0].href)).blob() : __H.shares[0] ? __H.shares[0].blob : null;
    const head = blob ? new TextDecoder().decode(new Uint8Array(await blob.slice(4, 8).arrayBuffer())) : null;
    return { shares: __H.shares.length, downloads: __H.downloads.length, head, bytes: blob && blob.size, errs: (window.__e || []).slice() };`);
  judge('T11c a film cancelled by a real CANCEL tap is still listed after a reload; RECOVER COMPLETED FRAMES (a real tap) hands over one valid MP4',
    t11f.reloaded && t11f.recover && recoverTap.ok === 1 && t11g.shares + t11g.downloads === 1 && t11g.head === 'ftyp' && t11g.bytes > 0 && !t11g.errs.length, { t11f, recoverTap, t11g });
} catch (e) {
  judge('the suite ran to its end', false, String(e && e.message || e).slice(0, 500));
} finally { await g.close(); }
process.exit(done('timeline.browser-test') ? 1 : 0);
