/* molecular-session.test.mjs — THE FUNNEL'S OWN LAWS, with no browser and no GPU.
 *
 * lab/molecular-session.js is pure logic on purpose: a fake field records what it was asked to do, so the four
 * things the old push-order could not state are stated here as numbers — which model is selected and WHY, what a
 * stale stamp does, what a second product inside one frame does, and what happens to the user's observable when
 * the last model lets go.
 *
 * Run:  node tests/molecular-session.test.mjs
 */
import assert from 'node:assert/strict';
import { createMolecularSession, MODEL_RANK } from '../lab/molecular-session.js';

/** the field, as this module actually uses it: two calls and one liveness flag */
function fakeField() {
  return { ok: true, calls: [], spec: null, matrix: null, kind: null,
    setMolecule(spec) { this.calls.push(['setMolecule', spec ? spec.nAO : null]); this.spec = spec;
      return spec ? { nAO: spec.nAO, half: spec.half } : null; },
    setMoleculeMatrix(M, o) { this.calls.push(['setMoleculeMatrix', o.kind]); this.matrix = M; this.kind = o.kind; } };
}
function harness() {
  const f = fakeField(), views = [], repaints = [];
  const s = createMolecularSession({ field: () => f, fieldView: (v) => views.push(v), repaint: (r) => repaints.push(!!r) });
  const pushed = { ground: 0, tdhf: 0, 'orbital-packet': 0 };
  for (const id of ['ground', 'tdhf', 'orbital-packet']) {
    s.register(id, { push: () => { pushed[id]++; }, view: () => (id === 'orbital-packet' ? 'phase' : 'density') });
  }
  return { f, s, views, repaints, pushed };
}
const D = (n) => new Float32Array(n * n);
const MOL = { hash: 'sto-3g|h2o', nAO: 7, half: 7.43, shells: [] };
const product = (kind, matrix, view, hash, solution) => ({ kind, matrix, view, hash, solution });

/* ── 1. THE SELECTION RULES, with their reasons ───────────────────────────────────────────────────────────── */
{
  const { s, views, pushed } = harness();
  assert.equal(s.selected, null);
  assert.match(s.reason, /no producer has claimed/);

  s.claim('ground', true, 'CHEMISTRY has the field');
  assert.equal(s.selected, 'ground', 'the card alone owns the field');
  assert.equal(s.reason, 'CHEMISTRY has the field');
  assert.deepEqual(views, ['density'], 'and the session asks for the card’s observable');
  assert.equal(pushed.ground, 1, 'the new owner is asked to paint at once');

  s.claim('orbital-packet', true, 'the ORBITALS register has the field');
  assert.equal(s.selected, 'orbital-packet', 'REGISTER ON outranks the still card');
  assert.deepEqual(views, ['density', 'phase']);
  assert.equal(pushed['orbital-packet'], 1);

  s.claim('tdhf', true, 'CHEMISTRY RT RUN is propagating the density');
  assert.equal(s.selected, 'tdhf', 'a live run outranks the register — which is what refusal() used to enforce');
  assert.equal(s.reason, 'CHEMISTRY RT RUN is propagating the density');
  assert.match(s.why('orbital-packet'), /tdhf has the field/);
  assert.equal(s.why('tdhf'), null);
  assert.equal(s.claimed('tdhf'), true, 'the register reads this instead of polling chem.state()');
  assert.deepEqual(views, ['density', 'phase', 'density']);

  s.claim('tdhf', false, 'RUN off');
  assert.equal(s.selected, 'orbital-packet', 'the run stops and the register has it back');
  s.claim('orbital-packet', false, 'REGISTER OFF');
  assert.equal(s.selected, 'ground', 'the register lets go and the card has it back');
  assert.equal(s.why('orbital-packet'), 'REGISTER OFF');
  assert.deepEqual(views, ['density', 'phase', 'density', 'phase', 'density']);
  assert.deepEqual(Object.entries(MODEL_RANK).sort((a, b) => a[1] - b[1]).map(([k]) => k),
    ['tdhf', 'states', 'orbital-packet', 'ground'], 'the rank order IS the policy, and it lives in the session');
  console.log('PASS selection: rank decides, not call order — tdhf > orbital-packet > ground, each with its reason.');
}

/* ── 2. THE STAMP: a reply for a molecule the session has left behind cannot paint ─────────────────────────── */
{
  const { f, s } = harness();
  s.claim('ground', true, 'on');
  s.adopt(MOL, 3);
  assert.equal(s.molecule.hash, MOL.hash); assert.equal(s.solution, 3);

  assert.equal(s.publish('ground', product('density', D(7), 'density', MOL.hash, 3)), true);
  assert.equal(f.kind, 'density');
  assert.equal(s.counters.published, 1);

  s.tick();
  assert.equal(s.publish('ground', product('density', D(7), 'density', MOL.hash, 2)), false, 'an OLDER solve cannot paint');
  assert.equal(s.counters.stale, 1);
  s.tick();
  assert.equal(s.publish('ground', product('density', D(7), 'density', 'sto-3g|c6h6', 3)), false, 'and neither can another molecule');
  assert.equal(s.counters.stale, 2);
  assert.equal(s.counters.published, 1, 'neither reached the field');

  /* the same reply arriving after a re-solve of the SAME molecule is stale too — the sequence, not the hash, is
     what a worker answering late gets wrong */
  s.adopt({ ...MOL }, 4);
  s.tick();
  assert.equal(s.publish('ground', product('density', D(7), 'density', MOL.hash, 3)), false);
  assert.equal(s.counters.stale, 3);
  assert.equal(s.publish('ground', product('density', D(7), 'density', MOL.hash, 4)), true);
  assert.equal(s.counters.published, 2);

  /* an unselected model is dropped and counted rather than overwriting the owner a millisecond later */
  s.tick();
  assert.equal(s.publish('orbital-packet', product('orbital', new Float32Array(7), 'phase', MOL.hash, 4)), false);
  assert.equal(s.counters.unselected, 1);
  assert.equal(f.kind, 'density', 'the volume still carries the selected model’s product');
  console.log('PASS the stamp: 3 stale drops (older sequence, other molecule, pre-re-solve reply) + 1 unselected drop, none of them painted.');
}

/* ── 3. ONE PRODUCT A FRAME ────────────────────────────────────────────────────────────────────────────────── */
{
  const { f, s } = harness();
  s.claim('ground', true, 'on'); s.adopt(MOL, 0);
  const before = f.calls.length;
  s.tick();
  s.publish('ground', product('density', D(7), 'density', MOL.hash, 0));
  s.publish('ground', product('signed', D(7), 'real', MOL.hash, 0));
  assert.equal(s.counters.replaced, 1, 'the second product inside one frame REPLACES the first and says so');
  assert.equal(f.kind, 'signed', 'and it is the later one the single dispatch will read');
  s.tick();
  s.publish('ground', product('density', D(7), 'density', MOL.hash, 0));
  assert.equal(s.counters.replaced, 1, 'a product in the NEXT frame is not a replacement');
  assert.equal(f.calls.length - before, 3);
  console.log('PASS one product a frame: two inside one frame count as a replacement, one per frame does not.');
}

/* ── 4. THE OBSERVABLE COMES BACK ──────────────────────────────────────────────────────────────────────────── */
{
  const { f, s, views } = harness();
  s.claim('ground', true, 'on'); s.adopt(MOL, 0);
  s.publish('ground', product('density', D(7), 'density', MOL.hash, 0));
  assert.equal(s.holdsView, true);
  assert.deepEqual(views, ['density']);

  s.tick(); s.publish('ground', product('signed', D(7), 'real', MOL.hash, 0));
  assert.deepEqual(views, ['density', 'real'], 'a product that wants another observable asks for it');
  s.tick(); s.publish('ground', product('signed', D(7), 'real', MOL.hash, 0));
  assert.deepEqual(views, ['density', 'real'], 'and one that wants the same observable does not ask again');

  s.claim('ground', false, 'CHEMISTRY OFF');
  assert.equal(s.selected, null);
  assert.equal(s.holdsView, false);
  assert.deepEqual(views, ['density', 'real', null], 'nothing claims the field: the caller is told to restore');
  assert.equal(s.counters.releases, 1);

  s.drop();
  assert.equal(s.molecule, null);
  assert.deepEqual(f.calls[f.calls.length - 1], ['setMolecule', null], 'and the volume goes back to the eigenmode kernel');
  assert.equal(s.publish('ground', product('density', D(7), 'density', MOL.hash, 0)), false);
  console.log('PASS the observable: asked for on change only, and handed back with `null` when the last model lets go.');
}

/* ── 5. THE WIRING ERRORS THAT MUST BE LOUD ────────────────────────────────────────────────────────────────── */
{
  const { s } = harness();
  assert.throws(() => s.register('packet', {}), /unknown model/);
  const bare = createMolecularSession({ field: () => fakeField() });
  assert.throws(() => bare.claim('ground', true), /before it registered/);
  console.log('PASS wiring: an unknown model and a claim without a registration both throw, at wiring time.');
}

console.log('PASS molecular-session: selection by rank with reasons, stamped products, one a frame, view restored.');
