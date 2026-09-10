/* audio.js — THE CAPTURE HALF OF THE AUDIO DEVICE, AND NOTHING ELSE.
 *
 * `lab/mir/mod.js` has carried a complete audio FOLLOWER since the MIR wave — the fixed-dB
 * normaliser, the hysteresis gate, four per-output attack/release followers, and a median+MAD
 * onset detector with a refractory window.  What it has never had is a SIGNAL.  BASINS' own
 * `audio.js` was deliberately not ported (lab/mir/PORT-NOTES.md), so `ADD AUDIO` has shipped
 * disabled and `modFeedAudio` has never been called.  This file is that missing half.
 *
 * ── THE SEAM, AND WHY IT IS THIS SMALL ─────────────────────────────────────────────────────────
 * `modFeedAudio(deviceId, feed)` wants exactly six numbers and owns everything else:
 *
 *     { feedHz, capturedAt, sampleRate, rms, bandPower: [low, mid, high], flux }
 *
 *   rms        LINEAR amplitude.  The model takes 20·log10 of it (`audioDbAmp`).
 *   bandPower  LINEAR MEAN POWER per band.  The model takes 10·log10 (`audioDbPow`).
 *              Amplitude and power are two different logs and mixing them is a 2× error in dB —
 *              which is why they are named apart here rather than both called "level".
 *   flux       half-wave-rectified spectral flux, ≥ 0, in the same units frame to frame.
 *   capturedAt SECONDS, monotonic.  The model differences it to age a hit.
 *
 * SO NO CALIBRATION, NO SMOOTHING, NO THRESHOLD AND NO ONSET LOGIC LIVES HERE.  Every one of
 * those is the model's, is already gated, and would be a second opinion if this file had one too
 * (ANTI-PATTERN 20: one quantity, one expression).  This file measures and hands over.
 *
 * ── THE PRIVACY STORY, WHICH IS A DESIGN DECISION AND NOT A DETAIL ─────────────────────────────
 *   · THE MICROPHONE IS NEVER OPENED BY ADDING A DEVICE.  Building an AUDIO card opens nothing;
 *     only a press on its own MIC button calls `start()`.  A window that asks for the microphone
 *     because you opened it is a window nobody opens twice.
 *   · IT CLOSES WHEN NOBODY WANTS IT.  `stop()` tears the stream down — every track stopped, the
 *     context closed — and the host calls it the moment the last audio device goes away.
 *   · IT SUSPENDS WITH THE PAGE, AND SUSPENDING IS NOT CLOSING.  Said plainly because an earlier
 *     draft of this header claimed otherwise: `ctx.suspend()` stops the ANALYSIS, not the CAPTURE.
 *     The track stays live, the OS still has the device, and the browser's recording indicator STAYS
 *     LIT.  That is the right trade for a music tool — alt-tabbing must not cost you the microphone —
 *     but it is a trade, and the honest close is one press of MIC away.
 *     THE PAGE'S VISIBILITY IS THE HOST'S TO REPORT, not ours to watch.  The host already funnels
 *     `visibilitychange`, `freeze` and `pagehide` into one authority (rack.js's `setPageHidden`), and
 *     a second listener here would be a second answer — narrower than the first, since bare
 *     `document.hidden` misses bfcache and the iPad app switch.  `setHidden()` is the door.
 *   · NOTHING IS RECORDED, STORED OR SENT.  The graph is source → analyser and stops there: there is
 *     no connection to `ctx.destination`, no MediaRecorder and no network path, and what leaves this
 *     file is six floats.  It does hold three working buffers — the spectrum, the waveform and the
 *     PREVIOUS frame's magnitudes, which spectral flux is a difference against — and an earlier draft
 *     of this line claimed "no buffer that outlives a frame", which was not true of `prevMag`.  The only thing persisted anywhere is the chosen INPUT
 *     DEVICE ID, which the host keeps in its own settings key so a returning user is not asked to
 *     pick again — and which is a device handle, not audio.
 *   · THE THREE PROCESSORS ARE OFF, AS A MANDATORY CONSTRAINT.  `echoCancellation`,
 *     `noiseSuppression` and `autoGainControl` are voice-call features, and AGC in particular would
 *     fight the follower for control of the level and make the ENVELOPE a lie.  They are asked for as
 *     `{ exact: false }`, which is the ONLY spelling that is mandatory: a bare `false` is an IDEAL
 *     constraint that contributes to fitness distance and never fails, so a browser that ignores it
 *     hands back a gain-ridden signal and says nothing.  An earlier draft used the bare form and
 *     claimed the opposite in this comment.  What actually came back is read off the track and
 *     published as `processing`, so a host can say so rather than guess.
 *
 * ── WHAT THE HOST GETS BACK ────────────────────────────────────────────────────────────────────
 * `state` is one of six words and `reason` is a sentence for the face to print.  There is no
 * boolean `ok`: "the browser will not do this at all" and "you said no" and "there is no
 * microphone" are three different things to a user, and a face that cannot tell them apart cannot
 * say anything useful.
 */

/** the three bands the model follows, in Hz.  Low ends where a kick stops being a kick, high
 *  begins where cymbals and consonants live; the mid is everything a melody sits in. */
export const BANDS = Object.freeze([
  Object.freeze({ key: 'low', lo: 20, hi: 250 }),
  Object.freeze({ key: 'mid', lo: 250, hi: 2000 }),
  Object.freeze({ key: 'high', lo: 2000, hi: 16000 })
]);

/** 2048 bins at 48 kHz is a 23 Hz resolution and a 42.7 ms window — fine enough that the LOW band has
 *  ten bins in it to average over.  IT IS NOT SHORT ENOUGH TO ISOLATE AN ONSET, and an earlier draft
 *  claimed it was: read at 60 Hz, consecutive windows overlap by about 61 %, so one transient appears
 *  in roughly two and a half frames' spectra and its flux is spread over all of them.  The detector
 *  absorbs that — the median+MAD threshold is estimated over 45 frames and the refractory window is
 *  83 ms — but the smearing is real and the FFT size is not what prevents it. */
const FFT_SIZE = 2048;

/** The states a capture can be in.  Each is a different sentence to a user. */
export const AUDIO_STATE = Object.freeze({
  IDLE: 'idle',                 // nothing open, nothing asked
  ASKING: 'asking',             // the permission prompt is up
  LIVE: 'live',                 // a stream is open and being read
  DENIED: 'denied',             // the user said no, or policy says no
  NODEVICE: 'nodevice',         // permission is fine; there is no input
  UNAVAILABLE: 'unavailable',   // this browser/context cannot do it at all
  ERROR: 'error'                // it broke after it was working
});

/** Why a capture cannot start, decided BEFORE anything is requested so the face can say so
 *  without provoking a permission prompt it already knows will fail. */
export function audioSupport() {
  if (typeof window === 'undefined') return { ok: false, why: 'no window' };
  const secure = window.isSecureContext !== false;
  const md = navigator && navigator.mediaDevices;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!secure) return { ok: false, why: 'the microphone needs a secure page — open this over HTTPS, or on localhost' };
  if (!md || !md.getUserMedia) return { ok: false, why: 'this browser does not offer microphone capture' };
  if (!AC) return { ok: false, why: 'this browser has no Web Audio, so there is nothing to analyse with' };
  return { ok: true, why: '' };
}

/**
 * createAudioCapture({ onState }) — one microphone, shared by every AUDIO device in the rack.
 *
 * ONE CAPTURE, NOT ONE PER DEVICE, and that is deliberate: two AUDIO cards listening to the same
 * microphone are two analyses of one signal, and asking the browser for the stream twice earns two
 * permission prompts and two indicator lights for no second opinion.  The host feeds the same
 * `read()` to every device, and each applies its OWN gain, gate and followers — which is where the
 * difference between two audio devices actually lives.
 */
export function createAudioCapture(opts) {
  const o = opts || {};
  const announce = typeof o.onState === 'function' ? o.onState : () => {};

  let state = AUDIO_STATE.IDLE, reason = '';
  let ctx = null, stream = null, srcNode = null, analyser = null;
  let freqDb = null, timeBuf = null, prevMag = null;
  let binHz = 0, bandBins = null;
  let deviceId = o.deviceId || '';
  let started = 0;             // performance.now() when the stream opened
  let frames = 0;
  let inputLatencyMs = null;   // MediaTrackSettings.latency, when the browser reports it
  let visualLatencyMs = 0;     // half of the most recently requested display/feed interval
  let disposed = false;
  /* ⚠ THE IN-FLIGHT TOKEN.  `start()` awaits twice, and without this a second call — two presses on
     MIC, or a press while the permission prompt is up — ran straight through the first one's awaits
     and orphaned its stream and context: MEASURED, two streams opened and one live track plus one
     AudioContext leaked, with `state` reporting `idle` while the recording indicator stayed lit.
     Every `start()` takes a ticket; anything that finishes holding a stale one tears down what it
     built rather than publishing it.  `stop()` bumps the counter, which is also what makes a cancel
     during the prompt actually cancel (it did not: the mic opened anyway, one tick later). */
  let startSeq = 0;
  let processing = null;       // what the browser ACTUALLY gave us for the three voice processors
  /* ⚠ FLUX IS A DIFFERENCE, SO ITS FIRST FRAME HAS NOTHING TO DIFFERENCE AGAINST.  `prevMag` starts as
     zeros at open and is stale across a suspend, and in BOTH cases the next read subtracts silence
     from a live spectrum — a rise summed over a thousand bins, arriving as one enormous flux against a
     threshold estimated on the old signal.  That is a phantom onset, and it fires every envelope bound
     to `:hit`.  ZEROING `prevMag` CAUSES IT rather than preventing it, which is what an earlier fix in
     this same wave got backwards.  The cure is to spend one frame LEARNING the spectrum and report no
     flux for it. */
  let fluxPrimed = false;

  const set = (s, why) => {
    if (state === s && reason === (why || '')) return;
    state = s; reason = why || '';
    try { announce({ state, reason }); } catch (_) {}
  };

  /* THE BIN RANGES ARE COMPUTED ONCE PER CONTEXT, not per frame: they depend only on the sample
     rate and the FFT size, and both are fixed for the life of the stream. */
  function planBands() {
    const n = analyser.frequencyBinCount;
    binHz = ctx.sampleRate / 2 / n;
    /* ⚠ THE BANDS ARE MADE CONTIGUOUS, and that is a correction rather than a tidy-up.  `floor(lo)`
       and `ceil(hi)` OVERLAP at every boundary — at 48 kHz, bins 10 and 11 are both the top of LOW
       and the bottom of MID — and the single ascending walk in `read()` resolves an overlap by
       giving the bin to whichever band it reaches first.  So two bins were counted in LOW's mean and
       silently missing from MID's, which is a 2.7 % error in one band and 0 % in another: exactly the
       kind of thing that never looks wrong and never is right.  Each band now starts one bin after
       the last one ended, so every bin belongs to exactly one. */
    let prevEnd = 0;
    bandBins = BANDS.map((b) => {
      const i0 = Math.max(1, prevEnd + 1, Math.floor(b.lo / binHz));   // bin 0 is DC and carries no music
      const i1 = Math.max(i0, Math.min(n - 1, Math.ceil(b.hi / binHz)));
      prevEnd = i1;
      return { key: b.key, i0, i1 };
    });
  }

  /** open the microphone.  `id` picks an input; '' is the system default. */
  async function start(id) {
    if (disposed) return state;
    const sup = audioSupport();
    if (!sup.ok) { set(AUDIO_STATE.UNAVAILABLE, sup.why); return state; }
    if (state === AUDIO_STATE.LIVE && (id === undefined || id === deviceId)) return state;
    if (id !== undefined) deviceId = id || '';
    /* ⚠ THE TICKET IS TAKEN BEFORE THE FIRST AWAIT.  Taking it after `await teardown()` was a bug my
       own gate caught: `stop()` bumps the counter, so a cancel arriving during the teardown was
       already spent by the time this line ran and `mine` came out NEWER than the cancel — the mic
       opened anyway.  `teardown()` is the half that does not bump; `stop()` is bump + teardown. */
    const mine = ++startSeq;
    const stale = () => disposed || mine !== startSeq;
    await teardown();
    if (stale()) return state;
    set(AUDIO_STATE.ASKING, 'waiting for permission to use the microphone');
    /* THE THREE VOICE PROCESSORS ARE OFF, MANDATORILY — `{ exact: false }` and not a bare `false`,
       which would be an IDEAL constraint that never fails.  See the header. */
    const audio = { echoCancellation: { exact: false }, noiseSuppression: { exact: false },
                    autoGainControl: { exact: false } };
    if (deviceId) audio.deviceId = { exact: deviceId };
    let got = null;
    try {
      got = await navigator.mediaDevices.getUserMedia({ audio, video: false });
    } catch (e) {
      const n = (e && e.name) || '';
      if (stale()) return state;                   // somebody cancelled while the prompt was up
      if (n === 'NotAllowedError' || n === 'SecurityError') {
        set(AUDIO_STATE.DENIED, 'the microphone was refused — allow it for this page in the browser’s site settings, then press MIC again');
      } else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') {
        set(AUDIO_STATE.NODEVICE, 'no microphone was found on this device');
      } else if (n === 'OverconstrainedError' && deviceId) {
        deviceId = '';                             // the remembered input is gone: fall back to the default
        return start('');
      } else if (n === 'OverconstrainedError') {
        /* the mandatory `exact: false` above is the only other thing that can overconstrain, and a
           browser that cannot turn AGC off is still worth listening to — it is said out loud rather
           than refused, because the alternative is no microphone at all on that machine */
        set(AUDIO_STATE.ASKING, 'retrying without the processing constraints');
        return startLoose(mine);
      } else {
        set(AUDIO_STATE.ERROR, 'the microphone could not be opened' + (n ? ' (' + n + ')' : ''));
      }
      return state;
    }
    /* ⚠ THE TICKET IS CHECKED BEFORE THE STREAM IS PUBLISHED.  Without this a second `start()` — or a
       `stop()` during the prompt — left this one's stream assigned to nothing and never closed: the
       track stays live and the recording indicator stays lit for the session.  A stale winner tears
       down what it was given rather than handing it over. */
    if (stale()) { for (const t of got.getTracks()) { try { t.stop(); } catch (_) {} } return state; }
    stream = got;
    return build(mine);
  }

  /** the same open with the processing constraints relaxed, for a browser that refuses `exact`. */
  async function startLoose(mine) {
    const audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (deviceId) audio.deviceId = { exact: deviceId };
    let got = null;
    try { got = await navigator.mediaDevices.getUserMedia({ audio, video: false }); }
    catch (e) { if (!(disposed || mine !== startSeq)) set(AUDIO_STATE.ERROR, 'the microphone could not be opened'); return state; }
    if (disposed || mine !== startSeq) { for (const t of got.getTracks()) { try { t.stop(); } catch (_) {} } return state; }
    stream = got;
    return build(mine);
  }

  /** build the graph over an already-granted stream. */
  async function build(mine) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = new AC();
      /* a context created before a gesture can start SUSPENDED; the press that got us here IS the
         gesture, so resuming is allowed and is what makes the first frame arrive */
      if (c.state === 'suspended') { try { await c.resume(); } catch (_) {} }
      if (disposed || mine !== startSeq) { try { await c.close(); } catch (_) {}
        for (const t of stream.getTracks()) { try { t.stop(); } catch (_) {} } stream = null; return state; }
      ctx = c;
      srcNode = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      /* SMOOTHING IS ZERO ON PURPOSE.  The AnalyserNode's own smoothing is a first-order filter with
         no documented time constant, and the model already runs four followers whose attack and
         release ARE the contract.  Smoothing here would make those four settings lies. */
      analyser.smoothingTimeConstant = 0;
      /* THE GRAPH ENDS AT THE ANALYSER.  Nothing is connected to ctx.destination — a microphone
         routed to the speakers is a feedback loop, and this file has no business making sound. */
      srcNode.connect(analyser);
      freqDb = new Float32Array(analyser.frequencyBinCount);
      timeBuf = new Float32Array(analyser.fftSize);
      prevMag = new Float32Array(analyser.frequencyBinCount);
      planBands();
      fluxPrimed = false;                           // the first frame after an open learns, it does not fire
      started = performance.now();
      frames = 0;
      const t = stream.getAudioTracks()[0];
      if (t) {
        const st = (t.getSettings && t.getSettings()) || {};
        deviceId = st.deviceId || deviceId;
        /* WHAT THE BROWSER ACTUALLY GAVE US.  Asking mandatorily is not the same as getting it, and a
           host that wants to warn "AGC is on, the envelope will fight it" needs to be able to see. */
        processing = { echoCancellation: st.echoCancellation, noiseSuppression: st.noiseSuppression,
                       autoGainControl: st.autoGainControl };
        inputLatencyMs = Number.isFinite(st.latency) && st.latency >= 0 ? st.latency * 1000 : null;
        /* A TRACK THAT ENDS TEARS THE GRAPH DOWN.  Setting a word and leaving the context open held
           the hardware, kept three buffers alive, and — because the host's own closer only runs while
           a feed is being read — could never be reached again from that state. */
        t.addEventListener('ended', () => {
          if (state !== AUDIO_STATE.LIVE) return;
          stop().then(() => set(AUDIO_STATE.ERROR, 'the microphone was disconnected'));
        });
      }
      set(AUDIO_STATE.LIVE, '');
    } catch (e) {
      await teardown();
      set(AUDIO_STATE.ERROR, 'the audio graph could not be built' + (e && e.name ? ' (' + e.name + ')' : ''));
    }
    return state;
  }

  /** close everything.  Every track stopped and the context CLOSED — a suspended context still holds
   *  the device and the recording indicator with it. */
  async function stop() { startSeq++; return teardown(); }   // the bump is what cancels an in-flight start
  async function teardown() {
    if (srcNode) { try { srcNode.disconnect(); } catch (_) {} srcNode = null; }
    analyser = null;
    if (stream) { for (const t of stream.getTracks()) { try { t.stop(); } catch (_) {} } stream = null; }
    if (ctx) { const c = ctx; ctx = null; try { await c.close(); } catch (_) {} }
    freqDb = timeBuf = prevMag = null; bandBins = null; frames = 0; started = 0; processing = null;
    inputLatencyMs = null; visualLatencyMs = 0;
    /* EVERY state that implied an open device becomes IDLE — ERROR included, which used to survive a
       close and leave the face painting a fault on a capture that was fully shut. */
    if (state !== AUDIO_STATE.UNAVAILABLE && state !== AUDIO_STATE.DENIED &&
        state !== AUDIO_STATE.NODEVICE) set(AUDIO_STATE.IDLE, '');
    return state;
  }

  /** the page went away: stop the ANALYSIS.  The device stays open — see the header, this is a trade
   *  and not a claim that the microphone is closed. */
  async function suspend() { if (ctx && ctx.state === 'running') { try { await ctx.suspend(); } catch (_) {} } }
  async function resume() {
    if (!(ctx && ctx.state === 'suspended')) return;
    try { await ctx.resume(); } catch (_) {}
    /* ⚠ THE PREVIOUS SPECTRUM IS STALE AND MUST BE FORGOTTEN.  Flux is a half-wave-rectified
       difference against the last frame; across a suspend the "last frame" is from before the tab went
       away, so hiding during quiet and returning during music differences a full spectrum against
       silence — one enormous rise summed over a thousand bins, against a threshold estimated on the
       pre-hide signal.  That is a phantom onset, and it fires every envelope bound to `:hit`. */
    fluxPrimed = false;                            // the next frame re-learns the spectrum, reporting 0
  }
  /** THE HOST REPORTS THE PAGE'S VISIBILITY; this file does not watch for it.  rack.js already funnels
   *  `visibilitychange`, `freeze` and `pagehide` into one authority precisely so there can never be two
   *  answers, and a second listener here would be the narrower of the two — bare `document.hidden`
   *  misses bfcache and the iPad app switch, both of which that authority already handles. */
  function setHidden(v) { if (v) suspend(); else if (state === AUDIO_STATE.LIVE) resume(); }

  /**
   * ONE MEASUREMENT, the shape `modFeedAudio` wants.  Returns null when there is nothing to read,
   * which the host treats as "do not feed" rather than as a zero — a zero is a claim about silence
   * and this would be a claim about the microphone.
   *
   * @param {number} feedHz the rate the host is calling this at; the model turns the followers'
   *        millisecond time constants into per-frame coefficients with it, so it must be the TRUE
   *        cadence and not a nominal 60.
   */
  function read(feedHz) {
    if (!analyser || state !== AUDIO_STATE.LIVE) return null;
    if (ctx && ctx.state !== 'running') return null;              // suspended with the page
    analyser.getFloatTimeDomainData(timeBuf);
    analyser.getFloatFrequencyData(freqDb);

    /* RMS over the time window — a linear amplitude, which is what `audioDbAmp` expects. */
    let sum = 0;
    for (let i = 0; i < timeBuf.length; i++) { const v = timeBuf[i]; sum += v * v; }
    const rms = Math.sqrt(sum / timeBuf.length);

    /* THE SPECTRUM ONCE, USED TWICE.  `getFloatFrequencyData` is dB (and -Infinity in true
       silence), so it is converted to linear MAGNITUDE here and both the band powers and the flux
       are taken off that one conversion rather than off two passes. */
    const n = freqDb.length;
    let flux = 0;
    const power = [0, 0, 0], count = [0, 0, 0];
    let bi = 0;
    for (let i = 0; i < n; i++) {
      const db = freqDb[i];
      const mag = db > -160 && Number.isFinite(db) ? Math.pow(10, db / 20) : 0;
      /* HALF-WAVE RECTIFIED FLUX: only the RISES count.  A fall is the tail of the note before it,
         and counting it would make every note-off look like a note-on. */
      const d = mag - prevMag[i];
      if (d > 0) flux += d;
      prevMag[i] = mag;
      /* the bands are contiguous and ascending, so one walk assigns every bin */
      while (bi < bandBins.length && i > bandBins[bi].i1) bi++;
      if (bi < bandBins.length && i >= bandBins[bi].i0) { power[bi] += mag * mag; count[bi]++; }
    }
    /* ⚠ FLUX IS A SUM, NOT A MEAN, AND THE TEST IS WHY.  The first cut divided by the bin count to
       make the number independent of the FFT size — which sounds right and is fatal: the model's
       onset threshold has an ABSOLUTE floor (`AUDIO_FLUX_FLOOR`, 0.02) that a per-bin mean can never
       reach.  Measured, a full-scale transient produced 8.6e-4 against a floor of 0.02, so `hit`
       could not fire on any input, ever — a dead output that looked like a quiet room.  The floor is
       calibrated for the SUM, `FFT_SIZE` is fixed at 2048, and the two now agree. */

    /* the primer: one frame is spent learning the spectrum and reports no rise at all */
    if (!fluxPrimed) { fluxPrimed = true; flux = 0; }

    const bandPower = [
      count[0] ? power[0] / count[0] : 0,
      count[1] ? power[1] / count[1] : 0,
      count[2] ? power[2] / count[2] : 0
    ];
    frames++;
    const measuredFeedHz = Number.isFinite(feedHz) && feedHz > 0 ? feedHz : 60;
    visualLatencyMs = 500 / measuredFeedHz;
    /* An analyser describes a window of samples rather than a single instant. Its useful centre is
       half a window behind the newest sample. Add the browser-reported capture latency when it is
       available, then half a visual interval for the next paint. This is an estimate; a calibrated
       acoustic/electrical loopback is the only way to measure physical end-to-end delay exactly. */
    const analysisLatencyMs = ctx && ctx.sampleRate ? FFT_SIZE * 500 / ctx.sampleRate : 0;
    const latencyMs = (inputLatencyMs || 0) + analysisLatencyMs + visualLatencyMs;
    const nowS = performance.now() / 1000;
    return {
      feedHz: measuredFeedHz,
      capturedAt: nowS,
      now: nowS,
      sampleRate: ctx ? ctx.sampleRate : 0,
      inputLatencyMs,
      analysisLatencyMs,
      visualLatencyMs,
      latencyMs,
      latencyEstimated: inputLatencyMs === null,
      rms, bandPower, flux
    };
  }

  /** the inputs this browser will name.  LABELS ARE EMPTY UNTIL PERMISSION IS GRANTED — that is the
   *  spec, not a bug, so the face shows "INPUT 1, INPUT 2" until the mic has been allowed once. */
  async function devices() {
    try {
      const md = navigator.mediaDevices;
      if (!md || !md.enumerateDevices) return [];
      const all = await md.enumerateDevices();
      return all.filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({ id: d.deviceId, label: d.label || ('INPUT ' + (i + 1)) }));
    } catch (_) { return []; }
  }

  return {
    get state() { return state; },
    get reason() { return reason; },
    get live() { return state === AUDIO_STATE.LIVE; },
    get deviceId() { return deviceId; },
    get frames() { return frames; },
    get sampleRate() { return ctx ? ctx.sampleRate : 0; },
    get inputLatencyMs() { return inputLatencyMs; },
    get analysisLatencyMs() { return ctx && ctx.sampleRate ? FFT_SIZE * 500 / ctx.sampleRate : 0; },
    get visualLatencyMs() { return visualLatencyMs; },
    get latencyMs() { return (inputLatencyMs || 0) + (ctx && ctx.sampleRate ? FFT_SIZE * 500 / ctx.sampleRate : 0) + visualLatencyMs; },
    get latencyEstimated() { return inputLatencyMs === null; },
    get upMs() { return started ? performance.now() - started : 0; },
    /** what the browser actually granted for the three voice processors, or null before a stream */
    get processing() { return processing; },
    support: audioSupport,
    start, stop, suspend, resume, setHidden, read, devices,
    dispose() { disposed = true; startSeq++; stop(); }
  };
}

export default createAudioCapture;
