/* render/mp4.js — THE MP4 MUXER: a minimal ISO-BMFF writer for one avc1 video track (harvested from BASINS app/exportcore.js,
 * 2026-10-05, byte for byte but for the handler name).  WebCodecs hands over AVCC samples and the encoder's avcC record, so
 * muxing is honest bookkeeping: ftyp + moov (the index) + mdat (the samples, verbatim).  Faststart layout, 90000 timescale
 * (24/30/48/60 fps all divide it), B-frame reordering written as the classic ctts + elst pair, `largeFile` for a co64 beyond
 * 4 GB, `headersOnly` for a recovery that streams the payload from disk.  Pure: no DOM, imports nothing, node runs it.
 *
 *   mp4Parts({ width, height, fps, description, samples:[{ data, key, cts? }], largeFile?, headersOnly?, handler? }) → [Uint8Array…]
 *   mp4Build(o) → Uint8Array          the same, joined
 *   avcCParse(desc) · avcCBuild(profile, sps, pps) · collectParamSets(sample, { sps, pps })   the avcC surgery (in-band sets)
 *   mp4Parse(bytes)                   a structural reader for gates; never used by the app itself
 *   MP4_TIMESCALE
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
 * earlier), one track, no audio.
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
    w.bytes(box('stsc', (x) => { x.u32(0).u32(1).u32(1).u32(N).u32(1); }));
    w.bytes(box('stsz', (x) => {
      x.u32(0).u32(0).u32(N);
      for (const s of o.samples) x.u32(s.data.length ?? s.data.size);
    }));
    w.bytes(box(large ? 'co64' : 'stco', (x) => {
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
    if (useCtts && shift > 0) {
      /* the other half of the version-0 ctts pair: present from media time
         `shift`, for the movie's whole duration — the x264 idiom exactly. */
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
      x.u32(0).u32(0).u32(0).u32(MP4_TIMESCALE).u32(duration);
      x.u32(0x00010000).u16(0x0100).u16(0).u32(0).u32(0);
      for (const m of MATRIX_IDENTITY) x.u32(m);
      for (let i = 0; i < 6; i++) x.u32(0);
      x.u32(2);                                  // next_track_ID
    }));
    w.bytes(trak);
  });

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
  const mdat = top.find((b) => b.type === 'mdat');
  if (mdat) out.mdatPayloadAt = mdat.at + mdat.header;
  return out;
}
