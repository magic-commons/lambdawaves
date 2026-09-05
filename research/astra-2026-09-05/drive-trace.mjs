// Reproduce the plot data from the actual browser-compatible solver, no screenshot of a surrogate.
import { writeFileSync, readFileSync } from 'node:fs';
import { createMO } from '../../lab/mo.js';
import { createMODrive, sin2Pulse } from '../../lab/modrive.js';
const ref = JSON.parse(readFileSync(new URL('./reference-drive.json',import.meta.url)));
const mo = createMO({kind:'lcao1s'}), drive = createMODrive(mo,{R:ref.R,field:sin2Pulse(ref.pulse)});
const rows=[], slices=[], dt=.05;
for(let k=0;k<=1920;k++) {
  if(k%4===0) { const o=drive.observables();rows.push({t:o.t,field:o.field,popU:o.populations[1],dipole:o.totalDipole,norm:o.norm}); }
  if(k%240===0) {const snap=drive.snapshot();slices.push({t:drive.t,values:Array.from({length:321},(_,i)=>{const z=-4+i/40;return [z,snap.deltaDensity(0,0,z)];})});}
  if(k<1920) drive.step(dt);
}
writeFileSync(new URL('./drive-trace.json',import.meta.url),JSON.stringify({model:drive.model,R:ref.R,dt,pulse:ref.pulse,rows,slices},null,2)+'\n');
