/* render/clock.js — THE RECORD CLOCK: the modulation clock stepped by exact frames, and put back as it was.
 *
 * Ported from BASINS app/modulation.js `deterministicClock` (enter / frame / exit) onto the kit's host (modulation/host.js):
 * frame zero is the play edge, every later frame moves musical time by exactly 1/fps through `clock.step()`, GPU or paint
 * wall time only decides when a finished frame can be read.  The same sequence of steps from the same rack gives the same
 * bytes, in a hidden tab as in a visible one (the step applies as though running; the pattern sequencer hears it on the
 * clock's advance notice).  What BASINS' version also did that is its own (the camera rig, its palette, its pattern reset)
 * is the app's: it reads its parameters from the registry after each frame, where the step has applied them.
 *
 *   createRecordClock({ host, hidden? }) → { enter(fps, options), frame(index), exit(), active(), beat(), fps() }
 *     host     the modulation host (installModulation's `mod.host`, or createModHost()): { clock, model, registry, present }
 *     hidden   () → whether the page is hidden now (default document.hidden): handed to the live clock when it is restored
 *
 *   enter(fps, { modulation = true, timeline = true, frozenValues = null })     THE FOUR MODES
 *     modulation  true   ON · FROM FIRST SPACE   the rack replays from beat zero: phases reset, the play edge fired, frame zero
 *                                                is the first paint after Space
 *                 false  OFF · FREEZE THIS LOOK  the routes are bypassed; every parameter holds the value it shows now
 *                                                (or `frozenValues`, { id: value }: a resumed render holds the original look)
 *     timeline    true   ON · FROM BEAT ZERO     the arrangement replays from beat zero through the clock's own automation
 *                 false  OFF · BYPASS AUTOMATION the clips are not read
 *     With both off nothing is stepped: the picture is the frozen look, frame after frame.  With modulation off and the
 *     timeline on, a parameter no clip covers holds its frozen value (BASINS' frozenAutomation).
 *   frame(index) → seconds                steps to frame `index` (indexes only advance; a step is exactly 1/fps), then asks the
 *                                         host to present.  The seek to an offset is a loop of frame(i).
 *   exit()                                restores the whole live runtime in one operation (gates, demand, phases, an active
 *                                         stutter, the automation provider, the clock's wall stamp): no play or pause edge is
 *                                         emitted, so nothing releases a hold or briefly writes a wrong base.
 * It refuses to enter while a scrub owns the realtime pump ("Finish scrubbing before rendering") or another run holds it. */

export function createRecordClock({ host, hidden } = {}) {
  if (!host || !host.clock || !host.model || !host.registry) throw new TypeError('render/clock: createRecordClock needs the modulation host');
  const clock = host.clock, M = host.model, registry = host.registry;
  const isHidden = typeof hidden === 'function' ? hidden : () => (typeof document !== 'undefined' && !!document.hidden);
  let run = null;

  function enter(fps, { modulation = true, timeline = true, frozenValues = null } = {}) {
    if (run) throw new Error('another render already owns the modulation clock');
    if (clock.isRealtimeSuspended()) throw new Error('Finish scrubbing before rendering');
    const rate = Math.max(1, Number(fps) || 30);
    const saved = clock.captureRuntime();
    if (!clock.suspendRealtime()) throw new Error('Finish scrubbing before rendering');
    const liveAutomation = saved.host.automation || null;
    const arrangement = timeline && liveAutomation ? liveAutomation : null;
    const drive = !!modulation || !!arrangement;
    /* the look a render without modulation holds: the value each parameter shows now, or the original run's, as normalised positions */
    let frozen = null;
    if (!modulation) {
      frozen = new Map();
      for (const id of registry.list()) {
        const v = frozenValues && Object.hasOwn(frozenValues, id) ? frozenValues[id] : registry.read(id);
        if (Number.isFinite(Number(v))) frozen.set(id, registry.toNorm(id, Number(v)));
      }
    }
    run = { fps: rate, frame: 0, saved, modulation: !!modulation, drive, frozenValues: frozen, wall: 0 };
    try {
      if (frozen || arrangement !== liveAutomation) {
        /* the provider this render samples: the arrangement (or nothing) over the frozen look; the live one comes back with exit() */
        clock.setAutomation({ value: (id, beat) => {
          const v = arrangement ? arrangement.value(id, beat) : null;
          return Number.isFinite(v) ? v : frozen?.get(id) ?? null;
        } });
      }
      clock.setModulationEnabled(!!modulation);
      if (drive) {
        clock.pause(0);
        M.resetPhases();
        clock.demand('render', true);
        clock.setEnabled(true);
        clock.play(0);
        clock.step(0);            // frame zero is the first paint after Space
        run.wall = clock.wall();
      } else clock.step(0);       // nothing moves: one step puts the frozen look on every target
      if (host.present) host.present('render-enter');
    } catch (e) { exit(); throw e; }
  }

  function frame(index) {
    if (!run) throw new Error('the record clock is not running');
    if (!Number.isSafeInteger(index) || index < run.frame) throw new Error('recording frames must advance in order');
    while (run.frame < index) {
      if (run.drive) {
        /* THE WALL IS THE RUN'S.  The app's own realtime tick (modulation/bind.js) keeps calling advanceTo(stamp) while the clock
           runs, and advanceTo writes the host's wall stamp before it notices the pump is suspended: a wall-synced rack would then
           derive its beat from the page's real time, not from the frames.  When anything moved the wall between two steps, put it
           back (play(at) on a playing clock is exactly that and nothing else) before the next exact step. */
        if (clock.wall() !== run.wall) clock.play(run.wall);
        clock.step(1 / run.fps);
        run.wall = clock.wall();
      }
      run.frame++;
    }
    if (host.present) host.present('render-frame');
    return run.frame / run.fps;
  }

  function exit() {
    if (!run) return;
    const { saved } = run;
    run = null;
    const now = typeof performance !== 'undefined' ? performance.now() / 1000 : 0;
    if (!clock.restoreRuntime(saved, { wall: now, hidden: isHidden() })) throw new Error('The live transport state could not be restored');
    if (host.present) host.present('render-exit');
  }

  return { enter, frame, exit, active: () => !!run, beat: () => M.transport.beats, fps: () => (run ? run.fps : 0), frameIndex: () => (run ? run.frame : -1) };
}
