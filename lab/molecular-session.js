/* molecular-session.js — THE ONE OWNER OF THE MOLECULAR VOLUME (JUDGMENT.md §2, Observation 1).
 *
 * Every dynamical model this instrument can play emits, per frame, one of three objects: a complex (or real) AO
 * vector c, a symmetric real matrix Re D, or a symmetric real matrix that is NOT a density because it is a
 * difference.  The renderer never needs to know which model produced it.  So there is one funnel, and this is it.
 *
 * WHAT IT REPLACES.  CHEMISTRY and ORBITALS both called field.setMolecule / field.setMoleculeMatrix, and the
 * FRAME LOOP'S CALL ORDER decided who owned the texels — rack.js said so in as many words ("THE REGISTER PUSHES
 * AFTER THE CARD, AND THAT ORDER IS THE POLICY"), and the register carried a `refusal()` dance to stay out of a
 * real-time run's way.  Order is not a policy: it cannot be read, cannot be tested, and cannot say WHY.  Here the
 * same three outcomes are explicit state with a reason string, and the order of the two update() calls in the
 * frame loop no longer changes anything.
 *
 * THE RULES, which reproduce exactly what the two windows did before:
 *   · tdhf           rank 0 — CHEMISTRY's real-time run owns the field while it is propagating.
 *   · orbital-packet rank 1 — the ORBITALS register owns it while REGISTER ON is up and no run is live.
 *   · ground         rank 2 — otherwise the card's own view (density, one orbital, or the difference).
 * Exactly one model is SELECTED: the claiming model of lowest rank, or none when nobody claims.  A product from
 * any other model is DROPPED AND COUNTED rather than silently overwritten a millisecond later.
 *
 * ONE PRODUCT A FRAME.  The field dispatches once per frame on its dirty flag, so a second product inside one
 * frame would never reach the volume anyway; it REPLACES the first and is counted (`replaced`), which is how a
 * producer that has started pushing twice a frame announces itself instead of hiding.
 *
 * THE STAMP.  Every product carries the molecule's basis+geometry hash and the producer's solve sequence.  A
 * product stamped for a molecule the session has left behind, or for an older solve of the same one, cannot
 * paint — which is the guard a worker reply arriving late needs, independently of the producer's own seq check.
 *
 * THE OBSERVABLE.  The session is the only caller of the field-view road, and it asks for it when the selected
 * model changes or when the product's wanted view changes; when nothing claims the field it asks for `null`,
 * which is the caller's cue to give the user back the observable they had before any molecule took it.  (One
 * departure from the old code, stated: CHEMISTRY used to re-assert its observable on EVERY push, so a hand that
 * moved the VIEW control under a live card was overruled within a frame.  The register never did that.  Now
 * neither does.)
 *
 * NO DOM, NO WEBGPU, NO ALLOCATION ON THE FRAME PATH: `publish` writes into one reused options record and stores
 * primitives only, so a producer that reuses its own product record (they all do) allocates nothing per frame.
 * `state()` builds an object and is a debug road, never the loop's.
 */

/** the selection order, and the whole of it: a producer names a model, the session owns its rank */
export const MODEL_RANK = { tdhf: 0, states: 1, 'orbital-packet': 2, ground: 3 };   // `states` = the REGISTER's many-electron mode (stage 4); the window's switch lets only one register claim at a time
export const MODEL_IDS = Object.keys(MODEL_RANK);
/** what a product may be.  'orbital' is an AO vector (real or { re, im }); the other two are symmetric n × n */
export const PRODUCT_KINDS = ['orbital', 'density', 'signed'];
const NO_CLAIM = 'no producer has claimed the field';

export function createMolecularSession(api = {}) {
  const fieldOf = () => { const f = typeof api.field === 'function' ? api.field() : api.field; return f && f.ok !== false ? f : null; };
  const askView = (name) => { if (api.fieldView) api.fieldView(name); };
  const repaint = (rebuild) => { if (api.repaint) api.repaint(rebuild); };

  const models = new Map();                 // id → { id, rank, push, view, claimed, why }
  const OPT = { kind: 'density' };          // the one options record setMoleculeMatrix is handed, reused
  const counters = { published: 0, replaced: 0, stale: 0, unselected: 0, unknown: 0, noMolecule: 0,
    selections: 0, releases: 0, molecules: 0, drops: 0 };
  let mol = null;                           // { hash, nAO, half } — the molecule the field is holding
  let solution = -1;                        // the producer's solve sequence the molecule was uploaded under
  let selected = null, reason = NO_CLAIM;
  let view = null, held = false;            // the observable this session has asked for, and whether it holds one
  let frame = 0, frameOfLast = -1;
  const last = { model: null, kind: null, view: null, hash: null, solution: -1 };

  /** a producer names its model once: `push()` is how the session asks it to paint, `view()` what it wants shown */
  function register(id, { push = null, view: wantView = null } = {}) {
    if (MODEL_RANK[id] === undefined) throw new Error(`molecular-session: unknown model '${id}' — one of ${MODEL_IDS.join(', ')}`);
    const m = { id, rank: MODEL_RANK[id], push, view: wantView, claimed: false, why: 'not claimed' };
    models.set(id, m);
    return m;
  }

  /** THE SELECTION, and the only place it is decided: the claiming model of lowest rank */
  function apply() {
    let best = null;
    for (const m of models.values()) if (m.claimed && (!best || m.rank < best.rank)) best = m;
    const next = best ? best.id : null;
    if (next === selected) return selected;
    selected = next;
    counters.selections++;
    reason = best ? best.why : NO_CLAIM;
    if (!best) {
      if (held) { held = false; view = null; counters.releases++; askView(null); }   // hand the observable back
      return selected;
    }
    const want = best.view ? best.view() : null;
    if (want && (want !== view || !held)) { view = want; held = true; askView(want); }
    if (best.push) best.push();                                                      // the new owner paints at once
    return selected;
  }

  /** a producer says whether its model wants the field, and why — the reason is what the interface reads back */
  function claim(id, on, why) {
    const m = models.get(id);
    if (!m) throw new Error(`molecular-session: model '${id}' claims the field before it registered`);
    const want = !!on;
    m.why = typeof why === 'string' ? why : want ? `${id} claims the field` : 'not claimed';
    if (m.claimed === want) { if (selected === id) reason = m.why; return selected; }
    m.claimed = want;
    return apply();
  }

  /** upload the shells and take ownership of the volume; `seq` is the producer's monotone solve sequence */
  function adopt(spec, seq = 0) {
    const f = fieldOf();
    if (!f || !spec || !spec.hash) return null;
    if (mol && mol.hash === spec.hash && solution === seq) return mol;
    const info = f.setMolecule({ nAO: spec.nAO, half: spec.half, shells: spec.shells });
    mol = { hash: spec.hash, nAO: info.nAO, half: info.half };
    solution = seq;
    last.model = last.kind = last.view = last.hash = null; last.solution = -1;
    counters.molecules++;
    repaint(true);
    return mol;
  }
  /** hand the volume back to the eigenmode kernel; the observable follows when nothing claims the field */
  function drop() {
    const f = fieldOf();
    if (mol && f) f.setMolecule(null);
    if (mol) counters.drops++;
    mol = null; solution = -1;
    last.model = last.kind = last.view = last.hash = null; last.solution = -1;
    return null;
  }

  /**
   * ONE tagged product from the selected model.
   * p = { kind: 'orbital' | 'density' | 'signed', matrix, view, hash, solution } — the record is READ and never
   * kept, so a producer may (and should) reuse one object for every frame.
   */
  function publish(id, p) {
    const m = models.get(id);
    if (!m) { counters.unknown++; return false; }
    if (id !== selected) { counters.unselected++; return false; }
    const f = fieldOf();
    if (!f || !mol) { counters.noMolecule++; return false; }
    if (!p || !p.matrix || !PRODUCT_KINDS.includes(p.kind)) { counters.unknown++; return false; }
    if (p.hash !== mol.hash || !(p.solution >= solution)) { counters.stale++; return false; }
    if (frameOfLast === frame) counters.replaced++;
    OPT.kind = p.kind;
    f.setMoleculeMatrix(p.matrix, OPT);
    counters.published++; frameOfLast = frame;
    last.model = id; last.kind = p.kind; last.view = p.view || null; last.hash = p.hash; last.solution = p.solution;
    if (p.view && (p.view !== view || !held)) { view = p.view; held = true; askView(p.view); }
    repaint(false);
    return true;
  }

  return {
    register, claim, adopt, drop, publish,
    /** the frame loop's one call: the boundary a second product in the same frame is measured against */
    tick() { frame++; return frame; },
    get selected() { return selected; },
    get reason() { return reason; },
    get molecule() { return mol; },
    get solution() { return solution; },
    get holdsView() { return held; },
    get counters() { return counters; },                 // live, not a copy: no allocation for a frame-path reader
    /** is this model claiming right now — the question the ORBITALS register's refusal used to ask chem.state() */
    claimed(id) { const m = models.get(id); return !!(m && m.claimed); },
    /** why this model is not playing, or null when it is: the reason belongs to the session, not to the caller */
    why(id) {
      const m = models.get(id);
      if (!m) return `no model '${id}'`;
      if (selected === id) return null;
      if (!m.claimed) return m.why;
      return selected ? `${selected} has the field: ${reason}` : NO_CLAIM;
    },
    /** the debug road (__LW.molsession): allocates, so it is never called from the frame loop */
    state() {
      return { selected, reason, view, holdsView: held, frame, solution,
        molecule: mol ? { ...mol } : null,
        last: { ...last },
        models: [...models.values()].map((m) => ({ id: m.id, rank: m.rank, claimed: m.claimed, why: m.why })),
        counters: { ...counters } };
    },
  };
}
