// Focused acceptance for the current native app, independent of historical layouts.
// Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
import assert from 'node:assert/strict';
import { open } from '../tools/gate/gatekit.mjs';
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width:1500,height:1100,script:20000 });
let failed = false;
try {
 assert.equal((await g.waitFor('window.__LW&&__LW.ready',150,100)).ok,1);
 const boot = await g.ev(`const workers=__LW.maths.started,period=__LW.period;return {errors:__e,dirty:__LW.layout.projects.dirty,gpu:__LW.field.error||null,workers,period,workersAfterPeriod:__LW.maths.started,
  heliumComputed:__LW.helium.computed,ladderComputed:__LW.ladder.computed,moCurveDone:__LW.mo.state().curveDone}`);
 assert.deepEqual(boot.errors,[]); assert.equal(boot.dirty,false);
 assert.deepEqual(boot.workers,{bow:false,scan:false,cards:false});
 assert.equal(boot.period.exact,true); assert.deepEqual(boot.workersAfterPeriod,{bow:false,scan:false,cards:false});
 assert.equal(boot.heliumComputed,false);assert.equal(boot.ladderComputed,false);assert.equal(boot.moCurveDone,0);
 console.log('PASS current boot: no page errors, clean new project');
 console.log('GPU status:',boot.gpu || 'available');
 const spectrumHelp=await g.ev(`const card=document.querySelector('.dev[data-id="spectrum"]'),fx=card.querySelector('.sp-fx'),book=card.querySelector('.window-help-book'),button=card.querySelector('.window-help .native-info-button');
  return {inHelp:!!book&&fx.parentElement===book,hidden:!!book&&!book.matches(':popover-open'),button:!!button,bodyFree:!card.querySelector(':scope > .dev-body > .sp-fx')};`);
 assert.deepEqual(spectrumHelp,{inHelp:true,hidden:true,button:true,bodyFree:true});
 console.log('PASS Spectrum coefficient details live in the window help surface');
 const lazy=await g.ev(`const ids=['helium','h2','ladder','molecule'];ids.forEach(id=>__LW.layout.reopen(id,'R'));
  const immediate={loading:Object.fromEntries(ids.map(id=>[id,document.querySelector('.dev[data-id="'+id+'"]').classList.contains('loading')])),busy:__LW.busy.count,
    centered:ids.every(id=>!!document.querySelector('.dev[data-id="'+id+'"] .dev-loading .mark'))};
  await Promise.all([__LW.helium.prepare(),__LW.h2.prepare(),__LW.ladder.prepare(),__LW.mo.whenReady()]);
  const done={helium:__LW.helium.computed,h2:__LW.h2.curveReady,ladder:__LW.ladder.computed,mo:__LW.mo.state().curveDone,
    loading:ids.some(id=>document.querySelector('.dev[data-id="'+id+'"]').classList.contains('loading')),errors:__e};
  ids.forEach(id=>document.querySelector('.dev[data-id="'+id+'"]').classList.add('closed'));return {immediate,done}`);
 assert.deepEqual(lazy.immediate.loading,{helium:true,h2:true,ladder:true,molecule:true});assert.ok(lazy.immediate.busy>0);assert.equal(lazy.immediate.centered,true);
 assert.deepEqual(lazy.done,{helium:true,h2:true,ladder:true,mo:40,loading:false,errors:[]});
 console.log('PASS multi-add queues every heavy card with local and cursor loading states');
 const persistence = await g.ev(`const p=__LW.layout.projects,n=__LW.layout.notebook;
  p.save('acceptance/new');const clean=!p.dirty;n.subtitle='edited subtitle';const dirty=p.dirty;
  p.save('acceptance/new');const original=Storage.prototype.setItem;let removed;
  Storage.prototype.setItem=function(){throw new Error('quota test')};
  try{removed=p.remove('acceptance/new')}finally{Storage.prototype.setItem=original}
  return {clean,dirty,removed,current:p.current,exists:p.list().some(x=>x.path==='acceptance/new')}`);
 assert.deepEqual(persistence,{clean:true,dirty:true,removed:false,current:'acceptance/new',exists:true});
 console.log('PASS new projects: subtitle dirty tracking and failed deletion preserves current project');
 const opened=await g.ev(`const p=__LW.layout.projects,n=__LW.layout.notebook;n.text='saved notebook';p.save('acceptance/new');n.text='temporary edit';const ok=p.open('acceptance/new');return {ok,text:n.text,subtitle:n.subtitle,dirty:p.dirty}`);
 assert.deepEqual(opened,{ok:true,text:'saved notebook',subtitle:'edited subtitle',dirty:false});
 console.log('PASS new project save/open round trip restores notes and subtitle');
 const longNotebook=await g.ev(`const p=__LW.layout.projects,n=__LW.layout.notebook;
  const text=Array.from({length:30},(_,i)=>'## Section '+(i+1)+'\\n\\nParagraph '+(i+1)).join('\\n\\n');
  n.text=text;p.save('acceptance/long-notebook');n.text='temporary';p.open('acceptance/long-notebook');
  const view=document.querySelector('#notebook .nb-view');return {last:n.html.includes('Section 30'),more:!!view.querySelector('.nb-more'),scrolls:view.scrollHeight>view.clientHeight};`);
 assert.deepEqual(longNotebook,{last:true,more:false,scrolls:true});
 console.log('PASS project landing renders the complete Markdown notebook and scrolls instead of clipping it');
 const malformed = await g.ev(`const key='lambdawaves.q0.projects',old=localStorage.getItem(key);try{
  localStorage.setItem(key,'{"items":null}');const list=__LW.layout.projects.list();
  const saved=__LW.layout.projects.save('must-not-overwrite');
  return {list,saved,stored:localStorage.getItem(key)};
 }finally{localStorage.setItem(key,old)}`);
 assert.deepEqual(malformed,{list:[],saved:false,stored:'{"items":null}'});
 const math = await g.ev(`const n=__LW.layout.notebook,k=window.katex;try{
  window.katex=undefined;const html=n.render('$<img src=x onerror="alert(1)">$');
  const t=document.createElement('template');t.innerHTML=html;
  return {images:t.content.querySelectorAll('img').length,text:t.content.textContent};
 }finally{window.katex=k}`);
 assert.equal(math.images,0); assert.match(math.text,/<img/);
 console.log('PASS malformed storage and unavailable math renderer fail safely');
 const notebook = await g.ev(String.raw`const {renderNotebook}=await import('./notebook-render.js');
  const inspect=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content};
  const attack='<a title="$x$" href="java&#9;script:alert(1)" onclick=bad()>link</a><img src=x onerror=bad()><svg onload=bad()></svg><script>bad()</script><input type=checkbox>';
  const safe=inspect(renderNotebook(attack));
  const formula=inspect(renderNotebook('Before $x^2$ and $$y^2$$ after'));
  const attr=inspect(renderNotebook('<span class="$x$">text</span>',{katex:{renderToString(){return '<b>math</b>'}}}));
  const fallback=inspect(renderNotebook('$<img src=x onerror=bad()>$',{katex:null}));
  const injected=inspect(renderNotebook("<span title='$\" onmouseover=\"bad()$'>text</span>",{katex:null}));
  const missing=inspect(renderNotebook('<script>bad()</script>',{marked:null}));
  return {unsafe:safe.querySelectorAll('script,svg,[onclick],[onerror],[onload],a[href]').length,
    title:safe.querySelector('a').title,disabled:safe.querySelector('input').disabled,
    inline:formula.querySelectorAll('.katex').length,display:formula.querySelectorAll('.katex-display').length,
    text:formula.textContent.includes('Before')&&formula.textContent.includes('after'),
    attribute:attr.querySelector('span').getAttribute('class'),attributeElements:attr.querySelectorAll('b').length,
    injectedHandlers:injected.querySelectorAll('[onmouseover]').length,
    fallbackImages:fallback.querySelectorAll('img').length,missingText:missing.textContent};`);
 assert.deepEqual(notebook,{unsafe:0,title:'$x$',disabled:true,inline:2,display:1,text:true,
  attribute:'$x$',attributeElements:0,injectedHandlers:0,fallbackImages:0,missingText:'<script>bad()</script>'});
 console.log('PASS notebook renderer: sanitized markup, inline/display math, literal attributes and safe parser fallback');
 await g.ev(`__LW.layout.modulation.expand();await new Promise(r=>setTimeout(r,150));document.querySelector('.m2numseat').focus();return true`);
 await g.press('\uE012');
 const depth=await g.ev(`return document.querySelector('.m2numseat').getAttribute('aria-valuenow')`);
 assert.equal(Number(depth),99);
 await g.ev(`document.querySelector('.m2railhead').click();document.querySelector('.m2numseat').focus();return true`);
 await g.press('\uE014');
 const macro=await g.ev(`const value=document.querySelector('.m2numseat').getAttribute('aria-valuenow');__LW.layout.modulation.collapse();__LW.layout.modulation.expand();return {value,reopened:document.querySelector('.m2numseat').getAttribute('aria-valuenow'),errors:__e}`);
 // Since a5c0863 folding the rail does not repurpose the seat: it still edits depth (99 → 100), and the
 // value survives a collapse/expand. The macro VALUE is the rail's own control, not this seat's.
 assert.equal(Number(macro.value),100); assert.equal(macro.reopened,macro.value);assert.deepEqual(macro.errors,[]);
 console.log('PASS macro keyboard: the seat edits depth folded or not, and close/reopen keeps it; no page errors');
 const audioFace=await g.ev(`const M=__LW.mod.model,w=n=>new Promise(r=>setTimeout(r,n));M.deserialize(null);__LW.mod.addSource('audio');await w(250);const audio=M.sourceList().find(s=>s.kind==='audio');
  const card=document.querySelector('.m2dev.audio'),rows=[...card.querySelectorAll('.aud-range-row')];
  const rowBoxes=rows.map(e=>e.getBoundingClientRect()),trackBoxes=rows.map(e=>e.querySelector('.aud-range-track').getBoundingClientRect()),mixBoxes=rows.map(e=>e.querySelector('.aud-level-mix').getBoundingClientRect()),ringBoxes=rows.map(e=>e.querySelector('.m2depthring').getBoundingClientRect());
  const level=card.querySelector('[data-band="level"]'),track=level.querySelector('.aud-range-track'),lower=level.querySelector('.aud-range-handle.lower'),upper=level.querySelector('.aud-range-handle.upper');
  const routeEls=Object.fromEntries(['level','hit','low','mid','high'].map(k=>[k,card.querySelector('.m2audout[data-out="'+k+'"]')])),routeBoxes=Object.fromEntries(Object.entries(routeEls).map(([k,e])=>[k,e.getBoundingClientRect()]));
  const routeGeometry=e=>{const box=e.getBoundingClientRect(),name=e.querySelector('.m2audname').getBoundingClientRect(),slot=e.querySelector('.m2audslot').getBoundingClientRect(),led=e.querySelector('.m2audled').getBoundingClientRect();return {box,name,slot,led}};
  const routesAligned=els=>Object.values(els).every(e=>{const q=routeGeometry(e),cx=q.box.left+q.box.width/2,lamp=q.box.left+q.box.width/4;return Math.abs(q.name.left+q.name.width/2-cx)<.1&&Math.abs(q.slot.left+q.slot.width/2-cx)<.1&&q.name.top<q.slot.top&&Math.abs(q.led.left+q.led.width/2-lamp)<.1});
  const probe=document.createElement('i');card.append(probe);probe.style.background='var(--acc)';const accA=getComputedStyle(probe).backgroundColor;probe.style.background='var(--acc2)';const accB=getComputedStyle(probe).backgroundColor;probe.remove();
  const ott={mixers:card.querySelectorAll('.aud-level-mix-dial').length,valuesHidden:rows.every(e=>getComputedStyle(e.querySelector('.aud-range-value')).opacity==='0'),
    macroArc:rows.every(e=>e.querySelector('.aud-level-mix-dial>.m2depthring>.m2depthtrack')&&e.querySelector('.aud-level-mix-dial>.m2depthring>.m2deptharc')),openArc:rows.every(e=>parseFloat(getComputedStyle(e.querySelector('.m2deptharc')).strokeDasharray)<1),
    equalRows:new Set(rowBoxes.map(b=>Math.round(b.height*10))).size===1&&new Set(trackBoxes.map(b=>Math.round(b.width))).size===1&&new Set(trackBoxes.map(b=>Math.round(b.height))).size===1,
    stacked:rowBoxes.every((b,i)=>i===0||b.y>rowBoxes[i-1].y)&&new Set(rowBoxes.map(b=>Math.round(b.x))).size===1,
    aligned:rows.every((e,i)=>Math.abs((ringBoxes[i].y+ringBoxes[i].height/2)-(trackBoxes[i].y+trackBoxes[i].height/2))<.1),
    labelsAfter:rows.every((e,i)=>e.querySelector('.aud-range-name').getBoundingClientRect().left>=trackBoxes[i].right),
    shortLabels:rows.map(e=>e.querySelector('.aud-range-short').textContent).join('')==='ALMH'&&rows.every(e=>getComputedStyle(e.querySelector('.aud-range-full')).display==='none'),
    longMeters:trackBoxes.every(b=>b.width>=220&&b.height>=24),sourceNarrow:[...card.querySelectorAll('.m2audsrc')].every(e=>e.getBoundingClientRect().width<70),
    border:getComputedStyle(track).borderTopWidth,clearTrack:getComputedStyle(track).backgroundColor==='rgba(0, 0, 0, 0)',live:getComputedStyle(level.querySelector('.aud-range-output')).backgroundColor,
    noPeakDots:rows.every(e=>getComputedStyle(e.querySelector('.aud-range-input')).display==='none'),rangeColor:getComputedStyle(level.querySelector('.aud-range-zone')).backgroundColor,
    palette:getComputedStyle(level.querySelector('.aud-range-output')).backgroundColor===accA&&getComputedStyle(lower).color===accA&&getComputedStyle(upper).color===accA&&getComputedStyle(card.querySelector('.m2audsrc')).color===accB&&accA!==accB,
    routingFour:Math.round(routeBoxes.level.x)===Math.round(routeBoxes.hit.x)&&routeBoxes.level.y<routeBoxes.hit.y&&routeBoxes.level.x<routeBoxes.low.x&&routeBoxes.low.x<routeBoxes.mid.x&&routeBoxes.mid.x<routeBoxes.high.x,
    routingBand:Math.abs(routeBoxes.low.height-44)<1&&Math.abs(routeBoxes.level.height-22)<1&&Math.abs(routeBoxes.hit.height-22)<1&&['level','low','mid','high'].every(k=>Math.abs(routeBoxes[k].width-58)<1),routingSpacing:(()=>{const c=['level','low','mid','high'].map(k=>routeBoxes[k].x+routeBoxes[k].width/2),d=c.slice(1).map((v,i)=>v-c[i]);return Math.max(...d)-Math.min(...d)<.1})(),
    routingPlain:Object.values(routeEls).every(e=>getComputedStyle(e).borderTopWidth==='0px'&&getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)')&&card.querySelectorAll('.m2audgrip svg').length===0,
    routingContentsAligned:routesAligned(routeEls),
    routeNamesNeutral:Object.values(routeEls).every(e=>getComputedStyle(e.querySelector('.m2audname')).color!==accB),audioTitleAccent:getComputedStyle(card.querySelector('.m2kind')).color===accA,
    noHeadStatus:getComputedStyle(card.querySelector('.m2audioheadstate')).display==='none',
    oneGrip:getComputedStyle(card.querySelector('.m2head'),'::before').content==='none'&&Math.round(card.querySelector('.m2grab i').getBoundingClientRect().width)===13};
  card.style.setProperty('--acc','#0b528f');card.style.setProperty('--acc2','#8f520b');await w(250);const paletteLive=getComputedStyle(level.querySelector('.aud-range-output')).backgroundColor;ott.followsPalette=paletteLive!==ott.live&&getComputedStyle(upper).color===paletteLive&&getComputedStyle(card.querySelector('.m2audsrc')).color!==paletteLive&&getComputedStyle(level.querySelector('.aud-range-zone')).backgroundColor!==ott.rangeColor;card.style.removeProperty('--acc');card.style.removeProperty('--acc2');
  lower.focus();await w(250);ott.valuesReveal=getComputedStyle(level.querySelector('.aud-range-value')).opacity==='1';lower.blur();
  const lowMix=card.querySelector('[data-band="low"] .aud-level-mix-dial');lowMix.focus();lowMix.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));
  ott.lowMixHome=M.audioReadout(audio.id).levelMix.low===0;lowMix.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));
  document.querySelector('.m2dev.audio .m2audout[data-out="low"] .m2audmac').click();await w(80);const assignedRoute=document.querySelector('.m2dev.audio .m2audout[data-out="low"]');ott.assignedNumber=assignedRoute.querySelector('.m2audslot').textContent!=='--'&&getComputedStyle(assignedRoute.querySelector('.m2audslot')).color===accB;
  __LW.mod.addSource('lfo');__LW.mod.addSource('env');await w(120);
  const compact=[...document.querySelectorAll('.kwin-chiprail button')].find(e=>e.getAttribute('aria-label')==='COMPACT');compact.click();await w(180);
  const card2=document.querySelector('.m2dev.audio'),knobBoxes=[...card2.querySelectorAll('.m2knobs .m2k')].map(e=>e.getBoundingClientRect()),dialBoxes=[...card2.querySelectorAll('.m2knobs .m2kd')].map(e=>e.getBoundingClientRect()),referenceDialRows=['lfo','env'].map(k=>[...document.querySelectorAll('.m2dev.'+k+' .m2knobs .m2kd')].map(e=>e.getBoundingClientRect().top)),compactRows=[...card2.querySelectorAll('.aud-range-row')],compactTracks=compactRows.map(e=>e.querySelector('.aud-range-track').getBoundingClientRect()),compactRings=compactRows.map(e=>e.querySelector('.m2depthring').getBoundingClientRect()),compactNames=compactRows.map(e=>e.querySelector('.aud-range-name').getBoundingClientRect()),bodyBox=card2.querySelector('.m2body').getBoundingClientRect(),editBox=card2.querySelector('.m2edit').getBoundingClientRect(),sourceBox=card2.querySelector('.m2col').getBoundingClientRect(),routeBox=card2.querySelector('.m2rt').getBoundingClientRect(),compactRoutes=[...card2.querySelectorAll('.m2audout')],sourceButtons=[...card2.querySelectorAll('.m2audsrc')].map(e=>e.getBoundingClientRect());
  const result={allBands:compactRows.every(e=>getComputedStyle(e).display!=='none'),twoByTwo:new Set(knobBoxes.map(b=>Math.round(b.top))).size===2&&new Set(knobBoxes.map(b=>Math.round(b.left))).size===2,
    sideLayout:Math.max(...knobBoxes.map(b=>b.right))<Math.min(...compactTracks.map(b=>b.left))&&sourceBox.right<editBox.left&&routeBox.right<editBox.left&&editBox.height>bodyBox.height-10,
    controlsAboveKnobs:sourceBox.bottom<Math.min(...knobBoxes.map(b=>b.top))&&routeBox.bottom<Math.min(...knobBoxes.map(b=>b.top)),verticalMeters:compactTracks.every(b=>b.height>b.width*10&&b.width>=23)&&compactTracks.every((b,i)=>i===0||b.x>compactTracks[i-1].x),
    compactAligned:compactTracks.every((b,i)=>Math.abs((b.x+b.width/2)-(compactRings[i].x+compactRings[i].width/2))<.1),labelsBottom:compactNames.every((b,i)=>b.top>=compactTracks[i].bottom),shortLabels:compactRows.map(e=>e.querySelector('.aud-range-short').textContent).join('')==='ALMH',
    verticalHandles:compactRows.every(e=>e.querySelector('.aud-range-handle').getAttribute('aria-orientation')==='vertical'),allRoutes:compactRoutes.every(e=>getComputedStyle(e).display==='grid'),compactRouting:(()=>{const q=Object.fromEntries(compactRoutes.map(e=>[e.dataset.out,e.getBoundingClientRect()]));return Math.abs(q.level.width-q.hit.width)<.1&&Math.abs(q.low.width-q.mid.width)<.1&&Math.abs(q.mid.width-q.high.width)<.1&&q.level.y===q.hit.y&&q.low.y===q.mid.y&&q.mid.y===q.high.y&&q.low.y>q.level.y})(),compactRouteContentsAligned:routesAligned(Object.fromEntries(compactRoutes.map(e=>[e.dataset.out,e]))),
    compactKnobRhythm:knobBoxes.every(b=>Math.abs(b.height-70)<.1)&&dialBoxes.every(b=>Math.abs(b.width-48)<.1&&Math.abs(b.height-48)<.1)&&new Set(dialBoxes.map(b=>Math.round(b.top*10))).size===2&&Math.abs(dialBoxes[2].top-dialBoxes[0].top-77)<.1&&referenceDialRows.every(r=>Math.abs(r[0]-dialBoxes[0].top)<.6&&Math.abs(r.at(-1)-dialBoxes.at(-1).top)<.6),
    compactRouteGeometry:(()=>{const q=Object.fromEntries(compactRoutes.map(e=>[e.dataset.out,e.getBoundingClientRect()]));return Math.abs(routeBox.width-164)<.1&&Math.abs(routeBox.height-88)<.1&&Math.abs(q.level.width-82)<.1&&Math.abs(q.hit.width-82)<.1&&Math.abs(q.low.width-164/3)<.1&&Math.abs(q.level.left-routeBox.left)<.1&&Math.abs(q.low.left-routeBox.left)<.1&&Math.abs(q.hit.right-routeBox.right)<.1&&Math.abs(q.high.right-routeBox.right)<.1})(),
    sourcePair:sourceButtons.length===2&&Math.abs(sourceButtons[0].width-sourceButtons[1].width)<.1&&sourceButtons[0].x<sourceButtons[1].x,setVisible:[...card2.querySelectorAll('.m2audsrc')].some(e=>e.textContent.trim()==='SET'&&getComputedStyle(e).display!=='none'),latencyGone:!card2.querySelector('.aud-latency'),
    ott,errors:__e.slice()};
  card2.querySelector('.m2fold').click();await w(100);const mini=document.querySelector('.m2dev.audio .m2audminleds'),visible=()=>[...mini.querySelectorAll('i')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.dataset.out),bands=[...visible()],bandWidths=[...mini.querySelectorAll('i')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().width),bandInk=getComputedStyle(mini.querySelector('[data-out="low"]'),'::after').backgroundColor;
  mini.click();await w(50);const all=[...visible()],allWidth=mini.querySelector('[data-out="level"]').getBoundingClientRect().width,allInk=getComputedStyle(mini.querySelector('[data-out="level"]'),'::after').backgroundColor;__LW.mod.addSource('lfo');await w(100);const rebuilt=document.querySelector('.m2dev.audio .m2audminleds');
  result.mini={bands,bandWidths,bandInk,all,allWidth,allInk,pressed:rebuilt.getAttribute('aria-pressed'),survivesRebuild:rebuilt.classList.contains('is-all'),noCurve:!document.querySelector('.m2dev.audio .m2mintrace'),accent:accA};M.deserialize(null);return result;`);
 assert.equal(audioFace.allBands,true);assert.equal(audioFace.twoByTwo,true);assert.equal(audioFace.sideLayout,true);assert.equal(audioFace.controlsAboveKnobs,true);assert.equal(audioFace.verticalMeters,true);assert.equal(audioFace.compactAligned,true);assert.equal(audioFace.labelsBottom,true);assert.equal(audioFace.shortLabels,true);assert.equal(audioFace.verticalHandles,true);assert.equal(audioFace.allRoutes,true);assert.equal(audioFace.compactRouting,true);assert.equal(audioFace.compactRouteContentsAligned,true);assert.equal(audioFace.compactKnobRhythm,true);assert.equal(audioFace.compactRouteGeometry,true);assert.equal(audioFace.sourcePair,true);assert.equal(audioFace.setVisible,true);assert.equal(audioFace.latencyGone,true);assert.deepEqual(audioFace.errors,[]);
 for(const key of ['macroArc','openArc','equalRows','stacked','aligned','labelsAfter','shortLabels','longMeters','sourceNarrow','clearTrack','noPeakDots','palette','routingFour','routingBand','routingSpacing','routingPlain','routingContentsAligned','routeNamesNeutral','audioTitleAccent','assignedNumber','noHeadStatus','valuesHidden','valuesReveal','lowMixHome','followsPalette','oneGrip'])assert.equal(audioFace.ott[key],true,key);
 assert.equal(audioFace.ott.mixers,4);assert.equal(audioFace.ott.border,'0px');assert.match(audioFace.ott.live,/rgb/);
 assert.deepEqual(audioFace.mini.bands,['low','mid','high']);assert.equal(audioFace.mini.bandWidths.every(w=>Math.abs(w-2)<.1),true);assert.deepEqual(audioFace.mini.all,['level']);assert.equal(Math.abs(audioFace.mini.allWidth-6)<.1,true);assert.equal(audioFace.mini.bandInk,audioFace.mini.accent);assert.equal(audioFace.mini.allInk,audioFace.mini.accent);assert.equal(audioFace.mini.pressed,'true');assert.equal(audioFace.mini.survivesRebuild,true);assert.equal(audioFace.mini.noCurve,true);
 console.log('PASS Audio face: aligned full/compact geometry and a three-band minimized meter that toggles to All');
 /* THE DAW LAW (2026-09-10): everything a demo shows rides in the project — theme, stage colour, camera feel and
    auto-rotate, overlays, SPECTRUM's DIALS fold, the A/B transition, the notebook's size, the modulation window's
    placement, the arrangement, the routes with their ranges — and comes back from it. */
 const daw=await g.ev(`const M=__LW.mod.model,w=n=>new Promise(r=>setTimeout(r,n));const theme0=document.body.dataset.theme;
  __LW.loadPreset('1s+2pz');M.addSource('lfo');__LW.layout.modulation.expand();await w(400);M.addRoute(M.macroList()[0].id,'material.exposure',0.5,4);
  __LW.layout.reopen('settings','R');__LW.layout.reopen('state','R');await w(200);
  __LW.camera.setAutoRotate(true);__LW.camera.setFriction(0.31);__LW.kepler.setOn(true);__LW.vortex.setOn(true);__LW.spectrum.setDials(true);__LW.layout.notebookResize(520,380);
  const tr=[...document.querySelectorAll('.dev[data-id=state] .trig')],by=t=>tr.find(b=>b.textContent.trim()===t);by('STORE A').click();__LW.loadPreset('2p+');await w(150);by('STORE B').click();
  const sc=document.querySelector('.stage-colour');sc.value='#203040';sc.dispatchEvent(new Event('input',{bubbles:true}));
  __LW.setStage(0);const stage0=__LW.mat.bg.slice();__LW.setStage(1);const stage1=__LW.mat.bg.slice();
  const follow=document.querySelector('.stage-follow');follow.click();const followed=__LW.mat.bg.slice(),retained=sc.value;follow.click();const resumed=__LW.mat.bg.slice();
  const S=__LW.serialize();S.presentation.ui.theme=theme0==='light'?'dark':'light';
  __LW.camera.setAutoRotate(false);__LW.camera.setFriction(0.1);__LW.kepler.setOn(false);__LW.vortex.setOn(false);__LW.spectrum.setDials(false);__LW.layout.notebookResize(300,200);follow.click();__LW.loadPreset('1s');M.deserialize(null);
  const ok=__LW.restore(S);await w(600);const q=__LW.serialize().presentation;const errs=__e.slice();
  return {ok,theme:document.body.dataset.theme,want:S.presentation.ui.theme,stage:q.ui.stage.custom,stageFollow:q.ui.stage.follow,
    stageLaw:{stage0,stage1,followed,retained,resumed},auto:q.camera.autoRotate,friction:q.camera.friction,kepler:q.overlays.kepler,vortex:q.overlays.vortex.on,dials:q.overlays.dials,ab:!!(q.ab&&q.ab.a&&q.ab.b),nb:q.notebook,routes:(q.modulation.routes||[]).map(r=>[r.min,r.max]),modwin:!!q.modwin,cards:q.layout&&q.layout.cards.length,errs}`);
 assert.equal(daw.ok,true); assert.equal(daw.theme,daw.want); assert.deepEqual(daw.stage.map(v=>Math.round(v*255)),[32,48,64]); assert.equal(daw.stageFollow,false);
 assert.deepEqual(daw.stageLaw.stage1.map(v=>Math.round(v*255)),[32,48,64]); assert.deepEqual(daw.stageLaw.followed,daw.stageLaw.stage0); assert.equal(daw.stageLaw.retained,'#203040'); assert.deepEqual(daw.stageLaw.resumed,daw.stageLaw.stage1);
 assert.equal(daw.auto,true); assert.equal(daw.friction,0.31);
 assert.equal(daw.kepler,true); assert.equal(daw.vortex,true); assert.equal(daw.dials,true); assert.equal(daw.ab,true); assert.deepEqual(daw.nb,{w:520,h:380}); assert.deepEqual(daw.routes,[[0.5,1]]); assert.equal(daw.modwin,true); assert.ok(daw.cards>20); assert.deepEqual(daw.errs,[]);
 console.log('PASS the DAW law: theme, stage colour, camera, overlays, dials, A/B, notebook size, modulation placement, arrangement and routes round-trip through the project');
 /* A PROJECT STARTS AT ZERO AND SAVES THE HAND, NOT THE NEEDLE. This drives the actual Projects API
    through a mid-route save, scrambles every covered surface, opens it, then presses Play once. */
 const projectState=await g.ev(`const M=__LW.mod.model,R=__LW.mod.registry,P=__LW.projects,w=n=>new Promise(r=>setTimeout(r,n));
  __LW.mod.reset();__LW.loadPreset('1s');__LW.ab.storeA();__LW.loadPreset('2p+');__LW.ab.storeB();__LW.ab.set(true);__LW.pause();__LW.scrub(137);
  R.setBase('material.stage',.63);R.setBase('material.gamma',1.71);R.setBase('material.exposure',2.3);R.setBase('transport.rate',33);
  __LW.camera.setAutoRotate(false);__LW.orbit(.27,-.14);const pose={yaw:__LW.obs.yaw,pitch:__LW.obs.pitch,quat:__LW.obs.quat.slice()};
  __LW.spectrum.select(4);__LW.spectrum.setDials(false);
  const rotor={qL:[.9238795325,.3826834324,0,0],qR:[.9659258263,0,.2588190451,0]};__LW.slice.load({mode:'ks',half:13.5,gain:3.25,rotor});
  __LW.qcd.load({kind:'bottom',potential:'log',params:{alphaS:.51,sigma:.23,C:.81}});__LW.molecule.load({on:true,R:3.4,kind:'sigma_u'});
  __LW.pulse.load({basis:'lcao1s',R:2.7,dt:.1,pulse:{amplitude:.041,omega:.62,duration:72,phase:.4}});__LW.helium.load({on:false,basis:'one',x1:[.3,.4,.5]});
  __LW.h2.load({on:false,R:4.2,which:'singlet',showCI:false,ke:.044,kappa:640});__LW.ladder.set({nbar:42,sigma:3.5,d:4,teeth:6});__LW.particles.setTrail(37);__LW.dynamics.ui.n.set(230);__LW.dynamics.ui.trail.set(37);
  const pal=__LW.paletteGroups.flatMap(g=>g.items).find(id=>id!==__LW.paletteId);__LW.setPalette(pal);__LW.palette.load([{at:.08,rgb:[.1,.2,.3]},{at:.47,rgb:[.7,.4,.2]},{at:.82,rgb:[.2,.8,.5]}],1);__LW.palette.setOn(true);
  const macro=M.macroList()[0];M.setMacro(macro.id,{value:.88,masterDepth:.73});const added=M.addRoute(macro.id,'material.exposure',.12,.42);__LW.mod.clock.applyAll(true);
  const current=R.state('material.exposure').current,base=R.baseOf('material.exposure'),route={...added.route};
  __LW.layout.modulation.expand();const audioId=__LW.mod.addSource('audio');await w(250);document.querySelector('.m2dev.audio [data-band="high"] .aud-range-name').click();__LW.mod.view.select(macro.id);
  __LW.history.note('project test edit');await w(450);const historyBefore=__LW.history.depth;
  P.save('acceptance/complete-state');const disk=JSON.parse(localStorage.getItem('lambdawaves.q0.projects')).items['acceptance/complete-state'].data;
  __LW.ab.set(false);R.setBase('material.gamma',.8);R.setBase('material.exposure',.4);R.setBase('transport.rate',4);__LW.spectrum.select(-1);__LW.spectrum.setDials(true);
  __LW.slice.load({mode:'space',half:3,gain:.2,rotor:{qL:[1,0,0,0],qR:[1,0,0,0]}});__LW.setPalette(__LW.paletteGroups[0].items[0]);__LW.palette.load([{at:0,rgb:[1,0,0]},{at:.5,rgb:[0,0,1]}],0);
  __LW.qcd.load({kind:'charm',potential:'cornell',params:{alphaS:.2,sigma:.1,C:.4}});__LW.molecule.load({on:false,R:1.1,kind:'sigma_g'});__LW.pulse.load({basis:'lcao1s',R:1.2,dt:.2,pulse:{amplitude:.01,omega:.2,duration:12,phase:0}});__LW.helium.load({on:false,basis:'six',x1:[0,0,.8]});__LW.h2.load({on:false,R:8,which:'triplet',showCI:true,ke:.01,kappa:100});__LW.ladder.set({nbar:20,sigma:1,d:0,teeth:3});__LW.particles.setTrail(8);__LW.dynamics.ui.n.set(40);
  const opened=P.open('acceptance/complete-state');await w(600);const restored=__LW.serialize().presentation,restoredRoute=M.routeList().find(r=>r.id===route.id),restoredSlice=__LW.slice.save(),poseNow={yaw:__LW.obs.yaw,pitch:__LW.obs.pitch,quat:__LW.obs.quat.slice()};
  const beforePlay={t:__LW.clock.t,playing:__LW.clock.playing,transition:__LW.ab.on,theta:__LW.reg.mixAngle(__LW.clock.t)};__LW.play();await w(250);
  const afterPlay={t:__LW.clock.t,theta:__LW.reg.mixAngle(__LW.clock.t),transition:__LW.ab.on};__LW.pause();
  const result={opened,diskT:disk.experiment.t,diskBase:disk.presentation.modulationBases['material.exposure'],diskMirror:disk.presentation.mat.exposure,
    base,current,restoredBase:R.baseOf('material.exposure'),route:[route.min,route.max,route.bi,route.enabled,route.curve],restoredRoute:restoredRoute&&[restoredRoute.min,restoredRoute.max,restoredRoute.bi,restoredRoute.enabled,restoredRoute.curve],
    rate:__LW.clock.rate,gamma:__LW.mat.gamma,stage:restored.ui.stage.mix,pose,poseNow,
    spectrum:{selected:__LW.spectrum.selected,dials:__LW.spectrum.dials},slice:restoredSlice,palette:{id:__LW.paletteId,selected:__LW.palette.selected,stops:__LW.palette.stops.map(s=>({at:s.at,rgb:s.rgb.slice()}))},pal,
    instruments:restored.instruments,modwin:restored.modwin,macro:{id:macro.id,value:M.macroOf(macro.id).value,depth:M.macroOf(macro.id).masterDepth},audioId,beforePlay,afterPlay,historyBefore,historyAfter:__LW.history.depth,dirty:P.dirty,errors:__e.slice()};
  P.remove('acceptance/complete-state');return result;`);
 assert.equal(projectState.opened,true);assert.equal(projectState.diskT,0);assert.notEqual(projectState.current,projectState.base);assert.equal(projectState.base,2.3);
 assert.equal(projectState.diskBase,2.3);assert.equal(projectState.diskMirror,2.3);assert.equal(projectState.restoredBase,2.3);assert.deepEqual(projectState.restoredRoute,projectState.route);
 assert.equal(projectState.rate,33);assert.equal(projectState.gamma,1.71);assert.equal(projectState.stage,.63);assert.ok(Math.abs(projectState.poseNow.yaw-projectState.pose.yaw)<1e-12);assert.ok(Math.abs(projectState.poseNow.pitch-projectState.pose.pitch)<1e-12);assert.deepEqual(projectState.poseNow.quat,projectState.pose.quat);
 assert.deepEqual(projectState.spectrum,{selected:4,dials:false});assert.equal(projectState.slice.mode,'ks');assert.equal(projectState.slice.half,13.5);assert.equal(projectState.slice.gain,3.25);
 assert.deepEqual(projectState.slice.rotor.qL.map(v=>+v.toFixed(8)),[.92387953,.38268343,0,0]);assert.equal(projectState.palette.id,projectState.pal);assert.equal(projectState.palette.selected,1);assert.equal(projectState.palette.stops.length,3);
 assert.deepEqual(projectState.instruments.qcd,{kind:'bottom',potential:'log',params:{alphaS:.51,sigma:.23,C:.81}});assert.deepEqual(projectState.instruments.molecule,{on:true,R:3.4,kind:'sigma_u'});assert.deepEqual(projectState.instruments.pulse,{basis:'lcao1s',R:2.7,dt:.1,pulse:{amplitude:.041,omega:.62,duration:72,phase:.4,start:0}});assert.equal(projectState.instruments.helium.basis,'one');assert.deepEqual(projectState.instruments.helium.x1.map(v=>+v.toFixed(8)),[.3,.4,.5]);assert.deepEqual(projectState.instruments.h2,{on:false,R:4.2,which:'singlet',showCI:false,ke:.044,kappa:640});assert.deepEqual(projectState.instruments.ladder,{nbar:42,sigma:3.5,d:4,teeth:6});assert.deepEqual(projectState.instruments.particles,{count:230,trail:37});
 assert.equal(projectState.modwin.selectedMacro,projectState.macro.id);assert.equal(projectState.modwin.audioBands[projectState.audioId],'high');assert.equal(projectState.macro.value,.88);assert.equal(projectState.macro.depth,.73);
 assert.ok(projectState.historyBefore>0);assert.equal(projectState.historyAfter,0);assert.deepEqual(projectState.beforePlay,{t:0,playing:false,transition:true,theta:0});assert.equal(projectState.afterPlay.transition,true);assert.ok(projectState.afterPlay.t>0);assert.notEqual(projectState.afterPlay.theta,0);
 assert.equal(projectState.dirty,false);assert.deepEqual(projectState.errors,[]);
 console.log('PASS complete project round-trip: stable macro bases and ranges, full view state, clear history, t=0, and transition motion on first Play');
 /* THE HAND ON A ROUTED KNOB (Josh, 2026-09-10): a click leaves the base and the range alone; a drag moves the BASE by
    the drag — never to where the modulator happened to be showing the needle. */
 const hand=await g.ev(`const M=__LW.mod.model,R=__LW.mod.registry,w=n=>new Promise(r=>setTimeout(r,n));M.deserialize(null);__LW.loadPreset('1s+2pz');
  M.addSource('lfo');__LW.layout.modulation.expand();await w(300);const m=M.macroList()[0];M.addRoute(m.id,'material.exposure',0.5,4);M.setMacro(m.id,{value:0.8});__LW.mod.clock.applyAll(true);await w(300);
  const k=[...document.querySelectorAll('.k')].find(e=>e.querySelector('.k-lbl')?.textContent==='EXPOSURE'),d=k.querySelector('.k-dial'),b=d.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;
  const base=()=>+R.baseOf('material.exposure').toFixed(3);const shown0=+__LW.mat.exposure.toFixed(3),base0=base();
  d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:cx,clientY:cy,pointerId:71,isPrimary:true}));d.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,clientX:cx,clientY:cy,pointerId:71,isPrimary:true}));await w(200);
  const click={base:base(),shown:+__LW.mat.exposure.toFixed(3)};
  d.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,clientX:cx,clientY:cy,pointerId:72,isPrimary:true}));for(let i=1;i<=3;i++)d.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:cx,clientY:cy+10*i,pointerId:72,isPrimary:true}));d.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,clientX:cx,clientY:cy+30,pointerId:72,isPrimary:true}));await w(300);
  return {shown0,base0,click,drag:{base:base(),shown:+__LW.mat.exposure.toFixed(3)},errs:__e.slice()}`);
 assert.ok(hand.shown0>hand.base0*2, 'the modulator shows well above the base: '+JSON.stringify(hand)); assert.equal(hand.click.base,hand.base0); assert.equal(hand.click.shown,hand.shown0);
 assert.ok(hand.drag.base<hand.base0&&hand.drag.base>hand.base0*0.4,'a 30 px drag moved the base by the drag, not to the shown value: '+JSON.stringify(hand.drag)); assert.deepEqual(hand.errs,[]);
 console.log('PASS the hand on a routed knob: a click leaves base and range; a drag moves the base by the drag, not to the modulated needle');
} catch(error) { failed=true;console.error(error); }
finally {
 // The Snap driver has previously hung during quit; a cleanup failure is reported
 // separately and remains nonzero, never silently converted to a green result.
 try { await Promise.race([g.close(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('driver cleanup exceeded 10 seconds')),10000))]); }
 catch(error) { failed=true;console.error('INFRASTRUCTURE:',error.message); }
 process.exit(failed?1:0);
}
