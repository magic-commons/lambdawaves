/* render/selftest.js — RUN SELF-TEST: does making a film work on this device, answered in seconds instead of after a long render
 * (harvested from BASINS app/export.js exportSelfTest, the stages that are not the fractal's; the stage format, the checks of
 * the magic bytes and the way each stage reports are BASINS').
 *
 *   renderSelfTest({ width, height, fps, frame?, projection?, stages?, dir?, storage?, wake? }) → { at, env, stages, passed, total, ok, totalMs, firstFailure }
 *   selfTestLines(res) → [string]      what the panel prints and what the dump carries
 *
 * THE STAGES (each is timed; one failing never stops the rest)
 *   1  where we are          the browser, density, secure context, installed or a tab, the size under test
 *   2  the app's own         `stages: [{ name, run() → detail }]` (BASINS: the engine is up, the view settles)
 *   3  the frame source      `frame(0, …)` is called once and its pixels are read back; the tones are counted (a blank
 *                            readback is the classic device failure and looks like success from the byte count)
 *   4  PNG at full size      a canvas encodes at the render size and the bytes are a PNG (Safari's ceiling is the likely failure)
 *   5  a file can be offered download attribute, share sheet, the route this device would take
 *   6  the video ladder      every avc1 rung, probed at the render size
 *   7  a two-frame MP4       through the shipping sink and muxer, then DECODED (the preflight): catches an encoder that accepts
 *                            the configuration and cannot take a frame
 *   8  the temporary store   a probe job written to the origin-private file system, read back and discarded; absent store is
 *                            reported with the memory limits the run would fall back to
 *   9  the screen holds      whether a wake lock can be asked for
 *   10 the projected cost    `projection` (a sentence the panel computed from the plan), so the cost of the film as configured
 *                            is visible before the tap */
import { codecCandidates, pickHighBitrate, fmtBytes } from './plan.js';
import { WcSink, decideEncoderPath, verifyEncoder } from './encoder.js';
import { RenderStore } from './store.js';

const MAGIC = {
  png: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  mp4: (b) => b.length > 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
};
const bytesOf = async (blob) => new Uint8Array(await blob.arrayBuffer());

export async function renderSelfTest(o = {}) {
  const w = (o.width || 1280) & ~1, h = (o.height || 720) & ~1, fps = o.fps || 30;
  const stages = [], t00 = performance.now();
  const stage = async (name, fn) => {
    const t0 = performance.now();
    try { const detail = await fn(); stages.push({ name, ok: true, ms: performance.now() - t0, detail: detail || '' }); return detail; }
    catch (e) { stages.push({ name, ok: false, ms: performance.now() - t0, detail: String((e && e.message) || e) }); return null; }
  };
  const env = {
    ua: (typeof navigator !== 'undefined' && navigator.userAgent) || '?',
    dpr: typeof devicePixelRatio === 'number' ? devicePixelRatio : 0,
    secure: typeof isSecureContext === 'boolean' ? isSecureContext : null,
    /* an installed home-screen copy is a different browser context from a tab, and historically a stricter one about handing
       over files: "it worked in Safari but not from the icon" is a real and otherwise invisible answer */
    standalone: !!((typeof navigator !== 'undefined' && navigator.standalone) || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)),
    renderW: w, renderH: h, megapixels: w * h / 1e6,
  };
  await stage('size under test', () => w + '×' + h + ' at ' + fps + ' fps, ' + env.megapixels.toFixed(2) + ' Mpx, dpr ' + env.dpr + (env.secure === false ? ' · NOT a secure context: no file storage' : ''));
  for (const s of o.stages || []) await stage(s.name, s.run);

  let canvas = null, ctx = null, shot = null;
  const make = () => { if (!canvas) { canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; ctx = canvas.getContext('2d', { willReadFrequently: true }); } return ctx; };
  if (typeof o.frame === 'function') await stage('the frame source reads back (the pixels leave the app)', async () => {
    const src = await o.frame(0, { i: 0, frame: 0, beat: 0, time: 0, fps, width: w, height: h, view: null, probe: true });
    const g = make();
    if (src && src.rgba) shot = src.rgba; else { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.drawImage(src, 0, 0, w, h); shot = g.getImageData(0, 0, w, h).data; }
    /* PROVE THE PIXELS ARE REAL: count distinct tones over a coarse grid.  An all-one-colour frame is legitimate, so this is reported, not asserted. */
    const distinct = new Set(); let nonzero = 0;
    const step = Math.max(4, Math.floor(shot.length / 4 / 4096)) * 4;
    for (let i = 0; i < shot.length; i += step) { const l = (shot[i] + shot[i + 1] + shot[i + 2]) | 0; if (l > 0) nonzero++; distinct.add(l >> 2); }
    return w + '×' + h + ', ' + (shot.length / 1e6).toFixed(1) + ' MB, ' + distinct.size + ' distinct tones over ' + Math.ceil(shot.length / step) + ' samples, ' + nonzero + ' non-black';
  });
  await stage('PNG encode at full size', async () => {
    const g = make();
    if (!shot) { g.fillStyle = 'rgb(40,90,160)'; g.fillRect(0, 0, w, h); } else g.putImageData(new ImageData(shot instanceof Uint8ClampedArray ? shot : new Uint8ClampedArray(shot.buffer, shot.byteOffset, shot.length), w, h), 0, 0);
    const blob = await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('PNG encoding timed out')), 60000); canvas.toBlob((b) => { clearTimeout(t); res(b); }, 'image/png'); });
    const by = await bytesOf(blob);
    if (!MAGIC.png(by)) throw new Error('bytes are not a PNG (first four ' + Array.from(by.slice(0, 4)) + ')');
    return (by.length / 1e6).toFixed(2) + ' MB, header valid';
  });
  await stage('a file can be offered (download / share)', () => {
    const anchorOk = typeof document !== 'undefined' && 'download' in document.createElement('a');
    const urlOk = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    let shareFiles = false, shareApi = false;
    try {
      shareApi = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      if (shareApi && typeof navigator.canShare === 'function' && typeof File === 'function') shareFiles = navigator.canShare({ files: [new File([new Uint8Array([1])], 'a.png', { type: 'image/png' })] });
    } catch (_) { /* no share */ }
    if (!urlOk) throw new Error('no URL.createObjectURL — this browser cannot be handed a blob');
    if (!anchorOk && !shareFiles) throw new Error('neither the download attribute nor file sharing is available — a save cannot be offered by any route');
    return 'anchor download ' + (anchorOk ? 'yes' : 'NO') + ' · share() ' + (shareApi ? 'yes' : 'no') + ' · share files ' + (shareFiles ? 'yes' : 'no') + ' · route this device would take: ' + (shareFiles ? 'share sheet' : 'anchor download');
  });
  await stage('VideoEncoder ladder at ' + w + '×' + h + ' @ ' + fps + ' fps', async () => {
    if (typeof VideoEncoder !== 'function') throw new Error('no VideoEncoder in this browser');
    if (typeof VideoFrame !== 'function') throw new Error('no VideoFrame in this browser');
    const ladder = [];
    for (const codec of codecCandidates(w, h)) {
      let sup = false, why = '';
      try { const r = await VideoEncoder.isConfigSupported({ codec, width: w, height: h, bitrate: pickHighBitrate(w, h, fps), framerate: fps, avc: { format: 'avc' } }); sup = !!(r && r.supported); }
      catch (e) { why = String((e && e.message) || e).slice(0, 60); }
      ladder.push(codec + (sup ? ' YES' : ' no' + (why ? ' (' + why + ')' : '')));
    }
    if (!ladder.some((s) => / YES$/.test(s))) throw new Error('every rung refused: ' + ladder.join(', '));
    return ladder.join(' · ');
  });
  await stage('two-frame MP4 through the shipping sink + muxer, then decoded', async () => {
    const path = await decideEncoderPath(w, h, fps, pickHighBitrate(w, h, fps));
    if (path.kind !== 'webcodecs') throw new Error('not on the webcodecs path here: ' + path.why);
    const sink = new WcSink(w, h, fps, path.codec, { bitrate: path.bitrate });
    try {
      const px = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < px.length; i += 4) { px[i] = 40; px[i + 1] = 90; px[i + 2] = 160; px[i + 3] = 255; }
      await sink.add(px, 0);
      for (let i = 0; i < px.length; i += 4) { px[i] = 200; px[i + 1] = 60; px[i + 2] = 30; }
      await sink.add(px, 1);
      const out = await sink.finish();
      if (!MAGIC.mp4(out.bytes)) throw new Error('the muxed bytes are not an MP4');
      await verifyEncoder(w, h, fps, path);
      return (out.bytes.length / 1e3).toFixed(0) + ' kB, ' + out.samples + ' samples, ' + path.codec + ', header valid, decoded';
    } catch (e) { try { sink.abort(); } catch (_) { /* gone */ } throw e; }
  });
  await stage('temporary file storage (the render store)', async () => {
    const id = 'selftest-' + Date.now().toString(36);
    const store = await RenderStore.create(id, { format: 'png', width: w, height: h, frames: 1 }, 1e6, { dir: o.dir, storage: o.storage });
    if (!store) return 'absent — a render keeps its samples in memory: MP4 up to 128 MB, PNG up to 480 MB, and a reload loses them';
    try {
      const probe = new Blob([new Uint8Array(65536).fill(7)]);
      const part = await store.savePart('probe.bin', probe, 1);
      if (part.blob.size !== 65536) throw new Error('the probe came back ' + part.blob.size + ' bytes, not 65536');
      return 'origin-private file system: wrote and read back ' + fmtBytes(65536) + ', checkpoints and recovery available';
    } finally { await store.discard().catch(() => {}); }
  });
  await stage('the screen can be held awake', () => {
    const api = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    return (api ? 'Screen Wake Lock available' : 'no Screen Wake Lock API: keep the screen on by hand') + (typeof o.wake === 'function' ? ' · the app holds it during a render' : ' · the app does not hold it');
  });
  if (o.projection) await stage('projected cost of the film as configured', () => o.projection);

  const passed = stages.filter((s) => s.ok).length;
  return { at: new Date().toISOString(), env, stages, passed, total: stages.length, ok: passed === stages.length, totalMs: performance.now() - t00,
    firstFailure: (stages.find((s) => !s.ok) || {}).name || null };
}

/** the self-test as text: what the panel prints and what the dump carries */
export function selfTestLines(res) {
  if (!res) return ['selftest    not run this session   [RUN SELF-TEST in RENDER]'];
  const L = [];
  L.push('selftest    ' + res.passed + '/' + res.total + ' stages' + (res.ok ? '  ALL PASSED' : '  FIRST FAILURE: ' + res.firstFailure) + '   (' + (res.totalMs / 1000).toFixed(1) + ' s)');
  L.push('            ' + res.env.renderW + '×' + res.env.renderH + ' (' + res.env.megapixels.toFixed(2) + ' Mpx) · dpr ' + res.env.dpr + (res.env.standalone ? ' · INSTALLED (home-screen) copy' : ' · browser tab'));
  for (const s of res.stages) {
    L.push('  ' + (s.ok ? 'ok   ' : 'FAIL ') + s.name);
    if (s.detail) L.push('       ' + String(s.detail).slice(0, 200));
  }
  return L;
}
