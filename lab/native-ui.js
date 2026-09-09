/* Native window composition. Deliberately excludes the modulation plugin. */
import { el, seg, sw, trig, chip } from './kit.js';

// Explanations are out-of-flow: a live formula can never resize its instrument.
export function infoPanel(content, label = 'Information') {
  const anchor = el('span', 'native-info');
  const b = el('button', 'native-info-button', anchor, 'ⓘ'); b.type = 'button';
  b.setAttribute('aria-label', label); b.setAttribute('aria-expanded', 'false');
  content.before(anchor); anchor.appendChild(content); content.classList.add('native-info-content');
  content.setAttribute('popover','manual');
  let pinned=false;
  const close=()=>{if(content.matches(':popover-open'))content.hidePopover();b.setAttribute('aria-expanded','false');};
  const open=()=>{if(document.body.classList.contains('window-info-off'))return;if(!content.matches(':popover-open'))content.showPopover();const r=b.getBoundingClientRect();
    content.style.left=Math.max(8,Math.min(innerWidth-content.offsetWidth-8,r.left))+'px';
    content.style.top=Math.max(8,Math.min(innerHeight-content.offsetHeight-8,r.bottom+6))+'px';
    b.setAttribute('aria-expanded','true');};
  b.addEventListener('click',()=>{pinned=!pinned;pinned?open():close();});
  anchor.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')open();});
  anchor.addEventListener('pointerleave',()=>{if(!pinned&&!anchor.contains(document.activeElement))close();});
  anchor.addEventListener('focusin',open);
  anchor.addEventListener('focusout',()=>{if(!pinned)close();});
  anchor.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pinned=false;close();b.focus();close();}});
  document.addEventListener('pointerdown',e=>{if(!anchor.contains(e.target)){pinned=false;close();}});
  return anchor;
}

export function planeModel(host, { getNormal, getPosition = () => 0, onTurn }) {
  const cv = el('canvas', 'plane-model', host); cv.width = 400; cv.height = 280; cv.tabIndex = 0;
  cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Slice sphere and plane. Drag or use arrow keys to rotate; Home resets.');
  cv.title = 'Drag to orient the plane · arrow keys rotate · Shift for fine motion · Home resets';
  const unit = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const project = p => [200+85*Math.SQRT1_2*(p[0]-p[1]),140+85*((p[0]+p[1])/Math.sqrt(6)-p[2]*Math.sqrt(2/3))];
  function paint() {
    if(cv.clientWidth<2)return;
    const g = cv.getContext('2d'), css = getComputedStyle(cv), ink = css.getPropertyValue('--fg').trim(), accent = css.getPropertyValue('--acc').trim();
    g.clearRect(0,0,400,280); g.strokeStyle = ink; g.globalAlpha = .25; g.lineWidth = 1.4;
    g.beginPath();g.arc(200,140,85,0,Math.PI*2);g.stroke();
    for (let axis=0;axis<3;axis++) { g.beginPath(); for(let j=0;j<=96;j++){ const a=j*Math.PI/48,p=[0,0,0];p[(axis+1)%3]=Math.cos(a);p[(axis+2)%3]=Math.sin(a);const q=project(p);j?g.lineTo(...q):g.moveTo(...q); }g.stroke(); }
    const n=unit(getNormal()),u=unit(cross(n,Math.abs(n[2])<.9?[0,0,1]:[0,1,0])),v=cross(n,u),pos=getPosition();
    g.beginPath(); for(const [i,j] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const p=project(n.map((a,k)=>a*pos+.8*(u[k]*i+v[k]*j)));g.lineTo(...p);}g.closePath();g.globalAlpha=.22;g.fillStyle=accent;g.fill();g.globalAlpha=1;g.strokeStyle=accent;g.stroke();
    g.beginPath();g.moveTo(...project(n.map(a=>a*pos)));g.lineTo(...project(n.map(a=>a*(pos+.8))));g.stroke();
    g.fillStyle=ink;g.font='18px sans-serif';for(const [i,label] of ['X','Y','Z'].entries()){const p=[0,0,0];p[i]=1.18;g.fillText(label,...project(p));}
  }
  function turn(dx,dy) { const n=unit(getNormal()),a=Math.atan2(n[1],n[0])+dx,b=Math.max(-Math.PI/2+.001,Math.min(Math.PI/2-.001,Math.asin(n[2])+dy));onTurn([Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)]);paint(); }
  let drag=null;
  cv.addEventListener('pointerdown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;drag=[e.clientX,e.clientY];try{cv.setPointerCapture(e.pointerId);}catch(_){}cv.focus();});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const gain=e.shiftKey?.003:.015;turn((e.clientX-drag[0])*gain,(drag[1]-e.clientY)*gain);drag=[e.clientX,e.clientY];});
  for(const type of ['pointerup','pointercancel'])cv.addEventListener(type,()=>{drag=null;});
  cv.addEventListener('keydown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;const k=e.shiftKey?.015:.1;if(e.key==='Home'){onTurn([0,0,1]);paint();}else if(e.key.startsWith('Arrow'))turn(e.key==='ArrowLeft'?-k:e.key==='ArrowRight'?k:0,e.key==='ArrowUp'?k:e.key==='ArrowDown'?-k:0);else return;e.preventDefault();});
  new ResizeObserver(paint).observe(cv); paint(); return { root:cv, paint };
}

export function reworkNative({ ui, mat, repaint, modHost, cadence, setCadence, arm }) {
  const ids=['spectrum','state','palette','observer','camera','clip','slice','settings'];
  for(const id of ids){const d=document.querySelector(`.dev[data-id="${id}"]`);if(!d)continue;d.classList.add('native-clean');
    for(const n of d.querySelectorAll('.note:not(.link-note), .sturm-note, .sp-fx')) { if(n.hidden || n.closest('.native-info'))continue;infoPanel(n,`${id} information`); }
    for(const l of d.querySelectorAll('.grp-lbl')) { l.title=l.textContent;l.textContent=l.textContent.split(/·|  |\(/)[0].trim(); }
  }
  const wave=ui.spaceSeg.root.closest('.dev-body');
  for(const l of wave.querySelectorAll('.grp-lbl'))l.remove();
  for(const k of ['spaceSeg','viewSeg']){const l=ui[k].root.querySelector('.k-lbl');if(l)l.remove();}
  // Shape and finish compose without multiplying the number of style buttons.
  const finish=seg({label:'FINISH',value:mat.finish||'lit',options:[{id:'lit',label:'LIT'},{id:'glass',label:'GLASS'},{id:'matte',label:'MATTE'}],onChange:v=>{mat.finish=v;repaint();}});
  ui.styleSeg.root.after(finish.root);ui.finishSeg=finish;
  const syncFinish=()=>{const matte=finish.button('matte'),glass=finish.button('glass');
    matte.disabled=![1,3,6].includes(mat.style);matte.title=matte.disabled?'This shape has no surface lighting to remove':'Unlit surface colour';
    glass.disabled=mat.style===6;glass.title=glass.disabled?'SHELL already uses translucent glass':'Translucent finish on this shape; stylized highlights, without physical refraction';
    if((mat.finish==='matte'&&matte.disabled)||(mat.finish==='glass'&&glass.disabled)){mat.finish='lit';finish.set('lit');}
  };
  const setStyle=ui.styleSeg.set;ui.styleSeg.set=v=>{setStyle(v);syncFinish();};
  ui.styleSeg.root.addEventListener('click',syncFinish);ui.styleSeg.root.addEventListener('keydown',syncFinish);syncFinish();

  const waveHelp=[...wave.querySelectorAll('.native-info')];
  const waveRows=[['spaceSeg'],['viewSeg'],['expK','softK','hueK'],['styleSeg'],['finishSeg'],['isoK','grainK','kneeK'],['ditherSeg','ditherK']];
  const flat=document.createDocumentFragment();
  for(const [i,names] of waveRows.entries()){const r=el('div','row tight wave-row wave-row-'+i,flat);for(const name of names)r.appendChild(ui[name].root);}
  wave.replaceChildren(flat);for(const n of waveHelp)wave.appendChild(n);
  // A single reading pocket per instrument replaces scattered info buttons and empty rows.
  for(const id of ids){const d=document.querySelector(`.dev[data-id="${id}"]`);if(!d || id==='settings' || id==='spectrum')continue;
    const pockets=[...d.querySelectorAll('.native-info')];if(pockets.length<2)continue;
    const contents=document.createElement('div');contents.className='native-help-book';d.querySelector('.dev-body').appendChild(contents);
    for(const pocket of pockets){const content=pocket.querySelector('.native-info-content');if(content){content.classList.remove('native-info-content');content.removeAttribute('popover');contents.appendChild(content);}pocket.remove();}
    infoPanel(contents,`${id} information`);
  }
  const palette=document.querySelector('.dev[data-id="palette"]');
  const reverse=[...palette.querySelectorAll('.trig')].find(b=>b.textContent.trim()==='REVERSE');
  if(reverse){reverse.parentElement.appendChild(ui.invertSw.root);ui.invertSw.root.classList.add('palette-action');reverse.classList.add('palette-action');}
  palette.querySelector('.palette-seam')?.remove();
  const camera=ui.camSeg.root.closest('.grp');camera.querySelector('.grp-lbl').textContent='CAMERA';
  const motion=el('div','row tight camera-motion');
  ui.spinSw.root.parentElement.before(motion);
  const controlRow=el('div','row tight camera-control');motion.before(controlRow);
  controlRow.append(ui.camSeg.root,ui.spinSw.root);ui.camSeg.root.querySelector('.k-lbl')?.remove();
  ui.spinSw.root.querySelector('.sw-lbl').textContent='AUTOROTATE';
  for(const key of ['spinK','fricK','gainK','flingK'])motion.appendChild(ui[key].root);
  for(const r of camera.querySelectorAll('.row'))if(!r.children.length)r.remove();
  const exportRow=ui.capExact.root.parentElement;exportRow.classList.add('camera-export-row');
  const exportDetails=el('div','camera-export-details');exportDetails.id='camera-export-details';exportDetails.hidden=true;exportRow.after(exportDetails);
  exportDetails.append(ui.capExactRo.root,ui.capShot.root,ui.capPlanRo.root);
  const disclosure=el('button','trig camera-export-toggle',exportRow);disclosure.type='button';
  disclosure.setAttribute('aria-controls',exportDetails.id);disclosure.setAttribute('aria-expanded','false');
  chip(disclosure,'chevronDown','Show export details');
  const syncDisclosure=()=>{disclosure.setAttribute('aria-expanded',String(!exportDetails.hidden));disclosure.setAttribute('aria-label',exportDetails.hidden?'Show export details':'Hide export details');};
  disclosure.addEventListener('click',()=>{exportDetails.hidden=!exportDetails.hidden;syncDisclosure();});syncDisclosure();
  for(const r of ui.capExact.root.closest('.grp').querySelectorAll('.row'))if(!r.children.length)r.remove();
  const shadow=document.querySelector('.dev[data-id="shadow"] .dev-body');
  const shadowDetails=el('div','shadow-details');shadowDetails.id='shadow-details';shadowDetails.hidden=true;shadow.appendChild(shadowDetails);
  shadowDetails.append(ui.hc.root);for(const n of shadow.querySelectorAll(':scope > .epi'))shadowDetails.appendChild(n);
  const shadowRow=ui.shadowSeg.root.parentElement;shadowRow.classList.add('shadow-controls');
  const shadowToggle=el('button','trig shadow-details-toggle',shadowRow);shadowToggle.type='button';chip(shadowToggle,'chevronDown','Show shadow details');shadowToggle.setAttribute('aria-controls',shadowDetails.id);shadowToggle.setAttribute('aria-expanded','false');
  shadowToggle.addEventListener('click',()=>{shadowDetails.hidden=!shadowDetails.hidden;shadowToggle.setAttribute('aria-expanded',String(!shadowDetails.hidden));shadowToggle.setAttribute('aria-label',shadowDetails.hidden?'Show shadow details':'Hide shadow details');});
  const settings=ui.set.body;
  const keys=settings.querySelector('.keys-list')?.closest('.grp'); if(keys)keys.remove();
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
  for(const name of ['accA','accB']){const k=ui[name];k.root.classList.add('accent-dial');if(name==='accB')k.root.classList.add('accent-dial-b');
    const paintArc=()=>k.root.style.setProperty('--accent-sweep',(k.get()/360*360)+'deg');paintArc();
    new MutationObserver(paintArc).observe(k.root,{attributes:true,attributeFilter:['aria-valuenow']});
  }
  const oldGroups=[...settings.children];
  const tabs=seg({aria:'Settings category',value:'display',options:[{id:'display',label:'DISPLAY'},{id:'appearance',label:'LOOK'},{id:'quality',label:'QUALITY'}],onChange:id=>{for(const [key,p] of Object.entries(pages))p.hidden=key!==id;}});
  settings.prepend(tabs.root);
  const viewport=el('div','settings-viewport',settings),pages={};
  for(const id of ['appearance','display','quality']){pages[id]=el('div','settings-page',viewport);pages[id].hidden=id!=='display';}
  function row(page, names){const r=el('div','row tight',pages[page]);for(const name of names)if(ui[name]?.root)r.appendChild(ui[name].root);}
  let showWindowInfo=false;try{showWindowInfo=localStorage.getItem('lw-window-info')==='on';}catch(_){}
  const applyWindowInfo=on=>{document.body.classList.toggle('window-info-off',!on);
    if(!on){for(const p of document.querySelectorAll('.native-info-content:popover-open'))p.hidePopover();document.querySelectorAll('.native-info-button').forEach(b=>b.setAttribute('aria-expanded','false'));const old=document.getElementById('infoPop');if(old)old.hidden=true;}
    try{localStorage.setItem('lw-window-info',on?'on':'off');}catch(_){}
  };
  ui.windowInfoSw=sw({label:'WINDOW INFO',value:showWindowInfo,title:'Show explanatory info buttons and hover panels in windows',onChange:applyWindowInfo});applyWindowInfo(showWindowInfo);
  row('appearance',['themeSeg']);row('appearance',['cardSeg']);row('appearance',['frostSeg']);row('appearance',['discSw','blurK']);row('appearance',['accA','accB','vivid']);
  row('display',['badgesSw','hintSw','capSw','windowInfoSw']);ui.windowInfoSw.root.parentElement.classList.add('settings-status-grid');row('display',['frameModeSeg','axisModeSeg','axisInkSeg']);row('display',['stageK','gammaK']);row('display',['gamutToggle','p3Seg']);
  const quality=ui.gridSeg.root.closest('.grp');if(quality)pages.quality.appendChild(quality);
  const actions=el('div','row tight settings-actions',pages.appearance);
  for(const g of oldGroups)for(const b of g.querySelectorAll(':scope > .row > .trig')){if(b.textContent.includes('SHOW THE WARNING'))b.querySelector('.trig-l').textContent='WARNING';actions.appendChild(b);}
  const help=el('div','settings-help',pages.appearance);
  for(const g of oldGroups){if(g===quality)continue;for(const n of g.querySelectorAll('.native-info'))help.appendChild(n);g.remove();}
  const rotations=ui.rotZRate.root.parentElement;
  const actionRow=el('div','row tight');rotations.before(actionRow);
  for(const t of [...rotations.querySelectorAll(':scope > .trig')])actionRow.appendChild(t);
  rotations.classList.add('native-rotors');
  const turn=rotations.querySelector('.k');
  for(const k of [turn,ui.kzKnob.root,ui.defKnob.root,ui.rotZRate.root,ui.kzRate.root,ui.defRate.root])rotations.appendChild(k);
  const ab=ui.abSw.root.closest('.grp'),abRow=ab.querySelector('.row');abRow.classList.add('native-ab');
  const buttons=[...abRow.children];if(buttons.length===4)abRow.replaceChildren(buttons[0],buttons[2],buttons[1],buttons[3]);
  const tr=document.getElementById('transport');
  const main=el('div','native-play-row');main.append(...tr.children);tr.appendChild(main);
  const repeatInfo=infoPanel(ui.periodFx.root,'Repeat mathematics');

  const expand=el('button','tbtn tempo-expand',main);chip(expand,'chevronDown','show or hide tempo controls');expand.title='Tempo controls';expand.type='button';expand.setAttribute('aria-expanded','false');
  const panel=el('div','native-tempo',tr);panel.hidden=true;
  expand.addEventListener('click',()=>{panel.hidden=!panel.hidden;tr.classList.toggle('tempo-open',!panel.hidden);expand.setAttribute('aria-expanded',String(!panel.hidden));sync();});
  const M=modHost.model,C=modHost.clock;
  const play=trig({label:'MOD PLAY',title:'Play/pause modulation independently of physics',onFire:()=>{arm(true);C.toggle(performance.now()/1000);sync();}});panel.appendChild(play.root);
  const bpm=el('input','native-bpm',panel);bpm.type='number';bpm.min=String(M.BPM_MIN);bpm.max=String(M.BPM_MAX);bpm.step='.1';bpm.setAttribute('aria-label','Tempo in beats per minute');bpm.title='BPM';
  bpm.addEventListener('change',()=>{if(Number.isFinite(bpm.valueAsNumber))C.setBpm(bpm.valueAsNumber);sync();ui.saveNative();});
  let taps=[];panel.appendChild(trig({label:'TAP',onFire:()=>{const r=M.tapTempo(taps,performance.now());taps=r.taps;if(r.bpm)C.setBpm(r.bpm);sync();ui.saveNative();}}).root);
  const syncB=trig({label:'WALL',onFire:()=>{C.setSync(M.syncMode()==='wall'?'free':'wall');sync();ui.saveNative();}});panel.appendChild(syncB.root);
  const cad=trig({label:'60 Hz',onFire:()=>{setCadence(cadence()===120?60:120);sync();}});panel.appendChild(cad.root);
  const hzGroup=el('div','native-tempo-hz',panel);const hz=el('span','',hzGroup);hzGroup.appendChild(repeatInfo);
  const holds=['1/4','1'].map(note=>{const b=trig({label:'HOLD '+note,onFire:()=>{if(M.transport.hold&&M.transport.holdNote===note)C.release();else{if(M.transport.hold)C.release();C.hold(note);}sync();}});panel.appendChild(b.root);return b;});
  function sync(){hz.textContent=(M.transport.bpm/60).toFixed(2)+' Hz';if(document.activeElement!==bpm)bpm.value=String(Math.round(M.transport.bpm*10)/10);syncB.root.querySelector('.trig-l').textContent=M.syncMode().toUpperCase();cad.root.querySelector('.trig-l').textContent=cadence()+' Hz';holds.forEach((b,i)=>{const on=M.transport.hold&&M.transport.holdNote===['1/4','1'][i];b.root.classList.toggle('on',on);b.root.setAttribute('aria-pressed',String(!!on));});play.on=C.isPlaying();play.setLabel(C.isPlaying()?'MOD PAUSE':'MOD PLAY');}
  setInterval(()=>{if(!panel.hidden)sync();},200);sync();
  const select=e=>{if(e.target.closest('#modwin')){document.querySelector('.native-selected')?.classList.remove('native-selected');return;}const d=e.target.closest('.dev');if(!d||d.classList.contains('mir-modwindow'))return;document.querySelector('.native-selected')?.classList.remove('native-selected');d.classList.add('native-selected');};document.addEventListener('pointerdown',select);document.addEventListener('focusin',select);
}
