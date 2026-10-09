/* timeline/selection.js — the rectangle selection's two hit laws, in content coordinates (harvested whole from BASINS
 * app/timeline-selection.js, 2026-10-02).  PURE. */
import { TIMELINE_TAB_HEIGHT, TIMELINE_ROW_GAP } from './geometry.js';
export const selectionRect=(a,b)=>({left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)});
export function clipsInRectangle(document, rect, px, height) {
  const lanes=new Map(document.lanes.map((l,i)=>[l.id,i])),stride=height+TIMELINE_TAB_HEIGHT+TIMELINE_ROW_GAP;
  return document.clips.filter(c=>{const top=lanes.get(c.laneId)*stride;return c.start*px<=rect.right&&(c.start+c.duration)*px>=rect.left&&top<=rect.bottom&&top+height+TIMELINE_TAB_HEIGHT>=rect.top;}).map(c=>c.id);
}
export function pointsInRectangle(clip,curve,rect,px,height,laneIndex) {
  if(!clip||!curve)return[];
  const top=laneIndex*(height+TIMELINE_TAB_HEIGHT+TIMELINE_ROW_GAP)+TIMELINE_TAB_HEIGHT;
  return curve.points.flatMap((p,i)=>{const beat=clip.start+(p.t*curve.length-clip.offset)/clip.scale,x=beat*px,y=top+(1-p.v)*height;
    return beat>=clip.start&&beat<=clip.start+clip.duration&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom?[i]:[];});
}
