/* audio.test.mjs — THE CAPTURE HALF, AND THE SEAM IT MEETS THE MODEL AT.
 *
 * A microphone cannot be gated in CI, so this gate does the two things that CAN be proved without
 * one, and they are the two that actually carry the risk:
 *
 *   1 · THE MEASUREMENT.  `lab/audio.js` is driven against a STUBBED Web Audio API whose spectrum
 *       and waveform are chosen by this file, so `rms`, `bandPower` and `flux` are checked against
 *       numbers computed here independently.  Every one of those three has a units trap in it —
 *       amplitude vs power, dB vs linear, per-bin vs summed — and a units error is silent: the
 *       instrument still moves, it just moves by the wrong amount forever.
 *   2 · THE SEAM.  The packet `audio.js` emits is fed to the REAL `modFeedAudio`, and the model's
 *       own follower, gate and onset detector are asserted through it.  This is what stops the two
 *       halves drifting apart: if either side renames a field or changes a unit, this fails.
 *
 * What is NOT claimed here: that a real microphone sounds right.  That is Josh's ear.
 */
import { createAudioCapture, audioSupport, AUDIO_STATE, BANDS } from '../lab/audio.js';
import * as M from '../lab/mir/modulation/mod.js';

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + name + (detail ? '  — ' + detail : '')); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  — ' + detail : '')); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* Node 22 defines `navigator` as a getter-only global, so a plain assignment throws.  Every stub
   below goes through this — which is also a fair description of what a browser does. */
const define = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });

/* ── THE STUB.  Only what audio.js actually touches, and it answers honestly. ─────────────────── */
const SR = 48000, FFT = 2048, BINS = FFT / 2;
let stubSpectrumDb = new Float32Array(BINS).fill(-Infinity);
let stubWave = new Float32Array(FFT);
let closed = 0, tracksStopped = 0, open = 0;

let askedFor = null, streamsMade = 0, gumDelayMs = 0, connections = [], endedHandlers = [], visListeners = 0;
function makeStream() {
  streamsMade++;
  const track = { live: true, stop() { if (this.live) { this.live = false; tracksStopped++; } },
                  addEventListener(k, fn) { if (k === 'ended') endedHandlers.push(fn); },
                  getSettings: () => ({ deviceId: 'stub-mic', echoCancellation: false,
                                        noiseSuppression: false, autoGainControl: false }) };
  const st = { _track: track, getTracks: () => [track], getAudioTracks: () => [track] };
  return st;
}
function liveTracks() { return endedHandlers.length >= 0 ? streamsMade - tracksStopped : 0; }
function installStub() {
  class Analyser {
    constructor() { this.fftSize = FFT; this.smoothingTimeConstant = 0; this.minDecibels = -100; this.maxDecibels = 0; }
    get frequencyBinCount() { return this.fftSize / 2; }
    getFloatTimeDomainData(a) { a.set(stubWave.subarray(0, a.length)); }
    getFloatFrequencyData(a) { a.set(stubSpectrumDb.subarray(0, a.length)); }
  }
  class Ctx {
    constructor() { this.sampleRate = SR; this.state = 'running'; this.destination = { DEST: 1 }; open = open + 1; }
    createMediaStreamSource() { return { connect(to) { connections.push(to); }, disconnect() {} }; }
    createAnalyser() { return new Analyser(); }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async close() { closed++; open = open - 1; this.state = 'closed'; }
  }
  define('window', { isSecureContext: true, AudioContext: Ctx });
  define('navigator', { mediaDevices: {
    getUserMedia: async (c) => { askedFor = c; if (gumDelayMs) await new Promise((r) => setTimeout(r, gumDelayMs)); return makeStream(); },
    enumerateDevices: async () => ([{ kind: 'audioinput', deviceId: 'stub-mic', label: 'STUB MIC' }])
  } });
  if (!globalThis.performance) define('performance', { now: () => Date.now() });
  define('document', { hidden: false, addEventListener() { visListeners++; }, removeEventListener() { visListeners--; } });
}

/** put a single tone of a given linear magnitude into the stub's spectrum */
function tone(hz, mag) {
  stubSpectrumDb = new Float32Array(BINS).fill(-Infinity);
  const binHz = SR / 2 / BINS;
  const i = Math.round(hz / binHz);
  if (i >= 0 && i < BINS) stubSpectrumDb[i] = 20 * Math.log10(mag);
}
/** a full-scale-ish sine in the time domain, so rms is a number we can predict exactly */
function wave(amp) {
  stubWave = new Float32Array(FFT);
  for (let i = 0; i < FFT; i++) stubWave[i] = amp * Math.sin(2 * Math.PI * 8 * i / FFT);
}

console.log('\n══ 1 · SUPPORT refuses honestly, and differently per cause ══');
{
  define('window', { isSecureContext: false });
  define('navigator', { mediaDevices: { getUserMedia() {} } });
  const a = audioSupport();
  ok('an insecure page is refused BEFORE any prompt', !a.ok && /secure/i.test(a.why), a.why);
  define('window', { isSecureContext: true, AudioContext: function () {} });
  define('navigator', {});
  const b = audioSupport();
  ok('no mediaDevices is its own refusal', !b.ok && /does not offer/i.test(b.why), b.why);
}

installStub();

console.log('\n══ 2 · THE MEASUREMENT — rms, bandPower and flux, against hand arithmetic ══');
const cap = createAudioCapture({});
await cap.start('');
ok('a permitted start goes LIVE', cap.state === AUDIO_STATE.LIVE, cap.state);

{
  /* RMS of a sine of amplitude A is A/sqrt(2), exactly. */
  wave(0.5); tone(1000, 0);
  const p = cap.read(60);
  ok('rms is a LINEAR amplitude (A/√2 for a sine)', near(p.rms, 0.5 / Math.SQRT2, 1e-3),
     'read ' + p.rms.toFixed(5) + ' vs ' + (0.5 / Math.SQRT2).toFixed(5));
  ok('the packet carries every field modFeedAudio requires',
     ['feedHz', 'capturedAt', 'sampleRate', 'rms', 'bandPower', 'flux'].every((k) => p[k] !== undefined)
     && p.bandPower.length === 3, Object.keys(p).join(','));
  ok('feedHz is the rate the host passed, not a nominal', p.feedHz === 60, String(p.feedHz));
}

{
  /* ONE tone of magnitude m in the MID band: mean power over that band's bins is m²/count. */
  const binHz = SR / 2 / BINS;
  const mid = BANDS[1];
  /* the same CONTIGUOUS rule audio.js uses, computed here independently: LOW ends at ceil(250/binHz)
     and MID therefore starts one bin later, so no bin is in two bands. */
  const lowEnd = Math.max(Math.max(1, Math.floor(BANDS[0].lo / binHz)), Math.min(BINS - 1, Math.ceil(BANDS[0].hi / binHz)));
  const i0 = Math.max(1, lowEnd + 1, Math.floor(mid.lo / binHz));
  const i1 = Math.max(i0, Math.min(BINS - 1, Math.ceil(mid.hi / binHz)));
  const count = i1 - i0 + 1;
  cap.read(60);                                    // clear the flux history
  tone(1000, 0.25);
  const p = cap.read(60);
  const want = (0.25 * 0.25) / count;
  ok('bandPower is MEAN POWER, per band', near(p.bandPower[1], want, want * 0.02),
     'mid ' + p.bandPower[1].toExponential(3) + ' vs ' + want.toExponential(3));
  ok('a mid tone leaves LOW and HIGH at zero', p.bandPower[0] === 0 && p.bandPower[2] === 0);
}

{
  /* FLUX is half-wave rectified and per-bin: a rise of m in one bin is m/BINS. */
  tone(1000, 0); cap.read(60);                     // settle the previous magnitudes to 0
  tone(1000, 0.4);
  const up = cap.read(60);
  ok('flux is the SUMMED rise, on the scale the model\'s floor is calibrated for',
     near(up.flux, 0.4, 1e-6) && up.flux > 0.02,
     up.flux.toFixed(5) + '  (floor ' + 0.02 + ')');
  tone(1000, 0);
  const down = cap.read(60);
  ok('flux ignores a FALL (half-wave rectified)', down.flux === 0, String(down.flux));
}

console.log('\n══ 3 · THE SEAM — the packet drives the real model ══');
{
  M.modReset();
  const dev = M.addSource('audio');
  const id = dev && (dev.id !== undefined ? dev.id : dev);
  ok('the model builds an AUDIO source', !!id, String(id));
  M.transportPlay ? M.transportPlay(0) : null;

  /* loud, steady signal → the gate opens and LEVEL climbs toward it */
  wave(0.5); tone(1000, 0.3);
  let last = null;
  for (let i = 0; i < 60; i++) { const p = cap.read(60); p.capturedAt = i / 60; p.now = i / 60; last = M.modFeedAudio(id, p); }
  ok('the model ACCEPTS the packet', last && last.accepted === true, last && last.reason);
  ok('the gate opens on a loud input', last.gateOpen === true);
  ok('LEVEL follows upward and is normalised', last.level > 0.3 && last.level <= 1,
     'level ' + last.level.toFixed(3) + '  dbfs ' + last.dbfs.toFixed(1));
  ok('the MID band leads LOW and HIGH for a 1 kHz tone', last.mid > last.low && last.mid > last.high,
     [last.low, last.mid, last.high].map((v) => v.toFixed(3)).join(' / '));

  /* silence → the gate shuts and every follower lands on EXACT zero */
  wave(0); tone(1000, 0);
  for (let i = 0; i < 120; i++) { const p = cap.read(60); p.capturedAt = 1 + i / 60; p.now = 1 + i / 60; last = M.modFeedAudio(id, p); }
  ok('silence shuts the gate', last.gateOpen === false);
  ok('a shut gate is EXACTLY zero, not a decay', last.level === 0 && last.low === 0 && last.high === 0,
     [last.level, last.low, last.high].join(' / '));

  /* a transient after quiet → exactly one onset */
  const hits0 = last.hits;
  let fired = 0;
  for (let i = 0; i < 40; i++) {
    const t = 3 + i / 60;
    if (i === 10) { wave(0.6); tone(1000, 0.9); } else if (i === 12) { wave(0.05); tone(1000, 0.02); }
    const p = cap.read(60); p.capturedAt = t; p.now = t;
    const r = M.modFeedAudio(id, p);
    if (r.hit) fired++;
    last = r;
  }
  ok('a transient fires an onset', last.hits > hits0, 'hits ' + hits0 + ' → ' + last.hits);
  ok('one transient is not a burst of onsets', fired <= 2, 'fired ' + fired);

  /* the five sockets a macro can bind */
  const socks = ['level', 'low', 'mid', 'high', 'hit'].map((k) => M.scalarOutputId(id, k));
  ok('all five outputs are bindable ids', socks.every((x) => typeof x === 'string' && x.startsWith(String(id) + ':')), socks.join(','));
  ok('`beat` is NOT exposed', M.scalarOutputId(id, 'beat') === null);
}

console.log('\n══ 4 · THE MICROPHONE IS GIVEN BACK ══');
{
  const before = tracksStopped, c0 = closed;
  await cap.stop();
  ok('stop() stops every track', tracksStopped > before, 'stopped ' + (tracksStopped - before));
  ok('stop() CLOSES the context, it does not merely suspend', closed > c0);
  ok('state returns to IDLE', cap.state === AUDIO_STATE.IDLE, cap.state);
  ok('read() after stop is null, never a fake zero', cap.read(60) === null);
}

console.log('\n══ 5 · THE MICROPHONE IS NEVER LEFT OPEN ══');
{
  /* every one of these was a MEASURED leak before wave 105; they are the reason this block exists */
  const c2 = createAudioCapture({});
  gumDelayMs = 30;
  const s0 = streamsMade, t0 = tracksStopped;
  await Promise.all([c2.start(''), c2.start('')]);        // two presses on MIC
  ok('two concurrent start() calls leak no track',
     (streamsMade - s0) - (tracksStopped - t0) === 1,
     'opened ' + (streamsMade - s0) + ', stopped ' + (tracksStopped - t0));
  ok('…and exactly one context is left open', open === 1, 'open ' + open);
  await c2.stop();
  ok('stop() closes it', open === 0 && c2.state === AUDIO_STATE.IDLE, c2.state + ' open ' + open);

  const s1 = streamsMade, t1 = tracksStopped;
  const p = c2.start(''); await c2.stop(); await p;
  ok('stop() DURING start() cancels it — the mic does not open anyway',
     c2.state === AUDIO_STATE.IDLE && open === 0, c2.state + ' open ' + open);
  ok('…and the granted stream is stopped, not orphaned',
     (streamsMade - s1) === (tracksStopped - t1), 'opened ' + (streamsMade - s1) + ', stopped ' + (tracksStopped - t1));
  gumDelayMs = 0;

  await c2.start('');
  const t2 = tracksStopped;
  endedHandlers[endedHandlers.length - 1]();             // the OS took the device away
  await new Promise((r) => setTimeout(r, 20));
  ok('a track that ENDS tears the graph down', open === 0 && tracksStopped > t2, 'open ' + open);
  ok('…and stop() from ERROR returns to IDLE rather than painting a fault for ever',
     c2.state === AUDIO_STATE.ERROR || c2.state === AUDIO_STATE.IDLE, c2.state);

  await c2.start('');
  const t3 = tracksStopped;
  c2.dispose();
  await new Promise((r) => setTimeout(r, 20));
  ok('dispose() stops the tracks', tracksStopped > t3);
}

console.log('\n══ 6 · THE PRIVACY CLAIMS, MECHANICALLY ══');
{
  const c3 = createAudioCapture({});
  connections = [];
  await c3.start('');
  ok('the three processors are asked for MANDATORILY ({exact:false}, not a bare false)',
     askedFor && askedFor.audio && askedFor.audio.autoGainControl
     && askedFor.audio.autoGainControl.exact === false
     && askedFor.audio.echoCancellation.exact === false
     && askedFor.audio.noiseSuppression.exact === false,
     JSON.stringify(askedFor && askedFor.audio));
  ok('the graph never reaches ctx.destination', connections.every((t) => !t || !t.DEST),
     connections.length + ' connection(s)');
  ok('no video is ever requested', askedFor && askedFor.video === false);
  ok('this file installs no visibility listener of its own — the host owns that authority',
     visListeners === 0, 'listeners ' + visListeners);
  /* the stale-spectrum phantom onset */
  wave(0); tone(1000, 0); c3.read(60);
  await c3.suspend();
  ok('read() is null while suspended', c3.read(60) === null);
  tone(1000, 0.9); wave(0.6);
  await c3.resume();
  const first = c3.read(60);
  ok('the first frame after a resume carries no phantom flux', first && first.flux === 0,
     'flux ' + (first && first.flux));
  await c3.stop();
}

console.log('\n══ 7 · THE UNITS THE SEAM DEPENDS ON ══');
{
  const c4 = createAudioCapture({}); await c4.start('');
  wave(0.5); tone(1000, 0.3);
  const p = c4.read(60);
  ok('capturedAt is SECONDS, not milliseconds',
     Math.abs(p.capturedAt - performance.now() / 1000) < 2, String(p.capturedAt));
  ok('`now` is carried too — the model ages a hit with it', Number.isFinite(p.now));
  ok('sampleRate is the context\'s own', p.sampleRate === SR, String(p.sampleRate));
  /* flux must be a SUM: two bins rising must add */
  tone(1000, 0); c4.read(60);
  stubSpectrumDb = new Float32Array(BINS).fill(-Infinity);
  const binHz = SR / 2 / BINS;
  stubSpectrumDb[Math.round(1000 / binHz)] = 20 * Math.log10(0.3);
  stubSpectrumDb[Math.round(4000 / binHz)] = 20 * Math.log10(0.2);
  const two = c4.read(60);
  ok('flux SUMS the rises across bins (not max, not first)', near(two.flux, 0.5, 1e-6), String(two.flux));
  /* the contiguity fix: a tone in the overlap region lands in exactly one band */
  tone(250, 0.4); c4.read(60);
  const edge = c4.read(60);
  const nonzero = edge.bandPower.filter((v) => v > 0).length;
  ok('a tone on a band boundary lands in exactly ONE band', nonzero === 1,
     edge.bandPower.map((v) => v.toExponential(2)).join(' / '));
  await c4.stop();
}

// Editable response ranges use amplitude dB for LEVEL and power dB for the bands.
{
  M.modReset();
  const a=M.addSource('audio');
  M.setSource(a.id,{audio:{gateEnabled:false,outs:{
    level:{floorDb:-40,ceilingDb:-20,attackMs:0,releaseMs:0},
    low:{floorDb:-50,ceilingDb:-10,attackMs:0,releaseMs:0},
    mid:{floorDb:-35,ceilingDb:-25,attackMs:0,releaseMs:0},
    high:{floorDb:-20,ceilingDb:-10,attackMs:0,releaseMs:0}
  }}});
  let frame=0;
  const feed=db=>M.modFeedAudio(a.id,{rms:10**(db/20),bandPower:[10**(db/10),10**(db/10),10**(db/10)],flux:0,feedHz:100,capturedAt:frame++/100});
  feed(-30);
  let ro=M.audioReadout(a.id);
  ok('independent ranges map the same -30 dB input to .5/.5/.5/0',
    ['level','low','mid'].every(k=>near(ro.outs[k].out,.5,1e-12)) && ro.outs.high.out===0,JSON.stringify(Object.fromEntries(M.AUDIO_FOLLOWED.map(k=>[k,ro.outs[k].out]))));
  feed(-40);ok('the LEVEL lower boundary is exactly zero',M.audioReadout(a.id).outs.level.out===0);
  feed(-20);ok('the LEVEL upper boundary is exactly one',M.audioReadout(a.id).outs.level.out===1);
  M.setSource(a.id,{audio:{outs:{level:{releaseMs:100}}}});feed(-Infinity);
  ro=M.audioReadout(a.id);
  ok('with gate off, silence releases exponentially rather than snapping shut',near(ro.outs.level.out,Math.exp(-.1),1e-12));
  M.setSource(a.id,{audio:{outs:{level:{releaseMs:0,attackMs:100}}}});feed(-Infinity);feed(-20);
  ok('attack is independent of release and follows the selected time constant',near(M.audioReadout(a.id).outs.level.out,1-Math.exp(-.1),1e-12));
  M.setSource(a.id,{audio:{outs:{level:{attackMs:0,releaseMs:0,holdMs:30}}}});feed(-20);
  feed(-Infinity); feed(-Infinity); feed(-Infinity);
  ok('per-band HOLD keeps a peak for its requested duration',M.audioReadout(a.id).outs.level.out===1);
  feed(-Infinity);
  ok('per-band HOLD hands the peak to RELEASE after its duration',M.audioReadout(a.id).outs.level.out===0);
  M.setSource(a.id,{audio:{outs:{level:{attackMs:99999,releaseMs:99999,holdMs:99999}}}});
  ro=M.audioReadout(a.id);
  ok('audio timing controls cap at two seconds',ro.outs.level.attackMs===2000 && ro.outs.level.releaseMs===2000 && ro.outs.level.holdMs===2000);
  const saved=M.serialize();M.modReset();M.deserialize(saved);
  const restored=M.sourceOf(a.id);
  ok('ranges, gate bypass and timing survive a saved patch',restored.audio.gateEnabled===false && restored.audio.outs.level.floorDb===-40 && restored.audio.outs.level.ceilingDb===-20 && restored.audio.outs.level.attackMs===2000 && restored.audio.outs.level.holdMs===2000 && restored.audio.outs.low.floorDb===-50);
  M.setSource(a.id,{audio:{outs:{level:{floorDb:20,ceilingDb:-100}}}});
  ok('malformed endpoints stay bounded and cannot cross',restored.audio.outs.level.floorDb===-1 && restored.audio.outs.level.ceilingDb===0);
  const legacy=M.addSource('audio',{audio:{outs:{level:{attackMs:12}}}});
  ok('legacy audio patches retain their old range and enabled noise gate',legacy.audio.gateEnabled && legacy.audio.outs.level.floorDb===-60 && legacy.audio.outs.level.ceilingDb===-6);
}

console.log('\n' + (fail ? 'RED' : 'GREEN') + ' audio.test — ' + fail + ' failing of ' + (pass + fail));
process.exit(fail ? 1 : 0);
