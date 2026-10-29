#!/usr/bin/env node
/* tools/conduct.mjs — THE BOUNCE FROM NODE (026 A3): a SCORE (docs/conductor/SCORE.md) applied in the lab (__LW.conduct, tools/conduct-score.js)
 * and bounced by the kit's recorder through the RENDER card's own fields, as tools/perf/film-obey.mjs presses it; the film read back from
 * the run's result, never from a download.
 *   node tools/conduct.mjs <score.json> [--out DIR] [--port P] [--gd P] [--size 1080p] [--fps 30] [--format mp4|png] [--project-only] [--keep-open]
 * Leaves, side by side in DIR (default .tmp/conduct/):  <name>.mp4 · <name>.lambdawaves.json (projects.exportText) · <name>.audit.json (the
 * apply report, the audit rows, fileFacts, the plan, the baked readings) · <name>.sheet.jpg (one tile per BAR at its first frame, 4 across,
 * the bar number on each — THE SHEET IS WHAT A CLAUDE REVIEWS).  --format png leaves the kit's frame ZIP parts (+ the WAV) instead of the MP4.
 * THE GATE: LW_PORT (and GD_PORT) name a running one; otherwise this starts `python3 tools/gate/server.py . <port>` on a free port and
 * stops it by pid at the end.  A path in the score (`audio.file`, `base`) is the repo's, served by the gate (a track lives in media/).
 * Exit 1 on "RENDER DISOBEYED" (the audit's lies printed), on a score the lab refused whole, or on no film. */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import https from 'node:https';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readScore } from './conduct-score.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), FFMPEG = process.env.FFMPEG || path.join(process.env.HOME, 'bin/ffmpeg');
const FORBIDDEN = new Set([8721, 8731, 8735, 8741, 9241, 9261, 9491, 8790, 9651, 5651]);
const argv = process.argv.slice(2), flag = (k) => argv.includes(k), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const scorePath = argv.find((a, i) => !a.startsWith('--') && !(i && ['--out', '--port', '--gd', '--size', '--fps', '--format'].includes(argv[i - 1])));
if (!scorePath) { console.error('usage: node tools/conduct.mjs <score.json> [--out DIR] [--port P] [--gd P] [--size 1080p] [--fps 30] [--format mp4|png] [--project-only] [--keep-open]'); process.exit(2); }
const raw = JSON.parse(fs.readFileSync(scorePath, 'utf8')), first = readScore(raw);
if (!first.score) { console.error('SCORE REFUSED: ' + first.refused.map((r) => r.key + ' — ' + r.why).join('; ')); process.exit(1); }
const S = first.score, OUT = path.resolve(opt('--out', path.join(ROOT, '.tmp/conduct'))), base = S.name.replace(/[^\w.-]+/g, '-'), at = (ext) => path.join(OUT, base + ext);
const R = { ...S.render, ...(opt('--size') && { size: opt('--size') }), ...(opt('--fps') && { fps: +opt('--fps') }), ...(opt('--format') && { format: opt('--format') }) };
fs.mkdirSync(OUT, { recursive: true });

/* the score's paths → the gate's URLs (the repo root is served), a base file → its text */
const served = (p) => { const abs = path.resolve(ROOT, p); if (!abs.startsWith(ROOT + path.sep)) throw new Error(p + ' is outside the repo: put it in media/'); return '/' + path.relative(ROOT, abs).split(path.sep).join('/'); };
const score = JSON.parse(JSON.stringify(raw)); score.render = { ...(score.render || {}), ...R };
if (score.audio && score.audio.file && !/^(https?:)?\//.test(score.audio.file)) score.audio.file = served(score.audio.file);
if (typeof score.base === 'string' && !score.base.trim().startsWith('{') && fs.existsSync(path.resolve(ROOT, score.base))) score.base = fs.readFileSync(path.resolve(ROOT, score.base), 'utf8');

const freePort = () => new Promise((res, rej) => { const s = net.createServer(); s.once('error', rej); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => (FORBIDDEN.has(p) ? freePort().then(res, rej) : res(p))); }); });
const up = (port) => new Promise((res) => { const q = https.get({ host: '127.0.0.1', port, path: '/lab/', rejectUnauthorized: false }, (r) => { r.resume(); res(r.statusCode === 200); }); q.on('error', () => res(false)); q.setTimeout(2000, () => { q.destroy(); res(false); }); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let gate = null;
const PORT = +(process.env.LW_PORT || opt('--port', 0)) || await freePort();
process.env.GD_PORT = String(process.env.GD_PORT || opt('--gd', '') || await freePort());
for (const p of [PORT, +process.env.GD_PORT]) if (FORBIDDEN.has(p)) { console.error('port ' + p + ' is never ours'); process.exit(2); }
if (!process.env.LW_PORT) {
  gate = spawn('python3', [path.join(ROOT, 'tools/gate/server.py'), ROOT, String(PORT)], { stdio: 'ignore' });
  let ok = false; for (let i = 0; i < 60 && !(ok = await up(PORT)); i++) await wait(250);
  if (!ok) { gate.kill(); console.error('the gate did not come up on ' + PORT); process.exit(1); }
}
const DL = path.join(OUT, 'conduct-dl-' + process.pid);   // the card's own hand-over download lands here and is deleted: the film is read from the run
fs.mkdirSync(DL, { recursive: true });
const { open } = await import('./gate/gatekit.mjs');
let code = 0, g = null;
const ev = async (b, a) => { const r = await g.ev(b, a); if (r && typeof r === 'object' && r.E) throw new Error(r.E); return r; };
try {
  g = await open(`https://127.0.0.1:${PORT}/lab/?sw=0`, { width: 1600, height: 900, script: 4 * 3600 * 1000,
    prefs: { 'privacy.reduceTimerPrecision': false, 'dom.storageManager.prompt.testing': true, 'dom.storageManager.prompt.testing.allow': true,
      'browser.download.folderList': 2, 'browser.download.dir': DL, 'browser.download.useDownloadDir': true, 'browser.download.always_ask_before_handling_new_types': false } });
  if (!(await g.waitFor('window.__LW && __LW.ready', 600, 100)).ok) throw new Error('the lab never came up');
  await ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    window.__w = (ms) => new Promise((r) => setTimeout(r, ms));
    const M = __LW.mod.model; for (const a of M.sourceList().filter((x) => x.kind === 'audio' && x.on !== false)) M.setSource(a.id, { on: false });   /* a live input cannot replay */
    return 1;`);
  const rep = await ev(`return await __LW.conduct.apply(arguments[0]);`, [score]);
  console.log((rep.ok ? 'APPLIED ' : 'REFUSED ') + S.name + ' · ' + (rep.applied || []).length + ' applied · ' + rep.refused.length + ' refused · ' + rep.clamps.length + ' clamped' + (rep.ok ? ' · ' + rep.beats + ' beats = ' + rep.seconds.toFixed(2) + ' s' : ''));
  for (const r of rep.refused) console.log('    refused ' + r.key + ' — ' + r.why);
  for (const c of rep.clamps) console.log('    clamped ' + c.target + ' ' + c.value + ' → ' + c.to);
  if (!rep.ok) throw Object.assign(new Error('the score was refused'), { quiet: true });
  fs.writeFileSync(at('.lambdawaves.json'), await ev(`return __LW.layout.projects.exportText(arguments[0]);`, [rep.path]));
  const audit = { score: scorePath, apply: rep, render: R };
  if (flag('--project-only')) { fs.writeFileSync(at('.audit.json'), JSON.stringify(audit, null, 1)); console.log('PROJECT ' + at('.lambdawaves.json')); }
  else {
    /* THE CARD'S OWN FIELDS, as film-obey sets them, then RENDER; the run's result is kept as the card hands it to its save */
    const asked = { motion: 'timeline-active', format: R.format, size: R.size, fps: R.fps, modulation: 'on', timeline: 'on', audio: rep.keep && R.audio !== 'off' ? 'on' : 'off', nodes: R.nodes, chrome: R.chrome };
    const t0 = Date.now();
    const started = await ev(`const o = arguments[0], R = __LW.render, C = R.view.controls, set = (f, v) => { f.value = v; f.dispatchEvent(new Event('change')); };
      const M = __LW.mod.model; for (const a of M.sourceList().filter((x) => x.kind === 'audio' && x.on !== false)) M.setSource(a.id, { on: false });   /* NEW's AUDIO device: a live input cannot replay */
      __LW.pause(); __LW.layout.raise('render'); await __w(600); await __LW.settle();
      for (const [k, f] of [['motion', 'motion'], ['format', 'recFormat'], ['size', 'recSize'], ['fps', 'recFps'], ['modulation', 'modSelect'], ['timeline', 'timelineSelect'], ['audio', 'audioSelect']]) set(C[f], String(o[k]));
      localStorage.setItem('lambdawaves.q0.render.nodes', o.nodes); localStorage.setItem('lambdawaves.q0.render.chrome', o.chrome);
      if (!__LW.mod.armed) __LW.mod.arm(true);
      const run0 = R.recorder.run; window.__res = null; R.recorder.run = (x) => run0(x).then((res) => { window.__res = res; return res; });
      await __LW.settle(); await __w(200); window.__L0 = __LW.captureUI.exact.last; C.renderBtn.click(); await __w(400);
      return { running: R.view.state().running || R.recorder.running(), status: R.view.state().status, estimate: R.view.state().estimate };`, [asked]);
    console.log('RENDER ' + R.format + ' ' + R.size + ' ' + R.fps + ' fps · ' + (started.estimate || started.status || ''));
    let last = '';
    for (;;) {
      const s = await ev(`const R = __LW.render; return { on: !!(R.view.state().running || R.recorder.running()), status: R.view.state().status || '' };`);
      if (!s.on) break;
      if (s.status !== last && process.stdout.isTTY) process.stdout.write('\r  ' + s.status.slice(0, 100).padEnd(100));
      last = s.status; await wait(2000);
    }
    if (process.stdout.isTTY) process.stdout.write('\n');
    await wait(500);
    const L = await ev(`const L = __LW.captureUI.exact.last, res = window.__res;
      if (!L || L === window.__L0 || !L.audit || !res) return { none: true, status: __LW.render.view.state().status };
      const { log, ...lastFacts } = L; window.__files = res.files; const fileFacts = await __LW.captureUI.exact.fileFacts(res).catch(() => null);
      return { ok: L.audit.ok, lies: L.audit.lies, rows: L.audit.rows, fileFacts, last: { ...lastFacts, frames: L.frames, logLength: (log || []).length }, res: { ...res, files: res.files.map(({ blob, ...f }) => ({ ...f, blob: !!blob, size: blob ? blob.size : f.bytes, type: blob ? blob.type : '' })) } };`);
    if (L.none) throw new Error('NO FILM: ' + L.status);
    audit.ok = L.ok; audit.lies = L.lies; audit.rows = L.rows; audit.fileFacts = L.fileFacts; delete L.last.audit; audit.baked = L.last.baked; audit.result = L.res; audit.seconds = (Date.now() - t0) / 1000;
    for (const r of L.rows) console.log('    ' + (r.ok ? '✓ ' : '✗ ') + r.setting + ' · asked ' + r.asked + ' · ' + r.witness);
    /* the film: the run's blobs, base64 in ≤ 4 MB chunks */
    const written = [];
    for (const [i, f] of L.res.files.entries()) {
      if (!f.blob) { console.log('    ' + f.name + ': held by the kit\'s store, not handed back'); continue; }
      const name = R.format === 'mp4' && L.res.files.length === 1 ? base + '.mp4' : base + '-' + f.name, fd = fs.openSync(path.join(OUT, name), 'w'), CH = 3 * 1024 * 1024;
      for (let o = 0; o < f.size; o += CH) {
        const b64 = await ev(`const b = window.__files[arguments[0]].blob.slice(arguments[1], arguments[1] + arguments[2]);
          return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(b); });`, [i, o, CH]);
        fs.writeSync(fd, Buffer.from(b64, 'base64'));
      }
      fs.closeSync(fd); written.push(path.join(OUT, name));
    }
    audit.files = written;
    fs.writeFileSync(at('.audit.json'), JSON.stringify(audit, null, 1));
    const mp4 = written.find((f) => f.endsWith('.mp4'));
    if (mp4) { sheet(mp4, rep); console.log('SHEET ' + at('.sheet.jpg')); }
    for (const f of written) console.log('FILM ' + f + ' · ' + fs.statSync(f).size + ' B');
    console.log(L.ok ? 'OBEYED ' + S.name : 'RENDER DISOBEYED: ' + L.lies.join(' · '));
    if (!L.ok) code = 1;
    if (!written.length) code = 1;
  }
  if (flag('--keep-open')) { console.log('--keep-open: the lab stays on https://127.0.0.1:' + PORT + '/lab/ (gd ' + process.env.GD_PORT + '); Ctrl+C ends it'); await new Promise(() => {}); }
} catch (e) { if (!e.quiet) console.error(e.stack || e); code = 1; }
finally {
  if (g) await g.close();
  if (gate) gate.kill();
  fs.rmSync(DL, { recursive: true, force: true });
}
process.exit(code);

/* THE SHEET: one tile per bar at the bar's first frame = round(bar · meter · 60 / bpm · fps) from the range's start, 4 across, ≤ 1920 px wide,
   "BAR n" on each — through ffmpeg's ass filter (this build has no drawtext): one subtitle event per bar, burnt in before the select */
function sheet(mp4, rep) {
  const fps = R.fps, spb = 60 / rep.bpm, [b0, b1] = rep.range, bars = Math.ceil((b1 - b0) / rep.meter - 1e-9), frames = [];
  for (let k = 0; k < bars; k++) frames.push(Math.round(k * rep.meter * spb * fps));
  const ts = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s - h * 3600 - m * 60; return h + ':' + String(m).padStart(2, '0') + ':' + x.toFixed(2).padStart(5, '0'); };
  const firstBar = Math.floor(b0 / rep.meter) + 1;
  const ass = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080', '', '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV',
    'Style: Bar,Roboto,96,&H00FFFFFF,&H00000000,&H80000000,1,0,3,6,0,7,40,40,30', '', '[Events]', 'Format: Layer, Start, End, Style, Text',
    ...frames.map((f, k) => 'Dialogue: 0,' + ts(f / fps) + ',' + ts((frames[k + 1] ?? f + fps * 9999) / fps) + ',Bar,BAR ' + (firstBar + k))].join('\n');
  const assPath = mp4.replace(/\.mp4$/, '.sheet.ass'); fs.writeFileSync(assPath, ass);
  const sel = frames.map((f) => 'eq(n\\,' + f + ')').join('+'), rows = Math.ceil(frames.length / 4), cols = Math.min(4, frames.length);
  const vf = `ass=${assPath.replace(/([:\\'])/g, '\\$1')}:fontsdir=${path.join(ROOT, 'lab/fonts')},select='${sel}',scale=480:-2,tile=${cols}x${rows}:padding=4:color=black`;
  try { execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-vf', vf, '-fps_mode', 'passthrough', '-frames:v', '1', '-q:v', '3', at('.sheet.jpg')], { stdio: 'inherit' }); }
  finally { fs.rmSync(assPath, { force: true }); }
}
