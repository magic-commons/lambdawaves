/* .tmp/r2b-move.mjs — R2b THE MOVE: the three readout spans → lab/windows/readouts.js (three seats), THE BOW + KEPLER → lab/windows/kepler.js,
 * verbatim, at the walker's token positions (no sed).  Prints every edit.   node .tmp/r2b-move.mjs [--write] */
import { readFileSync, writeFileSync } from 'node:fs';
import { lex, pairBrackets, scopeWalk } from '../tools/rack-deps.mjs';

const ROOT = new URL('../', import.meta.url);
const RACK = new URL('lab/rack.js', ROOT);
const src = readFileSync(RACK, 'utf8');
const lines = src.split('\n');
const L = lex(src), M = pairBrackets(L.toks), W = scopeWalk(L.toks, M);
const { toks } = L;
const boot = W.bootHits[0].scope;
const declLine = (n) => { const d = boot.names.get(n); return d ? toks[d.at].line : -1; };
const die = (m) => { console.error('STOP: ' + m); process.exit(1); };
const one = (pred, what) => { const h = []; lines.forEach((s, i) => pred(s) && h.push(i + 1)); if (h.length !== 1) die(`${what}: ${h.length} lines`); return h[0]; };
const trimEnd = (b) => { while (lines[b - 1] === '') b--; return b; };

/* ── the spans (1-based, inclusive); each anchor line stays in rack.js as its seat's header ── */
const A0 = one((s) => s === '  // SHADOW', 'SHADOW'), A1 = A0 + 1, A1e = trimEnd(one((s) => s.startsWith('  /* ── LEGACY WINDOWS'), 'LEGACY') - 1);
const B0 = one((s) => s.startsWith('  // CALCULUS — the stats'), 'CALCULUS'), B1 = B0 + 1, B1e = trimEnd(one((s) => s.startsWith('  /* ── WAVE 52 · W-MODWINDOW'), 'MODWINDOW') - 1);
const C0 = one((s) => s.startsWith('  // ATOMS — the periodic table'), 'ATOMS'), C1 = C0 + 2, C1e = one((s) => s.startsWith('  Object.assign(READERS, {'), 'READERS') - 1;
const K0 = one((s) => s.startsWith('  /* ── THE BOW:'), 'BOW'), K1 = K0 + 1, K1e = trimEnd(one((s) => s.startsWith('  /* ── THE FLOATING RACK'), 'FLOATING') - 1);
if (!lines[C0].startsWith('  // no longer LEGACY')) die('ATOMS comment is not two lines');
if (!lines[C1e - 1].startsWith('  const WIG_OK =')) die('the third span does not end at WIG_OK');
/* two blank lines inside ORBIT's block (a subtraction, said in the BUILD) */
const blankPair = one((s) => s === "    const rk = wOrb.row('tight');", 'ORBIT rk') + 1;
if (!(lines[blankPair - 1] === '' && lines[blankPair] === '')) die('ORBIT blank pair moved');
const SKIP = new Set([blankPair, blankPair + 1]);

const MODS = {
  readouts: {
    parts: [[A1, A1e], [B1, B1e], [C1, C1e]],
    handed: { '': ['dom', 'ui', 'device', 'reg', 'clock', 'useCompactDefaults'], loop: ['schedule', 'canPresent'], host: ['rack'], w: ['setElement', 'fillValence'],
      ctl: ['domain', 'cardLoading', 'solveCard', 'touchState', 'api'] },
    use: { keplerRowSync: 'app.w.keplerRowSync', keplerTurn: 'app.w.keplerTurn', wChem: 'app.w.wChem', wOrbs: 'app.w.wOrbs' },
    eagerOk: new Set(['wChem', 'wOrbs']),   // read at the SECOND seat, after MOLECULES registered them (rack.js' app.w.wChem/wOrbs fill, R2d's)
  },
  kepler: {
    parts: [[K1, K1e]],
    handed: { '': ['dom', 'ui', 'reg', 'clock', 'obs', 'mat'], loop: ['schedule', 'canPresent'], host: ['camera'], w: ['wState', 'wSpec', 'switchHamiltonian', 'kepler'],
      ctl: ['domain', 'field', 'maths', 'touchState'] },
    use: { keyState: 'app.sh.keyState' },
    eagerOk: new Set(),
  },
};
const inSpan = (m, line) => m.parts.some(([a, b]) => line >= a && line <= b);
const inAny = (line) => Object.values(MODS).some((m) => inSpan(m, line));
const rep = new Map(), report = [];
for (const [id, m] of Object.entries(MODS)) {
  const handedAll = new Set(Object.values(m.handed).flat());
  const free = new Map(), problems = [];
  for (const r of W.refs) {
    if (!inSpan(m, r.line) || r.where !== 'boot' || r.name === 'app') continue;
    const dl = declLine(r.name);
    if (inSpan(m, dl)) continue;
    free.set(r.name, (free.get(r.name) || 0) + 1);
    if (r.kind === 'write' || r.kind === 'rw') problems.push(`line ${r.line}: a write to ${r.name}`);
    if (Object.hasOwn(m.use, r.name)) {
      rep.set(r.at, W.shorthands.has(r.at) ? `${r.name}: ${m.use[r.name]}` : m.use[r.name]);
      report.push(`${id} ${r.line} ${r.name} → ${m.use[r.name]}${r.deferred ? '' : '   (eager at its seat)'}`);
      if (!r.deferred && !m.eagerOk.has(r.name)) problems.push(`line ${r.line}: ${r.name} read at use EAGERLY`);
    } else if (!handedAll.has(r.name)) problems.push(`line ${r.line}: ${r.name} (declared ${dl}) neither handed nor read at use`);
  }
  for (const h of handedAll) if (!free.has(h)) problems.push(`${h} handed but never read`);
  m.declared = m.parts.map(([a, b]) => [...boot.names].filter(([, d]) => toks[d.at].line >= a && toks[d.at].line <= b).map(([n]) => n));
  m.returns = m.parts.map((p, k) => m.declared[k].filter((n) => W.refs.some((r) => r.where === 'boot' && r.name === n && !inAny(r.line))));
  console.log(`${id}: parts ${JSON.stringify(m.parts)} free ${[...free.keys()].sort().join(', ')}\n  boot reads: ${m.returns.map((x) => x.join(' ')).join(' | ')}`);
  if (problems.length) die(id + ':\n  ' + problems.join('\n  '));
}
console.log('at-use edits (' + rep.size + '):\n' + report.join('\n'));

const lineStart = [0]; for (let k = 0; k < src.length; k++) if (src.charCodeAt(k) === 10) lineStart.push(k + 1);
const edits = [...rep.entries()].map(([k, text]) => ({ from: toks[k].at, to: toks[k].at + toks[k].v.length, text })).sort((a, b) => a.from - b.from);
const textOfLines = (a, b) => {
  const out = [];
  for (let k = a; k <= b; k++) {
    if (SKIP.has(k)) continue;
    const s0 = lineStart[k - 1], s1 = s0 + lines[k - 1].length;
    let s = '', pos = s0;
    for (const e of edits) if (e.from >= s0 && e.to <= s1) { s += src.slice(pos, e.from) + e.text; pos = e.to; }
    out.push(s + src.slice(pos, s1));
  }
  return out;
};
const wrap = (head, names, tail, indent = '    ') => {
  const out = []; let cur = head;
  names.forEach((n, i) => { const piece = n + (i < names.length - 1 ? ', ' : tail); if ((cur + piece).trimEnd().length > 200) { out.push(cur.trimEnd()); cur = indent; } cur += i < names.length - 1 ? piece : n; });
  out.push(cur + tail); return out;
};
const R = MODS.readouts, K = MODS.kepler;
const SEAT2 = 'createCalcMetersLadder', SEAT3 = 'createAtomsWignerRadiation';
/* kepler registers keplerTurn beside keplerRowSync (readouts' SPIN · TILT · TURN read it at use) */
const regLine = '  app.w.kepShell = kepShell; app.w.keplerRowSync = keplerRowSync;';
const kBody = textOfLines(K1, K1e);
const ri = kBody.indexOf(regLine); if (ri < 0 || kBody.indexOf(regLine, ri + 1) >= 0) die('kepler registration line');
kBody[ri] = regLine + ' app.w.keplerTurn = keplerTurn;';

const hand = (m, wrapAt) => {
  const parts = Object.entries(m.handed).map(([ns, names]) => `{ ${names.join(', ')} } = app${ns ? '.' + ns : ''}`);
  const out = []; let cur = '  const ';
  parts.forEach((p, i) => { const piece = p + (i < parts.length - 1 ? ', ' : ';'); if ((cur + piece).length > wrapAt) { out.push(cur.trimEnd()); cur = '    '; } cur += piece; });
  out.push(cur); return out;
};
const readouts = [
  '/* lab/windows/readouts.js — the readout cards (0.5.2 R2b; moved verbatim out of lab/rack.js boot()) at THREE seats, so the rack keeps its order: createReadouts(app)',
  ' * builds SHADOW · ORBIT · VORTEX · PLANE where SHADOW stood and returns the two later seats, which boot() calls where CALCULUS and ATOMS stood.  Kepler\'s verbs and',
  ' * MOLECULES\' cards are read through app.w; READERS, the track loop and hydroReader stay in boot(). */',
  "import { TIER } from '../rack.js';",
  "import { el, knob, sw, seg, trig, readout, group } from '../mir/kit.js';",
  "import { toLUT } from '../mir/palette.js';",
  "import { getHamiltonian, HAMILTONIANS } from '../hamiltonian.js';",
  "import { createShadowView, createShadowFoot } from '../shadowview.js'; import { createOrbit } from '../orbit.js'; import { createKepler } from '../keplerview.js';",
  "import { createVortex } from '../vortex.js'; import { createParticles } from '../particles.js'; import { createSliceView } from '../sliceview.js';",
  "import { createCalculus } from '../calculusview.js'; import { createMeters } from '../meters.js'; import { createLadder } from '../ladder.js'; import { solveLadder } from '../ladder-model.js';",
  "import { createAtoms } from '../atomsview.js'; import { createWigner } from '../wignerview.js'; import { createRadiation } from '../radiationview.js';",
  'export function createReadouts(app) {',
  ...hand(R, 200),
  ...textOfLines(...R.parts[0]),
  `  function ${SEAT2}() {   // the second seat: CALCULUS · METERS · LADDER`,
  ...textOfLines(...R.parts[1]),
  `  return { ${R.returns[1].join(', ')} }; }`,
  `  function ${SEAT3}() {   // the third seat: ATOMS · WIGNER · RADIATION`,
  ...textOfLines(...R.parts[2]),
  `  return { ${R.returns[2].join(', ')} }; }`,
  ...wrap('  return { ', [...R.returns[0], SEAT2, SEAT3], ' };'),
  '}', '',
].join('\n');
const kepler = [
  '/* lab/windows/kepler.js — THE BOW and KEPLER AS A CONTROL SURFACE (0.5.2 R2b; moved verbatim out of lab/rack.js boot()), created where THE BOW stood.  Its',
  ' * verbs are registered on app.w for the cards that read them (SPECTRUM, ORBIT, persist); keyState is read through app.sh; boot() destructures the rest. */',
  "import { TIER } from '../rack.js';",
  "import { VIEW, VIEW_NAMES, cameraBasis, toScreen } from '../field.js';",
  "import { getHamiltonian, setHamiltonian, HAMILTONIANS, getZ } from '../hamiltonian.js';",
  "import { keplerOrbits } from '../kepler.js'; import { createGas } from '../gas.js'; import { wellPacket } from '../well.js';",
  "import { momentumZ, rotorsToZ } from '../kick.js'; import { applyRotor as rotorOnCopy } from '../frontier.js';",
  'export function createKeplerSurface(app) {',
  ...hand(K, 200),
  ...kBody,
  ...wrap('  return { ', K.returns[0], ' };'),
  '}', '',
].join('\n');

/* ── rack.js: the four seats and the imports ── */
const SEATS = new Map([
  [A1, [A1e, wrap('  const { ', [...R.returns[0], SEAT2, SEAT3], ' } = createReadouts(app);   // 0.5.2 R2b: lab/windows/readouts.js, three seats')]],
  [B1, [B1e, wrap('  const { ', R.returns[1], ` } = ${SEAT2}();   // 0.5.2 R2b: readouts' second seat`)]],
  [C1, [C1e, wrap('  const { ', R.returns[2], ` } = ${SEAT3}();   // 0.5.2 R2b: readouts' third seat`)]],
  [K1, [K1e, wrap('  const { ', K.returns[0], ' } = createKeplerSurface(app);   // 0.5.2 R2b: lab/windows/kepler.js')]],
]);
const out = [];
for (let k = 1; k <= lines.length; k++) {
  if (SEATS.has(k)) { const [e, seat] = SEATS.get(k); out.push(...seat); k = e; continue; }
  out.push(lines[k - 1]);
}
let rack = out.join('\n');
const swap = (from, to) => { if (rack.split(from).length !== 2) die('import edit: ' + from + ' not found exactly once'); rack = rack.replace(from, to); console.log('import: ' + from.trim().slice(0, 90) + (to ? ' → ' + to.trim().slice(0, 90) : ' OUT')); };
swap("import { createMeters } from './meters.js';\nimport { createShadowView, createShadowFoot } from './shadowview.js';\nimport { createLadder } from './ladder.js';\nimport { createOrbit } from './orbit.js';\nimport { createVortex } from './vortex.js';\nimport { createParticles } from './particles.js';\nimport { createKepler } from './keplerview.js';\n",
  "import { createReadouts } from './windows/readouts.js'; import { createKeplerSurface } from './windows/kepler.js';   // 0.5.2 R2b: the readout cards and THE BOW + KEPLER, out of boot()\n");
swap("import { solveLadder } from './ladder-model.js';\nimport { createCalculus } from './calculusview.js';\n", '');
swap("import { createSliceView } from './sliceview.js';\nimport { createAtoms } from './atomsview.js';\nimport { createWigner } from './wignerview.js';\nimport { createRadiation } from './radiationview.js';\n", '');
swap("import { momentumZ, rotorsToZ } from './kick.js';\n", '');
swap("import { applyRotor as rotorOnCopy } from './frontier.js';\n", '');
console.log('\nseats:\n' + [...SEATS.values()].map(([, s]) => s.join('\n')).join('\n'));
console.log(`\nrack.js ${lines.length} → ${rack.split('\n').length}; readouts.js ${readouts.split('\n').length - 1}; kepler.js ${kepler.split('\n').length - 1}`);
console.log(`moved: readouts ${R.parts.reduce((k, [a, b]) => k + b - a + 1, 0)} lines (−${SKIP.size} blanks), kepler ${K1e - K1 + 1}`);
if (process.argv.includes('--write')) {
  writeFileSync(RACK, rack);
  writeFileSync(new URL('lab/windows/readouts.js', ROOT), readouts);
  writeFileSync(new URL('lab/windows/kepler.js', ROOT), kepler);
  console.log('written');
}
