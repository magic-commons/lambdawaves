/* Native window composition. Deliberately excludes the modulation plugin. */
import { el, seg, sw, trig, chip, gripDots } from './mir/kit.js';
import { infoPanel, installControlHelp, consolidateWindowHelp } from './mir/control-help.js';
import { planeModel } from './mir/plane-model.js';
export { infoPanel, installControlHelp, consolidateWindowHelp, planeModel };
import { buildMacroSlot } from './mir/modulation/modwindow/modwindow.js';   // the window's own slot builder: the transport's tiles are its rows, faces hidden


export function reworkNative({ ui, mat, repaint, modHost, modApi, cadence, setCadence }) {
  const ids=['spectrum','state','staticfield','palette','observer','camera','clip','slice','settings'];
  for(const id of ids){const d=document.querySelector(`.dev[data-id="${id}"]`);if(!d)continue;d.classList.add('native-clean');
    for(const l of d.querySelectorAll('.grp-lbl')) { l.title=l.textContent;l.textContent=l.textContent.split(/·|  |\(/)[0].trim(); }
  }
  const wave=ui.spaceSeg.root.closest('.dev-body');
  for(const l of wave.querySelectorAll('.grp-lbl'))l.remove();
  for(const k of ['spaceSeg','viewSeg']){const l=ui[k].root.querySelector('.k-lbl');if(l)l.remove();}
  // Shape and finish compose without multiplying the number of style buttons.
  const finish=seg({label:'FINISH',value:mat.finish||'lit',options:[{id:'lit',label:'LIT'},{id:'glass',label:'GLASS'},{id:'matte',label:'MATTE'}],onChange:v=>{mat.finish=v;repaint();}});
  ui.styleSeg.root.after(finish.root);ui.finishSeg=finish;
  const syncFinish=()=>{const matte=finish.button('matte'),glass=finish.button('glass');
    matte.disabled=![1,3,6,8].includes(mat.style);matte.title=matte.disabled?'This shape has no surface lighting to remove':'Unlit surface colour';
    glass.disabled=mat.style===6||mat.style===8;glass.title=glass.disabled?(mat.style===8?'SHELL ±':'SHELL')+' already uses translucent glass':'Use a translucent highlighted finish';
    if((mat.finish==='matte'&&matte.disabled)||(mat.finish==='glass'&&glass.disabled)){mat.finish='lit';finish.set('lit');}
  };
  const setStyle=ui.styleSeg.set;ui.styleSeg.set=v=>{setStyle(v);syncFinish();};
  ui.styleSeg.root.addEventListener('click',syncFinish);ui.styleSeg.root.addEventListener('keydown',syncFinish);syncFinish();

  const waveHelp=[...wave.querySelectorAll('.note:not(.link-note), .sturm-note, .sp-fx')];
  // Row indices are part of the skin (wave-row-2 and wave-row-6 have their own rules), so the material knobs
  // merge into row 2 and row 5 is simply absent: ISO, GRAIN and KNEE sit under EXPOSURE, SOFT and HUE (Josh, 2026-09-10).
  const waveRows=[[0,['spaceSeg']],[1,['viewSeg']],[2,['expK','softK','hueK','isoK','grainK','kneeK']],[3,['styleSeg']],[4,['finishSeg']]];   // iteration 008 W: row 6 (DITHER) left for SETTINGS › QUALITY
  const flat=document.createDocumentFragment();
  for(const [i,names] of waveRows){const r=el('div','row tight wave-row wave-row-'+i,flat);for(const name of names)r.appendChild(ui[name].root);}
  wave.replaceChildren(flat);for(const n of waveHelp)wave.appendChild(n);
  const shadow=document.querySelector('.dev[data-id="shadow"] .dev-body');
  const shadowDetails=el('div','shadow-details');shadowDetails.id='shadow-details';shadowDetails.hidden=true;shadow.appendChild(shadowDetails);
  shadowDetails.append(ui.hc.root);for(const n of shadow.querySelectorAll(':scope > .epi'))shadowDetails.appendChild(n);if(ui.shFoot)shadowDetails.appendChild(ui.shFoot);ui.shadowDetails=shadowDetails;   // 0.4.0 S3: the footer (L, T, V, S) runs only while this fold is open
  const shadowRow=ui.shadowSeg.root.parentElement;shadowRow.classList.add('shadow-controls');
  const shadowToggle=el('button','trig shadow-details-toggle lw-fold',shadowRow);shadowToggle.type='button';shadowToggle.dataset.fold='shadow details';chip(shadowToggle,'chevronDown','Show shadow details');shadowToggle.setAttribute('aria-controls',shadowDetails.id);shadowToggle.setAttribute('aria-expanded','false');
  shadowToggle.addEventListener('click',()=>{shadowDetails.hidden=!shadowDetails.hidden;shadowToggle.setAttribute('aria-expanded',String(!shadowDetails.hidden));shadowToggle.setAttribute('aria-label',shadowDetails.hidden?'Show shadow details':'Hide shadow details');});
  const settings=ui.set.body;
  const rows=[...settings.querySelectorAll(':scope > .grp')];
  for(const g of rows){g.classList.add('settings-section');}
  // Honest enum controls replace switches that secretly cycle through three/four modes.
  function enumControl(old,label,options,get,set){const control=seg({label,value:get(),options:options.map(id=>({id,label:id.toUpperCase()})),onChange:set});old.root.replaceWith(control.root);const write=old.set;old.set=v=>{write(v);control.set(get());};return control;}
  ui.frameModeSeg=enumControl(ui.frameSw,'FRAME',['box','lattice','dots','off'],()=>mat.frame===false?'off':mat.frameMode||'box',v=>{mat.frame=v!=='off';if(v!=='off')mat.frameMode=v;ui.frameSw.set(mat.frame);repaint();ui.saveNative();});
  ui.axisModeSeg=enumControl(ui.axisSw,'AXES',['box','corner','off'],()=>mat.axis===false?'off':mat.axisMode||'box',v=>{mat.axis=v!=='off';if(v!=='off')mat.axisMode=v;ui.axisSw.set(mat.axis);repaint();ui.saveNative();});
  // A binary, deliberately stubborn switch: an unsupported canvas cannot claim P3.
  const gamut=ui.gamutSeg;
  const p3=sw({label:'DISPLAY P3',value:gamut.get()==='p3',title:gamut.button('p3').title,
    onChange:on=>{const target=gamut.button(on?'p3':'srgb');if(!target.disabled)target.click();p3.set(gamut.get()==='p3');}});
  gamut.root.replaceWith(p3.root);
  const setGamut=gamut.set;gamut.set=v=>{setGamut(v);p3.set(v==='p3');};
  ui.gamutToggle=p3;
  const oldGroups=[...settings.children];
  // iteration 003: the LOOK page left for MIR OPTIONS (lab/mir-gui.js); SETTINGS is DISPLAY · QUALITY, BASINS' two (app/settings-window.js)
  const tabs=seg({aria:'Settings category',value:'display',options:[{id:'display',label:'DISPLAY'},{id:'quality',label:'QUALITY'}],onChange:id=>{for(const [key,p] of Object.entries(pages))p.hidden=key!==id;}});
  settings.prepend(tabs.root);
  const viewport=el('div','settings-viewport',settings),pages={};
  for(const id of ['display','quality']){pages[id]=el('div','settings-page',viewport);pages[id].hidden=id!=='display';}
  function row(page, names){const r=el('div','row tight',pages[page]);for(const name of names)if(ui[name]?.root)r.appendChild(ui[name].root);}
  row('display',['capSw','audioSw']);ui.capSw.root.parentElement.classList.add('settings-status-grid');row('display',['askUrl']);row('display',['frameModeSeg','axisModeSeg','axisInkSeg']);row('display',['stageSeat','stageK','gammaK']);row('display',['gamutToggle','p3Seg']);
  const quality=ui.gridSeg.root.closest('.grp');if(quality)pages.quality.appendChild(quality);
  const actions=el('div','row tight settings-actions',pages.display);
  for(const g of oldGroups)for(const b of g.querySelectorAll(':scope > .row > .trig')){if(b.textContent.includes('SHOW THE WARNING'))b.querySelector('.trig-l').textContent='WARNING';actions.appendChild(b);}
  const help=el('div','settings-help',pages.display);
  for(const g of oldGroups){if(g===quality)continue;for(const n of g.querySelectorAll('.note:not(.link-note), .sturm-note'))help.appendChild(n);g.remove();}
  // iteration 008 S: the rotor grid (ROTATE z · STARK K_z · DEFECT L² over the three SPINs) is FIELD's DRIVES row, built in that order with .native-rotors
  const tr=document.getElementById('transport');
  const main=el('div','native-play-row');main.append(...tr.children);tr.appendChild(main);
  const repeatInfo=infoPanel(ui.periodFx.root,'Repeat mathematics');
  const M=modHost.model,C=modHost.clock;
  const expand=el('button','tbtn tempo-expand',main);expand.type='button';expand.title='Set modulation tempo';expand.setAttribute('aria-expanded','false');
  const tempoNum=el('b','tempo-number',expand,'60.0');
  el('span','tempo-unit',expand,'BPM');
  const tempoHz=el('i','tempo-hz',expand,'1.00 Hz');
  const tempoChevron=el('span','tempo-chevron',expand);tempoChevron.setAttribute('aria-hidden','true');
  const panel=el('div','native-tempo',tr);panel.hidden=true;
  let syncTimer=0;
  const stopSync=()=>{if(syncTimer){clearTimeout(syncTimer);syncTimer=0;}};
  const armSync=()=>{if(panel.hidden||syncTimer)return;syncTimer=setTimeout(()=>{syncTimer=0;sync();armSync();},200);};
  const toggleTempo=()=>{panel.hidden=!panel.hidden;tr.classList.toggle('tempo-open',!panel.hidden);expand.setAttribute('aria-expanded',String(!panel.hidden));sync();if(panel.hidden)stopSync();else armSync();};
  let tempoDrag=null,tempoDragged=false;
  /* THE DIGIT UNDER THE POINTER IS THE STEP (Josh, FL Studio's law): on the tens it moves tens, on the ones
     it moves ones, on a visible decimal it moves tenths. A touch has no digit and moves ones. */
  const digitStep=(x,y)=>{const t=tempoNum.firstChild;if(!t||t.nodeType!==3)return 1;const s=t.textContent,p=s.indexOf('.')<0?s.length:s.indexOf('.');const r=document.createRange();
    for(let i=0;i<s.length;i++){r.setStart(t,i);r.setEnd(t,i+1);const b=r.getBoundingClientRect();if(x>=b.left&&x<=b.right){if(s[i]==='.')return 1;return i<p?Math.pow(10,p-1-i):Math.pow(10,-(i-p));}}
    return 1;};
  const PX_PER_STEP=9;
  expand.addEventListener('pointerdown',e=>{if(e.button)return;const touch=e.pointerType==='touch';tempoDrag={y:e.clientY,bpm:M.transport.bpm,moved:false,touch,step:touch?1:digitStep(e.clientX,e.clientY)};try{expand.setPointerCapture(e.pointerId);}catch(_){}});
  expand.addEventListener('pointermove',e=>{if(!tempoDrag)return;const dy=tempoDrag.y-e.clientY;if(!tempoDrag.moved&&Math.abs(dy)<4)return;tempoDrag.moved=true;const n=Math.trunc(dy/(tempoDrag.touch?14:PX_PER_STEP));C.setBpm(Math.round((tempoDrag.bpm+n*tempoDrag.step)*10)/10);sync();});
  expand.addEventListener('wheel',e=>{e.preventDefault();const step=digitStep(e.clientX,e.clientY);const dir=e.deltaY<0?1:e.deltaY>0?-1:0;if(!dir)return;C.setBpm(Math.round((M.transport.bpm+dir*step)*10)/10);sync();ui.saveNative();},{passive:false});
  const endTempoDrag=()=>{if(!tempoDrag)return;if(tempoDrag.moved){tempoDragged=true;ui.saveNative();}tempoDrag=null;};
  expand.addEventListener('pointerup',endTempoDrag);expand.addEventListener('pointercancel',()=>{tempoDrag=null;});
  expand.addEventListener('click',()=>{if(tempoDragged){tempoDragged=false;return;}toggleTempo();});
  expand.addEventListener('keydown',e=>{const step=e.shiftKey?.1:e.code.startsWith('Page')?10:1;const dir=e.code==='ArrowUp'||e.code==='ArrowRight'||e.code==='PageUp'?1:e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='PageDown'?-1:0;if(!dir)return;e.preventDefault();C.setBpm(M.transport.bpm+dir*step);sync();ui.saveNative();});
  /* 2026-09-10 (Josh, second pass): the expanded bar keeps its two-row height. LEFT — a MINIATURE of the
     modulation window's macro rail: number badge, name, value, the same thin fader — read and written
     through the model, so it is the same macro, not a copy. The window is still the only place that BUILDS
     macros (STYLE-LOCK). RIGHT — the CLOCK in two rows of tiles. The BPM field is gone: the pill already
     carries the tempo (drag, arrows, TAP). 0.5.0 C4 (R-B1): there is ONE clock — the transport's play — so
     LINKED and MOD ▶ are gone and the grid is eight tiles: TAP, WALL, the cadence, the three bends, the two HOLDs. */
  const macroPane=el('div','tempo-pane tempo-macros',panel);macroPane.setAttribute('aria-label','macros');
  /* THE TILES ARE THE WINDOW'S ROWS. `buildMacroSlot` is the ported window's own builder — the same grip,
     the same numbered depth seat with its ring, the same reorder tool — and the window's API wires the
     same gestures to them. The name face, the delete and the rename row are hidden here, not rebuilt.
     Two tiles to a row (A B / C D …); past two rows the rail scrolls and the clock does not. */
  const macroRail=el('div','tempo-rail',macroPane);
  const tiles=new Map();let macroSig='';
  function buildMacros(){
    const api=modApi&&modApi();const list=M.macroList();
    const sig=list.map(m=>m.id+':'+m.kind).join('|')+(api?'+':'-');
    if(sig===macroSig)return;macroSig=sig;macroRail.textContent='';tiles.clear();
    list.forEach((m,i)=>{
      const rec=buildMacroSlot(macroRail,m,i+1);rec.root.classList.add('tempo-tile');
      for(const x of [rec.val,rec.pad,rec.del,rec.erow])if(x)x.hidden=true;
      if(api){api.wireGrip(rec.grip,m.id);api.wireDepth(rec.numSeat,m.id,i+1);wireTileReorder(rec,m.id,api);}
      rec.reorder.replaceChildren(gripDots());rec.grip.title='Drag to route; tap to arm; double-top to reset'.replace('double-top','double-tap');rec.reorder.title='Drag to reorder';
      tiles.set(m.id,rec);
    });
    if(!list.length)el('div','tempo-empty',macroRail,'No macros yet — add one in the modulation window.');
    paintTiles();
  }
  function paintTiles(){const api=modApi&&modApi();if(!api)return;for(const [id,rec] of tiles)api.paintDepth(rec.numSeat,rec.depthArc,id);}
  /* the rail's reorder, on a two-column grid: the tile under the pointer says where the row goes */
  function wireTileReorder(rec,macroId,api){
    let d=null;
    const at=(list,x,y)=>{for(let i=0;i<list.length;i++){const b=list[i].getBoundingClientRect();if(y<b.top||y>b.bottom)continue;if(x<b.left+b.width/2)return i;if(x<=b.right)return i+1;}return -1;};   // over the OTHER tiles, so the index is the insertion point
    const move=e=>{if(!d||e.pointerId!==d.id)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<4)return;d.moved=true;rec.root.classList.add('m2reorder');
      const list=[...macroRail.querySelectorAll('.tempo-tile')].filter(t=>t!==rec.root);let i=at(list,e.clientX,e.clientY);if(i<0)return;
      const before=list[Math.min(i,list.length)]||null;if(before&&before!==rec.root.nextSibling)macroRail.insertBefore(rec.root,before);else if(!before&&macroRail.lastElementChild!==rec.root)macroRail.appendChild(rec.root);};
    const stop=(e,cancel)=>{if(!d||e.pointerId!==d.id)return;const moved=d.moved;d=null;document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',up,true);document.removeEventListener('pointercancel',cancelE,true);rec.root.classList.remove('m2reorder');
      if(!moved)return;e.preventDefault();e.stopPropagation();if(!cancel){const to=[...macroRail.querySelectorAll('.tempo-tile')].indexOf(rec.root);api.moveMacro(macroId,to);}macroSig='';buildMacros();};
    const up=e=>stop(e,false),cancelE=e=>stop(e,true);
    rec.reorder.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();e.stopPropagation();try{rec.reorder.setPointerCapture(e.pointerId);}catch(_){}d={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',cancelE,true);});
    rec.reorder.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const list=M.macroList(),atI=list.findIndex(m=>m.id===macroId);
      const to=e.key==='Home'?0:e.key==='End'?list.length-1:atI+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:e.key==='ArrowUp'?-2:2);api.moveMacro(macroId,Math.max(0,Math.min(list.length-1,to)));macroSig='';buildMacros();});
  }
  function syncMacros(){buildMacros();paintTiles();}
  const clockPane=el('div','tempo-pane tempo-clock',panel);clockPane.setAttribute('aria-label','clock');
  const grid=el('div','tempo-grid',clockPane);
  let taps=[];grid.appendChild(trig({label:'TAP',title:'Tap the tempo',onFire:()=>{const r=M.tapTempo(taps,performance.now());taps=r.taps;if(r.bpm)C.setBpm(r.bpm);sync();ui.saveNative();}}).root);
  const syncB=trig({label:'WALL',title:'Sync the modulation clock to the wall clock or run it free',onFire:()=>{C.setSync(M.syncMode()==='wall'?'free':'wall');sync();ui.saveNative();}});grid.appendChild(syncB.root);
  const cad=trig({label:'60 Hz',title:'Modulation cadence',onFire:()=>{setCadence(cadence()===120?60:120);sync();}});grid.appendChild(cad.root);
  /* THE DJ BENDS. One base tempo is remembered while a bend is in force, so ÷2 after ×2 bends the same
     base rather than compounding; releasing puts the base back exactly. A BPM-synced ramp LFO doubles or
     halves its rate with it — the transition move Josh asked for. */
  const clampBpm=v=>Math.min(M.BPM_MAX,Math.max(M.BPM_MIN,v));
  const bend={base:null,which:null,latched:false,downAt:0};
  const bends=[[0.5,'÷2'],[2,'×2'],[4,'×4']].map(([factor,label])=>{
    const b=trig({label,title:'Hold to '+(factor>1?'double':'halve')+' the tempo, release to return · tap to latch, tap again to release',onFire:()=>{}});
    b.root.setAttribute('aria-pressed','false');
    const on=()=>{if(bend.base===null)bend.base=M.transport.bpm;bend.which=label;C.setBpm(clampBpm(bend.base*factor));sync();};
    const off=()=>{if(bend.base!==null)C.setBpm(bend.base);bend.base=null;bend.which=null;bend.latched=false;sync();};
    b.root.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();bend.downAt=performance.now();
      if(bend.which===label&&bend.latched){off();return;}
      if(bend.which&&bend.which!==label)off();
      on();try{b.root.setPointerCapture(e.pointerId);}catch(_){}});
    b.root.addEventListener('pointerup',()=>{if(bend.which!==label||bend.latched)return;if(performance.now()-bend.downAt<240){bend.latched=true;sync();return;}off();});
    b.root.addEventListener('pointercancel',()=>{if(bend.which===label&&!bend.latched)off();});
    b.root.addEventListener('keydown',e=>{if(e.repeat||(e.code!=='Space'&&e.code!=='Enter'))return;e.preventDefault();if(bend.which===label){off();return;}if(bend.which)off();on();bend.latched=true;sync();});
    grid.appendChild(b.root);return {b,label};
  });
  const holds=['1/4','1'].map(note=>{const b=trig({label:'HOLD '+(note==='1/4'?'¼':note),title:'Stutter: hold the beat at this note value',onFire:()=>{if(M.transport.hold&&M.transport.holdNote===note)C.release();else{if(M.transport.hold)C.release();C.hold(note);}sync();}});grid.appendChild(b.root);return b;});
  const infoSeat=el('div','tempo-info',panel);infoSeat.appendChild(repeatInfo);   // the repeat mathematics, in the panel's corner — not a tile
  function syncNow(){const n=M.transport.bpm.toFixed(M.transport.bpm<100?1:0),rate=(M.transport.bpm/60).toFixed(2)+' Hz';tempoNum.textContent=n;tempoHz.textContent=rate;expand.setAttribute('aria-label',n+' beats per minute. Drag vertically to change; press to show tempo controls');expand.setAttribute('aria-valuemin',String(M.BPM_MIN));expand.setAttribute('aria-valuemax',String(M.BPM_MAX));expand.setAttribute('aria-valuenow',String(M.transport.bpm));expand.setAttribute('aria-valuetext',n+' BPM, '+rate);syncB.root.querySelector('.trig-l').textContent=M.syncMode().toUpperCase();cad.root.querySelector('.trig-l').textContent=cadence()+' Hz';holds.forEach((b,i)=>{const on=M.transport.hold&&M.transport.holdNote===['1/4','1'][i];b.root.classList.toggle('on',on);b.root.setAttribute('aria-pressed',String(!!on));});for(const {b,label} of bends){const on=bend.which===label;b.root.classList.toggle('on',on);b.root.setAttribute('aria-pressed',String(on));}if(!panel.hidden)syncMacros();}
  /* 2026-09-11: the 200-ms tempo-panel timer used to rewrite ~15 DOM fields blind. The writes now happen only
     when their inputs changed — a signature of everything sync() paints, macros included. */
  let syncSig='';
  function sync(){const T=M.transport;const sig=[T.bpm,M.syncMode(),cadence(),T.hold,T.holdNote,bend.which,bend.latched,panel.hidden,
    M.macroList().map(m=>m.id+':'+m.name+':'+m.kind+':'+(+m.masterDepth).toFixed(4)+':'+(m.sourceId||'')).join('|')].join('\u0001');
    if(sig===syncSig)return;syncSig=sig;syncNow();}
  sync();
  const select=e=>{if(e.target.closest('#modwin')){document.querySelector('.native-selected')?.classList.remove('native-selected');return;}const d=e.target.closest('.dev');if(!d||d.classList.contains('mir-modwindow'))return;document.querySelector('.native-selected')?.classList.remove('native-selected');d.classList.add('native-selected');};document.addEventListener('pointerdown',select);document.addEventListener('focusin',select);
  consolidateWindowHelp();
  installControlHelp();
}
