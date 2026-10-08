/* timeline/controller.js — THE ONE PLAY AND THE SCRUB GATE (harvested from BASINS app/transport-controller.js, 2026-10-02).
 * One musical transport, independent of window placement and modulation's power.  Josh, 2026-10-01: "Timeline will have
 * the true play while Modulation will now have a power button": this is that play, and the scrub that holds the clock.
 *
 *   createTransportController({ mod, onChange, onRefusedPlay, now, scrubLevel, busy }) → { play(on), toggle, seek(beat),
 *     scrub(beat, { snap, alt, shift }), beginning, beginScrub, endScrub({ cancel }), isScrubbing, handBeat, subscribe(fn)
 *     → off, setModulation(on), toggleModulation, state(), dispose }
 *   mod          installModulation's result (mir/modulation/bind.js): its play is the clock's, its arm is the power
 *   scrubLevel() 'live' | 'light' | 'release' — how often a scrub really seeks (BASINS: prefs.scrubLevel); default 'live'
 *   busy()       true while a recorder owns the clock (BASINS: its video and deterministic clocks); a scrub is refused then
 *
 * THE LAWS (BASINS'):
 *   THE HAND LEADS.  Free by default, Shift snaps to the grid, Alt always bypasses it.  The level, read once per gesture,
 *   decides how often the engine actually seeks; handBeat() is always the latest commanded beat, so the playhead follows it.
 *   THE GATE.  beginScrub() takes the realtime pump (host.clock.suspendRealtime): time stands still under the hand while
 *   the transport keeps its play state; endScrub lands the model on the hand's beat at every level (a cancel rewinds to
 *   where the gesture began) and gives the pump back.  No second clock. */
import { snapTimelineBeat } from './geometry.js';

const SCRUB_LEVELS = ['live', 'light', 'release'];
export function createTransportController({ mod, onChange = () => {}, onRefusedPlay = () => {}, now = () => performance.now() / 1000,
  scrubLevel = () => 'live', busy = () => false }) {
  const clock = mod.host.clock;
  let disposed = false, scrub = null;
  const listeners = new Set();
  clock.setExactResume?.(true);
  const changed = (value, reason = 'transport') => { onChange(); for (const fn of listeners) fn(reason); return value; };

  function play(on) {
    if (disposed) return { ok: false, reason: 'disposed' };
    const want = !!on;
    if (want) clock.demand('transport', true);
    let result;
    try { result = mod.play(want); }
    catch (error) { if (!clock.isPlaying()) clock.demand('transport', false); throw error; }
    if (!want || result?.ok === false) clock.demand('transport', false);
    if (result?.ok === false) onRefusedPlay(result);
    return changed(result);
  }

  function seek(beat) { if (disposed) return modelBeat(); return changed(clock.seek(beat), 'seek'); }
  function scrubTo(beat, mods = {}) {
    const b = snapTimelineBeat(beat, mods.shift ? mods.snap : 0, !!mods.alt);
    if (!scrub) return seek(b);
    scrub.hand = b; changed(b, 'scrub');
    if (scrub.level === 'release') return b;
    if (scrub.level === 'light' && (scrub.light = (scrub.light + 1) % 3)) return b;
    return seek(b);
  }
  const modelBeat = () => mod.host.model.transport.beats;
  function beginScrub() {
    if (disposed || scrub || busy()) return false;
    const release = clock.suspendRealtime?.(now());
    if (!release) return false;
    const level = typeof scrubLevel === 'function' ? scrubLevel() : scrubLevel, beat = modelBeat();
    scrub = { release, beat, hand: beat, light: 0, level: SCRUB_LEVELS.includes(level) ? level : 'live' };
    changed(true, 'scrub'); return true;
  }
  /* The model lands on the hand's beat at release, at every SCRUB level (LIGHT/RELEASE may have left it behind); on
     cancel it rewinds to where the gesture began.  Skipped when already there (LIVE's own seek). */
  function endScrub({ cancel = false } = {}) {
    if (!scrub) return false;
    const owned = scrub; scrub = null;
    const target = cancel ? owned.beat : owned.hand;
    try { if (modelBeat() !== target) clock.seek(target); }
    finally { owned.release(now()); }
    return changed(true, 'scrub-end');
  }
  function setModulation(on) { return changed(mod.arm(!!on)); }

  return Object.freeze({
    play,
    toggle: () => play(!clock.isPlaying()),
    seek, scrub: scrubTo,
    beginning: () => seek(0),
    beginScrub, endScrub, isScrubbing: () => scrub !== null,
    /* the hand's beat while a scrub is live; null outside one — playhead.js follows this */
    handBeat: () => scrub ? scrub.hand : null,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setModulation,
    toggleModulation: () => setModulation(!mod.armed()),
    state: () => ({ playing: clock.isPlaying(), running: clock.isRunning(), modulation: mod.armed(), beat: mod.host.model.transport.beats }),
    dispose() { if (disposed) return; endScrub(); play(false); disposed = true; listeners.clear(); }
  });
}
