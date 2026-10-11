/* tests/clock.test.mjs — THE CLOCK'S HORIZON (0.5.4 P7b · R9 PHASECLOCK deferred): `T_MAX` is DECLARED in lab/clock.js and
 * nothing clamps, refuses or branches on it.  Logical time is ONE f64, so past t = T_MAX·dt a step t += dt is lost to rounding
 * (round-to-nearest-even; T_MAX = 2⁵³, the significand's reach).  Shown on bare doubles and on the shipped Clock, for the dt
 * the clock really takes (RATE 4 a.u./s × one 60 Hz frame, × the 0.1 s MAX_WALL_STEP) and for a power of two.
 *   node tests/clock.test.mjs */
import fs from 'node:fs';
import { Clock, MAX_WALL_STEP, T_MAX } from '../lab/clock.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const clock = new Clock(), DTS = [clock.rate / 60, clock.rate * MAX_WALL_STEP, 1 / 3, 2 ** -4];

judge('T_MAX is declared: 2⁵³, the f64 significand\'s reach (Number.MAX_SAFE_INTEGER + 1)', T_MAX === 2 ** 53 && T_MAX === Number.MAX_SAFE_INTEGER + 1, { T_MAX });
const years = T_MAX / 60 / (365.25 * 86400);
judge('the horizon is 2⁵³ frames ≈ 4.7 million years of play at 60 Hz (R9), whatever RATE is', years > 4.7e6 && years < 4.8e6, { years: Math.round(years) });

/* the law on bare doubles: inside the horizon a step registers; at T_MAX·dt it is no longer dt; from 2·T_MAX·dt on it is gone */
const rows = DTS.map((dt) => {
  const inside = [2 ** 10, 2 ** 30, T_MAX / 4].map((s) => { const t = s * dt; return (t + dt) - t; });
  const at = T_MAX * dt, beyond = [2, 3, 1e3, 1e6].map((s) => s * T_MAX * dt);
  return { dt, inside, stepAt: (at + dt) - at, lost: beyond.every((t) => t + dt === t) };
});
judge('inside the horizon (t ≤ T_MAX·dt/4) t += dt still advances, by dt to within half of it', rows.every((r) => r.inside.every((d) => d > 0.5 * r.dt && d < 1.5 * r.dt)),
  rows.map((r) => ({ dt: r.dt, steps: r.inside })));
judge('at t = T_MAX·dt the step is no longer dt (rounded to 0 or to one ulp of t)', rows.every((r) => r.stepAt !== r.dt), rows.map((r) => ({ dt: r.dt, step: r.stepAt })));
judge('beyond, from 2·T_MAX·dt on, t + dt === t: the step is LOST', rows.every((r) => r.lost), rows.map((r) => ({ dt: r.dt, lost: r.lost })));

/* the shipped clock: nothing clamps — scrub takes any t, a step past the horizon is counted and lost, advance() the same */
const c = new Clock(), dt = DTS[0];
c.scrub(1e300); const far = c.t;
c.scrub(2 * T_MAX * dt); const t0 = c.t; c.step(dt);
judge('Clock: scrub is never clamped (1e300 stays 1e300), and step(dt) past 2·T_MAX·dt is counted but adds nothing', far === 1e300 && c.t === t0 && c.steps === 1 && c.lastDt === dt,
  { far, t0, t: c.t, steps: c.steps });
const p = new Clock(); p.scrub(4 * T_MAX * p.rate * MAX_WALL_STEP); const t1 = p.t; p.play(0); p.advance(0); const got = p.advance(MAX_WALL_STEP);
judge('Clock: advance() past the horizon returns its dt and t does not move — no refusal, no branch', got === p.rate * MAX_WALL_STEP && p.t === t1 && p.playing,
  { dt: got, t: p.t, t1 });
const src = fs.readFileSync(new URL('../lab/clock.js', import.meta.url), 'utf8'), uses = src.split('\n').filter((l) => /\bT_MAX\b/.test(l));
judge('T_MAX is declared, never read: lab/clock.js names it only in its header and its export (no clamp, no frame-path branch)',
  uses.length >= 2 && uses.every((l) => /^\s*\*|^export const T_MAX = /.test(l)), uses.map((l) => l.trim().slice(0, 80)));

console.log(`\n${TOTAL - FAILED}/${TOTAL} GREEN — THE CLOCK'S HORIZON`);
if (FAILED) process.exit(1);
