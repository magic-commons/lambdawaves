/* MIR · core/wakelock.js — THE WAKE LOCK: the screen stays on while the clock plays or something records.
 *
 * Harvested from BASINS (app/wakelock.js, its WAVE-F and WAVE-S laws; app/anim.js's install: the play edge, the
 * visibility re-arm, the dump line).  createWakeLock is BASINS' state machine as it stands: zero imports, every platform
 * dependency injected, so every transition — including the ones that only ever fire on a touch screen — runs under node.
 * installWakeLock is the kit's half: the app's ONE CLOCK holds it, and `hold(reason)` lets a recorder hold it too.
 *
 * THE LAW (BASINS' words, condensed; the iPad dumps of 2026-08-07 convicted every looser form)
 *   · NON-GESTURE CONTEXTS (boot, a visibility resume) ARM ONLY.  They never request, so they can never be refused.
 *   · AN ARMED LISTENER ASKS ONLY INSIDE LIVE ACTIVATION.  It listens for pointerup (touch and pen grant there),
 *     pointerdown (a mouse), keydown (not Escape, not a repeat).  Where the platform can say whether activation is live
 *     (navigator.userActivation.isActive) and says no on a TRUSTED event, it stays armed and spends nothing (`skips`).
 *     A constructed event (isTrusted false: a test rig) is never vetoed.
 *   · ATTEMPTS ARE COUNTED AT THE ASK MOMENT, so every request bills to 'gesture'; boot and resume are tripwires.
 *   · ONLY GESTURE-MOMENT REFUSALS STRIKE; three consecutive strikes stop the asking (Low Power Mode is the known iPad
 *     cause).  A success resets the count.
 *   · ONE REQUEST IN FLIGHT, ONE SENTINEL HELD, a late arrival released on arrival, the request SYNCHRONOUS in the
 *     gesture handler's stack, a refusal while running re-arms until the stop, a platform release re-arms ('resume').
 *
 * createWakeLock(env) → { acquire(opts), release(), disarm(), armIfNeeded(ctx), state() }
 *   env { hasApi(), request() → Promise<sentinel>, isRunning(), isActive?(), target, onAcquire(), onRelease(), onRefuse(name) }
 *
 * installWakeLock({ clock, nav, target, doc }) → { hold(reason) → release(), sync(), state(), line(), destroy() }
 *   clock  the app's one clock { isPlaying(), onChange(fn) → off }: held while it plays (createApp passes its own)
 *   hold(reason)  held until the returned function runs (a recorder: call it inside the RECORD tap, so it is a gesture)
 *   Held only while the page is visible; a resume re-arms and the next touch acquires.  A `wake lock` line goes in every
 *   dump (core/describe.js).  No timers, no polling: it moves only on the clock's change, a hold, and visibility. */
import { registerDumpLines } from './describe.js';

export function createWakeLock(env) {
  let sentinel = null;
  let pending = false;
  let arm = null;              // AbortController while the one-shot listeners live
  let armCtx = null;           // which context planted the live arm
  let denials = 0;             // consecutive GESTURE-moment refusals; three stop the asking
  let state = 'idle';          // idle | armed | pending | held | released | denied | unsupported
  let lastErr = null;          // the last DOMException name, for the dump
  let skips = 0;               // granting-classified events declined — no live activation
  let lastSkip = null;
  const attempts = { gesture: 0, boot: 0, resume: 0 };

  const ctxOf = (o) => {
    if (o && Object.prototype.hasOwnProperty.call(attempts, o.ctx)) return o.ctx;
    return o && o.gesture ? 'gesture' : 'boot';
  };
  /** would this event's request land inside user activation, BY TYPE? */
  const grants = (type, ev) => {
    if (type === 'pointerup') return true;                    // touch/pen grant HERE; mouse rides mousedown's window
    if (type === 'pointerdown') { const pt = ev && ev.pointerType; return pt !== 'touch' && pt !== 'pen'; }
    if (type === 'keydown') return !(ev && (ev.repeat || ev.key === 'Escape' || ev.key === 'Esc'));
    return false;
  };
  /** the activation veto: the type says "granting", the platform says "no activation is live" (trusted events only) */
  const activationVeto = (ev) => {
    if (typeof env.isActive !== 'function') return false;
    if (ev && ev.isTrusted === false) return false;
    let a; try { a = env.isActive(); } catch (_) { a = undefined; }
    return a === false;
  };

  function doArm(ctx) {
    if (sentinel || denials >= 3) return;
    if (arm) { armCtx = ctx; return; }
    if (!env.hasApi()) { state = 'unsupported'; return; }
    state = 'armed'; armCtx = ctx;
    arm = new AbortController();
    const o = { capture: true, passive: true, signal: arm.signal };
    const fire = (type) => (ev) => {
      if (!grants(type, ev)) return;                          // stay armed; the granting half is coming
      if (activationVeto(ev)) { skips++; lastSkip = type; return; }
      const planted = armCtx;
      disarm();
      if (env.isRunning()) acquire({ gesture: true, ctx: 'gesture', planter: planted });
    };
    env.target.addEventListener('pointerdown', fire('pointerdown'), o);
    env.target.addEventListener('pointerup', fire('pointerup'), o);
    env.target.addEventListener('keydown', fire('keydown'), o);
  }
  function disarm() { if (!arm) return; try { arm.abort(); } catch (_) {} arm = null; }

  function acquire(opts) {
    if (!env.hasApi()) { state = 'unsupported'; return; }
    if (!env.isRunning()) return;
    const ctx = ctxOf(opts);
    if (!(opts && opts.gesture)) { doArm(ctx); return; }      // no activation to stand in: arm, never spend a refusal
    disarm();
    if (denials >= 3) { state = 'denied'; return; }
    if (sentinel || pending) return;
    const planter = (opts && opts.planter) || ctx;
    pending = true; state = 'pending'; attempts[ctx]++;
    /* THE REQUEST IS THIS EXPRESSION, synchronous in the caller's stack: nothing hops a task before the platform call */
    let p; try { p = env.request(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then((s) => {
      pending = false;
      if (!env.isRunning() || sentinel) {
        try { const r = s.release(); if (r && r.catch) r.catch(() => {}); } catch (_) {}
        if (!sentinel && state === 'pending') state = 'released';
        return;
      }
      sentinel = s; state = 'held'; denials = 0; lastErr = null;
      env.onAcquire();
      try {
        s.addEventListener('release', () => {
          if (sentinel !== s) return;
          sentinel = null;
          if (state === 'held') state = 'released';
          if (env.isRunning()) doArm('resume');            // the platform let go; the next touch asks again
        });
      } catch (_) {}
    }).catch((e) => {
      pending = false;
      lastErr = (e && e.name) ? String(e.name) : String(e);
      env.onRefuse(lastErr);
      if (ctx === 'gesture') denials++;                     // only a gesture-moment refusal is a strike
      if (denials >= 3) { state = 'denied'; return; }
      if (env.isRunning()) doArm(planter); else state = 'released';
    });
  }

  function release() {
    disarm();
    const s = sentinel; sentinel = null;
    if (!s) { if (state === 'held' || state === 'pending' || state === 'armed') state = 'released'; return; }
    env.onRelease();
    state = 'released';
    try { const r = s.release(); if (r && r.catch) r.catch(() => {}); } catch (_) {}
  }

  return {
    acquire, release, disarm,
    /** visibilitychange's half: arm if running and nothing is held */
    armIfNeeded(ctx) { if (env.isRunning() && !sentinel) doArm(ctx || 'resume'); },
    state() {
      return { state, held: sentinel !== null, armed: arm !== null, pending, denials, lastErr, armCtx, skips, lastSkip, attempts: { ...attempts } };
    },
  };
}

/** wakeLine(state, stat) → the dump's line, BASINS' words (debug.js 'wakeLock') */
export function wakeLine(w, stat) {
  return 'wakeLock    ' + w.state + (w.held ? '  (sentinel held)' : '') +
    (w.armed ? '  (ARMED: waiting for a granting gesture' + (w.armCtx ? ', planted by ' + w.armCtx : '') + ')' : '') +
    '   acquired ' + stat.acquires + ', released ' + stat.releases + ', refused ' + stat.refusals +
    '   asked by context: gesture ' + w.attempts.gesture + ' / boot ' + w.attempts.boot + ' / resume ' + w.attempts.resume +
    (w.skips ? '   skipped (no activation live): ' + w.skips + (w.lastSkip ? ' (last ' + w.lastSkip + ')' : '') : '') +
    (w.lastErr ? '   last: ' + w.lastErr : '') + (stat.holds ? '   held for: ' + stat.holds : '');
}

export function installWakeLock({ clock = null, nav = globalThis.navigator, target = globalThis.window, doc = globalThis.document } = {}) {
  const holds = new Map();                                    // token → reason
  const stat = { acquires: 0, releases: 0, refusals: 0, holds: '' };
  const playing = () => { try { return !!(clock && clock.isPlaying && clock.isPlaying()); } catch (_) { return false; } };
  const visible = () => !doc || doc.visibilityState !== 'hidden';
  const running = () => (playing() || holds.size > 0) && visible();
  const active = () => { try { const ua = nav && nav.userActivation; return ua ? !!ua.isActive : undefined; } catch (_) { return undefined; } };
  const wake = createWakeLock({
    hasApi: () => !!nav && 'wakeLock' in nav,
    request: () => nav.wakeLock.request('screen'),
    isActive: active,
    isRunning: running,
    target,
    onAcquire: () => { stat.acquires++; },
    onRelease: () => { stat.releases++; },
    onRefuse: () => { stat.refusals++; },
  });
  /* a change that happens inside a tap or a key (the bar's ▶, Space, a RECORD press) carries activation: ask now;
     anything else (a restored play, a timer) only arms, and the next touch asks */
  function sync() {
    if (running()) wake.acquire(active() === true ? { gesture: true, ctx: 'gesture' } : { ctx: 'boot' });
    else wake.release();
  }
  const life = new AbortController();
  const off = clock && typeof clock.onChange === 'function' ? clock.onChange(sync) : null;
  if (doc && doc.addEventListener) doc.addEventListener('visibilitychange', () => { if (!visible()) return; wake.armIfNeeded('resume'); }, { signal: life.signal });
  const line = () => wakeLine(wake.state(), { ...stat, holds: [...new Set(holds.values())].join(', ') });
  const offDump = registerDumpLines('wakelock', () => [line()]);
  if (running()) sync();
  return {
    /** hold(reason) → release(): the screen stays on until release() runs (a recorder holds it for its take) */
    hold(reason = 'hold') {
      const token = {}; holds.set(token, String(reason)); sync();
      return () => { if (!holds.delete(token)) return false; sync(); return true; };
    },
    sync, line,
    state: () => ({ ...wake.state(), acquires: stat.acquires, releases: stat.releases, refusals: stat.refusals, holds: [...holds.values()] }),
    destroy() { life.abort(); if (typeof off === 'function') off(); offDump(); holds.clear(); wake.release(); },
  };
}
