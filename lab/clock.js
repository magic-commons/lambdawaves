/* clock.js — ONE logical time, and nothing else.
 *
 * Logical time t is in atomic units.  The clock converts wall-clock intervals into logical
 * intervals at `rate` (a.u. per wall second) ONLY while playing, and only for intervals it
 * was watching: resume re-anchors the wall reference, so there is never a giant first step,
 * and a single wall interval is capped (MAX_WALL_STEP) so a background tab cannot lurch.
 * Scrub and step set/advance t directly.  Wall scheduling (which frame runs when) lives in
 * the scheduler in rack.js — the renderer never owns physical time (§12, §25).
 */
export const MAX_WALL_STEP = 0.1;   // seconds

export class Clock {
  constructor() {
    this.t = 0;              // logical time, a.u.
    this.rate = 4;           // a.u. per wall second
    this.playing = false;
    this.window = 2 * Math.PI; // the scrub window (a natural period), a.u.; presentation only
    this._wall = null;       // last wall time we accounted for (seconds)
    this.steps = 0;          // physics steps taken (diagnostics)
    this.lastDt = 0;
  }
  play(nowSec) { if (!this.playing) { this.playing = true; this._wall = nowSec; } }
  pause() { this.playing = false; this._wall = null; }
  toggle(nowSec) { if (this.playing) this.pause(); else this.play(nowSec); }
  /** advance by the wall interval since the last advance (0 when paused) → dt in a.u. */
  advance(nowSec) {
    if (!this.playing) return 0;
    if (this._wall === null) { this._wall = nowSec; return 0; }
    let dw = nowSec - this._wall;
    if (dw < 0) dw = 0;
    if (dw > MAX_WALL_STEP) dw = MAX_WALL_STEP;
    this._wall = nowSec;
    const dt = this.rate * dw;
    this.t += dt; this.steps++; this.lastDt = dt;
    return dt;
  }
  step(dt) { this.t += dt; this.steps++; this.lastDt = dt; }
  scrub(t) { this.t = t; this.lastDt = 0; }
  reset() { this.t = 0; this.lastDt = 0; }
  setRate(r) { this.rate = Math.max(1e-6, r); }
}
