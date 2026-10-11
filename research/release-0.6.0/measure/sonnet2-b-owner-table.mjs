// sonnet2-b: THE FIELD OWNER's truth table. DERIVED-HERE: the four expressions DRAFT 2 names are TRANSCRIBED from the source (cited) as pure functions of the state
// (H, Z, space, sturm.P, chem.on), plus the three neighbours the plan does not name (rack.js:537 calculus, windows/spectrum.js:142/195 window hides, windows/molecules.js:15 moleculeMode hides).
// Nothing here runs the app; it asks: how many reachable states, how many distinct answer vectors, where do two readers already disagree.
import fs from 'node:fs';
const Hs = [
  { id: 'hydrogen(Z=1)', hid: 'hydrogen', Z: 1, hydrogenTheorems: true,  noMomentum: false },   // hamiltonian.js:34, :199
  { id: 'hydrogen(Z>1)', hid: 'hydrogen', Z: 2, hydrogenTheorems: false, noMomentum: false },   // hamiltonian.js:199 (setZ)
  { id: 'qho',           hid: 'qho',      Z: 1, hydrogenTheorems: false, noMomentum: false },   // :46
  { id: 'box',           hid: 'well',     Z: 1, hydrogenTheorems: false, noMomentum: true },    // :63
  { id: 'quarkonium',    hid: 'cornell',  Z: 1, hydrogenTheorems: false, noMomentum: true },    // :82
  { id: 'atom',          hid: 'atom',     Z: 1, hydrogenTheorems: false, noMomentum: true },    // :153
];
const states = [];
for (const H of Hs) for (const space of ['x', 'p']) for (const sturm of [0, 1]) for (const chem of [0, 1]) {
  // reachability, from the source: noMomentum forces space x (windows/spectrum.js:141); Sturmian is armed only for H.id==='hydrogen' (spectrum.js:164) and disables space p (:190);
  // chem.on forces space 'p'->'x' (windows/molecules.js:24); the Z knob is hydrogen-only.
  let reach = true, why = '';
  if (H.noMomentum && space === 'p') { reach = false; why = 'noMomentum'; }
  if (sturm && H.hid !== 'hydrogen') { reach = false; why = 'sturmian is hydrogen-only'; }
  if (sturm && space === 'p') { reach = false; why = 'sturmian disables p'; }
  if (chem && space === 'p') { reach = false; why = 'chem.on forces x'; }
  states.push({ H: H.id, space, sturm, chem, reach, why, _H: H });
}
// the expressions, as written
const E_overlay = (s) => s.space === 'x' && s._H.hydrogenTheorems && !s.sturm && !s.chem;                       // rack.js:478 (VORTEX · PARTICLES · KEPLER)
const E_hydro   = (s) => !s.sturm && s._H.hid === 'hydrogen' && s._H.Z === 1 && !s.chem;                       // rack.js:738-746 hydroReader (WIGNER · RADIATION): no space test
const E_calc    = (s) => !s.sturm && !s.chem;                                                                  // rack.js:537 (CALCULUS tick): no Z, no space, no Hamiltonian test
const hidesSpec = (s) => s.sturm ? ['orbit','vortex','slice','ladder','calc'] : (!s._H.hydrogenTheorems ? ['orbit','vortex','slice','ladder'] : []); // windows/spectrum.js:142 / :195
const hidesMol  = (s) => s.chem ? ['state','shadow','orbit','vortex','slice','ladder','calc'] : null;           // windows/molecules.js:15-17 moleculeMode(v)
const E_windows = (s) => (s.chem ? hidesMol(s) : hidesSpec(s)).join('+') || 'none';
const rows = states.map((s) => ({ H: s.H, space: s.space, sturm: s.sturm, chem: s.chem, reachable: s.reach, why: s.why,
  overlay_478: E_overlay(s), hydroReader_738: E_hydro(s), calculus_537: E_calc(s), windowsHidden: E_windows(s) }));
const R = rows.filter((r) => r.reachable);
const key = (r) => [r.overlay_478, r.hydroReader_738, r.calculus_537, r.windowsHidden].join('|');
const vectors = new Map(); for (const r of R) { const k = key(r); if (!vectors.has(k)) vectors.set(k, []); vectors.get(k).push(`${r.H}/${r.space}/sturm${r.sturm}/chem${r.chem}`); }
const dis = (a, b) => R.filter((r) => r[a] !== r[b]).map((r) => `${r.H}/${r.space}/sturm${r.sturm}/chem${r.chem}: ${a}=${r[a]} ${b}=${r[b]}`);
const out = {
  tag: 'DERIVED-HERE (transcription of cited expressions; not run in the app)',
  grid: { statesTotal: states.length, statesReachable: R.length, readerColumns: 4,
    cellsNamedByDraft2: R.length * 2, cellsWithTheNeighbours: R.length * 4 },
  distinctAnswerVectors: vectors.size, vectors: Object.fromEntries([...vectors.entries()].map(([k, v]) => [k, v])),
  disagreements: { overlay_vs_hydroReader: dis('overlay_478', 'hydroReader_738'), overlay_vs_calculus: dis('overlay_478', 'calculus_537').length, hydroReader_vs_calculus: dis('hydroReader_738', 'calculus_537').length },
  ownershipPredicateSiteCounts: 'grep -F in lab/ (excl. mir/): chem.on in 7 files (rack.js 7); sturm.P in 8 files (spectrum 14, rack 9, state 6, facade 5, transport 4, controller 3); hydrogenTheorems 3 files; hydroReader 3 files',
  rows,
};
fs.writeFileSync(new URL('./sonnet2-b-owner-table.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ grid: out.grid, distinctAnswerVectors: out.distinctAnswerVectors, vectors: out.vectors, disagreements: out.disagreements }, null, 1));
