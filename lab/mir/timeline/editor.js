/* timeline/editor.js — THE TIMELINE EDITOR: the work lane, the lanes, the gestures (harvested from BASINS
 * app/timeline-editor.js as Josh last tuned it, branch basins-ui-fixes-2026-10-01, 2026-10-02).
 *
 * WHAT IT IS.  The surface inside the TIMELINE window: the WORK LANE (the transport in its work-bar form hugging the left,
 * and ONE right-aligned tool bar EDIT · SELECT · SCRUB · SLICE · CLIPS/POINTS · SNAP · STEP · SLIDE · ACTIVE · ⋯ reaching the
 * resize corner: Josh's fix 5; ONE line always: what does not fit folds from the end behind ⋯, wave 19), the ruler strip
 * (scrub, range, Shift-zoom), the lanes and their clips, the playhead, the selection, the curve editor (FL's gestures: modulation/curve-gesture.js is the law), the popups, drops.  No hint row at
 * the foot (fix 6): the status line takes no space and shows only while it says something.
 *
 *   buildTimelineEditor(win, { model, mod, controller, present, say, audio, keys }) → api
 *     win         { body, root, rail, isOpen(), open() } — the kit window it lives in (window.js createTimeline)
 *     model       timeline/model.js createTimelineModel()
 *     mod         installModulation's result: its registry is the targets, its clock the time
 *     controller  timeline/controller.js (the one play and the scrub gate)
 *     present()   ask the app for a frame; say(text) a notice (translated already)
 *     audio       optional { pick({ laneId, start }) } — ADD AUDIO… in the ⋯ menu (BASINS' installAudioDrop)
 *     keys        the app's key table, or () → it: a ⋯ row and a tool show the table's chord for their action, never a typed one
 *   api: surface, transportHost, createClip, addClip, at, model, paint, px, view, range, activeRange, setActiveRange,
 *     onDrop, slice, tool, setTool, gesture, paintHead, selected, selection, workLane, setWorkLane, locate, removeLane,
 *     addLane, close, dispose, keysLive(), and the key table's verbs (act: see keys.js)
 *
 * THE LAWS (BASINS', unchanged): one musical-to-pixel mapping (geometry.js) for drawing, hit tests and edits; a gesture is
 * one model transaction (begin … commit, or cancel on Escape, a lost capture, a blur, a hidden page or a hidden interface); a drag's last
 * pointer sample is flushed before its commit; the nearest lane is resolved from content coordinates, never from
 * elementFromPoint; the hand leads the scrub (controller.js); zoom keeps the beat under the anchor; the playhead paints by
 * transform from the clock's tick; idle costs nothing (the only listeners are events; no loop).
 * CHANGED FOR THE KIT: words through label / ariaLabel / t (nothing is found by its words); the keyboard is the app's one
 * key table (keys.js timelineActions: this file only exposes the verbs); toasts through `say`; the frame coalescer is
 * core/frame.js; the popups are the house's menu pane; BASINS' CURVE_VIEW numbers live in geometry.js. */
import { svgPoint, curveHit, curveAction, pointDrag, pointAddValue, tensionDelta } from '../modulation/curve-gesture.js';
import { el, label, ariaLabel, seg, stepper, number } from '../kit.js';
import { glyphSvg } from '../glyph.js';
import { frame } from '../core/frame.js';
import { isField } from '../core/pointer.js';
import { t, tn } from '../core/i18n.js';
import { coalesce } from './readout.js';
import { TIMELINE_TAB_HEIGHT, TIMELINE_ROW_GAP, TIMELINE_CURVE_GRAB, TIMELINE_TENSION_TRAVEL, resizeTimelineClip, createClipCoordinates, snapTimelineBeat, timelineResizeDelta, nearestTimelineLane } from './geometry.js';
import { createTimelinePlot } from './curve-view.js';
import { evaluateTimelineSource, normalizeTimelinePoints } from './source.js';
import { clipKind } from './kinds.js';
import { sliceClips } from './slice.js';
import { timelineStepSamples } from './draw.js';
import { createTimelineView } from './view.js';
import { createTimelinePlayhead } from './playhead.js';
import { selectionRect, clipsInRectangle, pointsInRectangle } from './selection.js';
import { TIMELINE_ICONS } from './icons.js';
import { stretchAudioClip, audioRate } from './audio-kind.js';

const bounded=(n,lo=0,hi=1)=>Math.min(hi,Math.max(lo,n));
const editable=target=>isField(target,true);   // every input counts: the clip menu's colour well keeps its keys
/* a word: an English key (translated, kept on the node for a language change) or [key, vars]; { raw } is data, shown as it is */
const word=(node,w)=>{if(w&&typeof w==='object'&&!Array.isArray(w)){node.textContent=w.raw;return node;}if(Array.isArray(w))return label(node,w[0],w[1]),node;label(node,w);return node;};
export const SNAPS=[[4,'MEASURE'],[1,'QUARTER'],[.5,'EIGHTH'],[.25,'SIXTEENTH'],[0,'OFF']];   // tr: the timeline's snap grid
export const TOOLS=[['edit','EDIT'],['select','SELECT'],['scrub','SCRUB'],['slice','SLICE']];   // tr: the timeline's tools
const SCOPES=[['clips','CLIPS'],['points','POINTS']];   // what a selection picks: whole clips or curve points
const FOLD_SLACK=6;   // px: a folded tool comes back to the bar only with this much room to spare (a bar at the edge never flickers)
export const SWATCHES=['#a7adb8','#ed8d91','#e2b579','#a9c987','#7bbfc8','#96a8df','#be9bdd'];   // BASINS' seven clip tints (data: a clip's colour is saved)

export function buildTimelineEditor(win,{model,mod,controller,present=()=>{},say=()=>{},audio=null,keys=null}) {
  /* the chord the app's table holds for a timeline action, in the user's platform ('' when none): never typed here */
  const chordOf=id=>{const k=typeof keys==='function'?keys():keys;return k&&k.get&&k.get('timeline.'+id)?k.menuKey('timeline.'+id):'';};
  const withKey=(node,id)=>{const c=id&&chordOf(id);if(c)el('span','tl-key',node).textContent=' · '+c;return node;};
  let doc=model.state(),selectedLane=doc.lanes[0].id,selected=null,selection=new Set(),pointSelection=null;
  let px=20,snap=1,range=null,confirmation=null,menu=null,drag=null,lastTap=null,clipboard=null;
  let stepMode=false,slideMode=false,drawTension=0,tool='edit',scope='clips',workLane='top';
  const dropHandlers=new Set();
  const transportBeat=()=>mod.host.model.transport.beats;
  const events=new AbortController(),listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:events.signal});
  const surface=el('div','timeline-surface',win.body);surface.style.setProperty('--tl-tab-height',TIMELINE_TAB_HEIGHT+'px');surface.style.setProperty('--tl-row-gap',TIMELINE_ROW_GAP+'px');ariaLabel(surface,'Timeline workspace');surface.tabIndex=0;
  const worklane=el('div','tl-worklane',surface),transportHost=el('div','tl-transport-host',worklane);ariaLabel(transportHost,'Timeline transport');
  const toolbar=el('div','tl-toolbar glass',worklane);toolbar.setAttribute('role','toolbar');ariaLabel(toolbar,'Timeline tools');
  const button=(parent,text,fn,cls='')=>{const b=el('button','trig tl-action '+cls,parent);b.type='button';word(b,text);b.addEventListener('click',()=>{finish(null,true);fn(b);});return b;};
  // The tools keep their word as the accessible name and the hint (data-help) when the icon takes the face.
  const toolButtons=new Map();for(const[name,text]of TOOLS){const b=button(toolbar,text,()=>setTool(name),'tl-tool');b.dataset.tool=name;b.dataset.keyAction='timeline.tool-'+name;b.setAttribute('aria-pressed',String(name===tool));ariaLabel(b,text);b.dataset.help=text;
    if(TIMELINE_ICONS[name]){b.textContent='';delete b.dataset.t;b.insertAdjacentHTML('beforeend',TIMELINE_ICONS[name]);b.querySelector('svg')?.setAttribute('aria-hidden','true');b.classList.add('tl-icon');}toolButtons.set(name,b);}
  /* THE KIT'S OWN CHOOSERS, NEVER A NATIVE <select> (Josh, 2026-10-07, call 19; docs/CONTROLS.md): the scope is one of two
     modes, all visible — a SEGMENT; SNAP is one of five in order — a STEPPER, compact (its name opens the list, ← → ↑ ↓ step
     it), whose seat is its longest word, so a choice moves nothing (the hand law).  Same values, same effects as the selects. */
  const scopeCtl={get:()=>scope,set(v){finish(null,true);scope=v;scopeSeg.set(v);setTool('select');}};
  const scopeSeg=seg({aria:'Selection scope',options:SCOPES.map(([id,name])=>({id,label:name})),value:scope,cls:'tl-scope-seg',onChange:v=>scopeCtl.set(v)});   // tr: what a selection picks: whole clips or curve points
  scopeSeg.root.querySelector('.seg').classList.add('tl-scope');toolbar.appendChild(scopeSeg.root);const scopeWrap=scopeSeg.root;
  const snapLabel=el('div','tl-setting',toolbar),snapWord=el('span','tl-setting-word',snapLabel);label(snapWord,'SNAP');
  const snapStep=stepper({aria:'Timeline snap',items:SNAPS.map(([id,name])=>({id,label:name})),value:snap,compact:true,cls:'tl-snap',onChange:v=>{finish(null,true);snap=v;}});el('span','tl-select-wrap',snapLabel).appendChild(snapStep.root);
  const snapCtl={get:()=>snap,set(v){finish(null,true);snap=v;snapStep.set(v);}};
  const modeButton=(name,read,write,title,id)=>{const b=button(toolbar,name,()=>{write(!read());b.setAttribute('aria-pressed',String(read()));b.classList.toggle('on',read());surface.classList.toggle('tl-step-mode',stepMode&&tool==='edit');paintSelection();});b.dataset.mode=id;b.setAttribute('aria-pressed','false');b.title=title;return b;};
  const stepButton=modeButton('STEP',()=>stepMode,v=>stepMode=v,'Draw on Snap. Shift draws pulses. Snap OFF uses 1/16 beat.','step');
  const slideButton=modeButton('SLIDE',()=>slideMode,v=>slideMode=v,'Move following point times together.','slide');
  // ACTIVE marks the ruler's range (none: the whole arrangement) as THE ACTIVE RANGE; pressed again on the same span, it clears.
  const activeButton=button(toolbar,'ACTIVE',()=>markActive());activeButton.dataset.mode='active';activeButton.setAttribute('aria-pressed','false');activeButton.title='Mark the selected time range (or the whole arrangement) as the active range';
  // MORE (⋯, a trigger: no lamp) always ends the bar: the tools folded off the bar (in bar order), then the selection's actions.
  const moreButton=button(toolbar,{raw:''},b=>{const r=b.getBoundingClientRect();pop(r.left,r.bottom,'SELECTION',[
    ...(audio?.pick?[['ADD AUDIO…',()=>audio.pick({laneId:selectedLane,start:controller.state().beat}),'add-audio']]:[]),['ZOOM TO SELECTION',zoomSelection,'zoom-selection'],['DUPLICATE',duplicateSelection,'duplicate'],['COPY',()=>copySelection(),'copy'],['CUT',()=>copySelection(true),'cut'],['PASTE',pasteSelection,'paste'],['DELETE',deleteSelection,'delete'],['SELECT ALL',selectAll,'select-all'],['DESELECT',deselect,'deselect'],['SHORTCUTS',()=>api.onShortcuts?.(r.left,r.bottom),'shortcuts']],'more');
    const head=menu.firstChild;for(const f of fold.slice(shown))menu.insertBefore(f.row(r),head);if(shown<fold.length){placeMenu(r.left,r.bottom);menu.querySelector('button')?.focus();}},'tl-icon');
  moreButton.dataset.mode='more';moreButton.insertAdjacentHTML('beforeend',glyphSvg('more','gly gly-more',16));ariaLabel(moreButton,'More tools and actions');
  /* THE ONE LINE (wave 19, Josh: "never let the timeline's work bars word wrap"): the bar keeps one line; the tools that do
     not fit fold from the END behind MORE, so the first tools never move (the hand law).  A folded tool's row in MORE's list
     acts through the bar's own control (the same press, the same state; the keys never cared where it sits) and shows its
     pressed state.  Space is measured in the kit's frame (read, then write) on ONE ResizeObserver: no loop, no poll. */
  const mirrorRow=(src,text)=>()=>{const row=button(menu,{raw:''},()=>{closeMenu();src.click();},'tl-row');row.dataset.fold=src.dataset.tool||src.dataset.mode;
    const icon=src.querySelector('svg');if(icon)row.appendChild(icon.cloneNode(true));word(el('span','tl-row-word',row),text);withKey(row,src.dataset.tool&&'tool-'+src.dataset.tool);
    const on=src.getAttribute('aria-pressed');if(on){row.setAttribute('aria-pressed',on);row.classList.toggle('on',on==='true');}return row;};
  const choiceRow=(id,ctl,rows,title,text)=>r=>{const now=rows.find(([v])=>v===ctl.get())||rows[0];
    const row=button(menu,{raw:text(t(now[1]))},()=>pop(r.left,r.bottom,title,rows.map(([v,w])=>[w,()=>ctl.set(v),id+'-'+v,v===ctl.get()]),id),'tl-row');row.dataset.fold=id;return row;};
  const fold=[...[...toolButtons].map(([name,b])=>({node:b,row:mirrorRow(b,TOOLS.find(x=>x[0]===name)[1])})),
    {node:scopeWrap,row:choiceRow('scope',scopeCtl,SCOPES,'Selection scope',value=>t('SCOPE · {value}',{value}))},{node:snapLabel,row:choiceRow('snap',snapCtl,SNAPS,'SNAP',value=>t('SNAP · {value}',{value}))},   // tr: a folded setting's row in the ⋯ list: its name · the choice in force
    {node:stepButton,row:mirrorRow(stepButton,'STEP')},{node:slideButton,row:mirrorRow(slideButton,'SLIDE')},{node:activeButton,row:mirrorRow(activeButton,'ACTIVE')}];
  let shown=fold.length,fitBooked=false;const widths=new Map();
  function fit(){
    if(!worklane.getClientRects().length)return;   // the lane is hidden or the window is closed: nothing to measure
    const bar=getComputedStyle(toolbar),lane=getComputedStyle(worklane),num=v=>parseFloat(v)||0,gap=num(bar.columnGap);
    let room=worklane.clientWidth;if(lane.flexDirection!=='column')room-=transportHost.getBoundingClientRect().width+num(lane.columnGap);
    for(const f of fold)if(!f.node.classList.contains('tl-folded'))widths.set(f.node,f.node.getBoundingClientRect().width);
    let need=num(bar.paddingLeft)+num(bar.paddingRight)+num(bar.borderLeftWidth)+num(bar.borderRightWidth)+moreButton.getBoundingClientRect().width,k=0;
    for(;k<fold.length;k++){need+=(widths.get(fold[k].node)||0)+gap;if(need>room-(k>=shown?FOLD_SLACK:0)+.5)break;}
    if(k!==shown)frame.write(()=>foldAt(k));
  }
  function foldAt(k){shown=k;fold.forEach((f,i)=>f.node.classList.toggle('tl-folded',i>=k));moreButton.dataset.folded=String(fold.length-k);if(menu?.dataset.pop==='more')closeMenu();}
  const fitObserver=new ResizeObserver(()=>{if(fitBooked)return;fitBooked=true;frame.read(()=>{fitBooked=false;fit();});});
  for(const n of [worklane,transportHost,moreButton,...fold.map(f=>f.node)])fitObserver.observe(n);
  const view=createTimelineView(surface,{pixels:()=>px,onClipMenu(e,c,curve){finish(null,true);clipMenu(e.clientX,e.clientY,c,curve);}});
  const {viewport,status}=view;
  const headPaint=createTimelinePlayhead({head:view.head,tail:view.tail,controller,clock:{beats:transportBeat,playing:()=>mod.host.clock.isPlaying(),bpm:()=>mod.host.model.transport.bpm},visible:()=>win.isOpen()&&!document.hidden&&!document.body.classList.contains('ui-hidden'),pixels:()=>px,scroll:()=>viewport.scrollLeft});
  const snapBeat=(beat,e)=>snapTimelineBeat(beat,snap,!!e?.altKey),closeMenu=()=>{menu?.remove();menu=null;};
  function setTool(name){tool=name;surface.dataset.tool=tool;surface.classList.toggle('tl-step-mode',stepMode&&tool==='edit');for(const[id,b]of toolButtons){b.setAttribute('aria-pressed',String(id===tool));b.classList.toggle('on',id===tool);}paintSelection();}
  function selectOnly(id){selected=id;selection=new Set(id?[id]:[]);pointSelection=null;paintSelection();}
  /* the status line: what is selected, and the mode's one sentence (BASINS' words), only while there is something to say */
  function statusText(){const parts=[];
    if(pointSelection?.indices.size)parts.push(tn(pointSelection.indices.size,'{n} point selected','{n} points selected',{n:pointSelection.indices.size}));
    else if(selection.size)parts.push(tn(selection.size,'{n} clip selected · {target}','{n} clips selected · {target}',{n:selection.size,target:view.getCurve(view.getClip(selected)?.curveId)?.targetId||''}));
    if(stepMode&&tool==='edit')parts.push(t('STEP: draw; Shift for pulses'));
    if(tool==='slice')parts.push(t('SLICE: click a clip to cut it; Insert cuts the selection at the playhead'));
    return parts.join(' · ');}
  function paintSelection(){view.paintSelection(selection,selectedLane,pointSelection,id=>mod.registry.has(id));const s=statusText();if(status.textContent!==s)status.textContent=s;}
  function paint(){view.paint();paintSelection();headPaint.paint();const rm=win.rail?.chip?.('removeLane'),ad=win.rail?.chip?.('addLane');if(rm)rm.disabled=doc.lanes.length<=1;if(ad)ad.disabled=doc.lanes.length>=32;const on=!!activeRange();activeButton.setAttribute('aria-pressed',String(on));activeButton.classList.toggle('on',on);}
  function reconcile(){const ids=new Set(doc.clips.map(c=>c.id));selection=new Set([...selection].filter(id=>ids.has(id)));if(!ids.has(selected))selected=selection.values().next().value||null;if(!doc.lanes.some(l=>l.id===selectedLane))selectedLane=doc.lanes[0].id;
    if(pointSelection){const c=doc.curves.find(c=>c.id===pointSelection.curveId);if(!c||!ids.has(pointSelection.clipId))pointSelection=null;else pointSelection.indices=new Set([...pointSelection.indices].filter(i=>i<c.points.length));}}
  // Zoom keeps the beat under `anchor` (viewport px) in place; zoomAt never ends a gesture, so the strip's Shift-drag can drive it.
  function zoomAt(next,anchor=0,beat=(viewport.scrollLeft+anchor)/px){px=bounded(next,8,100);paint();viewport.scrollLeft=Math.max(0,beat*px-anchor);paint();}
  function zoom(mult,anchor=0){finish(null,true);zoomAt(px*mult,anchor);}
  // SLICE: every listed clip spanning the beat cuts there as one undo; the halves join (Insert) or become (the tool) the selection.
  function sliceAt(ids,beat,keep=false){finish(null,true);const cuts=sliceClips(model,ids,beat);if(!cuts){const r=model.lastRefusal;say(r?t(r.why,r.vars):t('Nothing sliced: the cut must fall inside a clip.'));return null;}
    selection=new Set([...(keep?selection:[]),...cuts.flatMap(c=>[c.left,c.right])]);selected=cuts[0].right;pointSelection=null;paintSelection();return cuts;}
  function markActive(){const end=Math.max(0,...doc.clips.map(c=>c.start+c.duration)),next=range?{...range}:end>0?{start:0,end}:null,now=activeRange();
    if(!next){say(t('Nothing to mark: drag a time range on the strip or add clips.'));return;}
    setActiveRange(now&&Math.abs(now.start-next.start)<1e-9&&Math.abs(now.end-next.end)<1e-9?null:next);}
  function zoomSelection(){finish(null,true);const clips=doc.clips.filter(c=>selection.has(c.id)),chosen=clips.length?clips:doc.clips;
    const bounds=clips.length||!range?chosen.length?{start:Math.min(...chosen.map(c=>c.start)),end:Math.max(...chosen.map(c=>c.start+c.duration))}:null:range;if(!bounds)return;
    px=bounded((viewport.clientWidth-40)/Math.max(.0625,bounds.end-bounds.start),8,100);paint();viewport.scrollLeft=Math.max(0,bounds.start*px-20);paint();}
  function duplicateSelection(){const ids=model.duplicateClips([...selection]);if(!ids){const r=model.lastRefusal;say(r?t(r.why,r.vars):t('No copies made: select clips with room in the arrangement.'));return;}selection=new Set(ids);selected=ids[0];pointSelection=null;paintSelection();}
  function copySelection(cut=false){const value=model.copyClips([...selection]);if(!value)return;clipboard=value;if(cut){model.deleteClips([...selection]);selection.clear();selected=null;}paintSelection();}
  function pasteSelection(){if(!clipboard)return;const ids=model.pasteClips(clipboard,{start:snapBeat(transportBeat()),laneId:selectedLane});if(!ids){const r=model.lastRefusal;say(r?t(r.why,r.vars):t('No clips pasted: the selected lanes or source budget cannot fit this group.'));return;}selection=new Set(ids);selected=ids[0];pointSelection=null;paintSelection();}
  function deleteSelection(){if(scope==='points'){if(pointSelection?.indices.size){const result=model.removePoints(pointSelection.curveId,[...pointSelection.indices]);if(!result?.removed)say(t('Keep at least two curve points.'));else pointSelection=null;}}else{model.deleteClips([...selection]);selection.clear();selected=null;}paintSelection();}
  function selectAll(){if(scope==='points'){const c=view.getClip(selected),curve=view.getCurve(c?.curveId);if(curve)pointSelection={clipId:c.id,curveId:curve.id,indices:new Set(curve.points.flatMap((p,i)=>p.t*curve.length>=c.offset&&p.t*curve.length<=c.offset+c.duration*c.scale?[i]:[]))};}else{selection=new Set(doc.clips.map(c=>c.id));selected||=doc.clips[0]?.id||null;}paintSelection();}
  function deselect(){selection.clear();pointSelection=null;selected=null;paintSelection();}
  function placeMenu(x,y) {
    const r=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-r.height-8,y))+'px';
  }
  /* a popup: the house's menu pane; `title` is a word (or { raw } for a clip's own name); each action [word, fn, id, chosen?]
     (a boolean `chosen` makes the row a choice that shows whether it is the one in force) */
  function pop(x,y,title,actions,id='') {
    closeMenu();menu=el('div','tl-pop glass',document.body);menu.dataset.mirSurface='menu';if(id)menu.dataset.pop=id;menu.setAttribute('role','menu');
    const head=word(el('div','tl-pop-title',menu),title);ariaLabel(menu,typeof title==='string'?title:'Clip options');if(title&&title.raw)menu.setAttribute('aria-label',head.textContent);
    for(const [text,fn,id,chosen]of actions){const b=withKey(button(menu,text,()=>{closeMenu();fn();}),id);if(id)b.dataset.row=id;if(typeof chosen==='boolean'){b.setAttribute('aria-pressed',String(chosen));b.classList.toggle('on',chosen);}}
    placeMenu(x,y);menu.querySelector('button')?.focus();
  }
  function editIdentity(x,y,curve) {
    pop(x,y,'CLIP TITLE / COLOR',[],'identity');menu.setAttribute('role','dialog');ariaLabel(menu,'Clip title and color');
    const titleLabel=el('label','tl-field',menu),input=el('input','tl-value-input',titleLabel);titleLabel.prepend(label(el('span','tl-field-word'),'TITLE'));input.value=curve.name;input.maxLength=80;ariaLabel(input,'Clip title');
    const colorLabel=el('label','tl-field tl-color-field',menu),color=el('input','tl-color-input',colorLabel);colorLabel.prepend(label(el('span','tl-field-word'),'TINT'));color.type='color';color.value=curve.color;ariaLabel(color,'Clip color');
    const swatches=el('div','tl-swatches',menu);
    for(const tint of SWATCHES){const b=el('button','tl-swatch',swatches);b.type='button';b.dataset.tint=tint;b.style.setProperty('--tl-clip-tint',tint);ariaLabel(b,'Tint {tint}',{tint});b.onclick=()=>{color.value=tint;};}
    const apply=()=>{model.updateCurve(curve.id,{name:input.value.trim()||curve.targetId,color:color.value});closeMenu();};
    button(menu,'APPLY',apply).dataset.tlAction='apply';button(menu,'CANCEL',closeMenu).dataset.tlAction='cancel';
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply();}});placeMenu(x,y);input.focus();input.select();
  }
  function editPointValues(x,y,clip,curve,index) {
    const p=curve.points[index],sourceBeat=p.t*curve.length;
    pop(x,y,'POINT TIME / VALUE',[],'point-values');menu.setAttribute('role','dialog');ariaLabel(menu,'Point time and value');
    /* the kit's NUMBER FIELD, never a native type=number (Josh, 2026-10-07, call 19): drag, type, keys; it opens on the time,
       its number selected, as the input did; Enter in either takes the number and applies, as the form's submit did */
    const form=el('div','tl-point-form',menu);
    const field=({label:word,...o})=>{const f=el('div','tl-field',form);label(el('span','tl-field-word',f),word);const n=number({digits:3,...o});n.root.classList.add('tl-value-num');f.appendChild(n.root);return n;};   // label: / aria: keys, so the catalogue reaches the words
    const time=field({label:'TIME · BEATS FROM 0',aria:'Point time in beats',min:0,value:clip.start+(sourceBeat-clip.offset)/clip.scale});
    const value=field({label:'VALUE · 0 TO 1',aria:'Point value',min:0,max:1,value:p.v});
    const apply=()=>{for(const n of [time,value])if(n.editing)n.close(true);const beat=clip.offset+(time.get()-clip.start)*clip.scale;if(beat<0){say(t('This time is before the source begins.'));return;}
      const edited=model.movePoint(curve.id,index,beat,value.get(),{slide:slideMode});if(edited?.index>=0)closeMenu();};
    for(const n of [time,value])n.input.addEventListener('keydown',e=>{if(e.key==='Enter')apply();});   // after the field's own Enter has taken the number
    button(form,'APPLY',apply).dataset.tlAction='apply';button(form,'CANCEL',closeMenu).dataset.tlAction='cancel';placeMenu(x,y);time.open();
  }
  function fieldMenu(x,y,curve,index,clip) {
    const p=curve.points[index],hold=index>0&&curve.points[index-1].segment==='hold';
    pop(x,y,'POINT',[
      [['TIME / VALUE · {v}',{v:p.v.toFixed(3)}],()=>editPointValues(x,y,clip,curve,index),'values'],
      ...(index>0 ? [['SEGMENT BEFORE THIS POINT',()=>pop(x,y,'SEGMENT TYPE',[
        [hold?'SINGLE CURVE':'✓ SINGLE CURVE',()=>model.setSegment(curve.id,index-1,'single'),'single'],
        [hold?'✓ HOLD':'HOLD',()=>model.setSegment(curve.id,index-1,'hold'),'hold']
      ],'segment'),'segment']] : []),
      ['COPY VALUE',()=>{api.copiedValue=p.v;},'copy-value'],
      ['PASTE VALUE',()=>{if(Number.isFinite(api.copiedValue))model.movePoint(curve.id,index,p.t*curve.length,api.copiedValue);},'paste-value'],
      ['DELETE POINT',()=>model.removePoint(curve.id,index),'delete-point']
    ],'point');
  }
  function clipMenu(x,y,c,curve) {
    // A kind keeps the instance actions, drops the point ones, keeps OUTPUT RANGE only when it drives, and adds its own.
    const kind=clipKind(curve),drives=!kind||kind.drives!==false;
    pop(x,y,{raw:curve.name},[
      ['TITLE / COLOR',()=>editIdentity(x,y,curve),'identity'],
      [c.mute?'UNMUTE':'MUTE',()=>model.updateClip(c.id,{mute:!c.mute}),'mute'],
      ['DUPLICATE',()=>{selectOnly(c.id);duplicateSelection();},'duplicate'],
      ...(drives?[['OUTPUT RANGE',()=>{pop(x,y,'NORMALIZED MIN / MAX',[],'range');const num=(o)=>{const n=number({min:0,max:1,step:.01,...o});n.root.classList.add('tl-value-num');menu.appendChild(n.root);return n;};const lo=num({aria:'Output minimum',value:curve.min}),hi=num({aria:'Output maximum',value:curve.max});button(menu,'APPLY',()=>{for(const n of [lo,hi])if(n.editing)n.close(true);model.updateCurve(curve.id,{min:lo.get(),max:hi.get()});closeMenu();}).dataset.tlAction='apply';},'output-range']]:[]),   // the kit's number fields (call 19)
      ...(kind?[]:[['ADD MIDPOINT',()=>{const beat=c.offset+c.duration*c.scale/2;model.addPoint(curve.id,beat,evaluateTimelineSource(curve,beat));},'add-midpoint']]),
      ['STRETCH ×2',()=>model.updateClip(c.id,{duration:c.duration*2,scale:c.scale/2}),'stretch'],
      ...(kind?.menu?.(curve,c,{model,editor:api})||[]),
      ['DELETE CLIP',()=>model.deleteClip(c.id),'delete-clip']
    ],'clip');
  }

  function cancelConfirm(){confirmation?.remove();confirmation=null;}
  function removeLane(){cancelConfirm();const lane=doc.lanes.at(-1),result=model.removeLane(lane.id);if(!result.confirm)return;
    confirmation=el('div','tl-confirm glass',document.body);confirmation.dataset.mirSurface='menu';confirmation.setAttribute('role','alertdialog');ariaLabel(confirmation,'Remove clips?');label(el('div','tl-confirm-text',confirmation),'Remove clips? {n} in {lane}',{n:result.count,lane:result.name});
    ariaLabel(button(confirmation,{raw:'×'},cancelConfirm,'tl-cancel'),'Cancel removing the lane');const yes=button(confirmation,'YES, DELETE',()=>{if(doc.lanes.at(-1)?.id===lane.id)model.removeLane(lane.id,true);cancelConfirm();},'tl-delete');
    const chip=win.rail?.chip?.('removeLane'),r=chip?chip.getBoundingClientRect():{right:innerWidth/2,top:innerHeight/2},box=confirmation.getBoundingClientRect();confirmation.style.left=bounded(r.right+8,8,innerWidth-box.width-8)+'px';confirmation.style.top=bounded(r.top,8,innerHeight-box.height-8)+'px';yes.focus();}
  function createClip(targetId){finish(null,true);if(!mod.registry.has(targetId))return null;const beat=transportBeat(),desc=mod.registry.describeOne(targetId);
    const id=model.create({targetId,name:desc.label,value:mod.registry.readNorm(targetId),start:range?range.start:Math.floor(beat/doc.meter)*doc.meter,duration:range?range.end-range.start:doc.meter,laneId:selectedLane});if(!id){say(t('This time range is occupied in every lane. Add a lane or choose another range.'));return null;}selectOnly(id);win.open();paint();viewport.scrollLeft=Math.max(0,view.getClip(id).start*px-20);return id;}
  // THE KIND SEAM: the beat and lane under a client point, and a clip of any kind through the model's one create path.
  function at(clientX,clientY){const w=view.world({clientX,clientY}),beat=Math.max(0,w.x/px);return{beat,snapped:snapBeat(beat),laneId:doc.lanes[nearestTimelineLane(w.y,doc.lanes.length,view.height())].id};}
  function addClip(kind,source={},{start,duration,laneId,targetId,name,select=true}={}){finish(null,true);
    const curveKind=!kind||kind==='curve',impl=curveKind?null:clipKind({kind});if(!curveKind&&!impl)return null;
    const points=curveKind&&source.points!=null?normalizeTimelinePoints(source.points):undefined;if(points===null)return null;
    const s=Number.isFinite(start)?start:range?range.start:Math.floor(transportBeat()/doc.meter)*doc.meter;
    const d=Number.isFinite(duration)&&duration>0?duration:!Number.isFinite(start)&&range?range.end-range.start:impl?.duration?.({...source,kind},mod.host.model.transport.bpm)||doc.meter;
    const id=model.create({targetId:targetId||source.targetId||kind+':'+(source.envId??source.assetId??'clip'),name:name||source.name,value:Number.isFinite(source.value)?source.value:0,start:s,duration:d,laneId:laneId||selectedLane,
      source:curveKind?(points?{...source,kind:'curve',points}:null):{...source,kind}});
    if(id&&select){selectOnly(id);paint();}return id;}
  // THE ACTIVE RANGE: the model's own field (model.setActive; the project, the signature and the history carry it) — the range the recorder renders.
  const validRange=r=>r&&Number.isFinite(r.start)&&Number.isFinite(r.end)&&r.end>r.start?{start:Math.max(0,r.start),end:r.end}:null;
  const activeRange=()=>validRange(doc.active);
  function setActiveRange(value){model.setActive(validRange(value));
    view.setActive(activeRange());paint();win.root?.dispatchEvent(new CustomEvent('timeline-active-range',{detail:activeRange()}));return activeRange();}
  const pointer=e=>({x:e.clientX,y:e.clientY,clientX:e.clientX,clientY:e.clientY,altKey:e.altKey,shiftKey:e.shiftKey,ctrlKey:e.ctrlKey,metaKey:e.metaKey,pointerId:e.pointerId});
  function drawStep(position,shiftKey){const{clip:c,curve,previous}=drag,grid=(snap||.0625)*c.scale;const samples=timelineStepSamples(previous,position,{step:grid,origin:c.offset-c.start*c.scale,min:c.offset,max:c.offset+c.duration*c.scale}),result=samples&&model.drawPoints(curve.id,samples,{hold:shiftKey,tension:drawTension});if((!samples||result?.full)&&!drag.warned){drag.warned=true;say(t('Curve point limit reached. Use a wider Snap grid or remove points.'));}drag.previous=position;}
  const updates=coalesce(e=>{
    if(!drag)return;drag.last=e;if(Math.hypot(e.x-drag.x,e.y-drag.y)>6)drag.moved=true;
    // A Shift press on the strip picks its axis at 6px: horizontal stays a scrub/range, vertical becomes a zoom (up = in).
    if(drag.shift&&!drag.axis&&drag.moved){drag.axis=Math.abs(e.y-drag.y)>Math.abs(e.x-drag.x)?'y':'x';
      if(drag.axis==='y'){if(drag.kind==='scrub')controller.endScrub({cancel:true});range=drag.oldRange;view.setRange(range);drag.kind='zoom';surface.dataset.gesture='zoom';}}
    if(drag.kind==='zoom'){zoomAt(drag.px0*Math.exp((drag.y-e.y)*.01),drag.anchor,drag.anchorBeat);return;}
    const pos=view.world(e);
    if(drag.kind==='pan'){viewport.scrollLeft=drag.scrollX-(e.x-drag.x);viewport.scrollTop=drag.scrollY-(e.y-drag.y);return;}
    if(drag.kind==='scrub'){controller.scrub(pos.x/px,{snap,alt:!!e.altKey,shift:!!e.shiftKey});return;}
    if(drag.kind==='range'){const beat=snapBeat(pos.x/px,e),start=Math.min(beat,drag.startBeat),end=Math.max(beat,drag.startBeat);range=end-start>=.0625?{start:drag.addRange?Math.min(start,drag.addRange.start):start,end:drag.addRange?Math.max(end,drag.addRange.end):end}:null;view.setRange(range);paint();return;}
    if(drag.kind==='select'){
      const rect=selectionRect(drag.startWorld,pos);Object.assign(view.marquee.style,{display:'block',left:rect.left+'px',top:rect.top+'px',width:rect.right-rect.left+'px',height:rect.bottom-rect.top+'px'});
      if(scope==='points'){const c=view.getClip(selected),curve=view.getCurve(c?.curveId);if(c&&curve){const indices=pointsInRectangle(c,curve,rect,px,view.height(),doc.lanes.findIndex(l=>l.id===c.laneId));pointSelection={clipId:c.id,curveId:curve.id,indices:new Set([...drag.basePoints,...indices])};}}
      else{selection=new Set([...drag.baseClips,...clipsInRectangle(doc,rect,px,view.height())]);selected=selection.values().next().value||null;pointSelection=null;}paintSelection();return;
    }
    if(drag.kind==='delete'){
      const id=document.elementFromPoint(e.x,e.y)?.closest('.tl-clip-title,svg[data-kind]')?.dataset.clip;
      if(id&&doc.clips.some(x=>x.id===id))model.deleteClip(id);return;
    }
    const{clip:c,curve}=drag;
    if(drag.kind==='move'){
      if(!drag.moved)return;
      if(drag.copy&&!drag.copied){const copies=model.duplicateClips(drag.ids,{delta:0});if(!copies){say(t('No copies made: source budget reached.'));finish(null,true);return;}drag.copied=true;drag.ids=copies;selection=new Set(copies);selected=copies[0];drag.originals=doc.clips.filter(c=>selection.has(c.id));}
      const anchor=drag.originals.find(x=>x.id===drag.ids[0]),beat=snapBeat(anchor.start+(pos.x-drag.startWorld.x)/px,e);
      // NEAREST LANE: resolve the target row from pointer y in content coordinates, never from
      // elementFromPoint, so the gaps between lane panes and the window's own edges never teleport it.
      const lane=nearestTimelineLane(pos.y,doc.lanes.length,view.height()),anchorLane=doc.lanes.findIndex(l=>l.id===c.laneId);
      model.moveClips(drag.ids,{beatDelta:beat-anchor.start,laneDelta:lane-anchorLane,originals:drag.originals});return;
    }
    if(drag.kind==='trim'){const delta=timelineResizeDelta(c,drag.edge,(pos.x-drag.startWorld.x)/px,snap,e.altKey);model.updateClip(c.id,resizeTimelineClip(c,drag.edge,delta,e.altKey?.0625:(snap||.0625)));return;}
    const plot=view.plot(c.id);if(!plot)return;const rect=plot.getBoundingClientRect(),{width,height}=plot.viewBox.baseVal,geometry=createClipCoordinates(c,curve.length,px,height),x=(e.x-rect.left)/rect.width*width,y=(e.y-rect.top)/rect.height*height;
    if(drag.kind==='step'){drawStep({beat:geometry.sourceBeatAtX(bounded(x,0,width)),value:bounded(geometry.valueAtY(y))},e.shiftKey);return;}
    if(drag.kind==='point'||drag.kind==='points'){
      const anchor={x:geometry.xAtSourceBeat(drag.pointBeat),y:geometry.yAtValue(drag.pointValue)},p=pointDrag(anchor,{x,y},e),beat=e.ctrlKey?drag.pointBeat:geometry.sourceBeatAtWorldBeat(snapBeat(geometry.worldBeatAtX(p.x),e)),value=bounded(geometry.valueAtY(p.y));
      if(drag.kind==='points'){model.movePoints(curve.id,drag.indices,beat-drag.pointBeat,value-drag.pointValue,{slide:slideMode,original:curve});}
      else{const moved=model.movePoint(curve.id,drag.index,Math.max(0,beat),value,{slide:slideMode});if(moved?.index>=0)drag.index=moved.index;}return;
    }
    if(drag.kind==='tension'){const a=curve.points[drag.index],b=curve.points[drag.index+1],sign=b.v<a.v?-1:1;drawTension=bounded(drag.tension+sign*tensionDelta(drag.y,e.y,e)/TIMELINE_TENSION_TRAVEL,-1,1);model.setTension(curve.id,drag.index,drawTension);}
  });
  function finish(e,cancel=false,rewind=false){
    if(!drag||e&&e.pointerId!==drag.pointerId)return;updates.flush();if(!drag)return;const held=drag;drag=null;delete surface.dataset.gesture;delete surface.dataset.dragClip;view.marquee.style.display='none';
    try{if(surface.hasPointerCapture(held.pointerId))surface.releasePointerCapture(held.pointerId);}catch(_){}
    if(held.kind==='scrub')controller.endScrub({cancel:rewind});
    if(held.kind==='range'&&cancel){range=held.oldRange;view.setRange(range);view.paint();}
    if(held.kind==='zoom'&&cancel)zoomAt(held.px0,held.anchor,held.anchorBeat);
    // A SELECT-tool tap on the strip (no drag, no Shift) clears the range and seeks there, as a ruler click does in FL.
    if(held.kind==='range'&&!cancel&&held.tap&&!held.moved&&!held.addRange){range=null;view.setRange(null);controller.seek(held.startBeat);view.paint();}
    if(held.author){if(cancel){model.cancel();selection=held.selectionBefore||selection;reconcile();}else model.commit();}
    if(held.kind==='select'){
      if(cancel){selection=held.oldClips;pointSelection=held.oldPoints;selected=held.activeBefore;}
      else if(!held.moved&&held.clickedClip&&scope==='clips'){const id=held.clickedClip;selection=held.additive?new Set(held.oldClips):new Set();if(held.additive&&selection.has(id))selection.delete(id);else selection.add(id);selected=selection.values().next().value||null;}
    }
    if(!cancel&&e&&['move','point','tension'].includes(held.kind)&&!held.moved&&!held.copy&&!held.added){const now=performance.now(),id=held.clip.id+':'+held.kind+':'+(held.index??'');
      if(lastTap?.id===id&&now-lastTap.time<400&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<16){lastTap=null;const current=view.getCurve(held.curve.id);if(held.kind==='move'&&current)editIdentity(e.clientX,e.clientY,current);else if(held.kind==='point'&&current)fieldMenu(e.clientX,e.clientY,current,held.index,held.clip);else if(held.kind==='tension'){drawTension=0;model.setTension(held.curve.id,held.index,0);}}
      else lastTap={id,time:now,x:e.clientX,y:e.clientY};}else lastTap=null;paintSelection();headPaint.reset();
  }
  function begin(e,value,author=false){drag={...value,x:e.clientX,y:e.clientY,pointerId:e.pointerId,startWorld:view.world(e),author,activeBefore:selected,selectionBefore:new Set(selection)};surface.dataset.gesture=value.kind;if(value.clip)surface.dataset.dragClip=value.clip.id;if(author)model.begin();e.preventDefault();surface.setPointerCapture(e.pointerId);}
  function beginPointGroup(e,c,curve,index,additive=false){
    if(pointSelection?.curveId!==curve.id)pointSelection={clipId:c.id,curveId:curve.id,indices:new Set()};
    if(additive){if(pointSelection.indices.has(index))pointSelection.indices.delete(index);else pointSelection.indices.add(index);}else if(!pointSelection.indices.has(index))pointSelection.indices=new Set([index]);
    if(!pointSelection.indices.has(index)){e.preventDefault();paintSelection();return;}
    const p=curve.points[index];begin(e,{kind:'points',clip:c,curve,index,indices:[...pointSelection.indices],pointBeat:p.t*curve.length,pointValue:p.v},true);paintSelection();
  }
  listen(surface,'pointerdown',e=>{
    if(drag)return;const target=e.target;if(target.closest('select,input,.tl-action,.tl-scope-seg,.tl-setting,.tl-clip-more,.tl-transport-host'))return;
    if(surface.contains(target)){surface.focus({preventScroll:true});}
    closeMenu();cancelConfirm();
    if(e.button===1){begin(e,{kind:'pan',scrollX:viewport.scrollLeft,scrollY:viewport.scrollTop});return;}
    const handle=target.closest('.tl-clip-title'),lane=target.closest('[data-lane]');if(lane)selectedLane=lane.dataset.lane;
    const plot=target.closest('svg[data-clip]')||(!handle&&lane&&[...lane.querySelectorAll('svg[data-clip]')].find(n=>{const r=n.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}));
    const clip=view.getClip((handle||plot||target.closest('.tl-clip'))?.dataset.clip),curve=view.getCurve(clip?.curveId),kind=clipKind(curve),cmd=e.ctrlKey||e.metaKey;
    if(e.button===0&&target.closest('.tl-ruler')){
      // THE STRIP: Ctrl, or the SELECT tool (touch needs no Ctrl), drags a range; else it scrubs. Shift's vertical drag zooms instead.
      // The zoom holds the pressed beat itself, so a scroll clamped while the arrangement is narrow never drifts it.
      const anchor=e.clientX-viewport.getBoundingClientRect().left,strip={shift:e.shiftKey&&!cmd,px0:px,anchor,anchorBeat:(viewport.scrollLeft+anchor)/px,oldRange:range};
      if(cmd||tool==='select'){begin(e,{kind:'range',startBeat:snapBeat(view.world(e).x/px,e),addRange:e.shiftKey?range:null,tap:!cmd,...strip});}
      else if(controller.beginScrub()){begin(e,{kind:'scrub',...strip});range=null;view.setRange(null);controller.scrub(view.world(e).x/px,{snap,alt:!!e.altKey,shift:!!e.shiftKey});paint();}else say(t('The renderer currently owns the clock.'));return;
    }
    if(e.button===0&&tool==='scrub'){if(controller.beginScrub()){begin(e,{kind:'scrub'});controller.scrub(view.world(e).x/px,{snap,alt:!!e.altKey,shift:!!e.shiftKey});}return;}
    // THE SLICE TOOL (C): a click on a clip, tab or body, cuts it at the pointer's beat (Snap applies, Alt bypasses).
    if(e.button===0&&tool==='slice'){e.preventDefault();if(clip)sliceAt([clip.id],snapBeat(view.world(e).x/px,e));return;}
    let hit=null,pos=null,geometry=null;
    if(plot&&!kind){pos=svgPoint(plot,e);const{width,height}=plot.viewBox.baseVal,p=createTimelinePlot(clip,curve,px,height),r=plot.getBoundingClientRect();geometry=p.geometry;hit=curveHit({x:e.clientX,y:e.clientY},p.points.map(p=>({...p,x:r.left+p.x/width*r.width,y:r.top+p.y/height*r.height})),p.handles.map(p=>({...p,x:r.left+p.x/width*r.width,y:r.top+p.y/height*r.height})),TIMELINE_CURVE_GRAB);}
    const edge=target.closest('.tl-edge');
    // A kind without points has no curve gestures: its body handles like its tab (move, Shift-copy, right-delete).
    const grab=handle||(kind?plot||target.closest('.tl-clip'):null);
    if(e.button===0&&edge&&clip&&tool==='edit'&&!cmd&&!hit?.kind){selectOnly(clip.id);begin(e,{kind:'trim',edge:edge.dataset.trim,clip,curve},true);paintSelection();return;}
    if(e.button===0&&(tool==='select'||cmd&&!(plot&&hit?.kind))){
      if(scope==='points'&&clip){if(pointSelection?.curveId!==curve.id){selected=clip.id;selection=new Set([clip.id]);pointSelection={clipId:clip.id,curveId:curve.id,indices:new Set()};}if(hit?.kind==='point'){beginPointGroup(e,clip,curve,hit.i,cmd||e.shiftKey);return;}}
      begin(e,{kind:'select',baseClips:cmd&&e.shiftKey||!cmd&&e.shiftKey?new Set(selection):new Set(),basePoints:e.shiftKey?new Set(pointSelection?.indices||[]):new Set(),oldClips:new Set(selection),oldPoints:pointSelection?{...pointSelection,indices:new Set(pointSelection.indices)}:null,clickedClip:clip?.id,additive:cmd||e.shiftKey});return;
    }
    if(grab){
      // RIGHT-CLICK DELETE: down on a tab deletes its clip at once; holding the button and crossing
      // other tabs deletes each of those too, the whole sweep as one undo transaction (begin here,
      // commit/cancel in finish()). The MIR plot curve law and the tab's ⋯ menu are untouched.
      if(e.button===2){e.preventDefault();lastTap=null;closeMenu();begin(e,{kind:'delete',clip,curve},true);if(doc.clips.some(x=>x.id===clip.id))model.deleteClip(clip.id);return;}if(e.button!==0)return;
      if(!selection.has(clip.id))selectOnly(clip.id);else selected=clip.id;const trim=target.closest('[data-trim]');begin(e,{kind:trim?'trim':'move',edge:trim?.dataset.trim,copy:e.shiftKey&&!trim,clip,curve,ids:[...selection],originals:doc.clips.filter(c=>selection.has(c.id))},true);paintSelection();return;
    }
    if(plot&&!kind){
      selected=clip.id;if(!selection.has(clip.id))selection=new Set([clip.id]);const action=curveAction(e,hit);
      if(stepMode&&tool==='edit'&&e.button===0&&!e.altKey){const position={beat:geometry.sourceBeatAtX(bounded(pos.x,0,geometry.width)),value:bounded(geometry.valueAtY(pos.y))};pointSelection=null;begin(e,{kind:'step',clip,curve,previous:position},true);drawStep(position,e.shiftKey);return;}
      if(action==='point-menu'){e.preventDefault();lastTap=null;fieldMenu(e.clientX,e.clientY,curve,hit.i,clip);return;}
      if(action==='remove-point'){e.preventDefault();pointSelection=null;model.removePoint(curve.id,hit.i);return;}
      if(action==='reset-tension'){e.preventDefault();drawTension=0;model.setTension(curve.id,hit.i,0);return;}
      if(!action){paintSelection();return;}
      if(action==='move-point'&&pointSelection?.curveId===curve.id&&pointSelection.indices.has(hit.i)&&pointSelection.indices.size>1){beginPointGroup(e,clip,curve,hit.i);return;}
      pointSelection=null;let index=hit.i,edited=curve;begin(e,{kind:action==='move-tension'?'tension':'point',added:action==='add-point',clip,curve,index,tension:curve.points[hit.i]?.tension||0},true);
      if(action==='add-point'){const beat=Math.max(0,geometry.sourceBeatAtWorldBeat(snapBeat(geometry.worldBeatAtX(pos.x),e))),value=pointAddValue(e,bounded(geometry.valueAtY(pos.y)),evaluateTimelineSource(curve,beat)),added=model.addPoint(curve.id,beat,value,0);if(!added||added.index<0){finish(null,true);return;}index=added.index;edited=added.source;}
      const p=edited.points[index];Object.assign(drag,{curve:edited,index,pointBeat:p.t*edited.length,pointValue:p.v});paintSelection();return;
    }
    if(e.button===0){selection.clear();pointSelection=null;selected=null;}paintSelection();
  });
  // DROPS: a registered handler (an audio file, a pattern row) gets the files and the beat/lane under the drop; the first true wins.
  listen(viewport,'dragover',e=>{if(!dropHandlers.size)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';});
  listen(viewport,'drop',e=>{if(!dropHandlers.size)return;e.preventDefault();const where=at(e.clientX,e.clientY),files=[...(e.dataTransfer?.files||[])];for(const fn of dropHandlers)if(fn({event:e,files,dataTransfer:e.dataTransfer,...where}))break;});
  listen(surface,'contextmenu',e=>e.preventDefault());listen(surface,'auxclick',e=>{if(e.button===1)e.preventDefault();});listen(surface,'lostpointercapture',e=>finish(e,true));
  listen(document,'pointermove',e=>{if(drag&&e.pointerId===drag.pointerId){e.preventDefault();updates.post(pointer(e));}},{passive:false});listen(document,'pointerup',e=>finish(e));listen(document,'pointercancel',e=>finish(e,true));
  listen(document,'pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!surface.contains(e.target))closeMenu();if(confirmation&&!confirmation.contains(e.target)&&!win.rail?.el?.contains(e.target))cancelConfirm();});
  /* ESCAPE is not a table action (the kit keeps it): it only ends what is in flight.  HIDE needs no key of its own here:
     whatever key the table gives it, the interface going out of paint (body.ui-hidden) ends it (hiddenObserver below) */
  listen(document,'keydown',e=>{if(e.code==='Escape'){closeMenu();cancelConfirm();finish(null,true,true);}});
  listen(document,'visibilitychange',()=>{if(document.hidden){closeMenu();cancelConfirm();finish(null,true);headPaint.reset();}});listen(globalThis,'blur',()=>{closeMenu();cancelConfirm();finish(null,true);});
  listen(view.shell,'wheel',e=>{if(!(e.ctrlKey||e.metaKey)||!e.deltaY)return;e.preventDefault();e.stopPropagation();const anchor=bounded(e.clientX-viewport.getBoundingClientRect().left,0,viewport.clientWidth),delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);zoom(Math.exp(-bounded(delta,-120,120)*.003),anchor);},{passive:false});
  const viewportPaint=coalesce(()=>{paint();if(drag?.last&&['select','point','points','move','trim'].includes(drag.kind))updates.post(drag.last);});
  listen(viewport,'scroll',()=>viewportPaint.post(),{passive:true});const observer=new ResizeObserver(()=>viewportPaint.post());observer.observe(viewport);
  const hiddenObserver=new MutationObserver(()=>{if(document.body.classList.contains('ui-hidden')){closeMenu();cancelConfirm();finish(null,true);headPaint.reset();}else if(win.isOpen())viewportPaint.post();});hiddenObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  const unsubscribe=model.subscribe(()=>{doc=model.state();view.setDocument(doc);view.setActive(activeRange());reconcile();if(win.isOpen()&&!document.body.classList.contains('ui-hidden'))paint();present();});
  const resetSubscription=model.beforeReplace(()=>{closeMenu();finish(null,true);selection.clear();pointSelection=null;selected=null;range=null;view.setRange(null);});
  const transportSubscription=controller.subscribe(reason=>{if(['seek','scrub','scrub-end'].includes(reason))headPaint.reset();else headPaint.paint();});
  function setWorkLane(value){finish(null,true);workLane=['top','bottom','hidden'].includes(value)?value:'top';surface.dataset.workLane=workLane;win.root?.dispatchEvent(new CustomEvent('timeline-work-lane',{detail:{lane:workLane}}));paint();}

  /* ── THE KEY TABLE'S VERBS (keys.js timelineActions: the one source of the keys and of the shortcut sheet) ── */
  const nudge=(dir,lanes,fine)=>{finish(null,true);const step=fine?.0625:snap||.0625;model.moveClips([...selection],{beatDelta:dir*step,laneDelta:lanes});};
  const act={
    selectAll, deselect,
    duplicate:()=>{finish(null,true);duplicateSelection();}, copy:()=>copySelection(), cut:()=>{finish(null,true);copySelection(true);}, paste:()=>{finish(null,true);pasteSelection();},
    undo:()=>{finish(null,true);model.undo();}, redo:()=>{finish(null,true);model.redo();},
    rangeToSelection:()=>{if(!selection.size)return;const clips=doc.clips.filter(c=>selection.has(c.id));range={start:Math.min(...clips.map(c=>c.start)),end:Math.max(...clips.map(c=>c.start+c.duration))};view.setRange(range);paint();},
    slideRange:dir=>{if(!range)return;const d=(range.end-range.start)*dir,start=Math.max(0,range.start+d);range={start,end:start+range.end-range.start};view.setRange(range);paint();},
    deleteSelection:()=>{finish(null,true);deleteSelection();},
    home:()=>{finish(null,true);controller.beginning();},
    bar:dir=>{finish(null,true);const beat=transportBeat(),m=doc.meter;controller.seek(dir>0?(Math.floor(beat/m)+1)*m:Math.max(0,(Math.ceil(beat/m)-1)*m));},
    centerPlayhead:()=>{viewport.scrollLeft=Math.max(0,transportBeat()*px-viewport.clientWidth/2);paint();},
    // A ZOOM LEVEL (Shift+1/2/3) starts the view at the ruler range's start, else at the start of the bar the view's left edge
    // is in: a level never leaves the left edge mid-bar with the first clip's title cut off (BASINS' view was at the bar).
    zoomLevel:n=>{const start=range?range.start:Math.floor(viewport.scrollLeft/px/doc.meter)*doc.meter;finish(null,true);px=bounded({1:12,2:20,3:40}[n],8,100);paint();viewport.scrollLeft=Math.max(0,start*px);paint();},
    zoomAll:()=>{const saved=selection,savedRange=range;selection=new Set();range=null;zoomSelection();selection=saved;range=savedRange;paintSelection();},
    zoomSelection, zoomStep:dir=>zoom(dir>0?1.25:1/1.25),
    invert:()=>{selection=new Set(doc.clips.filter(c=>!selection.has(c.id)).map(c=>c.id));selected=selection.values().next().value||null;paintSelection();},
    nudge, sliceAtPlayhead:()=>{if(selection.size)sliceAt([...selection],transportBeat(),true);else say(t('Select clips to slice them at the playhead.'));},
    tool:name=>{finish(null,true);setTool(name);},
    stretchAudio:()=>{const curves=new Map(doc.curves.map(c=>[c.id,c])),chosen=[...selection].filter(id=>curves.get(doc.clips.find(c=>c.id===id)?.curveId)?.kind==='audio');if(!chosen.length)return false;model.begin();const scales=chosen.map(id=>stretchAudioClip(model,id));model.commit();
      const first=model.state().clips.find(c=>c.id===chosen[0]),src=model.state().curves.find(c=>c.id===first?.curveId);
      if(first&&src&&scales[0]!=null)say(t('STRETCH ×{rate} · pitch follows',{rate:audioRate(first,src,mod.host.model.transport.bpm).toFixed(3)}));return true;},
  };
  const api={surface,transportHost,toolbar,createClip,addClip,at,model,paint,px:()=>px,view,act,onShortcuts:null,
    range:()=>range?{...range}:null,activeRange,setActiveRange,onDrop(fn){dropHandlers.add(fn);return()=>dropHandlers.delete(fn);},
    slice:(ids,beat)=>sliceAt(ids,beat,true),tool:()=>tool,setTool(name){finish(null,true);if(toolButtons.has(name))setTool(name);},gesture:()=>drag?{kind:drag.kind,clip:drag.clip?.id??null,curve:drag.curve?.id??null,index:drag.index??null,edge:drag.edge??null}:null,paintHead:()=>headPaint.paint(),selected:()=>selected,selection:()=>({clips:[...selection],points:pointSelection?[...pointSelection.indices]:[]}),workLane:()=>workLane,setWorkLane,
    snap:()=>snap,setSnap(v){snap=Number(v)||0;snapStep.set(snap);},scope:()=>scope,
    /** how many of the bar's tools are folded behind MORE (the bar keeps one line; they fold from its end) */
    folded:()=>fold.length-shown,
    /** the timeline's keys are live: the window is open and the focus is in the surface, not in a field or the transport */
    keysLive:()=>win.isOpen()&&!!document.activeElement&&surface.contains(document.activeElement)&&!editable(document.activeElement)&&!transportHost.contains(document.activeElement),
    locate(id){finish(null,true);const curve=doc.curves.find(c=>c.targetId===id),clip=doc.clips.find(c=>c.curveId===curve?.id);win.open();if(clip){selectOnly(clip.id);selectedLane=clip.laneId;paint();viewport.scrollLeft=Math.max(0,clip.start*px-20);}},
    removeLane(){finish(null,true);removeLane();},addLane(){finish(null,true);return model.addLane();},close(){closeMenu();cancelConfirm();finish(null,true);headPaint.reset();},
    dispose(){api.close();events.abort();observer.disconnect();fitObserver.disconnect();hiddenObserver.disconnect();viewportPaint.cancel();updates.cancel();unsubscribe();resetSubscription();transportSubscription();surface.remove();}};
  view.setDocument(doc);setTool('edit');setWorkLane('top');paint();return api;
}
