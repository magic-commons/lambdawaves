/* lab/shell/ink.js — §18 INK STAYS UNDER GLASS (0.5.2 R2d; moved verbatim out of lab/rack.js boot()): the occlusion host — refreshOcclusion, which the loop
 * calls, and the providers registered in their old order.  createInk(app) runs where §18 stood; boot() destructures refreshOcclusion for the loop. */
import { TIER } from '../rack.js'; import { paintedRect } from '../occlusion.js';
export function createInk(app) {
  const { dom } = app, { schedule } = app.loop, { rack, rackL, floats } = app.host, { occlusion, field } = app.ctl;
  const NO_OCCLUSION = [];
  function refreshOcclusion(nowMs) {
    app.state.occludeDirty = false; app.state.occludeAt = nowMs;
    /* LA3 · HIDDEN, NOTHING IS PAINTED, SO NOTHING MASKS.  Under body.ui-hidden every surface below is display:none
       (lab.css: the racks, transport, sheet and both lists !important; #floats (the keyboard window too) and #notebook !important), and
       #keysheet no longer exists — so the burst's answer is exactly [] and its layout reads bought nothing, every 300 ms
       (AUDIT-B FB5, REFUTE-E/F).  The empty block is still HANDED OVER, because the line pass still runs under H (the
       slice outline) and the rectangles from before the hide must not punch holes in it; setOcclusion compares its
       signature, so an already-empty block costs a string compare.  The body-class observer below re-dirties the
       burst on the way back. */
    if (document.body.classList.contains('ui-hidden')) { if (field.setOcclusion(NO_OCCLUSION)) schedule(TIER.PRESENT); return; }
    const cb = dom.canvas.getBoundingClientRect();
    const toCanvas = (r) => { const x0 = r.left - cb.left, y0 = r.top - cb.top, x1 = r.right - cb.left, y1 = r.bottom - cb.top;
      return x1 - x0 < 2 || y1 - y0 < 2 || x1 <= 0 || y1 <= 0 || x0 >= cb.width || y0 >= cb.height ? null : [x0, y0, x1, y1]; };
    if (field.setOcclusion(occlusion.rects(toCanvas))) schedule(TIER.PRESENT);
    landing();
  }
  /* iteration 015 T6 · A MASK TAKEN MID-MOTION IS TAKEN AGAIN WHEN THE MOTION LANDS.  The kit's rack folds a card's height and slides its
     neighbours (core/motion.js, WAAPI on the cards): no attribute changes when they land, so under a storm of folds and raises the last
     refresh caught the column 2–5 px short of where it settled and kept it (tests/window-switching, seed 2).  Whatever is running in the
     racks or #floats when the block is read dirties it once more on landing; one wait at a time. */
  let waiting = false;
  function landing() {
    if (waiting) return;
    const running = [rack, rackL, floats].flatMap((el) => (el && el.getAnimations ? el.getAnimations({ subtree: true }) : [])).filter((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations !== Infinity);   // a lamp's endless pulse never lands
    if (!running.length) return;
    waiting = true;
    Promise.all(running.map((a) => a.finished.catch(() => null))).then(() => { waiting = false; occlusion.dirty(); });
  }
  { const body = document.body, { root: mw, rail } = app.state.modView, dirty = occlusion.dirty, shown = (d) => !d.hidden && !d.classList.contains('closed');
    /* 015 H3: a hidden rack shows only while ITS edge peeks (rack-peek-left | right), so the mask follows the one rack that came back */
    const rackShown = (rk) => !body.classList.contains('rack-hidden') || body.classList.contains(rk === rackL ? 'rack-peek-left' : 'rack-peek-right'), rects = (els) => els.map((s) => paintedRect(s));
    /* a card is one pane, or (DISCONNECTED, never on a phone) its head and its body with the stage showing between them */
    const panes = (d) => body.classList.contains('disconnected') && !body.classList.contains('phone') ? [d.querySelector('.dev-head'), d.querySelector('.dev-body')] : [d];
    /* Device cards scroll inside the modulation run. Their offscreen bounds must not mask the stage. */
    occlusion.register('modwin', () => shown(mw) ? [...mw.querySelectorAll('.m2rail, .m2dev, .m2workbar')].map((s) => paintedRect(s, s.classList.contains('m2dev') && s.closest('.m2run'))) : []);
    occlusion.register('chiprail', () => shown(rail) ? rects([...rail.querySelectorAll('.crail-chip')]) : []);
    /* 0.5.0 C4: the kit's window travels (tweenRect) and fades (presence); its `hidden` lands when the exit ends, and onGeometry
       tells every place, landing, open and close — both are the one producer's, so a paused field's mask follows them */
    for (const el of [mw, rail]) occlusion.watch(el, { attributes: true, attributeFilter: ['hidden'] });
    app.state.modView.onGeometry(dirty);
    occlusion.register('floats', () => rects([...floats.children].filter((d) => d.classList.contains('dev') && shown(d)).flatMap(panes)));
    occlusion.register('extra', () => rects(['transport', 'notebook', 'sheet', 'offer', 'rackAddList', 'rackFavList'].map((id) => document.getElementById(id))));
    occlusion.register('keymap', () => rects([document.querySelector('[data-mir-window="keyboard"]'), ...document.querySelectorAll('[data-mir-rail="keyboard"] .mir-chip')]));   // C3: the kit's window and its rail
    occlusion.register('rack', () => rects([rack, rackL].flatMap((rk) => rk && rackShown(rk) ? [...rk.children] : []).filter((d) => d.classList.contains('dev') && !d.classList.contains('closed')).flatMap(panes)),
      { standIn: () => [rack, rackL].filter((rk) => rk && rackShown(rk)).map((rk) => paintedRect(rk)) });   // past the block's 32 the two columns stand in for their cards
    for (const el of [floats, rack, rackL]) occlusion.watch(el, { childList: true });
    /* A paused field has no periodic frame to notice a source card sliding under the run's clip. */
    if (floats) floats.addEventListener('scroll', dirty, { capture: true, passive: true });
    for (const id of ['notebook', 'transport', 'sheet', 'offer', 'rackAddList', 'rackFavList']) occlusion.watch(document.getElementById(id), { attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
    new MutationObserver(dirty).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', dirty, { passive: true });
    window.addEventListener('resize', dirty, { passive: true });
    /* 0.5.0 C3 · the kit's rack moves a floating card by `translate` and left/top and animates a folding card's height: a card's OWN
       style or class (never a knob's inside it) dirties the block, so a paused field's mask follows the hand and the fold */
    const own = new MutationObserver((rs) => { if (rs.some((r) => [floats, rack, rackL].includes(r.target.parentElement))) dirty(); });
    for (const el of [floats, rack, rackL]) if (el) own.observe(el, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
  }
  return { refreshOcclusion };
}
