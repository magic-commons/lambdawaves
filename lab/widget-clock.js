/* lab/widget-clock.js — CLOCK and PLAYHEAD, two of the basic widgets (037 W5; Josh, BRIEF.md WIDGETS: "More basic Widgets could include,
 * Mini-Viewer, clock, playhead time"): the kit's readout on the stage with its well taken away — CLOCK is ψ's t in atomic units and its lap,
 * the TIMELINE's TIME hint's own words (shell/keys.js), PLAYHEAD the arrangement's m:ss.d at the tempo in force (the kit's formatSeconds, TIME's
 * own string); the label shows in EDIT only.  A string is written only when it changed, at most five times a second while playing. */
import { readout } from './mir/kit.js'; import { formatSeconds } from './mir/timeline/time-format.js'; import { registerKind } from './widgets.js';
const compact = (v, at, d) => (Math.abs(v) < at ? v.toFixed(d) : v.toExponential(d).replace('e+', 'e'));
const kind = (id, label, hint, w, word) => registerKind({ kind: id, label, glyph: id, hint, size: { w, h: 0.07 },
  mount(el, api) {
    const ro = readout({ label, cls: 'lw-w-ro', value: '' }); el.append(ro.root); let at = -1e9;
    return { tick(now, force) { if (!force && api.app.clock.playing && now - at < 200) return; at = now; ro.set(word(api.app)); } };
  } });
kind('clock', 'CLOCK', 'ψ’s time t in atomic units, and its lap', 0.2, ({ clock: c }) => `t = ${compact(c.t, 1e5, 2)} a.u. · lap ${compact(Math.floor(c.t / c.window), 1e6, 0)}`);
kind('playhead', 'PLAYHEAD', 'The timeline’s playhead, m:ss.d', 0.12, ({ state: S }) => { const T = S.modHost ? S.modHost.model.transport : {}; return formatSeconds((T.beats || 0) * 60 / (T.bpm || 120), true); });
