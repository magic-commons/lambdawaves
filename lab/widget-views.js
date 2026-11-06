/* lab/widget-views.js — THE VISUALIZER WIDGETS (037 V2–V3; Josh, BRIEF.md WIDGETS: "We will finally take advantage of those weird windows like Bloch,
 * Emission Spectra, Lattice, Equalizer, Orbit, Plane, Shadow, Wigner, and Molecule's and Spectrum's registry ladder's view as visualizers for the field;
 * it is purely aesthetic so keep text to a minimal and make essentially extract the visualizer thingy to be a transparent like object sitting without a
 * background window or layer (empty CSS)"): a window's picture alone on the stage — no knobs, no readouts, no plate; the window's knobs still drive it.
 * THE SEAM (V1): a view's handle keeps `views` (the widget canvases it paints before its own) and `redraw()`; a widget adds its canvas there and asks
 * the model to step (keyed: a no-op when the window already stepped it this frame).  SHADOW's view takes a bare canvas, so each widget makes its own.
 * THE GATE: may(the window's reader name, the widget's body) — the governor's law with the widget's own track, so a closed window never silences it. */
import { el } from './mir/kit.js'; import { registerKind } from './widgets.js'; import { WINDOW_GLYPH } from './icons.js';
import { createShadowView } from './shadowview.js'; import { BL } from './bloch.js'; import { LAT } from './lattice.js';
let F = null;   // the last frame's { c, ids, may, tick } (rack.js: its c, its labels, the reader law); a forced tick between the rack's frames reads it
/** a visualizer kind: `make(cv, app)` → { tick(force, F), off() }, ticked under the reader law of the window `name` */
const view = (def, name, make) => registerKind({ ...def, glyph: WINDOW_GLYPH[name], mount(host, api) {
  const cv = el('canvas', 'lw-w-cv', host), app = api.app, s = make(cv, app); let due = true;   // a repaint owed (a mount, a resize, the theme) until the gate lets one through
  return { tick(now, force, ctx) { if (ctx) F = ctx; due = due || force; if (F && F.may(name, host)) { const f = due; due = false; F.tick(name, () => s.tick(f, F)); } },
    destroy: () => s.off && s.off() };
} });
/** a second view of the window's one model: the canvas joins its views; a tick steps it, a forced tick repaints every view */
const of = (M, step) => (cv, app) => { const m = M(app); m.views.add(cv); return { tick: (force) => (force ? m.redraw(app.obs) : step(m, app)), off: () => m.views.delete(cv) }; };
const t = (m, app) => m.update(app.clock.t);

view({ kind: 'shadow', label: 'SHADOW', hint: 'The modes as phasors, in the window’s picture', size: { w: 0.18, h: 0.25 } }, 'shadow', (cv, app) => {
  const v = createShadowView(cv, app.ctl.api);
  return { tick(force, f) { const W = app.w.shadowView; if (v.mode !== W.mode) v.setMode(W.mode); v.update(f.c, app.clock.t, f.ids, app.w.spectrum.selected); } };
});
view({ kind: 'bloch', label: 'BLOCH', hint: 'BLOCH’s qubit on its sphere', size: { w: 0.14, h: 0.2 } }, 'bloch', of(() => BL, t));
view({ kind: 'lattice', label: 'LATTICE', hint: 'LATTICE’s sites, |ψ|² tall in the phase’s hue', size: { w: 0.2, h: 0.2 } }, 'lattice', of(() => LAT, t));
view({ kind: 'orbit', label: 'ORBIT', hint: 'Each shell’s two rotors and its Kepler ellipse', size: { w: 0.24, h: 0.16 } }, 'orbit', of((app) => app.w.orbit, (m, app) => m.update(app.obs)));
view({ kind: 'wigner', label: 'WIGNER', hint: 'The (z, p_z) slice of W, signed in the two accents', size: { w: 0.16, h: 0.2 } }, 'wigner', of((app) => app.w.wignerView, (m, app) => {
  const G = app.host.hydroReader(); m.update(app.reg, app.clock.t, app.clock.playing, G.on, G.why, app.ctl.domain.half); }));   // its own 2 Hz while playing (wignerview.js)
