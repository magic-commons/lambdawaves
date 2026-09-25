/* probes/K/k11-page.js — K11 in the page (Firefox): the base wellPacket (probes/K/well-base.js, imported into the page)
 * against the shipped one, same packet, Object.is on the result; and the whole synchronous OPERATOR→BOX press. */
const LW = __LW;
const B = await import('/research/optimization-2026-09-24/probes/K/well-base.js');
const N = await import('/lab/well.js');
B.setWellRadius(N.wellRadius());
const x0 = [-5, 0, 0], k = [0.8, 0, 0], sg = 1.8, tB = [], tN = [];
let P, Q;
for (let i = 0; i < 5; i++) { let t0 = performance.now(); P = B.wellPacket(x0, k, sg); tB.push(performance.now() - t0); t0 = performance.now(); Q = N.wellPacket(x0, k, sg); tN.push(performance.now() - t0); }
let same = Object.is(P.captured, Q.captured); for (let q = 0; q < 91; q++) if (!Object.is(P.re[q], Q.re[q]) || !Object.is(P.im[q], Q.im[q])) same = false;
tB.sort((a, b) => a - b); tN.sort((a, b) => a - b);
LW.pause(); LW.setGasBasis('reg');
const press = []; for (let i = 0; i < 3; i++) { LW.setHamiltonian('hydrogen'); const t0 = performance.now(); LW.enterBox(); press.push(+(performance.now() - t0).toFixed(1)); }
LW.setHamiltonian('hydrogen');
return { same, baseWellPacketMs: +tB[2].toFixed(1), builtWellPacketMs: +tN[2].toFixed(1), boxPressMs: press };
