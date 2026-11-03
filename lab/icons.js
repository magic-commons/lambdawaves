/* lab/icons.js — THE ICON TABLE (021 V2): every λWAVES drawing, in the kit's shape, registered through the kit's one door (MIR 1.5.6-alpha.3
 * `registerGlyphs`) so every seat draws through the kit's roads — `chip`/`setGlyph`/`glyphEl`, `sw({ glyph })`, the FINDER's `spec.glyph`, the
 * menubar's `opts.icon`.  THE LAW: the inner markup of a 24-unit box, live area 2–22, stroke 1.9, round caps and joins, `currentColor`; a solid is
 * `fill-rule: evenodd`; a 16-unit drawing (NODES') is drawn through the kit's own precedent `<g transform="scale(1.5)">` at stroke 1.267; rendered
 * at 16, 20 or 24 px only; named for its MEANING in camelCase, never for the character it replaced.  A kit name is never redrawn here (the door
 * refuses it): the same idea uses the kit's drawing (info, settings, folder, home, plus, download, save, curves, render, chevron*).
 * WINDOW_GLYPH is ONE glyph per window, declared at its register (rack-wiring.js) or its createWindow (kit factories through `windowGlyphs`).
 * 022 E2: every window wears λWAVES' own drawing of its MEANING (V-BUILD.md's DRAWING LIST, drawn: no BORROWED name is left); Gemini may redraw
 * them from research/iteration-022/E-shots/glyphs-*.png on Josh's word (research/iteration-022/ICONS-FOR-GEMINI.md). */
import { registerGlyphs } from './mir/glyph.js';
import { windowGlyphs } from './mir/window/window.js';

const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const p = (d) => '<path ' + S + ' d="' + d + '"/>';
const c = (cx, cy, r) => '<circle ' + S + ' cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
const dot = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="currentColor"/>';
const solid = (d) => '<path fill="currentColor" fill-rule="evenodd" d="' + d + '"/>';
const box = (x, y, w, h, rx) => '<rect ' + S + ' x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/>';
const fill = (x, y, w, h, rx) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="currentColor"/>';
const oval = (cx, cy, rx, ry, t) => '<ellipse ' + S + ' cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + (t ? ' transform="rotate(' + t + ' ' + cx + ' ' + cy + ')"' : '') + '/>';
/* NODES' 16-unit drawings, through the kit's precedent (glyph.js `edit`, `select`, `scrub`) */
const n16 = (inner) => '<g transform="scale(1.5)" fill="none" stroke="currentColor" stroke-width="1.267" stroke-linecap="round" stroke-linejoin="round">' + inner + '</g>';

const ICONS = {
  /* ── the Picker, the bar, FOLDERS (lab/img/icons/ until 021, each redrawn at 1.9) ── */
  cone: p('M4 20.5h16') + p('M10 4h4l4.2 16.5H5.8Z') + p('M8.3 10.5h7.4') + p('M7.1 15.5h9.8'),   // 030: a volume under construction (WIP)
  arrowLeft: p('M15.5 4.5 8 12l7.5 7.5'),                                       // was 3.5 wide
  arrowRight: p('M8.5 4.5 16 12l-7.5 7.5'),
  atom: dot(12, 12, 1.5) + p('M3 12a9 3.5 0 1 0 18 0 9 3.5 0 1 0-18 0Z') + p('M5.64 5.64a9 3.5 45 1 0 12.72 12.72 9 3.5 45 1 0-12.72-12.72Z') +
    p('M5.64 18.36a9 3.5 -45 1 0 12.72-12.72 9 3.5 -45 1 0-12.72 12.72Z'),
  cogSolid: solid('M19.64 9.64 22.35 10.22 22.35 13.78 19.64 14.36 19.08 15.73 20.57 18.06 18.06 20.57 15.73 19.08 14.36 19.64 13.78 22.35 10.22 22.35 ' +
    '9.64 19.64 8.27 19.08 5.94 20.57 3.43 18.06 4.92 15.73 4.36 14.36 1.65 13.78 1.65 10.22 4.36 9.64 4.92 8.27 3.43 5.94 5.94 3.43 8.27 4.92 9.64 4.36 ' +
    '10.22 1.65 13.78 1.65 14.36 4.36 15.73 4.92 18.06 3.43 20.57 5.94 19.08 8.27Z M15.5 12a3.5 3.5 0 1 0-7 0a3.5 3.5 0 1 0 7 0Z'),   // the bar's ⚙ (MIR OPTIONS)
  fileName: p('M6.5 3.5H14L19.5 9v10A1.5 1.5 0 0 1 18 20.5H6.5A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5Z') + p('M14 3.5V9h5.5') + p('M8.5 13.5h7') + p('M8.5 17h4.5'),
  folderName: p('M12 19.5H4.5A1.5 1.5 0 0 1 3 18V6a1.5 1.5 0 0 1 1.5-1.5h4.5l2 2.5h8.5A1.5 1.5 0 0 1 21 8.5v2.5') + p('M17.5 13.5l3 3L16 21h-3v-3l4.5-4.5Z'),
  folders: p('M7 6.5V5a1.5 1.5 0 0 1 1.5-1.5h4.2l1.8 2h5A1.5 1.5 0 0 1 21 7v8a1.5 1.5 0 0 1-1.5 1.5H17') +
    p('M3 9.5A1.5 1.5 0 0 1 4.5 8h4.2l1.8 2h5A1.5 1.5 0 0 1 17 11.5v7A1.5 1.5 0 0 1 15.5 20h-11A1.5 1.5 0 0 1 3 18.5v-9Z'),
  unfoldAll: p('M7 9.5l5-5 5 5M7 14.5l5 5 5-5'),                                // FOLDS while any window is folded (EXPAND ALL): out
  foldAll: p('M7 4.5l5 5 5-5M7 19.5l5-5 5 5'),                                  // FOLDS while none is (MINIMIZE ALL): in
  saveInto: p('M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z') + p('M9.5 3.5v8l2.5-2 2.5 2v-8') +
    p('M12 13.5v4.5') + p('M9.5 16l2.5 2.5 2.5-2.5'),                            // λWAVES' SAVE: a page filed into the library (012 M1), not the kit's floppy
  heart: solid('M12 21.2 3.9 13.4A5.3 5.3 0 0 1 12 6.1a5.3 5.3 0 0 1 8.1 7.3Z'),   // the ☆ layouts seat (#rackFav)
  hueRing: c(12, 12.5, 8) + p('M12 2.5v3.5') + dot(12, 12.5, 1.5),
  labels: p('M3 10.5V5.5A1.5 1.5 0 0 1 4.5 4h5L17 11.5a1.5 1.5 0 0 1 0 2.1l-4.9 4.9a1.5 1.5 0 0 1-2.1 0L3 10.5Z') + dot(7, 8, 1.2) + p('M16 6h5') + p('M18.5 10H21'),
  library: p('M2.5 20h19') + p('M4 20V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v15') + p('M9 20V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v16') +
    p('M15.6 20l-1.9-13.2a1 1 0 0 1 .8-1.1l2.9-.5a1 1 0 0 1 1.1.8L20.5 20'),     // the spine ticks gone: they were blobs at 14–16 px
  mass: p('M12 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z') + p('M7 8.5h10a1.5 1.5 0 0 1 1.45 1.1l2.3 9a1.5 1.5 0 0 1-1.45 1.9H4.7a1.5 1.5 0 0 1-1.45-1.9l2.3-9A1.5 1.5 0 0 1 7 8.5z'),
  modulation: p('M3 12C6 4 9 4 12 12S18 20 21 12'),                             // the sine: the modulation window and its door
  molecule: p('M12 3l7.79 4.5v9L12 21l-7.79-4.5v-9Z') + p('M12.83 7.18l2.93 1.69M15.76 15.13l-2.93 1.69M7.41 13.7v-3.4'),   // 026 A0 · THE HEX RING: a benzene ring, three inner double bonds (Kekulé) — unlike NODES' three nodes at 14 px
  moon: p('M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.6 6.6 0 0 0 10.7 10.7Z'),
  sun: c(12, 12, 4) + p('M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  nodes: c(5, 7, 2.5) + c(12, 17, 2.5) + c(19, 7, 2.5) + p('M6.4 9.1l4.2 5.8M13.4 14.9l4.2-5.8'),
  rackToggle: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/>' + p('M15 4v16'),   // ◧: hide or show the rack
  reverse: p('M4 8h15') + p('M15.5 4.5 19 8l-3.5 3.5') + p('M20 16H5') + p('M8.5 12.5 5 16l3.5 3.5'),
  trash: p('M3.5 6.5h17') + p('M9 6.5V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v2') + p('M5.5 6.5l1 13a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5l1-13') + p('M10 10.5v6.5') + p('M14 10.5v6.5'),
  windowPlus: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/>' + p('M3 8.5h18M12 11.5v6M9 14.5h6'),   // the FINDER
  repeat: p('M19.6 13.4A7.7 7.7 0 1 1 17 6.4') + p('M17.6 2.6 17 6.6l-4-.5'),
  reload: p('M5.5 8.75A7.5 7.5 0 1 0 12 5') + p('M14.6 2.4 12 5l2.6 2.6'),   // 032 T14 · 034 F6: ↺, ψ's time back to t = 0 — the common refresh: a 300° arc (centre 12,12.5) open at the upper left, the head on its end at the top, tangent to it, no dot
  /* 022 H1 · THE ESP BAR'S SIDE: the free stage with the bar on its edge (INFORMATIONAL › SIDE wears the side it is on, no word) */
  sideRight: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/><rect x="15" y="7" width="3" height="10" rx="1" fill="currentColor"/>',
  sideLeft: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/><rect x="6" y="7" width="3" height="10" rx="1" fill="currentColor"/>',
  sideTop: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/><rect x="7" y="7" width="10" height="3" rx="1" fill="currentColor"/>',
  sideBottom: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/><rect x="7" y="14" width="10" height="3" rx="1" fill="currentColor"/>',   // ⟳: to the next exact repeat of the density
  /* ── 022 E2 · THE WINDOWS, each drawn for its MEANING (V-BUILD.md's DRAWING LIST and the rest of the brief), not its letter ── */
  spectrum: p('M3 20.5h18') + p('M5.5 20.5v-6M9 20.5V6M12.5 20.5V11M16 20.5V3.5M19 20.5v-4'),                     // lines of different heights
  wave: p('M2.5 12h2c1 0 1.3-3 2.3-3s1.4 6 2.5 6 1.5-10 2.7-10 1.5 14 2.7 14 1.4-10 2.5-10 1.3 6 2.3 6 1.3-3 2.3-3h2'),   // a packet: the wave under its envelope
  clip: box(3.5, 3.5, 17, 17, 2.5) + fill(3.5, 9.5, 17, 5, 0),                                               // the box and the slab it keeps
  field: p('M3.5 3.5v17') + p('M7 7h11.5M7 12h11.5M7 17h11.5') + p('M16 4.5 18.5 7 16 9.5M16 9.5l2.5 2.5-2.5 2.5M16 14.5l2.5 2.5-2.5 2.5'),   // a plate and its field lines
  separable: p('M4 8l8-4.5L20 8v8l-8 4.5L4 16Z') + p('M4 8l8 4.5L20 8M12 12.5v8'),                                // the box: x · y · z apart
  central: p('M3 3.5C6 3.5 7 19.5 12 19.5S18 3.5 21 3.5') + p('M7.6 13h8.8'),                                    // a central well and a bound level
  lattice: dot(5, 5, 2) + dot(12, 5, 2) + dot(19, 5, 2) + dot(5, 12, 2) + dot(12, 12, 2) + dot(19, 12, 2) + dot(5, 19, 2) + dot(12, 19, 2) + dot(19, 19, 2),   // sites
  emission: c(6, 12, 3) + p('M10.5 12c.9-2.2 1.9-2.2 2.8 0s1.9 2.2 2.8 0H21') + p('M18.5 9.5 21 12l-2.5 2.5'),  // an atom and the photon it sends
  bloch: c(12, 12, 9) + p('M3 12a9 3 0 0 0 18 0') + p('M12 12l4.5-6') + dot(16.5, 6, 1.7),                       // the sphere and its state
  plane: p('M3 16.5 9 7.5h12l-6 9Z') + p('M12 12V3.5'),                                                          // a tilted plane and its normal
  calculus: p('M16 4.5c-1-1.4-3.2-1.2-3.6 1L10.6 18.5c-.4 2.2-2.6 2.4-3.6 1'),                                    // the integral sign
  ladder: p('M7 3v18M17 3v18M7 7.5h10M7 12h10M7 16.5h10'),                                                       // rungs: a†, a
  wigner: oval(12, 12, 9, 6, -25) + oval(12, 12, 5, 3, -25) + dot(12, 12, 1.4),                                  // a contour map
  shadow: c(12, 9, 5.5) + '<ellipse cx="12" cy="19.5" rx="7.5" ry="2" fill="currentColor"/>',                    // a disc and its cast
  orbit: oval(12, 12, 9, 5.5) + dot(19.8, 9.3, 2) + dot(4.9, 12, 1.2),                                          // the ellipse, the body, the focus
  vortex: p('M12 12c.2-1 1.5-1.3 2.1-.4.9 1.3-.2 3-1.8 3.1-2.3.2-3.7-2.2-3-4.3 1-2.9 4.5-3.8 7-2.3 3.2 1.9 3.6 6.4 1.3 9.1-2.7 3.3-7.7 3.4-10.6.6-3.2-3-3.1-8.3-.2-11.4'),   // a spiral
  meters: p('M3.5 17a8.5 8.5 0 1 1 17 0') + p('M12 17l4.2-5.6') + dot(12, 17, 1.6) + p('M6.2 11.4l1.2.9M12 8.6V10M17.8 11.4l-1.2.9'),   // a gauge
  radiation: dot(12, 12, 2.4) + p('M12 2.5v4.5M12 17v4.5M2.5 12H7M17 12h4.5M5.3 5.3l3.2 3.2M15.5 15.5l3.2 3.2M5.3 18.7l3.2-3.2M15.5 8.5l3.2-3.2'),   // rays
  equalizer: fill(3.5, 12, 3.2, 8.5, .8) + fill(8, 5.5, 3.2, 15, .8) + fill(12.5, 14, 3.2, 6.5, .8) + fill(17, 8, 3.2, 12.5, .8),   // bars
  controlSurface: p('M7 3.5v17') + fill(4.3, 12, 5.4, 3.6, 1) + c(16.5, 9, 4) + p('M16.5 9V5') + dot(16.5, 18.2, 1.5),   // a fader and a knob
  history: p('M4.5 12a7.5 7.5 0 1 0 2.2-5.3') + p('M6.7 3.6v3.1h3.1') + p('M12 8v4.5l3 2'),                       // the clock turned back
  keyboard: box(2.5, 6, 19, 12, 2) + p('M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8'),                    // keys
  mapping: box(3, 11, 10, 9.5, 2) + p('M6.5 16h3') + p('M13 15.5h3a2.5 2.5 0 0 0 2.5-2.5V8.5') + c(18.5, 6, 2.5),   // 023 D2: a key cap and its route (KEYBOARD's MAPPING face)
  notebook: box(6, 3, 13, 18, 2) + p('M9.5 8h6M9.5 12h6M9.5 16h3.5') + p('M6 7H4M6 12H4M6 17H4'),                // a bound, lined page
  informational: p('M4.5 4h15A1.5 1.5 0 0 1 21 5.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17h-1A1.5 1.5 0 0 1 3 15.5v-10A1.5 1.5 0 0 1 4.5 4Z') +
    dot(12, 7.6, 1.15) + p('M12 10.4v3.6'),                                                                      // an i in a speech line: the stage's words
  palette: dot(19, 12, 2.3) + dot(15.5, 18.06, 2.3) + dot(8.5, 18.06, 2.3) + dot(5, 12, 2.3) + dot(8.5, 5.94, 2.3) + dot(15.5, 5.94, 2.3),   // a ring of swatches
  lens: p('M3 8.5A1.5 1.5 0 0 1 4.5 7h3L9 4.5h6L16.5 7h3A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z') + c(12, 13, 3.6),   // CAMERA: a lens
  about: p('M6.5 3.5H8c1 0 1.7.5 2.1 1.4l8.4 15.6') + p('M12.4 10.6 5.5 20.5'),                                    // the λ mark
  timeline: fill(3.5, 4.5, 9, 3.2, 1) + fill(8.5, 10.4, 11, 3.2, 1) + fill(5.5, 16.3, 7, 3.2, 1) + p('M15.5 2.5v19'),   // lanes of clips and the playhead
  film: box(3, 5, 18, 14, 2.5) + solid('M10 9v6l5.2-3Z'),                                                        // RENDER: a frame with a play
  picker: box(3.5, 3.5, 7.5, 7.5, 1.5) + box(13, 3.5, 7.5, 7.5, 1.5) + box(3.5, 13, 7.5, 7.5, 1.5) + fill(13, 13, 7.5, 7.5, 1.5),   // a shelf of tiles, one picked
  transition: p('M3.5 5.5h9M3.5 18.5h9') + p('M8 6.5v10') + p('M5.8 14.3 8 16.5l2.2-2.2') + p('M13 12c.8-1.8 1.6-1.8 2.4 0s1.6 1.8 2.4 0 1.6-1.8 2.4 0'),   // two levels, the jump, the photon
  /* ── the Picker's look tiles (picker.js SHAPES) and the ladders' FILL ALL / EMPTY (paint-stroke.js, Gemini's 008 U drawings) ── */
  balls: dot(12, 12, 6.5),
  sticks: p('M3 12h11.3') + c(17.5, 12, 3.2),                                   // was 1.6 wide
  fillAll: '<rect ' + S + ' x="5" y="2.5" width="14" height="19" rx="3"/>' + p('M8.5 6.5h7M8.5 10h7M8.5 13.5h7') + dot(12, 17.6, 1.9),
  emptyAll: '<rect ' + S + ' x="5" y="2.5" width="14" height="19" rx="3"/>' + c(12, 12, 3.6) + p('M8.6 16.4 15.4 7.6'),
  /* ── NODES' node types (lab/img/nodes-icons.svg until 021, 16 units), `node` + the type ── */
  nodeTable: n16('<path d="M2 14H14V3Z"/>'),
  nodeMatrix: n16('<rect x="2" y="2" width="12" height="12" rx="1"/><path d="M6 2v12M10 2v12M2 6h12M2 10h12"/>'),
  nodePrim: n16('<path d="M8 2Q13 8 8 14Q3 8 8 2Z"/><path d="M1 8h14"/>'),
  nodeLayer: n16('<path d="M8 2L14 5L8 8L2 5Z"/><path d="M2 8.5L8 11.5L14 8.5M2 11.5L8 14.5L14 11.5"/>'),
  nodeIn: n16('<rect x="2" y="2" width="12" height="9" rx="1"/><path d="M8 11v4M5.5 12.5L8 15l2.5-2.5"/>'),
  nodeOut: n16('<rect x="2" y="5" width="12" height="8" rx="1"/><path d="M8 1v4M5.5 2.5L8 5l2.5-2.5"/>'),
  nodeCurves: n16('<rect x="2" y="2" width="12" height="12" rx="1"/><path d="M2 14C8 14 8 2 14 2"/>'),
  nodeLevels: n16('<path d="M2 10L5 5L8 8L11 3L14 10Z"/><path d="M2 12.5h12M3 15l1-2 1 2M7 15l1-2 1 2M11 15l1-2 1 2"/>'),
  nodePosterize: n16('<path d="M2 14V11H6V8H10V5H14V2"/>'),
  nodeThreshold: n16('<path d="M2 13H8V3H14"/>'),
  nodeInvert: n16('<path d="M3 5h10M10 2l3 3-3 3M13 11H3M6 8l-3 3 3 3"/>'),
  nodeGamma: n16('<path d="M2 14Q3 3 14 2"/><path d="M2 14L14 2" stroke-dasharray="1.5 2"/>'),
  nodeExposure: n16('<circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/>'),
  nodeContrast: n16('<circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 1 0 12Z" fill="currentColor"/>'),
  nodeHue: n16('<circle cx="8" cy="8" r="6"/><path d="M8 8V2M8 8l5.2 3M8 8l-5.2 3"/>'),
  nodeSaturation: n16('<path d="M8 2C8 2 3 8 3 10.5A5 5 0 0 0 13 10.5C13 8 8 2 8 2Z"/>'),
  nodeLuma: n16('<rect x="2" y="2" width="12" height="12" rx="1"/><path d="M2 14L14 2V14Z" fill="currentColor" opacity=".5"/>'),
  nodeTint: n16('<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/>'),
  nodeTemperature: n16('<path d="M7 2h2v8.5a2.5 2.5 0 1 1-2 0Z"/><path d="M11.5 4h2M11.5 7h2"/>'),
  nodeBlur: n16('<circle cx="8" cy="8" r="6" stroke-dasharray="1.5 2"/><circle cx="8" cy="8" r="2.5"/>'),
  nodeSharpen: n16('<path d="M8 2L14 14H2Z"/><path d="M8 7v4"/>'),
  nodeAberration: n16('<circle cx="6" cy="8" r="4"/><circle cx="10" cy="8" r="4"/>'),
  nodeBloom: n16('<circle cx="8" cy="8" r="2" fill="currentColor"/><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2 2M10.6 10.6l2 2M3.4 12.6l2-2M10.6 5.4l2-2"/>'),
  nodeDisplace: n16('<path d="M1.5 6Q4.5 3 8 6T14.5 6M1.5 11Q4.5 8 8 11T14.5 11"/>'),
  nodeGrain: '<g transform="scale(1.5)" fill="currentColor"><circle cx="3.5" cy="4" r="1"/><circle cx="9" cy="3" r="1"/><circle cx="13" cy="6" r="1"/>' +
    '<circle cx="6" cy="8" r="1"/><circle cx="11" cy="10.5" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="8" cy="13.5" r="1"/><circle cx="13.5" cy="13.5" r="1"/></g>',
  nodeVignette: n16('<rect x="1.5" y="3" width="13" height="10" rx="1"/><ellipse cx="8" cy="8" rx="4" ry="2.8"/>'),
  nodeScanlines: n16('<path d="M2 3.5h12M2 6.5h12M2 9.5h12M2 12.5h12"/>'),
  /* 024 S: the SHADER class (a scatter of dots piling into a fold) and DECOHERE (a line, decohering into the scatter) */
  nodeShader: '<g transform="scale(1.5)" fill="currentColor"><circle cx="2" cy="13.5" r=".8"/><circle cx="4.5" cy="11.2" r=".8"/><circle cx="6.6" cy="9.4" r=".8"/>' +
    '<circle cx="8.4" cy="8" r=".8"/><circle cx="10" cy="7" r=".8"/><circle cx="11.4" cy="6.3" r=".8"/><circle cx="12.7" cy="5.8" r=".8"/><circle cx="14" cy="5.5" r=".8"/>' +
    '<circle cx="3" cy="4" r=".8"/><circle cx="7" cy="3" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="8" cy="13.5" r=".8"/></g>',
  nodeDecohere: n16('<path d="M1.5 3.5h13"/>') + '<g transform="scale(1.5)" fill="currentColor"><circle cx="2.5" cy="7" r=".8"/><circle cx="6" cy="8" r=".8"/>' +
    '<circle cx="9.5" cy="7.5" r=".8"/><circle cx="13.5" cy="8.5" r=".8"/><circle cx="4" cy="11" r=".8"/><circle cx="8" cy="12.5" r=".8"/><circle cx="12" cy="13.5" r=".8"/><circle cx="14.5" cy="11.5" r=".8"/></g>',
  /* 027 N: FEEDBACK (a loop arrow trailing a tail) · REFRACT (a wave line over a lens arc) · FLOW (three streamlines) */
  nodeFeedback: n16('<path d="M12.5 6.5A4 4 0 1 1 9.5 3"/><path d="M8 1.2 9.8 3 8 4.8"/><path d="M5.6 9.4 1.5 13.5" stroke-dasharray="1.6 1.7"/>'),
  nodeRefract: n16('<path d="M1.5 4.5Q3.75 2.5 6 4.5T10.5 4.5T15 4.5"/><path d="M2 13Q8 7 14 13"/>'),
  nodeFlow: n16('<path d="M1.5 4C5 2 9 6 14.5 4M1.5 8C5 6 9 10 14.5 8M1.5 12C5 10 9 14 14.5 12"/>'),
};
/** a NODES type's glyph name ('grain' → 'nodeGrain') */
export const nodeGlyph = (type) => 'node' + type[0].toUpperCase() + type.slice(1);

/** ONE glyph per window, by the window's id (its saved id, which never changes): a rack card's at its register, a kit window's at its make */
export const WINDOW_GLYPH = {
  informational: 'informational', spectrum: 'spectrum', settings: 'settings', palette: 'palette', observer: 'wave', camera: 'lens', clip: 'clip',
  history: 'history', transport: 'controlSurface', chem: 'molecule', atoms: 'atom', equalizer: 'equalizer',
  staticfield: 'field', separable: 'separable', central: 'central', lattice: 'lattice', emission: 'emission', bloch: 'bloch', slice: 'plane',
  calculus: 'calculus', ladder: 'ladder', wigner: 'wigner', shadow: 'shadow', orbit: 'orbit', vortex: 'vortex', meters: 'meters',
  radiation: 'radiation', nodes: 'nodes', projects: 'folders', render: 'film',
  /* the kit factories' windows (windowGlyphs) */
  gui: 'cogSolid', 'gui-about': 'about', keyboard: 'keyboard', 'keys-help': 'keyboard', timeline: 'timeline', modulation: 'modulation',
  'transport-free': 'controlSurface', folders: 'folders',
};

let done = false;
/** registerIcons() — boot's first act, before any window is made: the table through the kit's door, and the kit factories' windows named by id.  Once. */
export function registerIcons() {
  if (done) return; done = true;
  registerGlyphs(ICONS);
  windowGlyphs(WINDOW_GLYPH);
}
