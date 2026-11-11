/* timeline-follow.js — 036 K4: λWAVES' own rows at the foot of the TIMELINE's ⋯ (MIR 1.5.7-alpha.4, installTimeline({ moreRows })).
 *
 * FOLLOW PLAYHEAD (Josh 11-03: "the playhead appears to be fixed but the whole lanes move on their own; FL Studio has this … disabled the
 * moment a user clicks/scrolls anywhere on the timeline (not clicking buttons)"): a choice row, OFF at every open, no stored key.  While on,
 * each present (the paintHead the loop calls) scrolls the lanes so the playhead stays where it stood when FOLLOW was chosen (held inside the
 * middle half of the view); a loop's wrap jumps the view with it.  Any press on the lanes or the ruler (not a button, a field, the work bar
 * or a rail chip), a wheel, or a scroll this module did not write (the kit's zoom, a new clip, LOCATE, Shift+0 included) turns it OFF; it
 * stands down under a film.
 * AUTO-COLOR: every clip's curve takes a colour of the active PALETTE — spread evenly round its wheel in lane-then-start order — or, with
 * PALETTE off, of the HSV wheel (s .85, v 1) in golden-angle order; AUDIO clips keep their tint.  One undo row.
 * 041 N5 · A LANE LEAVES ITS LAST VALUE: `leaves()` below (no row; it rides the clock's advance). */
import { toLUT, rgbToHex } from './mir/palette.js';

/** a press here is a button's, never the lanes': the kit's own exclusion (timeline/editor.js) + the work bar and the rail */
const PASS = 'button, select, input, textarea, .tl-action, .tl-scope-seg, .tl-setting, .tl-clip-more, .tl-transport-host, .tl-toolbar, [data-mir-chip]';
const GOLDEN = 0.6180339887498949;
const hsv = (h, s = 0.85, v = 1) => [h * 6 % 6, (h * 6 + 4) % 6, (h * 6 + 2) % 6].map((x) => v * (1 - s + s * Math.min(1, Math.max(0, Math.abs(x - 3) - 1))));

export function timelineRows(app) {
  let tl = null, on = false, pinX = 0, guard = false, wired = false;
  const ed = () => tl && tl.editor, vp = () => ed() && ed().view && ed().view.viewport;
  const beat = () => tl.controller.state().beat;
  const off = () => { on = false; };
  function wire() {
    if (wired) return; wired = true;
    const v = vp(), surface = ed().surface || v;
    v.addEventListener('scroll', () => { if (guard) { guard = false; return; } off(); }, { passive: true });
    v.addEventListener('wheel', off, { passive: true });             // a wheel at an edge scrolls nothing and still ends it
    /* 041 N7: the middle button (and the right one pressed with it) opens THE MODE MENU (MIR 1.5.7-alpha.49) — choosing a tool is no press on the lanes */
    surface.addEventListener('pointerdown', (e) => { if (e.button === 1 || (e.buttons & 4)) return; if (!(e.target.closest && e.target.closest(PASS))) off(); }, { capture: true });
  }
  function tick() {
    if (!on) return;
    if (!tl.isOpen()) { off(); return; }                              // OFF at every open
    if (app.state.capApi && app.state.capApi.busy) return;             // a film drives the clock: the view stands still
    const v = vp(); if (!v) return;
    const want = Math.max(0, Math.min(v.scrollWidth - v.clientWidth, beat() * ed().px() - pinX));
    if (Math.abs(v.scrollLeft - want) < 0.5) return;
    guard = true; v.scrollLeft = want;
  }
  function follow() {
    if (on) { off(); return; }
    const v = vp(); if (!v) return; wire();
    const w = v.clientWidth, x = beat() * ed().px() - v.scrollLeft;
    pinX = Math.min(0.75 * w, Math.max(0.25 * w, x)); on = true; tick();
  }
  function autoColor() {
    const m = tl.model, d = m.state(), lane = new Map(d.lanes.map((l, i) => [l.id, i])), first = new Map();
    for (const c of d.clips) {
      const k = [lane.has(c.laneId) ? lane.get(c.laneId) : 1e9, c.start], f = first.get(c.curveId);
      if (!f || k[0] < f[0] || (k[0] === f[0] && k[1] < f[1])) first.set(c.curveId, k);
    }
    const curves = d.curves.filter((c) => first.has(c.id) && c.kind !== 'audio')
      .sort((a, b) => first.get(a.id)[0] - first.get(b.id)[0] || first.get(a.id)[1] - first.get(b.id)[1]);
    const n = curves.length; if (!n) return 0;
    const P = app.state.palette, lut = P && P.on && P.stops && P.stops.length ? toLUT(P.stops) : null;
    const colour = (i) => {
      if (!lut) return rgbToHex(hsv((i * GOLDEN) % 1));
      const k = Math.floor((i / n) * 256) % 256; return rgbToHex([lut[k * 4], lut[k * 4 + 1], lut[k * 4 + 2]]);
    };
    m.begin(); curves.forEach((c, i) => m.updateCurve(c.id, { color: colour(i) })); m.commit();
    return n;
  }
  /* 041 N5 · A LANE LEAVES ITS LAST VALUE (Josh, call 8: "if the playhead goes past a clip, it must remember the last parameter value that it left
     behind").  The kit's arrangement answers null off a clip and the knob fell back to its base; here, when a tick or a film's step carries the
     playhead over a clip's end onto empty lane, the clip's end value is written as the target's BASE — the knob keeps it until another clip plays
     or a hand moves it.  A seek (a locate, a loop's wrap) passes nothing */
  function leaves() {
    const host = app.state.modHost, m = tl.model; let ends = null, prev = beat();
    m.subscribe(() => { ends = null; });
    const read = () => { ends = new Map(); const d = m.state(), target = new Map(d.curves.map((c) => [c.id, c.targetId]));
      for (const c of d.clips) { const id = target.get(c.curveId); if (id == null || c.mute) continue; if (!ends.has(id)) ends.set(id, []); ends.get(id).push(c.start + c.duration); } };
    host.clock.onAdvance((kind) => {
      const b = beat(), a = prev; prev = b;
      if (kind === 'seek' || !(b > a)) return;
      if (!ends) read();
      for (const [id, E] of ends) {
        let end = -Infinity; for (const e of E) if (e > a && e <= b && e > end) end = e;
        if (!(end > a) || !host.registry.has(id) || m.value(id, b) !== null) continue;
        const v = m.value(id, end - 1e-6); if (Number.isFinite(v)) host.registry.writeNorm(id, v);
      }
    });
  }
  return {
    /** the rows ⋯ shows (read at each open) */
    rows: () => [['FOLLOW PLAYHEAD', follow, 'follow-playhead', on], ['AUTO-COLOR', autoColor, 'auto-color']],
    /** bind(tl): the installed timeline; each present's paintHead also follows */
    bind(t) { tl = t; const paint = t.paintHead; t.paintHead = (...a) => { tick(); return paint(...a); }; leaves(); },   // the lanes move first: the head paints at its pin
    following: () => on, autoColor: () => autoColor(),
  };
}
