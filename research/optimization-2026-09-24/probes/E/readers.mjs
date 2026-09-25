// For every ui.<name> handle and every __LW_hooks.<name> key assigned in rack.js / native-ui.js, count:
//  lab reads (any lab/*.js, minus assignment sites), shipped-test mentions (bare word), legacy-test mentions.
// Run from the worktree root:  node research/optimization-2026-09-24/probes/E/readers.mjs
import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const labFiles = fs.readdirSync('lab').filter((f) => f.endsWith('.js')).map((f) => 'lab/' + f);
const lab = Object.fromEntries(labFiles.map((f) => [f, read(f)]));
const testFiles = fs.readdirSync('tests').filter((f) => f.endsWith('.mjs')).map((f) => 'tests/' + f);
const shipped = testFiles.map(read).join('\n');
const legacy = read('tests/legacy/boot.browser-test.mjs');
const src = lab['lab/rack.js'] + '\n' + lab['lab/native-ui.js'];
const escRe = (s) => s.replace(/[.$]/g, (c) => '\\' + c);
function handles(prefix) {
  const re = new RegExp(escRe(prefix) + '([A-Za-z_$][\\w$]*)\\s*=(?!=)', 'g');
  return [...new Set([...src.matchAll(re)].map((m) => m[1]))].sort();
}
const count = (text, re) => (text.match(re) || []).length;
function report(prefix, names) {
  const out = [];
  for (const n of names) {
    const esc = escRe(prefix + n) + '(?![\\w$])';
    const all = new RegExp(esc, 'g'), assign = new RegExp(esc + '\\s*=(?!=)', 'g');
    let labReads = 0; const where = [];
    for (const [f, t] of Object.entries(lab)) { const k = count(t, all) - count(t, assign); if (k > 0) { labReads += k; where.push(f.replace('lab/', '') + ':' + k); } }
    const bare = new RegExp('\\b' + escRe(n) + '\\b', 'g');
    out.push({ name: prefix + n, labReads, where: where.join(' '), shippedTests: count(shipped, bare), legacyTests: count(legacy, bare) });
  }
  return out;
}
const ui = report('ui.', handles('ui.'));
const hooks = report('__LW_hooks.', handles('__LW_hooks.'));
const fmt = (r) => r.map((x) => `${x.name.padEnd(34)} lab=${String(x.labReads).padStart(3)} tests=${String(x.shippedTests).padStart(3)} legacy=${String(x.legacyTests).padStart(3)}  ${x.where}`).join('\n');
console.log('== ui.* (' + ui.length + ')\n' + fmt(ui));
console.log('\n== __LW_hooks.* (' + hooks.length + ')\n' + fmt(hooks));
