/* control-help.js — MIR · the hint that steps aside, the ⓘ panel, and one help surface per window.
 * Hints: every [title] becomes a data-help read by ONE tooltip after a short hover; a press, a wheel or an
 * operating key closes it and it stays closed until the pointer leaves and returns. */
import { el } from './kit.js';
export const HELP_HOVER_DELAY = 600;
/* THE TWO SWITCHES an app flips on <body> to silence help:
     hintsOff  hover hints stay closed          (λWAVES SETTINGS › CONTROL HINTS) — read only by this file, so an app may rename it
     infoOff   ⓘ panels neither open nor show   (λWAVES SETTINGS › WINDOW INFO) — mir/css/skin.css hides the panels on this
               exact class, so it is a CONTRACT NAME and not renameable (a renamed class would reach the JS and not the CSS) */
export const HELP_CLASSES = Object.freeze({ hintsOff: 'control-hints-off', infoOff: 'window-info-off' });
let hintsOffClass = HELP_CLASSES.hintsOff;
/** setHelpClasses({ hintsOff }) → the classes in force.  Only the hints switch is the app's to rename. */
export function setHelpClasses(o = {}) { if (o.hintsOff) hintsOffClass = o.hintsOff; return { hintsOff: hintsOffClass, infoOff: HELP_CLASSES.infoOff }; }

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
  const open=()=>{if(document.body.classList.contains(HELP_CLASSES.infoOff))return;if(!content.matches(':popover-open'))content.showPopover();const r=b.getBoundingClientRect();
    content.style.left=Math.max(8,Math.min(innerWidth-content.offsetWidth-8,r.left))+'px';
    content.style.top=Math.max(8,Math.min(innerHeight-content.offsetHeight-8,r.bottom+6))+'px';
    b.setAttribute('aria-expanded','true');};
  b.addEventListener('click',()=>{cancelHover();pinned=!pinned;pinned?open():close();});
  anchor.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!pinned){cancelHover();hoverTimer=setTimeout(()=>{hoverTimer=0;open();},HELP_HOVER_DELAY);}});
  anchor.addEventListener('pointerleave',()=>{cancelHover();if(!pinned&&!anchor.contains(document.activeElement))close();});
  anchor.addEventListener('focusin',open);
  anchor.addEventListener('focusout',()=>{if(!pinned)close();});
  anchor.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pinned=false;close();b.focus();close();}});
  /* one listener per panel, and it leaves with the panel: a window rebuilt a hundred times must not leave a
     hundred listeners behind (1.4.0) */
  let seen=false;
  const outside=e=>{if(!anchor.isConnected){if(seen)document.removeEventListener('pointerdown',outside);return;}seen=true;if(!anchor.contains(e.target)){pinned=false;close();}};
  document.addEventListener('pointerdown',outside);
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
    const copy = node?.dataset?.help; if (!copy || document.body.classList.contains(hintsOffClass)) return;
    close(); owner = node; tip.textContent = copy; tip.hidden = false; node.setAttribute('aria-describedby', tip.id);
    const r = node.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tip.style.top = (r.bottom + h + 8 <= innerHeight ? r.bottom + 7 : Math.max(8, r.top - h - 7)) + 'px';
  };
  adopt(root.documentElement || root);
  new MutationObserver((records) => { for (const r of records) { if (r.type === 'attributes') adopt(r.target); else for (const n of r.addedNodes) adopt(n); } })
    .observe(root.documentElement || root, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });
  root.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse' || document.body.classList.contains(hintsOffClass)) return; if (e.buttons) return; const n = e.target.closest?.('[data-help]'); if (!n || n === owner || n === pending) return; close(); pending=n; hoverTimer=setTimeout(()=>{hoverTimer=0;const target=pending;pending=null;if(target?.isConnected&&target.matches(':hover'))open(target);},HELP_HOVER_DELAY); });
  root.addEventListener('pointerout', (e) => { const n=e.target.closest?.('[data-help]'); if(n && !n.contains(e.relatedTarget) && (n===owner||n===pending))close(); });
  /* focus shows a hint only to the KEYBOARD: a mouse press focuses its button too, and the law above says a hand on a
     control closes the hint (1.4.0: it reopened on the press's own focus) */
  root.addEventListener('focusin', (e) => { const n = e.target.closest?.('[data-help]'); let kb = true; try { kb = e.target.matches(':focus-visible'); } catch (_) {} if (n && kb) open(n); });
  root.addEventListener('focusout', (e) => { if (owner && owner.contains(e.target) && !owner.contains(e.relatedTarget)) close(); });
  /* A HAND ON A CONTROL CLOSES THE HINT (Josh, 2026-09-10): a press, a drag, a wheel or a key that operates
     the control means the reader is done reading. It stays closed until the pointer leaves and returns. */
  root.addEventListener('pointerdown', () => close(), { capture: true });
  root.addEventListener('wheel', () => close(), { capture: true, passive: true });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (owner) close(); return; } if (owner && !/^(Tab|Shift|Control|Alt|Meta)$/.test(e.key)) close(); });
  addEventListener('resize', close, { passive: true }); addEventListener('scroll', close, { passive: true, capture: true });
  root.addEventListener('controlhintschange', close);
}


/** consolidateWindowHelp(root, { sources }) — gather each window's explanatory notes into ONE ⓘ panel in its header.
 *  `sources` is the selector for what counts as help: λWAVES' notes and its spectrum formula by default. */
export function consolidateWindowHelp(root = document, { sources: sourceSel = '.note:not(.link-note), .sp-fx' } = {}) {
  for (const card of root.querySelectorAll('.dev')) {
    if (card.querySelector(':scope > .dev-head .window-help')) continue;
    const sources = [...card.querySelectorAll(sourceSel)]
      .filter((n) => !n.closest('.native-info') && n.textContent.trim());
    if (!sources.length) continue;
    const book = el('div', 'window-help-book');
    for (const n of sources) book.appendChild(n);
    const name = card.querySelector('.dev-eyebrow')?.textContent.trim() || 'Window';
    const control = infoPanel(book, name + ' help'); control.classList.add('window-help');
    card.querySelector('.dev-util')?.prepend(control);
  }
}
