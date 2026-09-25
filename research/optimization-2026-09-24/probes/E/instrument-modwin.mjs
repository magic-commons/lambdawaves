// Wrap place(), paint() and rebuild() in the COPY of modwindow.js (probes/E/lab-inst/) with per-call timing marks,
// so the boot probe shows how often a CLOSED modulation window lays itself out during boot, and what each costs.
//   node research/optimization-2026-09-24/probes/E/instrument-modwin.mjs
import fs from 'node:fs';
const F = 'research/optimization-2026-09-24/probes/E/lab-inst/modwindow.js';
let s = fs.readFileSync(F, 'utf8');
for (const name of ['place', 'rebuild']) {
  const decl = `  function ${name}() {`;
  if (!s.includes(decl)) throw new Error('no ' + decl);
  s = s.replace(decl, `  function ${name}() { const __t = performance.now(); try { return ${name}__inner(); } finally { const B = window.__LWBOOT; if (B && !window.__LW_READY_SEEN) B.m('${name}() ' + (performance.now() - __t).toFixed(2) + ' ms, open=' + P.open); } }\n  function ${name}__inner() {`);
}
const pdecl = '  function paint(force) {';
s = s.replace(pdecl, `  function paint(force) { const __t = performance.now(); try { return paint__inner(force); } finally { const B = window.__LWBOOT; if (B && !window.__LW_READY_SEEN && force) B.m('paint(true) ' + (performance.now() - __t).toFixed(2) + ' ms, open=' + P.open); } }\n  function paint__inner(force) {`);
fs.writeFileSync(F, s);
// stop recording after ready so frame-loop paints do not flood the marks
const R = 'research/optimization-2026-09-24/probes/E/lab-inst/rack.js';
let r = fs.readFileSync(R, 'utf8');
r = r.replace('  LW.ready = true;\n', '  LW.ready = true; window.__LW_READY_SEEN = true;\n');
fs.writeFileSync(R, r);
console.log('modwindow instrumented');
