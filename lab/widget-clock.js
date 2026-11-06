/* lab/widget-clock.js — CLOCK and PLAYHEAD, two of the basic widgets (037 W5; Josh, BRIEF.md WIDGETS: "More basic Widgets could include,
 * Mini-Viewer, clock, playhead time"): CLOCK is ψ's t in atomic units and its lap, the TIMELINE's TIME hint's own words (shell/keys.js), PLAYHEAD the
 * arrangement's m:ss.d at the tempo in force (the kit's formatSeconds, TIME's own string); the label shows in EDIT only.  A reading is written only when
 * it changed, at most five times a second while playing.
 * 038 S4 THE FACE (Josh: "Clock and playhead widgets should have the lambdawaves logo font … beutify and make delightful the other widgets"): the figures
 * in the logo face 'LW Title' — ASCII only, proportional figures, no tabular ones — so each figure stands in its own fixed cell (lab.css: .62 em, the
 * widest figure .59) and the reading never jitters; the words and the separators in the UI face, smaller and softer.  A changed figure rolls in (160 ms;
 * only the cells that changed are written); CLOCK's lap glows as it ticks over; PLAYHEAD's tenths are small and soft, and a hairline under it breathes on
 * every beat while the transport plays.  Nothing moves under reduced motion. */
import { el } from './mir/kit.js'; import { formatSeconds } from './mir/timeline/time-format.js'; import { motionPolicy } from './mir/core/motion.js';
import { registerKind } from './widgets.js';
const compact = (v, at, d) => (Math.abs(v) < at ? v.toFixed(d) : v.toExponential(d).replace('e+', 'e'));
const ROLL = [{ transform: 'translateY(-.18em)', opacity: 0.35 }, { transform: 'none', opacity: 1 }], ROLL_T = { duration: 160, easing: 'cubic-bezier(.2,.8,.2,1)' };
/** a reading as runs — [kind, text]: 'n' figures (a cell each, the logo face), 'd' the small figures, 'w' a word, 's' a separator (the UI face) — in `host` */
function face(host) {
  const root = el('div', 'lw-w-face', host), line = el('span', 'lw-w-line', root); let runs = [];   // { k, s, node, cells }; the runs sit on one baseline
  return { root, set(next, glow) {
    const fresh = runs.length !== next.length || runs.some((r, i) => r.k !== next[i][0]), live = !fresh && motionPolicy() === 'full';
    if (fresh) { line.textContent = ''; runs = next.map(([k]) => ({ k, s: null, node: el('span', 'lw-w-' + k, line), cells: [] })); }
    next.forEach(([k, s], i) => { const r = runs[i]; if (r.s === s) return;
      if (k === 'w' || k === 's') { r.node.textContent = s; r.s = s; return; }
      const grow = !r.cells || r.cells.length !== s.length;
      if (grow) { r.node.textContent = ''; r.cells = [...s].map(() => el('span', 'lw-w-c', r.node)); }
      [...s].forEach((ch, j) => { if (!grow && r.s[j] === ch) return; const c = r.cells[j]; c.textContent = ch; c.classList.toggle('p', !/\d/.test(ch)); if (live && !grow) c.animate(ROLL, ROLL_T); });
      if (live && glow === i && r.s !== null) r.node.animate([{ textShadow: '0 0 .45em currentColor' }, { textShadow: '0 0 0 transparent' }], { duration: 700, easing: 'ease-out' });
      r.s = s; });
  } };
}
const kind = (id, label, hint, w, runs, beat) => registerKind({ kind: id, label, glyph: id, hint, size: { w, h: 0.07 },
  mount(host, api) {
    const f = face(host), line = beat ? el('i', 'lw-w-beat', host) : null; let at = -1e9, b0 = null;
    return { tick(now, force) {
      const app = api.app;
      if (line) { const b = beat(app); if (b && b.n !== b0) { if (b0 !== null && app.clock.playing && motionPolicy() === 'full') line.animate([{ opacity: 0.7, transform: 'scaleX(1)' }, { opacity: 0, transform: 'scaleX(.55)' }], { duration: b.ms, easing: 'ease-out' }); b0 = b.n; } }
      if (!force && app.clock.playing && now - at < 200) return; at = now; const [r, glow] = runs(app); f.set(r, glow);
    } };
  } });
kind('clock', 'CLOCK', 'ψ’s time t in atomic units, and its lap', 0.2, ({ clock: c }) => [[['w', 't ='], ['n', compact(c.t, 1e5, 2)], ['w', 'a.u. · lap'], ['n', compact(Math.floor(c.t / c.window), 1e6, 0)]], 3]);
kind('playhead', 'PLAYHEAD', 'The timeline’s playhead, m:ss.d', 0.12, ({ state: S }) => {
  const T = S.modHost ? S.modHost.model.transport : {}, [main, tenth] = formatSeconds((T.beats || 0) * 60 / (T.bpm || 120), true).split('.');
  return [main.match(/\d+|\D+/g).map((p) => [/\d/.test(p) ? 'n' : 's', p]).concat(tenth !== undefined ? [['d', '.' + tenth]] : []), -1];
}, ({ state: S }) => { const T = S.modHost && S.modHost.model.transport; return T ? { n: Math.floor(T.beats || 0), ms: Math.min(900, 54000 / (T.bpm || 120)) } : null; });
