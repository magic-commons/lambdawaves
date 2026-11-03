/* worker-pool.js — THE MATHS WORKERS (wave 45 onward): four FIFO module workers over lab/mathworker.js — `bow` (interaction),
 * `period` (the recurrence scan), `cards` (user-requested card preparation) and `chem` (its own 300 s ceiling) — each
 * built on first use, parked/resumed with the page, busy-wrapped, the first three timing out to the frame thread's road
 * and `chem` refusing once it has answered (0.5.4 P6); and the two card roads (solveCard, solveChem).  A seam out of rack.js boot() (optimization
 * 2026-09-24 · N7 seam 3, AUDIT-E §6), two closure edges handed in: `busyWrap` (every worker job is a BUSY job) and
 * `spawn` (the one `new Worker(...)`, which stays literal in rack.js — tests/wiring.test.mjs finds the worker root
 * there, and pwa.test / build-deploy check rack.js still names ./mathworker.js).  createWorkerPool() runs where the
 * block stood; no worker is constructed until a job asks (ensure()). */
export function createWorkerPool({ busyWrap, spawn }) {
  /* ── THE MATHS WORKER (wave 45): the bow's slap, the BOX packet and the transport's period scan run off the frame.
     Every op is the same pure function this thread would call (mathworker.js imports the same modules), so an answer
     is bit-identical to the synchronous road; a worker that fails to load, errors or times out (8 s) hands the call
     back to that road (`chem` only until its first reply, below).  The SLAP trigger, the K key, LAUNCH and every forced period reader stay synchronous. ── */
  const makeWorker = (label, timeoutMs = 8000, lives = 0) => {   // `lives`: respawns allowed after a failure, once it has ANSWERED (chem: 1)
    let w = null, seq = 0, failed = typeof Worker !== 'function', wantedParked = false, starts = 0, answered = false; const refuses = lives > 0, waiting = new Map();
    /* LA6 · A TIMED-OUT JOB IS STILL RUNNING.  The worker is FIFO and cannot drop a job, so a caller that must know when
       the WORKER is free again (the period scan's one-in-flight law) passes `onLate`: the real reply, or the failure, is
       handed to it after the promise has already resolved { error: 'timeout' }.  Callers that pass nothing are untouched. */
    const late = new Map();
    const fail = (why) => { for (const p of waiting.values()) { clearTimeout(p.timer); p.res({ error: why }); } waiting.clear(); for (const f of late.values()) f({ error: why }); late.clear(); if (w) { try { w.terminate(); } catch (_) {} } w = null; failed = !answered || lives-- <= 0; console.warn('λWAVES ' + label + ' worker: ' + why + (!failed ? ' — respawned for the next job; the job it held is refused, never re-posted' : answered && refuses ? ' — every chem job is refused from now on' : ' — that maths runs on the frame thread')); };
    /* Constructing a module worker fetches and parses its whole private module graph. Three identical workers used
       to do that at the ready boundary even when the session never bowed, scanned or opened a heavy card. */
    const ensure = () => {
      if (w || failed) return w;
      try {
        w = spawn(); starts++;                                          // rack.js hands the constructor in (N7): the literal `new Worker(new URL('./mathworker.js', …))` stays in rack.js for wiring and the pwa/deploy needles
        w.onmessage = (e) => { answered = true; const p = waiting.get(e.data.id); if (p) { waiting.delete(e.data.id); clearTimeout(p.timer); p.res(e.data); } else if (late.has(e.data.id)) { const f = late.get(e.data.id); late.delete(e.data.id); f(e.data); } };
        w.onerror = (e) => fail('worker error: ' + (e && e.message || e));
        /* Message order is FIFO. A worker first requested while the page is away sees PARK before speculative work. */
        if (wantedParked) w.postMessage({ id: 0, op: 'park' });
      } catch (e) { fail('worker construction failed: ' + (e && e.message || e)); }
      return w;
    };
    const raw = (msg, transfer, onLate) => { const worker = ensure(); if (!worker) return Promise.resolve(null); return new Promise((res) => { const id = ++seq; const timer = setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); if (onLate) late.set(id, onLate); res({ error: 'timeout' }); } }, timeoutMs); waiting.set(id, { res, timer }); try { worker.postMessage(Object.assign({ id }, msg), transfer || []); } catch (err) { clearTimeout(timer); waiting.delete(id); res({ error: String(err && err.message || err) }); } }); };
    const call = (msg, transfer, onLate) => busyWrap(raw(msg, transfer, onLate));   // wave 48: every worker job is a BUSY job
    /* WAVE 54 · PARKING is bookkeeping, not a job: it never raises the busy mark and it is never counted as work */
    const idleStat = () => ({ parked: wantedParked, busyMs: 0, jobs: 0, parks: 0, resumes: 0, held: 0, parkedMs: 0, idle: true });
    /* 034 F5 · ESC'S EMERGENCY STOP: every job in flight answers { error: 'stopped' } at once (its busy mark drops with it) and the worker is
       ended; the next job builds a fresh one (ensure).  Unlike fail() it spends no life and refuses nothing; an idle worker is left alone */
    const reset = () => {
      if (!w || (!waiting.size && !late.size)) return false;
      for (const p of waiting.values()) { clearTimeout(p.timer); p.res({ error: 'stopped' }); } waiting.clear();
      for (const f of late.values()) f({ error: 'stopped' }); late.clear();
      try { w.terminate(); } catch (_) {} w = null; return true;
    };
    return { label, get ok() { return !failed; }, get answered() { return answered; }, get started() { return !!w; }, get starts() { return starts; }, call, raw, reset,
      park: () => { wantedParked = true; return w ? raw({ op: 'park' }) : Promise.resolve(idleStat()); },
      resume: () => { wantedParked = false; return w ? raw({ op: 'resume' }) : Promise.resolve(idleStat()); },
      stat: () => w ? raw({ op: 'stat' }) : Promise.resolve(idleStat()) };
  };
  const maths = makeWorker('bow'), scan = makeWorker('period'), cards = makeWorker('cards');   // separate queues: interaction, recurrence, and user-requested card preparation cannot block each other
  /* CHEMISTRY gets a FOURTH queue and its own ceiling, for two reasons that are both measured rather than
     aesthetic.  (1) The longest live solve is seconds (C₁₀H₈ 17.5 s in node, COST anchors in lab/molecules.js; it was benzene's
     36 s when this was written) — the 8 s cap would refuse a solve that is merely slow, and the frame thread must never take one.
     (2) The real-time record (P, P(t−h), the trace) lives in ONE worker instance, so chem.rt.init and every
     chem.rt.run after it must reach the same worker; sharing `cards` would also let a long solve block H₂'s curve. */
  const chemW = makeWorker('chem', 300000, 1);
  const local = (fallback) => busyWrap(new Promise((resolve, reject) => requestAnimationFrame(() => setTimeout(() => { try { resolve(fallback()); } catch (e) { reject(e); } }, 0))));
  const solveCard = (msg, fallback, pluck = (r) => r.result) => {
    if (!cards.ok) return local(fallback);
    return cards.call(msg).then((r) => r && !r.error ? pluck(r) : local(fallback));
  };
  /** THE CHEM ROAD (0.5.4 P6 · R4): the frame thread's fallback ONLY while the chem worker has never answered (no module worker in this
      browser, a construction throw, an error or a timeout before any reply — its only road).  After a reply an error or a timeout is
      REFUSED, never re-run here, with both keys so every caller prints it unedited (`r.error`, `r.refused`); a respawned worker holds no
      solve, RT or drive state, so the sentence asks for the molecule again.  No worker-side cancel: the caller's `solveSeq` drops a stale reply. */
  const refuse = (r) => { const why = `refused (${(r && r.error) || 'no chemistry worker'}): not re-run on the frame thread — pick the molecule again (a fresh worker holds no solve)`; return { error: why, refused: why }; };
  const solveChem = (msg, fallback, pluck = (r) => r.result) => {
    if (!chemW.ok && !chemW.answered) return local(fallback);
    return chemW.call(msg).then((r) => r && !r.error ? pluck(r) : chemW.answered ? refuse(r) : local(fallback));
  };
  solveChem.reset = chemW.reset;   // 034 F5: ESC's stop reaches the chem worker through the road the card already holds (app.ctl stays its shape)
  return { makeWorker, maths, scan, cards, chemW, solveCard, solveChem };
}
