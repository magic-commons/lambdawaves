/* Native window composition. Deliberately excludes the modulation plugin. */
import { el, seg, sw, trig, chip } from './kit.js';

const HELP_HOVER_DELAY = 800;

// Explanations are out-of-flow: a live formula can never resize its instrument.
export function infoPanel(content, label = 'Information') {
  const anchor = el('span', 'native-info');
  const b = el('button', 'native-info-button', anchor, 'ⓘ'); b.type = 'button';
  b.setAttribute('aria-label', label); b.setAttribute('aria-expanded', 'false');
  content.before(anchor); anchor.appendChild(content); content.classList.add('native-info-content');
  content.setAttribute('popover','manual');
  let pinned=false, hoverTimer=0;
  const cancelHover=()=>{if(hoverTimer){clearTimeout(hoverTimer);hoverTimer=0;}};
  const close=()=>{cancelHover();if(content.matches(':popover-open'))content.hidePopover();b.setAttribute('aria-expanded','false');};
  const open=()=>{if(document.body.classList.contains('window-info-off'))return;if(!content.matches(':popover-open'))content.showPopover();const r=b.getBoundingClientRect();
    content.style.left=Math.max(8,Math.min(innerWidth-content.offsetWidth-8,r.left))+'px';
    content.style.top=Math.max(8,Math.min(innerHeight-content.offsetHeight-8,r.bottom+6))+'px';
    b.setAttribute('aria-expanded','true');};
  b.addEventListener('click',()=>{cancelHover();pinned=!pinned;pinned?open():close();});
  anchor.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!pinned){cancelHover();hoverTimer=setTimeout(()=>{hoverTimer=0;open();},HELP_HOVER_DELAY);}});
  anchor.addEventListener('pointerleave',()=>{cancelHover();if(!pinned&&!anchor.contains(document.activeElement))close();});
  anchor.addEventListener('focusin',open);
  anchor.addEventListener('focusout',()=>{if(!pinned)close();});
  anchor.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pinned=false;close();b.focus();close();}});
  document.addEventListener('pointerdown',e=>{if(!anchor.contains(e.target)){pinned=false;close();}});
  return anchor;
}

/* One quiet tooltip surface for short control hints. Window explanations use the
   adjacent info button below, so every kind of help has one predictable home. */
export function installControlHelp(root = document) {
  if (document.getElementById('controlHelp')) return;
  const tip = el('div', 'control-help', document.body); tip.id = 'controlHelp'; tip.hidden = true;
  tip.setAttribute('role', 'tooltip');
  let owner = null, hoverTimer = 0, pending = null;
  function cancelHover() { if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = 0; } pending = null; }
  function close() { cancelHover(); if (owner) owner.removeAttribute('aria-describedby'); owner = null; tip.hidden = true; }
  const adopt = (node) => {
    if (!(node instanceof Element)) return;
    const nodes = [node, ...node.querySelectorAll('[title]')];
    for (const n of nodes) {
      if (!n.hasAttribute('title')) continue;
      const copy = (n.getAttribute('title') || '').trim();
      if (!copy) { n.removeAttribute('title'); n.removeAttribute('data-help'); if (n === owner) close(); continue; }
      n.dataset.help = copy; n.removeAttribute('title');
      if (!n.getAttribute('aria-label') && /^(BUTTON|INPUT|SELECT|CANVAS)$/.test(n.tagName) && !n.textContent.trim()) n.setAttribute('aria-label', copy);
    }
  };
  const open = (node) => {
    const copy = node?.dataset?.help; if (!copy || document.body.classList.contains('control-hints-off')) return;
    close(); owner = node; tip.textContent = copy; tip.hidden = false; node.setAttribute('aria-describedby', tip.id);
    const r = node.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tip.style.top = (r.bottom + h + 8 <= innerHeight ? r.bottom + 7 : Math.max(8, r.top - h - 7)) + 'px';
  };
  adopt(root.documentElement || root);
  new MutationObserver((records) => { for (const r of records) { if (r.type === 'attributes') adopt(r.target); else for (const n of r.addedNodes) adopt(n); } })
    .observe(root.documentElement || root, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });
  root.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse' || document.body.classList.contains('control-hints-off')) return; const n = e.target.closest?.('[data-help]'); if (!n || n === owner || n === pending) return; close(); pending=n; hoverTimer=setTimeout(()=>{hoverTimer=0;const target=pending;pending=null;if(target?.isConnected&&target.matches(':hover'))open(target);},HELP_HOVER_DELAY); });
  root.addEventListener('pointerout', (e) => { const n=e.target.closest?.('[data-help]'); if(n && !n.contains(e.relatedTarget) && (n===owner||n===pending))close(); });
  root.addEventListener('focusin', (e) => { const n = e.target.closest?.('[data-help]'); if (n) open(n); });
  root.addEventListener('focusout', (e) => { if (owner && owner.contains(e.target) && !owner.contains(e.relatedTarget)) close(); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && owner) close(); });
  addEventListener('resize', close, { passive: true }); addEventListener('scroll', close, { passive: true, capture: true });
  root.addEventListener('controlhintschange', close);
}

export function consolidateWindowHelp(root = document) {
  for (const card of root.querySelectorAll('.dev')) {
    if (card.querySelector(':scope > .dev-head .window-help')) continue;
    const sources = [...card.querySelectorAll('.note:not(.link-note)')]
      .filter((n) => !n.closest('.native-info') && n.textContent.trim());
    if (!sources.length) continue;
    const book = el('div', 'window-help-book');
    for (const n of sources) book.appendChild(n);
    const name = card.querySelector('.dev-eyebrow')?.textContent.trim() || 'Window';
    const control = infoPanel(book, name + ' help'); control.classList.add('window-help');
    card.querySelector('.dev-util')?.prepend(control);
  }
}

export function planeModel(host, { getNormal, getPosition = () => 0, onTurn }) {
  const cv = el('canvas', 'plane-model', host); cv.width = 400; cv.height = 280; cv.tabIndex = 0;
  cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Slice sphere and plane. Drag or use arrow keys to rotate; Home resets.');
  cv.title = 'Orient the plane. Shift gives finer motion; Home resets.';
  const unit = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const project = p => [200+85*Math.SQRT1_2*(p[0]-p[1]),140+85*((p[0]+p[1])/Math.sqrt(6)-p[2]*Math.sqrt(2/3))];
  let lastX = NaN, lastY = NaN, lastZ = NaN, lastPos = NaN, lastTheme = '', lastCard = '', lastAccent = '';
  function paint(force = false) {
    const raw=getNormal(),len=Math.hypot(...raw)||1,nx=raw[0]/len,ny=raw[1]/len,nz=raw[2]/len,pos=getPosition();
    const theme=document.body.dataset.theme||'',card=document.body.dataset.card||'',accent=document.documentElement.style.getPropertyValue('--acc');
    if(!force && Object.is(nx,lastX) && Object.is(ny,lastY) && Object.is(nz,lastZ) && Object.is(pos,lastPos) && theme===lastTheme && card===lastCard && accent===lastAccent)return false;
    if(cv.clientWidth<2){lastX=lastY=lastZ=lastPos=NaN;return false;}
    lastX=nx;lastY=ny;lastZ=nz;lastPos=pos;lastTheme=theme;lastCard=card;lastAccent=accent;
    const n=[nx,ny,nz];
    const g = cv.getContext('2d'), css = getComputedStyle(cv), ink = css.getPropertyValue('--fg').trim(), cssAccent = css.getPropertyValue('--acc').trim();
    g.clearRect(0,0,400,280); g.strokeStyle = ink; g.globalAlpha = .25; g.lineWidth = 1.4;
    g.beginPath();g.arc(200,140,85,0,Math.PI*2);g.stroke();
    for (let axis=0;axis<3;axis++) { g.beginPath(); for(let j=0;j<=96;j++){ const a=j*Math.PI/48,p=[0,0,0];p[(axis+1)%3]=Math.cos(a);p[(axis+2)%3]=Math.sin(a);const q=project(p);j?g.lineTo(...q):g.moveTo(...q); }g.stroke(); }
    const u=unit(cross(n,Math.abs(n[2])<.9?[0,0,1]:[0,1,0])),v=cross(n,u);
    g.beginPath(); for(const [i,j] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const p=project(n.map((a,k)=>a*pos+.8*(u[k]*i+v[k]*j)));g.lineTo(...p);}g.closePath();g.globalAlpha=.22;g.fillStyle=cssAccent;g.fill();g.globalAlpha=1;g.strokeStyle=cssAccent;g.stroke();
    g.beginPath();g.moveTo(...project(n.map(a=>a*pos)));g.lineTo(...project(n.map(a=>a*(pos+.8))));g.stroke();
    g.fillStyle=ink;g.font='18px sans-serif';for(const [i,label] of ['X','Y','Z'].entries()){const p=[0,0,0];p[i]=1.18;g.fillText(label,...project(p));}
  }
  function turn(dx,dy) { const n=unit(getNormal()),a=Math.atan2(n[1],n[0])+dx,b=Math.max(-Math.PI/2+.001,Math.min(Math.PI/2-.001,Math.asin(n[2])+dy));onTurn([Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)]);paint(true); }
  let drag=null;
  cv.addEventListener('pointerdown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;drag=[e.clientX,e.clientY];try{cv.setPointerCapture(e.pointerId);}catch(_){}cv.focus();});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const gain=e.shiftKey?.003:.015;turn((e.clientX-drag[0])*gain,(drag[1]-e.clientY)*gain);drag=[e.clientX,e.clientY];});
  for(const type of ['pointerup','pointercancel'])cv.addEventListener(type,()=>{drag=null;});
  cv.addEventListener('keydown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;const k=e.shiftKey?.015:.1;if(e.key==='Home'){onTurn([0,0,1]);paint(true);}else if(e.key.startsWith('Arrow'))turn(e.key==='ArrowLeft'?-k:e.key==='ArrowRight'?k:0,e.key==='ArrowUp'?k:e.key==='ArrowDown'?-k:0);else return;e.preventDefault();});
  new ResizeObserver(()=>paint(true)).observe(cv); paint(true); return { root:cv, paint };
}

export function reworkNative({ ui, mat, repaint, modHost, cadence, setCadence, arm }) {
  const ids=['spectrum','state','palette','observer','camera','clip','slice','settings'];
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
    matte.disabled=![1,3,6].includes(mat.style);matte.title=matte.disabled?'This shape has no surface lighting to remove':'Unlit surface colour';
    glass.disabled=mat.style===6;glass.title=glass.disabled?'SHELL already uses translucent glass':'Use a translucent highlighted finish';
    if((mat.finish==='matte'&&matte.disabled)||(mat.finish==='glass'&&glass.disabled)){mat.finish='lit';finish.set('lit');}
  };
  const setStyle=ui.styleSeg.set;ui.styleSeg.set=v=>{setStyle(v);syncFinish();};
  ui.styleSeg.root.addEventListener('click',syncFinish);ui.styleSeg.root.addEventListener('keydown',syncFinish);syncFinish();

  const waveHelp=[...wave.querySelectorAll('.note:not(.link-note), .sturm-note, .sp-fx')];
  const waveRows=[['spaceSeg'],['viewSeg'],['expK','softK','hueK'],['styleSeg'],['finishSeg'],['isoK','grainK','kneeK'],['ditherSeg','ditherK']];
  const flat=document.createDocumentFragment();
  for(const [i,names] of waveRows.entries()){const r=el('div','row tight wave-row wave-row-'+i,flat);for(const name of names)r.appendChild(ui[name].root);}
  wave.replaceChildren(flat);for(const n of waveHelp)wave.appendChild(n);
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
  let showWindowInfo=true;try{showWindowInfo=localStorage.getItem('lw-window-info')!=='off';}catch(_){}
  const applyWindowInfo=on=>{document.body.classList.toggle('window-info-off',!on);
    if(!on){for(const p of document.querySelectorAll('.native-info-content:popover-open'))p.hidePopover();document.querySelectorAll('.native-info-button').forEach(b=>b.setAttribute('aria-expanded','false'));}
    try{localStorage.setItem('lw-window-info',on?'on':'off');}catch(_){}
  };
  ui.setWindowInfo=applyWindowInfo;
  ui.windowInfoSw=sw({label:'HELP',value:showWindowInfo,title:'Show window help buttons',onChange:applyWindowInfo});applyWindowInfo(showWindowInfo);
  row('appearance',['themeSeg']);row('appearance',['cardSeg']);row('appearance',['frostSeg']);row('appearance',['discSw','blurK']);row('appearance',['accA','accB','vivid']);
  row('display',['badgesSw','controlHintsSw','capSw','windowInfoSw']);ui.windowInfoSw.root.parentElement.classList.add('settings-status-grid');row('display',['frameModeSeg','axisModeSeg','axisInkSeg']);row('display',['stageK','gammaK']);row('display',['gamutToggle','p3Seg']);
  const quality=ui.gridSeg.root.closest('.grp');if(quality)pages.quality.appendChild(quality);
  const actions=el('div','row tight settings-actions',pages.appearance);
  for(const g of oldGroups)for(const b of g.querySelectorAll(':scope > .row > .trig')){if(b.textContent.includes('SHOW THE WARNING'))b.querySelector('.trig-l').textContent='WARNING';actions.appendChild(b);}
  const help=el('div','settings-help',pages.appearance);
  for(const g of oldGroups){if(g===quality)continue;for(const n of g.querySelectorAll('.note:not(.link-note), .sturm-note'))help.appendChild(n);g.remove();}
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
  expand.addEventListener('pointerdown',e=>{if(e.button)return;tempoDrag={y:e.clientY,bpm:M.transport.bpm,moved:false,touch:e.pointerType==='touch'};try{expand.setPointerCapture(e.pointerId);}catch(_){}});
  expand.addEventListener('pointermove',e=>{if(!tempoDrag)return;const dy=tempoDrag.y-e.clientY;if(!tempoDrag.moved&&Math.abs(dy)<4)return;tempoDrag.moved=true;const travel=tempoDrag.touch?300:220;C.setBpm(tempoDrag.bpm+dy/travel*(M.BPM_MAX-M.BPM_MIN));sync();});
  const endTempoDrag=()=>{if(!tempoDrag)return;if(tempoDrag.moved){tempoDragged=true;ui.saveNative();}tempoDrag=null;};
  expand.addEventListener('pointerup',endTempoDrag);expand.addEventListener('pointercancel',()=>{tempoDrag=null;});
  expand.addEventListener('click',()=>{if(tempoDragged){tempoDragged=false;return;}toggleTempo();});
  expand.addEventListener('keydown',e=>{const step=e.shiftKey?.1:e.code.startsWith('Page')?10:1;const dir=e.code==='ArrowUp'||e.code==='ArrowRight'||e.code==='PageUp'?1:e.code==='ArrowDown'||e.code==='ArrowLeft'||e.code==='PageDown'?-1:0;if(!dir)return;e.preventDefault();C.setBpm(M.transport.bpm+dir*step);sync();ui.saveNative();});
  const bpmField=el('div','native-tempo-field',panel);
  const bpm=el('input','native-bpm',bpmField);bpm.type='number';bpm.min=String(M.BPM_MIN);bpm.max=String(M.BPM_MAX);bpm.step='.1';bpm.setAttribute('aria-label','Tempo in beats per minute');bpm.title='BPM';
  el('span','native-tempo-unit',bpmField,'BPM');
  const hzGroup=el('div','native-tempo-hz',bpmField);const hz=el('span','',hzGroup);hzGroup.appendChild(repeatInfo);
  const play=trig({label:'MOD PLAY',title:'Play/pause modulation independently of physics',onFire:()=>{arm(true);C.toggle(performance.now()/1000);sync();}});panel.appendChild(play.root);
  bpm.addEventListener('change',()=>{if(Number.isFinite(bpm.valueAsNumber))C.setBpm(bpm.valueAsNumber);sync();ui.saveNative();});
  let taps=[];panel.appendChild(trig({label:'TAP',onFire:()=>{const r=M.tapTempo(taps,performance.now());taps=r.taps;if(r.bpm)C.setBpm(r.bpm);sync();ui.saveNative();}}).root);
  const syncB=trig({label:'WALL',onFire:()=>{C.setSync(M.syncMode()==='wall'?'free':'wall');sync();ui.saveNative();}});panel.appendChild(syncB.root);
  const cad=trig({label:'60 Hz',onFire:()=>{setCadence(cadence()===120?60:120);sync();}});panel.appendChild(cad.root);
  const holds=['1/4','1'].map(note=>{const b=trig({label:'HOLD '+note,onFire:()=>{if(M.transport.hold&&M.transport.holdNote===note)C.release();else{if(M.transport.hold)C.release();C.hold(note);}sync();}});panel.appendChild(b.root);return b;});
  function sync(){const n=M.transport.bpm.toFixed(M.transport.bpm<100?1:0),rate=(M.transport.bpm/60).toFixed(2)+' Hz';tempoNum.textContent=n;tempoHz.textContent=rate;hz.textContent=rate;expand.setAttribute('aria-label',n+' beats per minute. Drag vertically to change; press to show tempo controls');expand.setAttribute('aria-valuemin',String(M.BPM_MIN));expand.setAttribute('aria-valuemax',String(M.BPM_MAX));expand.setAttribute('aria-valuenow',String(M.transport.bpm));expand.setAttribute('aria-valuetext',n+' BPM, '+rate);if(document.activeElement!==bpm)bpm.value=String(Math.round(M.transport.bpm*10)/10);syncB.root.querySelector('.trig-l').textContent=M.syncMode().toUpperCase();cad.root.querySelector('.trig-l').textContent=cadence()+' Hz';holds.forEach((b,i)=>{const on=M.transport.hold&&M.transport.holdNote===['1/4','1'][i];b.root.classList.toggle('on',on);b.root.setAttribute('aria-pressed',String(!!on));});play.on=C.isPlaying();play.setLabel(C.isPlaying()?'MOD PAUSE':'MOD PLAY');}
  sync();
  const select=e=>{if(e.target.closest('#modwin')){document.querySelector('.native-selected')?.classList.remove('native-selected');return;}const d=e.target.closest('.dev');if(!d||d.classList.contains('mir-modwindow'))return;document.querySelector('.native-selected')?.classList.remove('native-selected');d.classList.add('native-selected');};document.addEventListener('pointerdown',select);document.addEventListener('focusin',select);
  consolidateWindowHelp();
  installControlHelp();
}
