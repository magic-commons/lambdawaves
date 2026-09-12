import { readFileSync } from 'node:fs';
import { molecule } from './md.mjs';
import { H2O } from './geom.mjs';
import { rhf } from '../../../lab/scf.js';
import { createRTHF, hermitianEigen, unitaryOf, similarity, sandwich, creal, loewdin } from '../../../lab/density.js';
import { eigSym } from '../../../lab/h2ci.js';
const bse = JSON.parse(readFileSync(new URL('../sto-3g.bse.json', import.meta.url), 'utf8'));
const mol = molecule(bse, H2O), n = mol.n;
const s = rhf({ n, S: mol.S, h: mol.h, eri: mol.eri, Enuc: mol.Enuc }, { nElectrons: 10, tol: 1e-12 });
const rt = createRTHF({ n, S: mol.S, h: mol.h, eri: mol.eri, Z: mol.M[2], Enuc: mol.Enuc, nuclearDipole: mol.nuclearDipole[2], nElectrons: 10, D0: s.D, dt: 0.01 });
rt.kick(1e-3); for (let k = 0; k < 50; k++) rt.step(0.01);
const P = rt.P;
// a realistic complex F̃ : build it the way density.js does
const { X } = loewdin(mol.S, n);
const D = sandwich(X, P);
let F = null; { // replicate fockAO
  F = { re: new Float64Array(n*n), im: new Float64Array(n*n), n };
  for (let i=0;i<n;i++) for (let j=0;j<n;j++){ let fr = mol.h[i*n+j], fi=0;
    for (let k=0;k<n;k++) for (let l=0;l<n;l++){ const J=mol.eri[((i*n+j)*n+k)*n+l], K=0.5*mol.eri[((i*n+l)*n+k)*n+j];
      fr += D.re[k*n+l]*J - D.re[l*n+k]*K; fi += D.im[k*n+l]*J - D.im[l*n+k]*K; }
    F.re[i*n+j]=fr; F.im[i*n+j]=fi; } }
const Ft = sandwich(X, F);
const tm = (name, f, N=2000) => { const t0=process.hrtime.bigint(); for(let k=0;k<N;k++) f(); console.log(name, (Number(process.hrtime.bigint()-t0)/N/1000).toFixed(1), 'µs'); };
tm('hermitianEigen(7 cplx)', () => hermitianEigen(Ft));
tm('unitaryOf', () => unitaryOf(Ft, 0.01));
const U = unitaryOf(Ft, 0.01);
tm('similarity', () => similarity(U, P));
tm('sandwich', () => sandwich(X, P));
const m2 = 2*n, R = new Float64Array(m2*m2);
for (let i=0;i<n;i++) for (let j=0;j<n;j++){ const a=Ft.re[i*n+j], b=Ft.im[i*n+j];
  R[i*m2+j]=a; R[(i+n)*m2+(j+n)]=a; R[i*m2+(j+n)]=-b; R[(i+n)*m2+j]=b; }
tm('eigSym(14) on the real realification', () => eigSym(R, m2));
let off=0; { const a=Array.from(R); let sw=0;
  for (let sweep=0; sweep<100; sweep++){ off=0; for(let p=0;p<m2;p++) for(let q=p+1;q<m2;q++) off+=a[p*m2+q]**2; sw=sweep; if(off<1e-34) break;
    for(let p=0;p<m2;p++) for(let q=p+1;q<m2;q++){ const apq=a[p*m2+q]; if(Math.abs(apq)<1e-300) continue;
      const th=(a[q*m2+q]-a[p*m2+p])/(2*apq), t=(th>=0?1:-1)/(Math.abs(th)+Math.sqrt(th*th+1)), c=1/Math.sqrt(t*t+1), sn=t*c;
      for(let k=0;k<m2;k++){const x=a[k*m2+p],y=a[k*m2+q]; a[k*m2+p]=c*x-sn*y; a[k*m2+q]=sn*x+c*y;}
      for(let k=0;k<m2;k++){const x=a[p*m2+k],y=a[q*m2+k]; a[p*m2+k]=c*x-sn*y; a[q*m2+k]=sn*x+c*y;} } }
  console.log('sweeps on the DEGENERATE realification =', sw+1, 'final off =', off.toExponential(3)); }
