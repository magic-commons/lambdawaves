/* .tmp/r3a-move.mjs — R3a THE MOVE: §1 SETTINGS, §24 PERSISTENCE, §25 THE LINKS and THE TRUE HISTORY out of lab/rack.js boot()
 * into lab/shell/{settings,persist,links,history}.js, verbatim, at the walker's token positions (no sed).  Prints every edit.
 *   node .tmp/r3a-move.mjs            dry run (prints the plan, the free names and the edits)
 *   node .tmp/r3a-move.mjs --write    writes the five files */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const lineIs = (k, s) => lines[k - 1] === s;
const find = (pred, from = 1, what = '') => { const hits = []; for (let k = from; k <= lines.length; k++) if (pred(lines[k - 1])) hits.push(k); if (!hits.length) die('no line ' + what); return hits; };
const one = (pred, what) => { const h = find(pred, 1, what); if (h.length !== 1) die(`${what}: ${h.length} lines (${h.join(',')})`); return h[0]; };
const closeAfter = (k, close = '  }') => { for (let j = k + 1; j <= lines.length; j++) if (lines[j - 1] === close) return j; die('no close after ' + k); };

/* ── the spans (1-based, inclusive) ── */
const S1 = one((s) => s.startsWith('  /* ── SETTINGS: what this browser remembers'), 'the SETTINGS header');
const RS = one((s) => s === '  function readSettings() { return settingsStore.read(); }', 'readSettings');
const S1e = one((s) => s.startsWith("  app.state.space = 'x';"), 'the space seat');
if (!(lineIs(S1e + 1, '') && lineIs(S1e + 2, '') && lines[S1e + 2].startsWith('  const quality = {'))) die('the quality line is not two blanks after the space seat');
const P1 = one((s) => s.startsWith('  /* ── persistence (§46)'), 'the persistence header');
const L1 = one((s) => s.startsWith('  /* ── WAVE 56 · SHAREABLE LINKS'), 'the links header');
const H1 = one((s) => s.startsWith('  /* 0.3.1 · S3 THE TRUE HISTORY'), 'the history header');
const F1 = one((s) => s.startsWith('  /* ── the diagnostics surface'), 'the facade header');
const trimEnd = (a, b) => { while (lines[b - 1] === '') b--; return b; };
const P1e = trimEnd(P1, L1 - 1), L1e = trimEnd(L1, H1 - 1), H1e = trimEnd(H1, F1 - 1);
if (!(RS > S1 && RS < S1e)) die('readSettings outside §1');

const MODS = {
  settings: {
    file: 'lab/shell/settings.js', fn: 'createSettings', spans: [[S1, S1e]], skip: new Set([RS]),
    handed: { '': ['ui', 'mat', 'settingsStore', 'useCompactDefaults', 'FIRST_RUN', 'appleDevice'], sh: ['readSettings'] },
    use: { MOD: 'app.ctl.MOD', field: 'app.ctl.field', gov: 'app.ctl.gov', keep: 'app.ctl.keep', look: 'app.ctl.look', modStore: 'app.ctl.modStore',
      perf: 'app.ctl.perf', saveMod: 'app.ctl.saveMod', setGovernor: 'app.ctl.setGovernor', setKeepFrames: 'app.ctl.setKeepFrames', setPerfMode: 'app.ctl.setPerfMode',
      camera: 'app.host.camera', setModArm: 'app.sh.setModArm', quality: 'app.sh.quality' },
    returns: ['saveSettings', 'setCardStyle', 'setFrost', 'setDisconnected', 'applySettings', 'KIND', 'RETIRED_WINDOWS', 'powered', 'DIGESTS'],
    registers: [],
  },
  persist: {
    file: 'lab/shell/persist.js', fn: 'createPersist', spans: [[P1, P1e]], skip: new Set(),
    handed: { '': ['ui', 'reg', 'clock', 'obs', 'mat', 'FIELD_CHROME', 'rates', 'energyOf', 'sturm', 'PAL_DEF'], loop: ['schedule', 'paceRate'],
      sh: ['quality', 'layout', 'phone', 'tablet'], host: ['camera', 'camLevel', 'syncFreeAngles', 'syncCamUI'],
      w: ['wState', 'switchHamiltonian', 'applySturmian', 'setElement', 'fillValence', 'shadowView', 'shadowFoot', 'kepler', 'vortex', 'particles', 'slice', 'wChem',
        'wOrbs', 'ladder', 'wAtoms', 'wignerView', 'kepShell', 'keplerRowSync', 'gas', 'stageTextTick'] },
    use: { domain: 'app.ctl.domain', modSyncBases: 'app.ctl.modSyncBases', modGets: 'app.ctl.modGets', rotRate: 'app.ctl.rotRate', setRotationRate: 'app.ctl.setRotationRate',
      applyAccent: 'app.ctl.applyAccent', markBatchBegin: 'app.ctl.markBatchBegin', markBatchEnd: 'app.ctl.markBatchEnd', setReference: 'app.ctl.setReference',
      spectrum: 'app.w.spectrum' },
    returns: ['modSeats', 'serialize', 'restoreModulation', 'save', 'copyJSON', 'restore'],
    registers: ['serialize', 'restore', 'save', 'copyJSON'],
  },
  links: {
    file: 'lab/shell/links.js', fn: 'createLinks', spans: [[L1, L1e]], skip: new Set(),
    handed: { '': ['ui', 'reg', 'PAL_DEF'], w: ['wState'] },
    use: { serialize: 'app.sh.serialize', restore: 'app.sh.restore' },
    returns: ['notCarriedWords', 'mintLink', 'copyLink', 'openLink'],
    registers: ['esc', 'copyLink'],
  },
  history: {
    file: 'lab/shell/history.js', fn: 'createHistory', spans: [[H1, H1e]], skip: new Set(),
    handed: { '': ['device', 'reg', 'hNote'], loop: ['canPresent'], host: ['rack'], sh: ['rk'], w: ['wState'] },
    use: { serialize: 'app.sh.serialize', restore: 'app.sh.restore', esc: 'app.sh.esc', rotDriving: 'app.ctl.rotDriving' },
    returns: ['historyApi'],
    registers: [],
  },
};

const inSpan = (m, line) => m.spans.some(([a, b]) => line >= a && line <= b) && !m.skip.has(line);
const rep = new Map();   // token index → replacement
const report = [];
for (const [id, m] of Object.entries(MODS)) {
  const handedAll = new Set(Object.values(m.handed).flat());
  const free = new Map(), modRefs = new Set(), problems = [];
  for (const r of W.refs) {
    if (!inSpan(m, r.line)) continue;
    if (r.where === 'module') { modRefs.add(r.name); continue; }
    if (r.where !== 'boot') continue;
    if (r.name === 'app') continue;
    const dl = declLine(r.name);
    if (inSpan(m, dl)) continue;
    free.set(r.name, (free.get(r.name) || 0) + 1);
    if (r.kind === 'write' || r.kind === 'rw') problems.push(`line ${r.line}: a write to ${r.name}`);
    if (Object.hasOwn(m.use, r.name)) {
      if (handedAll.has(r.name)) problems.push(`${r.name} both handed and read at use`);
      rep.set(r.at, W.shorthands.has(r.at) ? `${r.name}: ${m.use[r.name]}` : m.use[r.name]);
      report.push(`${id} ${r.line}:${toks[r.at].at - src.lastIndexOf('\n', toks[r.at].at - 1)} ${r.name} → ${rep.get(r.at)}${r.deferred ? '' : '   (EAGER)'}`);
      if (!r.deferred) problems.push(`line ${r.line}: ${r.name} read at use EAGERLY — it would be null at creation`);
    } else if (!handedAll.has(r.name)) problems.push(`line ${r.line}: ${r.name} (boot-level, declared ${dl}) neither handed nor read at use`);
  }
  for (const h of handedAll) if (!free.has(h)) problems.push(`${h} handed but never read`);
  for (const u of Object.keys(m.use)) if (!free.has(u)) problems.push(`${u} in the at-use map but never read`);
  m.free = free; m.modRefs = [...modRefs].sort();
  console.log(`\n${id}: spans ${JSON.stringify(m.spans)}${m.skip.size ? ' skip ' + [...m.skip] : ''} · free ${[...free.keys()].sort().join(', ')}\n  module-level refs: ${m.modRefs.join(', ')}`);
  if (problems.length) die(id + ':\n  ' + problems.join('\n  '));
}
console.log('\nat-use edits (' + rep.size + '):\n' + report.join('\n'));

/* the span's text with the replacements (token-exact; whitespace and comments kept) */
const lineStart = [0]; for (let k = 0; k < src.length; k++) if (src.charCodeAt(k) === 10) lineStart.push(k + 1);
const charOf = (line) => lineStart[line - 1];
const edits = [...rep.entries()].map(([k, text]) => ({ from: toks[k].at, to: toks[k].at + toks[k].v.length, text })).sort((a, b) => a.from - b.from);
const textOfLines = (a, b, skip) => {
  const out = [];
  for (let k = a; k <= b; k++) {
    if (skip.has(k)) continue;
    const s0 = charOf(k), s1 = s0 + lines[k - 1].length;
    let s = '', pos = s0;
    for (const e of edits) if (e.from >= s0 && e.to <= s1) { s += src.slice(pos, e.from) + e.text; pos = e.to; }
    out.push(s + src.slice(pos, s1));
  }
  return out;
};
const wrap = (head, names, tail, indent = '    ') => {   // one statement, wrapped at 200 columns
  const out = []; let cur = head;
  names.forEach((n, i) => { const piece = n + (i < names.length - 1 ? ', ' : ''); if ((cur + piece).trimEnd().length > 200) { out.push(cur.trimEnd()); cur = indent; } cur += piece; });
  cur += tail; if (cur.length > 200 && out.length === 0) { /* fine */ }
  out.push(cur); return out;
};
const handLines = (m) => {
  const parts = Object.entries(m.handed).map(([ns, names]) => `const { ${names.join(', ')} } = app${ns ? '.' + ns : ''};`);
  const out = []; let cur = '  ';
  for (const p of parts) { if ((cur + p).length > 200 && cur.trim()) { out.push(cur.trimEnd()); cur = '  '; } if (p.length + 2 > 200) { const names = p.slice(8, p.indexOf(' }')).split(', '); const ns = p.slice(p.indexOf('} = ') + 4); out.push(...wrap('  const { ', names, ' } = ' + ns)); continue; } cur += p + ' '; }
  if (cur.trim()) out.push(cur.trimEnd());
  return out;
};

/* ── the module files ── */
const HEADERS = {
  settings: [
    '/* lab/shell/settings.js — §1 SETTINGS, what this browser remembers (0.5.2 R3a "Rack Dissolution"; moved verbatim out of lab/rack.js boot()).',
    ' * createSettings(app) runs at §1\'s seat, BEFORE the controller\'s, so a controller name is read as app.ctl.x inside a callback, never at',
    ' * creation — as are app.host.camera, app.sh.setModArm and app.sh.quality, which boot() fills later.  readSettings stays in rack.js\' head',
    ' * (§0 calls it first, U1) and comes by value; lookSync is registered for the controller; boot() destructures the rest. */',
  ],
  persist: [
    '/* lab/shell/persist.js — §24 PERSISTENCE (0.5.2 R3a; moved verbatim out of lab/rack.js boot()): the edit scope, serialize() — ONE interleaving',
    ' * literal — and restore() — ONE ordered program — whole, never split by card.  createPersist(app) runs at §24\'s seat: the cards\' handles come',
    ' * from app (boot() fills each slot after its declaration), the controller\'s and SPECTRUM\'s are read live at use (app.ctl.x, app.w.spectrum).',
    ' * serialize / restore / save / copyJSON are registered on app.sh for the modules that read them (the links, the history, STATE). */',
  ],
  links: [
    '/* lab/shell/links.js — §25 SHAREABLE LINKS (0.5.2 R3a; moved verbatim out of lab/rack.js boot()).  createLinks(app) runs at its seat;',
    ' * serialize / restore are persist\'s, read as app.sh.x at use; §29\'s openLink() call stays in boot().  esc (the HISTORY list\'s) and',
    ' * copyLink (STATE\'s) are registered on app.sh. */',
  ],
  history: [
    '/* lab/shell/history.js — §25 THE TRUE HISTORY and its card (0.5.2 R3a; moved verbatim out of lab/rack.js boot()).  createHistory(app)',
    ' * runs at the seat, so the HISTORY card\'s device / appendChild / register keep their place in the rack; serialize / restore (persist\'s),',
    ' * esc (the links\') and rotDriving are read live at use (app.sh.x, app.ctl.rotDriving). */',
  ],
};
const IMPORTS = {
  settings: [],
  persist: [
    "import { TIER } from '../rack.js';",
    "import { VIEW_NAMES, STYLE_NAMES, quatFromYawPitch } from '../field.js';",
    "import { deviceQuality } from '../first-run.js';",
    "import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from '../hamiltonian.js';",
    "import { clampShift } from '../camera-law.js';",
  ],
  links: ["import { linkFor, readLink, LinkError, LINK_CHAR_CEILING } from '../statelink.js';   // wave 56: every state of this lab is a LINK"],
  history: [
    "import { el, trig } from '../mir/kit.js';",
    "import { createEditHistory } from '../edit-domain.js';   // 0.5.0 C5: the one `edit` domain on the kit's stack (mir/history/history.js); lab/history.js left",
  ],
};
const MODULE_CONSTS = { persist: ["const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';"] };
const files = {};
for (const [id, m] of Object.entries(MODS)) {
  const body = m.spans.flatMap(([a, b]) => textOfLines(a, b, m.skip));
  const out = [...HEADERS[id], ...IMPORTS[id], ...(MODULE_CONSTS[id] || []), `export function ${m.fn}(app) {`, ...handLines(m), ...body];
  if (m.registers.length) out.push('  ' + m.registers.map((n) => `app.sh.${n} = ${n};`).join(' '));
  out.push(...wrap('  return { ', m.returns, ' };'), '}', '');
  files[m.file] = out.join('\n');
}

/* ── rack.js: the seats, the kept readSettings, the fills, the imports ── */
const SEATS = {
  settings: [
    '  /* ── SETTINGS: what this browser remembers — lab/shell/settings.js (0.5.2 R3a), created here; readSettings stays, §0 calls it first (U1) ── */',
    '  function readSettings() { return settingsStore.read(); }',
    ...wrap('  const { ', MODS.settings.returns, ' } = createSettings(app);'),
  ],
  persist: ['  /* ── persistence (§46): lab/shell/persist.js (0.5.2 R3a), created here — serialize and restore whole ── */', ...wrap('  const { ', MODS.persist.returns, ' } = createPersist(app);')],
  links: ['  /* ── WAVE 56 · SHAREABLE LINKS: lab/shell/links.js (0.5.2 R3a), created here; the link opens at §29 ── */', ...wrap('  const { ', MODS.links.returns, ' } = createLinks(app);')],
  history: ['  /* 0.3.1 · S3 THE TRUE HISTORY and its card: lab/shell/history.js (0.5.2 R3a), created here, so the card keeps its seat in the rack */', ...wrap('  const { ', MODS.history.returns, ' } = createHistory(app);')],
};
const fill = (ns, names) => '  ' + names.map((n) => `app.${ns}.${n} = ${n};`).join(' ');
const FILLS = [   // [after line k, the fill]
  [one((s) => s === '  const canPresent = (w) => windowActivity.canPresent(w);', 'canPresent'), fill('loop', ['canPresent'])],
  [one((s) => s === '  const rack = dom.rack;', 'rack'), fill('host', ['camera', 'camLevel', 'syncFreeAngles', 'syncCamUI', 'rack'])],
  [one((s) => s === '  rack.appendChild(wPal.root); rack.appendChild(wObs.root); rack.appendChild(wCam.root); rack.appendChild(wClip.root);', 'the appends'),
    fill('w', ['wState', 'switchHamiltonian', 'applySturmian', 'setElement', 'fillValence'])],
  [closeAfter(one((s) => s.startsWith('  const slice = createSliceView(wSlice.body, {'), 'slice'), '  });'), fill('w', ['shadowFoot', 'kepler', 'vortex', 'particles', 'slice'])],
  [closeAfter(one((s) => s === '  function stageTextTick() {', 'stageTextTick')), fill('w', ['stageTextTick'])],
  [one((s) => s.startsWith("  const wOrbs = device({ id: 'orbitals'"), 'wOrbs'), fill('w', ['wChem', 'wOrbs'])],
  [one((s) => s.startsWith('  const ladder = createLadder('), 'ladder'), fill('w', ['ladder'])],
  [one((s) => s.startsWith('  const wignerView = createWigner('), 'wignerView'), fill('w', ['wAtoms', 'wignerView'])],
  [closeAfter(one((s) => s === '  function setModArm(on, opts) {', 'setModArm')), fill('sh', ['setModArm'])],
  [one((s) => s === '  const gas = createGas(HAMILTONIANS.well.radius);', 'gas'), fill('w', ['kepShell', 'keplerRowSync', 'gas'])],
  [one((s) => s.startsWith('  const tablet = { on: false, DPR: 1.5, steps: 110 };'), 'tablet'), fill('sh', ['rk', 'layout', 'phone', 'tablet'])],
];
/* each fill must stand after every declaration it names, and before the first seat that reads it */
for (const [k, f] of FILLS) for (const n of [...f.matchAll(/= (\w+);/g)].map((x) => x[1])) if (!(declLine(n) <= k)) die(`fill ${n} at ${k} before its declaration ${declLine(n)}`);
const replaced = new Map([[S1, ['settings', S1e]], [P1, ['persist', P1e]], [L1, ['links', L1e]], [H1, ['history', H1e]]]);
const after = new Map(FILLS.map(([k, f]) => [k, f]));
const out = [];
for (let k = 1; k <= lines.length; k++) {
  if (replaced.has(k)) { const [id, e] = replaced.get(k); out.push(...SEATS[id]); k = e; continue; }
  out.push(lines[k - 1]);
  if (after.has(k)) out.push(after.get(k));
}
let rack = out.join('\n');
const swap = (from, to) => { if (rack.split(from).length !== 2) die('import edit: ' + from + ' not found exactly once'); rack = rack.replace(from, to); console.log('import: ' + JSON.stringify(from).slice(0, 120) + ' → ' + JSON.stringify(to).slice(0, 120)); };
swap("const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';\n", '');
swap("import { linkFor, readLink, LinkError, LINK_CHAR_CEILING } from './statelink.js';   // wave 56: every state of this lab is a LINK\n", '');
swap("import { createEditHistory } from './edit-domain.js';   // 0.5.0 C5: the one `edit` domain on the kit's stack (mir/history/history.js); lab/history.js left\n", '');
swap("import { createController } from './shell/controller.js';   // 0.5.2 R1: ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD, out of boot()\n",
  "import { createController } from './shell/controller.js';   // 0.5.2 R1: ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD, out of boot()\n" +
  "import { createSettings } from './shell/settings.js'; import { createPersist } from './shell/persist.js'; import { createLinks } from './shell/links.js'; import { createHistory } from './shell/history.js';   // 0.5.2 R3a\n");
for (const e of process.argv.includes('--write') ? [] : []) void e;
console.log('\nseats:\n' + Object.values(SEATS).flat().join('\n') + '\nfills:\n' + FILLS.map(([k, f]) => `  after ${k}: ${f.trim()}`).join('\n'));
console.log(`\nrack.js ${lines.length} → ${rack.split('\n').length}; ` + Object.entries(files).map(([f, t]) => `${f} ${t.split('\n').length - 1}`).join('; '));
if (process.argv.includes('--write')) {
  mkdirSync(new URL('lab/shell/', ROOT), { recursive: true });
  writeFileSync(RACK, rack);
  for (const [f, t] of Object.entries(files)) writeFileSync(new URL(f, ROOT), t);
  console.log('written');
}
