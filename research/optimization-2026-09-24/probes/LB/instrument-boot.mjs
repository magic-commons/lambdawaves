/* instrument-boot.mjs — copy a lab tree and add boot marks (adapted from probes/E/instrument.mjs + instrument-modwin.mjs).
 *   node research/optimization-2026-09-24/probes/LB/instrument-boot.mjs .tmp/base-lab .tmp/instA
 *   node research/optimization-2026-09-24/probes/LB/instrument-boot.mjs lab .tmp/instB
 * Marks: field created, the modulation block, applySettings → openLink, ready, the first two rAFs; and the summed
 * main-thread ms spent inside modwindow.js place() / paint(force) / rebuild() before ready (B.mw, B.mwn calls).
 * The source tree is never edited. */
import fs from 'node:fs';
const [src, dst] = process.argv.slice(2);
if (!src || !dst) throw new Error('usage: instrument-boot.mjs <src lab dir> <dst dir>');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
const BOOTHEAD = `\n  window.__LWBOOT = { t0: performance.now(), marks: [], mw: 0, mwn: 0, m(n) { this.marks.push([n, +(performance.now() - this.t0).toFixed(2)]); } };`;
function patchLines(file, marks, head) {
  let s = fs.readFileSync(dst + '/' + file, 'utf8');
  const lines = s.split('\n');
  for (const [name, anchor, after] of marks) {
    const i = lines.findIndex((l) => l.includes(anchor));
    if (i < 0) throw new Error(file + ': anchor not found: ' + anchor);
    const stmt = `  window.__LWBOOT && window.__LWBOOT.m(${JSON.stringify(name)});`;
    if (after) lines.splice(i + 1, 0, stmt); else lines.splice(i, 0, stmt);
  }
  s = lines.join('\n');
  if (head) { if (!s.includes(head[0])) throw new Error('head anchor'); s = s.replace(head[0], head[0] + head[1]); }
  fs.writeFileSync(dst + '/' + file, s);
}
patchLines('rack.js', [
  ['field created', 'if (field.ok) gamutCss = (rgb) =>'],
  ['modulation: start', 'const sameCycle = (a, b, L) =>'],
  ['modulation: end', 'modView.restore(readSettings().modwin);', true],
  ['go: applySettings', '  applySettings();'],
  ['go: openLink', 'const linkAtBoot = openLink();'],
], ['export async function boot(dom) {', BOOTHEAD]);
{
  const f = dst + '/rack.js';
  let r = fs.readFileSync(f, 'utf8');
  const a = '  LW.ready = true;\n';
  if (!r.includes(a)) throw new Error('ready anchor');
  r = r.replace(a, '  LW.ready = true; window.__LW_READY_SEEN = true; { const B = window.__LWBOOT; B.ready = performance.now() - B.t0; requestAnimationFrame(() => { B.f1 = performance.now() - B.t0; requestAnimationFrame(() => { B.f2 = performance.now() - B.t0; }); }); }\n');
  fs.writeFileSync(f, r);
}
{
  const f = dst + '/modwindow.js';
  let s = fs.readFileSync(f, 'utf8');
  const wrap = (name, sig, call) => {
    const decl = `  function ${name}(${sig}) {`;
    if (!s.includes(decl)) throw new Error('no ' + decl);
    /* only the OUTERMOST call adds its wall (rebuild → place / sync → paint nest), every call is counted */
    s = s.replace(decl, `  function ${name}(${sig}) { const B = window.__LWBOOT, __t = performance.now(); if (B) B.d = (B.d || 0) + 1; try { return ${name}__inner(${call}); } finally { if (B) { B.d--; if (!window.__LW_READY_SEEN) { B.mwn++; if (B.d === 0) B.mw += performance.now() - __t; } } } }\n  function ${name}__inner(${sig}) {`);
  };
  wrap('place', '', ''); wrap('rebuild', '', ''); wrap('paint', 'force', 'force');
  fs.writeFileSync(f, s);
}
console.log('instrumented', src, '→', dst);
