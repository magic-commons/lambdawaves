#!/usr/bin/env node
// Read-only imports; exclusive creation of diagnostic outputs. No browser or server.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {MOLECULES, COST, CAP_MS, moleculeAtoms} from '../../lab/molecules.js';
import {moleculeRHF,registerRecord} from '../../lab/rhf-molecule.js';
import {basisFrom,rdOf,ANGSTROM} from '../../lab/md.js';
const root=new URL('../../',import.meta.url);
const out=new URL('tools/library/census/',root);
mkdirSync(out,{recursive:true});
const rec=JSON.parse(readFileSync(new URL('lab/vendor/bse/sto-3g-v1.json',root)));
registerRecord('sto-3g',rec);
const write=(name,data)=>writeFileSync(new URL(name,out),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
if(process.argv.includes('--inventory')){
  write('present-input.json',{status:'MEASURED',note:'Read directly from the present lab/molecules.js module',COST,CAP_MS,ANGSTROM,molecules:MOLECULES});
  const t=performance.now(),s=moleculeRHF({atoms:moleculeAtoms('H2O')});
  write('water-app.json',{status:'MEASURED',method:'moleculeRHF defaults including SAD/core detection, stability and Hessians',wallMs:performance.now()-t,energy:s.energy,converged:s.converged,orbitalEnergies:[...s.orbitalEnergies],C:[...s.C],S:[...s.integrals.S],order:s.basis.order,rd:[...rdOf(s.basis)],atomsBohr:moleculeAtoms('H2O'),basisHash:s.hash});
} else {
  const data=process.argv.includes('--rows') ? {rows:['alanine','Li4F4','TiCl4'].map(id=>JSON.parse(readFileSync(new URL(`rows/${id}.json`,out))))} : JSON.parse(readFileSync(new URL('census.json',out)));
  for(const id of ['alanine','Li4F4','TiCl4']){
    const m=data.rows.find(r=>r.id===id), atoms=m.geometry.atomsAngstrom.map(([Z,x,y,z])=>({Z,x:x*ANGSTROM,y:y*ANGSTROM,z:z*ANGSTROM}));
    const b=basisFrom(atoms,rec);if(b.n>64)throw Error(`${id} exceeds the requested AO ceiling`);
    const t=performance.now(),s=moleculeRHF({atoms,charge:m.charge});
    const r={id,status:'MEASURED',numericStatus:{nAO:'DERIVED from pinned basis shell/component inventory',gapEh:'DERIVED from MEASURED native orbital energies',predictedRecordBytes:'DERIVED from square float64 coefficient matrix, energy/occupation vectors and the checkpoint metadata allowance'},wallMs:performance.now()-t,nAO:b.n,converged:s.converged,energyEh:s.energy,gapEh:s.orbitalEnergies[s.nocc]-s.orbitalEnergies[s.nocc-1],iterations:s.iterations,timings:s.timings,stability:s.stability,method:'moleculeRHF defaults; no RPA spectrum call',predictedRecordBytes:m.predictedRecordBytes};
    write(`app-${id}.json`,r);console.log(JSON.stringify(r));
  }
}
