// Requires an owned HTTPS server (tools/gate/server.py) and unused GD_PORT.
// Unlike current.browser-test, this requires a real, working GPU renderer.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import * as driver from '../tools/gate/drv.mjs';
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
 // 0.5.0 C9 · R14 · THE THUMBNAIL PROBE: FOLDERS' road, the kit's toThumb() over __LW.thumbnail(), is a lit picture on both of its
 // roads — the canvas where capture's readability probe read it, and the GPU readback where it did not (the cached reading flipped).
 for(const unreadable of [false,true]) {
  const thumb=await g.ev(`const {toThumb}=await import('./mir/folders/folders.js'),p=await __LW.captureUI.capture.probe(),was=p.canvasReadable;
   if(${unreadable})p.canvasReadable=false;let src;try{src=await __LW.thumbnail();}finally{p.canvasReadable=was;}const url=await toThumb(src);
   const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
   const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let lit=0;for(let i=0;i<d.length;i+=4)if((d[i]+d[i+1]+d[i+2])/3>24)lit++;
   return {road:src instanceof HTMLCanvasElement?'canvas':src instanceof Blob?'readback':String(src),readable:was,w:c.width,h:c.height,lit,errors:__e}`);
  assert.equal(thumb.road,unreadable||!thumb.readable?'readback':'canvas',JSON.stringify(thumb));
  assert.ok(thumb.w>0&&thumb.w<=320&&thumb.lit>50,JSON.stringify(thumb));assert.deepEqual(thumb.errors,[]);
  console.log('PASS the thumbnail probe',JSON.stringify(thumb));
 }
 // 0.5.0 C9 · R14 · THE GPU RECOVERY (rack.js gpuRecovery): a lost device says so on the banner, the FIELD stands down, the page throws nothing.
 const lost=await g.ev(`__LW.field.device.destroy();for(let i=0;i<60&&__LW.field.ok;i++)await new Promise(r=>setTimeout(r,50));
  const v0=__LW.reg.version;__LW.loadPreset('2p+');await new Promise(r=>setTimeout(r,400));const b=document.getElementById('banner');   // timers, not frames: headless Firefox can hold rAF for seconds after a destroy
  return {ok:__LW.field.ok,error:__LW.field.error,banner:b.hidden?null:b.querySelector('h3').textContent,stateLive:__LW.reg.version!==v0,errors:__e}`);
 assert.equal(lost.ok,false);assert.match(String(lost.error),/^device lost/);assert.equal(lost.banner,'the GPU device was lost');assert.equal(lost.stateLive,true);assert.deepEqual(lost.errors,[],JSON.stringify(lost));
 console.log('PASS the GPU recovery',JSON.stringify(lost));
} catch(error) {failed=true;console.error(error);}
finally {
 try {await Promise.race([g.close(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('driver cleanup timed out')),10000))]);}
 catch(error){failed=true;console.error('INFRASTRUCTURE:',error.message);}
 process.exit(failed?1:0);
}
