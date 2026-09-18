// Research only. Reproduce with: node research/astra-2026-09-18/probe.mjs
// No application modules are modified. Timings are CPU observations, not GPU promises.
import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { moleculeRHF, registerRecord } from '../../lab/rhf-molecule.js';
import { moleculeAtoms, moleculeCharge } from '../../lab/molecules.js';
import { evaluator } from '../../lab/molecular-field.js';
import { rpa } from '../../lab/rpa-inspector.js';
import { createRTHF } from '../../lab/density.js';

const dir = new URL('./', import.meta.url);
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
registerRecord('sto-3g', JSON.parse(read('../../lab/vendor/bse/sto-3g-v1.json')));
const time = fn => { const t = performance.now(), value = fn(); return { value, ms: performance.now() - t }; };
const maxDiff = (a,b) => Math.max(...a.map((v,i) => Math.abs(v-b[i])));

// Counterfactual RPA: reuse one eigendecomposition of A-B for both matrix functions,
// and build the diagnostic Fock once instead of once for every MO column.
let source = read('../../lab/rpa-inspector.js');
source = source.replace("'./h2ci.js'", JSON.stringify(new URL('../../lab/h2ci.js', import.meta.url).href));
source = source.replace('function symFunc(A, m, f) {\n  const e = eigSym(A, m),', 'function symFunc(A, m, f, e = eigSym(A, m)) {\n  const');
assert(source.includes('const out = new Float64Array(m * m);'));
source = source.replace('const half = symFunc(AmB, m, Math.sqrt), halfInv = symFunc(AmB, m, (x) => 1 / Math.sqrt(x));',
  'const eAmB = eigSym(AmB, m);\n  const half = symFunc(AmB, m, Math.sqrt, eAmB), halfInv = symFunc(AmB, m, (x) => 1 / Math.sqrt(x), eAmB);');
const old = `        let F = h[u * n + w];
        for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) F += D[k * n + l] * (eri[((u * n + w) * n + k) * n + l] - 0.5 * eri[((u * n + l) * n + k) * n + w]);`;
assert(source.includes(old), 'source anchor for the repeated Fock diagnostic must match');
source = source.replace('    scfResidual = 0;', `    const cachedF = new Float64Array(n*n);
    for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) {
      let F = h[u*n+w];
      for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) F += D[k*n+l] * (eri[((u*n+w)*n+k)*n+l] - 0.5 * eri[((u*n+l)*n+k)*n+w]);
      cachedF[u*n+w] = F;
    }
    scfResidual = 0;`);
source = source.replace(old, '        const F = cachedF[u * n + w];');
const { rpa: reuseRpa } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

const result = {
  date: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir }).toString().trim(),
  environment: { node: process.version, cpu: os.cpus()[0]?.model, platform: os.platform(), arch: os.arch() },
  note: 'CPU wall times; single machine, no browser/GPU speedup claimed. First calls include warmup. RPA comparison uses one untimed warmup then alternating order across three measurements.',
  molecules: {},
};

for (const id of ['H2O', 'C6H6']) {
  const full = time(() => moleculeRHF({ atoms: moleculeAtoms(id), charge: moleculeCharge(id) }));
  const sol = full.value, I = sol.integrals, n = I.n;
  const args = { S:I.S, h:I.h, eri:I.eri, X:I.X, Y:I.Y, Z:I.Z, C:sol.C, eps:sol.orbitalEnergies, nocc:sol.nocc };
  const rr = time(() => rpa(args)), candidate = time(() => reuseRpa(args));
  assert.equal(candidate.value.scfResidual, rr.value.scfResidual);
  assert.equal(maxDiff(candidate.value.roots.map(r=>r.omega), rr.value.roots.map(r=>r.omega)), 0);
  assert.equal(maxDiff(candidate.value.roots.map(r=>r.f), rr.value.roots.map(r=>r.f)), 0);
  const timings = { baseline:[], reuse:[] };
  for(let rep=0; rep<3; rep++) for(const label of rep%2 ? ['reuse','baseline'] : ['baseline','reuse']) {
    timings[label].push(time(() => (label==='baseline' ? rpa : reuseRpa)(args)).ms);
  }
  const median = a=>[...a].sort((x,y)=>x-y)[1];
  const ev = evaluator(sol.basis.shells), h=sol.nocc-1, l=sol.nocc;
  const gap=sol.orbitalEnergies[l]-sol.orbitalEnergies[h], T=2*Math.PI/gap;
  const half=8, N=32, coords=Array.from({length:N},(_,i)=>(i+.5)*2*half/N-half);
  // Three 1-D Gaussian tables per unique primitive; angular factors stay polynomial.
  const tables=ev.groups.map(g=>Array.from(g.exps,a=>Array.from(g.c,c=>Float64Array.from(coords, x=>Math.exp(-a*(x-c)**2)))));
  const tabAO = (ix,iy,iz,out) => {
    for(let k=0;k<ev.groups.length;k++) {
      const g=ev.groups[k], dx=coords[ix]-g.c[0], dy=coords[iy]-g.c[1], dz=coords[iz]-g.c[2];
      for(const b of g.comps) {
        let v=0;
        for(let p=0;p<g.exps.length;p++) v+=b.d[p]*tables[k][p][0][ix]*tables[k][p][1][iy]*tables[k][p][2][iz];
        out[b.idx]=v*dx**b.l[0]*dy**b.l[1]*dz**b.l[2];
      }
    }
    return out;
  };
  let sepError=0, maxAO=0, bestProduct=0, probe=null;
  const a=new Float64Array(n), b=new Float64Array(n);
  for(let iz=0;iz<N;iz++) for(let iy=0;iy<N;iy++) for(let ix=0;ix<N;ix++) {
    ev.ao([coords[ix],coords[iy],coords[iz]],a); tabAO(ix,iy,iz,b);
    let H=0,L=0;
    for(let mu=0;mu<n;mu++) { sepError=Math.max(sepError,Math.abs(a[mu]-b[mu])); maxAO=Math.max(maxAO,Math.abs(a[mu])); H+=sol.C[mu*n+h]*a[mu]; L+=sol.C[mu*n+l]*a[mu]; }
    if(Math.abs(H*L)>bestProduct) { bestProduct=Math.abs(H*L); probe={point:[coords[ix],coords[iy],coords[iz]],H,L}; }
  }
  assert(sepError<2e-13, 'separable Gaussian tables agree with the analytic evaluator');
  const rho=(t,H=probe.H,L=probe.L)=>.5*(H*H+L*L)+H*L*Math.cos(gap*t);
  let normDefect=0;
  for(const t of [0,.137*T,.5*T,T,1e6*T]) {
    const re=new Float64Array(n), im=new Float64Array(n);
    for(const k of [h,l]) for(let mu=0;mu<n;mu++) { const amp=sol.C[mu*n+k]*Math.SQRT1_2; re[mu]+=amp*Math.cos(-sol.orbitalEnergies[k]*t); im[mu]+=amp*Math.sin(-sol.orbitalEnergies[k]*t); }
    let norm=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)norm+=I.S[i*n+j]*(re[i]*re[j]+im[i]*im[j]);
    normDefect=Math.max(normDefect,Math.abs(norm-1));
  }
  assert(normDefect<1e-10);
  // Response fields follow the singlet X+Y convention in the production inspector.
  // D_K^tr = (C_occ M C_vir^T + transpose)/sqrt(2), M = X+Y.
  const transition=root=>{
    const D=new Float64Array(n*n);
    for(let p=0;p<rr.value.pairs.length;p++) {
      const {i,a}=rr.value.pairs[p], w=(root.X[p]+root.Y[p])*Math.SQRT1_2;
      for(let u=0;u<n;u++)for(let v=0;v<n;v++)D[u*n+v]+=w*(sol.C[u*n+i]*sol.C[v*n+a]+sol.C[u*n+a]*sol.C[v*n+i]);
    }
    return D;
  };
  let transitionTraceError=0,transitionDipoleError=0;
  const trans=rr.value.roots.map(root=>{
    const D=transition(root);let tr=0;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)tr+=D[i*n+j]*I.S[j*n+i];
    transitionTraceError=Math.max(transitionTraceError,Math.abs(tr));
    for(const [q,M] of [I.X,I.Y,I.Z].entries()){
      let dip=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)dip+=D[i*n+j]*M[j*n+i];
      transitionDipoleError=Math.max(transitionDipoleError,Math.abs(dip-root.mu[q]));
    }
    return D;
  });
  assert(transitionTraceError<1e-10 && transitionDipoleError<1e-10);
  const m = result.molecules[id] = { nAO:n, nocc:sol.nocc, energy:sol.energy,
    groundPreparationMs:full.ms, firstRpaMs:rr.ms, firstReuseRpaMs:candidate.ms,
    rpaTrialsMs:timings, rpaMedianMs:median(timings.baseline), reuseRpaMedianMs:median(timings.reuse),
    rpaSpeedRatio:median(timings.baseline)/median(timings.reuse), rpaRootAndStrengthMaxChange:0,
    gap, beatPeriodAu:T, normDefect, interference:{...probe,rho0:rho(0),rhoHalfBeat:rho(T/2)},
    gaussianFactorization:{N,half,maxAbsoluteError:sepError,maxAO,uniquePrimitives:ev.exponentialsPerPoint, tableBytesAt96:3*96*ev.exponentialsPerPoint*4},
    response:{modes:rr.value.roots.length,transitionTraceError,transitionDipoleError},
  };
  if(id==='H2O') {
    // Full-spectrum response replay versus a fresh small-kick TDHF run. Independent
    // routes, same finite physical model; finite dt and nonlinear errors remain.
    const axis=2, kappa=1e-4, dt=.005, end=2;
    const rt=createRTHF({n,S:I.S,h:I.h,eri:I.eri,Z:I.Z,mu:[I.X,I.Y,I.Z],Enuc:I.Enuc,nElectrons:sol.nElectrons,D0:sol.D,dt,integrator:'magnus2'});
    rt.kickAlong('z',kappa);
    let densityError=0, signal=0, dipoleError=0, norm=0;
    const before=(()=>{let z=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)z-=sol.D[i*n+j]*I.Z[j*n+i];return z;})();
    for(let step=1;step<=Math.round(end/dt);step++) {
      rt.step(); if(step%20)continue;
      const delta=new Float64Array(n*n); let predictedDip=0;
      for(let k=0;k<trans.length;k++) {
        const root=rr.value.roots[k], weight=-2*kappa*root.mu[axis]*Math.sin(root.omega*rt.t);
        for(let p=0;p<delta.length;p++)delta[p]+=weight*trans[k][p];
        predictedDip-=weight*root.mu[axis];
      }
      const D=rt.D;
      for(let p=0;p<delta.length;p++){densityError=Math.max(densityError,Math.abs(D.re[p]-sol.D[p]-delta[p]));signal=Math.max(signal,Math.abs(delta[p]));}
      dipoleError=Math.max(dipoleError,Math.abs(rt.dipoleAlong('z')-before-predictedDip));
      norm=Math.max(norm,Math.abs(rt.observables().electrons-sol.nElectrons));
    }
    m.response.replayCheck={axis:'z',kappa,dt,end,maxAODensityError:densityError,maxLinearAODensitySignal:signal,relativeToMaxSignal:densityError/signal,maxDipoleError:dipoleError,electronTraceError:norm};
    assert(densityError/signal<.002 && dipoleError<1e-7);
    const size=72, extent=3.5, H=[],L=[];
    for(let j=0;j<size;j++)for(let i=0;i<size;i++) {
      const x=(i+.5)*2*extent/size-extent,z=extent-(j+.5)*2*extent/size;
      H.push(+ev.orbital(sol.C,h,[x,0,z]).toPrecision(6)); L.push(+ev.orbital(sol.C,l,[x,0,z]).toPrecision(6));
    }
    fs.writeFileSync(new URL('water-slice.json',dir),JSON.stringify({size,extent,plane:'y = 0 bohr',gap,period:T,H,L}));
  }
  fs.writeFileSync(new URL('measurements.json',dir),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({id,...m}));
}
