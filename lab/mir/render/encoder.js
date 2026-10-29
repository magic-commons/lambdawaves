/* render/encoder.js — THE VIDEO ENCODER: the WebCodecs sink with the muxer, the path decision, and the preflight that proves
 * a long render will not fail at frame 9,000 (harvested from BASINS app/export.js WcSink + decideEncoderPath and
 * app/render-encoder.js verifyRenderEncoder; the laws are BASINS' and each carries its name).
 *
 *   decideEncoderPath(w, h, fps, bitrate?) → { kind:'webcodecs', codec, ext, mime, bitrate, why } | { kind:'none', why }
 *     Asks VideoEncoder.isConfigSupported down the avc1 ladder (plan.js codecCandidates) and takes the first rung that says yes.
 *     BASINS also had a MediaRecorder fallback for its non-deterministic dive film; a deterministic render cannot use it
 *     (MediaRecorder stamps wall-clock time), so the kit has none: `none` means "choose PNG frames".
 *   new WcSink(w, h, fps, codec, { bitrate, asBlob, store, resume, maxQueueSize, maxBytes, colorSpace, name, handler })
 *     add(rgba, i) → encode one frame (backpressure on the encoder's queue and the store's pending bytes)
 *     checkpoint() → flush + commit the samples so far to the store (a reload can recover them)
 *     finish() → { blob | name+blob(from the store), bytes, samples, keyFrames, bitrate }
 *     abort()
 *     EXB-7: the sink counts the frames the encoder ACCEPTED and refuses a file whose sample count differs (a dropped tail).
 *     The avcC is rebuilt from the stream's own in-band parameter sets (Firefox's delivered record lists sets the stream never uses).
 *     Timestamps are the frame index × 1e6 / fps, so the muxer recovers each frame's composition time exactly from a
 *     B-frame-reordered stream, and refuses timestamps that are not a permutation of the input.
 *   verifyEncoder(w, h, fps, path, check?) — encode two frames and DECODE them before the run (60 s timeout; memoised by
 *     size, fps, codec and bitrate).  A browser that accepts the configuration and cannot take a frame fails here, in seconds.
 *   pngBytes(rgba, w, h, canvas, ctx, colorSpace?) → Promise<Uint8Array>   one lossless frame (alpha forced opaque)
 *   1.5.6-alpha.14 · THE AUDIO SINK: decideAudioPath · verifyAudioEncoder · encodeAudio · muxAudio · peakIndex · AUDIO_LADDER (below);
 *     `sink.audio = encodeAudio(…)` puts the film's audio in the in-memory file (the store keeps it on disk: store.saveAudio). */
import { mp4Parts, mp4Build, avcCParse, avcCBuild, collectParamSets } from './mp4.js';
import { codecCandidates, pickHighBitrate } from './plan.js';

const PNG_TIMEOUT_MS = 60000, PREFLIGHT_MS = 60000;

export async function decideEncoderPath(w, h, fps, bitrate, env = globalThis) {
  if (typeof env.VideoEncoder === 'function' && typeof env.VideoFrame === 'function') {
    const want = bitrate || pickHighBitrate(w, h, fps);
    for (const codec of codecCandidates(w, h)) {
      try {
        const r = await env.VideoEncoder.isConfigSupported({ codec, width: w, height: h, bitrate: want, framerate: fps, avc: { format: 'avc' } });
        if (r && r.supported) return { kind: 'webcodecs', codec, ext: 'mp4', mime: 'video/mp4', bitrate: (r.config && r.config.bitrate) || want,
          why: 'VideoEncoder.isConfigSupported(' + codec + '): frame-exact timestamps, own muxer' };
      } catch (_) { /* try the next rung */ }
    }
    return { kind: 'none', why: 'every avc1 rung refused ' + w + '×' + h + ' at ' + fps + ' fps' };
  }
  return { kind: 'none', why: 'no VideoEncoder in this browser' };
}

export class WcSink {
  constructor(w, h, fps, codec, opts = {}) {
    this.w = w; this.h = h; this.fps = fps;
    this.asBlob = !!opts.asBlob;
    this.store = opts.store || null;
    this.name = opts.name || 'mir-render.mp4';
    this.handler = opts.handler;
    this.maxBytes = opts.maxBytes ?? Infinity; this.sampleBytes = 0;
    this.maxQueueSize = opts.maxQueueSize ?? 4;
    const resume = opts.resume || null;
    this.samples = resume ? resume.samples.map((s) => ({ ...s, data: { size: s.size } })) : [];
    this.resumeDescription = resume ? Uint8Array.from(resume.description) : null;
    this.sets = { sps: new Map(), pps: new Map() };
    this.description = null;
    this.error = null;
    this.frameUs = Math.round(1e6 / fps);
    this.added = this.samples.length;
    /* RENDER-F2: declare a wide-gamut session's frames to the encoder (P3 primaries, the sRGB transfer, RGB matrix, full
       range) so the film is not silently narrated as BT.709.  Probed once per sink: a browser that ignores or refuses the
       member keeps the default.  The app says which space it renders in (`colorSpace: 'display-p3'`). */
    this.frameColorSpace = null;
    if (opts.colorSpace === 'display-p3') {
      const cs = { primaries: 'smpte432', transfer: 'iec61966-2-1', matrix: 'rgb', fullRange: true };
      try {
        const probe = new VideoFrame(new Uint8Array(16), { format: 'RGBA', codedWidth: 2, codedHeight: 2, timestamp: 0, colorSpace: cs });
        if (probe.colorSpace && probe.colorSpace.primaries === 'smpte432') this.frameColorSpace = cs;
        probe.close();
      } catch (_) { this.frameColorSpace = null; }
    }
    this.enc = new VideoEncoder({
      output: (chunk, meta) => {
        if (this.sampleBytes + chunk.byteLength > this.maxBytes) {
          this.error = new Error('Recording reached its memory limit. Use temporary file storage over HTTPS or shorten the recording.');
          return;
        }
        this.sampleBytes += chunk.byteLength;
        const d = meta && meta.decoderConfig && meta.decoderConfig.description;
        if (d && !this.description) this.description = new Uint8Array(d.slice ? d.slice(0) : d);
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        const key = chunk.type === 'key';
        if (this.asBlob && key) collectParamSets(data, this.sets);
        if (this.store) this.store.append(data);
        this.samples.push({ data: this.store ? { size: data.length } : this.asBlob ? new Blob([data]) : data, key, ts: chunk.timestamp });
      },
      error: (e) => { this.error = e; },
    });
    this.bitrate = opts.bitrate || pickHighBitrate(w, h, fps);
    try { this.enc.configure({ codec, width: w, height: h, bitrate: this.bitrate, framerate: fps, avc: { format: 'avc' }, latencyMode: 'quality' }); }
    catch (e) { try { this.enc.close(); } catch (_) { /* gone */ } throw e; }
  }
  async add(rgba, i) {
    if (this.error) throw this.error;
    if (this.store) await this.store.throttle();
    const init = { format: 'RGBA', codedWidth: this.w, codedHeight: this.h,
      timestamp: this.asBlob ? Math.round(i * 1e6 / this.fps) : i * this.frameUs,
      duration: this.asBlob ? Math.round((i + 1) * 1e6 / this.fps) - Math.round(i * 1e6 / this.fps) : this.frameUs };
    if (this.frameColorSpace) init.colorSpace = this.frameColorSpace;
    const frame = new VideoFrame(rgba, init);
    try {
      /* a forced key every 2 s keeps the file seekable without asking the encoder to spend its whole budget on I-frames */
      this.enc.encode(frame, { keyFrame: i % (2 * this.fps) === 0 });
    } finally { frame.close(); }
    this.added++;
    while (this.enc.encodeQueueSize > this.maxQueueSize) {
      await new Promise((r) => {
        const timer = setTimeout(r, 4);
        try { this.enc.addEventListener('dequeue', () => { clearTimeout(timer); r(); }, { once: true }); } catch (_) { /* the timer poll carries it */ }
      });
      if (this.error) throw this.error;
    }
  }
  muxInfo() {
    if (this.error) throw this.error;
    if (!this.description) throw new Error('encoder produced no decoderConfig.description (avcC)');
    /* EXB-7, tail truncation: an encoder that accepts N frames and returns N-1 chunks yields a shorter permutation that the walk
       below happily passes (it normalises to samples.length).  The count is the only witness that the LAST frame made it. */
    if (this.samples.length !== this.added) throw new Error('encoder returned ' + this.samples.length + ' of ' + this.added + ' frames — the tail is missing; file refused');
    /* B-frames, measured: some encoders emit presentation-reordered chunks.  Chunks stay in DECODE order; each carries its
       composition time in muxer ticks, recovered EXACTLY because the timestamps are ours.  Every frame index must appear once. */
    const delta = Math.round(90000 / this.fps);
    const seen = new Uint8Array(this.samples.length);
    for (const s of this.samples) {
      const idx = this.asBlob ? Math.round(s.ts * this.fps / 1e6) : Math.round(s.ts / this.frameUs);
      if (!(idx >= 0 && idx < this.samples.length) || seen[idx]) throw new Error('encoder timestamps are not a permutation of the input frames (index ' + idx + ' of ' + this.samples.length + ') — file refused');
      seen[idx] = 1;
      s.cts = idx * delta;
    }
    /* The avcC is built from the stream's own in-band parameter sets when any exist, and falls back to the encoder's delivered
       description when the stream carries none (BASINS dissected Firefox's: doubled NAL headers the stream never references). */
    let description = this.description;
    const sets = this.asBlob ? this.sets : { sps: new Map(), pps: new Map() };
    if (!this.asBlob) for (const s of this.samples) if (s.key) collectParamSets(s.data, sets);
    if (sets.sps.size > 0 && sets.pps.size > 0) {
      const sps = Array.from(sets.sps.values());
      description = avcCBuild(sps[0].subarray(1, 4), sps, Array.from(sets.pps.values()));
      this.paramSetSource = 'in-band (' + sets.sps.size + ' sps, ' + sets.pps.size + ' pps)';
    } else {
      const base = avcCParse(description);
      this.paramSetSource = base ? 'encoder description (' + base.sps.length + ' sps, ' + base.pps.length + ' pps)' : 'encoder description (unparsed)';
    }
    if (this.resumeDescription && (description.length !== this.resumeDescription.length || description.some((b, i) => b !== this.resumeDescription[i])))
      throw new Error('Encoder settings changed since the checkpoint. Recover the completed frames and start a new render.');
    return { width: this.w, height: this.h, fps: this.fps, description, samples: this.samples };
  }
  async checkpoint() {
    if (!this.store) return;
    await this.enc.flush();
    const info = this.muxInfo();
    await this.store.checkpoint({ ...info, description: Array.from(info.description), samples: info.samples.map((s) => ({ size: s.data.size, key: s.key, ts: s.ts, cts: s.cts })) });
  }
  async finish() {
    await this.enc.flush();
    const info = this.muxInfo();
    try { this.enc.close(); } catch (_) { /* gone */ }
    if (this.store) {
      const file = await this.store.finish({ ...info, description: Array.from(info.description), samples: info.samples.map((s) => ({ size: s.data.size, key: s.key, ts: s.ts, cts: s.cts })) }, this.name);
      const keyFrames = this.samples.filter((s) => s.key).length;
      this.samples.length = 0;
      return { ...file, mime: 'video/mp4', ext: 'mp4', samples: this.added, keyFrames, bitrate: this.bitrate };
    }
    const o = { width: this.w, height: this.h, fps: this.fps, description: info.description, samples: this.samples, handler: this.handler, audio: muxAudio(this.audio) };
    const parts = this.asBlob ? mp4Parts(o) : null;
    const bytes = this.asBlob ? null : mp4Build(o);
    const samples = this.samples.length, keyFrames = this.samples.filter((s) => s.key).length;
    const blob = parts ? new Blob(parts, { type: 'video/mp4' }) : null;
    if (parts) this.samples.length = 0;
    return { bytes, blob, mime: 'video/mp4', ext: 'mp4', samples, keyFrames, bitrate: this.bitrate };
  }
  abort() { try { this.enc.close(); } catch (_) { /* gone */ } }
}

/** Verify actual encoder and decoder operation before a long render (BASINS render-encoder.js): two opaque frames through the
 *  shipping sink, then decoded; `check` is polled every 100 ms (a cancel or a lost device throws out of it). */
const verified = new Set();
export async function verifyEncoder(width, height, fps, path, check = () => {}) {
  const key = [width, height, fps, path.codec, path.bitrate].join(':');
  if (verified.has(key)) return;
  if (typeof VideoDecoder !== 'function') throw new Error('MP4 decoding is unavailable. Choose PNG frames.');
  let sink, decoder, timer, stopped = false;
  const alive = () => { check(); if (stopped) throw new Error('MP4 encoder check stopped'); };
  const timeout = new Promise((_, reject) => {
    const start = performance.now();
    timer = setInterval(() => {
      try { check(); if (performance.now() - start > PREFLIGHT_MS) throw new Error('MP4 encoder preflight timed out. Choose PNG frames.'); }
      catch (e) { stopped = true; reject(e); }
    }, 100);
  });
  try {
    await Promise.race([timeout, (async () => {
      sink = new WcSink(width, height, fps, path.codec, { bitrate: path.bitrate, asBlob: true });
      const pixels = new Uint8Array(width * height * 4);
      for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
      await sink.add(pixels, 0); alive(); await sink.add(pixels, 1); await sink.enc.flush(); alive();
      const info = sink.muxInfo();
      const hex = (b) => b.toString(16).padStart(2, '0');
      const codec = 'avc1.' + Array.from(info.description.subarray(1, 4), hex).join('');
      let count = 0, error;
      decoder = new VideoDecoder({ output: (frame) => { count++; frame.close(); }, error: (e) => { error = e; } });
      decoder.configure({ codec, codedWidth: width, codedHeight: height, description: info.description });
      for (const s of info.samples) {
        const data = await s.data.arrayBuffer(); alive();
        decoder.decode(new EncodedVideoChunk({ type: s.key ? 'key' : 'delta', timestamp: s.ts, data }));
      }
      await decoder.flush(); alive();
      if (error) throw error;
      if (count !== 2) throw new Error('MP4 preflight lost frames. Choose PNG frames or a smaller resolution.');
      verified.add(key);
    })()]);
  } finally {
    stopped = true; clearInterval(timer); sink?.abort();
    try { decoder?.close(); } catch (_) { /* gone */ }
  }
}

/** One lossless frame: opaque RGBA bytes → a PNG through the canvas (BASINS deterministic-export.js pngBytes), 60 s timeout. */
export async function pngBytes(rgba, w, h, canvas, ctx, colorSpace) {
  for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
  const pixels = new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length);
  ctx.putImageData(colorSpace ? new ImageData(pixels, w, h, { colorSpace }) : new ImageData(pixels, w, h), 0, 0);
  const blob = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PNG encoding timed out at ' + w + '×' + h)), PNG_TIMEOUT_MS);
    try { canvas.toBlob((b) => { clearTimeout(timer); resolve(b); }, 'image/png'); }
    catch (e) { clearTimeout(timer); reject(e); }
  });
  if (!blob || blob.type !== 'image/png') throw new Error('this browser could not encode a PNG frame');
  return new Uint8Array(await blob.arrayBuffer());
}

/* ══ THE AUDIO SINK (1.5.6-alpha.14, λWAVES 025 A3) ══════════════════════════
 *
 * The mixdown (render/audio-mix.js) is encoded once, before the first frame, from the same PCM the WAV would hold:
 *   decideAudioPath(sampleRate?, channels?) → { kind: 'audio', codec, label, bitrate, sampleRate, channels, ladder, why } | { kind: 'none', why }
 *     AudioEncoder.isConfigSupported down the ladder — AAC-LC 256 k, then Opus 192 k, both 48 kHz stereo — asked, never assumed
 *     (AAC is absent in Firefox and in every browser on Linux, so a Linux film carries Opus-in-MP4; RESEARCH 025 §2).
 *   verifyAudioEncoder(path, check?) → priming    the preflight: an impulse at sample 24000 of one second is ENCODED and DECODED,
 *     and the onset's index − 24000 is the codec's delay on this machine (memoised by codec, rate and channels, as verifyEncoder
 *     is).  WebCodecs states no priming (a first chunk is stamped 0), so it is measured: AAC 1024–2112 by encoder.
 *   encodeAudio(mix, path, check?) → { codec, label, sampleRate, channels, description, samples: [{ data, dur }], priming, frames,
 *     bitrate, packetsOk }  the film's audio: AudioData timestamps are integer µs from the SAMPLE INDEX (never float seconds),
 *     each packet's `dur` an integer sample count; a tail of silence (two packets) lets the encoder's last packets cover every valid
 *     sample past its delay, and a file whose packets do not cover priming + N is refused.  `priming` is the OpusHead pre-skip
 *     when the encoder hands one (bytes 10–11), else the measured delay.  Back-pressure as the video's (the queue ≤ 8).
 * The muxer takes the result verbatim as `mp4Parts({ audio })`; the store keeps it beside the video (store.saveAudio). */
export const AUDIO_LADDER = Object.freeze([{ codec: 'mp4a.40.2', label: 'AAC', bitrate: 256000 }, { codec: 'opus', label: 'Opus', bitrate: 192000 }]);
const audioConfig = (p, sampleRate, numberOfChannels) => ({ codec: p.codec, sampleRate, numberOfChannels, bitrate: p.bitrate });
const bytesOfView = (d) => (d instanceof Uint8Array ? d.slice() : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength)) : new Uint8Array(d.slice(0)));
const nextDequeue = (coder) => new Promise((r) => {
  const timer = setTimeout(r, 4);
  try { coder.addEventListener('dequeue', () => { clearTimeout(timer); r(); }, { once: true }); } catch (_) { /* the timer poll carries it */ }
});

export async function decideAudioPath(sampleRate = 48000, channels = 2, env = globalThis) {
  if (typeof env.AudioEncoder !== 'function' || typeof env.AudioData !== 'function') return { kind: 'none', why: 'no AudioEncoder in this browser' };
  const ladder = [];
  for (const rung of AUDIO_LADDER) {
    let ok = false;
    try { const r = await env.AudioEncoder.isConfigSupported(audioConfig(rung, sampleRate, channels)); ok = !!(r && r.supported); } catch (_) { /* the next rung */ }
    ladder.push(rung.label + (ok ? ' yes' : ' no'));
    if (ok) return { kind: 'audio', ...rung, sampleRate, channels, ladder: ladder.join(' · '), why: 'AudioEncoder.isConfigSupported(' + rung.codec + ', ' + sampleRate + ' Hz)' };
  }
  return { kind: 'none', why: 'every audio rung refused (' + ladder.join(' · ') + ')' };
}

/** PCM (planar Float32, `n` valid samples, then `tail` samples of silence) → encoded packets and the decoder's description */
async function encodePcm(channels, n, tail, path, check = () => {}) {
  const sr = path.sampleRate, ch = channels.length, pkt = path.codec === 'opus' ? Math.round(sr / 50) : 1024;
  const samples = [];
  let description = null, error = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => {
      const d = meta && meta.decoderConfig && meta.decoderConfig.description;
      if (d && !description) description = bytesOfView(d);
      const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data);
      samples.push({ data, ts: chunk.timestamp, dur: chunk.duration ? Math.round(chunk.duration * sr / 1e6) : pkt });
    },
    error: (e) => { error = e; },
  });
  try {
    enc.configure(audioConfig(path, sr, ch));
    const B = 4800, total = n + tail;
    for (let s = 0; s < total; s += B) {
      if (error) throw error; check();
      const m = Math.min(B, total - s), buf = new Float32Array(m * ch);
      if (s < n) for (let c = 0; c < ch; c++) buf.set(channels[c].subarray(s, Math.min(n, s + m)), c * m);
      const data = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: m, numberOfChannels: ch, timestamp: Math.round(s * 1e6 / sr), data: buf });
      try { enc.encode(data); } finally { data.close(); }
      while (enc.encodeQueueSize > 8) { await nextDequeue(enc); if (error) throw error; }
    }
    await enc.flush();
    if (error) throw error;
  } finally { try { enc.close(); } catch (_) { /* gone */ } }
  if (!samples.length) throw new Error('The audio encoder returned nothing. Turn AUDIO off, or choose PNG frames (the audio is a WAV beside them).');
  return { samples, description, pkt };
}

/** encoded packets → the decoded first channel (the decoder this browser ships, configured as a player would be) */
async function decodeFirstChannel(enc, path, check = () => {}) {
  if (typeof AudioDecoder !== 'function') throw new Error('Audio decoding is unavailable here, so the audio cannot be proven. Turn AUDIO off.');
  const parts = [];
  let error = null, total = 0;
  const dec = new AudioDecoder({
    output: (a) => { const x = new Float32Array(a.numberOfFrames); a.copyTo(x, { planeIndex: 0, format: 'f32-planar' }); parts.push(x); total += x.length; a.close(); },
    error: (e) => { error = e; },
  });
  try {
    const cfg = { codec: path.codec, sampleRate: path.sampleRate, numberOfChannels: path.channels };
    if (enc.description) cfg.description = enc.description;
    dec.configure(cfg);
    let at = 0;
    for (const s of enc.samples) {
      check();
      dec.decode(new EncodedAudioChunk({ type: 'key', timestamp: Math.round(at * 1e6 / path.sampleRate), duration: Math.round(s.dur * 1e6 / path.sampleRate), data: s.data }));
      at += s.dur;
    }
    await dec.flush();
    if (error) throw error;
  } finally { try { dec.close(); } catch (_) { /* gone */ } }
  const out = new Float32Array(total);
  let p = 0; for (const x of parts) { out.set(x, p); p += x.length; }
  return out;
}
/** the index of the loudest sample in [from, to) — an onset of a click the decoder hands back */
export function peakIndex(x, from = 0, to = x.length) {
  let best = -1, at = -1;
  for (let i = Math.max(0, from); i < Math.min(to, x.length); i++) { const v = Math.abs(x[i]); if (v > best) { best = v; at = i; } }
  return at;
}

const primings = new Map();
export async function verifyAudioEncoder(path, check = () => {}) {
  const key = [path.codec, path.sampleRate, path.channels, path.bitrate].join(':');
  if (primings.has(key)) return primings.get(key);
  const n = path.sampleRate, at = n / 2, pcm = Array.from({ length: path.channels }, () => new Float32Array(n));
  for (const c of pcm) c[at] = 0.8;
  const enc = await encodePcm(pcm, n, 4096, path, check);
  if (enc.samples.length < 2) throw new Error('The audio preflight returned fewer than two packets. Turn AUDIO off.');
  const decoded = await decodeFirstChannel(enc, path, check);
  const priming = peakIndex(decoded) - at;
  if (!(decoded.length >= n) || !(priming >= 0 && priming < 8192)) throw new Error('The audio preflight could not find its impulse (' + priming + '). Turn AUDIO off.');
  const r = { priming, head: opusPreSkip(enc.description), packets: enc.samples.length };
  primings.set(key, r);
  return r;
}
const opusPreSkip = (d) => (d && d.length >= 19 && String.fromCharCode(...d.subarray(0, 8)) === 'OpusHead' ? d[10] | (d[11] << 8) : null);

export async function encodeAudio(mix, path, check = () => {}) {
  const proof = await verifyAudioEncoder(path, check);
  const enc = await encodePcm(mix.channels, mix.frames, 2 * (path.codec === 'opus' ? 960 : 1024), path, check);
  const head = opusPreSkip(enc.description);
  const priming = path.codec === 'opus' && head != null ? head : proof.priming;
  const covered = enc.samples.reduce((n, s) => n + s.dur, 0);
  if (covered < priming + mix.frames) throw new Error('The audio encoder returned ' + covered + ' samples, fewer than its delay and the film (' + (priming + mix.frames) + '). Turn AUDIO off.');
  return { codec: path.codec, label: path.label, sampleRate: path.sampleRate, channels: path.channels, description: enc.description, samples: enc.samples,
    priming, primingMeasured: proof.priming, frames: mix.frames, bitrate: path.bitrate, clips: mix.clips || [] };
}

/** the film's audio as the muxer (or the store's manifest) takes it */
export const muxAudio = (a) => (a ? { codec: a.codec, sampleRate: a.sampleRate, channels: a.channels, description: a.description, samples: a.samples, priming: a.priming, frames: a.frames } : undefined);
