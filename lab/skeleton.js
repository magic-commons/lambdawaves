/* skeleton.js — THE SKELETON (0.7.0 V2): the nuclei as beads, the bonds and the dipole arrow on the stage's own #skeleton canvas, through the one eye
 * (field.js toScreen).  A bead is 0.28 × the element's covalent radius (Cordero et al., Dalton Trans. 2008, 2832: H–Kr, Å → bohr) projected, so it
 * shrinks with distance, in the Jmol CPK colour; a bond is every pair within 1.3 × (rᵢ + rⱼ) (1.2 drops F₂, at 1.24) of the atoms AS PASSED, found again only when they move;
 * the dipole (a.u.) runs from the centre of nuclear charge, 2 bohr per a.u., in the accent.  The far half (depth past the origin's) is dimmed, as
 * angular-nodes.js dims it.  Ink and accent are the kit's --fg / --acc, read when the theme changes.  Nothing changed: no paint; off: clear() once. */
import { cameraKey, toScreen } from './field.js';
import { ANGSTROM } from './md.js';

const RCOV = [0, 0.31, 0.28, 1.28, 0.96, 0.84, 0.76, 0.71, 0.66, 0.57, 0.58, 1.66, 1.41, 1.21, 1.11, 1.07, 1.05, 1.02, 1.06, 2.03, 1.76, 1.70, 1.60, 1.53, 1.39, 1.39, 1.32, 1.26, 1.24, 1.32, 1.22, 1.22, 1.20, 1.19, 1.20, 1.20, 1.16].map((r) => r * ANGSTROM);
const CPK = { 1: '#fff', 3: '#cc80ff', 4: '#c2ff00', 5: '#ffb5b5', 6: '#909090', 7: '#3050f8', 8: '#ff0d0d', 9: '#90e050', 11: '#ab5cf2', 12: '#8aff00', 13: '#bfa6a6', 14: '#f0c8a0', 15: '#ff8000', 16: '#ffff30', 17: '#1ff01f', 29: '#c88033', 30: '#7d80b0', 32: '#668f8f', 33: '#bd80e3', 34: '#ffa100', 35: '#a62929' };

export function createSkeleton(cv) {
  const g = cv.getContext('2d'); let key = '', atomsKey = '', bonds = [], theme = null, ink = '', acc = '', drawn = false;
  function clear() { key = ''; if (!drawn) return; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); drawn = false; }
  function draw(atoms, dipole, obs, half) {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1), th = document.body.dataset.theme || 'dark';
    if (!atoms || !atoms.length || W < 1 || H < 1) return clear();
    const ak = atoms.map((a) => `${a.Z},${a.x.toFixed(4)},${a.y.toFixed(4)},${a.z.toFixed(4)}`).join(';');
    const k = [ak, dipole ? dipole.map((v) => v.toFixed(4)).join() : '', cameraKey(obs), obs.dist.toFixed(4), obs.fov, half, W, H, dpr, th].join('|'); if (k === key) return; key = k;
    if (ak !== atomsKey) { atomsKey = ak; bonds = []; for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const a = atoms[i], b = atoms[j]; if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1.3 * (RCOV[a.Z] + RCOV[b.Z])) bonds.push([i, j]); } }
    if (th !== theme) { theme = th; const cs = getComputedStyle(document.body); ink = cs.getPropertyValue('--fg').trim() || cs.color; acc = cs.getPropertyValue('--acc').trim() || ink; }
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); drawn = true;
    const S = toScreen(obs, half, W, H), c0 = S.at(0, 0, 0), zc = c0 ? c0[2] : Infinity, rt = S.basis.right, P = atoms.map((a) => S.at(a.x, a.y, a.z, []));
    g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round';
    for (const [i, j] of bonds) { const p = P[i], q = P[j]; if (!p || !q) continue; g.globalAlpha = (p[2] + q[2]) / 2 > zc ? 0.25 : 0.7; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
    g.lineWidth = 1;
    for (const i of P.map((_, i) => i).filter((i) => P[i]).sort((i, j) => P[j][2] - P[i][2])) {   // far to near: a near bead covers a far one
      const a = atoms[i], p = P[i], R = 0.28 * (RCOV[a.Z] || 1.5 * ANGSTROM), e = S.at(a.x + R * rt[0], a.y + R * rt[1], a.z + R * rt[2]); if (!e) continue;
      g.globalAlpha = p[2] > zc ? 0.35 : 0.9; g.fillStyle = CPK[a.Z] || '#ff1493'; g.beginPath(); g.arc(p[0], p[1], Math.hypot(e[0] - p[0], e[1] - p[1]), 0, 2 * Math.PI); g.fill(); g.stroke();
    }
    if (!dipole || Math.hypot(dipole[0], dipole[1], dipole[2]) < 0.01) return;
    let Z = 0; const C = [0, 0, 0]; for (const a of atoms) { Z += a.Z; C[0] += a.Z * a.x; C[1] += a.Z * a.y; C[2] += a.Z * a.z; }
    const p = S.at(C[0] / Z, C[1] / Z, C[2] / Z), q = S.at(C[0] / Z + 2 * dipole[0], C[1] / Z + 2 * dipole[1], C[2] / Z + 2 * dipole[2]); if (!p || !q) return;
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L, bx = q[0] - 6 * ux, by = q[1] - 6 * uy;
    g.globalAlpha = 0.95; g.strokeStyle = g.fillStyle = acc; g.lineWidth = 2; g.lineCap = 'butt'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(bx, by); g.stroke();
    g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(bx - 3.5 * uy, by + 3.5 * ux); g.lineTo(bx + 3.5 * uy, by - 3.5 * ux); g.closePath(); g.fill();
  }
  return { draw, clear };
}
