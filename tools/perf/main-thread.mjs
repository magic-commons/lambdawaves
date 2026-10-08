/* tools/perf/main-thread.mjs — 0.5.0 A-M THE MS/S INSTRUMENT: main-thread milliseconds per second while the lab PLAYS.
 *   python3 tools/gate/server.py "$PWD" 8775 &            (kill it by pid afterwards)
 *   LW_PORT=8775 node tools/perf/main-thread.mjs [--runs N] [--secs S] [--json out.json] [--label text]
 * Headless Chromium on the RTX 3070 (the S4c launch: Vulkan, ANGLE, certificate errors ignored) through cdp.mjs.  Each run is a
 * FRESH page (a fresh browser profile and page per run): open /lab/?sw=0&warn=0, wait for __LW.ready, the device report's own
 * "long play" start (device-report.js play(): pause, settle, 400 ms, then LW.play()), sample CDP Performance.getMetrics at t = 0
 * and t = S (default 30 s), and print
 *      main-thread ms/s = ΔTaskDuration × 1000 / S
 * with ΔScriptDuration, ΔLayoutDuration, ΔRecalcStyleDuration (same unit) as attribution lines, the load average before/after, the
 * frames and presents (__LW.stats.frames / presents / skipped over the window) and the git sha of the tree being served.
 * Unlike the device report's play() this puts NO rAF callback on the page: the instrument adds no main-thread work of its own.
 * --runs N (default 5) runs N times in one process; --json writes every sample.  The harness reports the load average with each
 * run: the gate wants < 4 (read /proc/loadavg) and one browser at a time on the shared GPU.
 * A/B between two trees (the integrator): serve each tree on its own port (python3 tools/gate/server.py <rootA> 8775 &,
 * <rootB> 8776 &) and interleave A B A B A B, 5 each, LW_PORT=8775 then LW_PORT=8776 per round; compare the medians against
 * |Δ median| ≤ max(2 × spread, 2 ms/s), spread = max − min of 5 same-tree runs (MEASURE.md §6).
 * THE WARM-UP (2026-10-08, the integrator, after the five floor runs): a FRESH headless Chromium loses its WebGPU device on the
 * page's first navigation ("device lost: A valid external Instance reference no longer exists", or "no WebGPU adapter" from the
 * early request in lab/gpu-boot.js), and every later navigation in the same browser boots the field — 0 of 4 cold launches had
 * `__LW.field.ok`, 2 of 2 reloads did.  So each run navigates ONCE to warm the browser, waits for __LW.ready, then navigates
 * AGAIN for the measured page, and REFUSES to measure unless `__LW.field.ok` is true (`--allow-no-field` keeps the old behaviour
 * for a deliberate no-GPU figure).  The five floor runs in 0.5.0 MEASURE.md §1 were taken before this and had no field present
 * (presents 0): read them as the loop's cost without a picture; the field-present floor is the row that follows them.
 * THE NOTICE (2026-10-08, after the A0 spike's side finding): under a CDP-launched Chromium `navigator.webdriver` is false, so
 * `?warn=0` is not honoured and the photosensitivity notice is OPEN on every fresh profile — the five floor runs in MEASURE §1 and the
 * field-present floor were measured with its pane up.  The instrument now calls `__LW.warning.dismiss()` on the measured page before
 * the play (and records `notice: 'dismissed'`); `--keep-notice` leaves it up (`notice: 'open'`) for a figure comparable with those rows.
 * STATUS: written whole; the first five runs are in 0.4.0 MEASURE.md §6 → 0.5.0 MEASURE.md §1. */
import { launch, sleep } from './cdp.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PORT = process.env.LW_PORT || '8775';
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
if (!process.env.CHROMIUM && fs.existsSync(PW)) process.env.CHROMIUM = PW;
const CHROME_ARGS = ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan', '--enable-webgpu-developer-features'];
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const RUNS = Number(opt('--runs', 5)), SECS = Number(opt('--secs', 30)), JSON_OUT = opt('--json', null), LABEL = opt('--label', '');
const ALLOW_NO_FIELD = argv.includes('--allow-no-field');
const KEEP_NOTICE = argv.includes('--keep-notice');
const load = () => fs.readFileSync('/proc/loadavg', 'utf8').split(' ').slice(0, 3).map(Number);
const sha = () => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };
const med = (a) => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const r3 = (x) => Math.round(x * 1000) / 1000;

async function one(i) {
  const b = await launch({ width: 1600, height: 1000, gpu: true, args: CHROME_ARGS });
  try {
    const url = `https://127.0.0.1:${PORT}/lab/?sw=0&warn=0`;
    const ready = async () => { let r = false; for (let k = 0; k < 120 && !r; k++) { r = await b.eval('!!(window.__LW && __LW.ready)'); if (!r) await sleep(500); } return r; };
    await b.goto(url, 500); if (!(await ready())) throw new Error('the lab never became ready (warm-up): ' + b.logs.slice(0, 3).join(' | '));   // the warm-up navigation (header)
    await b.goto(url, 500); if (!(await ready())) throw new Error('the lab never became ready: ' + b.logs.slice(0, 3).join(' | '));
    const field = await b.eval('(() => { const f = __LW.field || {}; return { ok: !!f.ok, error: f.error ? String(f.error) : null, adapter: f.adapterInfo && f.adapterInfo.description || null }; })()');
    if (!field.ok && !ALLOW_NO_FIELD) throw new Error('no field present on the measured page (__LW.field.ok false: ' + field.error + '); pass --allow-no-field for a deliberate no-GPU figure');
    const notice = await b.eval(`(() => { const w = __LW.warning; if (!w) return 'none'; if (!w.open) return 'closed'; if (${KEEP_NOTICE}) return 'open'; w.dismiss(); return w.open ? 'open' : 'dismissed'; })()`);
    await b.eval('(async () => { __LW.pause(); await __LW.settle(); })()');
    await sleep(400);
    const st = () => b.eval('(() => { const s = __LW.stats || {}; return { frames: s.frames, presents: s.presents, skipped: s.skipped || 0 }; })()');
    await b.eval('__LW.play()');
    const L0 = load(), s0 = await st(), m0 = await b.metrics(), t0 = Date.now();
    await sleep(SECS * 1000);
    const m1 = await b.metrics(), s1 = await st(), L1 = load(), dt = (Date.now() - t0) / 1000;
    const d = (k) => (m1[k] - m0[k]) * 1000 / SECS;
    return { run: i + 1, secs: dt, field, notice, loadBefore: L0, loadAfter: L1, msPerSec: r3(d('TaskDuration')), script: r3(d('ScriptDuration')), layout: r3(d('LayoutDuration')),
      recalcStyle: r3(d('RecalcStyleDuration')), frames: s0.frames === undefined ? null : s1.frames - s0.frames, presents: s0.presents === undefined ? null : s1.presents - s0.presents,
      skipped: s1.skipped - s0.skipped, errors: b.logs.slice(0, 5) };
  } finally { await b.close(); }
}

const out = { sha: sha(), port: PORT, secs: SECS, label: LABEL, when: new Date().toISOString(), runs: [] };
for (let i = 0; i < RUNS; i++) {
  const r = await one(i); out.runs.push(r);
  console.log(`run ${r.run}/${RUNS}  ${r.msPerSec} ms/s   (script ${r.script} · layout ${r.layout} · recalcStyle ${r.recalcStyle} ms/s)  frames ${r.frames ?? '—(__LW.stats not exposed)'} · presents ${r.presents ?? '—'} · held ${r.skipped}  field ${r.field.ok ? 'ok · ' + r.field.adapter : 'ABSENT'} · notice ${r.notice}  load ${r.loadBefore[0]}→${r.loadAfter[0]}  sha ${out.sha}`);
}
const v = out.runs.map((r) => r.msPerSec), m = med(v);
out.median = r3(m); out.spread = r3(Math.max(...v) - Math.min(...v)); out.mad = r3(med(v.map((x) => Math.abs(x - m))));
console.log(`median ${out.median} ms/s · spread (max−min) ${out.spread} · MAD ${out.mad} · ${RUNS} runs · sha ${out.sha}`);
if (JSON_OUT) { fs.mkdirSync(path.dirname(path.resolve(JSON_OUT)), { recursive: true }); fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1)); }
