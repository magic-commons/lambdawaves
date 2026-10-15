/* tools/gemma/verbs.stub.mjs — THE STUB of `lab/verbs.js` (0.6.6 G3), the BUILD-PLAN's table in G1's shape, so the broker can be built
 * and checked before G1 lands.  `verb-doc.mjs` reads `lab/verbs.js` first and this file only when that is absent, and says so.
 * Same shape as G1's: `VERBS = [{ id, args: { name: 'type | enum a|b|c | ?optional' }, doc, run }]`; no `run` here does anything —
 * the page's table is the one that acts.  Delete this file once `lab/verbs.js` is on every branch that runs the broker. */
const none = () => { throw new Error('verbs.stub.mjs: the stub does not act — the page runs lab/verbs.js'); };

export const SWITCHES = ['locate', 'particles', 'formula', 'labels', 'eq'];

export const VERBS = [
  { id: 'preset', args: { id: 'string' }, doc: "load one of STATE's presets as a hand would (a hydrogen superposition by id)", run: none },
  { id: 'molecule', args: { id: 'string', basis: '?enum sto-3g|6-31+g-star', view: '?enum density|orbital|diff|esp', orbital: '?string' },
    doc: 'pick a library molecule and switch MOLECULES on; optionally its basis, its VIEW, and an orbital by name (HOMO, 1b1) or number', run: none },
  { id: 'view', args: { id: 'enum density|phase|real|imag|diff|reim' }, doc: "the stage's observable (the V key's): density, phase, real, imag, diff, reim", run: none },
  { id: 'window', args: { id: 'string', open: 'boolean', side: '?enum left|right' }, doc: 'open or close one window by its id (the + and WINDOW list)', run: none },
  { id: 'camera', args: { yaw: '?number', pitch: '?number', zoom: '?number', fov: '?number', autoRotate: '?boolean', home: '?boolean' },
    doc: 'pose the camera: yaw and pitch in radians, zoom as the distance, fov in radians, auto-rotate on or off, home resets the pose', run: none },
  { id: 'rate', args: { value: 'number' }, doc: 'the transport RATE (how fast time runs; 1 is normal), clamped to the knob and the flash law', run: none },
  { id: 'play', args: { on: 'boolean' }, doc: 'play (true) or pause (false) THE play', run: none },
  { id: 'scrub', args: { t: 'number' }, doc: 'move time to t (atomic units)', run: none },
  { id: 'switch', args: { id: `enum ${SWITCHES.join('|')}`, on: 'boolean' }, doc: 'turn a hand switch on or off: vortex LOCATE, PARTICLES, STAGE FORMULA, ATOM LABELS, the equalizer PRESET', run: none },
  { id: 'say', args: { md: 'string' }, doc: 'write a short Markdown paragraph on the stage (held until Escape or the next ask)', run: none },
  { id: 'notebook', args: { md: 'string' }, doc: "append a Markdown block to the project's notebook (page 0)", run: none },
  { id: 'new', args: {}, doc: 'open the empty NEW project (everything back to the start)', run: none },
];
