#!/usr/bin/env node
/* tools/catalogue-table.mjs — THE CATALOGUE (0.7.4 C1 · research/release-0.7.4/BUILD-PLAN.md "The shape"): writes lab/catalogue.js, ONE row for every
 * system λWAVES plays — { id, name, shelf, opens, word, oracle: { test, what }, since } — from the live tables where they exist (lab/hamiltonian.js
 * HAMILTONIANS, lab/molecules.js MOLECULES + RECORD_ONLY with lab/library.json's `status.energy`, lab/lattice-model.js PRESETS, lab/state.js PRESETS,
 * lab/project-store.js STARTERS) and the HAND table below for the rows no table holds (research/release-0.6.0/census/SYSTEMS.md §1, its row id beside each,
 * the word from its ORACLE · STATUS column: EXACT only where it names a closed form).  `word` is lab/status.js' grammar and a molecule's is statusOf's own
 * rule (a record's status.energy, else MEASURED when PySCF's energy is on file); `since` is the first alpha cut whose tree carried the row (a git-tag scan,
 * 0.7.4 C1: live closed shells 0.2.0, records 0.4.0, open shells 0.7.1).  The file packs a shelf (a molecule section) to a line, an oracle once by index.
 *   node tools/catalogue-table.mjs           write lab/catalogue.js
 *   node tools/catalogue-table.mjs --check   write nothing; exit 1 unless lab/catalogue.js is byte for byte what this writes */
import { readFileSync, writeFileSync } from 'node:fs';
import { HAMILTONIANS } from '../lab/hamiltonian.js';
import { MOLECULES, RECORD_ONLY, SECTIONS } from '../lab/molecules.js';
import { PRESETS as LATTICES } from '../lab/lattice-model.js';
import { PRESETS } from '../lab/state.js';
import { STARTERS } from '../lab/project-store.js';
import { STATE_WORD } from '../lab/status.js';

const OUT = new URL('../lab/catalogue.js', import.meta.url), T = (f) => f + '.test.mjs';
const H1 = [T('hydrogen'), 'closed forms typed from tables + independent quadrature'];
/* THE HAND TABLE: [id, name, opens, word, [test, what], since] · SYSTEMS.md row */
const HAND = {
  hydrogen: [['hydrogen', 'HYDROGEN', 'ham:hydrogen', 'EXACT', H1, '0.1.0'],                                                            // S01
    ['zion', 'Z · HYDROGEN-LIKE ION', 'knob:Z', 'EXACT', [T('zion'), 'the closed scaling r → Zr, E × Z², ψ × Z^{3/2}'], '0.1.0'],            // S02
    ['momentum', 'MOMENTUM φ(p)', 'space:p', 'EXACT', [T('momentum'), 'Podolsky–Pauling closed forms'], '0.1.0'],                          // S03
    ['sturmian', 'STURMIAN λ', 'scale:sturmian', 'EXACT', [T('sturmian'), 'closed-form S and H against Γ quadrature; variational E'], '0.1.0'], // S09
    ['stark', 'STARK F·z', 'state:stark', 'EXACT', [T('fields'), 'the shell’s tridiagonal z-block; inter-shell coupling neglected'], '0.1.0'], // S11
    ['zeeman', 'ZEEMAN B·L_z/2', 'state:zeeman', 'EXACT', [T('fields'), 'E + Bm/2, diagonal; no spin'], '0.1.0'],                           // S12
    ['transition', 'A/B TRANSITION', 'state:ab', 'UNCHECKED', ['current.browser-test.mjs', 'no node oracle; a toy for composites'], '0.1.0'], // S13
    ['kick', 'KICK · BOW · DRAG', 'state:kick', 'NUMERICAL', [T('kick'), 'Ehrenfest ⟨p⟩ before and after; elements numerical'], '0.1.0'],   // S14
    ['so4', 'SO(4) ROTORS · DEFECT', 'state:rotate', 'EXACT', [T('rotor4'), 'closed Clebsch–Gordan and Schmidt entropy'], '0.1.0'],          // S15
    ['rate', 'PER-LABEL RATE', 'spectrum:rate', 'UNCHECKED', [T('project-formats'), 'a diagonal toy E → E·r; only its round trip'], '0.1.0']], // S16
  operators: { qho: ['OSCILLATOR', 'EXACT', [T('qho'), 'closed forms; Ehrenfest in calculus.test'], '0.1.0'],                             // S04
    well: ['BOX', 'EXACT', [T('well'), 'the zeros of j_l to 1e-13'], '0.1.0'],                                                           // S05
    atom: ['ATOM', 'NUMERICAL', [T('atoms'), 'HF limits He −2.86168, Ne −128.547, Ar −526.818'], '0.1.0'],                                // S08
    cornell: ['CENTRAL › QUARKONIUM', 'NUMERICAL', [T('cornell'), 'Numerov against the Airy spectrum of σr and the PDG levels'], '0.1.0'],   // S07
    central: ['CENTRAL', 'NUMERICAL', [T('central'), 'the confined 1s against M(1 − 1/κ, 2, 2κR_c) = 0; the well’s l = 0 law; Numerov at 2N'], '0.8.0'],   // 0.8.0 G1
    separable: ['SEPARABLE', 'EXACT', [T('qho'), 'E = Σωᵢ(nᵢ + ½), the cube π²Σnᵢ²/(2L²), closed; ISOTROPIC is the oscillator’s shells; the card prints E₀ and the degeneracies'], '0.9.4'] },   // 0.9.4 S1
  gas: ['gas', 'GAS · AXIAL 256', 'ham:well', 'NUMERICAL', [T('gas'), 'energies z²/2a²; the projection reports its capture'], '0.1.0'],      // S06
  molecules: [['molecules', 'MOLECULES · RHF STO-3G', 'window:chem', 'NUMERICAL', [T('molecules'), 'PySCF 2.14 RHF energies (sto-3g-v1.json)'], '0.2.0'], // S17
    ['basis-631', '6-31+G*', 'basis:6-31+g-star', 'NUMERICAL', [T('basis-631'), '19 molecules against PySCF cart=True to 3e-12'], '0.2.0'],  // S18
    ['uhf', 'OPEN SHELLS · UHF', 'method:uhf', 'NUMERICAL', [T('uhf'), 'PySCF UHF (uhf-v1.json)'], '0.7.1'],
    ['lda', 'KOHN–SHAM · RKS LDA', 'method:lda', 'NUMERICAL', [T('rks'), 'PySCF RKS lda,vwn on the same grid (rks-v1.json)'], '0.7.3']],
  registers: [['mo-registry', 'MO-REGISTRY · ORBITAL', 'window:orbitals', 'NUMERICAL', [T('molecular-register'), 'the beat period 2π/Δε (H₂O 0.996409)'], '0.2.0'], // S20
    ['states', 'STATES · TD-CIS + DRIVE', 'window:orbitals', 'NUMERICAL', [T('molecular-drive'), 'PySCF determinant-space transition RDMs'], '0.2.0'], // S22
    ['rt', 'RT-TDHF δ-KICK', 'window:chem', 'NUMERICAL', [T('density'), 'the RPA closed form at N = 2; PySCF TDA/RPA'], '0.2.0'],              // S21
    ['flow', 'FLOW · PARTICLES', 'window:vortex', 'NUMERICAL', [T('molecular-flow'), 'closed-form ∇ψ; the trajectories integrated'], '0.1.0']], // S23
  readouts: [['wigner', 'WIGNER', 'window:wigner', 'NUMERICAL', [T('wigner'), 'the closed marginals of 1s'], '0.1.0'],                         // S24
    ['radiation', 'RADIATION', 'window:radiation', 'EXACT', [T('radiation'), '2p→1s A = (2/3)⁸α³; NIST 6.2649e8 s⁻¹'], '0.1.0'],             // S25
    ['calculus', 'CALCULUS · METERS · PERIOD', 'window:calculus', 'EXACT', [T('calculus'), 'Ehrenfest, the virial and the exact period'], '0.1.0'], // S28
    ['kepler', 'KEPLER · ORBIT · VORTEX · PLANE', 'window:orbit', 'EXACT', [T('kepler'), 'the Kepler ellipse, the KS plane, the nodal lines'], '0.1.0'], // S26
    ['shadow', 'SHADOW', 'window:shadow', 'EXACT', [T('hydrogen'), 'RK4 against the closed form'], '0.1.0'],                                // S27
    ['ladder', 'LADDER', 'window:ladder', 'EXACT', [T('frontier'), 'the Poisson–Airy revival laws'], '0.1.0']],                              // S10
  lattice: ['lattice', 'LATTICE · TIGHT BINDING', 'window:lattice', 'NUMERICAL', [T('lattice'), 'the eigensolve against the closed forms it prints'], '0.7.2'],
  /* a demo plays a system: its word and oracle are that row's (S30) */
  /* iteration 009: the ten others left (WATER · BENZENE · N₂ · H₂ σu · HELIUM 0.5.0, CHORD 0.6.0, BUCKY 0.6.1, BREAK 0.7.1, TUNNEL 0.7.2, LDA 0.7.3);
     WAVE DANCER is WAVE DANCER PROTOTYPE, its row's id `demo:wave-dancer` kept */
  demos: { 'wave-dancer': ['hydrogen', '0.5.0'], 'star-loop': ['hydrogen', '1.0.0'], 'benzene-pi': ['C6H6', '1.0.0'], 'water-esp': ['H2O', '1.0.0'] },   // 026: the conducted three
};

const plain = (s) => s.replace(/<\/?m>/g, '');
const shelves = { hydrogen: [...HAND.hydrogen, ...PRESETS.map((p) => ['preset:' + p.id, p.label, 'preset:' + p.id, 'EXACT', H1, '0.1.0'])],
  operators: [...Object.values(HAMILTONIANS).filter((h) => h.id !== 'hydrogen').map((h) => { const r = HAND.operators[h.id]; if (!r) throw new Error('no hand row for ' + h.id); return [h.id, r[0], 'ham:' + h.id, ...r.slice(1)]; }), HAND.gas] };
const all = [...MOLECULES, ...RECORD_ONLY], mol = (m) => { const rec = m.records['sto-3g'], st = rec && rec.status ? rec.status.energy : m.oracle ? 'MEASURED' : 'UNKNOWN';
  return [m.id, plain(m.formula) + ' · ' + m.name, 'molecule:' + m.id, STATE_WORD[st] || 'UNCHECKED', [T(m.records['sto-3g'] ? 'library' : m.multiplicity > 1 ? 'uhf' : 'molecules'), m.oracle ? m.oracle.what : 'no oracle on file'], m.library ? '0.4.0' : m.multiplicity > 1 ? '0.7.1' : '0.2.0']; };
const molLines = [HAND.molecules, ...SECTIONS.map((s) => all.filter((m) => m.section === s).map(mol))];
shelves.registers = HAND.registers; shelves.readouts = HAND.readouts;
const T3 = { hofstadter: 'Φ = 1/2 against ±2J√(cos²k_x + cos²k_y) on the torus', walk: 'the Hadamard walk’s σ² against (1 − 1/√2)t² (Konno)', spin: 'the XX chain against Jordan–Wigner; S(t) ≤ ⌊N/2⌋ ln 2' };   // 0.8.1 T3
shelves.lattice = [HAND.lattice, ...LATTICES.map((p) => ['lattice:' + p.id, p.label, 'lattice:' + p.id, 'NUMERICAL', p.id === 'tunnel' ? [T('tunnel'), 'the transmission against the closed-form barrier'] : T3[p.id] ? [T('lattice-presets'), T3[p.id]] : HAND.lattice[4], T3[p.id] ? '0.8.1' : '0.7.2'])];
const byId = new Map([...Object.values(shelves).flat(), ...molLines.flat()].map((r) => [r[0], r]));
shelves.demos = STARTERS.map((s) => { const [of, since] = HAND.demos[s.file], r = byId.get(of); if (!r) throw new Error('no row for demo ' + s.file); return ['demo:' + s.file, s.name, 'demo:' + s.file, r[3], r[4], since]; });

const O = [], oi = (o) => { const k = JSON.stringify(o); let i = O.findIndex((x) => JSON.stringify(x) === k); if (i < 0) i = O.push(o) - 1; return i; };
const line = (rows) => rows.map(([id, name, opens, word, o, since]) => JSON.stringify([id, name, opens, word, oi(o), since])).join(', ');
const body = ['hydrogen', 'operators'].map((s) => `  ${s}: [${line(shelves[s])}],`).concat('  molecules: [', molLines.map((l) => '    ' + line(l) + ','), '  ],',
  ['registers', 'readouts', 'lattice', 'demos'].map((s) => `  ${s}: [${line(shelves[s])}],`));
const text = `/* catalogue.js — THE CATALOGUE (0.7.4 C1), GENERATED by tools/catalogue-table.mjs: never edit it by hand (\`node tools/catalogue-table.mjs --check\`).  Every system
 * λWAVES plays, one row each: { id, name, shelf, opens, word, oracle: { test, what }, since }; word is lab/status.js' grammar, oracle.test a file in tests/. */
const O = ${JSON.stringify(O.map(([test, what]) => ({ test, what })))};
const SHELVES = {
${body.join('\n')}
};
export const CATALOGUE = Object.freeze(Object.entries(SHELVES).flatMap(([shelf, rows]) => rows.map(([id, name, opens, word, o, since]) => Object.freeze({ id, name, shelf, opens, word, oracle: O[o], since }))));
`;
if (process.argv.includes('--check')) { const disk = readFileSync(OUT, 'utf8'); if (disk !== text) { console.error('lab/catalogue.js is stale: run node tools/catalogue-table.mjs'); process.exit(1); } console.log(`catalogue --check: ${Buffer.byteLength(text)} bytes, ${Object.values(shelves).flat().length + molLines.flat().length} rows, in step`); }
else { writeFileSync(OUT, text); console.log(`wrote lab/catalogue.js: ${Buffer.byteLength(text)} bytes, ${text.split('\n').length - 1} lines`); }
