/* timeline/knobs.js — A HELD KNOB MAKES A CLIP (harvested from BASINS app/timeline-knobs.js, 2026-10-02).
 * Participate in the existing knob lifecycle; a stationary hold (500 ms) on any routable knob (`.k[data-param]`, a
 * registered parameter) cancels its owned drag and opens TIMELINE CLIP: CREATE AUTOMATION CLIP · LOCATE CLIPS.  A right
 * click, ContextMenu or Shift+F10 on a focused knob opens it at once.  BASINS' sentence "Hold a camera or colour knob…" is
 * in the shortcut sheet.  Changed for the kit: words through label / ariaLabel; the popup is the house's menu pane
 * (`.glass[data-mir-surface="menu"]`), where BASINS cloned the modulation window's `.m2pick`.
 *   installTimelineKnobs({ registry, editor, root = document }) → dispose */
import { label, ariaLabel } from '../kit.js';

export function installTimelineKnobs({ registry, editor }) {
  let pending=null,owned=null,pop=null,suppressUntil=0;
  const events=new AbortController();
  const listen=(target,type,fn,capture=false)=>target.addEventListener(type,fn,{capture,signal:events.signal});
  const close=()=>{const p=pop;pop=null;p?.remove();};   // pop is cleared first: removing the focused menu fires its focusout
  const cancel=()=>{if(pending)clearTimeout(pending.timer);pending=null;};
  const abort=()=>{const p=pending||owned;cancel();owned=null;if(p){p.dial.dispatchEvent(new PointerEvent('pointercancel',{pointerId:p.id,bubbles:false}));try{if(p.dial.hasPointerCapture(p.id))p.dial.releasePointerCapture(p.id);}catch(_){}}};
  const open=(root,x,y)=>{
    const id=root.dataset.param;if(!registry.has(id))return;
    close();pop=document.createElement('div');pop.className='tl-pop glass';pop.dataset.mirSurface='menu';pop.setAttribute('role','menu');ariaLabel(pop,'Timeline clip');
    const title=document.createElement('div');title.className='tl-pop-title';label(title,'TIMELINE CLIP');pop.append(title);
    const b=document.createElement('button');b.type='button';b.className='trig';b.dataset.tlAction='create-clip';label(b,'CREATE AUTOMATION CLIP');b.onclick=()=>{close();editor.createClip(id);};pop.append(b);
    const locate=document.createElement('button');locate.type='button';locate.className='trig';locate.dataset.tlAction='locate-clips';label(locate,'LOCATE CLIPS');locate.onclick=()=>{close();editor.locate(id);};pop.append(locate);
    /* the focus leaving the menu closes it (Tab away, or HIDE, which blurs what it hides: no key of its own for that) */
    const me=pop;me.tabIndex=-1;me.addEventListener('focusout',e=>{if(pop===me&&!me.contains(e.relatedTarget))close();});
    document.body.append(pop);const r=pop.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x))+'px';pop.style.top=Math.max(8,Math.min(innerHeight-r.height-8,y))+'px';b.focus();
  };
  listen(document,'pointerdown',e=>{
    if(pop&&!pop.contains(e.target))close();cancel();
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
  return ()=>{abort();close();events.abort();};
}
