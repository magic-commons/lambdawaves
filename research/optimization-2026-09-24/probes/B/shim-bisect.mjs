// debug helper for frame-inventory.mjs: which hook stops the loop? (each step installs one more hook and plays 0.8 s)
import { open } from '../../../../tools/gate/gatekit.mjs';
const g = await open('https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0', { width: 1920, height: 1080, script: 600000, prefs: { 'privacy.reduceTimerPrecision': false } });
const play = `const f0=__LW.stats.frames; __LW.play(); await new Promise(r=>setTimeout(r,800)); __LW.pause(); await new Promise(r=>setTimeout(r,100)); return {f0, f1:__LW.stats.frames, k:window.__k||0, e:window.__e};`;
try {
  await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  console.log('pre', JSON.stringify(await g.ev(play)));
  console.log('raf', JSON.stringify(await g.ev(`const o=window.requestAnimationFrame.bind(window); window.requestAnimationFrame=function(cb){ return o((ts)=>{ window.__k=(window.__k||0)+1; cb(ts); }); }; ${play}`)));
  console.log('gbcr', JSON.stringify(await g.ev(`const o=Element.prototype.getBoundingClientRect; Element.prototype.getBoundingClientRect=function(...a){ return o.apply(this,a); }; ${play}`)));
  console.log('geom', JSON.stringify(await g.ev(`const d=Object.getOwnPropertyDescriptor(Element.prototype,'clientWidth'); const get=d.get; Object.defineProperty(Element.prototype,'clientWidth',{...d,get(){ return get.call(this);}}); ${play}`)));
  console.log('text', JSON.stringify(await g.ev(`const d=Object.getOwnPropertyDescriptor(Node.prototype,'textContent'); const set=d.set; Object.defineProperty(Node.prototype,'textContent',{...d,set(v){ return set.call(this,v);}}); ${play}`)));
  console.log('tok', JSON.stringify(await g.ev(`for (const n of ['add','remove','toggle']) { const o=DOMTokenList.prototype[n]; DOMTokenList.prototype[n]=function(...a){ return o.apply(this,a); }; } ${play}`)));
  console.log('gpv', JSON.stringify(await g.ev(`const o=CSSStyleDeclaration.prototype.getPropertyValue; CSSStyleDeclaration.prototype.getPropertyValue=function(...a){ return o.apply(this,a); }; ${play}`)));
  console.log('sprop', JSON.stringify(await g.ev(`const o=CSSStyleDeclaration.prototype.setProperty; CSSStyleDeclaration.prototype.setProperty=function(...a){ return o.apply(this,a); }; ${play}`)));
  console.log('attr', JSON.stringify(await g.ev(`for (const n of ['setAttribute','removeAttribute']) { const o=Element.prototype[n]; Element.prototype[n]=function(...a){ return o.apply(this,a); }; } ${play}`)));
  console.log('gcs', JSON.stringify(await g.ev(`const o=window.getComputedStyle; window.getComputedStyle=function(...a){ return o.apply(window,a); }; ${play}`)));
  console.log('hidden', JSON.stringify(await g.ev(`const d=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'hidden'); const set=d.set; Object.defineProperty(HTMLElement.prototype,'hidden',{...d,set(v){ return set.call(this,v);}}); ${play}`)));
  console.log('cls', JSON.stringify(await g.ev(`const d=Object.getOwnPropertyDescriptor(Element.prototype,'className'); const set=d.set; Object.defineProperty(Element.prototype,'className',{...d,set(v){ return set.call(this,v);}}); ${play}`)));
  console.log('lwwrap', JSON.stringify(await g.ev(`const o=__LW.field.frame; __LW.field.frame=function(...a){ return o.apply(this,a); }; const s=__LW.spectrum.update; __LW.spectrum.update=function(...a){ return s.apply(this,a); }; ${play}`)));
} finally { await g.close(); }
