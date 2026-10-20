/* tools/clip-probe.mjs — iteration 013 H1: does an orbital fit its DOMAIN AUTO box?  One label alone per system (DOMAIN AUTO on, FRAME on):
 * the box's half, the label's own reach (R² down to SOLID's iso edge 0.033 and to 1e-3 of its peak), the grid's face ratio (max ρ on the
 * box's faces over max ρ), and a small JPEG of the stage.  Diagnostics only — nothing under lab/ reads it.
 *   python3 tools/gate/server.py "$PWD" 9631 &
 *   LW_PORT=9631 GD_PORT=5631 node tools/clip-probe.mjs <tag> <out-dir> */
import { open } from './gate/gatekit.mjs'; import { radial } from '../lab/hydrogen.js'; import { atomRadial } from '../lab/atoms.js';
import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const PORT = process.env.LW_PORT || 9631, TAG = process.argv[2] || 'shot', OUT = process.argv[3] || '.tmp/clip';
const NL = ['1:0', '2:1', '3:2', '4:3'];
const CASES = [...NL.map((nl) => ({ sys: 'hydrogen', nl })), ...[1, 6, 26].flatMap((Z) => NL.map((nl) => ({ sys: 'atom', Z, nl }))),
  ...NL.map((nl) => ({ sys: 'atom', Z: 6, nl, atomsWin: true }))];
fs.mkdirSync(OUT, { recursive: true });
const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1400, height: 900 });
await g.waitFor('window.__LW && __LW.ready'); await g.settle();
const rows = [];
try {
  for (const c of CASES) {
    const r = await g.ev(`
      const L = __LW, H = await import('/lab/hydrogen.js');
      L.domain.auto = true; L.setFrame(true);
      ${c.sys === 'atom' ? `L.setElement(${c.Z}); L.setHamiltonian('atom');` : `L.setHamiltonian('hydrogen');`}
      ${c.atomsWin ? `{ const w = document.querySelector('.dev[data-id="atoms"]'); if (w) { w.hidden = false; w.classList.remove('closed'); } }` : ''}
      const [n, l] = '${c.nl}'.split(':').map(Number), s = H.stateOf(n, l, 0);
      L.reg.clear(); L.reg.set(s.index, 1, 0, L.clock.t); L.setDamping(0);
      await new Promise((q) => setTimeout(q, 2500)); await L.settle();
      const half = L.domain.half;
      const G = await L.field.readGrid(), N = G.N, u = G.texels;
      const f16 = (h) => { const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, m = h & 1023; return e === 0 ? s * m * 2 ** -24 : e === 31 ? NaN : s * (1 + m / 1024) * 2 ** (e - 15); };
      let face = 0, all = 0;
      for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const o = 4 * (x + N * (y + N * z)), re = f16(u[o]), im = f16(u[o + 1]), rho = re * re + im * im;
        if (rho > all) all = rho;
        if ((x === 0 || y === 0 || z === 0 || x === N - 1 || y === N - 1 || z === N - 1) && rho > face) face = rho;
      }
      return { sys: L.hamiltonian, Z: L.hamiltonian === 'atom' ? L.atomZ : L.Z, half: +half.toFixed(2), face: +(all > 0 ? face / all : 0).toExponential(2), res: N };`);
    if (r && r.E) { console.log(c, r.E); continue; }
    const [n, l] = c.nl.split(':').map(Number), R = (x) => (c.sys === 'atom' ? atomRadial(c.Z, n, l, x) : radial(n, l, x));
    let Rm = 0; const R2 = []; for (let i = 1; i <= 8000; i++) { const v = R(i * 0.05); R2.push(v * v); Rm = Math.max(Rm, v * v); }
    const reach = (e) => { for (let i = R2.length - 1; i >= 0; i--) if (R2[i] >= e * Rm) return +((i + 1) * 0.05).toFixed(2); return 0; };
    r.rIso = reach(0.033); r.r1e3 = reach(1e-3);
    r.clipIso = r.rIso > r.half; r.clip1e3 = r.r1e3 > r.half;
    const name = `${TAG}-${c.sys}${c.Z ? '-Z' + c.Z : ''}${c.atomsWin ? '-atomswin' : ''}-${c.nl.replace(':', '')}`, png = `${OUT}/${name}.png`;
    fs.writeFileSync(png, Buffer.from(await g.snap(), 'base64'));
    execFileSync('python3', ['-c', 'import sys; from PIL import Image; i = Image.open(sys.argv[1]).convert("RGB"); i.thumbnail((640, 640)); i.save(sys.argv[2], quality=68)', png, `${OUT}/${name}.jpg`]);
    fs.rmSync(png); r.shot = name + '.jpg';
    rows.push({ ...c, ...r }); console.log(JSON.stringify(r));
  }
} finally { fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rows, null, 1)); await g.close(); }
