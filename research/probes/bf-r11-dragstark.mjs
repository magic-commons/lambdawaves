/* bf-r11-dragstark.mjs — §9: does the DRAG toy act at all when a STARK field is on?
 * state.js _propagate applies g = exp(-gamma (E_a - E_0) t) ONLY inside the `this.field.Fz === 0` branch. */
import { BASIS } from '../../lab/hydrogen.js';
import { setHamiltonian, getHamiltonian } from '../../lab/hamiltonian.js';
import { Register } from '../../lab/state.js';
setHamiltonian('hydrogen');
const i1s = BASIS.findIndex(s=>s.n===1&&s.l===0&&s.m===0), i2p = BASIS.findIndex(s=>s.n===2&&s.l===1&&s.m===0);
for (const Fz of [0, 1e-9, 0.001, 0.01]) {
  const R = new Register(); R.setEnergies((q)=>getHamiltonian().energy(q)); R.clear();
  R.set(i1s, Math.SQRT1_2, 0, 0); R.set(i2p, Math.SQRT1_2, 0, 0);
  R.setDamping(0.1); R.setField({ Fz });
  const c = R.at(10);
  let n2 = 0; for (let q=0;q<91;q++) n2 += c.re[q]**2 + c.im[q]**2;
  console.log(`Fz = ${String(Fz).padEnd(8)}  damping = ${R.damping}  norm^2 at t = 10 : ${n2.toFixed(12)}   (unitary would be 1.000000000000; the toy should give 0.736183)`);
  console.log(`    status line rack.js:181 would read: "TOY DRAG γ = ${R.damping.toFixed(3)} · NON-UNITARY"   -- is it non-unitary?  ${Math.abs(n2-1) > 1e-9}`);
}
