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

for (const name of ['readPixels', 'linePixels', 'throughput']) {
 const start = source.indexOf('  async function ' + name + '('), end = source.indexOf('\n  }', start) + 4;
 const code = source.slice(start, end);
 for (const failure of ['pipeline', 'encoder', 'buffer', 'submit', 'map', 'completion']) {
  if (name === 'throughput' ? ['buffer', 'map'].includes(failure) : failure === 'completion') continue;
  let textures = 0, buffers = 0, allocated = 0;
  const error = new Error(failure + ' failed');
  const fail = stage => { if (stage === failure) throw error; };
  const pass = { setPipeline(){}, setBindGroup(){}, draw(){}, end(){} };
  const device = {
   createTexture: () => ({ createView: () => ({}), destroy: () => textures++ }),
   createBuffer: () => { fail('buffer'); allocated++; return {
    mapAsync: async () => fail('map'), destroy: () => buffers++
   }; },
   createCommandEncoder: () => { fail('encoder'); return {
    beginRenderPass: () => pass, copyTextureToBuffer(){}, finish(){}
   }; },
   queue: { submit: () => fail('submit'), onSubmittedWorkDone: async () => fail('completion') }
  };
  const run = new Function('device', 'GPUTextureUsage', 'GPUBufferUsage', 'GPUMapMode', 'out',
   'makeRenderPipeline', 'makeLinePipeline', 'writeView', 'writeLines', 'drawChrome', 'renderBind',
   'DEFAULT_BG', 'canvas', 'encodeCompute', code + ';return ' + name)(device,
   { RENDER_ATTACHMENT: 1, COPY_SRC: 2 }, { COPY_DST: 1, MAP_READ: 2 }, { READ: 1 }, {},
   () => fail('pipeline'), () => ({}), () => {}, () => {}, () => {}, {}, [0,0,0],
   { width: 2, height: 2 }, () => {});
  await assert.rejects(name === 'throughput' ? run({ modes: [], obs: {}, mat: {}, n: 1 }) : run({}, {}, 2, 2), e => e === error);
  assert.equal(textures, 1, name + ' releases texture after ' + failure);
  assert.equal(buffers, allocated, name + ' releases allocated buffers after ' + failure);
 }
}
console.log('PASS GPU diagnostic cleanup: pipeline/encoder/allocation/submit/map/completion failures release temporary resources');
