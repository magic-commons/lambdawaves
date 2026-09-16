// Compatibility of the adopted MIR controls, measured in a real DOM. The app's
// modulation/base-value wiring is covered by current.browser-test.mjs as well.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { script: 20000 });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
try {
  assert.equal((await g.waitFor('window.__LW?.ready', 150, 100)).ok, 1);
  const measured = await g.ev(`
    const {knob,fader}=await import('./mir/kit.js');
    const fixture=document.createElement('div');
    fixture.style.cssText='position:fixed;left:100px;top:150px;width:220px;z-index:10000';
    document.body.append(fixture);
    const mount=control=>{fixture.replaceChildren(control.root);return control};
    const key=(control,code,shiftKey=false)=>control.root.dispatchEvent(new KeyboardEvent('keydown',{code,key:code,shiftKey,cancelable:true}));
    const drag=(control,dx,shiftKey=false,pointerType='mouse')=>{
      const target=control.root.querySelector('.k-dial')||control.root,r=target.getBoundingClientRect();
      const send=(type,x)=>target.dispatchEvent(new PointerEvent(type,{pointerId:71,pointerType,button:0,clientX:x,clientY:r.top+r.height/2,shiftKey,cancelable:true}));
      send('pointerdown',r.left+r.width/2);send('pointermove',r.left+r.width/2+dx);send('pointerup',r.left+r.width/2+dx);
      return control.get();
    };
    const dial=options=>mount(knob({label:'test knob',min:0,max:1,value:.25,...options}));
    const slider=options=>mount(fader({label:'test fader',min:0,max:1,value:.25,...options}));
    try {
      const normal=drag(dial(),55),fine=drag(dial(),90,true,'touch');
      let k=dial();key(k,'ArrowUp');const arrow=k.get();key(k,'ArrowUp',true);const fineArrow=k.get();
      key(k,'Home');const home=k.get();key(k,'End');const end=k.get();
      const tuned=drag(dial({travel:110,fine:8}),55),tunedFine=drag(dial({travel:110,fine:8}),88,true);
      const f=slider(),width=f.root.getBoundingClientRect().width;
      const faderFine=drag(f,width/2,true,'touch');key(f,'ArrowUp');const faderArrow=f.get();key(f,'ArrowUp',true);const faderFineArrow=f.get();
      const log=slider({min:1,max:100,value:1,log:true});
      const midpoint=drag(log,0);key(log,'ArrowUp');const logArrow=log.get();
      let overlay=null;
      if(typeof log.show==='function') {
        log.set(10);log.show(20);
        overlay={base:log.get(),shown:log.shown,fill:Number(log.root.style.getPropertyValue('--fill')),text:log.root.querySelector('.fd-val').textContent};
        log.set(5);overlay.cleared=log.shown===null&&!log.root.classList.contains('mod');
        log.setDefault(2);key(log,'Delete');overlay.reset=log.get();
      }
      return {normal,fine,arrow,fineArrow,home,end,tuned,tunedFine,faderFine,faderArrow,faderFineArrow,midpoint,logArrow,overlay,errors:__e};
    } finally { fixture.remove(); }
  `);
  assert.equal(measured.E, undefined, measured.E);
  near(measured.normal, .5); near(measured.fine, .35);
  near(measured.arrow, .26); near(measured.fineArrow, .2625);
  near(measured.home, 0); near(measured.end, 1);
  near(measured.faderFine, .35); near(measured.faderArrow, .36); near(measured.faderFineArrow, .3625);
  console.log('PASS adopted MIR preserves default knob/fader drag, touch fine gain, keyboard steps and bounds');
  near(measured.tuned, .75); near(measured.tunedFine, .35);
  near(measured.midpoint, 10); near(measured.logArrow, 100 ** .51);
  assert.ok(measured.overlay, 'adopted fader supports a displayed modulation value');
  near(measured.overlay.base, 10); near(measured.overlay.shown, 20);
  near(measured.overlay.fill, Math.log(20) / Math.log(100));
  assert.equal(measured.overlay.text, '20.000'); assert.equal(measured.overlay.cleared, true); near(measured.overlay.reset, 2);
  assert.deepEqual(measured.errors, []);
  console.log('PASS adopted MIR supports opt-in sensitivity, log faders, independent display/base values and reset defaults');
} finally { await g.close(); }
