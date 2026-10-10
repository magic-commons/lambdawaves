/* lab/windows/kepler.js — THE BOW and KEPLER AS A CONTROL SURFACE (0.5.2 R2b; moved verbatim out of lab/rack.js boot()), created where THE BOW stood.  Its
 * verbs are registered on app.w for the cards that read them (SPECTRUM, ORBIT, persist); keyState is read through app.sh; boot() destructures the rest. */
import { TIER } from '../rack.js';
import { VIEW, VIEW_NAMES, cameraBasis, toScreen } from '../field.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, getZ } from '../hamiltonian.js';
import { keplerOrbits } from '../kepler.js'; import { createGas } from '../gas.js'; import { wellPacket } from '../well.js';
import { momentumZ, rotorsToZ } from '../kick.js'; import { applyRotor as rotorOnCopy } from '../frontier.js';
export function createKeplerSurface(app) {
  const { dom, ui, reg, clock, obs, mat } = app, { schedule, canPresent } = app.loop, { camera } = app.host, { wState, wSpec, switchHamiltonian, kepler } = app.w,
    { domain, field, maths, touchState } = app.ctl;
  app.state.bow = null; let bowPrevView = null; app.w.bowStart = bowStart; app.w.bowMove = bowMove; app.w.bowRelease = bowRelease; app.w.bowCancel = bowCancel;
  function bowStart(e) {
    const r = dom.canvas.getBoundingClientRect();
    app.state.bow = { x0: e.clientX - r.left, y0: e.clientY - r.top, x1: e.clientX - r.left, y1: e.clientY - r.top, k: 0, dir: [0, 0, 1] };
    bowPrevView = mat.view; mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase');
    try { if (e.pointerId !== undefined) dom.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    kepler.setBow(app.state.bow); schedule(TIER.PRESENT);
  }
  function bowMove(e) {
    if (!app.state.bow) return;
    const r = dom.canvas.getBoundingClientRect();
    app.state.bow.x1 = e.clientX - r.left; app.state.bow.y1 = e.clientY - r.top;
    const dx = app.state.bow.x1 - app.state.bow.x0, dy = app.state.bow.y1 - app.state.bow.y0;
    app.state.bow.k = Math.min(mat.bow?.limit ?? 3, Math.pow(Math.hypot(dx, dy) / 120, mat.bow?.curve ?? 1) * (mat.bow?.gain ?? 1));                    // 120 px of pull = 1 a.u. of momentum, capped at 3
    const B = cameraBasis(obs);
    const d = [-(dx * B.right[0] - dy * B.up[0]), -(dx * B.right[1] - dy * B.up[1]), -(dx * B.right[2] - dy * B.up[2])];   // a bow: the arrow flies opposite to the pull; screen y points down
    const n = Math.hypot(d[0], d[1], d[2]);
    app.state.bow.dir = n > 0 ? [d[0] / n, d[1] / n, d[2] / n] : [0, 0, 1];
    mat.boost.k = [app.state.bow.dir[0] * app.state.bow.k, app.state.bow.dir[1] * app.state.bow.k, app.state.bow.dir[2] * app.state.bow.k]; mat.boost.on = app.state.bow.k > 0;
    kepler.setBow(app.state.bow); schedule(TIER.PRESENT);
  }
  /* THE BOW LANDS ASYNCHRONOUSLY (wave 45).  The slap (kick.js) or the packet (well.js) is computed in the maths
     worker and lands when it answers — the pointer is free the moment the finger lifts (measured before: 127 ms on
     the first hydrogen bow, 191 ms + a 1.2 s frame on a BOX bow).  bowChain is the queue: two bows in flight land in
     order, on the state the first one left; LW.bow.landed resolves when the queue is empty.  The SLAP trigger, the K
     key and LAUNCH keep the synchronous road. */
  app.state.bowChain = Promise.resolve(); app.state.bowInFlight = 0;
  function bowRelease() {
    if (!app.state.bow) return;
    const k = app.state.bow.k, dir = app.state.bow.dir, x0 = app.state.bow.x0, y0 = app.state.bow.y0; bowCancel();
    if (k <= 0.005) return;
    const job = getHamiltonian().id === 'well' ? () => launchPacketAsync(unproject(x0, y0), dir.map((v) => v * k), gasSigma(k)) : () => slapAlongAsync(k, dir);   // the GAS: a new packet where you pressed
    app.state.bowInFlight++; wState.setStatus('the impulse is in flight…', 'live');
    app.state.bowChain = app.state.bowChain.then(job).catch((e) => { __e.push('BOW ' + (e && e.message || e)); }).then(() => { if (--app.state.bowInFlight === 0) wState.setStatus('changes c'); });
  }
  /** the BOX bow: wellPacket in the worker, the same numbers as launchPacket, landed on the clock's time when it answers */
  async function launchPacketAsync(x0, kvec, sigma) {
    if (app.state.gasAxial || !maths.ok) { launchPacket(x0, kvec, sigma); return; }
    const r = await maths.call({ op: 'packet', x0, k: kvec, sigma, radius: HAMILTONIANS.well.radius });
    if (!r || r.error) { launchPacket(x0, kvec, sigma); return; }
    if (getHamiltonian().id !== 'well' || app.state.gasAxial) return;                             // the box was left while the packet was in flight
    reg.clear(); for (let a = 0; a < 91; a++) if (r.re[a] || r.im[a]) reg.set(a, r.re[a], r.im[a], clock.t);
    app.state.lastLaunch = { x0, k: kvec, sigma, captured: r.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * r.captured).toFixed(1)}% held`, r.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  /** the hydrogen / oscillator bow: the slap on a snapshot of c(t) in the worker, set back at that time on landing —
      exact, the law being time-translation invariant; ATOM and QUARKONIUM (tabulated radials) keep the synchronous road */
  async function slapAlongAsync(k, dir) {
    const H = getHamiltonian();
    if (!maths.ok || !(H.id === 'hydrogen' || H.id === 'qho')) { slapAlong(k, dir); return; }
    if (!reg.populated().length) reg.set(0, 1, 0, clock.t);
    const t0 = clock.t, v0 = reg.version, c = reg.at(t0), n0 = reg.norm2();
    const r = await maths.call({ op: 'kick', re: c.re, im: c.im, k, d: dir, ham: H.id, Z: getZ() }, [c.re.buffer, c.im.buffer]);
    if (!r || r.error) { slapAlong(k, dir); return; }
    if (reg.version !== v0 || getHamiltonian() !== H) { slapAlong(k, dir); return; }     // the state moved under the bow: slap what is there now, synchronously
    reg.setAnchorAt(r.re, r.im, t0);
    const n1 = reg.norm2(), esc = n0 > 0 ? 1 - n1 / n0 : 0;
    if (ui.kickRo) {
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(r.p1 - r.p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`impulse vector: <m>k</m> = ${k.toFixed(3)} along (${dir.map((v) => v.toFixed(2)).join(', ')}) · Ehrenfest would give ${k.toFixed(3)} · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
    }
    touchState();
  }
  /* ── KEPLER AS A CONTROL SURFACE: the perihelion handle drives exact rotors on the state ── */
  function pointerRay(px, py) {                                     // S2: toScreen's inverse, so the lens shift is the overlays' own
    const S = toScreen(obs, domain.half, dom.canvas.clientWidth, dom.canvas.clientHeight);
    return { cam: S.eye, d: S.ray(px, py), B: S.basis, target: S.target };
  }
  function orbitOfShell(n, re, im) {
    const c = re ? { re, im } : (reg.field.Fz !== 0 ? reg.at(clock.t) : { re: reg.re0, im: reg.im0 });
    const o = keplerOrbits(c.re, c.im, 0.01).find((x) => x.orbit.n === n); return o ? o.orbit : null;
  }
  /** a rotor about an arbitrary axis: carry the axis to z with spatial rotors, turn about z, carry it back */
  function rotorSeq(which, axisVec, angle) {
    const seq = rotorsToZ(axisVec), out = [];
    for (const r of seq) out.push({ which: 'both', axis: r.axis, angle: r.angle });
    out.push({ which, axis: 'z', angle });
    for (const r of [...seq].reverse()) out.push({ which: 'both', axis: r.axis, angle: -r.angle });
    return out;
  }
  const applySeq = (seq) => { for (const s of seq) reg.rotor({ ...s, t: clock.t }); };
  /* ══ THE ONE ROAD EVERY KEPLER EDIT TAKES ══════════════════════════════════════════════════════
   * The drag and the knobs are the same two moves, so they are the same two functions.  A Kepler
   * edit has exactly two legs, which is what keplerDragToPoint has always been:
   *   keplerTurn(kind, dθ)  — a ROTATION, about an axis read off the orbit NOW
   *   keplerSeekE(n, eT)    — an ECCENTRICITY, which has no closed form and must be searched
   * The drag hands the first a φ computed from the pointer and the second an eT computed from the
   * pointer's radius; the knobs hand the first their own delta and the second their own number.
   * Neither road caches the orbit, and that is the whole reason the two agree: both read it fresh
   * from reg.re0/im0, so a knob turned after a drag sees what the drag left, and a drag started
   * after a knob sees what the knob left.  Two roads with two reads would drift within one gesture.
   */
  const kepShell = () => (ui.kepShell ? +ui.kepShell.get() : 3);
  /** the axis a kind names, read off a FRESH orbit — or null when the orbit has no such axis */
  function keplerAxis(kind, o) {
    if (kind === 'turn') return [0, 0, 1];                             // world z: native to reg.rotor, no conjugation
    if (kind === 'spin') return o.normal;                              // L̂ — the drag's own first leg
    /* THE NODE LINE: ẑ × L̂, the intersection of the orbit plane with the reference plane.  It
       degenerates exactly when the plane is ALREADY level (L̂ ∥ ẑ), where every in-plane direction
       is a node and the choice is free — so û is taken, which still tips the plane and is the one
       in-plane axis the state itself names. */
    const N = o.normal, nx = -N[1], ny = N[0], nl = Math.hypot(nx, ny);
    return nl > 1e-6 ? [nx / nl, ny / nl, 0] : o.u;
  }
  /** THE ROTATION LEG.  Fresh read, isotropy guard, rotor, convention check, one touchState. */
  function keplerTurn(kind, dth, n = kepShell()) {
    if (!['spin', 'tilt', 'turn'].includes(kind) || !Number.isFinite(dth) || !Number.isInteger(n) || n < 2 || n > 6 || !(Math.abs(dth) > 1e-9)) return false;
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;    // no ⟨L⟩ and no ⟨K⟩: there is no axis, and the dials are already disabled
    const ax = keplerAxis(kind, o); if (!ax) return false;
    applySeq(rotorSeq('both', ax, dth));
    /* THE SAME CHECK THE DRAG MAKES, stated without a target: the rotor convention is checked, not
       assumed.  û is carried by |dθ| about ax, so the achieved turn must have the sign asked for —
       if it went the other way, turn back twice as far.  Skipped for 'turn', whose axis is ẑ and
       whose sign reg.rotateZ has always fixed, and skipped when û lies along the axis (nothing to
       measure).  A projection is used rather than the full angle so a tilt out of the plane, which
       moves û legitimately, is not read as a wrong-way turn. */
    if (kind !== 'turn') {
      const p = orbitOfShell(n);
      if (p && !p.isotropic) {
        const proj = (v) => { const d = v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]; return [v[0] - d * ax[0], v[1] - d * ax[1], v[2] - d * ax[2]]; };
        const a0 = proj(o.u), a1 = proj(p.u), l0 = Math.hypot(...a0), l1 = Math.hypot(...a1);
        if (l0 > 1e-6 && l1 > 1e-6) {
          const c = (a0[0] * a1[0] + a0[1] * a1[1] + a0[2] * a1[2]) / (l0 * l1);
          const s = (ax[0] * (a0[1] * a1[2] - a0[2] * a1[1]) + ax[1] * (a0[2] * a1[0] - a0[0] * a1[2]) + ax[2] * (a0[0] * a1[1] - a0[1] * a1[0])) / (l0 * l1);
          if (Math.atan2(s, c) * dth < 0) applySeq(rotorSeq('both', ax, -2 * dth));
        }
      }
    }
    touchState(); return true;
  }
  /** bring shell n's perihelion to the world point w (in its orbit plane): around by D(R) about L̂, in/out by e^{−iθ â·K} */
  function keplerDragToPoint(n, w) {
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;
    const N = o.normal, wl = Math.hypot(w[0], w[1], w[2]); if (wl < 1e-6) return false;
    const uT = [w[0] / wl, w[1] / wl, w[2] / wl];
    const cr = [o.u[1] * uT[2] - o.u[2] * uT[1], o.u[2] * uT[0] - o.u[0] * uT[2], o.u[0] * uT[1] - o.u[1] * uT[0]];
    const phi = Math.atan2(cr[0] * N[0] + cr[1] * N[1] + cr[2] * N[2], o.u[0] * uT[0] + o.u[1] * uT[1] + o.u[2] * uT[2]);
    if (Math.abs(phi) > 1e-6) {
      /* THE DRAG'S FIRST LEG IS THE SPIN KNOB'S CALL.  It used to carry its own copy of the rotor
         and its own convention check; both now live in keplerTurn, so the two controls cannot
         diverge — a fix to the convention is a fix to both, which is what one entry point buys. */
      keplerTurn('spin', phi, n);
      const chk = orbitOfShell(n);                                     // and the DRAG keeps its own extra check, which keplerTurn cannot make: it has a TARGET, and the target is the better witness
      if (chk && !chk.isotropic && (chk.u[0] * uT[0] + chk.u[1] * uT[1] + chk.u[2] * uT[2]) < Math.cos(Math.abs(phi)) - 1e-3) applySeq(rotorSeq('both', N, -2 * phi));
    }
    const eT = Math.max(0, Math.min(0.96, 1 - wl / o.a));
    const o2 = orbitOfShell(n); if (!o2 || o2.isotropic) { touchState(); return true; }
    const ax = [N[1] * o2.u[2] - N[2] * o2.u[1], N[2] * o2.u[0] - N[0] * o2.u[2], N[0] * o2.u[1] - N[1] * o2.u[0]];   // N × û: in the plane, ⟂ the perihelion
    const c0 = reg.field.Fz !== 0 ? reg.at(clock.t) : { re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) };
    const eAt = (th) => { const re = Float64Array.from(c0.re), im = Float64Array.from(c0.im); for (const s of rotorSeq('K', ax, th)) rotorOnCopy(re, im, s); const q = orbitOfShell(n, re, im); return q && !q.isotropic ? q.e : 0; };
    /* the angle: e(θ) is periodic and bounded (|L|² + |K|² is a shell invariant, so e ≤ √(L²+K²)/n) — scan the whole
       turn for the θ whose e is closest to the target, then refine; an out-of-reach target lands on the shell's maximum */
    let th = 0, best = Math.abs(o2.e - eT);
    for (let i = 1; i <= 64; i++) { const t = -Math.PI + 2 * Math.PI * i / 64, d = Math.abs(eAt(t) - eT); if (d < best - 1e-12) { best = d; th = t; } }
    let step = Math.PI / 64; for (let it = 0; it < 24; it++) { step *= 0.5; for (const t of [th - step, th + step]) { const d = Math.abs(eAt(t) - eT); if (d < best - 1e-12) { best = d; th = t; } } }
    if (Math.abs(th) > 1e-7) applySeq(rotorSeq('K', ax, th));
    const o3 = orbitOfShell(n);                                          // the rotor may have set K along −û: half a turn about L̂ (spatial, exact) puts the perihelion where the pointer is
    if (o3 && !o3.isotropic && o3.e > 1e-3 && (o3.u[0] * uT[0] + o3.u[1] * uT[1] + o3.u[2] * uT[2]) < 0) applySeq(rotorSeq('both', N, Math.PI));
    touchState(); return true;
  }
  function keplerDragTo(n, px, py) {
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;
    const { cam, d } = pointerRay(px, py), N = o.normal;
    const dn = d[0] * N[0] + d[1] * N[1] + d[2] * N[2]; if (Math.abs(dn) < 1e-6) return false;
    const lam = -(cam[0] * N[0] + cam[1] * N[1] + cam[2] * N[2]) / dn; if (lam <= 0) return false;
    return keplerDragToPoint(n, [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]]);
  }
  /* THE ROW SAYS WHY A CONTROL IS DEAD, because a control that stops working without saying so is
     the same defect as one that silently no-ops.  Keyed on reg.version — the key orbit.js,
     keplerview.js, spectrum.js and nine other readers already use — so a still instrument spends a
     single integer compare per frame here and nothing else. */
  let kepRowVer = -1, kepRowTime = NaN;
  function keplerRowSync(force) {
    if (!ui.kepShell || !ui.kepRo) return;
    const time = reg.field.Fz !== 0 ? clock.t : 0;
    if (!force && reg.version === kepRowVer && time === kepRowTime) return;
    kepRowVer = reg.version; kepRowTime = time;
    const lit = new Map(keplerOrbits(reg.field.Fz !== 0 ? reg.at(clock.t).re : reg.re0, reg.field.Fz !== 0 ? reg.at(clock.t).im : reg.im0, 0.01).map((x) => [x.orbit.n, x.orbit]));
    for (const n of [2, 3, 4, 5, 6]) { const b = ui.kepShell.button(String(n)); if (b) b.disabled = !lit.has(n); }
    ui.kepShell.set(ui.kepShell.get());
    const n = kepShell(), o = lit.get(n);
    const dead = !o || o.isotropic;
    for (const k of [ui.kepSpin, ui.kepTilt, ui.kepTurn]) if (k) k.setDisabled(dead);
    if (!o) { ui.kepRo.set(`n${n} not populated`, 'warn'); ui.kepRo.setSub('this shell carries less than 1 % of the norm — nothing to turn'); return; }
    if (o.isotropic) { ui.kepRo.set(`n${n} isotropic`, 'warn'); ui.kepRo.setSub('⟨L⟩ = ⟨K⟩ = 0: no normal, no node line, no perihelion — there is no axis to turn about'); return; }
    const warn = o.coherence < 0.5;
    ui.kepRo.set(`a = ${o.a} a₀ · e = ${o.e.toFixed(3)} · coh ${o.coherence.toFixed(2)}`, warn ? 'warn' : 'ok');
    ui.kepRo.setSub(warn
      ? 'below coherence ½ NO ELLIPSE IS DRAWN (Round 11 A5) — but ⟨L⟩ and ⟨K⟩ are exact and so are the rotors, so the knobs stay live: the refusal is the picture\'s, not the operator\'s'
      : `L̂ = (${o.normal.map((v) => v.toFixed(2)).join(', ')}) · û = (${o.u.map((v) => v.toFixed(2)).join(', ')}) · the rotors turn EVERY populated shell; this shell supplies the axes`);
  }
  app.state.kdrag = null;
  /* the point on the plane through the origin ⟂ the view direction that sits under a screen position */
  function unproject(px, py) {
    const { cam, d, B, target: T } = pointerRay(px, py);              // N6: pointerRay's ray met with the plane through the TARGET
    const lam = ((T[0] - cam[0]) * B.fwd[0] + (T[1] - cam[1]) * B.fwd[1] + (T[2] - cam[2]) * B.fwd[2]) / (d[0] * B.fwd[0] + d[1] * B.fwd[1] + d[2] * B.fwd[2]);
    const p = [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]];
    const a = HAMILTONIANS.well.radius, r = Math.hypot(...p), cap = 0.75 * a;
    return r > cap ? p.map((c) => c * cap / r) : p;                 // keep the launch point well inside the wall
  }
  camera.pointer = { ray: pointerRay, unproject };                  // S2: the pointer maths, for the camera-shift gate (__LW.camera.pointer)
  /* a DESIGN CHOICE, labelled: a harder pull launches a tighter packet (a boost alone never changes a width) */
  app.state.gasWidth = 1.8; app.state.gasAxial = false;
  const gas = createGas(HAMILTONIANS.well.radius);
  app.w.kepShell = kepShell; app.w.keplerRowSync = keplerRowSync; app.w.keplerTurn = keplerTurn; app.w.orbitOfShell = orbitOfShell; app.w.keplerDragToPoint = keplerDragToPoint; app.w.keplerDragTo = keplerDragTo;
  /* K5w (optimization 2026-09-24 · AUDIT-B FB1, AUDIT-F F11, SOL-REVIEW K5, PLAN §9) · SPECTRUM's `⟨z⟩ · σ_z` line.
     gas.stats(t) is 8–17 ms and ran on the frame thread every 6th CPU tick while the gas played — outside tick(), so no
     profile or governor saw it.  Now the maths worker runs the SAME stats() on its own gas (mathworker.js gasStats: its
     tables from the same radius, the page's register copied by the message) and the line is painted when the answer
     lands: the same doubles, the same strings, one round trip later (N1).  One request in flight; a tick that finds one
     leaves only its t, asked when the answer lands.  An answer for another radius or another packet (WELL RADIUS, a new
     LAUNCH, the 91 basis) or for a window that can no longer present is dropped.  `raw`, not `call`: this readout never
     raised the busy mark and must not flash it at 2.5 Hz.  With no worker the old synchronous road runs, as it did. */
  let gasAsk = null, gasNext = null;
  const gasPaint = (s) => ui.gasRo.set(`${(100 * gas.captured).toFixed(1)}% held · ⟨z⟩ ${s.z.toFixed(2)} · σ_z ${s.sz.toFixed(2)}`, gas.captured > 0.85 ? 'ok' : 'warn');
  const gasCurrent = (q) => { const R = gas.register; return !!(canPresent(wSpec) && gas.on && ui.gasRo && R && R.re0 === q.re0 && gas.radius === q.radius); };
  function gasAskWorker(q) {
    gasAsk = q;
    maths.raw(q).then((r) => {
      gasAsk = null;
      if (r && r.stats) { if (gasCurrent(q)) gasPaint(r.stats); }
      else if (!maths.ok && gasCurrent(q)) gasPaint(gas.stats(q.t));             // the worker died under this request: the old road answers it
      const n = gasNext; gasNext = null;
      if (n && gasCurrent(n)) { if (maths.ok) gasAskWorker(n); else gasPaint(gas.stats(n.t)); }
    });
  }
  function gasReadout(t) {
    if (!maths.ok) { gasPaint(gas.stats(t)); return; }
    const R = gas.register, q = { op: 'gas.stats', radius: gas.radius, t, re0: R.re0, im0: R.im0, t0: R.t0 };   // posted, so COPIED — never transferred
    if (gasAsk) gasNext = q; else gasAskWorker(q);
  }
  /* optimization K7 · THE GAS TABLE — THE DEFAULT since W125 (Josh, 2026-09-25); `?gastab=0` / __LW.gasTable(false) opt out.
     Armed at boot, built only once the axial gas holds a packet (gas.js slices it in idle time), uploaded by the field, and
     the records carry their rows only once it is held; the landing repaints a live gas.  While an EXPORT holds the loop the
     upload answers null (not now) and gas.js retries on a later idle slice: a deterministic render never straddles it. */
  const gasTableOn = (on) => gas.setTable(on, (tab) => app.state.exportLocked ? null : !!(field.ok && field.setGasTable && field.setGasTable(tab)), () => { if (gas.on) schedule(TIER.RECONSTRUCT); });
  const gasSigma = (k) => Math.max(0.5, Math.min(3, app.state.gasWidth * (1 - 0.18 * Math.min(k, 3))));
  function launchPacket(x0, kvec, sigma) {
    if (app.state.gasAxial) {                                                      // the AXIAL register: along z, on the axis
      const A = HAMILTONIANS.well.radius, z0 = Math.max(-0.8 * A, Math.min(0.8 * A, x0[2] || -A / 2)), kz = kvec[2] !== 0 ? kvec[2] : Math.hypot(...kvec);
      const G = gas.launch(z0, kz, sigma, clock.t);
      reg.clear(); app.state.refSnapshot = null;
      app.state.lastLaunch = { x0: [0, 0, z0], k: [0, 0, kz], sigma, captured: G.captured, axial: true };
      if (ui.gasRo) { ui.gasRo.set(`${(100 * G.captured).toFixed(1)}% held · axial`, G.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at z = ${z0.toFixed(1)} · k = ${kz.toFixed(2)} along z · ${G.modes} modes (m = 0, l ≤ 15)`); }
      touchState(); return;
    }
    const P = wellPacket(x0, kvec, sigma);
    reg.clear(); for (let a = 0; a < 91; a++) if (P.re[a] || P.im[a]) reg.set(a, P.re[a], P.im[a], clock.t);
    app.state.lastLaunch = { x0, k: kvec, sigma, captured: P.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * P.captured).toFixed(1)}% held`, P.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  app.state.lastLaunch = null;

  function enterBox() {
    const ax = app.sh.keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed && ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
    launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), gasSigma(k));
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  /** the oscillator's exact rigid packet: ground state, slapped */
  function coherentBounce() {
    if (getHamiltonian().id !== 'qho') { setHamiltonian('qho'); switchHamiltonian('qho'); if (ui.hamSeg) ui.hamSeg.set('qho'); }
    const ax = app.sh.keyState.axis, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed && ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
    reg.clear(); reg.set(0, 1, 0, clock.t);            // label 0 = 1s = the oscillator's ground state
    reg.kickAlong(k, d, clock.t);
    app.state.lastLaunch = { x0: [0, 0, 0], k: d.map((v) => v * k), sigma: 1 / Math.SQRT2, captured: reg.norm2(), coherent: true };
    if (ui.gasRo) { ui.gasRo.set(`coherent · |α|² = ${(k * k / 2).toFixed(2)}`, 'ok'); ui.gasRo.setSub(`⟨z⟩ = ${k.toFixed(2)} sin t · rigid · period 2π · ${(100 * reg.norm2()).toFixed(2)}% in N ≤ 10`); }
    touchState();
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  app.w.gas = gas; app.w.gasSigma = gasSigma; app.w.launchPacket = launchPacket; app.w.enterBox = enterBox; app.w.coherentBounce = coherentBounce; app.w.gasTableOn = gasTableOn; app.w.slapAlong = slapAlong;
  function bowCancel() {
    app.state.bow = null; mat.boost.on = false; kepler.setBow(null); app.state.keplerDirty = true;   // one clearing draw of the KEPLER canvas after the arrow
    if (bowPrevView !== null) { mat.view = bowPrevView; if (ui.viewSeg) ui.viewSeg.set(VIEW_NAMES[bowPrevView]); bowPrevView = null; }
    schedule(TIER.PRESENT);
  }
  function pAlongDir(dir) {
    const c = reg.at(clock.t), re = Float64Array.from(c.re), im = Float64Array.from(c.im);
    for (const r of rotorsToZ(dir)) rotorOnCopy(re, im, { which: 'both', axis: r.axis, angle: r.angle });
    return momentumZ(re, im);
  }
  function slapAlong(k, dir) {
    if (!reg.populated().length && getHamiltonian().id !== 'well') { reg.set(0, 1, 0, clock.t); }
    const n0 = reg.norm2(), p0 = pAlongDir(dir);
    reg.kickAlong(k, dir, clock.t);
    const n1 = reg.norm2(), p1 = pAlongDir(dir), esc = n0 > 0 ? 1 - n1 / n0 : 0;
    if (ui.kickRo) {
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`impulse vector: <m>k</m> = ${k.toFixed(3)} along (${dir.map((v) => v.toFixed(2)).join(', ')}) · Ehrenfest would give ${k.toFixed(3)} · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
    }
    touchState();
  }
  window.addEventListener('keyup', (e) => { if (e.key === 'Control' && app.state.bow) bowCancel(); });
  return { bowStart, bowMove, bowRelease, orbitOfShell, kepShell, keplerTurn, keplerDragToPoint, keplerDragTo, keplerRowSync, gas, gasReadout, gasTableOn, launchPacket, enterBox, coherentBounce,
    bowCancel, slapAlong };
}
