// opus1-c-rm-session — can a LATTICE ride the molecular session as a kind-2 complex orbital with no SCF? (Opus audit; read-only)
import { writeFileSync } from 'node:fs';
const T = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/';
const S = await import(T + 'lab/molecular-session.js');
const F = await import(T + 'lab/field.js');                // engine module; createField needs WebGPU, packMolecule is pure
const out = { modelIds: S.MODEL_IDS, productKinds: S.PRODUCT_KINDS };
// a stub field that does what field.js' setMolecule/setMoleculeMatrix validate (packMolecule is the real one)
const calls = []; const field = { ok: true,
  setMolecule(spec) { const p = F.packMolecule(spec); calls.push(['setMolecule', p.nAO, p.nShell, p.nPrim]); return { nAO: p.nAO, half: spec.half }; },
  setMoleculeMatrix(M, o) { calls.push(['setMoleculeMatrix', o.kind, M.re ? M.re.length : M.length]); } };
const ses = S.createMolecularSession({ field, fieldView: (v) => calls.push(['view', v]), repaint() {} });
try { ses.register('lattice', {}); out.newModelId = 'accepted'; } catch (e) { out.newModelId = 'REFUSED: ' + e.message; }
// one narrow s-shell per site, L × L square lattice, spacing a (bohr)
function latticeSpec(L, a = 1.6, alpha = 2.0) { const shells = [];
  for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) shells.push({ l: 0, center: [(i - (L - 1) / 2) * a, (j - (L - 1) / 2) * a, 0], prims: [{ alpha, w: [Math.pow(2 * alpha / Math.PI, 0.75)] }] });
  return { hash: 'lattice-' + L, nAO: L * L, half: (L / 2 + 1) * a, shells }; }
// a tight-binding eigenstate (open square lattice): psi_{kx,ky}(i,j) = sin, times e^{-iEt}: the register's complex amplitude
const amp = (L, kx, ky, t = 0.3) => { const E = -2 * (Math.cos(Math.PI * kx / (L + 1)) + Math.cos(Math.PI * ky / (L + 1))), re = new Float32Array(L * L), im = new Float32Array(L * L);
  for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) { const v = Math.sin(Math.PI * kx * (i + 1) / (L + 1)) * Math.sin(Math.PI * ky * (j + 1) / (L + 1)); re[i * L + j] = v * Math.cos(E * t); im[i * L + j] = -v * Math.sin(E * t); }
  return { re, im }; };
out.sizes = {};
for (const L of [8, 16, 17]) {
  const id = 'orbital-packet';                               // borrowing an EXISTING id: the only way in without editing MODEL_RANK
  const ses2 = S.createMolecularSession({ field, repaint() {} }); ses2.register(id, { view: () => 'phase' }); ses2.claim(id, true, 'lattice');
  let adopted = null, err = null; try { adopted = ses2.adopt(latticeSpec(L), 1); } catch (e) { err = e.message; }
  let published = false; if (adopted) published = ses2.publish(id, { kind: 'orbital', matrix: amp(L, 1, 2), hash: 'lattice-' + L, solution: 1, view: 'phase' });
  out.sizes[L] = { sites: L * L, adopted: !!adopted, published, err, road: L * L > F.MOL_ORB_FROM ? 'ORB_WGSL (no tile)' : 'tile ' + F.molTierFor(L * L) };
}
out.calls = calls.slice(0, 8);
out.findings = [
  'MODEL_RANK is a closed list (molecular-session.js:41): a lattice needs +1 line there AND a rank decision (above or below tdhf/states/orbital-packet/ground?)',
  'the session is the MOLECULAR owner: rack.js:478 overlayDomain keys on app.state.chem.on, so a lattice that adopts the field while MOLECULES is off leaves VORTEX/PARTICLES/KEPLER drawing the hydrogen register over a lattice picture — RM needs the FIELD-OWNER predicate (C7 re-cut) first',
  'no SCF, no atomsSha256: adopt() asks only {hash, nAO, half, shells}; publish() only the hash and a monotone solution (DERIVED-HERE from :101–145)'];
writeFileSync(new URL('./opus1-c-rm-session.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
