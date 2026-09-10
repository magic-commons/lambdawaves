/* Native window composition. Deliberately excludes the modulation plugin. */
import { el, seg, sw, trig, chip, gripDots } from './kit.js';
import { buildMacroSlot } from './mir/modwindow/modwindow.js';   // the window's own slot builder: the transport's tiles are its rows, faces hidden

const HELP_HOVER_DELAY = 600;

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
  root.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse' || document.body.classList.contains('control-hints-off')) return; if (e.buttons) return; const n = e.target.closest?.('[data-help]'); if (!n || n === owner || n === pending) return; close(); pending=n; hoverTimer=setTimeout(()=>{hoverTimer=0;const target=pending;pending=null;if(target?.isConnected&&target.matches(':hover'))open(target);},HELP_HOVER_DELAY); });
  root.addEventListener('pointerout', (e) => { const n=e.target.closest?.('[data-help]'); if(n && !n.contains(e.relatedTarget) && (n===owner||n===pending))close(); });
  root.addEventListener('focusin', (e) => { const n = e.target.closest?.('[data-help]'); if (n) open(n); });
  root.addEventListener('focusout', (e) => { if (owner && owner.contains(e.target) && !owner.contains(e.relatedTarget)) close(); });
  /* A HAND ON A CONTROL CLOSES THE HINT (Josh, 2026-09-10): a press, a drag, a wheel or a key that operates
     the control means the reader is done reading. It stays closed until the pointer leaves and returns. */
  root.addEventListener('pointerdown', () => close(), { capture: true });
  root.addEventListener('wheel', () => close(), { capture: true, passive: true });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (owner) close(); return; } if (owner && !/^(Tab|Shift|Control|Alt|Meta)$/.test(e.key)) close(); });
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
  /* Two small rotations about the world X and Y axes, not azimuth/elevation: the old parametrisation was
     degenerate at the pole, which is exactly where the plane STARTS (normal = z), so a horizontal drag did
     nothing and an upward one was clamped — "the control is not sliding the plane". Every drag now tilts. */
  function turn(dx,dy) { let [x,y,z]=unit(getNormal());
    let cy=Math.cos(dy),sy=Math.sin(dy); [y,z]=[y*cy-z*sy, y*sy+z*cy];            // about X: a vertical drag tips the plane forward/back
    let cx=Math.cos(dx),sx=Math.sin(dx); [x,z]=[x*cx+z*sx, -x*sx+z*cx];           // about Y: a horizontal drag tips it left/right
    onTurn(unit([x,y,z]));paint();paint(true); }
  let drag=null;
  cv.addEventListener('pointerdown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;drag=[e.clientX,e.clientY];try{cv.setPointerCapture(e.pointerId);}catch(_){}cv.focus();});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const gain=e.shiftKey?.003:.015;turn((e.clientX-drag[0])*gain,(drag[1]-e.clientY)*gain);drag=[e.clientX,e.clientY];});
  for(const type of ['pointerup','pointercancel'])cv.addEventListener(type,()=>{drag=null;});
  cv.addEventListener('keydown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;const k=e.shiftKey?.015:.1;if(e.key==='Home'){onTurn([0,0,1]);paint(true);}else if(e.key.startsWith('Arrow'))turn(e.key==='ArrowLeft'?-k:e.key==='ArrowRight'?k:0,e.key==='ArrowUp'?k:e.key==='ArrowDown'?-k:0);else return;e.preventDefault();});
  new ResizeObserver(()=>paint(true)).observe(cv); paint(true); return { root:cv, paint };
}

export function reworkNative({ ui, mat, repaint, modHost, modApi, cadence, setCadence, arm }) {
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
  // Row indices are part of the skin (wave-row-2 and wave-row-6 have their own rules), so the material knobs
  // merge into row 2 and row 5 is simply absent: ISO, GRAIN and KNEE sit under EXPOSURE, SOFT and HUE (Josh, 2026-09-10).
  const waveRows=[[0,['spaceSeg']],[1,['viewSeg']],[2,['expK','softK','hueK','isoK','grainK','kneeK']],[3,['styleSeg']],[4,['finishSeg']],[6,['ditherSeg','ditherK']]];
  const flat=document.createDocumentFragment();
  for(const [i,names] of waveRows){const r=el('div','row tight wave-row wave-row-'+i,flat);for(const name of names)r.appendChild(ui[name].root);}
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
     carries the tempo (drag, arrows, TAP). In its place is the LAW the two clocks were missing — LINK: the
     modulation clock follows the transport, no in-between state; FREE: it runs on its own MOD PLAY. */
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
  /* THE LAW OF THE TWO CLOCKS. Linked, the modulation clock is a follower of the transport — rack.js
     holds it there every frame, so there is no state where one runs and the other does not. Free, the
     modulation clock is its own instrument: MOD PLAY starts and stops it, the transport does not. */
  const linkB=trig({label:'LINKED',title:'Modulation clock follows the transport (LINKED) or runs on its own MOD PLAY (SEPARATE)',onFire:()=>{ui.setClockLink(!ui.clockLink());sync();ui.saveNative();}});grid.appendChild(linkB.root);
  const play=trig({label:'MOD ▶',title:'Play/pause the modulation clock on its own (SEPARATE only)',onFire:()=>{if(ui.clockLink())return;const want=!C.isPlaying();arm(true);const r=want?C.play(performance.now()/1000):C.pause(performance.now()/1000);   // decide BEFORE arming: arming while the transport plays starts the clock itself, and a blind toggle then stopped it again
    play.root.title=r&&r.ok===false?'Nothing to run — add a source in the modulation window':'Play/pause the modulation clock on its own (SEPARATE only)';sync();}});grid.appendChild(play.root);
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
  function sync(){const n=M.transport.bpm.toFixed(M.transport.bpm<100?1:0),rate=(M.transport.bpm/60).toFixed(2)+' Hz';tempoNum.textContent=n;tempoHz.textContent=rate;expand.setAttribute('aria-label',n+' beats per minute. Drag vertically to change; press to show tempo controls');expand.setAttribute('aria-valuemin',String(M.BPM_MIN));expand.setAttribute('aria-valuemax',String(M.BPM_MAX));expand.setAttribute('aria-valuenow',String(M.transport.bpm));expand.setAttribute('aria-valuetext',n+' BPM, '+rate);syncB.root.querySelector('.trig-l').textContent=M.syncMode().toUpperCase();cad.root.querySelector('.trig-l').textContent=cadence()+' Hz';holds.forEach((b,i)=>{const on=M.transport.hold&&M.transport.holdNote===['1/4','1'][i];b.root.classList.toggle('on',on);b.root.setAttribute('aria-pressed',String(!!on));});const linked=ui.clockLink();linkB.root.classList.toggle('on',linked);linkB.root.setAttribute('aria-pressed',String(linked));linkB.setLabel(linked?'LINKED':'SEPARATE');play.root.disabled=linked;play.on=C.isPlaying();play.setLabel(C.isPlaying()?'MOD ❚❚':'MOD ▶');for(const {b,label} of bends){const on=bend.which===label;b.root.classList.toggle('on',on);b.root.setAttribute('aria-pressed',String(on));}if(!panel.hidden)syncMacros();}
  sync();
  const select=e=>{if(e.target.closest('#modwin')){document.querySelector('.native-selected')?.classList.remove('native-selected');return;}const d=e.target.closest('.dev');if(!d||d.classList.contains('mir-modwindow'))return;document.querySelector('.native-selected')?.classList.remove('native-selected');d.classList.add('native-selected');};document.addEventListener('pointerdown',select);document.addEventListener('focusin',select);
  consolidateWindowHelp();
  installControlHelp();
}
