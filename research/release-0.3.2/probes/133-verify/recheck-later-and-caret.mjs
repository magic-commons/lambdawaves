// VERIFIER RE-CHECK · wave 133 fix pass — (a) does LATER disarm the take-on-hide?  A moved-clock session is offered, LATER is
// pressed for real, the ring is let go quiet (> 400 ms), then the page hides.  (a') the same hide inside the 400 ms window after the
// press (the one-shot listener is spent on a hide that reads "not untouched").  (b) the MEASURED caret after things that move the
// badge without a resize: STATUS TAGS switched, the racks hidden, a ψ-badge changing its text.  1500 × 1000 and 1140 × 800.
//   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/recheck-later-and-caret.mjs
import { writeFileSync } from 'node:fs';
import * as drv from '../../../../tools/gate/drv.mjs';
import { open } from '../../../../tools/gate/gatekit.mjs';

const PORT = process.env.LW_PORT || 8732;
const BASE = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz`;
const out = [];
const say = (k, v) => { out.push([k, v]); console.log(k, JSON.stringify(v)); };
const HELP = `
  window.__w = (n) => new Promise((r) => setTimeout(r, n));
  window.__hide = () => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); };
  window.__caret = () => { const p = document.getElementById('offer'), b = document.querySelector('#badges > .badge.build'); const pr = p.getBoundingClientRect(), br = b.getBoundingClientRect();
    const x = pr.left + p.clientLeft + parseFloat(getComputedStyle(p, '::before').left); return { caretX: Math.round(x * 10) / 10, badge: [Math.round(br.left), Math.round(br.right)], offBy: Math.round((x - (br.left + br.width / 2)) * 10) / 10, insideBadge: x > br.left + 4 && x < br.right - 4 }; };
  return 1;`;

for (const [W, H] of [[1500, 1000], [1140, 800]]) {
  const g = await open(BASE, { width: W, height: H, script: 120000 });
  try {
    await g.waitFor('window.__LW && __LW.ready', 400, 100); await g.ev(HELP);
    if (W === 1500) {
      /* (a) LATER, then a hide after the ring is quiet */
      await g.ev(`try { await __LW.settle(); } catch (e) {} __LW.scrub(137); await __w(300); const sw = __LW.sw; sw.reload = () => {}; window.__took = null; sw.state = 'idle'; sw.pending = { build: 'a' };
        sw.buildReady((o) => { window.__took = o || {}; }); await __w(200); return 1;`);
      const tap = await g.tap('#offer .offer-row .trig:last-child');
      const a = await g.ev(`await __w(900); const pre = { pane: !document.getElementById('offer').hidden, pending: __LW.history.pendingLabel, took: window.__took };
        __hide(); return { tap: ${JSON.stringify(tap)}, pre, hidden: { took: window.__took, state: __LW.sw.state } };`);
      say('(a) LATER pressed, ring quiet, then hidden', a);
      /* (a') a fresh offer, a real press on the stage background (no change), and a hide 50 ms later */
      await drv.go(g.s, 'about:blank'); await drv.go(g.s, BASE); await g.waitFor('window.__LW && __LW.ready', 400, 100); await g.ev(HELP);
      await g.ev(`try { await __LW.settle(); } catch (e) {} __LW.play(); await __w(300); const sw = __LW.sw; sw.reload = () => {}; window.__took = null; sw.state = 'idle'; sw.pending = { build: 'a2' };
        sw.buildReady((o) => { window.__took = o || {}; }); await __w(200); return 1;`);
      const tap2 = await g.tap('#offer h3');
      const a2 = await g.ev(`const pre = { pending: __LW.history.pendingLabel, holding: __LW.history.holding }; __hide(); const first = { took: window.__took, state: __LW.sw.state };
        await __w(900); __hide(); const second = { took: window.__took, state: __LW.sw.state }; __LW.pause(); return { tap: ${JSON.stringify(tap2)}, pre, firstHide: first, secondHideLater: second };`);
      say("(a') playing, a press on the pane's heading, a hide 0 ms later, then another hide 0.9 s later", a2);
    }
    /* (b) the caret after moves that are not a resize */
    await drv.go(g.s, 'about:blank'); await drv.go(g.s, BASE); await g.waitFor('window.__LW && __LW.ready', 400, 100); await g.ev(HELP);
    const b = await g.ev(`try { await __LW.settle(); } catch (e) {} __LW.loadPreset('2pz'); __LW.history.flush(); const sw = __LW.sw; sw.reload = () => {}; sw.state = 'idle'; sw.offered = null; sw.pending = { build: 'b' };
      sw.buildReady(() => {}); await __w(300); const R = { shown: __caret() };
      document.body.classList.remove('no-badges'); await __w(300); R.tagsOn = __caret();
      document.body.classList.add('no-badges'); await __w(300); R.tagsOffAgain = __caret();
      document.body.classList.remove('no-badges'); await __w(300); R.tagsOn2 = __caret();
      const f = document.querySelector('#badges > .badge:not(.build):not([hidden])'); if (f) { f.lastChild.textContent = 'STATE · A MUCH LONGER READING OF THE STATE · SHADOW'; } await __w(300); R.psiTextLonger = __caret();
      document.body.classList.add('no-badges'); await __w(200);
      const tog = document.getElementById('rackToggle'); tog.click(); await __w(700); R.racksHidden = Object.assign(__caret(), { bodyRackHidden: document.body.classList.contains('rack-hidden') });
      tog.click(); await __w(700); R.racksBack = __caret();
      return R;`);
    say(`(b) caret at ${W}×${H}`, b);
  } catch (e) { say(`${W}×${H} ERROR`, String(e && e.stack || e)); }
  finally { await g.close(); }
}
writeFileSync(new URL('./recheck-later-and-caret.out.json', import.meta.url), JSON.stringify(out, null, 1));
