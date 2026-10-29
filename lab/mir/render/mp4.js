/* render/mp4.js — THE MP4 MUXER: a minimal ISO-BMFF writer for one avc1 video track (harvested from BASINS app/exportcore.js,
 * 2026-10-05, byte for byte but for the handler name).  WebCodecs hands over AVCC samples and the encoder's avcC record, so
 * muxing is honest bookkeeping: ftyp + moov (the index) + mdat (the samples, verbatim).  Faststart layout, 90000 timescale
 * (24/30/48/60 fps all divide it), B-frame reordering written as the classic ctts + elst pair, `largeFile` for a co64 beyond
 * 4 GB, `headersOnly` for a recovery that streams the payload from disk.  Pure: no DOM, imports nothing, node runs it.
 *
 *   mp4Parts({ width, height, fps, description, samples:[{ data, key, cts? }], largeFile?, headersOnly?, handler? }) → [Uint8Array…]
 *   mp4Build(o) → Uint8Array          the same, joined
 *   avcCParse(desc) · avcCBuild(profile, sps, pps) · collectParamSets(sample, { sps, pps })   the avcC surgery (in-band sets)
 *   mp4Parse(bytes)                   a structural reader for gates; never used by the app itself (`.tracks`, `.movie`: every trak)
 *   MP4_TIMESCALE
 *   1.5.6-alpha.12 · THE AUDIO TRACK: `audio: { codec: 'mp4a.40.2' | 'opus', sampleRate, channels, description, samples:[{ data, dur }],
 *     priming?, frames? }` adds a second trak (mp4a + esds or Opus + dOps), its priming as the edit list's media_time AND a roll
 *     group, chunks interleaved with the video by the half second; without it the file is byte for byte the one-track file.
 * The `handler` name inside the file (the hdlr box) is an option (default "MIR video"): BASINS passes its own. */

/* ══ THE MP4 MUXER — minimal ISO-BMFF, one avc1 video track ════════════════
 *
 * Input: WebCodecs EncodedVideoChunks in AVCC form (`avc: { format: 'avc' }`
 * — length-prefixed NAL units, exactly what an mp4 sample IS) plus the
 * encoder's decoderConfig.description (the AVCDecoderConfigurationRecord,
 * exactly what the avcC box IS).  So "muxing" here is honest bookkeeping:
 * ftyp + moov (the index) + mdat (the chunks, concatenated verbatim).
 *
 * Layout is faststart (moov before mdat) so a downloaded file streams.  The
 * one circularity — stco's chunk offset depends on moov's size — is closed by
 * building moov once with a placeholder and patching the u32, whose WIDTH
 * (unlike its value) is fixed.
 *
 * TIMESCALE 90000: 24/30/48/60 fps all divide it exactly (3750/3000/1875/
 * 1500 tick frames), so duration arithmetic is integer-exact for every fps
 * the window offers — no drift for ffprobe to flag.
 *
 * B-FRAMES ARE REAL AND HANDLED, because the rig measured them: Firefox 153's
 * H.264 encoder emits presentation-reordered chunks (IBBP — first pts seen:
 * 0, 166668, 83334, 41667 µs) in BOTH latency modes, so "no B-frames by
 * configuration" is not a law any window can promise.  Samples stay in
 * DECODE (arrival) order with a uniform dts cadence; each carries its
 * composition time (`cts`, ticks), and when any cts differs from its dts the
 * muxer writes the classic pair every x264 file carries: a version-0 `ctts`
 * with a constant shift making every offset non-negative, plus an `elst`
 * whose media_time trims that lead-in back off the timeline.  A stream that
 * arrives monotone (cts == dts throughout) gets NEITHER box — the clean case
 * stays clean.
 *
 * LIMITS, stated: u32 box sizes (no file over ~4 GB — the driver aborts far
 * earlier), one track, no audio — until 1.5.6-alpha.12: an `audio` option
 * adds the second trak (THE AUDIO TRACK, below).
 */
export const MP4_TIMESCALE = 90000;

class ByteWriter {
  constructor() { this.chunks = []; this.length = 0; }
  bytes(u8) { this.chunks.push(u8); this.length += u8.length; return this; }
  u8(v) { return this.bytes(new Uint8Array([v & 0xff])); }
  u16(v) { return this.bytes(new Uint8Array([(v >>> 8) & 0xff, v & 0xff])); }
  u32(v) {
    return this.bytes(new Uint8Array([(v >>> 24) & 0xff, (v >>> 16) & 0xff,
                                      (v >>> 8) & 0xff, v & 0xff]));
  }
  i16(v) { return this.u16(v < 0 ? v + 0x10000 : v); }
  str(s) {
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
    return this.bytes(b);
  }
  zeros(n) { return this.bytes(new Uint8Array(n)); }
  out() {
    const all = new Uint8Array(this.length);
    let o = 0;
    for (const c of this.chunks) { all.set(c, o); o += c.length; }
    return all;
  }
}

/** One box: type + payload builder, returns Uint8Array with the size filled. */
function box(type, fill) {
  const w = new ByteWriter();
  w.u32(0).str(type);
  fill(w);
  const b = w.out();
  const dv = new DataView(b.buffer, b.byteOffset, 4);
  dv.setUint32(0, b.length);
  return b;
}

const MATRIX_IDENTITY = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];

/**
 * Build the whole file.
 *   o.width / o.height   coded size (even)
 *   o.fps                one of 24/30/48/60 (any divisor of 90000 works)
 *   o.description        Uint8Array — the AVCDecoderConfigurationRecord
 *   o.samples            [{ data: Uint8Array, key: bool, cts?: ticks }] in
 *                        DECODE order; cts defaults to the decode time (no
 *                        reordering) when absent
 * Returns Uint8Array — the .mp4.
 */
export function mp4Parts(o) {
  const N = o.samples.length;
  if (!N) throw new Error('mp4Build: no samples');
  if (!(o.description instanceof Uint8Array) || o.description.length < 7) {
    throw new Error('mp4Build: missing avcC description');
  }
  const delta = Math.round(MP4_TIMESCALE / o.fps);
  const duration = N * delta;

  /* composition offsets: cts − dts, then the constant shift that makes the
     most negative one zero (see the B-frame essay above).  All-zero offsets
     mean a monotone stream and no ctts/elst at all. */
  const offs = new Array(N);
  let minOff = 0, anyOff = false;
  for (let i = 0; i < N; i++) {
    const dts = i * delta;
    const cts = (o.samples[i].cts === undefined) ? dts : o.samples[i].cts;
    offs[i] = cts - dts;
    if (offs[i] !== 0) anyOff = true;
    if (offs[i] < minOff) minOff = offs[i];
  }
  const shift = -minOff;                         // ≥ 0
  const useCtts = anyOff || shift > 0;
  let mdatPayload = 0;
  for (const s of o.samples) mdatPayload += s.data.length ?? s.data.size;
  /* THE AUDIO TRACK (1.5.6-alpha.12): a second trak, its chunks interleaved with the video's by time (see the essay below) */
  const A = o.audio ? audioPlan(o.audio) : null;
  const lay = A ? interleave(o.samples.length, o.fps, A) : null;
  if (A) mdatPayload += A.bytes;
  const large = !!o.largeFile;
  if (!Number.isSafeInteger(mdatPayload) || duration > 0xffffffff) throw new Error('MP4 duration or file size exceeds the supported range');
  if (!large && mdatPayload + 1e6 > 0xfffffff0) throw new Error('mp4Build: over the u32 box limit');

  const ftyp = box('ftyp', (w) => {
    w.str('isom').u32(0x200).str('isom').str('iso2').str('avc1').str('mp41');
  });

  const keys = [];
  for (let i = 0; i < N; i++) if (o.samples[i].key) keys.push(i + 1);

  /* stco's offset is patched after moov's size is known; remember where. */
  let stcoPatchAt = -1;

  const buildMoov = (vOff, aOff) => {
    const stbl = box('stbl', (w) => {
      w.bytes(box('stsd', (x) => {
        x.u32(0).u32(1);
        x.bytes(box('avc1', (v) => {
          v.zeros(6).u16(1);                       // reserved, data_reference_index
          v.u16(0).u16(0).u32(0).u32(0).u32(0);    // pre_defined / reserved
          v.u16(o.width).u16(o.height);
          v.u32(0x00480000).u32(0x00480000);       // 72 dpi
          v.u32(0).u16(1);                         // reserved, frame_count
          v.zeros(32);                             // compressorname
          v.u16(0x0018).i16(-1);                   // depth, pre_defined
          v.bytes(box('avcC', (a) => a.bytes(o.description)));
        }));
      }));
      w.bytes(box('stts', (x) => { x.u32(0).u32(1).u32(N).u32(delta); }));
      if (useCtts) {
        /* version 0 (unsigned) with the shift folded in; run-length packed the
           trivial way (one entry per sample) — at 8 bytes a frame the index for
           an hour of 60 fps video is 1.7 MB, far below any limit this file
           meets first. */
        w.bytes(box('ctts', (x) => {
          x.u32(0).u32(N);
          for (let i = 0; i < N; i++) x.u32(1).u32(offs[i] + shift);
        }));
      }
      if (keys.length && keys.length < N) {
        w.bytes(box('stss', (x) => { x.u32(0).u32(keys.length); for (const k of keys) x.u32(k); }));
      }
      if (A) w.bytes(stscBox(lay.vChunks));
      else w.bytes(box('stsc', (x) => { x.u32(0).u32(1).u32(1).u32(N).u32(1); }));
      w.bytes(box('stsz', (x) => {
        x.u32(0).u32(0).u32(N);
        for (const s of o.samples) x.u32(s.data.length ?? s.data.size);
      }));
      if (A) { w.bytes(offsetBox(large, vOff)); stcoPatchAt = 0; }
      else w.bytes(box(large ? 'co64' : 'stco', (x) => {
        x.u32(0).u32(1);
        stcoPatchAt = x.length;                    // offset of the u32 inside stbl…
        x.u32(0);                                  // …patched once moov's size is known
        if (large) x.u32(0);
      }));
    });

    const minf = box('minf', (w) => {
      w.bytes(box('vmhd', (x) => { x.u32(1).u16(0).u16(0).u16(0).u16(0); }));
      w.bytes(box('dinf', (x) => {
        x.bytes(box('dref', (v) => {
          v.u32(0).u32(1);
          v.bytes(box('url ', (u) => u.u32(1)));   // flag 1: data is in this file
        }));
      }));
      w.bytes(stbl);
    });

    const mdia = box('mdia', (w) => {
      w.bytes(box('mdhd', (x) => {
        x.u32(0).u32(0).u32(0).u32(MP4_TIMESCALE).u32(duration);
        x.u16(0x55c4).u16(0);                      // language 'und'
      }));
      w.bytes(box('hdlr', (x) => {
        x.u32(0).u32(0).str('vide').u32(0).u32(0).u32(0);
        x.str(o.handler || 'MIR video').u8(0);
      }));
      w.bytes(minf);
    });

    const trak = box('trak', (w) => {
      w.bytes(box('tkhd', (x) => {
        x.u32(3).u32(0).u32(0).u32(1).u32(0).u32(duration);
        x.u32(0).u32(0).u16(0).u16(0).u16(0).u16(0);
        for (const m of MATRIX_IDENTITY) x.u32(m);
        x.u32(o.width << 16).u32(o.height << 16);
      }));
      if (A || (useCtts && shift > 0)) {
        /* the other half of the version-0 ctts pair: present from media time
           `shift`, for the movie's whole duration — the x264 idiom exactly.
           Beside an audio trak the video always carries its edit list (shift
           0 when monotone): players misalign a file where one track has an
           elst and the other none (RESEARCH 025 §3). */
        w.bytes(box('edts', (x) => {
          x.bytes(box('elst', (v) => {
            v.u32(0).u32(1).u32(duration).u32(shift).u16(1).u16(0);
          }));
        }));
      }
      w.bytes(mdia);
    });

    const moov = box('moov', (w) => {
      w.bytes(box('mvhd', (x) => {
        x.u32(0).u32(0).u32(0).u32(MP4_TIMESCALE).u32(A ? Math.max(duration, A.segment) : duration);
        x.u32(0x00010000).u16(0x0100).u16(0).u32(0).u32(0);
        for (const m of MATRIX_IDENTITY) x.u32(m);
        for (let i = 0; i < 6; i++) x.u32(0);
        x.u32(A ? 3 : 2);                          // next_track_ID
      }));
      w.bytes(trak);
      if (A) w.bytes(audioTrak(A, lay.aChunks, aOff, large));
    });
    return moov;
  };

  if (A) {
    /* two passes: every offset has a fixed width, so the moov built with zeros is the moov's size; then the real offsets */
    const size = buildMoov(lay.vChunks.map(() => 0), lay.aChunks.map(() => 0)).length;
    const vOff = [], aOff = [];
    let at = ftyp.length + size + (large ? 16 : 8);
    for (const c of lay.order) {
      (c.track === 'video' ? vOff : aOff).push(at);
      const list = c.track === 'video' ? o.samples : A.samples;
      for (let k = c.first; k < c.first + c.count; k++) at += list[k].data.length ?? list[k].data.size;
    }
    const moov = buildMoov(vOff, aOff);
    if (moov.length !== size) throw new Error('mp4Build: the index changed size between passes');
    const mdat = mdatHeader(large, mdatPayload);
    if (o.headersOnly) return Object.assign([ftyp, moov, mdat], { layout: lay.order });
    const data = [];
    for (const c of lay.order) {
      const list = c.track === 'video' ? o.samples : A.samples;
      for (let k = c.first; k < c.first + c.count; k++) data.push(list[k].data);
    }
    return Object.assign([ftyp, moov, mdat, ...data], { layout: lay.order });
  }
  const moov = buildMoov(null, null);

  /* Patch stco: the one absolute file offset in the index.  stbl sits inside
     minf inside mdia inside trak inside moov, each wrapping it in an 8-byte
     header, and the boxes before it inside each parent shift it further; the
     robust way to find the patch point is to SEARCH for the stco box in the
     final moov bytes — 4 bytes 'stco' preceded by its size — which is exact
     because there is exactly one stco in a one-track file. */
  const off = ftyp.length + moov.length + (large ? 16 : 8);
  let patched = false;
  for (let i = 4; i + 12 <= moov.length; i++) {
    if (large
      ? moov[i] === 0x63 && moov[i + 1] === 0x6f && moov[i + 2] === 0x36 && moov[i + 3] === 0x34
      : moov[i] === 0x73 && moov[i + 1] === 0x74 && moov[i + 2] === 0x63 && moov[i + 3] === 0x6f) {
      const at = i + 4 + 4 + 4;                  // 'stco' + version/flags + entry_count
      const dv = new DataView(moov.buffer, moov.byteOffset + at, large ? 8 : 4);
      if (large) dv.setBigUint64(0, BigInt(off)); else dv.setUint32(0, off);
      patched = true;
      break;
    }
  }
  if (!patched || stcoPatchAt < 0) throw new Error('mp4Build: stco patch point not found');

  const mdat = new Uint8Array(large ? 16 : 8);
  const dv = new DataView(mdat.buffer);
  dv.setUint32(0, large ? 1 : 8 + mdatPayload);
  if (large) dv.setBigUint64(8, BigInt(16 + mdatPayload));
  mdat[4] = 0x6d; mdat[5] = 0x64; mdat[6] = 0x61; mdat[7] = 0x74;
  return o.headersOnly ? [ftyp, moov, mdat] : [ftyp, moov, mdat, ...o.samples.map((s) => s.data)];
}

/** The original byte-array API remains for the zoom renderer and its gates. */
export function mp4Build(o) {
  const parts = mp4Parts(o);
  const length = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(length);
  let p = 0;
  for (const part of parts) { out.set(part, p); p += part.length; }
  return out;
}

/* ══ THE AUDIO TRACK (1.5.6-alpha.12, λWAVES 025 A1) ═════════════════════════
 *
 * `audio: { codec: 'mp4a.40.2' | 'opus', sampleRate, channels, description, samples: [{ data, dur? }], priming?, frames?, handler? }`
 * writes a second trak beside the video.  Its timescale is the sample rate and every sample's duration is an INTEGER count of
 * PCM samples (`dur`; AAC 1024 and Opus 960 when absent), so stts is exact and never passes through microseconds.
 *
 * THE PRIMING is the encoder's delay: AAC measured on the machine (1024–2112 samples; WebCodecs says nothing), Opus the
 * pre-skip of its OpusHead (bytes 10–11, little-endian; `priming` overrides).  It is written TWICE, because players read
 * different halves: the audio trak's edit list starts the presentation at media_time = priming (so audible sample 0 sits at
 * video frame 0), and an `sgpd`/`sbgp` 'roll' group (AAC −1, Opus −4 at 20 ms: 80 ms of pre-roll) covers every sample.
 * `frames` is the count of valid PCM samples (the mixdown's N); the edit list's segment is that many samples in the movie's
 * 90000 timescale, so for fps 24/30/48/60 at 48 kHz it equals the video's duration exactly; the trailing pad is trimmed by it.
 *
 * CHUNKS INTERLEAVE BY TIME: half a second of video, then the audio of the same half second, and so on (sample indices give
 * the windows, integer division: video i → ⌊2i / fps⌋, audio j → ⌊2·start_j / rate⌋), so a player streams the file without
 * seeking across it.  stsc and stco list each track's chunks; the offsets are fixed-width, so the moov is built twice (zeros,
 * then the real offsets) instead of searched and patched.  mvhd's duration is the longer trak; next_track_ID 3.
 * `mp4Parts(…, headersOnly)` carries `.layout` = [{ track, first, count }] — the payload order a store streams the samples in.
 * Without `audio` the file is byte for byte the one-track file above (a test holds it). */
const AAC_PACKET = 1024, OPUS_PACKET = 960;

function opusHead(d, ch, sr) {
  const ok = d && d.length >= 19 && String.fromCharCode(...d.subarray(0, 8)) === 'OpusHead';
  if (!ok) return { channels: ch, preSkip: null, inputRate: sr, gain: 0, family: 0, table: new Uint8Array(0) };
  return { channels: d[9], preSkip: d[10] | (d[11] << 8), inputRate: (d[12] | (d[13] << 8) | (d[14] << 16) | (d[15] << 24)) >>> 0,
    gain: ((d[16] | (d[17] << 8)) << 16) >> 16, family: d[18], table: d.subarray(19) };
}

function audioPlan(a) {
  const codec = a.codec === 'opus' ? 'opus' : (a.codec === 'mp4a.40.2' || a.codec === 'aac') ? 'aac' : null;
  if (!codec) throw new Error('mp4Build: the audio codec must be mp4a.40.2 or opus');
  const sr = Number(a.sampleRate), ch = Number(a.channels);
  if (!Number.isInteger(sr) || sr <= 0 || !Number.isInteger(ch) || ch < 1 || ch > 8) throw new Error('mp4Build: the audio needs an integer sampleRate and 1–8 channels');
  const samples = a.samples || [];
  if (!samples.length) throw new Error('mp4Build: the audio has no samples');
  const desc = a.description == null ? null : a.description instanceof Uint8Array ? a.description
    : ArrayBuffer.isView(a.description) ? new Uint8Array(a.description.buffer, a.description.byteOffset, a.description.byteLength) : new Uint8Array(a.description);
  if (codec === 'aac' && !(desc && desc.length >= 2)) throw new Error('mp4Build: AAC needs its AudioSpecificConfig (decoderConfig.description)');
  const head = codec === 'opus' ? opusHead(desc, ch, sr) : null;
  const durs = samples.map((s) => (Number.isSafeInteger(s.dur) && s.dur > 0 ? s.dur : codec === 'aac' ? AAC_PACKET : OPUS_PACKET));
  const starts = new Array(durs.length);
  let total = 0, bytes = 0, maxSize = 0;
  for (let j = 0; j < durs.length; j++) {
    starts[j] = total; total += durs[j];
    const n = samples[j].data.length ?? samples[j].data.size; bytes += n; if (n > maxSize) maxSize = n;
  }
  const priming = Number.isSafeInteger(a.priming) && a.priming >= 0 ? a.priming : head && head.preSkip != null ? head.preSkip : 0;
  if (head && head.preSkip == null) head.preSkip = priming;
  const frames = Number.isSafeInteger(a.frames) && a.frames >= 0 ? Math.min(a.frames, total - priming) : total - priming;
  if (!(frames > 0)) throw new Error('mp4Build: the audio holds no sample past its priming');
  if (total > 0xffffffff) throw new Error('MP4 duration or file size exceeds the supported range');
  const roll = codec === 'aac' ? -1 : -Math.ceil(3840 * sr / 48000 / durs[0]);
  return { codec, sr, ch, desc, head, samples, durs, starts, total, priming, frames, segment: Math.round(frames * MP4_TIMESCALE / sr),
    bytes, maxSize, roll, avg: Math.round(bytes * 8 * sr / total), handler: a.handler };
}

function interleave(n, fps, A) {
  const order = [], vChunks = [], aChunks = [], m = A.samples.length;
  const vWin = (i) => Math.floor(2 * i / fps), aWin = (j) => Math.floor(2 * A.starts[j] / A.sr);
  let i = 0, j = 0;
  while (i < n || j < m) {
    const w = Math.min(i < n ? vWin(i) : Infinity, j < m ? aWin(j) : Infinity);
    const vi = i, aj = j;
    while (i < n && vWin(i) === w) i++;
    if (i > vi) { order.push({ track: 'video', first: vi, count: i - vi }); vChunks.push(i - vi); }
    while (j < m && aWin(j) === w) j++;
    if (j > aj) { order.push({ track: 'audio', first: aj, count: j - aj }); aChunks.push(j - aj); }
  }
  return { order, vChunks, aChunks };
}

function stscBox(counts) {
  const runs = [];
  counts.forEach((c, k) => { if (!runs.length || runs[runs.length - 1][1] !== c) runs.push([k + 1, c]); });
  return box('stsc', (x) => { x.u32(0).u32(runs.length); for (const [first, c] of runs) x.u32(first).u32(c).u32(1); });
}
function offsetBox(large, offs) {
  return box(large ? 'co64' : 'stco', (x) => {
    x.u32(0).u32(offs.length);
    for (const v of offs) { if (large) x.u32(Math.floor(v / 0x100000000)).u32(v >>> 0); else x.u32(v); }
  });
}
function mdatHeader(large, payload) {
  const mdat = new Uint8Array(large ? 16 : 8), dv = new DataView(mdat.buffer);
  dv.setUint32(0, large ? 1 : 8 + payload);
  if (large) dv.setBigUint64(8, BigInt(16 + payload));
  mdat[4] = 0x6d; mdat[5] = 0x64; mdat[6] = 0x61; mdat[7] = 0x74;
  return mdat;
}
/** an MPEG-4 descriptor: tag, a four-byte length (0x80 0x80 0x80 n, as every muxer writes it), the body */
const descriptor = (tag, body) => { const n = body.length; return [tag, 0x80 | ((n >> 21) & 0x7f), 0x80 | ((n >> 14) & 0x7f), 0x80 | ((n >> 7) & 0x7f), n & 0x7f, ...body]; };
const be = (v, n) => Array.from({ length: n }, (_, k) => Math.floor(v / 2 ** (8 * (n - 1 - k))) & 0xff);

function audioTrak(A, chunks, offs, large) {
  const N = A.samples.length;
  const entry = box(A.codec === 'aac' ? 'mp4a' : 'Opus', (v) => {
    v.zeros(6).u16(1);                           // reserved, data_reference_index
    v.u32(0).u32(0).u16(A.ch).u16(16).u16(0).u16(0);
    v.u32(A.sr < 65536 ? A.sr * 65536 : 0);      // samplerate 16.16
    if (A.codec === 'aac') {
      const dcd = [0x40, 0x15, ...be(A.maxSize, 3), ...be(A.avg, 4), ...be(A.avg, 4), ...descriptor(5, Array.from(A.desc))];
      v.bytes(box('esds', (x) => { x.u32(0).bytes(Uint8Array.from(descriptor(3, [0, 2, 0, ...descriptor(4, dcd), ...descriptor(6, [2])]))); }));
    } else {
      const h = A.head;
      v.bytes(box('dOps', (x) => { x.u8(0).u8(h.channels).u16(h.preSkip).u32(h.inputRate).i16(h.gain).u8(h.family); if (h.family) x.bytes(h.table); }));
    }
  });
  const runs = [];
  for (const d of A.durs) { if (runs.length && runs[runs.length - 1][1] === d) runs[runs.length - 1][0]++; else runs.push([1, d]); }
  const stbl = box('stbl', (w) => {
    w.bytes(box('stsd', (x) => { x.u32(0).u32(1).bytes(entry); }));
    w.bytes(box('stts', (x) => { x.u32(0).u32(runs.length); for (const [c, d] of runs) x.u32(c).u32(d); }));
    w.bytes(stscBox(chunks));
    w.bytes(box('stsz', (x) => { x.u32(0).u32(0).u32(N); for (const s of A.samples) x.u32(s.data.length ?? s.data.size); }));
    w.bytes(offsetBox(large, offs));
    w.bytes(box('sgpd', (x) => { x.u32(0x01000000).str('roll').u32(2).u32(1).i16(A.roll); }));
    w.bytes(box('sbgp', (x) => { x.u32(0).str('roll').u32(1).u32(N).u32(1); }));
  });
  const minf = box('minf', (w) => {
    w.bytes(box('smhd', (x) => { x.u32(0).u16(0).u16(0); }));
    w.bytes(box('dinf', (x) => { x.bytes(box('dref', (v) => { v.u32(0).u32(1); v.bytes(box('url ', (u) => u.u32(1))); })); }));
    w.bytes(stbl);
  });
  const mdia = box('mdia', (w) => {
    w.bytes(box('mdhd', (x) => { x.u32(0).u32(0).u32(0).u32(A.sr).u32(A.total); x.u16(0x55c4).u16(0); }));
    w.bytes(box('hdlr', (x) => { x.u32(0).u32(0).str('soun').u32(0).u32(0).u32(0); x.str(A.handler || 'MIR audio').u8(0); }));
    w.bytes(minf);
  });
  return box('trak', (w) => {
    w.bytes(box('tkhd', (x) => {
      x.u32(3).u32(0).u32(0).u32(2).u32(0).u32(A.segment);
      x.u32(0).u32(0).u16(0).u16(1).u16(0x0100).u16(0);   // layer 0, alternate_group 1, volume 1.0
      for (const m of MATRIX_IDENTITY) x.u32(m);
      x.u32(0).u32(0);
    }));
    /* audible sample 0 is media sample `priming`: the presentation starts there, for the valid samples only */
    w.bytes(box('edts', (x) => { x.bytes(box('elst', (v) => { v.u32(0).u32(1).u32(A.segment).u32(A.priming).u16(1).u16(0); })); }));
    w.bytes(mdia);
  });
}

/* ══ avcC SURGERY — merging in-band parameter sets into the record ═════════
 *
 * MEASURED (rig, 2026-08-07): the encoder delivers exactly ONE
 * decoderConfig.description, but its bitstream carries a SECOND sps_id in-band
 * (ffmpeg on seek: "sps_id 1 out of range") — OpenH264 re-emits parameter
 * sets inside key samples under ids the avcC never heard of.  In-band sets in
 * an `avc1` track are tolerated by ffmpeg and lenient players and are exactly
 * the thing a strict demuxer may refuse, so the sink walks its key samples
 * for SPS/PPS NALs and the file ships an avcC that lists EVERY set the stream
 * uses.  These two functions are that surgery, pure and unit-tested.
 */
export function avcCParse(desc) {
  if (!(desc instanceof Uint8Array) || desc.length < 7) return null;
  const out = { profile: desc.subarray(1, 4), sps: [], pps: [] };
  let p = 5;
  const nSps = desc[p++] & 0x1f;
  for (let i = 0; i < nSps; i++) {
    const L = (desc[p] << 8) | desc[p + 1]; p += 2;
    out.sps.push(desc.subarray(p, p + L)); p += L;
  }
  const nPps = desc[p++];
  for (let i = 0; i < nPps; i++) {
    const L = (desc[p] << 8) | desc[p + 1]; p += 2;
    out.pps.push(desc.subarray(p, p + L)); p += L;
  }
  return out;
}

export function avcCBuild(profile, sps, pps) {
  let n = 7;
  for (const s of sps) n += 2 + s.length;
  for (const s of pps) n += 2 + s.length;
  const out = new Uint8Array(n);
  out[0] = 1;
  out[1] = profile[0]; out[2] = profile[1]; out[3] = profile[2];
  out[4] = 0xff;                              // 4-byte NAL lengths
  out[5] = 0xe0 | (sps.length & 0x1f);
  let p = 6;
  for (const s of sps) {
    out[p++] = s.length >> 8; out[p++] = s.length & 0xff;
    out.set(s, p); p += s.length;
  }
  out[p++] = pps.length;
  for (const s of pps) {
    out[p++] = s.length >> 8; out[p++] = s.length & 0xff;
    out.set(s, p); p += s.length;
  }
  return out;
}

/** Walk one AVCC sample (4-byte length-prefixed NALs) and collect parameter
    sets.  `into` = { sps: Map, pps: Map } keyed by the NAL's own bytes. */
export function collectParamSets(sample, into) {
  let i = 0;
  while (i + 4 <= sample.length) {
    const L = (sample[i] << 24 >>> 0) + (sample[i + 1] << 16) + (sample[i + 2] << 8) + sample[i + 3];
    if (L <= 0 || i + 4 + L > sample.length) break;
    const type = sample[i + 4] & 0x1f;
    if (type === 7 || type === 8) {
      const nal = sample.subarray(i + 4, i + 4 + L);
      let key = '';
      for (let j = 0; j < nal.length; j++) key += String.fromCharCode(nal[j]);
      (type === 7 ? into.sps : into.pps).set(key, nal);
    }
    i += 4 + L;
  }
}

/**
 * Structural reader for the gate: walk top-level boxes and the stbl counters,
 * enough to assert the file is self-consistent BEFORE ffmpeg gets it.  Not a
 * demuxer; never used by the app itself.
 */
export function mp4Parse(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const top = [];
  let p = 0;
  while (p + 8 <= bytes.length) {
    let size = dv.getUint32(p), header = 8;
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    if (size === 1 && p + 16 <= bytes.length) { size = Number(dv.getBigUint64(p + 8)); header = 16; }
    if (!Number.isSafeInteger(size) || size < header || p + size > bytes.length) return { ok: false, why: 'bad box ' + type + '@' + p, top };
    top.push({ type, at: p, size, header });
    p += size;
  }
  const find = (want) => {
    for (let i = 4; i + 8 <= bytes.length; i++) {
      if (String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]) === want) {
        return i - 4;
      }
    }
    return -1;
  };
  const out = { ok: p === bytes.length, top };
  const stts = find('stts');
  if (stts >= 0) {
    out.sampleCount = dv.getUint32(stts + 16);
    out.sampleDelta = dv.getUint32(stts + 20);
  }
  const stsz = find('stsz');
  if (stsz >= 0) out.stszCount = dv.getUint32(stsz + 16);
  const stco = find('stco');
  if (stco >= 0) out.chunkOffset = dv.getUint32(stco + 16);
  const co64 = find('co64');
  if (co64 >= 0) out.chunkOffset = Number(dv.getBigUint64(co64 + 16));
  const ctts = find('ctts');
  if (ctts >= 0) {
    const n = dv.getUint32(ctts + 12);
    out.cttsCount = n;
    out.cttsOffsets = [];
    for (let i = 0; i < Math.min(n, 64); i++) {
      out.cttsOffsets.push(dv.getUint32(ctts + 16 + i * 8 + 4));
    }
  }
  const elst = find('elst');
  if (elst >= 0) {
    out.elstDuration = dv.getUint32(elst + 16);
    out.elstMediaTime = dv.getUint32(elst + 20);
  }
  const mdhd = find('mdhd');
  if (mdhd >= 0) {
    out.timescale = dv.getUint32(mdhd + 20);
    out.duration = dv.getUint32(mdhd + 24);
  }
  /* 1.5.6-alpha.12: the tree, track by track — the movie's timescale and duration, and per trak its handler, sample entry,
     timescale, edit list, sample tables and roll group, so a gate reads an audio trak as well as the first video one */
  const kids = (from, to) => {
    const list = [];
    for (let q = from; q + 8 <= to;) {
      const size = dv.getUint32(q), type = String.fromCharCode(bytes[q + 4], bytes[q + 5], bytes[q + 6], bytes[q + 7]);
      if (size < 8 || q + size > to) break;
      list.push({ type, at: q, body: q + 8, end: q + size }); q += size;
    }
    return list;
  };
  const one = (list, type) => list.find((b) => b.type === type) || null;
  const moov = top.find((b) => b.type === 'moov');
  if (moov) {
    const mk = kids(moov.at + 8, moov.at + moov.size), mvhd = one(mk, 'mvhd');
    if (mvhd) out.movie = { timescale: dv.getUint32(mvhd.body + 12), duration: dv.getUint32(mvhd.body + 16), nextTrack: dv.getUint32(mvhd.body + 96) };
    out.tracks = mk.filter((b) => b.type === 'trak').map((trak) => {
      const tk = kids(trak.body, trak.end), tr = {};
      const tkhd = one(tk, 'tkhd');
      if (tkhd) { tr.id = dv.getUint32(tkhd.body + 12); tr.duration = dv.getUint32(tkhd.body + 20); tr.volume = dv.getUint16(tkhd.body + 36); }
      const edts = one(tk, 'edts'), elst = edts ? one(kids(edts.body, edts.end), 'elst') : null;
      if (elst) tr.edits = Array.from({ length: dv.getUint32(elst.body + 4) }, (_, k) => ({ segment: dv.getUint32(elst.body + 8 + k * 12),
        mediaTime: dv.getInt32(elst.body + 12 + k * 12), rate: dv.getUint16(elst.body + 16 + k * 12) }));
      const mdia = one(tk, 'mdia'), md = mdia ? kids(mdia.body, mdia.end) : [];
      const mdhd = one(md, 'mdhd'), hdlr = one(md, 'hdlr');
      if (mdhd) { tr.timescale = dv.getUint32(mdhd.body + 12); tr.mediaDuration = dv.getUint32(mdhd.body + 16); }
      if (hdlr) tr.handler = String.fromCharCode(...bytes.subarray(hdlr.body + 8, hdlr.body + 12));
      const minf = one(md, 'minf'), stbl = minf ? one(kids(minf.body, minf.end), 'stbl') : null, st = stbl ? kids(stbl.body, stbl.end) : [];
      const table = (type, width) => { const b = one(st, type); if (!b) return null; const n = dv.getUint32(b.body + 4);
        return Array.from({ length: n }, (_, k) => Array.from({ length: width }, (_, f) => dv.getUint32(b.body + 8 + (k * width + f) * 4))); };
      const stsd = one(st, 'stsd');
      if (stsd) {
        const e = kids(stsd.body + 8, stsd.end)[0];
        if (e) {
          tr.entry = e.type;
          if (tr.handler === 'soun') {
            tr.channels = dv.getUint16(e.body + 16); tr.sampleRate = dv.getUint32(e.body + 24) >>> 16;
            const ek = kids(e.body + 28, e.end), dOps = one(ek, 'dOps'), esds = one(ek, 'esds');
            if (dOps) tr.dOps = { channels: bytes[dOps.body + 1], preSkip: dv.getUint16(dOps.body + 2), inputRate: dv.getUint32(dOps.body + 4), gain: dv.getInt16(dOps.body + 8), family: bytes[dOps.body + 10] };
            if (esds) {
              /* walk the descriptors to tag 5, the decoder-specific info (the AudioSpecificConfig, verbatim) */
              let q = esds.body + 4; const end = esds.end, len = () => { let n = 0; for (let k = 0; k < 4; k++) { const c = bytes[q++]; n = (n << 7) | (c & 0x7f); if (!(c & 0x80)) break; } return n; };
              while (q < end) { const tag = bytes[q++], n = len();
                if (tag === 3) q += 3; else if (tag === 4) { tr.objectType = bytes[q]; tr.streamType = bytes[q + 1]; q += 13; }
                else { if (tag === 5) tr.asc = Array.from(bytes.subarray(q, q + n)); q += n; } }
            }
          }
        }
      }
      tr.stts = table('stts', 2); tr.stsc = table('stsc', 3);
      const stsz = one(st, 'stsz');
      if (stsz) tr.sizes = Array.from({ length: dv.getUint32(stsz.body + 8) }, (_, k) => dv.getUint32(stsz.body + 12 + k * 4));
      const stco = one(st, 'stco'), co64 = one(st, 'co64');
      if (stco) tr.offsets = table('stco', 1).map((r) => r[0]);
      if (co64) tr.offsets = Array.from({ length: dv.getUint32(co64.body + 4) }, (_, k) => Number(dv.getBigUint64(co64.body + 8 + k * 8)));
      tr.sampleCount = tr.sizes ? tr.sizes.length : 0;
      const sgpd = one(st, 'sgpd'), sbgp = one(st, 'sbgp');
      if (sgpd) tr.roll = { type: String.fromCharCode(...bytes.subarray(sgpd.body + 4, sgpd.body + 8)), distance: dv.getInt16(sgpd.body + 16) };
      if (sbgp) tr.rollRuns = Array.from({ length: dv.getUint32(sbgp.body + 8) }, (_, k) => [dv.getUint32(sbgp.body + 12 + k * 8), dv.getUint32(sbgp.body + 16 + k * 8)]);
      return tr;
    });
  }
  const mdat = top.find((b) => b.type === 'mdat');
  if (mdat) out.mdatPayloadAt = mdat.at + mdat.header;
  return out;
}
