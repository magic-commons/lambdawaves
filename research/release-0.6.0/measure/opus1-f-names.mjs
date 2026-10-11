// opus1-f-names — do the orbital NAMES (1a1, 1b2) already reach every live molecule? (Opus audit; read-only on the tree)
// Solves every enabled STO-3G entry with the app's own moleculeRHF and names it with the app's own names.js.
import { readFileSync, writeFileSync } from 'node:fs';
const T = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/';
const { moleculeRHF, registerRecord } = await import(T + 'lab/rhf-molecule.js');
const { MOLECULES, moleculeAtoms, moleculeCharge } = await import(T + 'lab/molecules.js');
const { namesOf, orbitalName } = await import(T + 'lab/names.js');
registerRecord('sto-3g', JSON.parse(readFileSync(T + 'lab/vendor/bse/sto-3g-v1.json', 'utf8')));
const rows = []; const t0 = performance.now();
for (const m of MOLECULES) {
  if (m.disabled) { rows.push({ id: m.id, group: m.symmetry.group, status: 'disabled' }); continue; }
  if (m.recordOnly) { rows.push({ id: m.id, group: m.symmetry.group, status: 'recordOnly' }); continue; }
  const atoms = moleculeAtoms(m.id), t = performance.now();
  let sol; try { sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge(m.id) }); } catch (e) { rows.push({ id: m.id, status: 'solve-error ' + e.message }); continue; }
  const solveMs = performance.now() - t, N = namesOf(sol, atoms, m.symmetry);
  rows.push({ id: m.id, group: m.symmetry.group, nAO: sol.C.length ? Math.round(Math.sqrt(sol.C.length)) : null, reliable: !!N.reliable, reason: N.reliable ? null : N.reason,
    homo: orbitalName(N, sol.nocc - 1, sol.nocc), solveMs: +solveMs.toFixed(0), nameMs: N.ms });
}
const live = rows.filter((r) => r.status === undefined);
const out = { what: 'orbital names on the ORBITAL knob (chemview.js:75 orbFmt → names.js orbitalName) for every live STO-3G entry',
  liveSolved: live.length, named: live.filter((r) => r.reliable).length, refused: live.filter((r) => !r.reliable).map((r) => [r.id, r.group, r.reason]),
  C1: live.filter((r) => r.group === 'C1').length, groups: [...new Set(live.map((r) => r.group))], wallMs: +(performance.now() - t0).toFixed(0), rows };
writeFileSync(new URL('./opus1-f-names.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ liveSolved: out.liveSolved, named: out.named, refused: out.refused.length, C1: out.C1, groups: out.groups, wallMs: out.wallMs, sample: live.slice(0, 6).map((r) => r.id + ':' + r.homo) }));
