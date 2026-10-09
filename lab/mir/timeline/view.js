/* timeline/view.js — THE LANES AND THE RULER (harvested from BASINS app/timeline-view.js, 2026-10-02).
 * Bounded glass panes, a fixed scrub strip, and keyed visible clips. Scroll and playback never clone project state or
 * reconstruct an unchanged curve SVG.  Changed for the kit: words through label / ariaLabel (the clip's own name and its
 * target are data and are shown as they are); the panes are the house's `.glass` (no cloned `.m2rail`); the beat ticks'
 * bevel reads `--tl-tick-bevel-ink`, a token, where BASINS wrote its ink contrast inline. */
import { TIMELINE_TAB_HEIGHT, TIMELINE_POINT_RADIUS, TIMELINE_TENSION_RADIUS, timelineLaneHeight, timelineTabPath, createClipCoordinates } from './geometry.js';
import { createTimelinePlot } from './curve-view.js';
import { clipKind } from './kinds.js';
import { el, svgNode as svg, label, ariaLabel } from '../kit.js';
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
// Beat ticks never hide: alpha ramps with zoom (full at 12px, half at 8px) instead of cutting off
// below a px threshold. Exported so tools/test-timeline-ticks.mjs proves the same law paint() paints.
export function tickLaw(px,dpr=1){
  const ramp=clamp((px-4)/8,.5,1),beatAlpha=.16*ramp,subdivisions=px>=20;
  return {beatAlpha,beatHeight:px<12?3:4,subdivisions,subAlpha:subdivisions?beatAlpha:0};
}
// Paint each minor tick once, every position rounded to a device pixel so continuous zoom never
// lands a tick between pixels. Measure marks replace coincident beat ticks; subdivision marks lie
// between beats, so their alpha never stacks.
export const ticks=(positions,px,dpr=1)=>positions.length?'linear-gradient(90deg,transparent '+positions.map(n=>{
  const x=Math.round(n*px*dpr)/dpr;return `${x}px,var(--tl-beat-tick) ${x}px ${x+1}px,var(--tl-beat-bevel) ${x+1}px ${x+2}px,transparent ${x+2}px`;
}).join(',transparent ')+')':'linear-gradient(transparent,transparent)';
export function createTimelineView(surface,{pixels,onClipMenu}) {
  const shell=el('div','tl-view',surface),ruler=el('div','tl-ruler glass',shell),ink=el('div','tl-ruler-ink',ruler);
  ariaLabel(ruler,'Scrub the timeline playhead');
  const viewport=el('div','tl-viewport',shell),content=el('div','tl-content',viewport),rows=el('div','tl-rows',content);
  const head=el('div','tl-playhead',shell),tail=el('div','tl-playhead-tail',head),marquee=el('div','tl-marquee',content);
  const status=el('div','tl-status',surface);status.setAttribute('role','status');
  const laneNodes=new Map(),clipNodes=new Map();let doc,revision=0,curves=new Map(),byLane=new Map(),rulerKey='',height=48,range=null,active=null;
  function setDocument(value){doc=value;revision++;curves=new Map(doc.curves.map(c=>[c.id,c]));byLane=new Map(doc.lanes.map(l=>[l.id,[]]));for(const c of doc.clips)byLane.get(c.laneId)?.push(c);}
  const getClip=id=>doc.clips.find(c=>c.id===id),getCurve=id=>curves.get(id);
  function renderClip(c,curve,row,px,key){
    clipNodes.get(c.id)?.title.remove();clipNodes.get(c.id)?.block.remove();
    const w=c.duration*px,title=el('div','tl-clip-title',row.title);title.dataset.clip=c.id;title.style.width=w+'px';title.title=curve.name+' · '+curve.targetId;title.style.setProperty('--tl-clip-tint',curve.color);
    const shape=svg('svg',{class:'tl-tab-shape',viewBox:`0 0 ${w} ${TIMELINE_TAB_HEIGHT}`,'aria-hidden':'true',preserveAspectRatio:'none'},title),path=timelineTabPath(w);
    // One solid gradient per clip: lighter at the top, --tl-curve-ink (the same token the curve
    // line reads) at the foot, so the tab and the curve read as one colour. A second gradient
    // lights the rim's top and softly darkens its foot along the same traced outline.
    const defs=svg('defs',{},shape),tintId='tl-tab-tint-'+c.id,rimId='tl-tab-rim-'+c.id;
    const tintGrad=svg('linearGradient',{id:tintId,x1:'0',y1:'0',x2:'0',y2:'1'},defs);
    svg('stop',{offset:'0',class:'tl-tab-grad-top'},tintGrad);svg('stop',{offset:'1',class:'tl-tab-grad-foot'},tintGrad);
    const rimGrad=svg('linearGradient',{id:rimId,x1:'0',y1:'0',x2:'0',y2:'1'},defs);
    svg('stop',{offset:'0',class:'tl-tab-rim-top'},rimGrad);svg('stop',{offset:'1',class:'tl-tab-rim-foot'},rimGrad);
    svg('path',{d:path,class:'tl-tab-base','vector-effect':'non-scaling-stroke'},shape);
    svg('path',{d:path,class:'tl-tab-tint',fill:'url(#'+tintId+')','vector-effect':'non-scaling-stroke'},shape);
    svg('path',{d:path,class:'tl-tab-rim',stroke:'url(#'+rimId+')','vector-effect':'non-scaling-stroke'},shape);
    const left=el('button','tl-trim tl-trim-left',title);left.type='button';left.dataset.trim='left';ariaLabel(left,'Pull the clip start');left.title='Pull curve start; keep right edge fixed';
    el('span','tl-clip-name',title,curve.name);const more=el('button','tl-clip-more',title,'⋯');more.type='button';ariaLabel(more,'Clip options');more.onclick=e=>{e.stopPropagation();const current=getClip(c.id);if(current)onClipMenu(e,current,getCurve(current.curveId));};
    const right=el('button','tl-trim tl-trim-right',title);right.type='button';right.dataset.trim='right';ariaLabel(right,'Trim the clip end');
    const block=el('div','tl-clip',row.pane);block.dataset.clip=c.id;block.style.width=w+'px';block.style.setProperty('--tl-clip-tint',curve.color);block.classList.toggle('muted',!!c.mute);
    // A registered kind paints itself into the plot svg and owns no points or handles; a curve keeps the MIR plot.
    const kind=clipKind(curve);let s;
    if(kind){const geometry=createClipCoordinates(c,curve.length,px,height);block.dataset.kind=curve.kind;
      s=svg('svg',{viewBox:`0 0 ${geometry.width} ${height}`,preserveAspectRatio:'none','data-clip':c.id,'data-kind':curve.kind},block);ariaLabel(s,'{name} · {kind} clip',{name:curve.name,kind:curve.kind});
      kind.paint?.(s,curve,c,{px,height,geometry,tint:curve.color,block});}
    else{const plot=createTimelinePlot(c,curve,px,height);s=svg('svg',{viewBox:`0 0 ${plot.geometry.width} ${height}`,preserveAspectRatio:'none','data-clip':c.id},block);ariaLabel(s,'{name} · automation curve',{name:curve.name});
      svg('path',{d:plot.fill,class:'tl-fill'},s);svg('path',{d:plot.path,class:'tl-curve',fill:'none','vector-effect':'non-scaling-stroke'},s);
      for(const p of plot.points)svg('circle',{cx:p.x,cy:p.y,r:TIMELINE_POINT_RADIUS,class:'tl-point','data-point':p.i},s);
      for(const p of plot.handles)svg('circle',{cx:p.x,cy:p.y,r:TIMELINE_TENSION_RADIUS,class:'tl-tension','data-handle':p.i},s);}
    // Full-height edges complement the tab grips. Gesture hit testing gives
    // curve points/tensions priority even when they sit under an edge zone.
    for(const edge of ['left','right']){const grip=el('button','tl-edge tl-edge-'+edge,block);grip.type='button';grip.dataset.trim=edge;if(edge==='left'){ariaLabel(grip,'Resize the clip from its left edge');grip.title='Pull curve start; keep right edge fixed';}else{ariaLabel(grip,'Resize the clip from its right edge');grip.title='Reveal or trim curve end';}}
    title.classList.toggle('narrow',w<72);title.classList.toggle('micro',w<28);block.classList.toggle('narrow',w<28);
    const entry={title,block,svg:s,key};clipNodes.set(c.id,entry);return entry;
  }
  function paint(){
    if(!doc)return;
    const px=pixels(),width=viewport.clientWidth,x=viewport.scrollLeft,dpr=globalThis.devicePixelRatio||1,law=tickLaw(px,dpr);
    const material=getComputedStyle(document.body),configuredRadius=parseFloat(material.getPropertyValue('--surface-radius'));
    const radius=Number.isFinite(configuredRadius)?configuredRadius:parseFloat(material.getPropertyValue('--r-md'))||12;
    const beatTicks=ticks(Array.from({length:doc.meter-1},(_,i)=>i+1),px,dpr),subTicks=ticks(Array.from({length:doc.meter},(_,i)=>i+.5),px,dpr);
    height=timelineLaneHeight(viewport.clientHeight,doc.lanes.length,0);
    const extent=Math.max(width,64*px,...doc.clips.map(c=>(c.start+c.duration+4)*px));content.style.width=extent+'px';rows.style.width=width+'px';rows.style.left=x+'px';
    rows.style.setProperty('--tl-lane-height',height+'px');rows.style.setProperty('--tl-grid-origin',-x+'px');
    const keep=new Set(),laneIds=new Set(doc.lanes.map(l=>l.id));
    for(const[id,n]of laneNodes)if(!laneIds.has(id)){n.root.remove();laneNodes.delete(id);}
    for(const [laneIndex,lane] of doc.lanes.entries()){
      let row=laneNodes.get(lane.id);if(!row){const root=el('div','tl-row',rows);root.dataset.lane=lane.id;row={root,title:el('div','tl-titleband',root),pane:el('div','tl-pane glass',root)};row.pane.dataset.lane=lane.id;laneNodes.set(lane.id,row);}if(rows.children[laneIndex]!==row.root)rows.insertBefore(row.root,rows.children[laneIndex]||null);
      row.title.title=lane.name;row.pane.style.setProperty('--tl-measure',px*doc.meter+'px');row.pane.style.setProperty('--tl-four-measures',px*doc.meter*4+'px');
      row.pane.style.setProperty('--tl-beat-height',law.beatHeight+'px');row.pane.style.setProperty('--tl-beat-alpha',String(law.beatAlpha));   /* no sheet reads it: tests/timeline-ticks reads the ramp here */
      row.pane.style.setProperty('--tl-beat-tick',`color-mix(in srgb,currentColor ${(law.beatAlpha*100).toFixed(4)}%,transparent)`);
      row.pane.style.setProperty('--tl-beat-bevel',`color-mix(in srgb,var(--tl-tick-bevel-ink) ${(law.beatAlpha*50).toFixed(4)}%,transparent)`);
      row.pane.classList.toggle('subdivisions',law.subdivisions);
      row.pane.style.setProperty('--tl-beat-pattern',beatTicks);row.pane.style.setProperty('--tl-subdivision-pattern',subTicks);
      const clips=byLane.get(lane.id)||[];
      row.pane.classList.toggle('clip-at-start',clips.some(c=>c.start*px-x<=radius&&(c.start+c.duration)*px>x));
      row.pane.classList.toggle('clip-at-end',clips.some(c=>(c.start+c.duration)*px-x>=width-radius&&c.start*px<x+width));
      for(const c of clips){if((c.start+c.duration)*px<x-80||c.start*px>x+width+80)continue;keep.add(c.id);const curve=curves.get(c.curveId),key=`${revision}:${px}:${height}:${lane.id}`;
        let entry=clipNodes.get(c.id);if(entry?.key!==key)entry=renderClip(c,curve,row,px,key);entry.title.style.left=entry.block.style.left=(c.start*px-x)+'px';}
    }
    for(const[id,n]of clipNodes)if(!keep.has(id)){n.title.remove();n.block.remove();clipNodes.delete(id);}
    const first=Math.max(0,Math.floor(x/(doc.meter*px))),last=Math.ceil((x+width)/(doc.meter*px))+1,stride=Math.max(1,Math.ceil(32/(doc.meter*px))),key=[first,last,px,doc.meter,stride,range?.start,range?.end,active?.start,active?.end].join(':');
    // THE ACTIVE RANGE is a faint band under the selection range; both live in the strip's ink.
    const band=(r,cls)=>{const n=el('div',cls,ink);n.style.left=r.start*px+'px';n.style.width=(r.end-r.start)*px+'px';};
    if(key!==rulerKey){rulerKey=key;ink.replaceChildren();if(active)band(active,'tl-active');for(let m=first;m<=last;m++)if(m%stride===0){const n=el('span','tl-measure',ink,m+1);n.style.left=m*doc.meter*px+'px';}if(range)band(range,'tl-range');}
    ink.style.transform=`translateX(${-x}px)`;ink.style.width=extent+'px';
  }
  function paintSelection(clips,activeLane,pointSelection,hasTarget){
    for(const[id,row]of laneNodes)row.root.classList.toggle('selected',id===activeLane);
    for(const[id,n]of clipNodes){const c=getClip(id),curve=getCurve(c.curveId),kind=clipKind(curve);n.title.classList.toggle('selected',clips.has(id));n.block.classList.toggle('selected',clips.has(id));
      // A kind that fires rather than drives (drives:false, the pattern) is never dormant for want of a target.
      n.block.classList.toggle('dormant',kind?.drives!==false&&!hasTarget(curve.targetId));
      const held=surface.dataset.dragClip===id;for(const node of [n.title,n.block])node.classList.toggle('held',held);
      for(const p of n.svg.querySelectorAll('.tl-point'))p.classList.toggle('selected',pointSelection?.curveId===curve.id&&pointSelection.indices.has(+p.dataset.point));}
  }
  return {shell,ruler,viewport,content,rows,head,tail,marquee,status,setDocument,paint,paintSelection,getClip,getCurve,
    height:()=>height,plot:id=>clipNodes.get(id)?.svg,
    setRange(value){range=value;rulerKey='';},setActive(value){active=value;rulerKey='';},
    world(e){const r=viewport.getBoundingClientRect();return{x:e.clientX-r.left+viewport.scrollLeft,y:e.clientY-r.top+viewport.scrollTop};}};
}
