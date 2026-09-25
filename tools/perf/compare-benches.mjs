/* compare-benches.mjs — the before/after table of the optimization run, from the baseline-*.json and after-*.json files.
 *   node tools/perf/compare-benches.mjs [research/optimization-2026-09-24]
 * Scenes are matched by their `label`; boot / gpu / projects by key. Prints Markdown. */
import fs from 'node:fs';
import path from 'node:path';
const DIR = process.argv[2] || 'research/optimization-2026-09-24';
const load = (f) => { const p = path.join(DIR, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const fmt = (v, d = 1) => (v === undefined || v === null || Number.isNaN(v)) ? '—' : (typeof v === 'number' ? v.toFixed(d) : String(v));
const pct = (a, b) => (typeof a === 'number' && typeof b === 'number' && a) ? ((b - a) / a * 100) : null;
const sign = (p) => p === null ? '' : (p >= 0 ? '+' : '') + p.toFixed(0) + ' %';
function scenes(title, A, B, key = 'rafFps', unit = 'fps') {
  if (!A || !B) { console.log(`\n### ${title}\n\n(missing: ${!A ? 'baseline' : 'after'})`); return; }
  const byLabel = new Map((B.scenes || []).map((s) => [s.label, s]));
  console.log(`\n### ${title}\n\n| scene | before ${unit} | after ${unit} | Δ | loop ms before → after |\n|---|---|---|---|---|`);
  for (const a of A.scenes || []) {
    const b = byLabel.get(a.label);
    console.log(`| ${a.label} | ${fmt(a[key])} | ${b ? fmt(b[key]) : '—'} | ${b ? sign(pct(a[key], b[key])) : ''} | ${fmt(a.loopMedianMs, 2)} → ${b ? fmt(b.loopMedianMs, 2) : '—'} |`);
  }
  if (A.boot && B.boot) console.log(`\nboot readyMs ${fmt(A.boot.readyMs, 0)} → ${fmt(B.boot.readyMs, 0)} (${sign(pct(A.boot.readyMs, B.boot.readyMs))})`);
  if (A.gpu && B.gpu) for (const g of A.gpu) { const h = (B.gpu || []).find((x) => x.label === g.label); if (h) console.log(`gpu ${g.label}: frame ${fmt(g.frameMs, 2)} → ${fmt(h.frameMs, 2)} ms · reconstruct ${fmt(g.reconstructMs, 2)} → ${fmt(h.reconstructMs, 2)} · present ${fmt(g.presentMs, 2)} → ${fmt(h.presentMs, 2)} (n ${g.n}/${h.n})`); }
}
scenes('Headed Firefox (WebRender on the RTX 3070 — Josh\'s compositor)', load('baseline-firefox-headed.json'), load('after-firefox-headed.json'));
scenes('Electron 44 / Chromium 152 (the other compositor)', load('baseline-chromium.json'), load('after-chromium.json'));
const F0 = load('baseline-firefox.json'), F1 = load('after-firefox.json');
if (F0 && F1) {
  console.log('\n### Headless Firefox (boot, projects, the loop)\n');
  const b0 = F0.boot, b1 = F1.boot;
  console.log(`| boot | before | after | Δ |\n|---|---|---|---|`);
  for (const k of ['readyMs', 'domContentLoaded', 'lastResourceEnd', 'js', 'jsBytes', 'allBytes']) console.log(`| ${k} | ${fmt(b0[k], 0)} | ${fmt(b1[k], 0)} | ${sign(pct(b0[k], b1[k]))} |`);
  const p0 = F0.projects, p1 = F1.projects;
  console.log(`\n| projects | before | after | Δ |\n|---|---|---|---|`);
  for (const k of Object.keys(p0 || {})) console.log(`| ${k} | ${fmt(p0[k], 2)} | ${fmt(p1 && p1[k], 2)} | ${sign(pct(p0[k], p1 && p1[k]))} |`);
  const byLabel = new Map((F1.loop || []).map((s) => [s.label, s]));
  console.log(`\n| loop scene | fps before → after | loop median ms before → after (before = last frame, not a median) |\n|---|---|---|`);
  for (const a of F0.loop || []) { const b = byLabel.get(a.label); console.log(`| ${a.label} | ${fmt(a.fps)} → ${b ? fmt(b.fps) : '—'} | ${fmt(a.loopMedianMs, 2)} → ${b ? fmt(b.loopMedianMs, 2) : '—'} |`); }
  const gl = new Map((F1.gpu || []).map((g) => [g.label, g]));
  console.log(`\n| gpu (Firefox completion-tick caveat: sub-ms values are ticks) | frame ms before → after | reconstruct | present |\n|---|---|---|---|`);
  for (const g of F0.gpu || []) { const h = gl.get(g.label); console.log(`| ${g.label} | ${fmt(g.frameMs, 2)} → ${h ? fmt(h.frameMs, 2) : '—'} | ${fmt(g.reconstructMs, 2)} → ${h ? fmt(h.reconstructMs, 2) : '—'} | ${fmt(g.presentMs, 2)} → ${h ? fmt(h.presentMs, 2) : '—'} |`); }
}
