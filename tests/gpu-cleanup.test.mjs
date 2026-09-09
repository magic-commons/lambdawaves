import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../lab/field.js',import.meta.url),'utf8');
for(const name of ['sampleVoxel','fieldDigest','readStats']) {
 const start=source.indexOf('  async function '+name+'('),end=source.indexOf('\n  }',start)+4;
 const code=source.slice(start,end);
 for(const failure of ['submit','map']) {
  let destroyed=0;
  const error=new Error(failure+' failed');
  const device={createBuffer:()=>({mapAsync:async()=>{throw error},destroy:()=>destroyed++}),
   createCommandEncoder:()=>({copyTextureToBuffer(){},copyBufferToBuffer(){},finish(){}}),
   queue:{submit(){if(failure==='submit')throw error}}};
  const run=new Function('device','GPUBufferUsage','GPUMapMode','psiTex','statsBuf','res',code+';return '+name)(device,{COPY_DST:1,MAP_READ:2},{READ:1},{},{},64);
  await assert.rejects(run(0,0,0),e=>e===error);
  assert.equal(destroyed,1,name+' must destroy readback buffer after '+failure);
 }
}
console.log('PASS GPU readback cleanup: submit/map failures release buffers and preserve errors');
