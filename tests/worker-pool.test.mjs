/* tests/worker-pool.test.mjs — THE WORKER REFUSES (0.5.4 P6 · R4), judged on the REAL lab/worker-pool.js with a fake `spawn`
 * (createWorkerPool is injectable), node:test's mock timers (the chem ceiling is 300 s; no lab hook forces it) and a stub
 * requestAnimationFrame (the frame thread's road is rAF + setTimeout 0, which mock timers alone do not reach).
 *
 * The law: `answered` is a pool-lifetime flag, set on the chem worker's first reply and never reset by ensure() or the respawn.
 * While it is false the frame thread's road (`local()`, the caller's fallback) is the only road — a browser whose module worker
 * never loads keeps MOLECULES.  Once it is true an error or a timeout is REFUSED as { error, refused } (both keys, one sentence),
 * fail() respawns the worker ONCE and then refuses for good, and the job that killed a worker is never posted again.
 * `bow` / `period` / `cards` keep their roads (no respawn, the fallback on any failure).
 *   node tests/worker-pool.test.mjs */
import { mock } from 'node:test';
import { createWorkerPool } from '../lab/worker-pool.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}

/* ── the fakes ─────────────────────────────────────────────────────────────────────────────────── */
let rafs = 0;
globalThis.requestAnimationFrame = (f) => { rafs++; f(0); return rafs; };   // the stub: the frame comes at once; its setTimeout 0 is mocked
mock.timers.enable({ apis: ['setTimeout'] });
const RealWorker = function Worker() {};                                       // only `typeof Worker === 'function'` is read
class FakeWorker {
  constructor(spawned) { this.posted = []; this.terminated = false; spawned.push(this); }
  postMessage(m) { this.posted.push(m); }
  terminate() { this.terminated = true; }
  reply(i, data) { this.onmessage({ data: { id: this.posted[i].id, op: this.posted[i].op, ...data } }); }
  crash(msg) { this.onerror({ message: msg }); }
}
/** one pool and its ledger: every spawned fake, and how many times the frame thread's road ran */
function rig({ worker = true, throwOnSpawn = false } = {}) {
  if (worker) globalThis.Worker = RealWorker; else delete globalThis.Worker;
  const spawned = [], R = { spawned, local: 0 };
  R.pool = createWorkerPool({ busyWrap: (p) => p, spawn: () => { if (throwOnSpawn) throw new Error('blocked by CSP'); return new FakeWorker(spawned); } });
  R.fallback = () => { R.local++; return { energy: -1, local: true }; };
  R.solve = (op, tag) => R.pool.solveChem({ op, tag }, R.fallback, (r) => r);
  R.posts = (tag) => spawned.reduce((n, w) => n + w.posted.filter((m) => m.tag === tag).length, 0);   // how often one job was posted, over every worker
  return R;
}
/** let promises, the mocked 0 ms timers and the stub frame run to rest */
const settle = async () => { for (let i = 0; i < 8; i++) { await Promise.resolve(); mock.timers.tick(0); } await new Promise((r) => setImmediate(r)); };
/** a job's answer after the world has settled, or 'PENDING' — a regression reads RED here, never as a hung suite */
const out = async (p) => { let v = 'PENDING'; p.then((x) => { v = x; }); await settle(); return v; };
const isRefusal = (r) => !!r && typeof r.error === 'string' && r.refused === r.error && /pick the molecule again/.test(r.refused);
const warn = console.warn; console.warn = () => {};                           // fail()'s console line is the app's, not this suite's

/* ── 1 · error after a reply ───────────────────────────────────────────────────────────────────── */
{
  const R = rig(), first = R.solve('chem.ground', 'A'); await settle();
  R.spawned[0].reply(0, { energy: -74.96 }); const a = await out(first);
  const killer = R.solve('chem.ground', 'B'); await settle();
  R.spawned[0].crash('out of memory'); const b = await out(killer);
  judge('1 error after a reply → { error, refused }, local() = 0', isRefusal(b) && R.local === 0 && a.energy === -74.96,
    { local: R.local, reply: b, answered: R.pool.chemW.answered });
  const next = R.solve('chem.ground', 'C'); await settle();
  judge('1 fail() respawns ONCE for the next job; the killing job is not re-posted', R.pool.chemW.starts === 2 && R.spawned[0].terminated
    && R.posts('B') === 1 && R.spawned[1]?.posted.length === 1 && R.spawned[1].posted[0].tag === 'C' && R.pool.chemW.ok,
    { starts: R.pool.chemW.starts, postsB: R.posts('B'), second: R.spawned[1]?.posted.map((m) => m.tag) });
  R.spawned[1]?.reply(0, { energy: -1.1 });
  judge('1 the respawned worker answers its own job', (await out(next)).energy === -1.1 && R.local === 0);
}

/* ── 2 · timeout after a reply ─────────────────────────────────────────────────────────────────── */
{
  const R = rig(), first = R.solve('chem.ground', 'A'); await settle();
  R.spawned[0].reply(0, { energy: -74.96 }); await out(first);
  const slow = R.solve('chem.ground', 'B'); await settle();
  mock.timers.tick(299999); await settle();
  let early = 'pending'; slow.then(() => { early = 'resolved'; }); await settle(); const before = early;
  mock.timers.tick(1); const b = await out(slow);
  judge('2 timeout after a reply (300 s, mocked) → { error, refused }, local() = 0', isRefusal(b) && /timeout/.test(b.error) && R.local === 0 && before === 'pending',
    { local: R.local, reply: b, at299999ms: before });
  judge('2 a timeout cancels nothing: the one worker keeps running, no respawn, the job is posted once', R.pool.chemW.starts === 1 && !R.spawned[0].terminated
    && R.posts('B') === 1 && R.pool.chemW.ok, { starts: R.pool.chemW.starts, terminated: R.spawned[0].terminated });
}

/* ── 3 · error after the respawn (the flag outlives the worker), and 4 · the dead pool ──────────────── */
{
  const R = rig(), first = R.solve('chem.ground', 'A'); await settle();
  R.spawned[0].reply(0, { energy: -74.96 }); await out(first);
  const one = R.solve('chem.ground', 'B'); await settle(); R.spawned[0].crash('first'); await out(one);
  const two = R.solve('chem.ground', 'C'); await settle();
  R.spawned[1]?.crash('second, before the new worker ever replied'); const c = await out(two);
  judge('3 error after the respawn (the new worker never replied) → refused, local() = 0: `answered` is the pool\'s',
    isRefusal(c) && R.local === 0 && R.pool.chemW.answered, { local: R.local, reply: c });
  judge('3 the second failure refuses without a third spawn', R.pool.chemW.starts === 2 && R.spawned.length === 2 && !R.pool.chemW.ok,
    { starts: R.pool.chemW.starts, ok: R.pool.chemW.ok });
  const d = await out(R.solve('chem.ground', 'D')), e = await out(R.solve('chem.spectrum', 'E'));
  judge('4 the dead pool: every later chem job → { error, refused }, local() = 0, nothing spawned or posted', isRefusal(d) && isRefusal(e) && R.local === 0
    && R.spawned.length === 2 && R.posts('D') + R.posts('E') === 0, { local: R.local, d, spawned: R.spawned.length });
  judge('3 the killing jobs B and C were each posted exactly once', R.posts('B') === 1 && R.posts('C') === 1, { B: R.posts('B'), C: R.posts('C') });
}

/* ── 5 · the never-answered worker keeps the frame thread's road (its only one) ──────────────────────── */
{
  const R = rig(), job = R.solve('chem.ground', 'A'); await settle();
  R.spawned[0].crash('module workers unsupported'); const a = await out(job);
  judge('5 an onerror before any reply → local() = 1, the job answered on the frame thread', R.local === 1 && a && a.local === true && !R.pool.chemW.answered,
    { local: R.local, reply: a });
  const again = await out(R.solve('chem.ground', 'B'));
  judge('5 …and the next job takes the same road (no respawn for a worker that never answered)', R.local === 2 && again.local === true && R.pool.chemW.starts === 1,
    { local: R.local, starts: R.pool.chemW.starts });
  const N = rig({ worker: false }), n = await out(N.solve('chem.ground', 'A'));
  judge('5 no Worker in this browser → local() = 1, nothing spawned', N.local === 1 && n.local === true && N.spawned.length === 0, { local: N.local });
  const T = rig({ throwOnSpawn: true }), t = await out(T.solve('chem.ground', 'A'));
  judge('5 a construction throw → local() = 1', T.local === 1 && t.local === true, { local: T.local });
  const S = rig(), slow = S.solve('chem.ground', 'A'); await settle(); mock.timers.tick(300000); const s = await out(slow);
  judge('5 a timeout before any reply → local() = 1 (the road it had)', S.local === 1 && s.local === true, { local: S.local });
}

/* ── the other queues keep their roads ─────────────────────────────────────────────────────────── */
{
  const R = rig(), cards = R.pool.cards; let fell = 0;
  const first = R.pool.solveCard({ op: 'h2.curve' }, () => ++fell, (r) => r.result); await settle();
  R.spawned[0].reply(0, { result: 42 }); const a = await out(first);
  const second = R.pool.solveCard({ op: 'h2.curve' }, () => ++fell, (r) => r.result); await settle();
  R.spawned[0].crash('boom'); const b = await out(second);
  judge('cards: after a reply an error still falls back to the frame thread, and the worker is not respawned', a === 42 && b === 1 && fell === 1 && !cards.ok && cards.starts === 1,
    { a, b, fell, ok: cards.ok, starts: cards.starts });
}

console.warn = warn;
mock.timers.reset();
console.log(`\n${TOTAL - FAILED}/${TOTAL} GREEN — THE WORKER REFUSES`);
if (FAILED) process.exit(1);
