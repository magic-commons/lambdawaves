/* camera-law.js — THE CAMERA LAW and the observer's pose: the one first-order law (wave 50), its constants CAM, the camera
 * object, the two modes (TURNTABLE ⇄ FREE, wave 54, and the levelling slerp between them), the one road for a relative
 * turn, the eased key orbit, and the ZOOM / FOV / RESET VIEW roads.  A seam out of rack.js boot() (optimization
 * 2026-09-24 · wave 130 seam 11, AUDIT-E §6).  Five edges, handed in: `obs` (the pose it writes), `ui` (the dials it
 * moves), `present` (schedule(TIER.PRESENT) — the only tier the camera may ask for), `modHand` (a routed ZOOM / FOV
 * turn moves the base) and `resetWall` (the loop's camera clock starts NOW: `lastWall = performance.now() / 1000`, the
 * one write camera.wake() and the key orbit make).  0.3.1 · S1: the MODE is the project's (`obs.mode`, D4 — a pose
 * cannot be read back without it), so the sixth edge, `saveSettings`, is gone.
 * createCameraLaw() runs where the windows begin, before the first control that reads it is built. */
import { quatFromYawPitch, yawPitchFromQuat, turnFree } from './field.js';
import { qmul, qnormalize, slerp } from './rotor4.js';   // wave 54: the FREE camera is ONE unit quaternion, and it uses the lab's own rotor library

/* ── THE CAMERA LAW (wave 50, W-CAMERA) ─────────────────────────────────────────────────────────────────────
 * NEBULA carries four motion modes (AUTO-ROTATE × MOMENTUM) and a fling that fights whichever one is on.  We
 * carry ONE first-order law and one constant.  The camera's angular velocity is an AMBIENT drive plus a
 * RESIDUAL, and only the residual relaxes — at the rate μ = FRICTION (1/s):
 *
 *        ω(t) = ω_amb + d(t),     ḋ = −μ d     ⇒     ω(t) = ω_amb + (ω₀ − ω_amb) e^{−μt}
 *        ω_amb = (AUTO-ROTATE ? SPIN : 0,  0)                    — a yaw drive; PITCH has no ambient
 *
 * so a fling COMPOSES with the ambient spin and relaxes TO it, never against it (NEBULA's N7, "one coalesced
 * strongest request", as a single equation instead of a state machine).  The four booleans become two dials:
 * μ large is "no momentum" (a flick dies inside half a second), μ moderate is momentum, μ = 0 is NO DECAY —
 * the residual never dies and the view spins forever — crossed with the ambient switch, and every combination
 * is reachable and legible.  THE ANGLE IS THE INTEGRAL of ω, not ω·dt: over a frame of dt the exact solution is
 *        Δyaw = ω_amb·dt + d_y (1 − e^{−μ dt})/μ,   Δpitch = d_p (1 − e^{−μ dt})/μ        (→ d·dt as μ → 0)
 * which is why the whole travel of a fling is closed form — with the ambient off it turns through exactly ω₀/μ
 * and stops — and that identity is what the gate judges (B65), not a screenshot.
 * THE CONSTANTS.  μ ∈ [0, 12] /s in steps of 0.05 (so μ = 0 is EXACTLY reachable), DEFAULT CAM.MU_DEF = 1.0 (wave 50
 * shipped 2.5, and the figures that follow are 2.5's): τ = 1/μ = 0.4 s,
 * a hard flick (3 rad/s) coasts ln(ω₀/ω_rest)/μ ≈ 2.8 s and turns through ω₀/μ = 1.2 rad = 69° — two flicks to
 * walk right round the cloud — where μ = 12 gives 0.25 rad = 14° (a nudge) and μ = 1 gives most of a half turn.
 * REST = 0.003 rad/s is half a pixel a second at the drag's own 0.0065 rad/px: below it the residual is set to
 * ZERO, the camera is still, and the loop stops scheduling — idle is zero work (§45).  |ω| is capped at 12 rad/s
 * (two turns a second) so no flick can outrun the picture.  A fling that hits the POLE CLAMP loses its pitch
 * component and keeps its yaw.  THE CAMERA NEVER TOUCHES ψ: it schedules TIER.PRESENT and nothing else, it is
 * not on the undo stack, and reg.version cannot move because of it (§14). */
export const CAM = { MU_MAX: 12, MU_DEF: 1.0, MU_STEP: 0.05, REST: 0.003, MAX: 12, HIST_MS: 80, STALE_MS: 120, SENS: 0.0065, FINE: 0.25, PITCH: 1.52, DIST: [1.2, 8], FOV: [0.25, 1.2], TAP_MS: 320, HOME: { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 },
  GAIN: [0.2, 8], GAIN_DEF: 1, GAIN_STEP: 0.01, FLING: [0, 2], FLING_DEF: 1, FLING_STEP: 0.01 };

export function createCameraLaw({ obs, ui, present, modHand, resetWall }) {
  const camera = {
    autoRotate: false, speed: 0.25, friction: CAM.MU_DEF,
    dragGain: CAM.GAIN_DEF, flingGain: CAM.FLING_DEF,   // wave 58: rad/px = dragGain × CAM.SENS · the release is multiplied by flingGain before the law sees it
    dy: 0, dp: 0,                                    // THE RESIDUAL d = ω − ω_amb (rad/s): the only state the law carries
    t: 0, steps: 0, flings: 0, last: null,           // t: the seconds the law has integrated — the CAMERA clock (§12)
    get ambient() { return this.autoRotate ? this.speed : 0; },
    get wy() { return this.ambient + this.dy; },     // ω_yaw
    get wp() { return this.dp; },                    // ω_pitch
    get omega() { return Math.hypot(this.wy, this.wp); },
    get moving() { return this.ambient !== 0 || this.dy !== 0 || this.dp !== 0; },   // "the law has something to integrate"
    /** hand the camera an angular velocity (rad/s, capped at MAX): what the law relaxes is ω − ω_amb.
     *  FLING scales ω₀ FIRST — how much you get — and μ then decides how fast it goes: at gain 0 there is nothing
     *  to decay and the view stops dead on release (the drag itself is untouched), which no value of μ can do. */
    fling(wy, wp = 0) { const G = this.flingGain; wy *= G; wp *= G;
      const m = Math.hypot(wy, wp), k = m > CAM.MAX ? CAM.MAX / m : 1;
      if (m < CAM.REST) { wy = 0; wp = 0; }                                   // gain 0, and anything under half a pixel a second: REST is REST after the gain, not before
      this.dy = k * wy - this.ambient; this.dp = k * wp; this.flings++; this.last = { wy: this.wy, wp: this.wp, mu: this.friction, gain: G }; this.wake(); return this.omega; },
    stop() { this.dy = 0; this.dp = 0; },
    /** the camera clock starts NOW: the first frame after an idle must not integrate the idle */
    wake() { resetWall(); present(); },
    setFriction(v) { this.friction = Math.max(0, Math.min(CAM.MU_MAX, v)); if (ui.fricK) ui.fricK.set(this.friction); this.wake(); return this.friction; },
    setDragGain(v) { this.dragGain = Math.max(CAM.GAIN[0], Math.min(CAM.GAIN[1], +v || 0)); if (ui.gainK) ui.gainK.set(this.dragGain); return this.dragGain; },
    setFling(v) { this.flingGain = Math.max(CAM.FLING[0], Math.min(CAM.FLING[1], +v)); if (ui.flingK) ui.flingK.set(this.flingGain); return this.flingGain; },
    get radPerPixel() { return this.dragGain * CAM.SENS; },
    setAutoRotate(v) { this.autoRotate = !!v; if (ui.spinSw) ui.spinSw.set(this.autoRotate); this.wake(); return this.autoRotate; },
    setSpeed(v) { this.speed = v; if (ui.spinK) ui.spinK.set(v); this.wake(); return v; },
    setDist(v) { return setDist(v); }, setFov(v) { return setFov(v); }, reset() { resetView(); },
  };
  const camTravel = { yaw: 0, pitch: 0 };     // the turn a drag has APPLIED, in the turntable's units — the FLING reads this in BOTH modes
  const camLevel = { from: null, to: null, t0: 0, ms: 150, yaw: 0, pitch: 0 };   // FREE → TURNTABLE levels the roll over 150 ms; it never snaps
  /** in FREE the two angles are a READOUT of the look direction — kept live so every dial, digest and cache key still moves */
  function syncFreeAngles() {
    const a = yawPitchFromQuat(obs.quat, CAM.PITCH);
    obs.yaw = a.yaw + 2 * Math.PI * Math.round((obs.yaw - a.yaw) / (2 * Math.PI));   // stay on the turn the instrument was already on: a fling must not lose 2π
    obs.pitch = a.pitch;
  }
  /** THE ONE ROAD for a RELATIVE turn of the camera — the drag, the keys, LW.orbit and a modulated angle all come here */
  function orbitBy(dyaw, dpitch) {
    if (obs.mode === 'free') { obs.quat = turnFree(obs.quat, dyaw, dpitch); camTravel.yaw += dyaw; camTravel.pitch += dpitch; syncFreeAngles(); }
    else {
      obs.yaw += dyaw; camTravel.yaw += dyaw;
      const held = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, obs.pitch + dpitch));
      camTravel.pitch += held - obs.pitch; obs.pitch = held;                       // the clamp EATS the travel, so a fling into the pole inherits no phantom pitch
    }
    return camTravel;
  }
  /* Key presses add a small orbit to a time-based easing queue. Repeats accumulate while held;
     a released key finishes its queued travel without leaving a perpetual camera drive. */
  const keyOrbit = { yaw: 0, pitch: 0 };
  const keyOrbitMoving = () => Math.abs(keyOrbit.yaw) + Math.abs(keyOrbit.pitch) > 0;
  function queueKeyOrbit(yaw, pitch) { if (!keyOrbitMoving()) resetWall();
    keyOrbit.yaw += yaw; keyOrbit.pitch += pitch; present(); }
  function stepKeyOrbit(dt) {
    if (!keyOrbitMoving()) return false;
    const k = 1 - Math.exp(-Math.max(0, dt) / 0.065);
    const y = Math.abs(keyOrbit.yaw) < 0.00015 ? keyOrbit.yaw : keyOrbit.yaw * k;
    const p = Math.abs(keyOrbit.pitch) < 0.00015 ? keyOrbit.pitch : keyOrbit.pitch * k;
    keyOrbit.yaw -= y; keyOrbit.pitch -= p;
    if (Math.abs(keyOrbit.yaw) < 0.00015) { orbitBy(keyOrbit.yaw, 0); keyOrbit.yaw = 0; }
    if (Math.abs(keyOrbit.pitch) < 0.00015) { orbitBy(0, keyOrbit.pitch); keyOrbit.pitch = 0; }
    orbitBy(y, p);
    return true;
  }
  /** TURNTABLE ⇄ FREE.  Into FREE is an EXACT conversion and moves no pixel; out of it slerps the roll away. */
  function setCamMode(m, opt) {
    const want = m === 'free' ? 'free' : 'turntable';
    if (ui.camSeg) ui.camSeg.set(want);
    if (want === obs.mode && !camLevel.from) return obs.mode;
    if (want === 'free') { camLevel.from = null; obs.quat = quatFromYawPitch(obs.yaw, obs.pitch); obs.mode = 'free'; }
    else {
      const a = yawPitchFromQuat(obs.quat, CAM.PITCH);
      const yaw = a.yaw + 2 * Math.PI * Math.round((obs.yaw - a.yaw) / (2 * Math.PI));
      const to = quatFromYawPitch(yaw, a.pitch);
      if (opt && opt.now) { obs.mode = 'turntable'; obs.yaw = yaw; obs.pitch = a.pitch; obs.quat = to; camLevel.from = null; }
      else { camLevel.from = obs.quat.slice(); camLevel.to = to; camLevel.yaw = yaw; camLevel.pitch = a.pitch; camLevel.t0 = performance.now(); }
    }
    present();
    return obs.mode;
  }
  /** one step of the levelling slerp — the ONLY thing that writes the pose between the two modes */
  function camLevelStep(nowMs) {
    if (!camLevel.from) return false;
    const u = Math.min(1, (nowMs - camLevel.t0) / camLevel.ms), e = u * u * (3 - 2 * u);
    if (u >= 1) { obs.quat = camLevel.to; obs.mode = 'turntable'; obs.yaw = camLevel.yaw; obs.pitch = camLevel.pitch; camLevel.from = null; }
    else { obs.quat = slerp(camLevel.from, camLevel.to, e); syncFreeAngles(); }
    return true;
  }
  /** ONE tick of the CAMERA clock: the EXACT solution of ḋ = −μd over dt, and the exact INTEGRAL of ω for the pose.
   *  Returns whether the pose moved.  Never called while a finger is on the field — the drag owns the pose then. */
  function cameraStep(dt) {
    if (!(dt > 0)) return false;
    const mu = Math.max(0, camera.friction), wa = camera.ambient;
    let iy, ip;                                                                      // ∫₀^dt d(s) ds — the residual's own travel
    if (mu > 0) { const e = Math.exp(-mu * dt), s = (1 - e) / mu; iy = camera.dy * s; ip = camera.dp * s; camera.dy *= e; camera.dp *= e; }
    else { iy = camera.dy * dt; ip = camera.dp * dt; }                               // μ = 0: no decay at all — the fling spins forever
    if (!wa && Math.hypot(camera.dy, camera.dp) < CAM.REST) { camera.dy = 0; camera.dp = 0; }   // REST: the camera is still, and the loop may stop
    camera.t += dt; camera.steps++;
    if (obs.mode === 'free') {
      const amb = wa * dt;                                                           // the AMBIENT is a WORLD axis: LEFT-multiply
      if (amb) obs.quat = qnormalize(qmul([Math.cos(amb / 2), 0, 0, Math.sin(amb / 2)], obs.quat));
      if (iy || ip) obs.quat = turnFree(obs.quat, iy, ip);                            // the RESIDUAL is screen-relative: RIGHT-multiply, and no clamp anywhere
      if (amb || iy || ip) { syncFreeAngles(); return true; }
      return false;
    }
    const dyaw = wa * dt + iy;
    if (dyaw) obs.yaw += dyaw;
    if (ip) { const want = obs.pitch + ip, held = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, want)); if (held !== want) camera.dp = 0; obs.pitch = held; }   // the pole clamp EATS the pitch fling; the yaw runs on
    return dyaw !== 0 || ip !== 0;
  }
  /* the camera's pose has ONE road each: the ZOOM dial, the wheel, the pinch and the arrow keys all come through
     setDist, so the dial can never lie about where the camera is (and neither can a restored project) */
  function setDist(v) { if (modHand('observer.dist', v)) return obs.dist; obs.dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], v)); if (ui.zoomK) ui.zoomK.set(obs.dist); present(); return obs.dist; }
  function setFov(v) { if (modHand('observer.fov', v)) return obs.fov; obs.fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], v)); if (ui.fovK) ui.fovK.set(obs.fov); present(); return obs.fov; }
  function syncCamUI() { if (ui.zoomK) ui.zoomK.set(obs.dist); if (ui.fovK) ui.fovK.set(obs.fov); if (ui.gainK) ui.gainK.set(camera.dragGain); if (ui.flingK) ui.flingK.set(camera.flingGain); }
  /** RESET VIEW (the trigger, R, a double-click and a double-tap): the shipped pose and the motion with it —
      AUTO-ROTATE is a mode, not a pose, so the ambient drive is left exactly where the switch put it */
  function resetView() { const m = obs.mode; camLevel.from = null; Object.assign(obs, CAM.HOME); obs.mode = m; obs.quat = quatFromYawPitch(CAM.HOME.yaw, CAM.HOME.pitch); camera.stop(); syncCamUI(); present(); }   // wave 54: the pose is the same pose in either mode
  return { camera, camTravel, camLevel, syncFreeAngles, orbitBy, keyOrbitMoving, queueKeyOrbit, stepKeyOrbit, setCamMode,
    camLevelStep, cameraStep, setDist, setFov, syncCamUI, resetView };
}
