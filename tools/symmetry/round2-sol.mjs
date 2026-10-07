#!/usr/bin/env node
// Round 2 arithmetic and CPU experiments. All lab imports are read-only.
// node tools/symmetry/round2-sol.mjs --out research/release-0.4.0/measure/round2-sol.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { MOLECULES, CAP_MS, RING_RESIDUALS, moleculeAtoms, counts, eriWork, rpaWork, predictMs } from '../../lab/molecules.js';
import { moleculeRHF } from '../../lab/rhf-molecule.js';
import { eigSym } from '../../lab/h2ci.js';
import { hessianBlocks } from '../../lab/rpa-inspector.js';
const root = new URL('../../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');
const output = process.argv[process.argv.indexOf('--out') + 1];
const useRaw=process.argv.includes('--raw');
assert(output && output.endsWith('.json') && output.startsWith('research/release-0.4.0/measure/'));
const out = { node: process.version, date: '2026-10-07', ledgerPrefixBytes: Buffer.byteLength(read('research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md')),
  ledgerPrefixSha256: createHash('sha256').update(read('research/MATH-CYCLOTOMIC-SCALING-2026-10-07.md')).digest('hex') };
const permutations = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const cube = permutations.flatMap(p => Array.from({length:8}, (_, k) => ({p, s:[0,1,2].map(i => k & (1<<i) ? -1 : 1)})));
const apply = (R, v) => R.p.map((j,i) => R.s[i]*v[j]);
function match(m, R, c) {
  const used = new Set(); let residual = 0;
  for (const a of m.ang) {
    const v = apply(R,a.slice(1).map((x,i)=>x-c[i])).map((x,i)=>x+c[i]);
    let best = Infinity, hit = -1;
    m.ang.forEach((b,j)=>{if(a[0]===b[0]){const d=Math.hypot(...v.map((x,i)=>x-b[i+1]));if(d<best){best=d;hit=j;}}});
    residual=Math.max(residual,best);used.add(hit);
  }
  return used.size===m.ang.length && residual<1e-8;
}
const centre = m => { const z=m.ang.reduce((s,a)=>s+a[0],0);return [1,2,3].map(i=>m.ang.reduce((s,a)=>s+a[0]*a[i],0)/z); };
const census = MOLECULES.map(m => ({id:m.id, nAO:m.nAO, predictedMs:m.predictedMs, disabled:m.disabled,
  originOrder:cube.filter(R=>match(m,R,[0,0,0])).length, centredOrder:cube.filter(R=>match(m,R,centre(m))).length}));
function share(rows, field) {const total=rows.reduce((s,m)=>s+m.predictedMs,0),sym=rows.filter(m=>m[field]>=4).reduce((s,m)=>s+m.predictedMs,0);return {records:rows.length,totalMs:total,symmetricMs:sym,fraction:sym/total};}
out.census={capMs:CAP_MS, rows:census, allCentred:share(census,'centredOrder'),liveCentred:share(census.filter(m=>!m.disabled),'centredOrder'),
  allOrigin:share(census,'originOrder'),liveOrigin:share(census.filter(m=>!m.disabled),'originOrder'),ringResidualsAngstrom:RING_RESIDUALS};
// A geometry-free formula census of the named additions is a prediction, never a geometry certification.
const planned = [
 ['alanine','C3H7NO2'],['arginine','C6H14N4O2'],['asparagine','C4H8N2O3'],['aspartic acid','C4H7NO4'],
 ['cysteine','C3H7NO2S'],['glutamine','C5H10N2O3'],['glutamic acid','C5H9NO4'],['glycine','C2H5NO2'],
 ['histidine','C6H9N3O2'],['isoleucine','C6H13NO2'],['leucine','C6H13NO2'],['lysine','C6H14N2O2'],
 ['methionine','C5H11NO2S'],['phenylalanine','C9H11NO2'],['proline','C5H9NO2'],['serine','C3H7NO3'],
 ['threonine','C4H9NO3'],['tryptophan','C11H12N2O2'],['tyrosine','C9H11NO3'],['valine','C5H11NO2'],
 ['adenine','C5H5N5'],['cytosine','C4H5N3O'],['guanine','C5H5N5O'],['thymine','C5H6N2O2'],['uracil','C4H4N2O2'],
 ['Gly-Gly','C4H8N2O3'],['N-methylacetamide','C3H7NO'],['imidazole','C3H4N2'],['indole','C8H7N'],
 ['phosphoric acid','H3PO4'],['ribose','C5H10O5'],['Li4H4','Li4H4'],['Li4F4','Li4F4'],['Mg4O4','Mg4O4'],
 ['Na2Cl2','Na2Cl2'],['ice hexamer','H12O6'],['ice cube','H16O8'],['cubane','C8H8'],['neopentane','C5H12'],
 ['naphthalene','C10H8'],['Si5H12','Si5H12'],['Na4Cl4','Na4Cl4'],['KrF2','KrF2'],['SeO2','SeO2'],
 ['KBr','KBr'],['GeCl4','GeCl4'],['TiCl4','TiCl4'] ];
const Zs={H:1,Li:3,C:6,N:7,O:8,F:9,Na:11,Mg:12,Si:14,P:15,S:16,Cl:17,K:19,Ti:22,Ge:32,Se:34,Br:35,Kr:36};
out.plannedFormulaPredictions=planned.map(([name,formula])=>{const ang=[];for(const x of formula.matchAll(/([A-Z][a-z]?)(\d*)/g))for(let i=0;i<+(x[2]||1);i++)ang.push([Zs[x[1]],0,0,0]);
  const c=counts(ang),ms=Math.round(predictMs(eriWork(c.widths),rpaWork(c.nAO,c.nElec/2)));return {name,formula,nAO:c.nAO,predictedMs:ms,overCap:ms>CAP_MS*1.02};});
const ps=out.plannedFormulaPredictions;
const certifiedHigh=new Set(['phosphoric acid','Li4H4','Li4F4','Mg4O4','Na2Cl2','cubane','neopentane','naphthalene','Si5H12','Na4Cl4','KrF2','SeO2','KBr','GeCl4','TiCl4']);
const low=new Set(ps.filter(m=>!certifiedHigh.has(m.name)&&!['glycine','ribose','ice hexamer','ice cube'].includes(m.name)).map(m=>m.name));
const total=ps.reduce((s,m)=>s+m.predictedMs,0);
out.plannedConditionalBounds={records:ps.length,totalMs:total,highMs:ps.filter(m=>certifiedHigh.has(m.name)).reduce((s,m)=>s+m.predictedMs,0),
  uncertainMs:ps.filter(m=>!certifiedHigh.has(m.name)&&!low.has(m.name)).reduce((s,m)=>s+m.predictedMs,0),
  assumptions:'conditional formula roster, ideal high-symmetry lattice conformers aligned to cube axes, ordinary low-symmetry BIO conformers; phosphate/ribose/ices uncertain; geometry and optional d-block/I/Xe roster absent'};
// C3v phosphoric acid does NOT guarantee order >=4; move it to uncertainty.
out.plannedConditionalBounds.highMs-=ps.find(m=>m.name==='phosphoric acid').predictedMs;
out.plannedConditionalBounds.uncertainMs+=ps.find(m=>m.name==='phosphoric acid').predictedMs;
out.plannedConditionalBounds.lower=out.plannedConditionalBounds.highMs/total;
out.plannedConditionalBounds.upper=(out.plannedConditionalBounds.highMs+out.plannedConditionalBounds.uncertainMs)/total;
function grid(ops,N=96){const seen=new Uint8Array(N**3),hist={};let orbits=0,boundary=0;const off=(N-1)/2;
  for(let idx=0;idx<N**3;idx++){if(seen[idx])continue;const q=[Math.floor(idx/N**2)-off,Math.floor(idx/N)%N-off,idx%N-off],imgs=new Set();
    for(const R of ops){const v=apply(R,q).map(x=>x+off);imgs.add((v[0]*N+v[1])*N+v[2]);}
    for(const j of imgs)seen[j]=1;orbits++;hist[imgs.size]=(hist[imgs.size]||0)+1;if(imgs.size<ops.length)boundary+=imgs.size;
  }return {order:ops.length,voxels:N**3,orbits,fraction:orbits/N**3,boundaryVoxels:boundary,orbitSizes:hist};}
out.grids={};for(const id of ['H2O','NH3','CH4','BH3','C2H4','C2H6','C4H6','H2O2','CH3OH','C6H6','N2','BeH2','CO']){
  const m=MOLECULES.find(m=>m.id===id);out.grids[id]=grid(cube.filter(R=>match(m,R,[0,0,0])));}
out.grids.Oh=grid(cube);
// Exact Burnside / symmetric-square counts using BigInt, independently of the quartet tool.
const sym22=(x,y,z)=>{const a=(x*x+y)/2n,b=(y*y+z)/2n;return(a*a+b)/2n;};
const classes=[['E',1,1,false],['C2',15,2,false],['C3',20,3,false],['C5',12,5,false],['C5^2',12,5,false],
 ['i',1,1,true],['iC2',15,2,true],['iC3',20,3,true],['iC5',12,5,true],['iC5^2',12,5,true]];
function ihCount(dim,mirror){let sum=0n;const rows=classes.map(([name,size,order,inv])=>{const power=k=>{if(k%order===0&&(!inv||k%2===0))return BigInt(dim);if(inv&&k%2===1&&order===2)return BigInt(mirror);return 0n;};const a=[1,2,4].map(power),fixed=sym22(...a);sum+=BigInt(size)*fixed;return {name,size,chiPowers:a.map(String),sym22:String(fixed)};});assert.equal(sum%120n,0n);return {rows,count:String(sum/120n)};}
out.c60={shell:ihCount(180,12),ao:ihCount(300,12),canonicalShellQuartets:String(sym22(180n,180n,180n)),
 canonicalAoQuartets:String(sym22(300n,300n,300n)),denseBytes:300**4*8,s8Bytes:Number(sym22(300n,300n,300n))*8,
 reducedIhBytes:Number(ihCount(300,12).count)*8,d2hFullAllowed:((300**4+3*12**4)/8)*8};
const nG=[9,6,2,1,1,2,6,9],oG=[6,3,1,1,0,1,4,5],vG=nG.map((v,i)=>v-oG[i]);
const masks=[0,6,5,3,7,1,2,4],prod=(a,b)=>masks.indexOf(masks[a]^masks[b]);
function mac(axis,dims,target){let acc=0;for(let a=0;a<8;a++)for(let b=0;b<8;b++)for(let c=0;c<8;c++)for(let d=0;d<8;d++){
 if((masks[a]^masks[b]^masks[c]^masks[d])!==0)continue;const gs=[a,b,c,d];let p=target[gs[axis]];for(let k=0;k<4;k++)p*=dims[k][gs[k]];acc+=p;}return acc;}
const denseSteps=[36*21*36**3,21*36*15*36**2,21*15*36*21*36,21*15*21*36*15,21*36*21*36**2,21*21*36*15*36,21*21*15*36*15];
const blockedSteps=[mac(0,[nG,nG,nG,nG],oG),mac(1,[oG,nG,nG,nG],vG),mac(2,[oG,vG,nG,nG],oG),mac(3,[oG,vG,oG,nG],vG),mac(1,[oG,nG,nG,nG],oG),mac(2,[oG,oG,nG,nG],vG),mac(3,[oG,oG,vG,nG],vG)];
const mG=nG.map((_,a)=>oG.reduce((s,v,b)=>s+v*vG[prod(a,b)],0)),sum=a=>a.reduce((s,v)=>s+v,0);
out.rpaArithmetic={nG,oG,vG,mG,denseSteps,blockedSteps,denseMacs:sum(denseSteps),blockedMacs:sum(blockedSteps),
 transformRatio:sum(blockedSteps)/sum(denseSteps),denseAssembly:315**2,blockedAssembly:sum(mG.map(v=>v*v)),
 saoDenseMacs:4*36**5,reuseCountArithmetic:4*36**5/(sum(denseSteps)-sum(blockedSteps)),
 saoBlockDiagonalMacs:4*sum(nG.map(v=>v*v))*36**3,
 fockInvariantMacs:sum(nG.map(v=>v*v))**2};
// Expose telemetry in an in-memory copy; no lab file is written. Fail if any source anchor drifts.
let source=read('lab/md.js');
function inject(a,b){assert.equal(source.split(a).length,2,`unique anchor: ${a}`);source=source.replace(a,b);}
inject('function twoElectron(basis) {','export const telemetry = {};\nfunction twoElectron(basis) {\nObject.assign(telemetry,{main:false,primitiveTrips:0,primitiveSkipped:0,quartets:0,schwarzSkipped:0});');
inject('pairs = pairs.filter((P) => P.np > 0);','pairs = pairs.filter((P) => P.np > 0); telemetry.pairs = pairs.map(P=>({a:P.ai[0],b:P.bi[0],np:P.np,nc:P.nc}));');
inject('for (let a = 0; a < NP; a++) {','telemetry.main=true; for (let a = 0; a < NP; a++) {');
inject('if (qa * QN[b] < TAU_SCHWARZ) continue;','telemetry.quartets++; if (qa * QN[b] < TAU_SCHWARZ) {telemetry.schwarzSkipped++; continue;}');
inject('if (thr >= 0 && sk * Q.s[m] < thr) continue;','if(telemetry.main)telemetry.primitiveTrips++; if (thr >= 0 && sk * Q.s[m] < thr) {if(telemetry.main)telemetry.primitiveSkipped++; continue;}');
const mdProbe=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const record=JSON.parse(read('lab/vendor/bse/sto-3g-v1.json')),atoms=moleculeAtoms('C6H6');
const sol=moleculeRHF({atoms,record}),n=36;
const probeI=mdProbe.integrals(sol.basis);
const diff=(a,b)=>Math.max(...a.map((x,i)=>Math.abs(x-b[i])));
let eriDiff=0;for(let i=0;i<probeI.eri.length;i++)eriDiff=Math.max(eriDiff,Math.abs(probeI.eri[i]-sol.integrals.eri[i]));assert.equal(eriDiff,0);
out.liveLoop={...mdProbe.telemetry,main:undefined,eriDifference:eriDiff};
const sh=sol.basis.shells,aoToShell=new Map(sh.flatMap((s,i)=>s.bfs.map(b=>[b.idx,i]))),pairs=out.liveLoop.pairs;
const pairKey=(a,b)=>a<b?`${a},${b}`:`${b},${a}`,pairLookup=new Map(pairs.map((p,i)=>[pairKey(aoToShell.get(p.a),aoToShell.get(p.b)),i]));
const shellOfAtom=atoms.map((_,a)=>sh.map((s,i)=>[s,i]).filter(([s])=>s.atom===a).map(([,i])=>i));
const signR=Array.from({length:8},(_,k)=>({p:[0,1,2],s:[0,1,2].map(i=>k&(1<<i)?-1:1)}));
const hexR=[];for(let mirror=0;mirror<2;mirror++)for(let z=0;z<2;z++)for(let k=0;k<6;k++){const c=Math.cos(k*Math.PI/3),s=Math.sin(k*Math.PI/3);hexR.push(v=>[c*v[0]-s*(mirror?-v[1]:v[1]),s*v[0]+c*(mirror?-v[1]:v[1]),(z?-1:1)*v[2]]);}
function activeOrbits(rotations){const atomPerms=rotations.map(rot=>atoms.map(a=>{const v=rot([a.x,a.y,a.z]);const hit=atoms.findIndex(b=>b.Z===a.Z&&Math.hypot(b.x-v[0],b.y-v[1],b.z-v[2])<1e-8);assert(hit>=0);return hit;}));
 const shellPerms=atomPerms.map(ap=>sh.map((s,i)=>shellOfAtom[ap[s.atom]][shellOfAtom[s.atom].indexOf(i)]));
 const pairPerms=shellPerms.map(sp=>pairs.map(p=>{const j=pairLookup.get(pairKey(sp[aoToShell.get(p.a)],sp[aoToShell.get(p.b)]));assert(j!==undefined,'active pairs must be symmetry closed');return j;}));
 const seen=new Set();let orbits=0,total=0,fullPrimitive=0,reducedPrimitive=0,fullComponents=0,reducedComponents=0;const hist={};
 const key=(a,b)=>a<b?a*pairs.length+b:b*pairs.length+a;
 for(let a=0;a<pairs.length;a++)for(let b=a;b<pairs.length;b++){total++;fullPrimitive+=pairs[a].np*pairs[b].np;fullComponents+=pairs[a].nc*pairs[b].nc*pairs[a].np*pairs[b].np;if(seen.has(key(a,b)))continue;
 const orbit=new Set(pairPerms.map(pp=>key(pp[a],pp[b])));for(const j of orbit)seen.add(j);orbits++;hist[orbit.size]=(hist[orbit.size]||0)+1;
 reducedPrimitive+=pairs[a].np*pairs[b].np;reducedComponents+=pairs[a].nc*pairs[b].nc*pairs[a].np*pairs[b].np;}
 return {total,orbits,fraction:orbits/total,fullPrimitive,reducedPrimitive,primitiveFraction:reducedPrimitive/fullPrimitive,fullComponents,reducedComponents,componentFraction:reducedComponents/fullComponents,orbitSizes:hist};}
out.liveLoop.d2h=activeOrbits(signR.map(R=>v=>apply(R,v)));out.liveLoop.d6h=activeOrbits(hexR);
console.error('census, grids, C60, MACs, and live ERI telemetry complete');
// Build independent D2h SAOs from signed AO permutation projectors and block Löwdin.
const ops=Array.from({length:8},(_,k)=>({p:[0,1,2],s:[0,1,2].map(i=>k&(1<<i)?-1:1)}));
const bf=sol.basis.bfs,S=sol.integrals.S;
const reps=ops.map(R=>bf.map(b=>{const point=apply(R,b.c),atom=atoms.findIndex(a=>a.Z===b.Z&&Math.hypot(a.x-point[0],a.y-point[1],a.z-point[2])<1e-8);
 const j=bf.findIndex(q=>q.atom===atom&&q.shell===b.shell&&q.l.every((v,i)=>v===b.l[i])&&q.exps[0]===b.exps[0]);assert(j>=0);return [j,b.l.reduce((s,l,i)=>s*R.s[i]**l,1)];}));
 let cols=[],aoGrades=[];
for(let grade=0;grade<8;grade++){
 const basis=[];for(let j=0;j<n;j++){let v=new Float64Array(n);reps.forEach((rep,k)=>{const [i,s]=rep[j];const ch=(-1)**(((grade&k).toString(2).match(/1/g)||[]).length);v[i]+=s*ch/8;});
  for(const q of basis){const dot=sum(Array.from(v,(x,i)=>x*q[i]));for(let i=0;i<n;i++)v[i]-=dot*q[i];}const norm=Math.hypot(...v);if(norm>1e-8)basis.push(v.map(x=>x/norm));}
 const d=basis.length;if(!d)continue;if(useRaw){cols.push(...basis);aoGrades.push(...basis.map(()=>grade));continue;}const sb=new Float64Array(d*d);for(let a=0;a<d;a++)for(let b=0;b<d;b++)for(let i=0;i<n;i++)for(let j=0;j<n;j++)sb[a*d+b]+=basis[a][i]*S[i*n+j]*basis[b][j];
 const e=eigSym(sb,d);for(let a=0;a<d;a++){let v=new Float64Array(n);for(let b=0;b<d;b++)for(let c=0;c<d;c++){const x=e.vectors[b*d+c]*e.vectors[a*d+c]/Math.sqrt(e.values[c]);for(let i=0;i<n;i++)v[i]+=basis[b][i]*x;}cols.push(v);aoGrades.push(grade);}
}
assert.equal(cols.length,n);
const U=Float64Array.from({length:n*n},(_,i)=>cols[i%n][Math.floor(i/n)]);
const Cp=new Float64Array(n*n);for(let p=0;p<n;p++)for(let j=0;j<n;j++)for(let i=0;i<n;i++){if(useRaw)Cp[p*n+j]+=U[i*n+p]*sol.C[i*n+j];else for(let k=0;k<n;k++)Cp[p*n+j]+=U[i*n+p]*S[i*n+k]*sol.C[k*n+j];}
const moGrades=Array.from({length:n},(_,j)=>{let best=0;for(let p=1;p<n;p++)if(Math.abs(Cp[p*n+j])>Math.abs(Cp[best*n+j]))best=p;return aoGrades[best];});
let leakage=0;for(let p=0;p<n;p++)for(let j=0;j<n;j++)if(aoGrades[p]!==moGrades[j]){leakage=Math.max(leakage,Math.abs(Cp[p*n+j]));Cp[p*n+j]=0;}
function denseAxis(input,shape,axis,C,targets){const dims=shape.slice();dims[axis]=targets.length;const output=new Float64Array(dims.reduce((s,x)=>s*x,1));
 const stride=shape.slice(axis+1).reduce((s,x)=>s*x,1),outer=shape.slice(0,axis).reduce((s,x)=>s*x,1),inner=shape[axis];
 for(let a=0;a<outer;a++)for(let p=0;p<targets.length;p++)for(let k=0;k<inner;k++){const c=C[k*n+targets[p]];if(c===0)continue;
  const src=(a*inner+k)*stride,dst=(a*targets.length+p)*stride;for(let b=0;b<stride;b++)output[dst+b]+=c*input[src+b];}return [output,dims];}
let t=performance.now(),g=sol.integrals.eri,shape=[n,n,n,n];for(let axis=0;axis<4;axis++)[g,shape]=denseAxis(g,shape,axis,U,[...Array(n).keys()]);const saoMs=performance.now()-t;
let forbidden=0;for(let a=0;a<n;a++)for(let b=0;b<n;b++)for(let c=0;c<n;c++)for(let d=0;d<n;d++){const i=((a*n+b)*n+c)*n+d;if((aoGrades[a]^aoGrades[b]^aoGrades[c]^aoGrades[d])!==0){forbidden=Math.max(forbidden,Math.abs(g[i]));g[i]=0;}}
const occ=[...Array(21).keys()],vir=Array.from({length:15},(_,i)=>i+21);
const schedules=new Map();
function sparseAxis(input,domains,axis,targets){const key=axis+':'+domains.map(a=>a.join(',')).join(';')+':'+targets.join(',');
 if(schedules.has(key)){const p=schedules.get(key),output=new Float64Array(p.size);for(let row=0;row<p.dst.length;row++){const terms=p.terms[p.mos[row]],src=p.src[row];let value=0;for(let k=0;k<terms.length;k+=2)value+=Cp[terms[k+1]]*input[src+terms[k]];output[p.dst[row]]=value;}return [output,p.domains,p.macs];}
 const nd=domains.slice();nd[axis]=targets;const dims=nd.map(x=>x.length),indims=domains.map(x=>x.length),size=dims.reduce((s,x)=>s*x,1),output=new Float64Array(size);
 const istrides=indims.map((_,i)=>indims.slice(i+1).reduce((s,x)=>s*x,1)),others=[0,1,2,3].filter(x=>x!==axis),coord=[0,0,0,0];let macs=0;
 const graded=domains.map((dom,i)=>dom.map(x=>i===axis?aoGrades[x]:(i<axis?moGrades[x]:aoGrades[x])));
 // For branch transforms the already transformed domains are explicitly supplied below.
 const labels=domains.labels||graded;
 const inputByGrade=Array.from({length:8},()=>[]),targetByGrade=Array.from({length:8},()=>[]);
 domains[axis].forEach((v,i)=>inputByGrade[labels[axis][i]].push([i,v]));targets.forEach((v,i)=>targetByGrade[moGrades[v]].push([i,v]));
 const dstPlan=[],srcPlan=[],moPlan=[],terms=Array.from({length:n},()=>[]);
 for(const tgt of targetByGrade)for(const [,mo] of tgt)for(const [k,ao] of inputByGrade[moGrades[mo]])terms[mo].push(k*istrides[axis],ao*n+mo);
 for(let x=0;x<dims[others[0]];x++)for(let y=0;y<dims[others[1]];y++)for(let z=0;z<dims[others[2]];z++){
  coord[others[0]]=x;coord[others[1]]=y;coord[others[2]]=z;const grade=labels[others[0]][x]^labels[others[1]][y]^labels[others[2]][z];
  const src=others.reduce((s,i)=>s+coord[i]*istrides[i],0);
  for(const [p,mo] of targetByGrade[grade]){let value=0;for(const [k,ao] of inputByGrade[grade]){value+=Cp[ao*n+mo]*input[src+k*istrides[axis]];macs++;}coord[axis]=p;const dst=coord.reduce((s,v,i)=>s*dims[i]+v,0);output[dst]=value;dstPlan.push(dst);srcPlan.push(src);moPlan.push(mo);}
 }
 nd.labels=labels.slice();nd.labels[axis]=targets.map(x=>moGrades[x]);schedules.set(key,{dst:Int32Array.from(dstPlan),src:Int32Array.from(srcPlan),mos:Int32Array.from(moPlan),terms:terms.map(a=>Int32Array.from(a)),size,domains:nd,macs});return [output,nd,macs];}
function blocked(){let dom=Array.from({length:4},()=>[...Array(n).keys()]);dom.labels=dom.map(a=>a.map(x=>aoGrades[x]));let a1,d1,c1;[a1,d1,c1]=sparseAxis(g,dom,0,occ);
 const stages=[c1],build=targets=>{let data=a1,domains=d1;for(let a=1;a<4;a++){let c;[data,domains,c]=sparseAxis(data,domains,a,targets[a-1]);stages.push(c);}return data;};
 const G=build([vir,occ,vir]),Q=build([occ,vir,vir]),m=315,A=new Float64Array(m*m),B=new Float64Array(m*m);
 let assembly=0;for(let i=0;i<21;i++)for(let a=0;a<15;a++)for(let j=0;j<21;j++)for(let b=0;b<15;b++){
  if((moGrades[i]^moGrades[a+21]^moGrades[j]^moGrades[b+21])!==0)continue;assembly++;const row=i*15+a,col=j*15+b,coul=G[((i*15+a)*21+j)*15+b];
  A[row*m+col]=(row===col?sol.orbitalEnergies[a+21]-sol.orbitalEnergies[i]:0)+2*coul-Q[((i*21+j)*15+a)*15+b];B[row*m+col]=2*coul-G[((i*15+b)*21+j)*15+a];}
 return {A,B,stages,assembly};}
const base=hessianBlocks({eri:sol.integrals.eri,C:sol.C,eps:sol.orbitalEnergies,nocc:21,n});
const scheduleStart=performance.now(),check=blocked(),firstBlockedMs=performance.now()-scheduleStart;
assert.equal(sum(check.stages),out.rpaArithmetic.blockedMacs);assert.equal(check.assembly,out.rpaArithmetic.blockedAssembly);
const errorA=diff(base.A,check.A),errorB=diff(base.B,check.B);
const sameBasis=hessianBlocks({eri:g,C:Cp,eps:sol.orbitalEnergies,nocc:21,n});
const sameBasisErrorA=diff(sameBasis.A,check.A),sameBasisErrorB=diff(sameBasis.B,check.B);
assert(sameBasisErrorA<1e-11&&sameBasisErrorB<1e-11);assert(errorA<1e-8&&errorB<1e-8);
const time=f=>{const ts=[];for(let k=0;k<5;k++){const a=performance.now();f();ts.push(performance.now()-a);}return {samplesMs:ts,medianMs:ts.slice().sort((a,b)=>a-b)[2]};};
out.rpaMeasured={basis:useRaw?'raw Euclidean-orthogonal SALCs, nonorthogonal in S':'S-orthonormal SAOs',saoCoefficientsNonzero:U.filter(x=>x!==0).length,saoTransformMs:saoMs,firstBlockedMs,moOffBlockCoefficient:leakage,maxForbiddenEri:forbidden,errorA,errorB,sameBasisErrorA,sameBasisErrorB,
 baseline:time(()=>hessianBlocks({eri:sol.integrals.eri,C:sol.C,eps:sol.orbitalEnergies,nocc:21,n})),blocked:time(blocked),energy:sol.energy,integralsMs:sol.timings.integrals};
// Approximate ring C2 operation: axis through heteroatom and ring centroid; no geometry snapping.
out.approximateRings=[];
for(const id of ['C4H4O','C5H5N']){
 const at=moleculeAtoms(id),r=moleculeRHF({atoms:at,record}),nb=r.integrals.n,nr=id==='C4H4O'?5:6;
 const rc=[0,1,2].map(k=>sum(at.slice(0,nr).map(a=>[a.x,a.y,a.z][k]))/nr),u=[at[0].x-rc[0],at[0].y-rc[1],0],norm=Math.hypot(...u);for(let k=0;k<3;k++)u[k]/=norm;
 const R=Array.from({length:9},(_,k)=>2*u[Math.floor(k/3)]*u[k%3]-(Math.floor(k/3)===k%3?1:0));
 const mv=v=>[0,1,2].map(i=>sum(v.map((x,j)=>R[i*3+j]*x)));
 let geometryResidual=0;const perm=at.map(a=>{const q=mv([a.x-rc[0],a.y-rc[1],a.z-rc[2]]).map((x,k)=>x+rc[k]);let best=Infinity,hit=-1;at.forEach((b,j)=>{if(b.Z!==a.Z)return;const d=Math.hypot(b.x-q[0],b.y-q[1],b.z-q[2]);if(d<best){best=d;hit=j;}});geometryResidual=Math.max(geometryResidual,best);return hit;});
 const M=new Float64Array(nb*nb),shells=at.map((_,ia)=>r.basis.shells.filter(sh=>sh.atom===ia));
 shells.forEach((lst,ia)=>lst.forEach((sh,p)=>{const dst=shells[perm[ia]][p];if(sh.l===0)M[dst.bfs[0].idx*nb+sh.bfs[0].idx]=1;else for(let i=0;i<3;i++)for(let j=0;j<3;j++)M[dst.bfs[j].idx*nb+sh.bfs[i].idx]=R[j*3+i];}));
 function defect(A){const AM=new Float64Array(nb*nb),B=new Float64Array(nb*nb);for(let i=0;i<nb;i++)for(let k=0;k<nb;k++)if(A[i*nb+k]!==0)for(let j=0;j<nb;j++)AM[i*nb+j]+=A[i*nb+k]*M[k*nb+j];for(let i=0;i<nb;i++)for(let k=0;k<nb;k++)if(M[k*nb+i]!==0)for(let j=0;j<nb;j++)B[i*nb+j]+=M[k*nb+i]*AM[k*nb+j];return diff(A,B);}
 out.approximateRings.push({id,geometryResidualBohr:geometryResidual,geometryResidualAngstrom:geometryResidual*0.52917721092,overlapInvarianceDefect:defect(r.integrals.S),fockInvarianceDefect:defect(r.F),converged:r.converged});
}
writeFileSync(new URL(output,root),JSON.stringify(out,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({census:out.census.liveCentred,planned:out.plannedConditionalBounds,rpaArithmetic:out.rpaArithmetic,rpaMeasured:out.rpaMeasured,c60:out.c60,grids:out.grids,liveLoop:{...out.liveLoop,pairs:out.liveLoop.pairs.length}},null,2));
