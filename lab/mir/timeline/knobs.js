/* timeline/knobs.js — A HELD KNOB MAKES A CLIP (harvested from BASINS app/timeline-knobs.js, 2026-10-02).
 * Participate in the existing knob lifecycle; a stationary hold (500 ms) on any routable knob (`.k[data-param]`, a
 * registered parameter) cancels its owned drag and opens TIMELINE CLIP: CREATE AUTOMATION CLIP · LOCATE CLIPS.  A right
 * click, ContextMenu or Shift+F10 on a focused knob opens it at once.  BASINS' sentence "Hold a camera or colour knob…" is
 * in the shortcut sheet.  Changed for the kit: the popup is the house's menu pane; since 1.5.6-alpha.4 it is THE KNOB MENU
 * (shell/menubar.js knobMenu: RESET · COPY · PASTE · FINE · ROUTES › · CLIP › · the app's rows), TIMELINE CLIP its CLIP › part.
 *   installTimelineKnobs({ registry, editor, root = document }) → dispose */
import { knobMenu, knobMenuPart, contextMenu } from '../shell/menubar.js';

/* 1.5.0-alpha.25 (λWAVES iteration 014 A3): an app's own rows under LOCATE CLIPS — `setTimelineKnobRows((id) => [{ label, run }])`, one port for
   every installed popup (λWAVES: ADD TO / REMOVE FROM CONTROL SURFACE).  The label is a word the app passes through label(). */
let appRows = null;
export function setTimelineKnobRows(fn) { appRows = typeof fn === 'function' ? fn : null; }

export function installTimelineKnobs({ registry, editor }) {
  let pending=null,owned=null,pop=null,suppressUntil=0;
  const events=new AbortController();
  const listen=(target,type,fn,capture=false)=>target.addEventListener(type,fn,{capture,signal:events.signal});
  const close=()=>{const p=pop;pop=null;p?.close();};
  const cancel=()=>{if(pending)clearTimeout(pending.timer);pending=null;};
  const abort=()=>{const p=pending||owned;cancel();owned=null;if(p){p.dial.dispatchEvent(new PointerEvent('pointercancel',{pointerId:p.id,bubbles:false}));try{if(p.dial.hasPointerCapture(p.id))p.dial.releasePointerCapture(p.id);}catch(_){}}};
  /* 1.5.6-alpha.4 · ONE KNOB MENU (shell/menubar.js knobMenu): TIMELINE CLIP is its CLIP › part, the app's rows its foot */
  const clip=(id)=>(registry.has(id)?{entries:[['CREATE AUTOMATION CLIP',()=>editor.createClip(id),false,'',{id:'create-clip'}],['LOCATE CLIPS',()=>editor.locate(id),false,'',{id:'locate-clips'}]]}:null);
  knobMenuPart('clip',clip);
  const rowsOf=(id)=>((appRows?appRows(id):null)||[]).filter((r)=>r&&typeof r.run==='function').map((r)=>[r.label,r.run,false,'',{id:'app'}]);
  const open=(root,x,y)=>{const id=root.dataset.param;if(!registry.has(id))return;close();
    pop=knobMenu(root,{x,y,appRows:rowsOf,onClose:()=>{pop=null;}})||contextMenu({x,y,entries:[...clip(id).entries,...rowsOf(id)],onClose:()=>{pop=null;}});};
  listen(document,'pointerdown',e=>{
    if(pop&&!pop.host.contains(e.target))close();cancel();
    const root=e.target.closest?.('.k[data-param]');if(!root||root.getAttribute('aria-disabled')==='true'||!e.target.closest('.k-dial')||e.button!==0||!registry.has(root.dataset.param))return;
    const dial=e.target.closest('.k-dial');pending={root,dial,id:e.pointerId,x:e.clientX,y:e.clientY,timer:setTimeout(()=>{
      const p=pending;if(!p)return;pending=null;owned=p;
      // This reaches the kit's actual end handler, releasing its private dragging flag.
      dial.dispatchEvent(new PointerEvent('pointercancel',{pointerId:p.id,bubbles:false}));
      owned=p;
      try{if(dial.hasPointerCapture(p.id))dial.releasePointerCapture(p.id);}catch(_){}
      open(root,p.x,p.y);
    },500)};
  },true);
  listen(document,'pointermove',e=>{if(owned&&owned.id===e.pointerId){e.preventDefault();e.stopImmediatePropagation();return;}if(pending&&(e.pointerId!==pending.id||Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>8))cancel();},true);
  const end=e=>{if(owned&&owned.id===e.pointerId){e.preventDefault();e.stopImmediatePropagation();owned=null;suppressUntil=performance.now()+350;}cancel();};
  listen(document,'pointerup',end,true);listen(document,'pointercancel',e=>{cancel();if(owned&&owned.id===e.pointerId)owned=null;},true);
  listen(document,'click',e=>{if(performance.now()<suppressUntil&&e.target.closest?.('.k[data-param]')){e.preventDefault();e.stopImmediatePropagation();}},true);
  listen(document,'contextmenu',e=>{const root=e.target.closest?.('.k[data-param]');if(root&&registry.has(root.dataset.param)){e.preventDefault();e.stopImmediatePropagation();abort();root.querySelector('.k-dial')?.dispatchEvent(new PointerEvent('pointercancel'));open(root,e.clientX,e.clientY);}},true);
  listen(document,'keydown',e=>{if(e.key==='ContextMenu'||e.shiftKey&&e.key==='F10'){const root=document.activeElement?.closest?.('.k[data-param]');if(root&&registry.has(root.dataset.param)){e.preventDefault();const r=root.getBoundingClientRect();open(root,r.right,r.bottom);}}if(e.key==='Escape'){abort();close();}});
  listen(globalThis,'blur',()=>{abort();close();});
  listen(document,'visibilitychange',()=>{if(document.hidden){abort();close();}});
  return ()=>{abort();close();events.abort();knobMenuPart('clip',null);};
}
