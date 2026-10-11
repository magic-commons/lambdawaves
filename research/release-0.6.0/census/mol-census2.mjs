import * as M from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/molecules.js';
import fs from 'fs';
const lib=JSON.parse(fs.readFileSync('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/library.json','utf8'));
const rec=new Map(lib.rows.map(r=>[r.id,r]));
const B=M.BASIS_631; 
const b631=(m)=>{try{return !!M.basis631(m)}catch(e){return false}};
console.log('BASIS_631',JSON.stringify(B));
const rows=[];
for(const m of M.MOLECULES){
  let ok=false; try{ ok = B.elements && m.ang.every(a=>B.elements.includes(a[0]||a.Z||a.z)) } catch(e){}
  rows.push([m.id,m.group,m.section,m.nAO,m.nocc,m.charge,m.symmetry,m.disabled?'DISABLED':'',m.predictedMs,rec.has(m.id)?'REC':'',ok?'631?':''].join('\t'));
}
console.log(rows.join('\n'));
console.log('--- first ang');
console.log(JSON.stringify(M.MOLECULES[0].ang), JSON.stringify(M.MOLECULES[2].ang));
console.log('--- records');
console.log(lib.rows.map(r=>[r.id,r.section,r.nAO,r.nocc,r.caps,r.basis].join('\t')).join('\n'));
console.log(M.COST&&JSON.stringify(M.COST).slice(0,200), M.CAP_ID, M.CAP_MS);
console.log(M.counts&&JSON.stringify(M.counts()).slice(0,400));
