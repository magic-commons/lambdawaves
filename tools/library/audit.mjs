#!/usr/bin/env node
// Independent final structural/count/gate audit; no lab writes or solves.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {basisFrom,ANGSTROM} from '../../lab/md.js';
const root=new URL('../../',import.meta.url),out=new URL('research/release-0.4.0/library-census/',root);
const read=(name)=>JSON.parse(readFileSync(new URL(name,root)));
const census=read('research/release-0.4.0/library-census/census.json'),rows=census.rows;
const original=read('research/release-0.4.0/library-census/present-input.json');
const rec=read('lab/vendor/bse/sto-3g-v1.json'),rec631=read('lab/vendor/bse/6-31+g-star-v1.json');
assert.equal(rows.length,117);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
assert.equal(rows.filter(r=>r.family==='amino-acids').length,20);assert.equal(rows.filter(r=>r.family==='nucleobases').length,5);
const elements=new Set(),groups=new Set(),motifs=new Set(),formula=new Set();
let bytes=0,pass=0,basisChecks=0;
for(const r of rows){
 const atoms=r.geometry.atomsAngstrom.map(([Z,x,y,z])=>({Z,x:x*ANGSTROM,y:y*ANGSTROM,z:z*ANGSTROM}));
 atoms.forEach(a=>assert.ok(Object.values(a).every(Number.isFinite)));
 assert.equal(r.nocc,(atoms.reduce((s,a)=>s+a.Z,0)-r.charge)/2);
 if(!r.conditionalBasisBlocked){
   const b=basisFrom(atoms,rec);assert.equal(b.n,r.nAO_STO3G);basisChecks++;
   assert.equal(r.predictedRecordBytes,8*(b.n*b.n+2*b.n)+2000);bytes+=r.predictedRecordBytes;
   assert.equal(r.predictedRecordBytes2KiB,r.predictedRecordBytes+48);
   assert.ok(Number.isFinite(r.energyEh));assert.ok(Number.isFinite(r.wallSeconds));assert.ok(Number.isFinite(r.gapEh));
   assert.ok(typeof r.converged==='boolean');assert.ok(r.numericStatus.energyEh);
 } else {
   assert.equal(r.energyEh,null);assert.equal(r.converged,null);assert.equal(r.nAO_STO3G,null);
 }
 if(atoms.every(a=>rec631.elements[a.Z]))assert.equal(basisFrom(atoms,rec631).n,r.nAO_631plusGstar);
 const key=r.formula+(r.charge?`${r.charge>0?'+':'-'}${Math.abs(r.charge)}`:''),newZ=atoms.some(a=>!elements.has(a.Z)),newGroup=r.topgroup&&!groups.has(r.topgroup),newTag=r.motifs.some(x=>!motifs.has(x));
 const family=['amino-acids','nucleobases'].includes(r.family),expected=family||(!formula.has(key)&&Boolean(newZ||newGroup||newTag));
 assert.equal(r.diversityGate.pass,expected,`gate ${r.id}`);
 if(expected){pass++;formula.add(key);atoms.forEach(a=>elements.add(a.Z));r.motifs.forEach(x=>motifs.add(x));if(r.topgroup)groups.add(r.topgroup);}
}
for(const m of original.molecules){const r=rows.find(r=>r.id===m.id);assert.ok(r);assert.deepEqual(r.geometry.atomsAngstrom,m.ang);assert.equal(r.charge,m.charge);assert.equal(r.nAO_STO3G,m.nAO);assert.equal(r.appPredictedMs,m.predictedMs);}
assert.equal(bytes,census.totals.predictedStoBytes);assert.equal(pass,census.totals.gatePass);
assert.equal(Object.values(census.sections).reduce((n,s)=>n+s.rows,0),rows.length);
const field=read('research/release-0.4.0/library-census/c60-field-check.json');assert.ok(field.pass);
const f=read('research/release-0.4.0/library-census/c60-frontier.json');assert.equal(f.status,'DRAFT');assert.ok(f.waterProof.pass);assert.ok(f.validation.fullGroupLabelsVerified);assert.equal(f.solver.orbitalEnergiesEh.length,300);assert.equal(f.solver.occupations.reduce((x,y)=>x+y,0),360);
const result={status:'MEASURED',pass:true,checks:['all original geometries/charges preserved','both vendored AO-count checks where available','charge-adjusted occupied counts','record-byte arithmetic','independent literal diversity gate replay','family cardinalities','finite final energies/gaps/times','conditional basis nulls','section/byte totals','water coefficient proof','full Ih character proof','C60 signed-field proof'],numericStatus:'All counts DERIVED from the audited inputs',rows:rows.length,originalRows:original.molecules.length,pinnedBasisCountChecks:basisChecks,gatePass:pass,gateFail:rows.length-pass,predictedStoBytes:bytes};
writeFileSync(new URL('audit.json',out),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
