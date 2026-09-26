// S4 VERIFY item 12: classify the builder's lab/ lines (4d526a8..927bd03, sw.js aside) as comment or code, by scanning each
// file's pre/post image for /* … */ and // spans (strings and template literals skipped; regex literals are rare in these lines).
//   node research/release-0.3.1/probes/S4-verify/count-lines.mjs   (from the worktree root)
import { execFileSync } from 'node:child_process';
const A = '4d526a8', B = '927bd03';
const files = ['lab/chemview.js', 'lab/history.js', 'lab/keys.js', 'lab/lab.css', 'lab/rack.js'];
const show = (rev, f) => execFileSync('git', ['show', rev + ':' + f], { encoding: 'utf8', maxBuffer: 64 << 20 });
/** per line: true when the line carries code (any non-space character outside a comment) */
function codeLines(src) {
  const out = []; let inBlock = false, str = null, lineHasCode = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], d = src[i + 1];
    if (c === '\n') { out.push(lineHasCode); lineHasCode = false; if (str && str !== '`') str = null; continue; }
    if (inBlock) { if (c === '*' && d === '/') { inBlock = false; i++; } continue; }
    if (str) { if (c === '\\') { i++; continue; } if (c === str) str = null; lineHasCode = true; continue; }
    if (c === '/' && d === '*') { inBlock = true; i++; continue; }
    if (c === '/' && d === '/' ) { while (i + 1 < src.length && src[i + 1] !== '\n') i++; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; lineHasCode = true; continue; }
    if (!/\s/.test(c)) lineHasCode = true;
  }
  out.push(lineHasCode); return out;
}
const tot = { add: 0, addCode: 0, del: 0, delCode: 0 };
for (const f of files) {
  const pre = codeLines(show(A, f)), post = codeLines(show(B, f));
  const diff = execFileSync('git', ['diff', '-U0', A, B, '--', f], { encoding: 'utf8' });
  let o = 0, nn = 0; const r = { add: 0, addCode: 0, del: 0, delCode: 0 };
  for (const line of diff.split('\n')) {
    const h = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line); if (h) { o = +h[1]; nn = +h[2]; continue; }
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+')) { r.add++; if (post[nn - 1]) r.addCode++; nn++; }
    else if (line.startsWith('-')) { r.del++; if (pre[o - 1]) r.delCode++; o++; }
  }
  console.log(f.padEnd(18), JSON.stringify(r)); for (const k in tot) tot[k] += r[k];
}
console.log('TOTAL (sw.js aside)', JSON.stringify(tot), '· comment lines added', tot.add - tot.addCode, '· net code', tot.addCode - tot.delCode, '· net comment', (tot.add - tot.addCode) - (tot.del - tot.delCode));
