#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {basisFrom,ANGSTROM,rdOf} from '../../lab/md.js';
const root=new URL('../../',import.meta.url),out=new URL('tools/library/census/',root);
const read=(p)=>JSON.parse(readFileSync(new URL(p,root)));
const frontier=read('tools/library/census/c60-frontier.json');
const samples=read('tools/library/census/c60-pyscf-samples.json');
const rec=read('lab/vendor/bse/sto-3g-v1.json');
const atoms=frontier.geometry.atomsAngstrom.map(([Z,x,y,z])=>({Z,x:x*ANGSTROM,y:y*ANGSTROM,z:z*ANGSTROM}));
const b=basisFrom(atoms,rec),coeffs=[...frontier.frontier.HOMO.coefficientColumns,...frontier.frontier.LUMO.coefficientColumns];
assert.equal(b.n,300);assert.equal(coeffs.length,8);assert.ok(frontier.waterProof.pass);
assert.deepEqual([...rdOf(b)],frontier.aoConversion.rowScalePySCFToApp);
let worst=0;
for(let k=0;k<samples.pointsBohr.length;k++){
 const pt=samples.pointsBohr[k],aos=b.bfs.map(bf=>{
   const d=pt.map((v,i)=>v-bf.c[i]),rr=d.reduce((v,x)=>v+x*x,0);
   return d.reduce((v,x,i)=>v*x**bf.l[i],1)*bf.exps.reduce((v,ex,i)=>v+bf.d[i]*Math.exp(-ex*rr),0);
 });
 for(let j=0;j<8;j++){const v=aos.reduce((sum,x,i)=>sum+x*coeffs[j][i],0);worst=Math.max(worst,Math.abs(v-samples.signedValues[k][j]));}
}
assert.ok(worst<samples.tolerance);
const check={status:'MEASURED',pass:true,maxSignedFieldError:worst,tolerance:samples.tolerance,points:samples.pointsBohr.length,orbitals:8,valuesCompared:8*samples.pointsBohr.length,appBasisHash:b.hash,meaning:'CPU signed Gaussian evaluation using md.js basisFrom contraction coefficients and exact app AO row order vs independent PySCF GTOval_cart. No GPU or browser.',numericTags:{tolerance:'DERIVED chosen bound',points:'DERIVED count',orbitals:'DERIVED count',valuesCompared:'DERIVED count',maxSignedFieldError:'MEASURED'}};
writeFileSync(new URL('c60-field-check.json',out),JSON.stringify(check,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(check));
