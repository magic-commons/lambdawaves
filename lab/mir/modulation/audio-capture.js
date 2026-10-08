/* modulation/audio-capture.js — THE CAPTURE HALF OF THE AUDIO DEVICE (harvested from BASINS app/audio.js, 2026-10-05):
 * one microphone → six numbers for the model's audio follower, and nothing else.  installModulation({ audio }) takes a
 * factory with this shape; since 1.5.0-alpha.13 THIS is the default (`audio: false` leaves AUDIO out, an app's own
 * factory still wins).
 *
 *   createAudioCapture({ onState, deviceId }) → { state, reason, live, deviceId, frames, sampleRate, latency…,
 *     processing, support(), start(id?), stop(), suspend(), resume(), setHidden(v), read(feedHz), devices(), dispose() }
 *   read(feedHz) → { feedHz, capturedAt, now, sampleRate, rms, bandPower: [low, mid, high], flux, …latency } | null
 *   BANDS, AUDIO_STATE, audioSupport()
 *
 * THE SEAM.  The model (mod.js modFeedAudio) wants rms (LINEAR amplitude: it takes 20·log10), bandPower (LINEAR MEAN
 * POWER per band: it takes 10·log10: two different logs, named apart so a 2× dB error cannot hide), flux (half-wave
 * rectified spectral flux, ≥ 0, a SUM, never a mean: the model's onset floor is calibrated for the sum) and capturedAt
 * (seconds, monotonic).  No calibration, smoothing, threshold or onset logic lives here: the model owns them, already
 * gated, and a second opinion would be a second answer.  The bands are the 250 and 2000 Hz crossovers (low 20–250, mid
 * 250–2000, high 2000–16000), contiguous: a bin belongs to exactly one.
 *
 * THE PRIVACY LAWS (a design decision, not a detail).  (1) Adding a device never opens the microphone: only a press on
 * its MIC calls start(). (2) It closes when nobody wants it: stop() stops every track and closes the context, and the
 * host calls it when the last audio device goes. (3) Hiding the page suspends the ANALYSIS, not the capture: the track
 * stays live and the browser's recording indicator stays lit; that is the trade for alt-tabbing without losing the
 * microphone, and the honest close is one press of MIC.  The page's visibility is the host's to report (setHidden):
 * a second listener here would be a second answer. (4) Nothing is recorded, stored or sent: the graph is source →
 * analyser and stops there (never to the speakers: that is a feedback loop); what leaves is six numbers; the only thing
 * persisted anywhere is the chosen input's id, in the host's own settings. (5) The three voice processors are off,
 * MANDATORILY — `{ exact: false }`, never a bare false (a bare false is an ideal constraint that never fails, and AGC
 * would fight the follower for the level) — and what the browser really gave is read off the track as `processing`.
 *
 * STATES are six words (idle · asking · live · denied · nodevice · unavailable · error) and `reason` is a sentence for the
 * face: "the browser will not do this", "you said no" and "there is no microphone" are three different things to a user. */
import { t } from '../core/i18n.js';

/** the three bands the model follows, in Hz */
export const BANDS = Object.freeze([
  Object.freeze({ key: 'low', lo: 20, hi: 250 }),
  Object.freeze({ key: 'mid', lo: 250, hi: 2000 }),
  Object.freeze({ key: 'high', lo: 2000, hi: 16000 }),
]);

/* 2048 bins at 48 kHz: 23 Hz resolution, a 42.7 ms window.  Not short enough to isolate an onset (consecutive windows at
   60 Hz overlap ~61 %); the model's median+MAD threshold over 45 frames and its 83 ms refractory absorb the smearing. */
const FFT_SIZE = 2048;

export const AUDIO_STATE = Object.freeze({
  IDLE: 'idle', ASKING: 'asking', LIVE: 'live', DENIED: 'denied', NODEVICE: 'nodevice', UNAVAILABLE: 'unavailable', ERROR: 'error',
});

/** audioSupport() → { ok, why }: why a capture cannot start, decided before anything is requested so the face can say so
 *  without provoking a permission prompt it knows will fail */
export function audioSupport() {
  if (typeof window === 'undefined') return { ok: false, why: 'no window' };
  const md = navigator && navigator.mediaDevices, AC = window.AudioContext || window.webkitAudioContext;
  if (window.isSecureContext === false) return { ok: false, why: t('the microphone needs a secure page — open this over HTTPS, or on localhost') };   // tr: why the microphone cannot start
  if (!md || !md.getUserMedia) return { ok: false, why: t('this browser does not offer microphone capture') };   // tr: why the microphone cannot start
  if (!AC) return { ok: false, why: t('this browser has no Web Audio, so there is nothing to analyse with') };   // tr: why the microphone cannot start
  return { ok: true, why: '' };
}

/** createAudioCapture({ onState }) — ONE microphone, shared by every AUDIO device (two cards listening to one microphone
 *  are two analyses of one signal; asking twice earns two prompts and two indicator lights for no second opinion). */
export function createAudioCapture(opts) {
  const o = opts || {};
  const announce = typeof o.onState === 'function' ? o.onState : () => {};
  let state = AUDIO_STATE.IDLE, reason = '';
  let ctx = null, stream = null, srcNode = null, analyser = null;
  let freqDb = null, timeBuf = null, prevMag = null;
  let binHz = 0, bandBins = null;
  let deviceId = o.deviceId || '';
  let started = 0, frames = 0, inputLatencyMs = null, visualLatencyMs = 0, disposed = false, processing = null;
  /* THE IN-FLIGHT TICKET.  start() awaits twice; without a ticket a second call (two presses, or a press while the prompt
     is up) ran through the first one's awaits and orphaned its stream and context (measured: two streams, one live track
     and one AudioContext leaked, state `idle`, indicator lit).  Anything that finishes holding a stale ticket tears down
     what it built; stop() bumps the counter, which is also what makes a cancel during the prompt actually cancel. */
  let startSeq = 0;
  /* FLUX IS A DIFFERENCE, so its first frame has nothing to difference against: zeroing prevMag would CAUSE a phantom
     onset (silence subtracted from a live spectrum).  The cure is one frame spent LEARNING the spectrum, reporting 0. */
  let fluxPrimed = false;

  const set = (s, why) => {
    if (state === s && reason === (why || '')) return;
    state = s; reason = why || '';
    try { announce({ state, reason }); } catch (_) { /* a host's listener */ }
  };
  const stopTracks = (s) => { for (const tr of s.getTracks()) { try { tr.stop(); } catch (_) { /* gone */ } } };

  /* the bin ranges are computed once per context (they depend on sample rate and FFT size only).  Contiguous: floor(lo) and
     ceil(hi) would OVERLAP at every boundary and the ascending walk in read() would give the shared bin to the first band
     (a 2.7 % error in one band, 0 in another); each band starts one bin after the last ended, and bin 0 (DC) is nobody's. */
  function planBands() {
    const n = analyser.frequencyBinCount;
    binHz = ctx.sampleRate / 2 / n;
    let prevEnd = 0;
    bandBins = BANDS.map((b) => {
      const i0 = Math.max(1, prevEnd + 1, Math.floor(b.lo / binHz));
      const i1 = Math.max(i0, Math.min(n - 1, Math.ceil(b.hi / binHz)));
      prevEnd = i1;
      return { key: b.key, i0, i1 };
    });
  }

  /** start(id?) — open the microphone; `id` picks an input, '' the system default */
  async function start(id) {
    if (disposed) return state;
    const sup = audioSupport();
    if (!sup.ok) { set(AUDIO_STATE.UNAVAILABLE, sup.why); return state; }
    if (state === AUDIO_STATE.LIVE && (id === undefined || id === deviceId)) return state;
    if (id !== undefined) deviceId = id || '';
    /* the ticket is taken BEFORE the first await (after it, a cancel during the teardown was already spent and the mic
       opened anyway); teardown() is the half that does not bump, stop() is bump + teardown */
    const mine = ++startSeq, stale = () => disposed || mine !== startSeq;
    await teardown();
    if (stale()) return state;
    set(AUDIO_STATE.ASKING, t('waiting for permission to use the microphone'));   // tr: the microphone's state: the permission prompt is up
    const audio = { echoCancellation: { exact: false }, noiseSuppression: { exact: false }, autoGainControl: { exact: false } };
    if (deviceId) audio.deviceId = { exact: deviceId };
    let got = null;
    try { got = await navigator.mediaDevices.getUserMedia({ audio, video: false }); }
    catch (e) {
      const n = (e && e.name) || '';
      if (stale()) return state;                                  // somebody cancelled while the prompt was up
      if (n === 'NotAllowedError' || n === 'SecurityError') set(AUDIO_STATE.DENIED, t('the microphone was refused — allow it for this page in the browser’s site settings, then press MIC again'));   // tr: the microphone's state: refused
      else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') set(AUDIO_STATE.NODEVICE, t('no microphone was found on this device'));   // tr: the microphone's state: no input
      else if (n === 'OverconstrainedError' && deviceId) { deviceId = ''; return start(''); }   // the remembered input is gone: the default
      else if (n === 'OverconstrainedError') { set(AUDIO_STATE.ASKING, t('retrying without the processing constraints')); return startLoose(mine); }   // tr: the microphone's state: a browser that cannot turn AGC off is still worth listening to
      else set(AUDIO_STATE.ERROR, t('the microphone could not be opened') + (n ? ' (' + n + ')' : ''));   // tr: the microphone's state: a fault
      return state;
    }
    /* the ticket is checked BEFORE the stream is published: a stale winner tears down what it was given */
    if (stale()) { stopTracks(got); return state; }
    stream = got;
    return build(mine);
  }

  /** the same open with the processing constraints relaxed, for a browser that refuses `exact` */
  async function startLoose(mine) {
    const audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (deviceId) audio.deviceId = { exact: deviceId };
    let got = null;
    try { got = await navigator.mediaDevices.getUserMedia({ audio, video: false }); }
    catch (e) { if (!(disposed || mine !== startSeq)) set(AUDIO_STATE.ERROR, t('the microphone could not be opened')); return state; }
    if (disposed || mine !== startSeq) { stopTracks(got); return state; }
    stream = got;
    return build(mine);
  }

  /** build the graph over an already-granted stream */
  async function build(mine) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext, c = new AC();
      /* a context made before a gesture can start SUSPENDED; the press that got us here is the gesture */
      if (c.state === 'suspended') { try { await c.resume(); } catch (_) { /* refused */ } }
      if (disposed || mine !== startSeq) { try { await c.close(); } catch (_) { /* gone */ } stopTracks(stream); stream = null; return state; }
      ctx = c;
      srcNode = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;                         // zero ON PURPOSE: the model's four followers' attack and release ARE the contract
      srcNode.connect(analyser);                                  // the graph ends at the analyser: nothing to ctx.destination
      freqDb = new Float32Array(analyser.frequencyBinCount);
      timeBuf = new Float32Array(analyser.fftSize);
      prevMag = new Float32Array(analyser.frequencyBinCount);
      planBands();
      fluxPrimed = false; started = performance.now(); frames = 0;
      const track = stream.getAudioTracks()[0];
      if (track) {
        const st = (track.getSettings && track.getSettings()) || {};
        deviceId = st.deviceId || deviceId;
        processing = { echoCancellation: st.echoCancellation, noiseSuppression: st.noiseSuppression, autoGainControl: st.autoGainControl };
        inputLatencyMs = Number.isFinite(st.latency) && st.latency >= 0 ? st.latency * 1000 : null;
        /* a track that ENDS tears the graph down (a word alone left the context open, holding the hardware) */
        track.addEventListener('ended', () => {
          if (state !== AUDIO_STATE.LIVE) return;
          stop().then(() => set(AUDIO_STATE.ERROR, t('the microphone was disconnected')));   // tr: the microphone's state: unplugged
        });
      }
      set(AUDIO_STATE.LIVE, '');
    } catch (e) {
      await teardown();
      set(AUDIO_STATE.ERROR, t('the audio graph could not be built') + (e && e.name ? ' (' + e.name + ')' : ''));   // tr: the microphone's state: a fault
    }
    return state;
  }

  /** stop() — close everything: every track stopped and the context CLOSED (a suspended context still holds the device) */
  async function stop() { startSeq++; return teardown(); }       // the bump is what cancels an in-flight start
  async function teardown() {
    if (srcNode) { try { srcNode.disconnect(); } catch (_) { /* gone */ } srcNode = null; }
    analyser = null;
    if (stream) { stopTracks(stream); stream = null; }
    if (ctx) { const c = ctx; ctx = null; try { await c.close(); } catch (_) { /* gone */ } }
    freqDb = timeBuf = prevMag = null; bandBins = null; frames = 0; started = 0; processing = null; inputLatencyMs = null; visualLatencyMs = 0;
    /* every state that implied an open device becomes IDLE (ERROR included: it used to survive a close) */
    if (state !== AUDIO_STATE.UNAVAILABLE && state !== AUDIO_STATE.DENIED && state !== AUDIO_STATE.NODEVICE) set(AUDIO_STATE.IDLE, '');
    return state;
  }

  /** the page went away: stop the ANALYSIS (the device stays open: see the header) */
  async function suspend() { if (ctx && ctx.state === 'running') { try { await ctx.suspend(); } catch (_) { /* refused */ } } }
  async function resume() {
    if (!(ctx && ctx.state === 'suspended')) return;
    try { await ctx.resume(); } catch (_) { /* refused */ }
    fluxPrimed = false;                                           // the previous spectrum is stale: hide in quiet, return in music = a phantom onset
  }
  const setHidden = (v) => { if (v) suspend(); else if (state === AUDIO_STATE.LIVE) resume(); };

  const analysisMs = () => (ctx && ctx.sampleRate ? FFT_SIZE * 500 / ctx.sampleRate : 0);   // half the FFT window, one formula for two readers
  /** read(feedHz) — ONE measurement, the shape modFeedAudio wants; null when there is nothing to read (a zero would be a
   *  claim about silence, this would be a claim about the microphone).  feedHz must be the TRUE cadence: the model turns
   *  its followers' millisecond time constants into per-frame coefficients with it. */
  function read(feedHz) {
    if (!analyser || state !== AUDIO_STATE.LIVE) return null;
    if (ctx && ctx.state !== 'running') return null;              // suspended with the page
    analyser.getFloatTimeDomainData(timeBuf);
    analyser.getFloatFrequencyData(freqDb);
    let sum = 0;
    for (let i = 0; i < timeBuf.length; i++) { const v = timeBuf[i]; sum += v * v; }
    const rms = Math.sqrt(sum / timeBuf.length);
    /* the spectrum once, used twice: dB (and -Infinity in true silence) → linear MAGNITUDE, bands and flux off the one pass */
    const n = freqDb.length, power = [0, 0, 0], count = [0, 0, 0];
    let flux = 0, bi = 0;
    for (let i = 0; i < n; i++) {
      const db = freqDb[i], mag = db > -160 && Number.isFinite(db) ? Math.pow(10, db / 20) : 0;
      const d = mag - prevMag[i];                                 // half-wave rectified: only the RISES count (a fall is the note before it)
      if (d > 0) flux += d;
      prevMag[i] = mag;
      while (bi < bandBins.length && i > bandBins[bi].i1) bi++;
      if (bi < bandBins.length && i >= bandBins[bi].i0) { power[bi] += mag * mag; count[bi]++; }
    }
    if (!fluxPrimed) { fluxPrimed = true; flux = 0; }
    const bandPower = [count[0] ? power[0] / count[0] : 0, count[1] ? power[1] / count[1] : 0, count[2] ? power[2] / count[2] : 0];
    frames++;
    const measuredFeedHz = Number.isFinite(feedHz) && feedHz > 0 ? feedHz : 60;
    visualLatencyMs = 500 / measuredFeedHz;
    /* an analyser describes a window, not an instant: its useful centre is half a window behind the newest sample; add
       the browser-reported capture latency and half a visual interval.  An estimate: only a loopback measures it. */
    const analysisLatencyMs = analysisMs(), latencyMs = (inputLatencyMs || 0) + analysisLatencyMs + visualLatencyMs, nowS = performance.now() / 1000;
    return { feedHz: measuredFeedHz, capturedAt: nowS, now: nowS, sampleRate: ctx ? ctx.sampleRate : 0, inputLatencyMs, analysisLatencyMs,
      visualLatencyMs, latencyMs, latencyEstimated: inputLatencyMs === null, rms, bandPower, flux };
  }

  /** devices() → [{ id, label }]: the inputs this browser will name.  Labels are empty until permission is granted
   *  (the spec, not a bug), so the picker shows INPUT 1, INPUT 2 until the microphone has been allowed once. */
  async function devices() {
    try {
      const md = navigator.mediaDevices;
      if (!md || !md.enumerateDevices) return [];
      return (await md.enumerateDevices()).filter((d) => d.kind === 'audioinput').map((d, i) => ({ id: d.deviceId, label: d.label || ('INPUT ' + (i + 1)) }));   // data: the browser's own label, else a numbered name
    } catch (_) { return []; }
  }

  return {
    get state() { return state; }, get reason() { return reason; }, get live() { return state === AUDIO_STATE.LIVE; },
    get deviceId() { return deviceId; }, get frames() { return frames; }, get sampleRate() { return ctx ? ctx.sampleRate : 0; },
    get inputLatencyMs() { return inputLatencyMs; }, get analysisLatencyMs() { return analysisMs(); }, get visualLatencyMs() { return visualLatencyMs; },
    get latencyMs() { return (inputLatencyMs || 0) + analysisMs() + visualLatencyMs; }, get latencyEstimated() { return inputLatencyMs === null; },
    get upMs() { return started ? performance.now() - started : 0; },
    /** what the browser actually granted for the three voice processors, or null before a stream */
    get processing() { return processing; },
    support: audioSupport, start, stop, suspend, resume, setHidden, read, devices,
    dispose() { disposed = true; startSeq++; stop(); },
  };
}

export default createAudioCapture;
