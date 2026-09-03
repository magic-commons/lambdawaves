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
 */
import { bohmStep, bohmVelocity, psiAndGrad } from './dynamics.js';
import { cameraBasis } from './field.js';

export function createParticles(canvas, api) {
  const g = canvas.getContext('2d');
  let pts = [], trails = [], lastT = null, on = false, trailLen = 24, speedCap = 4;
  const state = { count: 0, alive: 0, stalled: 0, maxSpeed: 0, seededAt: null };

  function psi2(re, im, ids, x, y, z) { const s = psiAndGrad(re, im, ids, x, y, z); return s ? s.re * s.re + s.im * s.im : 0; }
  /** seed n particles by rejection sampling from |ψ|² — the equilibrium distribution */
  function seed(n, reg, t, half) {
    const c = reg.at(t), ids = reg.renderSet().ids;
    if (!ids.length) { pts = []; trails = []; return 0; }
    let peak = 0;
    for (let k = 0; k < 4000; k++) {
      const x = (Math.random() * 2 - 1) * half, y = (Math.random() * 2 - 1) * half, z = (Math.random() * 2 - 1) * half;
      peak = Math.max(peak, psi2(c.re, c.im, ids, x, y, z));
    }
    pts = []; trails = [];
    let tries = 0;
    while (pts.length < n && tries < n * 4000) {
      tries++;
      const x = (Math.random() * 2 - 1) * half, y = (Math.random() * 2 - 1) * half, z = (Math.random() * 2 - 1) * half;
      if (Math.hypot(x, y, z) < 1e-3) continue;
      if (psi2(c.re, c.im, ids, x, y, z) > Math.random() * peak) { pts.push([x, y, z]); trails.push([]); }
    }
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
    const coeffsAt = (u) => reg.at(u);
    const sub = Math.min(24, Math.max(1, Math.ceil(Math.abs(dt) / 0.05)));
    const h = dt / sub;
    let alive = 0, stalled = 0, vmax = 0;
    for (let i = 0; i < pts.length; i++) {
      let p = pts[i], ok = true;
      for (let s = 0; s < sub; s++) {
        const q = bohmStep(coeffsAt, ids, p, lastT + s * h, h, speedCap);
        if (!q || !isFinite(q[0]) || !isFinite(q[1]) || !isFinite(q[2]) || Math.hypot(q[0], q[1], q[2]) > half * 1.6) { ok = false; break; }
        p = q;
      }
      if (ok) {
        const b = bohmVelocity(reg.at(t).re, reg.at(t).im, ids, p[0], p[1], p[2]);
        if (b) vmax = Math.max(vmax, Math.hypot(...b.v));
        pts[i] = p; alive++;
        const tr = trails[i]; tr.push(p.slice()); if (tr.length > trailLen) tr.shift();
      } else stalled++;
    }
    state.alive = alive; state.stalled = stalled; state.maxSpeed = vmax;
    lastT = t;
  }
  function project(p, B, cam, tanH, aspect, W, H) {
    const dx = p[0] - cam[0], dy = p[1] - cam[1], dz = p[2] - cam[2];
    const depth = dx * B.fwd[0] + dy * B.fwd[1] + dz * B.fwd[2];
    if (depth <= 0) return null;
    const u = (dx * B.right[0] + dy * B.right[1] + dz * B.right[2]) / (depth * tanH * aspect);
    const v = (dx * B.up[0] + dy * B.up[1] + dz * B.up[2]) / (depth * tanH);
    return [(u + 1) / 2 * W, (1 - v) / 2 * H, depth];
  }
  function draw(obs, half) {
    const W = canvas.clientWidth, H = canvas.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (!on || !pts.length || W < 32 || H < 32) return;
    const B = cameraBasis(obs), D = obs.dist * half, cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H;
    g.lineCap = 'round';
    for (let i = 0; i < pts.length; i++) {
      const tr = trails[i];
      if (tr.length > 1) {
        g.beginPath(); let started = false;
        for (let k = 0; k < tr.length; k++) {
          const s = project(tr[k], B, cam, tanH, aspect, W, H); if (!s) { started = false; continue; }
          if (!started) { g.moveTo(s[0], s[1]); started = true; } else g.lineTo(s[0], s[1]);
        }
        g.strokeStyle = 'rgba(255,226,170,0.28)'; g.lineWidth = 1; g.stroke();
      }
      const s = project(pts[i], B, cam, tanH, aspect, W, H); if (!s) continue;
      const sz = Math.max(1, 2.1 * Math.sqrt(D / s[2]));
      g.fillStyle = 'rgba(255,240,210,0.95)'; g.beginPath(); g.arc(s[0], s[1], sz, 0, 2 * Math.PI); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.font = '9px ui-monospace, monospace'; g.textAlign = 'left';
    g.fillText(`PARTICLES · ${state.alive}/${state.count} on the exact field v = Im(∇ψ/ψ) · seeded from |ψ|²`, 12, H - 88);
  }
  return {
    seed, advance, draw, get state() { return state; },
    setOn(v) { on = v; if (!v) { pts = []; trails = []; lastT = null; state.count = 0; state.alive = 0; } },
    get on() { return on; }, get points() { return pts; },
    setTrail(n) { trailLen = n; }, setCap(v) { speedCap = v; },
    resetClock(t) { lastT = t; }
  };
}
