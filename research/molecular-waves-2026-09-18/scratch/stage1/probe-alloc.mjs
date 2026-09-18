// Scratch — the frame path's own allocation, measured: the session's publish + the two producers' reused records.
//   node --expose-gc research/molecular-waves-2026-09-18/scratch/stage1/probe-alloc.mjs
import { createMolecularSession } from '../../../../lab/molecular-session.js';

const field = { ok: true, setMolecule: (s) => (s ? { nAO: s.nAO, half: s.half } : null), setMoleculeMatrix() {} };
const s = createMolecularSession({ field: () => field, fieldView() {}, repaint() {} });
s.register('ground', { push() {}, view: () => 'density' });
s.register('orbital-packet', { push() {}, view: () => 'phase' });
s.claim('ground', true, 'on');
s.adopt({ hash: 'h', nAO: 7, half: 7.43, shells: [] }, 0);

const M = new Float32Array(49);
const product = { kind: 'density', matrix: M, view: 'density', hash: 'h', solution: 0 };   // ONE record, as chemview keeps one
const stale = { kind: 'density', matrix: M, view: 'density', hash: 'other', solution: 0 };
const N = 2e6;

const run = (label, fn) => {
  for (let i = 0; i < 1e5; i++) fn(i);                     // warm the JIT
  global.gc(); global.gc();
  const a = process.memoryUsage().heapUsed, t0 = performance.now();
  for (let i = 0; i < N; i++) fn(i);
  const ms = performance.now() - t0;
  global.gc(); global.gc();
  const b = process.memoryUsage().heapUsed;
  console.log(`${label.padEnd(34)} ${((b - a) / N).toFixed(4)} bytes/call retained, ${(ms * 1e6 / N).toFixed(1)} ns/call`);
};

run('tick + publish (accepted)', () => { s.tick(); s.publish('ground', product); });
run('publish (stale stamp, dropped)', () => s.publish('ground', stale));
run('publish (unselected, dropped)', () => s.publish('orbital-packet', product));
run('claimed("tdhf") — the refusal read', () => s.claimed('tdhf'));
console.log('counters', JSON.stringify(s.counters));
