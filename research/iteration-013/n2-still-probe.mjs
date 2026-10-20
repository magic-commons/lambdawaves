/* research/iteration-013/n2-still-probe.mjs — THE STILL WORDS (N2): with CURSOR's PARALLAX and DRIFT off (the defaults), a real pointer
 * (WebDriver actions) sweeps past the stage formula; the formula block's `translate` is read before, mid-sweep and after. Equal = still.
 *   LW_PORT=9611 GD_PORT=5611 node research/iteration-013/n2-still-probe.mjs [--on]   (--on: PARALLAX on, the control: it must move) */
import { open } from '../../tools/gate/gatekit.mjs';
import { actions, relActions } from '../../tools/gate/drv.mjs';

const ON = process.argv.includes('--on');
const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 9611}/lab/`, { width: 1600, height: 1000, script: 120000 });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await g.waitFor('window.__LW?.ready', 400, 100);
  const set = await g.ev(`const b = [...document.querySelectorAll('#lwMode button, #lwMode [role=radio]')].find((x) => /MOLECULES/i.test(x.textContent)); b && b.click();
    await new Promise((r) => setTimeout(r, 4000));
    ${ON ? `const sw = document.querySelector('.dev[data-id="informational"]'); const c = sw.querySelector('.lw-fold'); if (c && c.getAttribute('aria-expanded') !== 'true') c.click();
    const p = [...sw.querySelectorAll('.sw')].find((s) => /PARALLAX/i.test(s.textContent)); p && p.click(); await new Promise((r) => setTimeout(r, 300));` : ''}
    const f = [...document.querySelectorAll('.lw-stage .mir-info-block')].find((e) => e.textContent.trim()); if (!f) return { none: 1 };
    const r = f.getBoundingClientRect(); window.__f = f; return { box: [r.left, r.top, r.width, r.height].map(Math.round), text: f.textContent.trim().slice(0, 20) };`);
  if (!set.box) throw new Error('no formula block: ' + JSON.stringify(set));
  const [x, y, bw, bh] = set.box, cy = Math.round(y + bh + 60), read = () => g.ev(`const f = window.__f, cs = getComputedStyle(f); return { translate: cs.translate, transform: cs.transform, left: Math.round(f.getBoundingClientRect().left * 100) / 100, top: Math.round(f.getBoundingClientRect().top * 100) / 100 };`);
  const before = await read();
  const moves = []; for (let i = 0; i <= 24; i++) moves.push({ type: 'pointerMove', duration: 40, x: Math.round(x - 200 + (bw + 400) * i / 24), y: cy });
  await actions(g.s, [{ type: 'pointer', id: 'm', parameters: { pointerType: 'mouse' }, actions: moves }]);
  const mid = await read(); await w(2500); const after = await read(); await relActions(g.s);
  const still = before.left === mid.left && before.top === mid.top && mid.left === after.left && mid.top === after.top;
  console.log(JSON.stringify({ parallax: ON, formula: set.text, before, mid, after, still }));
} finally { await g.close(); }
