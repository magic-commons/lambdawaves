/* mir-gui.js — MIR OPTIONS and MIR ABOUT (iteration 003, Josh: "Port and adopt the entire MIR 1.5 MIR Options loadout").  The kit's
 * GUI windows (mir/shell/gui.js createGui: OPTIONS in three tabs, LOOK · LIGHT · WINDOWS; ABOUT, its own window, opened by the
 * circled (i) in OPTIONS' head), built as BASINS app/skin.js builds them, over λWAVES' own look store (look.js, `mir.gui`, every
 * LOOK_SCHEMA row homed where it writes nothing) so every stored choice stands.  The menubar's GUI menu and the keyboard's `gui` /
 * `guiAbout` rows open them (shell/notebook.js, shell/keys.js), BASINS' words.  SETTINGS keeps only λWAVES' own (settings-card.js).
 * What stays λWAVES': FORGET is SETTINGS' old one (the settings blob, the look, the modulation's power and cadence, the curves);
 * RESET LAYOUT is λWAVES' layout's; the accents stay a PREFERENCE (no project part: docs/STATE-SCOPES.md); the two windows mask
 * the stage's ink (occlusion: the glass law); an iPad keeps λWAVES' rack geometry (the kit's body.touch-tablet is not taken).
 * THE DOCK SPAN: the modulation window docks at the bottom between the racks (BASINS installModulation({ dock: { span:
 * layout.span(), guide } }), guided by MIR OPTIONS' DROP GUIDES).  It is built (createModSeam) before the kit rack
 * (createRackWiring), so it is handed `dockSpan`, a door the rack's one span (rk.span()) is bound to here. */
import { createGui } from './mir/shell/gui.js';
import { gplLicence } from './mir/shell/about.js';
import { DOCK } from './mir/window/dock.js';
import { paintedRect } from './occlusion.js';
import { BUILD_LINE } from './build-line.js';   // 021 D1: the stamp's own module
import { infoPrefs } from './shell/stage-words.js';   // iteration 007: INFORMATIONAL's own record, which FORGET wipes too
import { forgetRecords } from './settings-store.js';   // 021 R4: FORGET wipes every registry row whose `forget` is true

let gui = null, span = null;
const subs = new Map();
/** the built windows ({ open(page), toggle(page), dropGuides(), … }), or null before boot reaches them */
export const mirGui = () => gui;
/** the dock span the modulation window docks in: the viewport's until the rack's is bound */
export const dockSpan = {
  read() { if (span) return span.read(); const w = innerWidth, h = innerHeight, e = DOCK.edge; return { left: e, right: w - e, width: Math.max(0, w - 2 * e), top: e, bottom: h - e }; },
  subscribe(fn) { subs.set(fn, span ? span.subscribe(fn) : null); return () => { const off = subs.get(fn); subs.delete(fn); if (off) off(); }; },
};

export function createMirGui(app) {
  const { settingsStore } = app, { look, modStore, curvesStore, occlusion } = app.ctl, { rk } = app.sh;
  span = rk.span();
  for (const fn of subs.keys()) { subs.set(fn, span.subscribe(fn)); fn(span.read()); }
  /* FORGET is the one SETTINGS had: createGui wipes the look through prefs.forget(), then reloads.  021 R4: the owners' pending writes are
     cancelled first (onForget: NODES' 250 ms graph and grade), then every settings-store.js RECORDS row marked `forget` goes — the blob, the
     look, INFORMATIONAL, the modulation's power and cadence, the grade, the graph, the CONTROL SURFACE's favourites, the Picker's choices,
     the keys, RENDER's choices and LEAN.  The reader's work stays (R6: their palettes, curves, graphs and PRESETs; the session, the projects,
     the quick save, the modulation presets a project SAVE writes) and so does the device's (the LIBRARY, the kit's own seats and calibration) */
  const prefs = { ...look.prefs, forget() { look.prefs.forget(); infoPrefs().forget(); modStore.write({ modArm: undefined, modCadence: undefined }); forgetRecords(); settingsStore.remove(); curvesStore.remove(); } };
  const tablet = document.body.classList.contains('touch-tablet');
  gui = createGui({ host: document.getElementById('floats') || document.getElementById('lab'), prefs, accent: look.accent, projectAccent: false,
    app: { name: 'λWAVES', version: BUILD_LINE },
    about: { fonts: './fonts/', credits: [
      [{ t: '{name} {version} · © 2026 Joshua Hosain · Magic Commons', vars: { name: 'λWAVES', version: BUILD_LINE } }],
      gplLicence('λWAVES'),
      [{ t: 'Special thanks: Team @ Chronus Quantum for the Molecular Orbital Model (ChronusQ) · ‘Electron Orbitals’ by Brian Johnson · Paul Falstad’s Math & Physics Java Applets · Seth Shultz · Beatriz Erranté, independent research & assistance.' }],
      [{ t: 'Built by AI coding agents — Claude (Anthropic) · Gemini (Google) · GPT (OpenAI).' }]] },
    rack: { resetLayout: () => app.sh.layout.resetLayout() },
    /* iteration 004 · SAMPLING's AUTOMATION reaches λWAVES' one modulation host (BASINS skin.js): the grid the TIMELINE's arrangement is
       read on (FRAME · 1/32 · 1/16 · 1/8 beat); without it the kit's fallback asks installModulation, which λWAVES never runs.  SCRUB is
       read by the TIMELINE (shell/keys.js scrubLevel).  The frame time is the GUI's own FRAME readout */
    sampling: { automation: (g) => (app.state.modHost ? app.state.modHost.clock.setAutomationGrid(g) : null) } });
  if (!tablet) document.body.classList.remove('touch-tablet');
  { const grid = gui.sampling().grid; if (grid && app.state.modHost) app.state.modHost.clock.setAutomationGrid(grid); }   // a stored AUTOMATION grid, once (FRAME, 0, is the host's own)
  look.ctx.fx = () => { gui.light.refresh(); gui.parallax.refresh(); };   // QUALITY's run (the kit's) refreshes the pointer effects
  const wins = [gui.window, gui.about];
  occlusion.register('gui', () => wins.filter((w) => w.isOpen()).map((w) => paintedRect(w.root)));
  for (const w of wins) occlusion.watch(w.root, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  return gui;
}
