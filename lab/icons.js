/* lab/icons.js — THE ICON TABLE (021 V2): every λWAVES drawing, in the kit's shape, registered through the kit's one door (MIR 1.5.6-alpha.3
 * `registerGlyphs`) so every seat draws through the kit's roads — `chip`/`setGlyph`/`glyphEl`, `sw({ glyph })`, the FINDER's `spec.glyph`, the
 * menubar's `opts.icon`.  THE LAW: the inner markup of a 24-unit box, live area 2–22, stroke 1.9, round caps and joins, `currentColor`; a solid is
 * `fill-rule: evenodd`; a 16-unit drawing (NODES') is drawn through the kit's own precedent `<g transform="scale(1.5)">` at stroke 1.267; rendered
 * at 16, 20 or 24 px only; named for its MEANING in camelCase, never for the character it replaced.  A kit name is never redrawn here (the door
 * refuses it): the same idea uses the kit's drawing (info, settings, folder, home, plus, download, save, curves, render, chevron*).
 * WINDOW_GLYPH is ONE glyph per window, declared at its register (rack-wiring.js) or its createWindow (kit factories through `windowGlyphs`).
 * BORROWED names are windows with no drawing yet: each wears the kit glyph named beside it until iteration 022 draws it (V-BUILD.md's list). */
import { registerGlyphs, glyphSvg } from './mir/glyph.js';
import { windowGlyphs } from './mir/window/window.js';

const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const p = (d) => '<path ' + S + ' d="' + d + '"/>';
const c = (cx, cy, r) => '<circle ' + S + ' cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
const dot = (cx, cy, r) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="currentColor"/>';
const solid = (d) => '<path fill="currentColor" fill-rule="evenodd" d="' + d + '"/>';
/* NODES' 16-unit drawings, through the kit's precedent (glyph.js `edit`, `select`, `scrub`) */
const n16 = (inner) => '<g transform="scale(1.5)" fill="none" stroke="currentColor" stroke-width="1.267" stroke-linecap="round" stroke-linejoin="round">' + inner + '</g>';

export const ICONS = {
  /* ── the Picker, the bar, FOLDERS (lab/img/icons/ until 021, each redrawn at 1.9) ── */
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
  molecule: c(6, 7, 2.6) + c(18, 7, 2.6) + c(12, 17, 3) + p('M7.4 9.2l3.1 5.2') + p('M16.6 9.2l-3.1 5.2'),   // three atoms, two bonds: five rings filled in at 14 px
  moon: p('M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.6 6.6 0 0 0 10.7 10.7Z'),
  sun: c(12, 12, 4) + p('M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'),
  nodes: c(5, 7, 2.5) + c(12, 17, 2.5) + c(19, 7, 2.5) + p('M6.4 9.1l4.2 5.8M13.4 14.9l4.2-5.8'),
  rackToggle: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/>' + p('M15 4v16'),   // ◧: hide or show the rack
  reverse: p('M4 8h15') + p('M15.5 4.5 19 8l-3.5 3.5') + p('M20 16H5') + p('M8.5 12.5 5 16l3.5 3.5'),
  trash: p('M3.5 6.5h17') + p('M9 6.5V4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v2') + p('M5.5 6.5l1 13a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5l1-13') + p('M10 10.5v6.5') + p('M14 10.5v6.5'),
  windowPlus: '<rect ' + S + ' x="3" y="4" width="18" height="16" rx="2.5"/>' + p('M3 8.5h18M12 11.5v6M9 14.5h6'),   // the FINDER
  repeat: p('M19.6 13.4A7.7 7.7 0 1 1 17 6.4') + p('M17.6 2.6 17 6.6l-4-.5'),   // ⟳: to the next exact repeat of the density
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
};
/** a NODES type's glyph name ('grain' → 'nodeGrain') */
export const nodeGlyph = (type) => 'node' + type[0].toUpperCase() + type.slice(1);

/* THE DRAWING LIST FOR 022: a window's own name, wearing the drawing named beside it (a kit glyph, or one above) until it is drawn */
export const BORROWED = {
  spectrum: 'bulletList', wave: 'modulation', clip: 'compact', field: 'compassNorth', separable: 'duplicate', central: 'tune', lattice: 'gallery',
  emission: 'barsBottom', bloch: 'loop', plane: 'xy', calculus: 'curves', ladder: 'barsTop', wigner: 'eye', shadow: 'eyeShut', orbit: 'morph',
  vortex: 'mandelbrot', meters: 'grade', radiation: 'dot', equalizer: 'sliders', controlSurface: 'sliders', history: 'undo', keyboard: 'gripDots',
  notebook: 'edit',
};

/** ONE glyph per window, by the window's id (its saved id, which never changes): a rack card's at its register, a kit window's at its make */
export const WINDOW_GLYPH = {
  informational: 'info', spectrum: 'spectrum', settings: 'settings', palette: 'hueRing', observer: 'wave', camera: 'cameraOrbit', clip: 'clip',
  history: 'history', transport: 'controlSurface', chem: 'molecule', atoms: 'atom', equalizer: 'equalizer',
  staticfield: 'field', separable: 'separable', central: 'central', lattice: 'lattice', emission: 'emission', bloch: 'bloch', slice: 'plane',
  calculus: 'calculus', ladder: 'ladder', wigner: 'wigner', shadow: 'shadow', orbit: 'orbit', vortex: 'vortex', meters: 'meters',
  radiation: 'radiation', nodes: 'nodes', projects: 'folders', render: 'render',
  /* the kit factories' windows (windowGlyphs) */
  gui: 'settings', 'gui-about': 'info', keyboard: 'keyboard', 'keys-help': 'keyboard', timeline: 'lanes', modulation: 'modulation',
  'transport-free': 'controlSurface', folders: 'folders',
};

const inner = (name) => glyphSvg(name).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
let done = false;
/** registerIcons() — boot's first act, before any window is made: the table and the borrowed names through the kit's door, and the kit
 *  factories' windows named by id.  Once. */
export function registerIcons() {
  if (done) return; done = true;
  registerGlyphs(ICONS);
  registerGlyphs(Object.fromEntries(Object.entries(BORROWED).map(([name, from]) => [name, ICONS[from] || inner(from)])));
  windowGlyphs(WINDOW_GLYPH);
}
