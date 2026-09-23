// Fresh-browser defaults, saved choices, and the WAVE shader's phase-palette seats.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
import { go } from '../tools/gate/drv.mjs';

const url = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const g = await open(url, { width: 1280, height: 900, script: 30000 });
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 200, 100)).ok, 1);
  const fresh = await g.ev(`const b=document.body, S=document.querySelector('.dev[data-id="settings"]');
    const vivid=[...S.querySelectorAll('.k')].find(k=>k.querySelector('.k-lbl')?.textContent==='VIVID');
    return {tags:b.classList.contains('no-badges'),captions:b.classList.contains('no-captions'),
      hints:!b.classList.contains('control-hints-off'),helpOff:b.classList.contains('window-info-off'),
      lean:[...document.querySelectorAll('.dev-lean')].every(k=>k.closest('.dev').classList.contains('lean')),
      aaHidden:[...document.querySelectorAll('.dev-lean')].every(k=>getComputedStyle(k).display==='none'),
      auto:__LW.quality.auto,domain:__LW.domain.auto,governor:__LW.governor.on,
      theme:__LW.themeChoice,card:__LW.cardStyle,frost:__LW.frost,
      blur:getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim(),
      vivid:+vivid.getAttribute('aria-valuenow'),errors:__e.slice()};`);
  assert.deepEqual(fresh, { tags:true,captions:true,hints:true,helpOff:true,lean:true,aaHidden:true,
    auto:true,domain:true,governor:true,theme:'light',card:'refractive',frost:'always',
    blur:'22px',vivid:.5,errors:[] });
  console.log('PASS fresh desktop defaults: visibility, quality, light refractive frost, 22px blur and 50% vivid');

  const colour = await g.ev(`
    const L=__LW,f=L.field,m=L.mat,p=L.palette;
    if(!f.ok)return {skip:f.error||'no WebGPU adapter'};
    L.pause();L.setReference();L.clock.scrub(3);L.schedule(L.TIER.REBUILD);await L.settle();
    const stops=(mid=[0,1,0],plus=[1,0,0],minus=[0,0,1])=>[
      {at:0,rgb:[0,0,0]},{at:.25,rgb:plus},{at:.5,rgb:mid},{at:.75,rgb:minus}];
    p.setOn(true);m.invert=false;m.hueShift=0;
    const look={...m,style:0,frame:false,axis:false,exposure:4,softness:.5,knee:.2,bg:[0,0,0],gamma:1};
    const hash=async(view,s,on)=>{p.load(s);look.view=view;look.paletteOn=on;
      f.stats.presents=0; // readPixels' ray jitter reads this counter; compare colours at the same ray positions
      return (await f.readPixels(L.obs,look,320,240)).hash};
    const A=stops(),B=stops([1,1,0]),C=stops([0,1,0],[1,0,1]),D=stops([0,1,0],[1,0,0],[0,1,1]);
    const density=[await hash(0,A,true),await hash(0,B,true),await hash(0,C,true),await hash(0,D,true),await hash(0,A,false),await hash(0,B,false)];
    const diff=[await hash(4,A,true),await hash(4,B,true),await hash(4,C,true),await hash(4,D,true),await hash(4,A,false),await hash(4,C,false)];
    return {density,diff,refValid:f.refValid,errors:__e.slice()};`);
  if (colour.skip) console.log('SKIP WAVE palette GPU proof: ' + colour.skip);
  else {
    assert.equal(colour.refValid, true);
    assert.notEqual(colour.density[0], colour.density[1], 'density must follow the θ=0 stop');
    assert.equal(colour.density[0], colour.density[2], 'density must ignore the −π/2 stop');
    assert.equal(colour.density[0], colour.density[3], 'density must ignore the +π/2 stop');
    assert.equal(colour.density[4], colour.density[5], 'palette OFF retains the original density colour');
    assert.equal(colour.diff[0], colour.diff[1], 'Δρ must ignore the θ=0 stop');
    assert.notEqual(colour.diff[0], colour.diff[2], 'Δρ gain must follow the −π/2 stop');
    assert.notEqual(colour.diff[0], colour.diff[3], 'Δρ loss must follow the +π/2 stop');
    assert.equal(colour.diff[4], colour.diff[5], 'palette OFF retains the original Δρ colours');
    assert.deepEqual(colour.errors, []);
    console.log('PASS rendered WAVE density follows θ=0, Δρ follows ±π/2, and palette OFF keeps legacy colours');
  }

  await g.ev(`localStorage.setItem('lambdawaves.q0.settings',JSON.stringify({theme:'dark',badges:true,
    captions:true,controlHints:false,auto:false,governor:false,card:'tinted',cardSet:true,
    frost:'off',blur:14,accent:[30,300,.1]}));
    localStorage.setItem('lw-window-info','on');localStorage.setItem('lw.lean.v1','[]');return true;`);
  await go(g.s, url);
  assert.equal((await g.waitFor('window.__LW?.ready', 200, 100)).ok, 1);
  const saved = await g.ev(`const b=document.body,S=document.querySelector('.dev[data-id="settings"]');
    const vivid=[...S.querySelectorAll('.k')].find(k=>k.querySelector('.k-lbl')?.textContent==='VIVID');
    return {tags:!b.classList.contains('no-badges'),captions:!b.classList.contains('no-captions'),
      hints:!b.classList.contains('control-hints-off'),help:!b.classList.contains('window-info-off'),
      notes:[...document.querySelectorAll('.dev-lean')].every(k=>!k.closest('.dev').classList.contains('lean')),
      aaShown:[...document.querySelectorAll('.dev-lean')].every(k=>getComputedStyle(k).display!=='none'),
      auto:__LW.quality.auto,governor:__LW.governor.on,theme:__LW.themeChoice,
      card:__LW.cardStyle,frost:__LW.frost,
      blur:getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim(),
      vivid:+vivid.getAttribute('aria-valuenow'),errors:__e.slice()};`);
  assert.deepEqual(saved, { tags:true,captions:true,hints:false,help:true,notes:true,aaShown:true,
    auto:false,governor:false,theme:'dark',card:'tinted',frost:'off',blur:'14.0px',vivid:.1,errors:[] });
  console.log('PASS prior explicit browser choices survive the new first-run defaults');
} finally { await g.close(); }
