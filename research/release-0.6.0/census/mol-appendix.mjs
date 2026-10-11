import * as M from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/molecules.js';
import fs from 'fs';
const lib=JSON.parse(fs.readFileSync('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/library.json','utf8'));
const rec=new Map(lib.rows.map(r=>[r.id,r]));
const tile=(n)=>n<=16?'16':n<=40?'40':n<=64?'64':n<=128?'128':'ORB-only';
const heavy=(m)=>{const f=[]; if(m.predictedMs>=1000)f.push('SLOW≥1 s'); if(m.nAO>=64)f.push('≥64 AO'); if(m.recordOnly)f.push('record-only'); if(m.disabled&&!m.recordOnly)f.push('DISABLED'); if(m.nAO>128)f.push('>128 AO (orbital road only)'); return f.join(' · ')};
let out='';
out+='## APPENDIX A · the molecule catalogue (MEASURED by `mol-census.mjs` / `mol-appendix.mjs` importing `lab/molecules.js` and parsing `lab/library.json`)\n\n';
out+=`Offered entries: **${M.MOLECULES.length+M.RECORD_ONLY.length}** = ${M.MOLECULES.length} live (RAW; ${M.SOLVABLE.length} solvable, CuH and ZnH2 disabled "not a minimum") + ${M.RECORD_ONLY.length} record-only. Library records: **${lib.rows.length}** (all \`sto-3g\`). All entries are closed-shell (no odd electron count: MEASURED). Elements present: Z = 1,3,4,5,6,7,8,9,11–17,19,22,24,26,28–30,32–36. 6-31+G* is offered for ${[...M.MOLECULES,...M.RECORD_ONLY].filter(m=>M.basis631(m.id).ok).length} entries (\`molecules.js:514\`, H C N O F, ≤ 46 AO).\n\n`;
out+='### A1 · the 54 live-solvable entries (group · AO · occ · charge · predicted solve · tile · 6-31+G* AO · in library · heavy flags)\n\n| id | group | AO | occ | q | ~solve | tile | 6-31+G* | record | heavy |\n|---|---|---|---|---|---|---|---|---|---|\n';
for(const m of M.MOLECULES){const b=M.basis631(m.id);out+=`| ${m.id} | ${m.group} | ${m.nAO} | ${m.nocc} | ${m.charge||0} | ${M.showMs(m.predictedMs)} | ${tile(m.nAO)} | ${b.ok?b.nAO:'—'} | ${rec.has(m.id)?'yes':''} | ${heavy(m)} |\n`;}
out+='\n### A2 · the 38 library records (section · AO · occ · caps O=orbitals S=states R=RPA T=TDHF · bytes · tile)\n\n| id | section | AO | occ | caps | bytes | tile | heavy |\n|---|---|---|---|---|---|---|---|\n';
for(const r of lib.rows){const c=r.caps; const caps=(c.orbitals?'O':'')+(c.states?'S':'')+(c.rpa?'R':'')+(c.tdhf?'T':''); const mm=M.MOLECULE_BY_ID.get(r.id); out+=`| ${r.id} | ${r.section} | ${r.nAO} | ${r.nocc} | ${caps} | ${r.bytes.toLocaleString('en-US')} | ${tile(r.nAO)} | ${[r.nAO>=64?'≥64 AO':'', r.nAO>128?'ORBITAL ROAD ONLY (C60)':'', r.bytes>600000?'>600 kB':'', mm&&mm.recordOnly?'record-only':''].filter(Boolean).join(' · ')} |\n`;}
const by={}; for(const r of lib.rows){by[r.section]=(by[r.section]||0)+1}
out+=`\nRecords by section: ${JSON.stringify(by)}; density-tile split (MEASURED): ≤40 AO ${lib.rows.filter(r=>r.nAO<=40).length}, 41–64 ${lib.rows.filter(r=>r.nAO>40&&r.nAO<=64).length}, 65–128 ${lib.rows.filter(r=>r.nAO>64&&r.nAO<=128).length}, >128 ${lib.rows.filter(r=>r.nAO>128).length}; total record bytes ${lib.rows.reduce((s,r)=>s+r.bytes,0).toLocaleString('en-US')}.\n`;
fs.writeFileSync('/home/joshua-hosain/.config/claude-backup/jobs/8497d75b/tmp/plan-census/_appendix.md', out);
console.log(out.slice(0,900));
