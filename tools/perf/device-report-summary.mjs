/* tools/perf/device-report-summary.mjs — read one or more device reports (tools/perf/device-report.js, saved by serve-lan.py
 * under research/device-reports/, or pasted from the toast's COPY into a .json file) and print them as Markdown: one
 * glance row per device, then per device the GPU rows, the scenes, and each edge's 250 ms series with what changed in it.
 *   node tools/perf/device-report-summary.mjs [file.json | dir ...]      (default: research/device-reports/)
 *   --brief    the glance table only */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const brief = args.includes('--brief');
const inputs = args.filter((a) => !a.startsWith('--'));
const files = [];
for (const a of inputs.length ? inputs : ['research/device-reports']) {
  if (!fs.existsSync(a)) { console.error('no such file or folder: ' + a); process.exitCode = 1; continue; }
  if (fs.statSync(a).isDirectory()) for (const f of fs.readdirSync(a).sort()) { if (f.endsWith('.json')) files.push(path.join(a, f)); }
  else files.push(a);
}
const reports = [];
for (const f of files) {
  try { const R = JSON.parse(fs.readFileSync(f, 'utf8')); if (R && R.kind === 'lambdawaves-device-report') reports.push({ f, R }); else console.error('not a device report: ' + f); }
  catch (e) { console.error('unreadable: ' + f + ' — ' + e.message); process.exitCode = 1; }
}
if (!reports.length) { console.error('no device reports found'); process.exit(process.exitCode || 1); }
reports.sort((a, b) => String(a.R.at).localeCompare(String(b.R.at)));

const n = (v, d = 2) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : v === undefined || v === null ? '—' : String(v));
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const row = (a) => '| ' + a.map(cell).join(' | ') + ' |';
const head = (a) => row(a) + '\n' + row(a.map(() => '---'));
const short = (label) => String(label).split(' (')[0].replace('modulation window', 'mod');
const adapterOf = (R) => { const i = R.adapter && R.adapter.info; const s = i ? [i.vendor, i.architecture, i.description].filter(Boolean).join(' ') : ''; return s || (R.adapter && R.adapter.ok ? 'adapter (no info)' : 'no WebGPU'); };
const qualityOf = (R) => { const q = R.settings && R.settings.quality; return q ? q.res + '³/' + q.steps + '/' + q.scale + (q.auto ? ' · auto' : '') : '—'; };
const gpuCell = (R) => (R.gpu && Array.isArray(R.gpu.rows) ? R.gpu.rows.map((r) => (r.skipped ? r.label + ' skip' : short(r.label) + ' ' + n(r.frameMs) + '/' + n(r.reconstructMs) + '/' + n(r.presentMs))).join(' · ') : (R.gpu && R.gpu.skipped) || '—');
const scenesCell = (R) => (Array.isArray(R.scenes) ? R.scenes.map((s) => short(s.label) + ' ' + (s.skipped ? 'skip' : s.error ? 'error' : n(s.rafFps, 0))).join(' · ') : (R.scenes && R.scenes.skipped) || '—');
const restoredOf = (R) => { const r = R.restored || {}; const bad = Object.entries(r).filter(([k, v]) => typeof v === 'string' && /DIFFERENT/.test(v)).map(([k]) => k); return bad.length ? 'DIFFERENT: ' + bad.join(', ') : r.serialize ? (r.serialize === 'identical' ? 'identical' : r.serialize) : '—'; };

const out = [];
out.push('## λWAVES device reports (' + reports.length + ')\n');
out.push(head(['device', 'at', 'adapter', 'dpr (cap)', 'display Hz start→end', 'grid/steps/scale', 'card · frost', 'GPU frame/recon/present ms', 'scene rAF fps', 'backdrops', 'dom', 'restored']));
for (const { R } of reports) {
  const P = R.platform || {}, S = R.settings || {};
  out.push(row([R.device, String(R.at || '').replace('T', ' ').slice(0, 19), adapterOf(R), n(P.dpr, 2) + ' (' + n(P.dprCap, 1) + ')',
    n(R.display && R.display.rafHz, 1) + '→' + n(R.displayEnd && R.displayEnd.rafHz, 1), qualityOf(R), (S.card || '—') + ' · ' + (S.frost || '—'),
    gpuCell(R), scenesCell(R), R.backdrops ? R.backdrops.layers + ' (' + R.backdrops.areaPct + ' %)' : '—', R.dom ? R.dom.elements : '—', restoredOf(R)]));
}

if (!brief) for (const { f, R } of reports) {
  const P = R.platform || {}, S = R.settings || {}, A = R.adapter || {};
  out.push('\n### ' + R.device + ' · ' + R.at + '\n');
  out.push('`' + f + '` · build ' + (R.build || '—') + ' · ' + (P.ua || '') + '\n');
  out.push('- screen ' + (P.screen || []).join('×') + ' · viewport ' + (P.viewport || []).join('×') + ' · dpr ' + P.dpr + ' (cap ' + P.dprCap + ') · canvas ' + ((P.canvas && P.canvas.px) || []).join('×')
    + ' · ' + (P.tablet ? 'TABLET' : P.phone ? 'PHONE' : 'desktop') + ' · touch ' + P.touch + ' · pointer ' + P.pointer + ' · reduced motion ' + P.reducedMotion + ' · timer ' + P.timerResolutionMs + ' ms');
  out.push('- display (nothing playing) · start ' + n(R.display && R.display.rafHz, 1) + ' Hz (p95 ' + n(R.display && R.display.p95Ms, 1) + ' ms)' + (R.display && R.display.uiHidden ? ', UI hidden ' + n(R.display.uiHidden.rafHz, 1) + ' Hz' : '')
    + ' · end ' + n(R.displayEnd && R.displayEnd.rafHz, 1) + ' Hz' + (R.displayEnd && R.displayEnd.uiHidden ? ', UI hidden ' + n(R.displayEnd.uiHidden.rafHz, 1) + ' Hz' : ''));
  out.push('- adapter ' + adapterOf(R) + ' · ' + (A.preferredFormat || A.format || '—') + ' · f16 ' + (A.featureFlags ? A.featureFlags.shaderF16 : '—') + ' · timestamp-query ' + (A.featureFlags ? A.featureFlags.timestampQuery : '—')
    + ' · tier1 ' + (A.featureFlags ? A.featureFlags.textureFormatsTier1 : '—') + ' · WGSL ' + ((A.wgslLanguageFeatures || []).length) + ' features');
  out.push('- settings · ' + qualityOf(R) + ' · autoScale ' + (S.quality ? S.quality.autoScale : '—') + ' · field ' + S.fieldResolution + '³ · card ' + S.card + (S.cardChosen ? ' (chosen)' : ' (default)') + ' · frost ' + S.frost + ' · blur ' + S.blur
    + ' · ' + S.theme + ' · ' + (S.disconnected ? 'disconnected' : 'connected') + ' · governor ' + (S.governor ? S.governor.state : '—') + ' · ' + S.view + '/' + S.style + ' · ' + S.hamiltonian + ' ' + (S.preset || '') + ' · ' + S.openWindows + ' windows');
  if (R.boot) out.push('- boot · ' + (R.boot.sinceReadyMs !== null ? R.boot.sinceReadyMs + ' ms after ready' : R.boot.sinceNavigationMs + ' ms after navigation') + ' · canvas ' + (R.boot.canvas || []).join('×') + ' · autoScale ' + R.boot.autoScale + ' · stepCap ' + R.boot.stepCap + ' · ' + R.boot.cls);
  if (R.backdrops) out.push('- backdrops as found · ' + R.backdrops.layers + ' layers (' + R.backdrops.pseudo + ' pseudo, ' + R.backdrops.offscreen + ' off-screen) over ' + R.backdrops.areaPct + ' % · ' + (R.backdrops.top || []).join(' '));
  out.push('- held settings writes ' + (R.held ? R.held.settingsWritesHeld : '—') + ' · restored ' + restoredOf(R) + ' · wall ' + n((R.wallMs || 0) / 1000, 0) + ' s' + ((R.errors || []).length ? ' · errors: ' + R.errors.join(' / ') : ''));

  if (R.gpu && Array.isArray(R.gpu.rows)) {
    out.push('\n**GPU** (`field.throughput`, batches ≥ ' + R.gpu.targetMs + ' ms; empty completion wait ' + n(R.gpu.tick && R.gpu.tick.medianMs, 1) + ' ms · ' + R.gpu.preset + ')\n');
    out.push(head(['row', 'canvas', 'steps', 'frame ms', 'reconstruct ms', 'present ms', 'n frame/recon/present', '≈ GPU-bound fps']));
    for (const r of R.gpu.rows) out.push(r.skipped ? row([r.label, '—', '—', r.skipped, '', '', '', '']) : row([r.label, r.w + '×' + r.h, r.steps, n(r.frameMs, 3), n(r.reconstructMs, 3), n(r.presentMs, 3), r.n + '/' + r.nReconstruct + '/' + r.nPresent, n(1000 / r.frameMs, 0)]));
    if (R.gpu.gas128 && R.gpu.gas128.skipped) out.push('\n128³ axial gas: ' + R.gpu.gas128.skipped);
  }
  if (Array.isArray(R.scenes)) {
    out.push('\n**Scenes** (rAF over the play; loop = LW.perf.loopMedian; gap = the worst rAF interval)\n');
    out.push(head(['scene', 'rAF fps', 'app fps', 'loop ms', 'median / p95 / max gap ms', 'frames > 2× median', 'backdrops', 'min autoScale', 'governor', 'presents / reconstructs']));
    for (const s of R.scenes) {
      if (s.skipped || s.error) { out.push(row([s.label, s.skipped ? 'skipped: ' + s.skipped : 'error: ' + s.error, '', '', '', '', '', '', '', ''])); continue; }
      out.push(row([s.label, n(s.rafFps, 1), n(s.appFps, 1), n(s.loopMedianMs, 2), n(s.medianFrameMs, 1) + ' / ' + n(s.p95FrameMs, 1) + ' / ' + n(s.maxGapMs, 1), s.over2x,
        s.backdrops ? s.backdrops.layers : '—', s.minAutoScale, s.governorEnd + (s.governorChanges ? ' (' + s.governorChanges + ' changes)' : ''), s.presents + ' / ' + s.reconstructs]));
    }
    out.push('\n**Series** (fps per ' + ((R.scenes.find((s) => s.binMs) || {}).binMs || 250) + ' ms bin; ▌ marks a change; then what moved between bins)\n');
    for (const s of R.scenes) {
      if (!Array.isArray(s.bins)) continue;
      const B = s.bins, W = s.binMs || 250;
      const at = new Map((s.marks || []).map((m) => [Math.min(B.length - 1, Math.floor(m.ms / W)), m]));
      const series = B.map((b, i) => (at.has(i) ? '▌' + at.get(i).what + (at.get(i).via ? ' [' + at.get(i).via + ']' : '') + '▌ ' : '') + (b.gap ? '·' : b.fps)).join(' ');
      out.push('- ' + s.label + ': `' + series + '`');
      const moves = [];
      for (let i = 1; i < B.length; i++) {
        const a = B[i - 1], b = B[i]; if (a.gap || b.gap) continue;
        const d = [];
        if (String(a.canvas) !== String(b.canvas)) d.push('canvas ' + (a.canvas || []).join('×') + '→' + (b.canvas || []).join('×'));
        if (a.autoScale !== b.autoScale) d.push('autoScale ' + a.autoScale + '→' + b.autoScale);
        if (a.stepCap !== b.stepCap) d.push('stepCap ' + a.stepCap + '→' + b.stepCap);
        if (a.field !== b.field) d.push('field ' + a.field + '→' + b.field);
        if (a.gov !== b.gov) d.push('governor ' + a.gov + '→' + b.gov);
        if (a.auto !== b.auto) d.push('auto ' + a.auto + '→' + b.auto);
        if (a.pipesPending !== b.pipesPending) d.push('pipelines pending ' + a.pipesPending + '→' + b.pipesPending);
        if (a.cls !== b.cls) { const x = new Set(String(a.cls).split(' ')), y = new Set(String(b.cls).split(' ')); const add = [...y].filter((c) => c && !x.has(c)), rem = [...x].filter((c) => c && !y.has(c)); d.push('class ' + [...add.map((c) => '+' + c), ...rem.map((c) => '−' + c)].join(' ')); }
        if (b.maxMs > 100) d.push('gap ' + b.maxMs + ' ms, ' + b.presents + ' presents');
        if (d.length) moves.push((i * W / 1000).toFixed(2) + ' s: ' + d.join(', '));
      }
      if (moves.length) out.push('  - ' + moves.slice(0, 14).join('\n  - ') + (moves.length > 14 ? '\n  - … ' + (moves.length - 14) + ' more' : ''));
    }
  }
}
console.log(out.join('\n'));
