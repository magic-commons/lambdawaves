/* clock.js — ONE logical time, and nothing else.
 *
 * Logical time t is in atomic units.  The clock converts wall-clock intervals into logical
 * intervals at `rate` (a.u. per wall second) ONLY while playing, and only for intervals it
 * was watching: resume re-anchors the wall reference, so there is never a giant first step,
 * and a single wall interval is capped (MAX_WALL_STEP) so a background tab cannot lurch.
 * Scrub and step set/advance t directly.  Wall scheduling (which frame runs when) lives in
 * the scheduler in rack.js — the renderer never owns physical time (§12, §25).
 * THE LOCKED CLOCK (020 L1): `hz` > 0 is PLAYBACK LOCK — advance() steps exactly rate/hz per call and ignores the wall interval
 * (rack.js calls it once per present, on its 1/hz tick); hz = 0 is the wall clock above, byte for byte.  A missed frame slows time.
 * THE HORIZON, T_MAX (0.5.4 P7b · R9: declared; nothing clamps, refuses or branches on it): t is one f64, so at t = T_MAX·dt a step t += dt is
 * no longer dt and from 2·T_MAX·dt on it is lost — dt is `rate` × the wall interval advance() took (≤ MAX_WALL_STEP) or step(dt)'s own.
 */
export const MAX_WALL_STEP = 0.1;   // seconds
export const T_MAX = 2 ** 53;       // steps: the f64 significand's reach — 2⁵³ frames are ≈ 4.7 million years of play at 60 Hz

export class Clock {
  constructor() {
    this.t = 0;              // logical time, a.u.
    this.rate = 4;           // a.u. per wall second
    this.playing = false;
    this.window = 2 * Math.PI; // the scrub window (a natural period), a.u.; presentation only
    this._wall = null;       // last wall time we accounted for (seconds)
    this.steps = 0;          // physics steps taken (diagnostics)
    this.lastDt = 0;
    this.hz = 0;             // 020 L1: 0 = WALL (the wall interval × rate), > 0 = LOCKED (rate/hz per advance)
    this.onEdge = null;      // THE ONE PLAY's ear (onePlay, below): told of every play and pause edge, from whichever road
  }
  play(nowSec) { if (!this.playing) { this.playing = true; this._wall = nowSec; if (this.onEdge) this.onEdge(true); } }
  pause() { const was = this.playing; this.playing = false; this._wall = null; if (was && this.onEdge) this.onEdge(false); }
  toggle(nowSec) { if (this.playing) this.pause(); else this.play(nowSec); }
  /** advance by the wall interval since the last advance (0 when paused) → dt in a.u. */
  advance(nowSec) {
    if (!this.playing) return 0;
    if (this.hz > 0) { this._wall = nowSec; const dt = this.rate / this.hz; this.t += dt; this.steps++; this.lastDt = dt; return dt; }   // LOCKED: one step, whatever the wall did
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

/** THE ONE PLAY (0.5.0 A6 · R-B1; MIR TRANSPORT.md "the two clocks become one"): `{ play, pause, isPlaying, toggle, onChange,
 *  seek }` over this clock, the `clock` the kit's createTransport takes.  The physics clock IS the play: every road that starts or
 *  stops it (the button, Space, LW.play, A/B, the bow, the slap, a restore, a capture) is an edge, and onChange hears each one at
 *  once — so the modulation follows by holding its app-play demand (mod-port.js `follow`), never by a per-frame poll. */
export function onePlay(clock, now = () => performance.now() / 1000) {
  const subs = new Set();
  clock.onEdge = (on) => { for (const f of subs) f(on); };
  return { play: () => clock.play(now()), pause: () => clock.pause(), toggle: () => clock.toggle(now()), isPlaying: () => clock.playing,
    seek: (t) => clock.scrub(t), onChange: (f) => { subs.add(f); return () => subs.delete(f); } };
}
