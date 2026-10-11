/* tests/worker-refusal.browser-test.mjs — THE WORKER REFUSES (0.5.4 P6 · R4) on the LIVE error road, in a real browser.
 *
 *   tools/gate/server.py "$PWD" 8704 &
 *   LW_PORT=8704 GD_PORT=5206 node tests/worker-refusal.browser-test.mjs
 *
 * The node suite (tests/worker-pool.test.mjs) proves the roads with a fake spawn and mock timers; this is the one case the
 * real module worker answers.  A worker that has answered and then replies with an error (here an UNKNOWN OP, which
 * lab/mathworker.js answers `{ error: 'unknown op …' }`) is refused as { error, refused } — the caller's fallback, the
 * frame thread's road, is never run.  Two readings of the same law, no lab hook:
 *   (a) the shipped lab/worker-pool.js over the shipped lab/mathworker.js, built in the page with a COUNTING fallback;
 *   (b) the app's own chem pool through `__LW.chem`'s api.solve: `workerStat()` posts `stat` with the fallback `() => null`,
 *       and the message is rewritten to the unknown op IN FLIGHT (Worker.prototype.postMessage, armed for that one synchronous
 *       call), so a refusal object — not null — is the proof the fallback did not answer.  The pool is not killed by it:
 *       the next stat answers, and the worker's solver count has not moved. */
import { open, judge, done } from '../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8704;
const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1300, height: 900, script: 120000 });
try {
  const ready = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('W0 boot: __LW.ready', ready.ok === 1, ready);

  /* (a) the shipped pool and worker, a counting fallback */
  const a = await g.ev(`const { createWorkerPool } = await import('./worker-pool.js');
    const pool = createWorkerPool({ busyWrap: (p) => p, spawn: () => new Worker(new URL('./mathworker.js', location.href), { type: 'module' }) });
    let calls = 0; const fallback = () => { calls++; return { local: true }; };
    const first = await pool.solveChem({ op: 'stat' }, fallback, (r) => r);
    const answered = pool.chemW.answered;
    const r = await pool.solveChem({ op: 'chem.nope' }, fallback, (r) => r);
    const after = await pool.solveChem({ op: 'stat' }, fallback, (r) => r);
    const out = { firstOk: !!(first && first.ok), answered, r, calls, ok: pool.chemW.ok, starts: pool.chemW.starts, afterOk: !!(after && after.ok) };
    return out;`);
  judge('W1 (a) the shipped pool + mathworker: an unknown op after a reply → { error, refused }, the counting fallback ran 0 times',
    a.firstOk && a.answered && a.r && typeof a.r.error === 'string' && a.r.refused === a.r.error && /unknown op chem\.nope/.test(a.r.error) && a.calls === 0, a);
  judge('W1 (a) an error REPLY kills nothing: the same worker answers the next job (no respawn)', a.ok && a.starts === 1 && a.afterOk, a);

  /* (b) the app's own chem pool, through __LW.chem */
  const b = await g.ev(`const before = await __LW.chem.workerStat();
    const post = Worker.prototype.postMessage; let armed = false, rewrote = 0;
    Worker.prototype.postMessage = function (m, t) { if (armed && m && m.op === 'stat') { rewrote++; m = Object.assign({}, m, { op: 'chem.nope' }); } return post.call(this, m, t); };
    let r;
    try { armed = true; const p = __LW.chem.workerStat(); armed = false; r = await p; } finally { armed = false; Worker.prototype.postMessage = post; }
    const after = await __LW.chem.workerStat();
    return { before: before && { ok: before.ok, solverCalls: before.solverCalls }, rewrote, r, after: after && { ok: after.ok, solverCalls: after.solverCalls }, errs: window.__e.slice() };`);
  judge('W2 (b) __LW.chem\'s api.solve: the unknown op → { error, refused } (null would mean the fallback answered), rewritten once',
    b.rewrote === 1 && b.r && typeof b.r.error === 'string' && b.r.refused === b.r.error && /pick the molecule again/.test(b.r.refused), { rewrote: b.rewrote, r: b.r });
  judge('W2 (b) the app\'s chem worker still answers, its solver count unmoved', b.before && b.before.ok && b.after && b.after.ok && b.after.solverCalls === b.before.solverCalls,
    { before: b.before, after: b.after });
  judge('W3 no page error', b.errs.length === 0, b.errs);
} finally { await g.close(); }
process.exit(done('worker-refusal') ? 1 : 0);
