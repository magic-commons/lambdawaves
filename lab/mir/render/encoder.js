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
 *   pngBytes(rgba, w, h, canvas, ctx, colorSpace?) → Promise<Uint8Array>   one lossless frame (alpha forced opaque) */
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
    const o = { width: this.w, height: this.h, fps: this.fps, description: info.description, samples: this.samples, handler: this.handler };
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
