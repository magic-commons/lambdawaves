/* particles.js — the PARTICLE view: de Broglie–Bohm trajectories of the same ψ, on the same camera.
 *
 * STATUS: EXACT ANALYTIC field, NUMERICAL trajectories.  The velocity v = Im(∇ψ/ψ) is evaluated from closed forms
 * (dynamics.js, the GPU's own polynomial tables differentiated) — never from the grid — and integrated by RK4 in
 * the LOGICAL clock, so the particles stand still when the transport is paused and scrub with it.
 *
 * Particles are seeded by rejection sampling from |ψ|², which is the Bohmian equilibrium distribution: an
 * ensemble that starts as |ψ|² stays |ψ|² forever (equivariance), so the cloud IS the density, drawn one
 * trajectory at a time.  Nothing here is a claim that the atom contains particles; it is the exact velocity field
 * of the same wavefunction, which is a legitimate reading of it and a very good way to SEE the current.
 *
 * MEMORY (wave 45): the trails are ONE Float32Array ring (count × trailLen × 3) with a head per particle, the
 * register is read into three scratch pairs keyed by the substep's time (no Map, no string keys, no fresh arrays),
 * and the canvas is sized only while the view is on — off, it is a 1 × 1 bitmap, not a full-stage one at the DPR.
 */
import { bohmStep, bohmVelocity, psiAndGrad } from './dynamics.js';
import { cameraBasis } from './field.js';

export function createParticles(canvas, api) {
  const g = canvas.getContext('2d');
  let pts = [], lastT = null, on = false, trailLen = 24, speedCap = 4;
  let ring = new Float32Array(3), heads = new Int32Array(1), lens = new Int32Array(1);   // the trails: a ring per particle
  const state = { count: 0, alive: 0, stalled: 0, maxSpeed: 0, seededAt: null };
  /* the register at the substep times: bohmStep asks for c(t), c(t + h/2) (twice) and c(t + h) — three distinct times per step */
  const memo = [0, 1, 2].map(() => ({ u: NaN, re: new Float64Array(91), im: new Float64Array(91) }));
  let memoN = 0, memoReg = null;
  const coeffsAt = (u) => {
    for (let i = 0; i < memoN; i++) if (memo[i].u === u) return memo[i];
    let m; if (memoN < 3) m = memo[memoN++]; else { m = memo[0]; memoN = 1; }
    memoReg.at(u, m.re, m.im); m.u = u; return m;
  };

  function psi2(re, im, ids, x, y, z) { const s = psiAndGrad(re, im, ids, x, y, z); return s ? s.re * s.re + s.im * s.im : 0; }
  function allocTrails() { const n = Math.max(1, pts.length); ring = new Float32Array(n * trailLen * 3); heads = new Int32Array(n); lens = new Int32Array(n); }
  function pushTrail(i, p) { const o = (i * trailLen + heads[i]) * 3; ring[o] = p[0]; ring[o + 1] = p[1]; ring[o + 2] = p[2]; heads[i] = (heads[i] + 1) % trailLen; if (lens[i] < trailLen) lens[i]++; }
  /** the k-th oldest point of particle i's trail (k = 0 … lens[i]−1), into out */
  function trailAt(i, k, out) { const j = ((heads[i] - lens[i] + k) % trailLen + trailLen) % trailLen, o = (i * trailLen + j) * 3; out[0] = ring[o]; out[1] = ring[o + 1]; out[2] = ring[o + 2]; return out; }
  /** seed n particles by rejection sampling from |ψ|² — the equilibrium distribution */
  function seed(n, reg, t, half) {
    const c = reg.at(t), ids = reg.renderSet().ids;
    if (!ids.length) { pts = []; allocTrails(); return 0; }
    let peak = 0;
    for (let k = 0; k < 4000; k++) {
      const x = (Math.random() * 2 - 1) * half, y = (Math.random() * 2 - 1) * half, z = (Math.random() * 2 - 1) * half;
      peak = Math.max(peak, psi2(c.re, c.im, ids, x, y, z));
    }
    pts = [];
    let tries = 0;
    while (pts.length < n && tries < n * 4000) {
      tries++;
      const x = (Math.random() * 2 - 1) * half, y = (Math.random() * 2 - 1) * half, z = (Math.random() * 2 - 1) * half;
      if (Math.hypot(x, y, z) < 1e-3) continue;
      if (psi2(c.re, c.im, ids, x, y, z) > Math.random() * peak) pts.push([x, y, z]);
    }
    allocTrails();
    lastT = t; state.count = pts.length; state.seededAt = t;
    return pts.length;
  }
  /** advance every particle from lastT to t along the exact velocity field (RK4, substepped) */
  function advance(reg, t, half) {
    if (!pts.length) return;
    if (lastT === null) { lastT = t; return; }
    let dt = t - lastT;
    if (dt === 0) return;
    if (Math.abs(dt) > 4) { lastT = t; return; }                 // a big scrub: do not fake a trajectory across it
    const ids = reg.renderSet().ids;
    memoReg = reg; memoN = 0;                                     // the register is evaluated ONCE per substep time, shared by every particle
    const sub = Math.min(24, Math.max(1, Math.ceil(Math.abs(dt) / 0.05)));
    const h = dt / sub, cT = reg.at(t);
    let alive = 0, stalled = 0, vmax = 0;
    for (let i = 0; i < pts.length; i++) {
      let p = pts[i], ok = true;
      for (let s = 0; s < sub; s++) {
        const q = bohmStep(coeffsAt, ids, p, lastT + s * h, h, speedCap);
        if (!q || !isFinite(q[0]) || !isFinite(q[1]) || !isFinite(q[2]) || Math.hypot(q[0], q[1], q[2]) > half * 1.6) { ok = false; break; }
        p = q;
      }
      if (ok) {
        const b = bohmVelocity(cT.re, cT.im, ids, p[0], p[1], p[2]);
        if (b) vmax = Math.max(vmax, Math.hypot(b.v[0], b.v[1], b.v[2]));
        pts[i] = p; alive++;
        pushTrail(i, p);
      } else stalled++;
    }
    state.alive = alive; state.stalled = stalled; state.maxSpeed = vmax;
    lastT = t;
  }
  /* ── A SECOND SOURCE (MOLECULAR WAVES stage 6, FLOW).  The trails, the projection and the drawing below are not
     hydrogen's: they are a tracer view.  A source is { weight(x, y, z), step(p, h, cap) → q | null, speed(p) } with its
     field FROZEN for the frame (a molecule's D(t) is rebuilt once a frame, not per substep).  Tracers are seeded by
     rejection from `weight` — |j| for a molecule, so they sit where the current is — and one that stalls, leaves the
     box or grows old is born again somewhere the current still runs, because a flow pattern moves and an ensemble
     seeded once would drain out of it. */
  let ages = new Int32Array(1);
  function sampleFrom(src, half, peak) {
    for (let tries = 0; tries < 4000; tries++) {
      const x = (Math.random() * 2 - 1) * half, y = (Math.random() * 2 - 1) * half, z = (Math.random() * 2 - 1) * half;
      if (src.weight(x, y, z) > Math.random() * peak) return [x, y, z];
    }
    return null;
  }
  let srcPeak = 0;
  function peakOf(src, half) { let peak = 0; for (let k = 0; k < 3000; k++) peak = Math.max(peak, src.weight((Math.random() * 2 - 1) * half, (Math.random() * 2 - 1) * half, (Math.random() * 2 - 1) * half)); return peak; }
  function seedFrom(src, n, t, half) {
    srcPeak = peakOf(src, half); pts = [];
    if (srcPeak > 0) while (pts.length < n) { const p = sampleFrom(src, half, srcPeak); if (!p) break; pts.push(p); }
    allocTrails(); ages = new Int32Array(Math.max(1, pts.length)); for (let i = 0; i < pts.length; i++) ages[i] = (Math.random() * (src.lifetime || 240)) | 0;
    lastT = t; state.count = pts.length; state.seededAt = t;
    return pts.length;
  }
  function advanceFrom(src, t, half) {
    if (!pts.length) return;
    if (lastT === null) { lastT = t; return; }
    const dt = t - lastT; if (dt === 0) return;
    if (Math.abs(dt) > 4) { lastT = t; return; }
    const sub = Math.min(8, Math.max(1, Math.ceil(Math.abs(dt) / 0.1))), h = dt / sub, life = src.lifetime || 240;
    if ((state.frames = (state.frames || 0) + 1) % 30 === 0) srcPeak = Math.max(0.5 * srcPeak, peakOf(src, half));   // the pattern moves: keep the rejection bound honest
    let alive = 0, stalled = 0, vmax = 0;
    for (let i = 0; i < pts.length; i++) {
      let p = pts[i], ok = ++ages[i] < life;
      for (let s2 = 0; ok && s2 < sub; s2++) { const q = src.step(p, h, speedCap); if (!q || !isFinite(q[0]) || Math.hypot(q[0], q[1], q[2]) > half * 1.5) ok = false; else p = q; }
      if (ok) { pts[i] = p; alive++; vmax = Math.max(vmax, src.speed(p)); if (state.frames % (src.stride || 1) === 0) pushTrail(i, p); }   // a slow current needs a trail that spans seconds, not frames
      else { const q = srcPeak > 0 ? sampleFrom(src, half, srcPeak) : null; if (q) { pts[i] = q; ages[i] = 0; lens[i] = 0; heads[i] = 0; } stalled++; }
    }
    state.alive = alive; state.stalled = stalled; state.maxSpeed = vmax;
    lastT = t;
  }
  function project(p, B, cam, tanH, aspect, W, H, out) {
    const dx = p[0] - cam[0], dy = p[1] - cam[1], dz = p[2] - cam[2];
    const depth = dx * B.fwd[0] + dy * B.fwd[1] + dz * B.fwd[2];
    if (depth <= 0) return false;
    const u = (dx * B.right[0] + dy * B.right[1] + dz * B.right[2]) / (depth * tanH * aspect);
    const v = (dx * B.up[0] + dy * B.up[1] + dz * B.up[2]) / (depth * tanH);
    out[0] = (u + 1) / 2 * W; out[1] = (1 - v) / 2 * H; out[2] = depth;
    return true;
  }
  const P3 = [0, 0, 0], S3 = [0, 0, 0];
  function release() { if (canvas.width !== 1 || canvas.height !== 1) { canvas.width = 1; canvas.height = 1; } }   // off: no full-stage bitmap kept
  function suspend(t) { if (Number.isFinite(t)) lastT = t; release(); }
  function draw(obs, half) {
    if (!on || !pts.length) { release(); return; }
    const W = canvas.clientWidth, H = canvas.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const B = cameraBasis(obs), D = obs.dist * half, cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H;
    g.lineCap = 'round';
    const ink = api && api.ink ? api.ink() : null;
    g.strokeStyle = ink ? ink.trail : 'rgba(255,226,170,0.28)'; g.lineWidth = ink ? 1.3 : 1;
    for (let i = 0; i < pts.length; i++) {
      const n = lens[i];
      if (n > 1) {
        g.beginPath(); let started = false;
        for (let k = 0; k < n; k++) {
          if (!project(trailAt(i, k, P3), B, cam, tanH, aspect, W, H, S3)) { started = false; continue; }
          if (!started) { g.moveTo(S3[0], S3[1]); started = true; } else g.lineTo(S3[0], S3[1]);
        }
        g.stroke();
      }
    }
    g.fillStyle = ink ? ink.dot : 'rgba(255,240,210,0.95)';
    for (let i = 0; i < pts.length; i++) {
      if (!project(pts[i], B, cam, tanH, aspect, W, H, S3)) continue;
      const sz = Math.max(1, 2.1 * Math.sqrt(D / S3[2]));
      g.beginPath(); g.arc(S3[0], S3[1], sz, 0, 2 * Math.PI); g.fill();
    }
    g.fillStyle = ink ? ink.text : 'rgba(255,255,255,0.45)'; g.font = '9px ui-monospace, monospace'; g.textAlign = 'left';
    g.fillText(api && api.caption ? api.caption(state) : `PARTICLES · ${state.alive}/${state.count} on the exact field v = Im(∇ψ/ψ) · seeded from |ψ|²`, 12, H - 88);
  }
  return {
    seed, advance, seedFrom, advanceFrom, draw, suspend, get state() { return state; },
    setOn(v) { on = v; if (!v) { pts = []; allocTrails(); lastT = null; state.count = 0; state.alive = 0; release(); } },
    get on() { return on; }, get points() { return pts; },
    /** the trail of particle i as an array of [x, y, z], oldest first — for the proofs */
    trailOf(i) { const out = []; if (i < 0 || i >= pts.length) return out; for (let k = 0; k < lens[i]; k++) out.push(trailAt(i, k, [0, 0, 0])); return out; },
    get trailLen() { return trailLen; },
    setTrail(n) { trailLen = Math.max(2, n | 0); allocTrails(); }, setCap(v) { speedCap = v; },
    resetClock(t) { lastT = t; }
  };
}
