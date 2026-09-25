/* la9-measure.mjs — LA9's measure-first: what does measureRacks() cost per pointermove during a rack-card drag?
 * A real header drag (pointerdown on a rack card's .dev-head, then pointermoves down the rack), frames interleaved
 * the way a 120–1000 Hz mouse interleaves them (1, 2 and 4 moves per frame).  Timed: each move's whole dispatch, and
 * the getBoundingClientRect calls on #rack / #rackL inside it (that is measureRacks).
 *   LW_PORT=8724 GD_PORT=5243 node research/optimization-2026-09-24/probes/LA/la9-measure.mjs <tag> */
import { page, save } from './lib.mjs';
const g = await page();
const R = {};
try {
  R.runs = await g.ev(`__LW.pause(); await __LW.settle();
    const rack = document.getElementById('rack'), rackL = document.getElementById('rackL');
    const gb = Element.prototype.getBoundingClientRect; let inMove = false, rackMs = 0, rackCalls = 0;
    Element.prototype.getBoundingClientRect = function () { if (inMove && (this === rack || this === rackL)) { const t = performance.now(); const r = gb.call(this); rackMs += performance.now() - t; rackCalls++; return r; } return gb.call(this); };
    const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
    const out = [];
    for (const perFrame of [1, 2, 4]) {
      const cards = [...rack.querySelectorAll('.dev')].filter((d) => !d.hidden && d.getBoundingClientRect().height > 20);
      const card = cards[0], head = card.querySelector('.dev-head'); const hr = gb.call(head), rr = gb.call(rack);
      const x = Math.round(hr.left + 40), y0 = Math.round(hr.top + hr.height / 2);
      head.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y0, pointerId: 7, button: 0, isPrimary: true }));
      const per = [], rackPer = []; let y = y0;
      for (let f = 0; f < 30; f++) {
        for (let k = 0; k < perFrame; k++) { y = Math.min(rr.bottom - 10, y + 6); rackMs = 0; rackCalls = 0; inMove = true; const t0 = performance.now();
          window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, pointerId: 7, isPrimary: true }));
          const d = performance.now() - t0; inMove = false; per.push(d); rackPer.push(rackMs); }
        await raf();
      }
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 7, isPrimary: true })); await raf(); await raf();
      const med = (a) => { const s = a.slice().sort((p, q) => p - q); return +s[s.length >> 1].toFixed(4); }, p90 = (a) => { const s = a.slice().sort((p, q) => p - q); return +s[Math.floor(s.length * 0.9)].toFixed(4); };
      const first = per.filter((_, i) => i % perFrame === 0), firstRack = rackPer.filter((_, i) => i % perFrame === 0);
      out.push({ movesPerFrame: perFrame, moves: per.length, moveMsMedian: med(per), moveMsP90: p90(per), rackRectMsMedian: med(rackPer), rackRectMsP90: p90(rackPer), firstMoveAfterFrame: { moveMs: med(first), rackRectMs: med(firstRack) }, rectCallsPerMove: rackCalls });
    }
    Element.prototype.getBoundingClientRect = gb;
    return out;`);
  R.errs = await g.ev('return (window.__e || []).map(String).slice(0, 10)');
} catch (e) { R.error = String(e && e.stack || e); console.error(e); }
finally { await g.close(); }
console.log(JSON.stringify(R));
save(import.meta.url, R);
