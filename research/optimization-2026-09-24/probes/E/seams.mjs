/* seams.mjs — closure dependencies of candidate extraction blocks inside boot() in lab/rack.js.
 * For each block (a line range), lists the boot-level bindings (declared at 2-space indent inside boot, outside
 * the block) that the block READS, and those it WRITES (assignment / ++ / -- / compound), plus what it declares.
 * Strings and comments are blanked first, so a name in prose is not an edge.  Approximate by design (no scope
 * analysis inside the block beyond "declared in the block"); good enough to size a seam.
 *   node research/optimization-2026-09-24/probes/E/seams.mjs
 */
import fs from 'node:fs';
const SRC = fs.readFileSync('lab/rack.js', 'utf8');
/* blank comments and string/template contents, keeping line structure */
function blank(src) {
  let out = '', i = 0, n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && d === '*') { while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; } out += '  '; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; out += q; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { out += '  '; i += 2; continue; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') { // keep template expressions (they reference code)
          let depth = 0; do { if (src[i] === '{') depth++; if (src[i] === '}') depth--; out += src[i]; i++; } while (i < n && depth > 0); continue; }
        out += src[i] === '\n' ? '\n' : ' '; i++;
      }
      out += q; i++; continue;
    }
    out += c; i++;
  }
  return out;
}
const B = blank(SRC).split('\n');
const bootStart = B.findIndex((l) => /^export async function boot\(dom\)/.test(l));
/* boot-level declarations: lines at exactly two spaces of indent */
const decl = new Map();   // name -> line (1-based)
const declRe = /^  (?:const|let|var|function|async function)\s+([^=(;]+)/;
for (let i = bootStart + 1; i < B.length; i++) {
  const m = B[i].match(declRe); if (!m) continue;
  const head = m[1];
  if (/^function|^async/.test(B[i].trim().replace(/^async /, ''))) { const f = B[i].match(/function\s+([A-Za-z_$][\w$]*)/); if (f) decl.set(f[1], i + 1); continue; }
  /* const a = …, b = …  /  let { x } … : take top-level comma-separated names of the declaration line */
  const line = B[i].replace(/^  (?:const|let|var)\s+/, '');
  let depth = 0, cur = '', names = [];
  for (const ch of line) { if ('([{'.includes(ch)) depth++; if (')]}'.includes(ch)) depth--; if (depth === 0 && ch === ',') { names.push(cur); cur = ''; } else cur += ch; if (depth === 0 && ch === ';') break; }
  names.push(cur);
  for (const nm of names) { const mm = nm.trim().match(/^([A-Za-z_$][\w$]*)\s*(=|$|;)/); if (mm) decl.set(mm[1], i + 1); }
}
const BLOCKS = [
  ['accent + mark + turn', 104, 236], ['settings key (read/save/apply)', 237, 403], ['taxonomy + quality/governor state', 404, 445],
  ['camera law (object)', 446, 500], ['perf + reader law', 501, 572], ['mod glue: rotation rates + audio + bases', 573, 719],
  ['busy mark', 720, 751], ['field + banner + workers + warm', 752, 846], ['page visibility', 847, 918],
  ['router + loop + meters', 919, 1015], ['camera law (pose functions)', 1016, 1104], ['loop()', 1105, 1395],
  ['motion preference', 1396, 1429], ['state API (touch/preset/ref/api)', 1430, 1483],
  ['win: WAVE/PALETTE/CAMERA/CLIP/SETTINGS', 1484, 1975], ['win: STATE', 1976, 2140], ['win: SPECTRUM + H/Sturmian/element', 2141, 2350],
  ['win: SHADOW..QCD', 2351, 2441], ['win: legacy MOLECULE', 2442, 2468], ['win: HELIUM/H2/CHEM/REGISTER', 2469, 2525],
  ['win: CALCULUS/METERS/LADDER', 2526, 2559], ['modulation defs + host + window', 2560, 2851], ['win: ATOMS/FIELD/WIGNER/RADIATION', 2852, 2937],
  ['transport strip + period', 2938, 3099], ['clock link: playMod/togglePlay/arm/barLock', 3100, 3160], ['badges', 3161, 3232],
  ['swClient', 3233, 3347], ['bow + kepler surface + gas', 3348, 3617], ['occlusion + floats + layout object', 3618, 4014],
  ['wTr + chrome (dock/peek/modexp)', 4015, 4073], ['menubar', 4074, 4177], ['keymap', 4178, 4209], ['LEAN + KIND passes', 4210, 4233],
  ['+ / ☆ lists', 4234, 4336], ['notebook + projects', 4337, 4599], ['peek + drags + pop/rail', 4600, 4781],
  ['phone / tablet', 4782, 4899], ['stage gestures', 4900, 4940], ['keyboard (ACTIONS + dispatcher)', 4941, 5211],
  ['persistence (serialize/restore)', 5212, 5449], ['links', 5450, 5527], ['history (look + ring + window)', 5528, 5705],
  ['LW surface', 5706, 5953], ['go (defaults, warning, rework, ready)', 5954, 6079],
];
const words = (s) => s.match(/(?<![\w$.])[A-Za-z_$][\w$]*/g) || [];
const out = [];
for (const [name, a, b] of BLOCKS) {
  const text = B.slice(a - 1, b).join('\n');
  const own = new Set([...decl].filter(([, ln]) => ln >= a && ln <= b).map(([k]) => k));
  const reads = new Set(), writes = new Set();
  for (const w of words(text)) if (decl.has(w) && !own.has(w)) reads.add(w);
  for (const w of reads) { const re = new RegExp('(?<![\\w$.])' + w.replace(/\$/g, '\\$') + '\\s*(=(?!=)|\\+\\+|--|\\+=|-=|\\*=|\\|\\|=|&&=)|(\\+\\+|--)' + w.replace(/\$/g, '\\$') + '(?![\\w$])'); if (re.test(text)) writes.add(w); }
  out.push({ name, lines: `${a}–${b}`, n: b - a + 1, declares: own.size, reads: [...reads].sort(), writes: [...writes].sort() });
}
fs.writeFileSync('research/optimization-2026-09-24/probes/E/seams.json', JSON.stringify({ bootDecls: decl.size, blocks: out }, null, 1));
for (const o of out) console.log(`${o.lines.padEnd(10)} ${String(o.n).padStart(4)}L  in=${String(o.reads.length).padStart(3)} w=${String(o.writes.length).padStart(2)} own=${String(o.declares).padStart(3)}  ${o.name}  | writes: ${o.writes.join(' ')}`);
