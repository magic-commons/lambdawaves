/* lab/shell/transport.js — §12 THE TRANSPORT STRIP (0.5.2 R3b; moved verbatim out of lab/rack.js boot()): λWAVES' own bar, THE PLAY's toggle, THE POWER
 * (setModArm stays a function declaration: the strip calls it before its line, U1) and the loop clock's lock.  createTransport(app) runs at §12's seat;
 * transport, togglePlay, setModArm and barLock are registered on app.sh for KEYS and SETTINGS, and boot() destructures them for the loop and the facade. */
import { TIER } from '../rack.js'; import { el, knob, fader, readout, formula } from '../mir/kit.js'; import { barTempo } from '../mir/modulation/host.js';
import { getHamiltonian, getZ } from '../hamiltonian.js'; import { densityPeriod, densityPeriodExact, fmtPeriod, hydrogenShellPeriod } from '../period.js'; import { BASIS } from '../hydrogen.js'; import { aliasOf, FLASH_HZ } from '../flash-law.js';
export function createTransport(app) {
  const { dom, ui, reg, clock, appPlay, sturm, rates } = app, { schedule } = app.loop, { saveSettings } = app.sh, { occupiedEigen, periodEnergies, shadowView } = app.w;
  const { keep, modHand, rotDriving, saveMod, scan, setKeepFrames, stats } = app.ctl;
  /* ── transport strip (§25) ─────────────────────────────────────────────── */
  const transport = (() => {
    const T = dom.transport;
    /* WAVE 62: the glyph is the drawing, the name is the word.  `play`'s NAME never changes when its
       glyph swaps ▶ ↔ ❚❚ — a control that renames itself is a different control to a screen reader;
       what changes is its `aria-pressed`, which is what "is it playing" actually means. */
    const play = el('button', 'tbtn play', T, '▶'); play.type = 'button'; play.title = 'Play or pause'; play.setAttribute('aria-label', 'play or pause'); play.setAttribute('aria-pressed', 'false');
    const modB = el('button', 'tbtn modb', T, 'MOD'); modB.type = 'button';
    modB.setAttribute('aria-label', 'modulation on or off');
    modB.setAttribute('aria-pressed', 'true');
    modB.title = 'Enable modulation';
    modB.addEventListener('click', () => setModArm(!app.state.modArm));
    ui.modB = modB;
    const SVG_REWIND = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width:13px;height:13px;display:block;margin:auto"><rect x="5" y="5" width="2.6" height="14" rx="1.1"/><polygon points="20 5 20 19 9.5 12 20 5"/></svg>';
    const rst = el('button', 'tbtn transport-home', T); rst.type = 'button'; rst.innerHTML = SVG_REWIND; rst.title = 't → 0  (home)'; rst.setAttribute('aria-label', 'back to t = 0');
    const sm = el('button', 'tbtn transport-step-back', T, '‹'); sm.type = 'button'; sm.title = 'step back  (←)'; sm.setAttribute('aria-label', 'step back');
    const sp = el('button', 'tbtn transport-step-forward', T, '›'); sp.type = 'button'; sp.title = 'step forward  (→)'; sp.setAttribute('aria-label', 'step forward');
    ui.scrub = fader({ label: 'SCRUB  t / window', min: 0, max: 1, value: 0, fmt: (v) => (v * clock.window).toFixed(2) + ' a.u.',
      onInput: (v) => { clock.scrub(v * clock.window + laps() * clock.window); schedule(TIER.EVOLVE); } });
    T.appendChild(ui.scrub.root);
    ui.rateKnob = knob({ label: 'RATE a.u./s', min: 0.1, max: 3000, value: 4, log: true, fmt: (v) => v >= 100 ? v.toFixed(0) : v.toFixed(1), onInput: (v) => { if (modHand('transport.rate', v)) return; clock.setRate(v); } });
    T.appendChild(ui.rateKnob.root);
    const tro = readout({ label: 't  a.u.  (lap)', value: '0.00', cls: 'time' });
    T.appendChild(tro.root);
    /* ── THE CLOCK's law: when does this density repeat?  T = 2π / gcd{|E_a − E_b|} over the populated labels (EXACT where the
       differences are commensurate: hydrogen and its ions, the oscillator; a near-recurrence with its error otherwise) ── */
    ui.periodRo = readout({ label: 'REPEATS every', value: '—', cls: 'period', sub: 'exact period of the density, from the energies in force' });
    T.appendChild(ui.periodRo.root);
    /* WAVE 69 · THE THEOREM, SUBSTITUTED, LIVE.  This is the first of the three places a number was
       given permission to move (see REPORT wave 69).  It earns it because every value on the line is
       EXACT at the instant it is printed: the gcd comes from the same scan the readout above prints,
       and the lap decomposition is arithmetic on the clock.  Nothing is tweened and nothing is
       illustrative — which is the difference between this and animating a number in a video. */
    ui.periodFx = formula({ lines: [
      ['<m>T = 2π / gcd{|ΔE|} = 2π / </m>', { s: 'g' }, '<m> = </m>', { s: 'T' }],
      ['<m>t = </m>', { s: 'lap' }, '<m> · T + </m>', { s: 'ph' }, '<m> · T</m>'] ] });
    T.appendChild(ui.periodFx.root);
    const jmp = el('button', 'tbtn jump', T, '⟳'); jmp.type = 'button'; jmp.title = 'jump to the next exact repeat of the density'; jmp.setAttribute('aria-label', 'jump to the next exact repeat of the density');
    jmp.addEventListener('click', () => { const P = periodNow(true); if (P && P.T > 0) { const t = clock.t, next = t + P.T - (((t % P.T) + P.T) % P.T); clock.scrub(next); shadowView.clearTrail(); schedule(TIER.EVOLVE); } });
    let lastPeriod = null, periodCostMs = 0, periodSettling = false, periodPending = null;
    /* LA6 · ONE SCAN IN FLIGHT, THE LATEST KEY WAITING.  Every new key used to post a fresh O(pairs × 2·10⁶) scan into a
       FIFO worker that cannot drop stale work: 4 s of a moving register (keyboard auto-repeat on ZEEMAN B, a script)
       jammed it for over two minutes (AUDIT-F F3, REFUTE-B/D).  Now one scan runs; a newer key replaces `scanWant`; the
       worker is free again only when ITS reply arrives — a timed-out scan is tracked to that reply (worker-pool.js makeWorker, onLate),
       never to the promise, or a timeout plus a fresh post would put two scans back in the queue (REFUTE-D). */
    let scanBusy = false, scanWant = null;
    function scanPost(key, energies) {
      if (scanBusy) { scanWant = { key, energies }; return; }
      scanBusy = true;
      const done = (r) => {
        scanBusy = false; scanLand(key, r);
        if (scanWant) { const q = scanWant; scanWant = null; if (periodPending && sameKey(periodPending, q.key)) scanPost(periodPending, q.energies); }
      };
      scan.call({ op: 'period', energies, horizon: 2e4 }, undefined, done).then((r) => { if (!(r && r.error === 'timeout')) done(r); });
    }
    function scanLand(key, r) {
      if (!r || r.error) { if (periodPending && sameKey(periodPending, key)) periodPending = null; return; }
      if (!periodPending || !sameKey(periodPending, key)) return;          // a later state: this answer is stale
      const P = Object.assign({}, r); delete P.id; delete P.op;
      lastPeriod = P; Object.assign(pk, key); periodCostMs = 0; periodSettling = false; periodPending = null;
      paintPeriod(); schedule(TIER.PRESENT);                           // paused, no frame would repaint the readout
    }
    /* …and a dial held down by an ARROW KEY is a gesture too (auto-repeat bumps reg.version ~30×/s with no pointer):
       the wave-44 hold-off below reads it beside pointerHeld; a released key lets the settled scan run once. */
    let keyHeld = false;
    document.addEventListener('keydown', (e) => { if (e.repeat && e.target && e.target.closest && e.target.closest('.k, .fd')) keyHeld = true; }, true);
    const keyReleased = () => { if (!keyHeld) return; keyHeld = false; if (periodSettling) schedule(TIER.PRESENT); };
    document.addEventListener('keyup', keyReleased, true); window.addEventListener('blur', keyReleased);
    /* the scan's key, as numbers compared in place (wave 45: it was a string built on every frame) */
    const pk = { v: -2, fz: 0, bz: 0, h: '', mix: false, s: -1 };
    const keyNow = () => ({ v: reg.version, fz: reg.field.Fz, bz: reg.field.Bz, h: getHamiltonian().id, mix: !!reg.transition, s: sturm.P ? sturm.lambda : -1 });
    const sameKey = (a, b) => a.v === b.v && a.fz === b.fz && a.bz === b.bz && a.h === b.h && a.mix === b.mix && a.s === b.s;
    const periodFresh = () => pk.v === reg.version && pk.fz === reg.field.Fz && pk.bz === reg.field.Bz && pk.h === getHamiltonian().id && pk.mix === !!reg.transition && pk.s === (sturm.P ? sturm.lambda : -1);
    /**
     * THE SCAN IS NOT FREE (wave 44).  densityPeriod's near-recurrence scan is O(pairs × 2·10⁶) and it is reached on
     * every NEW register version — which the comment below the readout used to call "cheap, cached on the register's
     * version", true only while a state has one or two beats.  Under STURMIAN a generic λ occupies eleven eigenvalues,
     * fifty-five pairs, and one scan measured 594 ms; the λ knob calls setSturmian on every pointermove, so a drag was
     * a train of 0.6 s stalls (34 frames of 74 over 100 ms, the worst 650).  So a scan that has ALREADY proved
     * expensive is held off while a pointer is down — the same law history.js applies to its commits — and runs once
     * when the gesture ends.  `force` is the road every non-frame reader takes (LW.period, the ⟳ jump, the digest), so
     * no proof and no button ever sees a stale answer: only the per-frame readout waits, and it says that it is.
     */
    function periodNow(force = false) {
      if (periodFresh()) { periodSettling = false; return lastPeriod; }
      /* AND A DRIVEN ROTATION IS A GESTURE TOO.  The guard was `pointerHeld` alone, which a
         hands-off drive does not set: a running rate bumps reg.version on every frame, so
         periodPending got a new key sixty times a second and this posted a fresh O(pairs × 2·10⁶)
         scan to the worker on every one of them, for as long as the rate turned.  Same law, same
         line — an expensive answer waits until the movement stops. */
      if (!force && lastPeriod && periodCostMs > 8 && (app.state.pointerHeld || keyHeld || rotDriving())) { periodSettling = true; return lastPeriod; }
      const key = keyNow();
      if (reg.field.Fz !== 0) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, stark: true, T: 0 }; return lastPeriod; }
      if (reg.transition) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, mix: true, T: 0 }; return lastPeriod; }
      const Es = periodEnergies();          // W-STURMIAN: the OCCUPIED eigenvalues (populations > 1e-6), never the labels' ⟨H⟩ — and wave 58 hands the SAME expression to capture.js
      /* Hydrogen, ions and the oscillator normally prove commensurate in microseconds. Answer that exact half here;
         only an actually incommensurate spectrum pays module-worker startup and the bounded two-million-step scan. */
      const exact = densityPeriodExact(Es);
      if (exact) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; periodPending = null; lastPeriod = exact; return lastPeriod; }
      if (!force && scan.ok) {
        /* THE FRAME PATH (wave 45): the scan runs in the maths worker and the readout says it is settling until the
           answer lands — a BOX bow populates 56 incommensurate well energies and the scan measured 1.2 s on the first
           frame after the pointer lifted.  Forced readers (LW.period, ⟳, the digest) still scan here, synchronously. */
        if (!periodPending || !sameKey(periodPending, key)) { periodPending = key; scanPost(key, Array.from(Es)); }   // LA6: posted, or waiting behind the one in flight
        periodSettling = true; return lastPeriod;
      }
      const wasSettling = periodSettling;
      Object.assign(pk, key); periodSettling = false; periodPending = null;
      const t0 = performance.now();
      lastPeriod = densityPeriod(Es, { horizon: 2e4 });
      periodCostMs = performance.now() - t0;
      if (force && wasSettling) paintPeriod();                                 // the readout said "settling": it has the answer now
      return lastPeriod;
    }
    function periodText() {
      const P = periodNow(); if (!P) return ['—', '', ''];
      if (periodSettling) return ['…', 'settling — the recurrence scan runs off the frame, or when the gesture ends', ''];
      const src = sturm.P ? ' · from the occupied eigenvalues of S⁻¹H' : '';
      if (sturm.P && !P.exact && P.T > 0) {                          // W-STURMIAN: a "recurrence" shorter than one turn of the fastest beat is no recurrence (every phase is still small)
        const Es = occupiedEigen(); let dmax = 0; for (let i = 0; i < Es.length; i++) for (let j = i + 1; j < Es.length; j++) dmax = Math.max(dmax, Math.abs(Es[i] - Es[j]));
        if (dmax > 0 && P.T < 2 * Math.PI / dmax) return ['—', P.count + ' incommensurate eigenvalues · no recurrence within the search horizon', 'warn'];
      }
      if (P.stark) return ['— (Stark)', 'no exact period under a static field: the Stark energies are not commensurate', 'warn'];
      if (P.mix) return ['— (transition)', 'the A ↔ B mix has its own clock: the Rabi period', 'warn'];
      if (P.stationary) return ['stationary', 'one energy: the density never changes', ''];
      /* 0.6.0 B3a: the field-free hydrogen register says its closed form, T = 2π·7200/g′/Z² (hydrogenShellPeriod), where it equals the fit */
      const pop = reg.populated(), unit = pop.every((a) => rates[a] === 1), Z = getZ();
      const Th = unit && !sturm.P && getHamiltonian().id === 'hydrogen' && reg.field.Bz === 0 ? hydrogenShellPeriod(pop.map((a) => BASIS[a].n), Z) : 0, gp = Math.round(14400 * Math.PI / (Th * Z * Z));
      if (P.exact) { const lap = Math.floor(clock.t / P.T), ph = clock.t - lap * P.T;
        const head = Th && Math.abs(Th - P.T) < 1e-9 * P.T ? 'exactly · T = 14400π' + (gp > 1 ? '/' + gp : '') + (Z !== 1 ? '/Z²' : '') + ' a.u. · ' + fmtPeriod(P.T).split(' · ')[1] : P.count + ' energies · gcd ' + P.g.toPrecision(4) + ' Eh';
        return [fmtPeriod(P.T), head + ' · lap ' + lap + ' · ' + (100 * ph / P.T).toFixed(0) + '%' + src, 'ok']; }
      return ['≈ ' + fmtPeriod(P.T), (unit || sturm.P ? '' : 'no exact period under these per-label rates · ') + 'nearest recurrence · error ' + (100 * P.err).toFixed(1) + '% of a beat' + src, 'warn'];
    }
    /** the four slots of the REPEATS formula, from the SAME `periodNow()` the readout above reads — one
        expression for one quantity (ANTI-PATTERN 20).  A state with no exact period prints an em dash in
        every slot rather than a number that would be a lie. */
    function paintPeriodFx() {
      if (!ui.periodFx) return;
      const P = periodNow();
      if (!P || periodSettling || !P.exact || !(P.T > 0)) { ui.periodFx.set({ g: '—', T: '—', lap: '—', ph: '—' }); return; }
      const lap = Math.floor(clock.t / P.T), ph = (clock.t - lap * P.T) / P.T;
      ui.periodFx.set({ g: P.g.toPrecision(6), T: fmtPeriod(P.T), lap: String(lap), ph: ph.toFixed(3) });
    }
    /** paint the REPEATS readout now — a forced scan (LW.period, ⟳, the digest) and the worker's answer both call it, so a paused
        instrument shows the answer the moment it exists rather than on a frame it will not run (wave 45) */
    function paintPeriod() { if (!ui.periodRo) return; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub + flashSub()); paintPeriodFx(); }
    /* 0.6.0 B3a · THE FLASH LAW (lab/flash-law.js) on the RATE knob and this sub, recomputed only when RATE or the register moves; it never changes RATE (the hand wins) */
    const fk = { v: -1, r: -1, sub: '' }, rateTitle = ui.rateKnob.root.title;
    function flashSub() {
      if (fk.v === reg.version && fk.r === clock.rate) return fk.sub;
      const w = aliasOf(periodEnergies(), fk.r = clock.rate, stats.fps >= 10 ? Math.round(stats.fps) : 60), on = !!w && w.alias > FLASH_HZ; fk.v = reg.version;
      ui.rateKnob.root.title = on ? 'a beat of ' + w.hz.toFixed(1) + ' Hz shows at ' + w.alias.toFixed(1) + ' Hz on screen: above 3 a second it flashes' : rateTitle;
      ui.rateKnob.root.classList.toggle('flash', on); return (fk.sub = on ? ' · beats alias at ' + w.alias.toFixed(1) + ' Hz on screen' : '');
    }
    app.hooks.period = () => periodNow(true);          // every reader outside the frame loop forces the scan: no proof and no digest ever sees a settling answer
    const laps = () => Math.floor(clock.t / clock.window);
    const compactClock = (v, threshold, decimals) => Math.abs(v) < threshold
      ? v.toFixed(decimals)
      : v.toExponential(decimals).replace('e+', 'e');
    const clockText = () => {
      const lap = laps();
      return compactClock(clock.t, 1e5, 2) + (lap ? '  (' + compactClock(lap, 1e4, 1) + ')' : '');
    };
    const stepDt = () => clock.window / 48;
    play.addEventListener('click', () => togglePlay());
    /* wave 106: …and the PLAYHEAD goes back with the clock.  `ui.scrub` is only ever repainted inside
       `if (keep.frames)` in update(), and KEEP FRAMES ships OFF — so pressing ⏮ moved t to 0 and left
       the bar standing wherever it had been.  `loadPreset` has always done this (it calls
       `ui.scrub.set(0)` beside `clock.reset()`); the transport's own button did not. */
    rst.addEventListener('click', () => { clock.reset(); ui.scrub.set(0); shadowView.clearTrail(); schedule(TIER.EVOLVE); });
    sm.addEventListener('click', () => { clock.step(-stepDt()); schedule(TIER.EVOLVE); });
    sp.addEventListener('click', () => { clock.step(stepDt()); schedule(TIER.EVOLVE); });
    let troWall = 0, periodWall = 0, playShown = null;
    function update() {
      const on = clock.playing, now = performance.now();
      if (playShown !== on) { playShown = on; play.textContent = on ? '❚❚' : '▶'; play.classList.toggle('on', on); play.setAttribute('aria-pressed', String(on)); }
      /* KEEP FRAMES (wave 45): on, the playhead follows every frame as it always did; off — the default — the bar is
         disabled and never repainted, and the t readout runs at 5 Hz while playing (every paused frame, as before) */
      if (keep.frames) {
        if (!ui.scrub.dragging()) ui.scrub.set(((clock.t % clock.window) + clock.window) % clock.window / clock.window);
        tro.set(clockText(), on ? 'live' : '');
      } else if (!on || now - troWall >= 200) { troWall = now; tro.set(clockText(), on ? 'live' : ''); }
      if (ui.periodRo && (!on || keep.frames || now - periodWall >= 200)) { periodWall = now; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub + flashSub()); paintPeriodFx(); }   // periodNow() is cached on the register's version; the scan itself runs off the frame (wave 45) or waits out a live gesture (wave 44).  WAVE 69: the formula rides the SAME cadence law — every frame with KEEP FRAMES on, 5 Hz without — so a moving number obeys the readout law the transport already owns rather than inventing a second one
    }
    setKeepFrames(keep.frames);                                // the shipped default: the bar disabled
    setModArm(app.state.modArm, { quiet: true });                        // wave 65: ONE writer paints the lamp, boot included
    return { update, stepDt };
  })();
  /** THE PLAY (0.5.0 A6): the physics clock's toggle; its edge plays or pauses the modulation (C4: the one clock, always). */
  function togglePlay() { appPlay.toggle(); schedule(TIER.EVOLVE); }
  /** THE POWER (MIR 1.5, R-B1 at 0.5.0 C4; the MOD button, Ctrl+Space, the window's power seat): `setModulationEnabled` is a
   *  ROUTE BYPASS — off, every routed control is back on its base and the hand owns it, while the clock, the sources, the tempo
   *  and the HOLDs run on, so power on picks the routes up in time.  Power never plays; play never powers (bind.js setArm). */
  function setModArm(on, opts) {
    const want = !!on, o = opts || {};
    app.state.modArm = want;
    if (ui.modB) {
      ui.modB.classList.toggle('on', want);
      ui.modB.setAttribute('aria-pressed', String(want));
    }
    if (app.state.modHost) {
      app.state.modHost.clock.setModulationEnabled(want);
      if (app.state.modView) app.state.modView.sync();
    }
    if (!o.quiet) saveMod();
    schedule(TIER.PRESENT);
    return app.state.modArm;
  }
  app.sh.transport = transport; app.sh.togglePlay = togglePlay; app.sh.setModArm = setModArm; app.sh.barLock = barLock;
  /** THE LOOP CLOCK, LOCKED TO THE STATE (g).  `barTempo({T, rate})` turns the density's own exact
   *  recurrence into a tempo at which ONE BAR IS ONE RECURRENCE — which is what makes the BPM chip's
   *  "an existing global clock" the instrument's clock rather than a number somebody typed, and what
   *  makes `capture.js`'s loop close on the same seam the physics closes on.  It is a KEY and not a
   *  new control, because the modulation window is a ported artifact and its timing bar is not ours
   *  to grow; the sentence lives on the MOD button and in the keyboard editor.  It never guesses: no exact
   *  period, no lock, and the refusal says which. */
  function barLock() {
    if (!app.state.modHost) return { ok: false, reason: 'no modulation rack' };
    const P = app.hooks.period ? app.hooks.period() : null;
    if (!P || !P.exact || !(P.T > 0)) {
      const why = !P ? 'no recurrence scan' : P.stark ? 'no exact period under a static field'
        : P.mix ? 'the A ↔ B mix has its own clock' : P.stationary ? 'one energy: the density never changes'
        : 'no exact period — the energies are incommensurate';
      if (app.state.modView) app.state.modView.say('the loop clock cannot be locked to this state: ' + why, 'warn');
      return { ok: false, reason: why };
    }
    const r = barTempo({ T: P.T, rate: clock.rate });
    if (!r.ok) return { ok: false, reason: r.reason };
    app.state.modHost.clock.setBpm(r.clamped ? r.bpmThatFits : r.bpm);
    if (app.state.modView) { app.state.modView.sync(); app.state.modView.say(r.clamped
      ? 'one bar = ' + r.lapsThatFit + ' laps of the recurrence at ' + app.state.modHost.model.transport.bpm.toFixed(1) + ' BPM (one lap would be ' + r.wanted.toFixed(1) + ', past the tempo range)'
      : 'one bar = one recurrence of the density, at ' + app.state.modHost.model.transport.bpm.toFixed(1) + ' BPM'); }
    saveSettings();
    return { ok: true, bpm: app.state.modHost.model.transport.bpm, wanted: r.wanted, clamped: r.clamped,
             laps: r.clamped ? r.lapsThatFit : 1, T: P.T, seconds: r.seconds, fits: r.fitsAtLaps };
  }
  return { transport, togglePlay, setModArm, barLock };
}
