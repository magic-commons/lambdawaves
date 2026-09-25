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
/* PACE P1/P3: does the loop wait for the GPU here (the boot probe), and what the long play held */
const longOf = (R) => (Array.isArray(R.scenes) ? R.scenes.find((s) => /^long play/.test(s.label) && !s.skipped && !s.error) : null);
const paceOf = (R) => { const lp = longOf(R); return (R.pace ? (R.pace.paced ? 'paced' : 'not paced') : '—') + (lp ? ' · ' + lp.skipped + ' held / ' + lp.presents + ' presents · queue ≤ ' + n(lp.queueMsMax, 0) + ' ms' : ''); };
const restoredOf = (R) => { const r = R.restored || {}; const bad = Object.entries(r).filter(([k, v]) => typeof v === 'string' && /DIFFERENT/.test(v)).map(([k]) => k); return bad.length ? 'DIFFERENT: ' + bad.join(', ') : r.serialize ? (r.serialize === 'identical' ? 'identical' : r.serialize) : '—'; };

const out = [];
out.push('## λWAVES device reports (' + reports.length + ')\n');
out.push(head(['device', 'at', 'adapter', 'dpr (cap)', 'display Hz start→end', 'grid/steps/scale', 'card · frost', 'paced · skipped (long play)', 'GPU frame/recon/present ms', 'scene rAF fps', 'backdrops', 'dom', 'restored']));
for (const { R } of reports) {
  const P = R.platform || {}, S = R.settings || {};
  out.push(row([R.device, String(R.at || '').replace('T', ' ').slice(0, 19), adapterOf(R), n(P.dpr, 2) + ' (' + n(P.dprCap, 1) + ')',
    n(R.display && R.display.rafHz, 1) + '→' + n(R.displayEnd && R.displayEnd.rafHz, 1), qualityOf(R), (S.card || '—') + ' · ' + (S.frost || '—'), paceOf(R),
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
  if (R.pace) out.push('- pace · ' + (R.pace.paced ? 'PACED (the loop holds a present while four frames are unfinished on the GPU)' : 'not paced (completion is not prompt here, so nothing is held)') + ' · boot probe waits ms/presents ' + (Array.isArray(R.pace.waits) ? R.pace.waits.map((w) => w[0] + '/' + w[1]).join(' ') : '—'));
  if (R.boot) out.push('- boot · ' + (R.boot.sinceReadyMs !== null ? R.boot.sinceReadyMs + ' ms after ready' : R.boot.sinceNavigationMs + ' ms after navigation') + ' · canvas ' + (R.boot.canvas || []).join('×') + ' · autoScale ' + R.boot.autoScale + ' · stepCap ' + R.boot.stepCap + ' · ' + R.boot.cls);
  if (R.backdrops) out.push('- backdrops as found · ' + R.backdrops.layers + ' layers (' + R.backdrops.pseudo + ' pseudo, ' + R.backdrops.offscreen + ' off-screen) over ' + R.backdrops.areaPct + ' % · ' + (R.backdrops.top || []).join(' '));
  /* other keys written while it ran: notebook + notebook.title + notebook.subtitle + projects together are a PROJECT OPEN's
     fingerprint (rack.js projects.open) — a hand on the page, whose restore then rides inside a scene */
  const other = R.held && R.held.otherWritesPassed ? Object.entries(R.held.otherWritesPassed).map(([k, v]) => k.replace(/^lambdawaves\.q0\./, '') + '×' + v).join(' ') : '';
  out.push('- held settings writes ' + (R.held ? R.held.settingsWritesHeld : '—') + (other ? ' · other writes passed ' + other : '') + ' · restored ' + restoredOf(R) + ' · wall ' + n((R.wallMs || 0) / 1000, 0) + ' s' + ((R.errors || []).length ? ' · errors: ' + R.errors.join(' / ') : ''));

  if (R.gpu && Array.isArray(R.gpu.rows)) {
    out.push('\n**GPU** (`field.throughput`, batches ≥ ' + R.gpu.targetMs + ' ms; empty completion wait ' + n(R.gpu.tick && R.gpu.tick.medianMs, 1) + ' ms · ' + R.gpu.preset + ')\n');
    out.push(head(['row', 'canvas', 'steps', 'frame ms', 'reconstruct ms', 'present ms', 'n frame/recon/present', '≈ GPU-bound fps']));
    for (const r of R.gpu.rows) out.push(r.skipped ? row([r.label, '—', '—', r.skipped, '', '', '', '']) : row([r.label, r.w + '×' + r.h, r.steps, n(r.frameMs, 3), n(r.reconstructMs, 3), n(r.presentMs, 3), r.n + '/' + r.nReconstruct + '/' + r.nPresent, n(1000 / r.frameMs, 0)]));
    if (R.gpu.gas128 && R.gpu.gas128.skipped) out.push('\n128³ axial gas: ' + R.gpu.gas128.skipped);
  }
  if (Array.isArray(R.scenes)) {
    out.push('\n**Scenes** (rAF over the play; loop = LW.perf.loopMedian; gap = the worst rAF interval)\n');
    out.push(head(['scene', 'rAF fps', 'app fps', 'loop ms', 'median / p95 / max gap ms', 'frames > 2× median', 'backdrops', 'min autoScale', 'governor', 'presents / reconstructs', 'held · in flight ≤ · queue ≤ ms · gaps > 100 ms']));
    for (const s of R.scenes) {
      if (s.rafFps === undefined && Array.isArray(s.switches) && !s.error) { out.push(row([s.label, 'paused: see Grid switches', '', '', '', '', '', '', '', '', ''])); continue; }
      if (typeof s.skipped === 'string' || s.error) { out.push(row([s.label, typeof s.skipped === 'string' ? 'skipped: ' + s.skipped : 'error: ' + s.error, '', '', '', '', '', '', '', '', ''])); continue; }
      out.push(row([s.label, n(s.rafFps, 1), n(s.appFps, 1), n(s.loopMedianMs, 2), n(s.medianFrameMs, 1) + ' / ' + n(s.p95FrameMs, 1) + ' / ' + n(s.maxGapMs, 1), s.over2x,
        s.backdrops ? s.backdrops.layers : '—', s.minAutoScale, s.governorEnd + (s.governorChanges ? ' (' + s.governorChanges + ' changes)' : ''), s.presents + ' / ' + s.reconstructs,
        s.skipped === undefined ? '—' : s.skipped + ' · ' + s.inFlightMax + ' · ' + n(s.queueMsMax, 0) + ' · ' + s.gaps100]));
    }
    out.push('\n**Series** (fps per ' + ((R.scenes.find((s) => s.binMs) || {}).binMs || 250) + ' ms bin; ▌ marks a change; then what moved between bins)\n');
    for (const s of R.scenes) {
      if (!Array.isArray(s.bins)) continue;
      const B = s.bins, W = s.binMs || 250;
      const at = new Map((s.marks || []).map((m) => [Math.min(B.length - 1, Math.floor(m.ms / W)), m]));
      const series = B.map((b, i) => (at.has(i) ? '▌' + at.get(i).what + (at.get(i).via ? ' [' + at.get(i).via + ']' : '') + '▌ ' : '') + (b.gap ? '·' : b.fps)).join(' ');
      out.push('- ' + s.label + ': `' + series + '`');
      if (W >= 1000 && B.some((b) => b.presents !== undefined)) out.push('  - presents / held / queue ms per bin: `' + B.map((b) => b.presents + '/' + (b.skipped === undefined ? '—' : b.skipped) + '/' + n(b.queueMsMax, 0)).join(' ') + '`');
      const moves = [];
      let lastSeen = B[0] && !B[0].gap ? 0 : -1;
      for (let i = 1; i < B.length; i++) {
        if (B[i].gap) continue;
        const k = lastSeen; lastSeen = i; if (k < 0) continue;
        const a = B[k], b = B[i];                                         // across empty bins too: a stall's before and after
        const d = k < i - 1 ? ['after ' + (i - 1 - k) + ' empty bins'] : [];
        if (String(a.canvas) !== String(b.canvas)) d.push('canvas ' + (a.canvas || []).join('×') + '→' + (b.canvas || []).join('×'));
        if (a.autoScale !== b.autoScale) d.push('autoScale ' + a.autoScale + '→' + b.autoScale);
        if (a.stepCap !== b.stepCap) d.push('stepCap ' + a.stepCap + '→' + b.stepCap);
        if (a.field !== b.field) d.push('field ' + a.field + '→' + b.field);
        if (a.gov !== b.gov) d.push('governor ' + a.gov + '→' + b.gov);
        if (a.auto !== b.auto) d.push('auto ' + a.auto + '→' + b.auto);
        if (a.pipesPending !== b.pipesPending) d.push('pipelines pending ' + a.pipesPending + '→' + b.pipesPending);
        if (a.view !== b.view || a.style !== b.style) d.push('look ' + a.view + '/' + a.style + '→' + b.view + '/' + b.style);
        if (a.cls !== b.cls) { const x = new Set(String(a.cls).split(' ')), y = new Set(String(b.cls).split(' ')); const add = [...y].filter((c) => c && !x.has(c)), rem = [...x].filter((c) => c && !y.has(c)); d.push('class ' + [...add.map((c) => '+' + c), ...rem.map((c) => '−' + c)].join(' ')); }
        if (b.maxMs > 100) d.push('gap ' + b.maxMs + ' ms, ' + b.presents + ' presents');
        if (d.length) moves.push((i * W / 1000).toFixed(2) + ' s: ' + d.join(', '));
      }
      if (moves.length) out.push('  - ' + moves.slice(0, 14).join('\n  - ') + (moves.length > 14 ? '\n  - … ' + (moves.length - 14) + ' more' : ''));
    }
    /* THE GRID EDGE (2026-09-25): each tap's sub-timeline, and each rebuild nobody tapped for (the governor's rung) */
    const G = R.scenes.filter((s) => Array.isArray(s.switches) && s.switches.length);
    if (G.length) {
      out.push('\n**Grid switches** (t = the tap, or the rebuild\'s own call when nobody tapped; ms after t unless said; GPU ms = submit → onSubmittedWorkDone, a ~100 ms tick on Firefox; frame = after · encode · recon? · GPU)\n');
      out.push(head(['scene', 'by', 'at s', 'grid', 'via · first sight', 'tap ms', '→ setResolution · its ms', 'queue drain after it (in flight)', 'first frame', 'second frame', 'first present / reconstruct', 'window: worst gap · >100 ms · held · in flight ≤ · pipelines pending ≤', 'before: governor · stepCap · autoScale']));
      const fr = (f) => (f ? n(f.afterMs, 1) + ' · ' + n(f.encodeMs, 2) + ' · ' + (f.reconstructed ? 'R' : '—') + ' · ' + n(f.gpuDoneMs, 1) : '—');
      for (const s of G) for (const w of s.switches) {
        const B = w.before || {}, W = w.window || {};
        const f0 = B.field === undefined ? w.from : B.field, f1 = w.fieldTo || (w.noRebuild ? w.noRebuild.field : w.to);
        const grid = w.from + '→' + w.to + (f0 !== w.from || f1 !== w.to ? ' (field ' + f0 + '→' + f1 + ')' : '');   // the governor's rung puts the field below the grid asked
        out.push(row([s.rafFps === undefined ? 'paused' : 'playing', w.by, n(w.atMs / 1000, 2), grid, (w.via || '—') + (w.firstSight === null || w.firstSight === undefined ? '' : w.firstSight ? ' · first' : ' · seen'),
          n(w.callMs, 2), w.noRebuild ? 'no rebuild (field ' + w.noRebuild.field + '³, ' + w.noRebuild.gov + ')' : n(w.rebuildAfterMs, 1) + ' · ' + n(w.setResolutionMs, 2) + (w.heldBeforeRebuild ? ' (' + w.heldBeforeRebuild + ' held)' : ''),
          n(w.allocDoneMs, 1) + ' (' + n(w.inFlightAtAlloc, 0) + ')', fr(w.firstFrame), fr(w.secondFrame), n(w.firstPresentMs, 1) + ' / ' + n(w.firstReconstructMs, 1),
          W.maxGapMs === undefined ? '—' : n(W.maxGapMs, 1) + ' · ' + W.gaps100 + ' · ' + n(W.held, 0) + ' · ' + n(W.inFlightMax, 0) + ' · ' + n(W.pipesPendingMax, 0),
          (B.gov || '—') + ' · ' + B.stepCap + ' · ' + B.autoScale]));
      }
    }
  }
}
console.log(out.join('\n'));
