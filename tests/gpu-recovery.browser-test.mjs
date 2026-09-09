// Requires an owned HTTPS server (tools/gate/server.py) and unused GD_PORT.
// Unlike current.browser-test, this requires a real, working GPU renderer.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import * as driver from '../tools/gate/drv.js';
const url=`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/?preset=1s%2B2pz`;
const g=await open(url,{width:1200,height:850,script:20000});
let failed=false;
try {
 await driver.setTO(g.s,{script:20000,pageLoad:20000});
 for(let cycle=0;cycle<4;cycle++) {
  if(cycle) await driver.go(g.s,url);
  assert.equal((await g.waitFor('window.__LW&&__LW.ready',150,100)).ok,1,'boot readiness');
  const status=await g.ev(`__LW.setTheme('dark');__LW.setView('density');await __LW.settle();return {ok:__LW.field.ok,error:__LW.field.error,uncaptured:__LW.field.lastGpuError||null,errors:__e,frames:__LW.stats.frames}`);
  assert.equal(status.ok,true,JSON.stringify(status));
  assert.equal(status.error,null);assert.equal(status.uncaptured,null);assert.deepEqual(status.errors,[]);
  const pixels=await g.ev('return await __LW.readPixels()');
  assert.ok(pixels.nonBlack>100 && pixels.nonBlack<pixels.total,JSON.stringify(pixels));
  const digest=await g.ev('return await __LW.fieldDigest()');
  assert.equal(digest.nan,0);assert.ok(digest.integral>.9 && digest.integral<1.1,JSON.stringify(digest));
  console.log('PASS GPU boot/reload',cycle,JSON.stringify({frames:status.frames,lit:pixels.nonBlack,res:digest.res,integral:digest.integral}));
  if(cycle===0) {
   for(const res of [64,96,128,64]) {
    const result=await g.ev(`__LW.quality.res=${res};__LW.schedule(4);await __LW.settle();const d=await __LW.fieldDigest();return {res:d.res,nan:d.nan,error:__LW.field.lastGpuError||__LW.field.error||null}`);
    assert.deepEqual(result,{res,nan:0,error:null});
    console.log('PASS GPU grid',res);
   }
  }
  // Reproduce navigation from a dirty project, without bypassing beforeunload.
  await g.ev("__LW.layout.notebook.text='reload test';return true");
 }
} catch(error) {failed=true;console.error(error);}
finally {
 try {await Promise.race([g.close(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('driver cleanup timed out')),10000))]);}
 catch(error){failed=true;console.error('INFRASTRUCTURE:',error.message);}
 process.exit(failed?1:0);
}
