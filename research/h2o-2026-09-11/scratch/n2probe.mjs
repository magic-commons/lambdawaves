/* n2probe.mjs — ROUND 4 · OPUS: why lab/scf.js lands 0.7298 Eh above the N2 ground state. */
import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { rhf } from '../../../lab/scf.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const R = 1.09768 / 0.52917721092;
const mol = molecule(bse, [{ Z: 7, c: [0, 0, 0] }, { Z: 7, c: [0, 0, R] }]), n = mol.n;
const base = { n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc };
const REF = -107.495887883412;
for (const opt of [
  { nElectrons: 14, tol: 1e-12 },
  { nElectrons: 14, tol: 1e-12, diis: 0 },
  { nElectrons: 14, tol: 1e-12, diis: 0, damping: 0.5 },
  { nElectrons: 14, tol: 1e-12, diis: 0, damping: 0.8 },
  { nElectrons: 14, tol: 1e-12, diis: 2 },
  { nElectrons: 14, tol: 1e-12, diis: 4 },
  { nElectrons: 14, tol: 1e-12, diis: 20 },
]) {
  const s = rhf(base, opt);
  const label = `diis=${opt.diis ?? 8} damp=${opt.damping ?? 0}`;
  console.log(`${label.padEnd(20)} E=${s.energy.toFixed(12)} Δ=${(s.energy - REF).toExponential(3).padStart(11)} it=${String(s.iterations).padStart(3)} conv=${s.converged} err=${s.error.toExponential(2)} gap(HOMO,LUMO)=${s.orbitalEnergies[6].toFixed(6)},${s.orbitalEnergies[7].toFixed(6)}`);
}
/* first three Fock/energy history entries of the default run: is the core guess the culprit? */
const s = rhf(base, { nElectrons: 14, tol: 1e-12 });
console.log('history (E, ‖e‖∞):'); s.history.slice(0, 12).forEach((h, i) => console.log(`  ${String(i).padStart(2)}  ${h.energy.toFixed(9).padStart(18)}  ${h.error.toExponential(3)}`));
