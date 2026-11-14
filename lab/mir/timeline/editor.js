/* timeline/editor.js — THE TIMELINE EDITOR: the work lane, the lanes, the gestures (harvested from BASINS
 * app/timeline-editor.js as Josh last tuned it, branch basins-ui-fixes-2026-10-01, 2026-10-02).
 *
 * WHAT IT IS.  The surface inside the TIMELINE window: the WORK LANE (the transport in its work-bar form hugging the left,
 * and ONE right-aligned tool bar EDIT · SELECT · SCRUB · SLICE · CLIPS/POINTS · SNAP · STEP · SLIDE · ACTIVE · ⋯ reaching the
 * resize corner: Josh's fix 5; ONE line always: what does not fit folds from the end behind ⋯, wave 19), the ruler strip
 * (scrub, range, Shift-zoom), the lanes and their clips, the playhead, the selection, the curve editor (FL's gestures: modulation/curve-gesture.js is the law), the popups, drops.  No hint row at
 * the foot (fix 6): the status line takes no space and shows only while it says something.
 *
 *   buildTimelineEditor(win, { model, mod, controller, present, say, audio, keys, moreRows }) → api
 *     moreRows() → [[word, fn, id, chosen?], …]: the app's rows, after a separator at the foot of MORE (⋯) (1.5.7-alpha.4)
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
 * THE HANDS (1.5.6-alpha.23, λWAVES 032): ONE MODIFIER TABLE — Shift selects and fines (the ruler's range, the marquee, a
 * clip's toggle, ⅛ on a point, a tension or a stretch); Ctrl shapes (the ruler's zoom, a clip's clone and stretch, a point's
 * time lock); Alt bypasses Snap and deletes a point.  The EDIT tool's click on empty lane space stamps the clip last pressed
 * (THE PENCIL: its curve, shared).  The words are shortcuts.js TIMELINE_POINTER.
 * THE TIMELINE'S HANDS (λWAVES 040, 1.5.7-alpha.38 …): THE RIGHT CLICK DELETES — a right-button press on empty lane space or
 * between the lanes sweeps every clip the pointer crosses (one undo); the lane's right-click menu is gone.  SHIFT-DRAG CLONES
 * (alpha.39): Shift + drag on a clip duplicates the selection and moves the copies, a Shift click still toggles, Shift on empty
 * space is still the marquee; Ctrl + drag's clone stays as an alias.  THE RANGE STAYS (alpha.40): no press on the ruler clears
 * the range; a double-tap at one spot (TAP: 300 ms, 14 px) does.
 * THE MODES (λWAVES 041, 1.5.7-alpha.49): the left button's tool is one of nine (MODES: PENCIL · PAINT · PAINT ADD · DELETE · MUTE · SLICE · SELECT ·
 * ZOOM · PREVIEW), chosen in THE MODE MENU (a middle click on the lanes, the chord middle + right, the bar's MODE chip) or on the bar; the cursor wears
 * it.  The right button, Shift and the ruler keep 040's hands under every mode.
 * THE LAWS (BASINS', unchanged): one musical-to-pixel mapping (geometry.js) for drawing, hit tests and edits; a gesture is
 * one model transaction (begin … commit, or cancel on Escape, a lost capture, a blur, a hidden page or a hidden interface); a drag's last
 * pointer sample is flushed before its commit; the nearest lane is resolved from content coordinates, never from
 * elementFromPoint; the hand leads the scrub (controller.js); zoom keeps the beat under the anchor; the playhead paints by
 * transform from the clock's tick; idle costs nothing (the only listeners are events; no loop — the edge pump runs only while a
 * drag is held at the viewport's edge).  THE TIMELINE SCROLLS UNDER THE POINTER (1.5.7-alpha.9): the wheel scrolls time, a drag
 * at the edge scrolls it (the wheel listener and the edge pump, below).
 * CHANGED FOR THE KIT: words through label / ariaLabel / t (nothing is found by its words); the keyboard is the app's one
 * key table (keys.js timelineActions: this file only exposes the verbs); toasts through `say`; the frame coalescer is
 * core/frame.js; the popups are the house's menu pane; BASINS' CURVE_VIEW numbers live in geometry.js. */
import { svgPoint, curveHit, curveAction, pointDrag, pointAddValue, tensionDelta, fineGear } from '../modulation/curve-gesture.js';
import { el, label, ariaLabel, seg, stepper, number, TAP } from '../kit.js';
import { confirmDialog } from '../shell/dialog.js';
import { glyphSvg } from '../glyph.js';
import { frame } from '../core/frame.js';
import { isField } from '../core/pointer.js';
import { cssZoom } from '../core/zoom.js';
import { t, tn } from '../core/i18n.js';
import { coalesce } from './readout.js';
import { TIMELINE_TAB_HEIGHT, TIMELINE_ROW_GAP, TIMELINE_CURVE_GRAB, TIMELINE_TENSION_TRAVEL, resizeTimelineClip, glueTimelineClips, createClipCoordinates, snapTimelineBeat, timelineResizeDelta, nearestTimelineLane, timelineEdgeAt } from './geometry.js';
import { createTimelinePlot } from './curve-view.js';
import { evaluateTimelineSource, normalizeTimelinePoints } from './source.js';
import { clipKind } from './kinds.js';
import { timelineFamily } from './model.js';
import { sliceClips } from './slice.js';
import { timelineStepSamples } from './draw.js';
import { createTimelineView } from './view.js';
import { createTimelinePlayhead } from './playhead.js';
import { selectionRect, clipsInRectangle, pointsInRectangle } from './selection.js';
import { stretchAudioClip, audioRate } from './audio-kind.js';

const bounded=(n,lo=0,hi=1)=>Math.min(hi,Math.max(lo,n));
const editable=target=>isField(target,true);   // every input counts: the clip menu's colour well keeps its keys
/* a word: an English key (translated, kept on the node for a language change) or [key, vars]; { raw } is data, shown as it is */
const word=(node,w)=>{if(w&&typeof w==='object'&&!Array.isArray(w)){node.textContent=w.raw;return node;}if(Array.isArray(w))return label(node,w[0],w[1]),node;label(node,w);return node;};
export const SNAPS=[[4,'1'],[1,'1/4'],[.5,'1/8'],[.25,'1/16'],[0,'OFF']];   // tr: the timeline's snap grid as note fractions: 1 a bar, 1/4 a beat, 1/8, 1/16 (1.5.6-alpha.24: was MEASURE · QUARTER · EIGHTH · SIXTEENTH)
/* THE MODES (1.5.7-alpha.49, λWAVES 041 T1): the left button's tool, FL Studio's tool column top to bottom — [id, word, glyph, hot spot,
   what the cursor covers].  `edit`, `select`, `scrub` and `slice` keep the ids they had as tools (keys, saved bindings, setTool);
   the cursor is the glyph, its hot spot in the 24 box; 'space' wears it over empty lane space only (a clip keeps its own hands). */
export const MODES=[['edit','PENCIL','edit',[3,21],'space'],['paint','PAINT','paint',[4,20],'space'],['paintadd','PAINT ADD','paintAdd',[4,20],'space'],['delete','DELETE','forbid',[12,12],'all'],['mute','MUTE','mute',[12,12],'all'],
  ['slice','SLICE','slice',[12,12],'all'],['select','SELECT','select',[4,4],'space'],['zoom','ZOOM','zoom',[10,10],'all'],['scrub','PREVIEW','preview',[12,12],'all']];   // tr: the timeline's modes (the left button's tool)
export const TOOLS=['edit','select','scrub','slice'].map(id=>MODES.find(m=>m[0]===id).slice(0,3));   // the four on the bar: [id, word, glyph]
const PEN=new Set(['edit','paint','paintadd']);   // the modes that keep the pencil's hands on a clip (move, trim, stretch, the curve)
/* a mode's cursor: its glyph in white over four dark copies a unit out (legible on any pane), as an image with the hot spot */
const modeCursor=(glyph,[hx,hy])=>{const g=(dx,dy,ink)=>glyphSvg(glyph,'',24).replace('<svg ',`<svg x="${dx+1}" y="${dy+1}" color="${ink}" `);
  const art=`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">${[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y])=>g(x,y,'#10141c')).join('')}${g(0,0,'#fff')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(art)}") ${hx+1} ${hy+1}, crosshair`;};
const SCOPES=[['clips','CLIPS'],['points','POINTS']];   // what a selection picks: whole clips or curve points
const FOLD_SLACK=6;   // px: a folded tool comes back to the bar only with this much room to spare (a bar at the edge never flickers)
export const SWATCHES=['#a7adb8','#f8858b','#e9b368','#a5cb7b','#6cc1cc','#92a7e9','#c297e6'];   // BASINS' seven clip tints, the six hues 20 % more chroma in oklch, same lightness and hue (1.5.6-alpha.24, T10; data: a clip's colour is saved, so a clip keeps the tint it was given)

export function buildTimelineEditor(win,{model,mod,controller,present=()=>{},say=()=>{},audio=null,keys=null,moreRows=null}) {
  /* the chord the app's table holds for a timeline action, in the user's platform ('' when none): never typed here */
  const chordOf=id=>{const k=typeof keys==='function'?keys():keys;return k&&k.get&&k.get('timeline.'+id)?k.menuKey('timeline.'+id):'';};
  const withKey=(node,id)=>{const c=id&&chordOf(id);if(c)el('span','tl-key',node).textContent=' · '+c;return node;};
  let doc=model.state(),selectedLane=doc.lanes[0].id,selected=null,selection=new Set(),pointSelection=null;
  let px=20,snap=1,range=null,menu=null,drag=null,lastTap=null,rulerTap=null,clipboard=null,lastClip=null;   // lastClip: THE PENCIL's memory, the clip last pressed; rulerTap: the ruler's last press (THE RANGE STAYS)
  let stepMode=false,slideMode=false,drawTension=0,tool='edit',scope='clips',workLane='top';
  const dropHandlers=new Set();
  const transportBeat=()=>mod.host.model.transport.beats;
  const events=new AbortController(),listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:events.signal});
  const surface=el('div','timeline-surface',win.body);surface.style.setProperty('--tl-tab-height',TIMELINE_TAB_HEIGHT+'px');surface.style.setProperty('--tl-row-gap',TIMELINE_ROW_GAP+'px');ariaLabel(surface,'Timeline workspace');surface.tabIndex=0;
  const worklane=el('div','tl-worklane',surface),transportHost=el('div','tl-transport-host',worklane);ariaLabel(transportHost,'Timeline transport');
  const toolbar=el('div','tl-toolbar glass',worklane);toolbar.setAttribute('role','toolbar');ariaLabel(toolbar,'Timeline tools');
  const button=(parent,text,fn,cls='')=>{const b=el('button','trig tl-action '+cls,parent);b.type='button';word(b,text);b.addEventListener('click',()=>{finish(null,true);fn(b);});return b;};
  // The tools keep their word as the accessible name and the hint (data-help) when the icon takes the face.
  const toolButtons=new Map();for(const[name,text,glyph]of TOOLS){const b=button(toolbar,text,()=>setTool(name),'tl-tool');b.dataset.tool=name;b.dataset.keyAction='timeline.tool-'+name;b.setAttribute('aria-pressed',String(name===tool));ariaLabel(b,text);b.dataset.help=text;
    b.textContent='';delete b.dataset.t;b.insertAdjacentHTML('beforeend',glyphSvg(glyph,'gly gly-'+glyph,16));b.querySelector('svg')?.setAttribute('aria-hidden','true');b.classList.add('tl-icon');toolButtons.set(name,b);}
  /* THE MODE CHIP (1.5.7-alpha.49): after the four tools, a trigger that wears the mode in force and opens THE MODE MENU under itself — the
     finger's road to it (a mouse has the middle button); it folds behind ⋯ with the rest */
  const modesButton=button(toolbar,{raw:''},b=>{if(menu?.dataset.pop==='modes'){closeMenu();return;}const r=b.getBoundingClientRect();modeMenu(r.left,r.bottom+4);},'tl-icon tl-modes-chip');
  modesButton.dataset.mode='modes';modesButton.setAttribute('aria-haspopup','menu');ariaLabel(modesButton,'Timeline modes');modesButton.dataset.help='MODE';
  /* THE KIT'S OWN CHOOSERS, NEVER A NATIVE <select> (Josh, 2026-10-07, call 19; docs/CONTROLS.md): the scope is one of two
     modes, all visible — a SEGMENT; SNAP is one of five in order — a STEPPER, compact (its name opens the list, ← → ↑ ↓ step
     it), whose seat is its longest word, so a choice moves nothing (the hand law).  Same values, same effects as the selects. */
  const scopeCtl={get:()=>scope,set(v){finish(null,true);scope=v;scopeSeg.set(v);setTool('select');}};
  const scopeSeg=seg({aria:'Selection scope',options:SCOPES.map(([id,name])=>({id,label:name})),value:scope,cls:'tl-scope-seg',onChange:v=>scopeCtl.set(v)});   // tr: what a selection picks: whole clips or curve points
  scopeSeg.root.querySelector('.seg').classList.add('tl-scope');toolbar.appendChild(scopeSeg.root);const scopeWrap=scopeSeg.root;
  const snapLabel=el('div','tl-setting',toolbar),snapWord=el('span','tl-setting-word',snapLabel);label(snapWord,'SNAP');
  const snapStep=stepper({aria:'Timeline snap',options:SNAPS.map(([id,name])=>({id,label:name})),value:snap,compact:true,cls:'tl-snap',onChange:v=>{finish(null,true);snap=v;}});el('span','tl-select-wrap',snapLabel).appendChild(snapStep.root);
  const snapCtl={get:()=>snap,set(v){finish(null,true);snap=v;snapStep.set(v);}};
  const modeButton=(name,read,write,title,id)=>{const b=button(toolbar,name,()=>{write(!read());b.setAttribute('aria-pressed',String(read()));b.classList.toggle('on',read());surface.classList.toggle('tl-step-mode',stepMode&&PEN.has(tool));paintSelection();});b.dataset.mode=id;b.setAttribute('aria-pressed','false');b.title=title;return b;};
  const stepButton=modeButton('STEP',()=>stepMode,v=>stepMode=v,'Draw on Snap. Shift draws pulses. Snap OFF uses 1/16 beat.','step');
  const slideButton=modeButton('SLIDE',()=>slideMode,v=>slideMode=v,'Move following point times together.','slide');
  // ACTIVE marks the ruler's range (none: the whole arrangement) as THE ACTIVE RANGE; pressed again on the same span, it clears.
  const activeButton=button(toolbar,'ACTIVE',()=>markActive());activeButton.dataset.mode='active';activeButton.setAttribute('aria-pressed','false');activeButton.title='Mark the selected time range (or the whole arrangement) as the active range';
  // MORE (⋯, a trigger: no lamp) always ends the bar: the tools folded off the bar (in bar order), then the selection's actions.
  const moreButton=button(toolbar,{raw:''},b=>{const r=b.getBoundingClientRect();pop(r.left,r.bottom,'SELECTION',[
    ...(audio?.pick?[['ADD AUDIO…',()=>audio.pick({laneId:selectedLane,start:controller.state().beat}),'add-audio']]:[]),['ZOOM TO SELECTION',zoomSelection,'zoom-selection'],['DUPLICATE',duplicateSelection,'duplicate'],['COPY',()=>copySelection(),'copy'],['CUT',()=>copySelection(true),'cut'],['PASTE',pasteSelection,'paste'],['DELETE',deleteSelection,'delete'],['SELECT ALL',selectAll,'select-all'],['DESELECT',deselect,'deselect'],['SHORTCUTS',()=>api.onShortcuts?.(r.left,r.bottom),'shortcuts'],...appRows()],'more');
    const head=menu.firstChild;for(const f of fold.slice(shown))menu.insertBefore(f.row(r),head);if(shown<fold.length){placeMenu(r.left,r.bottom);menu.querySelector('button')?.focus();}},'tl-icon');
  moreButton.dataset.mode='more';moreButton.insertAdjacentHTML('beforeend',glyphSvg('more','gly gly-more',16));ariaLabel(moreButton,'More tools and actions');
  /* THE ONE LINE (wave 19, Josh: "never let the timeline's work bars word wrap"): the bar keeps one line; the tools that do
     not fit fold from the END behind MORE, so the first tools never move (the hand law).  A folded tool's row in MORE's list
     acts through the bar's own control (the same press, the same state; the keys never cared where it sits) and shows its
     pressed state.  Space is measured in the kit's frame (read, then write) on ONE ResizeObserver: no loop, no poll. */
  const mirrorRow=(src,text)=>(r,parent=menu)=>{const row=button(parent,{raw:''},()=>{closeMenu();src.click();},'tl-row');row.dataset.fold=src.dataset.tool||src.dataset.mode;
    const icon=src.querySelector('svg');if(icon)row.appendChild(icon.cloneNode(true));word(el('span','tl-row-word',row),text);withKey(row,src.dataset.tool&&'tool-'+src.dataset.tool);
    const on=src.getAttribute('aria-pressed');if(on){row.setAttribute('aria-pressed',on);row.classList.toggle('on',on==='true');}return row;};
  const choiceRow=(id,ctl,rows,title,text)=>r=>{const now=rows.find(([v])=>v===ctl.get())||rows[0];
    const row=button(menu,{raw:text(t(now[1]))},()=>pop(r.left,r.bottom,title,rows.map(([v,w])=>[w,()=>ctl.set(v),id+'-'+v,v===ctl.get()]),id),'tl-row');row.dataset.fold=id;return row;};
  const fold=[...[...toolButtons].map(([name,b])=>({node:b,row:mirrorRow(b,TOOLS.find(x=>x[0]===name)[1])})),{node:modesButton,row:mirrorRow(modesButton,'MODE')},
    {node:scopeWrap,row:choiceRow('scope',scopeCtl,SCOPES,'Selection scope',value=>t('SCOPE · {value}',{value}))},{node:snapLabel,row:choiceRow('snap',snapCtl,SNAPS,'SNAP',value=>t('SNAP · {value}',{value}))},   // tr: a folded setting's row in the ⋯ list: its name · the choice in force
    {node:stepButton,row:mirrorRow(stepButton,'STEP')},{node:slideButton,row:mirrorRow(slideButton,'SLIDE')},{node:activeButton,row:mirrorRow(activeButton,'ACTIVE')}];
  let shown=fold.length,fitBooked=false;const widths=new Map();
  function fit(){
    if(!worklane.getClientRects().length)return;   // the lane is hidden or the window is closed: nothing to measure
    const bar=getComputedStyle(toolbar),lane=getComputedStyle(worklane),num=v=>parseFloat(v)||0,gap=num(bar.columnGap);
    let room=worklane.clientWidth;if(lane.flexDirection!=='column')room-=transportHost.getBoundingClientRect().width/cssZoom(worklane)+num(lane.columnGap);
    // layout widths (offsetWidth), never the painted box: a hovered or pressed button is scaled (THE CHIPS' MOTION) and must not fold the bar
    for(const f of fold)if(!f.node.classList.contains('tl-folded'))widths.set(f.node,f.node.offsetWidth);
    let need=num(bar.paddingLeft)+num(bar.paddingRight)+num(bar.borderLeftWidth)+num(bar.borderRightWidth)+moreButton.offsetWidth,k=0;
    for(;k<fold.length;k++){need+=(widths.get(fold[k].node)||0)+gap;if(need>room-(k>=shown?FOLD_SLACK:0)+.5)break;}
    if(k!==shown)frame.write(()=>foldAt(k));
  }
  function foldAt(k){shown=k;fold.forEach((f,i)=>f.node.classList.toggle('tl-folded',i>=k));moreButton.dataset.folded=String(fold.length-k);if(menu?.dataset.pop==='more')closeMenu();}
  const fitObserver=new ResizeObserver(()=>{if(fitBooked)return;fitBooked=true;frame.read(()=>{fitBooked=false;fit();});});
  for(const n of [worklane,transportHost,moreButton,...fold.map(f=>f.node)])fitObserver.observe(n);
  /* THE EVENT TARGET (1.5.6-alpha.24): how many bands a target has now (registry describe(id).steps: its options, a toggle's two) */
  const stepsOf=id=>mod.registry.has(id)?mod.registry.describe(id).steps??null:null;
  const view=createTimelineView(surface,{pixels:()=>px,stepsOf,onClipMenu(e,c,curve){finish(null,true);clipMenu(e.clientX,e.clientY,c,curve);}});
  const {viewport,status}=view;
  const headPaint=createTimelinePlayhead({head:view.head,tail:view.tail,controller,clock:{beats:transportBeat,playing:()=>mod.host.clock.isPlaying(),bpm:()=>mod.host.model.transport.bpm},visible:()=>win.isOpen()&&!document.hidden&&!document.body.classList.contains('ui-hidden'),pixels:()=>px,scroll:()=>viewport.scrollLeft});
  const snapBeat=(beat,e)=>snapTimelineBeat(beat,snap,!!e?.altKey),closeMenu=()=>{const back=menu?.dataset.pop==='modes'&&menu.contains(document.activeElement);menu?.remove();menu=null;if(back)surface.focus({preventScroll:true});};   // THE MODE MENU closed from inside it hands the focus back to the surface: the timeline's keys stay live
  function setTool(name){const mode=MODES.find(m=>m[0]===name)||MODES[0];tool=mode[0];surface.dataset.tool=tool;surface.dataset.cursor=mode[4];surface.style.setProperty('--tl-mode-cursor',modeCursor(mode[2],mode[3]));
    surface.classList.toggle('tl-step-mode',stepMode&&PEN.has(tool));for(const[id,b]of toolButtons){b.setAttribute('aria-pressed',String(id===tool));b.classList.toggle('on',id===tool);}
    modesButton.replaceChildren();modesButton.insertAdjacentHTML('beforeend',glyphSvg(mode[2],'gly gly-'+mode[2],16));modesButton.firstChild?.setAttribute('aria-hidden','true');modesButton.dataset.now=tool;paintSelection();}
  function selectOnly(id){selected=id;selection=new Set(id?[id]:[]);pointSelection=null;paintSelection();}
  /* the status line: what is selected, and the mode's one sentence (BASINS' words), only while there is something to say */
  function statusText(){const parts=[];
    if(pointSelection?.indices.size)parts.push(tn(pointSelection.indices.size,'{n} point selected','{n} points selected',{n:pointSelection.indices.size}));
    else if(selection.size)parts.push(tn(selection.size,'{n} clip selected · {target}','{n} clips selected · {target}',{n:selection.size,target:view.getCurve(view.getClip(selected)?.curveId)?.targetId||''}));
    if(stepMode&&PEN.has(tool))parts.push(t('STEP: draw; Shift for pulses'));
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
  function markActive(){const end=model.extent({unmuted:false})?.end??0,next=range?{...range}:end>0?{start:0,end}:null,now=activeRange();
    if(!next){say(t('Nothing to mark: drag a time range on the strip or add clips.'));return;}
    setActiveRange(now&&Math.abs(now.start-next.start)<1e-9&&Math.abs(now.end-next.end)<1e-9?null:next);}
  function zoomSelection(){finish(null,true);const clips=doc.clips.filter(c=>selection.has(c.id));
    const bounds=clips.length?{start:Math.min(...clips.map(c=>c.start)),end:Math.max(...clips.map(c=>c.start+c.duration))}:range||model.extent({unmuted:false});if(!bounds)return;
    px=bounded((viewport.clientWidth-40)/Math.max(.0625,bounds.end-bounds.start),8,100);paint();viewport.scrollLeft=Math.max(0,bounds.start*px-20);paint();}
  function duplicateSelection(){const ids=model.duplicateClips([...selection]);if(!ids){const r=model.lastRefusal;say(r?t(r.why,r.vars):t('No copies made: select clips with room in the arrangement.'));return;}selection=new Set(ids);selected=ids[0];pointSelection=null;paintSelection();}
  function copySelection(cut=false){const value=model.copyClips([...selection]);if(!value)return;clipboard=value;if(cut){model.deleteClips([...selection]);selection.clear();selected=null;}paintSelection();}
  function pasteSelection(){if(!clipboard)return;const ids=model.pasteClips(clipboard,{start:snapBeat(transportBeat()),laneId:selectedLane});if(!ids){const r=model.lastRefusal;say(r?t(r.why,r.vars):t('No clips pasted: the selected lanes or source budget cannot fit this group.'));return;}selection=new Set(ids);selected=ids[0];pointSelection=null;paintSelection();}
  function deleteSelection(){if(scope==='points'){if(pointSelection?.indices.size){const result=model.removePoints(pointSelection.curveId,[...pointSelection.indices]);if(!result?.removed)say(t('Keep at least two curve points.'));else pointSelection=null;}}else{model.deleteClips([...selection]);selection.clear();selected=null;}paintSelection();}
  function selectAll(){if(scope==='points'){const c=view.getClip(selected),curve=view.getCurve(c?.curveId);if(curve)pointSelection={clipId:c.id,curveId:curve.id,indices:new Set(curve.points.flatMap((p,i)=>p.t*curve.length>=c.offset&&p.t*curve.length<=c.offset+c.duration*c.scale?[i]:[]))};}else{selection=new Set(doc.clips.map(c=>c.id));selected||=doc.clips[0]?.id||null;}paintSelection();}
  function deselect(){selection.clear();pointSelection=null;selected=null;paintSelection();}
  function placeMenu(x,y) {
    const r=menu.getBoundingClientRect(),z=cssZoom(menu);menu.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x))/z+'px';menu.style.top=Math.max(8,Math.min(innerHeight-r.height-8,y))/z+'px';   // seen; written ÷ UI SCALE (a .tl-pop is a zoomed root)
  }
  /* a popup: the house's menu pane; `title` is a word (or { raw } for a clip's own name); each action [word, fn, id, chosen?]
     (a boolean `chosen` makes the row a choice that shows whether it is the one in force) */
  /* 1.5.7-alpha.4 · THE APP'S ROWS (λWAVES 036 K4): `moreRows()` hands MORE its own rows, after a separator; nothing passed, nothing shown */
  function appRows(){const rows=typeof moreRows==='function'?(moreRows()||[]).filter(Array.isArray):[];return rows.length?[null,...rows]:[];}
  function pop(x,y,title,actions,id='') {
    closeMenu();menu=el('div','tl-pop glass',document.body);menu.dataset.mirSurface='menu';if(id)menu.dataset.pop=id;menu.setAttribute('role','menu');
    const head=word(el('div','tl-pop-title',menu),title);ariaLabel(menu,typeof title==='string'?title:'Clip options');if(title&&title.raw)menu.setAttribute('aria-label',head.textContent);
    for(const a of actions){if(!a){el('div','tl-pop-sep',menu).setAttribute('role','separator');continue;}const [text,fn,id,chosen]=a;const b=withKey(button(menu,text,()=>{closeMenu();fn();}),id);if(id)b.dataset.row=id;if(typeof chosen==='boolean'){b.setAttribute('aria-pressed',String(chosen));b.classList.toggle('on',chosen);}}
    placeMenu(x,y);menu.querySelector('button')?.focus();
  }
  /* THE MODE MENU (1.5.7-alpha.49, λWAVES 041 T1; Josh: "this super cool feature from FL Studio which is 'Middle-mouse click+Right Click' which shows
     cursor 'Mode' controls … To the right side, it could simply have the menus in it's own section called 'Menu' … Make it as large too"): FL's context
     tool-menu.  MODE: the nine modes as large icon rows, a radio dot each (the one in force filled).  MENU: this window's menus as rows that open their
     lists in its place (EDIT · SELECT · ZOOM · SNAP · SCOPE), the bar's switches (STEP · SLIDE · ACTIVE, through the bar's own controls), then the ⋯
     menu's own rows; the rest of the column is empty.  A middle-button click on the lanes opens it at the pointer, and so does the chord middle +
     right in either order (the surface's pointermove, below); the bar's MODE chip opens it for a finger. */
  function modeMenu(x,y){finish(null,true);closeMenu();menu=el('div','tl-pop tl-modes glass',document.body);menu.dataset.mirSurface='menu';menu.dataset.pop='modes';menu.setAttribute('role','menu');ariaLabel(menu,'Timeline modes');
    menu.addEventListener('contextmenu',e=>e.preventDefault());   // the chord's right button comes up over it
    // by keyboard: ↑ ↓ walk a column (round), ← → cross to the other at the same height; Enter and Space press, Escape closes (the document's)
    menu.addEventListener('keydown',e=>{const cols=[left,right],at=cols.findIndex(c=>c.contains(document.activeElement));if(at<0||!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();
      const rows=c=>[...c.querySelectorAll('button')],list=rows(cols[at]),i=list.indexOf(document.activeElement),other=rows(cols[1-at]);
      (e.key==='ArrowDown'||e.key==='ArrowUp'?list[(i+(e.key==='ArrowDown'?1:-1)+list.length)%list.length]:other[Math.min(i,other.length-1)])?.focus();});
    const left=el('div','tl-modes-col',menu),right=el('div','tl-modes-col tl-modes-menu',menu);label(el('div','tl-pop-title',left),'MODE');label(el('div','tl-pop-title',right),'MENU');
    for(const[id,text,glyph]of MODES){const b=button(left,{raw:''},()=>{closeMenu();setTool(id);},'tl-mode');b.dataset.modeRow=id;b.setAttribute('role','menuitemradio');b.setAttribute('aria-checked',String(id===tool));b.classList.toggle('on',id===tool);
      ariaLabel(b,text);b.dataset.help=text;el('span','tl-mode-dot',b);b.insertAdjacentHTML('beforeend',glyphSvg(glyph,'gly gly-'+glyph,24));b.lastChild.setAttribute('aria-hidden','true');}
    const sub=(text,title,rows,id)=>{const b=button(right,text,()=>pop(x,y,title,rows(),id),'tl-row tl-sub');b.dataset.row=id;b.insertAdjacentHTML('beforeend',glyphSvg('chevronRight','gly tl-sub-arrow',12));return b;};
    const choices=(ctl,rows,id)=>()=>rows.map(([v,w])=>[w,()=>ctl.set(v),id+'-'+v,v===ctl.get()]);
    sub('EDIT','EDIT',()=>[['DUPLICATE',duplicateSelection,'duplicate'],['COPY',()=>copySelection(),'copy'],['CUT',()=>copySelection(true),'cut'],['PASTE',pasteSelection,'paste'],['DELETE',deleteSelection,'delete']],'menu-edit');
    sub('SELECT','SELECT',()=>[['SELECT ALL',selectAll,'select-all'],['DESELECT',deselect,'deselect'],['INVERT SELECTION',act.invert,'invert']],'menu-select');
    sub('ZOOM','ZOOM',()=>[['ZOOM TO SELECTION',zoomSelection,'zoom-selection'],['ZOOM ALL',act.zoomAll,'zoom-all'],['ZOOM IN',()=>act.zoomStep(1),'zoom-in'],['ZOOM OUT',()=>act.zoomStep(-1),'zoom-out']],'menu-zoom');
    sub('SNAP','SNAP',choices(snapCtl,SNAPS,'snap'),'menu-snap');sub('SCOPE','Selection scope',choices(scopeCtl,SCOPES,'scope'),'menu-scope');
    el('div','tl-pop-sep',right).setAttribute('role','separator');
    for(const[src,text]of[[stepButton,'STEP'],[slideButton,'SLIDE'],[activeButton,'ACTIVE']])mirrorRow(src,text)(null,right);
    el('div','tl-pop-sep',right).setAttribute('role','separator');
    for(const[text,fn,id]of[...(audio?.pick?[['ADD AUDIO…',()=>audio.pick({laneId:selectedLane,start:controller.state().beat}),'add-audio']]:[]),['SHORTCUTS',()=>api.onShortcuts?.(x,y),'shortcuts']]){const b=withKey(button(right,text,()=>{closeMenu();fn();},'tl-row'),id);b.dataset.row=id;}
    for(const a of appRows()){if(!a){el('div','tl-pop-sep',right).setAttribute('role','separator');continue;}const[text,fn,id,chosen]=a,b=button(right,text,()=>{closeMenu();fn();},'tl-row');if(id)b.dataset.row=id;if(typeof chosen==='boolean'){b.setAttribute('aria-pressed',String(chosen));b.classList.toggle('on',chosen);}}
    placeMenu(x,y);(left.querySelector('.on')||left.querySelector('button'))?.focus();}
  function editIdentity(x,y,curve,clip) {
    pop(x,y,'CLIP TITLE / COLOR',[],'identity');menu.setAttribute('role','dialog');ariaLabel(menu,'Clip title and color');
    const titleLabel=el('label','tl-field',menu),input=el('input','tl-value-input',titleLabel);titleLabel.prepend(label(el('span','tl-field-word'),'TITLE'));input.value=curve.name;input.maxLength=80;ariaLabel(input,'Clip title');
    const colorLabel=el('label','tl-field tl-color-field',menu),color=el('input','tl-color-input',colorLabel);colorLabel.prepend(label(el('span','tl-field-word'),'TINT'));color.type='color';color.value=curve.color;ariaLabel(color,'Clip color');
    const swatches=el('div','tl-swatches',menu);
    for(const tint of SWATCHES){const b=el('button','tl-swatch',swatches);b.type='button';b.dataset.tint=tint;b.style.setProperty('--tl-clip-tint',tint);ariaLabel(b,'Tint {tint}',{tint});b.onclick=()=>{color.value=tint;};}
    // THE COPIES WEAR ONE COLOUR (1.5.7-alpha.42): a new tint paints the clip's family (timelineFamily) — one undo
    const apply=()=>{const tint=color.value,family=clip&&tint!==curve.color?timelineFamily(model.state(),clip.id):[];model.begin();model.updateCurve(curve.id,{name:input.value.trim()||curve.targetId,color:tint});for(const id of family)if(id!==curve.id)model.updateCurve(id,{color:tint});model.commit();closeMenu();};
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
      ['TITLE / COLOR',()=>editIdentity(x,y,curve,c),'identity'],
      [c.mute?'ENABLE CLIP':'DISABLE CLIP',()=>model.updateClip(c.id,{mute:!c.mute}),'mute'],   // T25: the MUTE row's words (clip.mute, the row id unchanged)
      ['DUPLICATE',()=>{selectOnly(c.id);duplicateSelection();},'duplicate'],
      ...(drives&&typeof mod.view?.api?.armFor==='function'?[['ROUTE NEW PARAMETER…',()=>routeClip(c.id,curve),'route']]:[]),   // T20: arm the controls, the tap re-targets the clip
      ...(drives?[['OUTPUT RANGE',()=>{pop(x,y,'NORMALIZED MIN / MAX',[],'range');const num=(o)=>{const n=number({min:0,max:1,step:.01,...o});n.root.classList.add('tl-value-num');menu.appendChild(n.root);return n;};const lo=num({aria:'Output minimum',value:curve.min}),hi=num({aria:'Output maximum',value:curve.max});button(menu,'APPLY',()=>{for(const n of [lo,hi])if(n.editing)n.close(true);model.updateCurve(curve.id,{min:lo.get(),max:hi.get()});closeMenu();}).dataset.tlAction='apply';},'output-range']]:[]),   // the kit's number fields (call 19)
      ...(kind?[]:[['ADD MIDPOINT',()=>{const beat=c.offset+c.duration*c.scale/2;model.addPoint(curve.id,beat,evaluateTimelineSource(curve,beat));},'add-midpoint']]),
      ['STRETCH ×2',()=>model.updateClip(c.id,{duration:c.duration*2,scale:c.scale/2}),'stretch'],
      ...(kind?.menu?.(curve,c,{model,editor:api})||[]),
      ['DELETE CLIP',()=>model.deleteClip(c.id),'delete-clip']
    ],'clip');
  }

  /* THE LANE ASK (T9, 1.5.6-alpha.24): a lane with clips asks through the kit's confirmDialog (danger) before it goes; the
     rail's chip removes the bottom lane (the lane's own right-click menu went in 1.5.7-alpha.38: the right click deletes).  → Promise<boolean> */
  async function removeLane(laneId=doc.lanes.at(-1)?.id){const result=model.removeLane(laneId);if(result.ok||!result.confirm)return !!result.ok;
    const yes=await confirmDialog(tn(result.count,'Remove {n} clip in {lane}?','Remove {n} clips in {lane}?',{n:result.count,lane:result.name}),{yes:'REMOVE LANE',danger:true});
    return !!(yes&&doc.lanes.some(l=>l.id===laneId)&&model.removeLane(laneId,true)?.ok);}
  /* ROUTE NEW PARAMETER… (T20, 1.5.6-alpha.26): the modulation window's arming with no macro — every routable control lights;
     the one tapped becomes the clip's target (its curve copied first when other clips share it); Escape or a tap elsewhere ends it */
  function routeClip(clipId,curve){say(t('Tap a lit control to route {clip} to it; Escape cancels.',{clip:curve.name}));
    mod.view.api.armFor({label:curve.name,onPick(tid){const d=mod.registry.has(tid)?mod.registry.describe(tid):null,was=view.getClip(clipId)?.curveId;
      const to=model.retarget(clipId,tid,{name:d?.label||tid});if(!to){say(t('No room for another curve: remove a curve first.'));return;}
      say(to===was?t('{clip} now drives {target}',{clip:curve.name,target:d?.label||tid}):t('{clip} now drives {target} (its own copy: the other clips keep {old})',{clip:curve.name,target:d?.label||tid,old:curve.targetId}));}});}
  /* an EVENT clip's bands follow its target: a point edit on a curve drawn for another count takes the target's count (⚠ clears) */
  function syncSteps(curveId){const c=doc.curves.find(x=>x.id===curveId);if(!c||!c.steps)return;const want=stepsOf(c.targetId);if(want&&want!==c.steps)model.updateCurve(curveId,{steps:want});}
  /* createClip(targetId): a curve clip at the playhead's bar (or over the ruler's range); on a BANDED target (registry options,
     a toggle) it is an EVENT clip — a HOLD source at the band now in force, remembering the target's band count (steps) */
  function createClip(targetId){finish(null,true);if(!mod.registry.has(targetId))return null;const beat=transportBeat(),desc=mod.registry.describe(targetId),value=mod.registry.readNorm(targetId);
    const source=desc.steps?{steps:desc.steps,points:[{t:0,v:value,tension:0,segment:'hold'},{t:1,v:value,tension:0}]}:null;
    const id=model.create({targetId,name:desc.label,value,source,start:range?range.start:Math.floor(beat/doc.meter)*doc.meter,duration:range?range.end-range.start:doc.meter,laneId:selectedLane});if(!id){say(t('This time range is occupied in every lane. Add a lane or choose another range.'));return null;}selectOnly(id);win.open();paint();viewport.scrollLeft=Math.max(0,view.getClip(id).start*px-20);return id;}
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
  /* THE EDGE PUMP (1.5.7-alpha.9, λWAVES 038 T3; Josh: "If I drag the playhead back or forward, it should scroll the timeline"): a
     scrub (the playhead's drag), a range, a move, a trim or a stretch held within EDGE px of the viewport's left or right edge — or past
     it — scrolls time each frame while it holds, faster the deeper it goes; the scroll reposts the last pointer (viewportPaint), so the
     gesture follows the view.  It stops on release, a cancel, or the pointer coming back in.  THE PUMP WAITS FOR A DRAG (1.5.7-alpha.14,
     λWAVES 038 T8): it starts only once the gesture has MOVED past the 6-px slop (`drag.moved`), so a click or a tap near an edge — a
     hand always jitters a pixel — never scrolls the view or carries the playhead off (measured: a ruler click 10 px inside the right edge
     held ½ s scrolled 88 px and dropped the head 4.4 beats right of the click). */
  const EDGE=28,PUMPED=['scrub','range','move','trim','stretch','paint'];let pumpId=0,pumpX=null;
  function edgePump(){pumpId=0;if(!drag||!drag.moved||!PUMPED.includes(drag.kind)||pumpX==null)return;const r=viewport.getBoundingClientRect(),z=Math.min(EDGE,r.width/4);
    const depth=pumpX<r.left+z?pumpX-(r.left+z):pumpX>r.right-z?pumpX-(r.right-z):0;if(!depth)return;
    const was=viewport.scrollLeft;viewport.scrollLeft=Math.max(0,was+Math.sign(depth)*Math.min(48,3+Math.abs(depth)*.5));
    if(viewport.scrollLeft===was&&(depth<0||drag.kind==='scrub'||drag.kind==='range'))return;   // at the start, or a scrub at the content's end: nothing more to scroll (a moved clip grows the content, so it keeps going)
    pumpId=requestAnimationFrame(edgePump);}
  function pumpStop(){if(pumpId)cancelAnimationFrame(pumpId);pumpId=0;pumpX=null;}
  function drawStep(position,shiftKey){const{clip:c,curve,previous}=drag,grid=(snap||.0625)*c.scale;const samples=timelineStepSamples(previous,position,{step:grid,origin:c.offset-c.start*c.scale,min:c.offset,max:c.offset+c.duration*c.scale}),result=samples&&model.drawPoints(curve.id,samples,{hold:shiftKey,tension:drawTension});if((!samples||result?.full)&&!drag.warned){drag.warned=true;say(t('Curve point limit reached. Use a wider Snap grid or remove points.'));}drag.previous=position;}
  const updates=coalesce(e=>{
    if(!drag)return;drag.last=e;if(Math.hypot(e.x-drag.x,e.y-drag.y)>6)drag.moved=true;
    // A Ctrl press on the strip picks its axis at 6px: horizontal stays a (snapped) scrub, vertical becomes a zoom (up = in).
    if(drag.pick&&!drag.axis&&drag.moved){drag.axis=Math.abs(e.y-drag.y)>Math.abs(e.x-drag.x)?'y':'x';
      if(drag.axis==='y'){if(drag.kind==='scrub')controller.endScrub({cancel:true});range=drag.oldRange;view.setRange(range);drag.kind='zoom';surface.dataset.gesture='zoom';}}
    if(drag.kind==='zoom'){zoomAt(drag.px0*Math.exp((drag.y-e.y)*.01),drag.anchor,drag.anchorBeat);return;}
    const pos=view.world(e);
    if(drag.kind==='pan'){const z=cssZoom(viewport);viewport.scrollLeft=drag.scrollX-(e.x-drag.x)/z;viewport.scrollTop=drag.scrollY-(e.y-drag.y)/z;return;}   // the hand's travel in the lanes' px
    // PREVIEW becomes a scrub once the hand moves (alpha.49): the play it started stops, the gate is taken, the hand leads
    if(drag.kind==='preview'){if(!drag.moved)return;if(drag.started){controller.play(false);drag.started=false;}if(!controller.beginScrub()){finish(null,true);return;}drag.kind='scrub';surface.dataset.gesture='scrub';}
    // a scrub's beat stays inside the lanes on view (1.5.7-alpha.14): past an edge the head waits at that edge while the pump scrolls, and where the content ends it stops there, never off the view
    if(drag.kind==='scrub'){controller.scrub(bounded(pos.x,viewport.scrollLeft,viewport.scrollLeft+viewport.clientWidth)/px,{snap,alt:!!e.altKey,snapped:!!(e.ctrlKey||e.metaKey)});return;}
    if(drag.kind==='range'){const beat=snapBeat(pos.x/px,e),start=Math.min(beat,drag.startBeat),end=Math.max(beat,drag.startBeat);range=end-start>=.0625?{start:drag.addRange?Math.min(start,drag.addRange.start):start,end:drag.addRange?Math.max(end,drag.addRange.end):end}:drag.oldRange;view.setRange(range);paint();return;}   // under a sixteenth the old range stands (alpha.40)
    if(drag.kind==='select'){
      const rect=selectionRect(drag.startWorld,pos);Object.assign(view.marquee.style,{display:'block',left:rect.left+'px',top:rect.top+'px',width:rect.right-rect.left+'px',height:rect.bottom-rect.top+'px'});
      if(scope==='points'){const c=view.getClip(selected),curve=view.getCurve(c?.curveId);if(c&&curve){const indices=pointsInRectangle(c,curve,rect,px,view.height(),doc.lanes.findIndex(l=>l.id===c.laneId));pointSelection={clipId:c.id,curveId:curve.id,indices:new Set([...drag.basePoints,...indices])};}}
      else{selection=new Set([...drag.baseClips,...clipsInRectangle(doc,rect,px,view.height())]);selected=selection.values().next().value||null;pointSelection=null;}paintSelection();return;
    }
    if(drag.kind==='delete'){
      // THE RIGHT CLICK DELETES (1.5.7-alpha.38, λWAVES 040 T1): every clip the pointer crosses, tab or body, by the one geometry — the path
      // since the last sample as a rectangle (clipsInRectangle), so a fast hand skips none; a narrow clip between two samples dies too
      const ids=clipsInRectangle(doc,selectionRect(drag.sweep||drag.startWorld,pos),px,view.height());drag.sweep=pos;
      if(ids.length)model.deleteClips(ids);return;
    }
    // THE MODES' drags (1.5.7-alpha.49): MUTE's sweep (the delete sweep's geometry), the brush's slots, SLICE's line and ZOOM's band (the marquee draws both)
    if(drag.kind==='mute'){const ids=clipsInRectangle(doc,selectionRect(drag.sweep||drag.startWorld,pos),px,view.height());drag.sweep=pos;
      for(const id of ids){if(drag.done.has(id))continue;drag.done.add(id);const x=doc.clips.find(y=>y.id===id);if(drag.to==null)drag.to=!x.mute;if(!!x.mute!==drag.to)model.updateClip(id,{mute:drag.to});}return;}
    if(drag.kind==='paint'){const lane=nearestTimelineLane(pos.y,doc.lanes.length,view.height()),k=Math.floor((pos.x/px-drag.s0)/drag.D+1e-9),dir=k<drag.k?-1:1;
      for(let i=drag.k,n=0;n<256;i+=dir,n++){paintSlot(lane,i);if(i===k)break;}drag.k=k;if(drag.ids.length){selection=new Set(drag.ids);selected=drag.ids.at(-1);}return;}
    if(drag.kind==='slice'){Object.assign(view.marquee.style,{display:'block',left:drag.beat*px-1+'px',top:Math.min(drag.startWorld.y,pos.y)+'px',width:'2px',height:Math.abs(pos.y-drag.startWorld.y)+'px'});return;}
    if(drag.kind==='zoombox'){Object.assign(view.marquee.style,{display:'block',left:Math.min(drag.startWorld.x,pos.x)+'px',top:viewport.scrollTop+'px',width:Math.abs(pos.x-drag.startWorld.x)+'px',height:viewport.clientHeight+'px'});return;}
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
    // THE TRIM: the pressed clip's edge snaps; with several selected (1.5.7-alpha.11) every one's same edge moves by that delta, each from its press-time snapshot.
    if(drag.kind==='trim'){const delta=timelineResizeDelta(c,drag.edge,(pos.x-drag.startWorld.x)/px,snap,e.altKey),min=e.altKey?.0625:(snap||.0625);
      for(const o of drag.originals||[c])model.updateClip(o.id,resizeTimelineClip(o,drag.edge,delta,min));return;}
    // THE STRETCH (T17): the edge moves and the curve keeps its shape (model.stretchClip); Shift is ⅛ and free of Snap (T18).  With several
    // selected (1.5.7-alpha.11) the glued block [start, end] scales by f about its other edge — the pressed clip's glued edge moves with the
    // hand (snapped), f = its new distance from the pivot / its old one: start' = pivot + (start − pivot)·f, duration·f, scale / f (each curve
    // keeps its shape, touching clips stay touching); the pressed clip never shrinks under the least length, the block never crosses beat 0.
    if(drag.kind==='stretch'){const free=e.altKey||e.shiftKey,g=drag.gear.step(pos,e),raw=(g.x-drag.startWorld.x)/px,min=free?.0625:(snap||.0625);
      if(drag.glued){const{list,start,end}=drag.glued,right=drag.edge==='right',me=list.find(o=>o.id===c.id)||list[0],pivot=right?start:end;
        const d=timelineResizeDelta(me,drag.edge,raw,snap,free),span=right?me.start+me.duration-pivot:pivot-me.start;
        const f=Math.min(right?Infinity:end/(end-start),Math.max(min/me.duration,(span+(right?d:-d))/span));
        for(const o of list)model.updateClip(o.id,{start:Math.max(0,pivot+(o.start-pivot)*f),duration:o.duration*f,scale:o.scale/f});return;}
      const o=drag.original,d=timelineResizeDelta(o,drag.edge,raw,snap,free);
      model.stretchClip(c.id,drag.edge==='right'?'end':'start',Math.max(min,drag.edge==='right'?o.duration+d:o.duration-d),{original:o});return;}
    const plot=view.plot(c.id);if(!plot)return;const rect=plot.getBoundingClientRect(),{width,height}=plot.viewBox.baseVal,geometry=createClipCoordinates(c,curve.length,px,height),x=(e.x-rect.left)/rect.width*width,y=(e.y-rect.top)/rect.height*height;
    if(drag.kind==='step'){drawStep({beat:geometry.sourceBeatAtX(bounded(x,0,width)),value:bounded(geometry.valueAtY(y))},e.shiftKey);return;}
    if(drag.kind==='point'||drag.kind==='points'){
      // Shift is the fine gear (⅛, and free of Snap: a fine time is never rounded to the grid); Ctrl locks the time.
      const anchor={x:geometry.xAtSourceBeat(drag.pointBeat),y:geometry.yAtValue(drag.pointValue)},p=pointDrag(anchor,{x,y},e,drag.gear),beat=e.ctrlKey||e.metaKey?drag.pointBeat:geometry.sourceBeatAtWorldBeat(snapBeat(geometry.worldBeatAtX(p.x),{altKey:e.altKey||e.shiftKey})),value=bounded(geometry.valueAtY(p.y));
      if(drag.kind==='points'){model.movePoints(curve.id,drag.indices,beat-drag.pointBeat,value-drag.pointValue,{slide:slideMode,original:curve});}
      else{const moved=model.movePoint(curve.id,drag.index,Math.max(0,beat),value,{slide:slideMode});if(moved?.index>=0)drag.index=moved.index;}return;
    }
    // THE TENSION REPEATS (1.5.7-alpha.43, λWAVES 040 T6): Ctrl + a tension handle's drag — every 24 px up one more copy of the segment's shape,
    // past the press downward mirrored copies (an upward drag coming back takes copies away first); always from the press's curve, one undo
    if(drag.kind==='repeat'){const k=Math.round((drag.y-e.y)/24),n=Math.min(32,1+Math.abs(k));if(n!==drag.n||k<0!==drag.mirror){drag.n=n;drag.mirror=k<0;model.repeatSegment(curve.id,drag.index,n,{mirror:k<0,original:curve});}return;}
    if(drag.kind==='tension'){const a=curve.points[drag.index],b=curve.points[drag.index+1],sign=b.v<a.v?-1:1;drawTension=bounded(drag.tension+sign*tensionDelta(drag.y,e.y,e,drag.gear)/TIMELINE_TENSION_TRAVEL,-1,1);model.setTension(curve.id,drag.index,drawTension);}
  });
  function finish(e,cancel=false,rewind=false){
    if(!drag||e&&e.pointerId!==drag.pointerId)return;pumpStop();updates.flush();if(!drag)return;const held=drag;drag=null;delete surface.dataset.gesture;delete surface.dataset.dragClip;view.marquee.style.display='none';
    try{if(surface.hasPointerCapture(held.pointerId))surface.releasePointerCapture(held.pointerId);}catch(_){}
    if(held.kind==='scrub'){controller.endScrub({cancel:rewind});
      // a scrub released past the loop's end while playing comes home on the next tick (alpha.8): the view goes home with it, so the head is never off-screen (1.5.7-alpha.14)
      const L=controller.loop?.();if(L&&mod.host.clock.isPlaying()&&transportBeat()>=L.end&&L.start*px<viewport.scrollLeft)viewport.scrollLeft=Math.max(0,L.start*px-20);}
    if(held.kind==='range'&&cancel){range=held.oldRange;view.setRange(range);view.paint();}
    if(held.kind==='zoom'&&cancel)zoomAt(held.px0,held.anchor,held.anchorBeat);
    if(held.kind==='preview'&&held.started)controller.play(false);   // PREVIEW played only while the press held
    // A SELECT-tool tap on the strip (no drag, no Shift) seeks there; the range stays (alpha.40 — until then it cleared it, as a ruler click does in FL).
    if(held.kind==='range'&&!cancel&&held.tap&&!held.moved&&!held.addRange)controller.seek(held.startBeat);
    if(held.author){if(cancel){model.cancel();selection=held.selectionBefore||selection;reconcile();}else{if(held.curve&&['point','points','tension','step'].includes(held.kind))syncSteps(held.curve.id);model.commit();}}
    // a Shift press on a clip that never moved is a click: it toggles the clip in the selection (alpha.39; the clone needs the drag)
    if(held.kind==='move'&&held.toggle&&!held.moved&&!cancel){const id=held.clip.id;if(selection.has(id))selection.delete(id);else selection.add(id);selected=selection.has(id)?id:selection.values().next().value||null;}
    if(held.kind==='select'){
      if(cancel){selection=held.oldClips;pointSelection=held.oldPoints;selected=held.activeBefore;}
      else if(!held.moved&&held.clickedClip&&scope==='clips'){const id=held.clickedClip;selection=held.additive?new Set(held.oldClips):new Set();if(held.additive&&selection.has(id))selection.delete(id);else selection.add(id);selected=selection.values().next().value||null;}
    }
    if(!cancel&&e&&['move','point','tension'].includes(held.kind)&&!held.moved&&!held.copy&&!held.added){const now=performance.now(),id=held.clip.id+':'+held.kind+':'+(held.index??'');
      if(lastTap?.id===id&&now-lastTap.time<400&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<16){lastTap=null;const current=view.getCurve(held.curve.id);if(held.kind==='move'&&current)editIdentity(e.clientX,e.clientY,current,held.clip);else if(held.kind==='point'&&current)fieldMenu(e.clientX,e.clientY,current,held.index,held.clip);else if(held.kind==='tension'){drawTension=0;model.setTension(held.curve.id,held.index,0);}}
      else lastTap={id,time:now,x:e.clientX,y:e.clientY};}else lastTap=null;paintSelection();headPaint.reset();
    // THE MODES' releases (1.5.7-alpha.49): SLICE cuts (a click the clip pressed, a drag every clip its line crossed), ZOOM lands on the band (a click:
    // the whole arrangement), and a middle-button click on the lanes — a pan that never moved — opens THE MODE MENU at the pointer
    if(cancel||!e)return;const end=view.world(held.last||e);
    if(held.kind==='slice'){const x=held.beat*px,ids=held.moved?clipsInRectangle(doc,{left:x,right:x,top:Math.min(held.startWorld.y,end.y),bottom:Math.max(held.startWorld.y,end.y)},px,view.height()):held.clip?[held.clip.id]:[];if(ids.length)sliceAt(ids,held.beat);}
    if(held.kind==='zoombox'){const a=Math.min(held.startWorld.x,end.x)/px,b=Math.max(held.startWorld.x,end.x)/px;if(held.moved&&b>a){px=bounded(viewport.clientWidth/(b-a),8,100);paint();viewport.scrollLeft=Math.max(0,a*px);paint();}else act.zoomAll();}
    if(held.kind==='pan'&&held.lanes&&!held.moved)modeMenu(e.clientX,e.clientY);
  }
  function begin(e,value,author=false){drag={...value,x:e.clientX,y:e.clientY,pointerId:e.pointerId,startWorld:view.world(e),author,activeBefore:selected,selectionBefore:new Set(selection)};surface.dataset.gesture=value.kind;if(value.clip)surface.dataset.dragClip=value.clip.id;if(author)model.begin();e.preventDefault();surface.setPointerCapture(e.pointerId);}
  /* THE EDGE IS THE EDGE (1.5.7-alpha.41): the clip edge under the pointer — on a title band the tabs', in a lane the bodies' — each zone as wide
     as that clip's own trim element (8 px, 12 px on a tab, 14 px on touch, half a narrow clip), centred on the edge (timelineEdgeAt) */
  function edgeUnder(e){const band=e.target.closest?.('.tl-titleband,.tl-pane');if(!band)return null;const body=band.classList.contains('tl-pane');
    const rim=timelineEdgeAt([...band.querySelectorAll(body?':scope > .tl-clip':':scope > .tl-clip-title')].map(n=>{const r=n.getBoundingClientRect();return{id:n.dataset.clip,start:r.left,end:r.right,zone:(n.querySelector('[data-trim]')?.offsetWidth||0)*cssZoom(n)};}),e.clientX);
    return rim&&{...rim,node:band.querySelector(`:scope > [data-clip="${rim.id}"] [data-trim="${rim.edge}"]`)};}
  function beginPointGroup(e,c,curve,index,additive=false){
    if(pointSelection?.curveId!==curve.id)pointSelection={clipId:c.id,curveId:curve.id,indices:new Set()};
    if(additive){if(pointSelection.indices.has(index))pointSelection.indices.delete(index);else pointSelection.indices.add(index);}else if(!pointSelection.indices.has(index))pointSelection.indices=new Set([index]);
    if(!pointSelection.indices.has(index)){e.preventDefault();paintSelection();return;}
    const p=curve.points[index],plot=view.plot(c.id);begin(e,{kind:'points',clip:c,curve,index,indices:[...pointSelection.indices],pointBeat:p.t*curve.length,pointValue:p.v,gear:plot&&fineGear(svgPoint(plot,e))},true);paintSelection();
  }
  listen(surface,'pointerdown',e=>{
    if(drag)return;const target=e.target;if(target.closest('select,input,.tl-action,.tl-scope-seg,.tl-setting,.tl-clip-more,.tl-transport-host'))return;
    if(surface.contains(target)){surface.focus({preventScroll:true});}
    closeMenu();
    if(e.button===1){begin(e,{kind:'pan',scrollX:viewport.scrollLeft,scrollY:viewport.scrollTop,lanes:viewport.contains(target)});return;}   // a middle CLICK on the lanes opens THE MODE MENU (finish)
    const handle=target.closest('.tl-clip-title'),lane=target.closest('[data-lane]');if(lane)selectedLane=lane.dataset.lane;
    const plot=target.closest('svg[data-clip]')||(!handle&&lane&&[...lane.querySelectorAll('svg[data-clip]')].find(n=>{const r=n.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}));
    const clip=view.getClip((handle||plot||target.closest('.tl-clip'))?.dataset.clip),curve=view.getCurve(clip?.curveId),kind=clipKind(curve),cmd=e.ctrlKey||e.metaKey,shift=e.shiftKey;
    if(e.button===0&&target.closest('.tl-ruler')){
      // THE STRIP (THE HANDS): Shift drags a time range, Ctrl+Shift extends it; the SELECT tool's plain drag is a range too (touch
      // needs no key; a tap seeks); Ctrl picks its axis at 6 px — vertical zooms about the pointer's beat (up = in), horizontal
      // scrubs snapped to SNAP; a plain drag scrubs free; Alt always bypasses Snap.  The zoom holds the pressed beat itself, so a
      // scroll clamped while the arrangement is narrow never drifts it.
      // THE RANGE STAYS (1.5.7-alpha.40, λWAVES 040 T3; Josh: "clicking anywhere should not delete the selection; however double clicking fast enough in
      // the same spot can remove the selection"): no press on the strip clears the range — only the second press of a double-tap at one spot (the kit's
      // TAP law: 300 ms, 14 px); a scrub press and a SELECT tap seek and leave it; a Shift-drag draws a new one
      const now=performance.now();if(rulerTap&&now-rulerTap.time<TAP.ms&&Math.hypot(e.clientX-rulerTap.x,e.clientY-rulerTap.y)<TAP.px){rulerTap=null;if(range){range=null;view.setRange(null);paint();}}else rulerTap={time:now,x:e.clientX,y:e.clientY};
      const anchor=(e.clientX-viewport.getBoundingClientRect().left)/cssZoom(viewport),pick=cmd&&!shift,strip={pick,px0:px,anchor,anchorBeat:(viewport.scrollLeft+anchor)/px,oldRange:range};
      if(!pick&&(shift||tool==='select')){begin(e,{kind:'range',startBeat:snapBeat(view.world(e).x/px,e),addRange:shift&&cmd?range:null,tap:!shift,...strip});}
      else if(controller.beginScrub()){begin(e,{kind:'scrub',...strip});controller.scrub(view.world(e).x/px,{snap,alt:!!e.altKey,snapped:cmd});paint();}else say(t('The renderer currently owns the clock.'));return;
    }
    /* THE MODES (1.5.7-alpha.49, λWAVES 041 T1): the left button's tool.  Shift stands aside under every mode (below: it clones a clip and draws the
       marquee), as the right button does (it deletes) and the ruler (above): 040's hands hold whatever the mode. */
    if(e.button===0&&!shift){const beat=view.world(e).x/px;
      // PREVIEW (FL's Playback, the SCRUB tool's id and key): a press seeks there and plays while it is held; a drag scrubs — the hand leads (updates)
      if(tool==='scrub'){if(!controller.beginScrub())return;controller.scrub(beat,{snap,alt:!!e.altKey,snapped:cmd});controller.endScrub();
        const started=!controller.state().playing&&controller.play(true)?.ok!==false;begin(e,{kind:'preview',started});return;}
      // SLICE: a click cuts the clip under it at the pointer's beat (Snap applies, Alt bypasses); a drag draws the cut down the lanes and every
      // clip the line crosses is cut at that beat, one undo (finish)
      if(tool==='slice'){begin(e,{kind:'slice',clip,beat:snapBeat(beat,e)});return;}
      // DELETE (FL's ⊘): the left button is the right button's sweep (alpha.38), down on a clip or on empty space
      if(tool==='delete'){lastTap=null;begin(e,{kind:'delete',clip,curve},true);if(clip)model.deleteClip(clip.id);return;}
      // MUTE: a press toggles the clip; a drag gives every clip it crosses the state the first one took; one undo
      if(tool==='mute'){begin(e,{kind:'mute',clip,curve,to:clip?!clip.mute:null,done:new Set(clip?[clip.id]:[])},true);if(clip)model.updateClip(clip.id,{mute:!clip.mute});return;}
      // ZOOM: a drag zooms to the range it spans; a click zooms out to the whole arrangement (finish)
      if(tool==='zoom'){begin(e,{kind:'zoombox'});return;}
      // PAINT ADD (FL's step brush): a press on a clip toggles it muted
      if(tool==='paintadd'&&clip&&!cmd){e.preventDefault();model.updateClip(clip.id,{mute:!clip.mute});return;}
    }
    // THE PENCIL remembers the clip last pressed (T6): an EDIT click on empty lane space stamps it (stamp(), below).
    if(clip&&curve)lastClip={curveId:curve.id,duration:clip.duration,offset:clip.offset,scale:clip.scale,followSourceEnd:!!clip.followSourceEnd,kind:curve.kind||'curve'};
    let hit=null,pos=null,geometry=null;
    if(plot&&!kind){pos=svgPoint(plot,e);const{width,height}=plot.viewBox.baseVal,p=createTimelinePlot(clip,curve,px,height),r=plot.getBoundingClientRect();geometry=p.geometry;hit=curveHit({x:e.clientX,y:e.clientY},p.points.map(p=>({...p,x:r.left+p.x/width*r.width,y:r.top+p.y/height*r.height})),p.handles.map(p=>({...p,x:r.left+p.x/width*r.width,y:r.top+p.y/height*r.height})),TIMELINE_CURVE_GRAB*cssZoom(plot));}
    const rim=edgeUnder(e),rimClip=rim&&view.getClip(rim.id);
    // A kind without points has no curve gestures: its body handles like its tab (move, Ctrl-copy, right-delete).
    const grab=handle||(kind?plot||target.closest('.tl-clip'):null);
    // AN EDGE: a plain drag trims; Ctrl stretches (the shape keeps); Ctrl+Shift stretches at ⅛.  Shift alone selects (below).
    // THE SELECTION RESIZES TOGETHER (1.5.7-alpha.11, λWAVES 038 T5): an edge pressed on a clip inside a selection of several keeps the
    // selection — a trim moves that edge of every selected clip by the same snapped beats (each keeps its own start on a right edge);
    // a stretch first closes the gaps between them (glueTimelineClips: lane by lane), then scales the block about its other edge.
    // THE EDGE IS THE EDGE (1.5.7-alpha.41, λWAVES 040 T4): the edge is found by geometry (edgeUnder), not by the element under the pointer —
    // the zone is centred on the clip's visual edge (the tab's and the body's), and at a seam the pointer's side names the clip; a curve's point
    // or handle under the pointer still wins.
    const edgeFrom=(clip,edgeName,stretch)=>{const curve=view.getCurve(clip.curveId),many=selection.has(clip.id)&&selection.size>1;if(many){selected=clip.id;pointSelection=null;}else selectOnly(clip.id);
      const originals=many?doc.clips.filter(c=>selection.has(c.id)):null;
      begin(e,{kind:stretch?'stretch':'trim',edge:edgeName,clip,curve,originals,glued:stretch&&many?glueTimelineClips(originals):null,original:{start:clip.start,duration:clip.duration,scale:clip.scale},gear:fineGear(view.world(e))},true);paintSelection();};
    if(e.button===0&&rimClip&&PEN.has(tool)&&!hit?.kind&&(cmd||!shift)){edgeFrom(rimClip,rim.edge,cmd);return;}
    // SHIFT-DRAG CLONES (1.5.7-alpha.39, λWAVES 040 T2; Josh: "Shift+drag on a clip handle should duplicate a clip; Shift+drag on empty space will
    // create a selection"): a Shift press on a clip — its tab, a kind's body, or a curve body with no point or handle under it — holds; a drag
    // duplicates the selection (the clip joins it) and moves the copies (FL's Shift-drag); a click without a drag still toggles the clip in the
    // selection (finish).  Shift on empty space stays the marquee (below); Ctrl+drag's clone stays as an alias; POINTS scope keeps its point marquee.
    if(e.button===0&&shift&&!cmd&&clip&&(grab||plot&&!kind&&!hit?.kind&&scope!=='points')){
      const ids=selection.has(clip.id)?[...selection]:[clip.id];
      begin(e,{kind:'move',copy:true,toggle:true,clip,curve,ids,originals:doc.clips.filter(c=>ids.includes(c.id))},true);return;}
    // SHIFT SELECTS: on empty space a drag is the marquee (Ctrl+Shift adds to the selection), a click on a clip toggles it; the
    // SELECT tool's plain drag is the same marquee (and its Shift adds).  A Shift press on a point or a handle is the fine gear.
    if(e.button===0&&(tool==='select'||shift&&!(plot&&hit?.kind))){
      if(scope==='points'&&clip){if(pointSelection?.curveId!==curve.id){selected=clip.id;selection=new Set([clip.id]);pointSelection={clipId:clip.id,curveId:curve.id,indices:new Set()};}if(hit?.kind==='point'){beginPointGroup(e,clip,curve,hit.i,shift);return;}}
      const adds=shift&&(cmd||tool==='select');
      begin(e,{kind:'select',baseClips:adds?new Set(selection):new Set(),basePoints:adds?new Set(pointSelection?.indices||[]):new Set(),oldClips:new Set(selection),oldPoints:pointSelection?{...pointSelection,indices:new Set(pointSelection.indices)}:null,clickedClip:clip?.id,additive:shift});return;
    }
    if(e.button===0&&!PEN.has(tool))return;   // a mode that is not a pencil has no hand on a point or a handle (a Shift press reaches here)
    if(grab){
      // RIGHT-CLICK DELETE: down on a tab deletes its clip at once; holding the button and crossing
      // other tabs deletes each of those too, the whole sweep as one undo transaction (begin here,
      // commit/cancel in finish()). The MIR plot curve law and the tab's ⋯ menu are untouched.
      if(e.button===2){e.preventDefault();lastTap=null;closeMenu();begin(e,{kind:'delete',clip,curve},true);if(doc.clips.some(x=>x.id===clip.id))model.deleteClip(clip.id);return;}if(e.button!==0)return;
      // CTRL CLONES (call 1): a Ctrl-drag on a title (or a kind's body) duplicates the selection while moving it.
      if(!selection.has(clip.id))selectOnly(clip.id);else selected=clip.id;begin(e,{kind:'move',copy:cmd,clip,curve,ids:[...selection],originals:doc.clips.filter(c=>selection.has(c.id))},true);paintSelection();return;
    }
    if(plot&&!kind){
      selected=clip.id;if(!selection.has(clip.id))selection=new Set([clip.id]);const action=curveAction(e,hit);
      // CTRL CLONES from the body too: a Ctrl-drag where no point or handle is under the pointer (Ctrl on a point locks its time).
      if(cmd&&e.button===0&&!hit?.kind){begin(e,{kind:'move',copy:true,clip,curve,ids:[...selection],originals:doc.clips.filter(c=>selection.has(c.id))},true);paintSelection();return;}
      if(stepMode&&PEN.has(tool)&&e.button===0&&!e.altKey){const position={beat:geometry.sourceBeatAtX(bounded(pos.x,0,geometry.width)),value:bounded(geometry.valueAtY(pos.y))};pointSelection=null;begin(e,{kind:'step',clip,curve,previous:position},true);drawStep(position,e.shiftKey);return;}
      if(action==='point-menu'){e.preventDefault();lastTap=null;fieldMenu(e.clientX,e.clientY,curve,hit.i,clip);return;}
      if(action==='remove-point'){e.preventDefault();pointSelection=null;model.begin();model.removePoint(curve.id,hit.i);syncSteps(curve.id);model.commit();return;}
      if(action==='reset-tension'){e.preventDefault();drawTension=0;model.begin();model.setTension(curve.id,hit.i,0);syncSteps(curve.id);model.commit();return;}
      if(!action){paintSelection();return;}
      if(action==='move-point'&&pointSelection?.curveId===curve.id&&pointSelection.indices.has(hit.i)&&pointSelection.indices.size>1){beginPointGroup(e,clip,curve,hit.i);return;}
      if(action==='move-tension'&&cmd){pointSelection=null;begin(e,{kind:'repeat',clip,curve,index:hit.i,n:1,mirror:false},true);paintSelection();return;}
      // THE FINE GEAR (Shift, ⅛): a tension's in client px, a point's in the plot's own coordinates
      pointSelection=null;let index=hit.i,edited=curve;begin(e,{kind:action==='move-tension'?'tension':'point',added:action==='add-point',clip,curve,index,tension:curve.points[hit.i]?.tension||0,gear:action==='move-tension'?fineGear({x:e.clientX,y:e.clientY}):fineGear(pos)},true);
      if(action==='add-point'){const beat=Math.max(0,geometry.sourceBeatAtWorldBeat(snapBeat(geometry.worldBeatAtX(pos.x),e))),value=pointAddValue(e,bounded(geometry.valueAtY(pos.y)),evaluateTimelineSource(curve,beat)),added=model.addPoint(curve.id,beat,value,0);if(!added||added.index<0){finish(null,true);return;}index=added.index;edited=added.source;}
      const p=edited.points[index];Object.assign(drag,{curve:edited,index,pointBeat:p.t*edited.length,pointValue:p.v});paintSelection();return;
    }
    // THE RIGHT CLICK DELETES (1.5.7-alpha.38, λWAVES 040 T1; Josh: "right clicking on an empty space on the lane (and even in-between the lanes …) and
    // while holding the click, the cursor will delete anything in its path"): a right-button press on empty lane space, on a title band or in the
    // gap between lanes starts the delete sweep (one undo: begin here, commit in finish); the lane menu of 1.5.6-alpha.24 is gone — the chips add and remove lanes
    if(e.button===2&&!clip&&viewport.contains(target)){e.preventDefault();lastTap=null;begin(e,{kind:'delete',clip:null,curve:null},true);return;}
    if(e.button===0&&tool==='edit'&&lane&&!clip&&!shift&&!cmd&&stamp(e,lane.dataset.lane))return;
    if(e.button===0&&(tool==='paint'||tool==='paintadd')&&lane&&!clip&&!shift&&!cmd&&paintFrom(e,lane.dataset.lane))return;
    if(e.button===0){selection.clear();pointSelection=null;selected=null;}paintSelection();
  });
  /* THE PENCIL STAMP (T6): a new clip of the clip last pressed (its curve SHARED, as FL's pencil places the last clip; MAKE
     UNIQUE detaches it; its length, offset and scale), at the snapped beat on the lane under the pointer; the press then
     moves it like a title drag, the placement and the move one undo.  Nothing remembered, or its curve gone: false. */
  function stamp(e,laneId){if(!lastClip||!doc.curves.some(c=>c.id===lastClip.curveId))return false;
    begin(e,{kind:'move',added:true,copy:false,clip:null,curve:view.getCurve(lastClip.curveId),ids:[],originals:[]},true);
    const id=model.placeClip(lastClip.curveId,{laneId,start:snapBeat(Math.max(0,view.world(e).x/px),e),duration:lastClip.duration,offset:lastClip.offset,scale:lastClip.scale,followSourceEnd:lastClip.followSourceEnd});
    const c=id&&doc.clips.find(x=>x.id===id);if(!c){finish(null,true);const r=model.lastRefusal;say(r?t(r.why,r.vars):t('No clip placed: the arrangement is full.'));return true;}
    Object.assign(drag,{clip:c,ids:[id],originals:[c]});surface.dataset.dragClip=id;selectOnly(id);return true;}
  /* PAINT and PAINT ADD (1.5.7-alpha.49): the brush lays the clip last pressed (THE PENCIL's memory, its curve shared) as the hand drags — a copy in every
     slot the pointer passes: slot k starts k lengths from the first (which sits on the snap grid at or before the press; Alt: where it is), on the lane
     under the pointer, and a slot another clip already holds is left as it is.  PAINT lays whole copies end to end; PAINT ADD (FL's step brush) lays it
     one SNAP step long, its whole shape squeezed into the step (Snap OFF or Alt: its own length).  The whole stroke is one undo. */
  function paintFrom(e,laneId){if(!lastClip||!doc.curves.some(c=>c.id===lastClip.curveId))return false;
    const grid=e.altKey?0:snap,D=tool==='paintadd'&&grid?grid:lastClip.duration,beat=Math.max(0,view.world(e).x/px),s0=grid?Math.floor(beat/grid+1e-9)*grid:beat;
    begin(e,{kind:'paint',clip:null,curve:view.getCurve(lastClip.curveId),s0,D,scale:lastClip.scale*lastClip.duration/D,ids:[],k:0},true);
    paintSlot(doc.lanes.findIndex(l=>l.id===laneId),0,true);
    if(!drag.ids.length){finish(null,true);const r=model.lastRefusal;say(r?t(r.why,r.vars):t('No clip placed: the arrangement is full.'));}else selectOnly(drag.ids[0]);return true;}
  function paintSlot(lane,k,force=false){const start=drag.s0+k*drag.D,row=doc.lanes[lane];if(!row||start<-1e-9)return;
    if(!force&&doc.clips.some(c=>c.laneId===row.id&&c.start<start+drag.D-1e-9&&c.start+c.duration>start+1e-9))return;
    const id=model.placeClip(lastClip.curveId,{laneId:row.id,start:Math.max(0,start),duration:drag.D,offset:lastClip.offset,scale:drag.scale,followSourceEnd:lastClip.followSourceEnd});if(id)drag.ids.push(id);}
  // DROPS: a registered handler (an audio file, a pattern row) gets the files and the beat/lane under the drop; the first true wins.
  listen(viewport,'dragover',e=>{if(!dropHandlers.size)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';});
  listen(viewport,'drop',e=>{if(!dropHandlers.size)return;e.preventDefault();const where=at(e.clientX,e.clientY),files=[...(e.dataTransfer?.files||[])];for(const fn of dropHandlers)if(fn({event:e,files,dataTransfer:e.dataTransfer,...where}))break;});
  // THE CHORD (1.5.7-alpha.49; FL's Middle-Mouse-Click + Right-Click): the second of the two buttons going down over the lanes is a pointermove whose
  // buttons hold both — what the first one began (a pan, a delete sweep) is cancelled whole and THE MODE MENU opens at the pointer
  listen(surface,'pointermove',e=>{if((e.buttons&6)!==6||menu?.dataset.pop==='modes')return;const r=viewport.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
    e.preventDefault();finish(null,true);modeMenu(e.clientX,e.clientY);});
  listen(surface,'contextmenu',e=>e.preventDefault());listen(surface,'auxclick',e=>{if(e.button===1)e.preventDefault();});listen(surface,'lostpointercapture',e=>finish(e,true));
  // FL's indicator: before the press the edge a press would take lights (data-hot); a drag keeps it until the hand moves again
  let hot=null;const light=n=>{if(hot===n)return;if(hot)delete hot.dataset.hot;hot=n;if(hot)hot.dataset.hot='';};
  listen(viewport,'pointermove',e=>{if(!drag)light(PEN.has(tool)&&!e.buttons&&edgeUnder(e)?.node||null);});listen(viewport,'pointerleave',()=>{if(!drag)light(null);});
  listen(document,'pointermove',e=>{if(drag&&e.pointerId===drag.pointerId){e.preventDefault();updates.post(pointer(e));if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;   // the slop, as updates reads it
      if(drag.moved&&PUMPED.includes(drag.kind)){pumpX=e.clientX;if(!pumpId)pumpId=requestAnimationFrame(edgePump);}}},{passive:false});listen(document,'pointerup',e=>finish(e));listen(document,'pointercancel',e=>finish(e,true));
  listen(document,'pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!surface.contains(e.target))closeMenu();});
  /* ESCAPE is not a table action (the kit keeps it): it only ends what is in flight.  HIDE needs no key of its own here:
     whatever key the table gives it, the interface going out of paint (body.ui-hidden) ends it (hiddenObserver below) */
  listen(document,'keydown',e=>{if(e.code==='Escape'){closeMenu();finish(null,true,true);}});
  listen(document,'visibilitychange',()=>{if(document.hidden){closeMenu();finish(null,true);headPaint.reset();}});listen(globalThis,'blur',()=>{closeMenu();finish(null,true);});
  /* THE TIMELINE SCROLLS UNDER THE POINTER (1.5.7-alpha.9, λWAVES 038 T3; Josh: "Scroll on timeline doesn't seem to work"): Ctrl/Cmd +
     wheel zooms about the pointer, as before; a plain wheel scrolls TIME while the lanes fit the height (they fill it, so a vertical
     wheel had nothing to scroll), Shift + wheel always does (a trackpad's sideways swipe is the native scroll); with more lanes than
     fit, the plain wheel scrolls the lanes.  The wheel lands on the element under the pointer: no window registry. */
  listen(view.shell,'wheel',e=>{const unit=e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1;
    if(e.ctrlKey||e.metaKey){if(!e.deltaY)return;e.preventDefault();e.stopPropagation();const anchor=bounded((e.clientX-viewport.getBoundingClientRect().left)/cssZoom(viewport),0,viewport.clientWidth),delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);zoom(Math.exp(-bounded(delta,-120,120)*.003),anchor);return;}
    const tall=viewport.scrollHeight>viewport.clientHeight+1,d=e.shiftKey?(e.deltaY||e.deltaX):tall||Math.abs(e.deltaX)>Math.abs(e.deltaY)?0:e.deltaY;
    if(!d)return;e.preventDefault();e.stopPropagation();viewport.scrollLeft=Math.max(0,viewport.scrollLeft+d*unit);},{passive:false});
  const viewportPaint=coalesce(()=>{paint();if(drag?.last&&['select','point','points','move','trim','stretch','scrub','range','paint'].includes(drag.kind))updates.post(drag.last);});
  listen(viewport,'scroll',()=>viewportPaint.post(),{passive:true});const observer=new ResizeObserver(()=>viewportPaint.post());observer.observe(viewport);
  const hiddenObserver=new MutationObserver(()=>{if(document.body.classList.contains('ui-hidden')){closeMenu();finish(null,true);headPaint.reset();}else if(win.isOpen())viewportPaint.post();});hiddenObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
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
    slice:(ids,beat)=>sliceAt(ids,beat,true),tool:()=>tool,setTool(name){finish(null,true);if(MODES.some(m=>m[0]===name))setTool(name);},
    /** THE MODE MENU (1.5.7-alpha.49): open it at a client point (the middle button's road and the bar's chip are the hand's) */
    openModes(x,y){modeMenu(x,y);},gesture:()=>drag?{kind:drag.kind,clip:drag.clip?.id??null,curve:drag.curve?.id??null,index:drag.index??null,edge:drag.edge??null}:null,paintHead:()=>headPaint.paint(),selected:()=>selected,selection:()=>({clips:[...selection],points:pointSelection?[...pointSelection.indices]:[]}),workLane:()=>workLane,setWorkLane,
    snap:()=>snap,setSnap(v){snap=Number(v)||0;snapStep.set(snap);},scope:()=>scope,
    /** THE PENCIL's memory: the clip last pressed ({ curveId, duration, offset, scale, followSourceEnd, kind }), or null */
    lastClip:()=>lastClip?{...lastClip}:null,
    /** how many of the bar's tools are folded behind MORE (the bar keeps one line; they fold from its end) */
    folded:()=>fold.length-shown,
    /** the timeline's keys are live: the window is open and the focus is in the surface, not in a field or the transport */
    keysLive:()=>win.isOpen()&&!!document.activeElement&&surface.contains(document.activeElement)&&!editable(document.activeElement)&&!transportHost.contains(document.activeElement),
    locate(id){finish(null,true);const curve=doc.curves.find(c=>c.targetId===id),clip=doc.clips.find(c=>c.curveId===curve?.id);win.open();if(clip){selectOnly(clip.id);selectedLane=clip.laneId;paint();viewport.scrollLeft=Math.max(0,clip.start*px-20);}},
    /** removeLane(laneId = the bottom lane) → Promise<boolean>: a lane with clips asks first (confirmDialog) */
    removeLane(laneId){finish(null,true);return removeLane(laneId);},addLane(){finish(null,true);return model.addLane();},close(){closeMenu();finish(null,true);headPaint.reset();},
    dispose(){api.close();events.abort();observer.disconnect();fitObserver.disconnect();hiddenObserver.disconnect();viewportPaint.cancel();updates.cancel();unsubscribe();resetSubscription();transportSubscription();surface.remove();}};
  view.setDocument(doc);setTool('edit');setWorkLane('top');paint();return api;
}
