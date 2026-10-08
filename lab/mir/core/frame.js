/* core/frame.js — the UI's one frame.
 *
 * THE LAW IT KEEPS: all UI work that touches the page runs in ONE batch per display frame — every read first,
 * then the coalesced jobs, then every write — so a frame forces layout at most once, and IDLE IS ZERO WORK:
 * when the queue is empty no animation frame and no timer is booked.  The renderer already lives by this
 * (BASINS sched.js); the UI had about nine pollers and ten private coalescers beside it (survey F2 §1.4–1.5).
 *
 *   read(fn)            fn(now) in the read phase of the next frame
 *   write(fn)           fn(now) in the write phase
 *   coalesce(key, fn)   one job per key per frame, the LATEST fn wins — the drag pump.  Runs between the phases.
 *   flush(key?)         run pending work now: the whole queue, or one key.  The "final pointer sample before
 *                       commit" law — a release must never lose the last move to a frame that has not come yet.
 *   cancel(key)         drop a pending coalesced job (a cancelled drag must not apply a stale move afterwards)
 *   tick(now)           run the batch from the app's own loop; with drive(kick) set, the frame books no rAF of
 *                       its own and calls kick() to wake that loop instead — one animation frame per display frame.
 *
 * THE 32 ms FLOOR (harvested from BASINS frame-coalescer.js): a busy GPU frame delays rAF, sometimes by hundreds
 * of milliseconds, and a window drag behind it feels glued to the floor.  So every booking also arms a 32 ms
 * timer; whichever fires first runs the batch and disarms the other.  At 60 Hz the timer never wins.
 * Jobs queued while a batch runs go to the next frame, so a write that queues a read cannot spin.
 */
import { count as perfCount } from './perf.js';

export function createFrame({
  raf = globalThis.requestAnimationFrame ? (f) => globalThis.requestAnimationFrame(f) : null,
  caf = globalThis.cancelAnimationFrame ? (h) => globalThis.cancelAnimationFrame(h) : () => {},
  setTimer = (f, ms) => setTimeout(f, ms), clearTimer = (h) => clearTimeout(h),
  now = () => (globalThis.performance ? performance.now() : Date.now()),
  floor = 32, count = perfCount,
} = {}) {
  let reads = [], writes = [], jobs = new Map();
  let rafId = 0, timerId = 0, kick = null, kicked = false;
  const pending = () => reads.length + writes.length + jobs.size;

  const disarm = () => {
    if (rafId) { caf(rafId); rafId = 0; }
    if (timerId) { clearTimer(timerId); timerId = 0; }
  };
  const book = () => {
    if (kick) { if (!kicked) { kicked = true; kick(); } }          // the app's loop owns the frame
    else if (!rafId && raf) rafId = raf((t) => { rafId = 0; run(t); });
    if (!timerId && floor > 0) timerId = setTimer(() => { timerId = 0; if (pending()) { count('timers'); run(now()); } }, floor);
  };
  const call = (fn, t) => { try { fn(t); } catch (e) { (globalThis.reportError || console.error)(e); } };

  function run(t = now()) {
    disarm(); kicked = false;
    if (!pending()) return 0;
    const r = reads, j = jobs, w = writes;
    reads = []; jobs = new Map(); writes = [];
    for (const fn of r) call(fn, t);
    for (const fn of j.values()) call(fn, t);
    for (const fn of w) call(fn, t);
    count('frames');
    if (pending()) book();                                          // work queued during the batch: next frame
    return r.length + j.size + w.length;
  }

  return {
    read(fn) { reads.push(fn); book(); },
    write(fn) { writes.push(fn); book(); },
    coalesce(key, fn) { jobs.delete(key); jobs.set(key, fn); book(); },
    cancel(key) { jobs.delete(key); if (!pending()) { disarm(); kicked = false; } },
    flush(key) {
      if (key === undefined) return run(now());
      const fn = jobs.get(key); if (!fn) return 0;
      jobs.delete(key); call(fn, now());
      if (!pending()) { disarm(); kicked = false; }
      return 1;
    },
    tick(t) { return run(t === undefined ? now() : t); },
    /** drive(kick) — the app's loop drives the frame; drive(null) gives the frame its own rAF back */
    drive(fn) {
      kick = typeof fn === 'function' ? fn : null; kicked = false;
      if (rafId) { caf(rafId); rafId = 0; }
      if (pending()) book();
    },
    /** state() — what a gate asks: is anything queued, is anything booked */
    state() { return { pending: pending(), scheduled: !!(rafId || timerId || kicked), raf: !!rafId, timer: !!timerId, driven: !!kick }; },
  };
}

/** the page's one frame */
export const frame = createFrame();
