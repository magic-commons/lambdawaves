// VERIFIER PROBE · wave 133 — STATUS TAGS ON, WITH THE CANDIDATE CSS INJECTED (order:-1 on the build badge + the row's left bound): where is the build badge in the row, what does the caret point at, and on the phone
// (a nowrap, overflow-hidden strip) is the build badge still on screen?  Desktop 1500 × 1000 and 1140 × 800; phone 500 × 930
// (headless Firefox's floor; body.phone).   LW_PORT=8732 GD_PORT=5232 node research/release-0.3.2/probes/133-verify/tags-on-candidate.mjs
import { writeFileSync } from 'node:fs';
import { open } from '../../../../tools/gate/gatekit.mjs';
const URL_ = `https://127.0.0.1:${process.env.LW_PORT || 8732}/lab/?preset=1s%2B2pz`;
const out = [];
for (const [W, H] of [[1500, 1000], [1366, 1024], [1140, 800], [1000, 700], [500, 930]]) {
  const g = await open(URL_, { width: W, height: H });
  try {
    await g.waitFor('window.__LW && __LW.ready', 400, 100);
    const r = await g.ev(`try { await __LW.settle(); } catch (e) {} __LW.loadPreset('2pz'); __LW.history.flush();
      document.body.classList.remove('no-badges'); { const st = document.createElement('style'); st.textContent = '#badges > .badge.build { order: -1; } #badges { left: min(calc(var(--rack-w) + 340px), calc(100% - var(--rack-w) - 266px)); }'; document.head.appendChild(st); }                                   /* STATUS TAGS on */
      const sw = __LW.sw; sw.reload = () => {}; sw.state = 'idle'; sw.offered = null; sw.pending = { build: 'x' }; sw.buildReady(() => {});
      await new Promise((q) => setTimeout(q, 400));
      const row = document.getElementById('badges'), rr = row.getBoundingClientRect(), B = row.querySelector('.badge.build'), br = B.getBoundingClientRect();
      const pane = document.getElementById('offer'), pr = pane.getBoundingClientRect(), caretX = pr.left + parseFloat(getComputedStyle(pane, '::before').left);
      const shown = [...row.querySelectorAll('.badge')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => { const r = b.getBoundingClientRect(); return { build: b === B, text: b.lastChild.textContent.slice(0, 26), x: [Math.round(r.left), Math.round(r.right)] }; });
      const atCaret = document.elementFromPoint(caretX, br.top + br.height / 2); const under = atCaret && atCaret.closest('.badge');
      const cx = Math.min(br.right - 2, Math.max(br.left + 2, br.left + br.width / 2)), hit = document.elementFromPoint(cx, br.top + br.height / 2);
      return { viewport: [innerWidth, innerHeight], phone: document.body.classList.contains('phone'), rowBox: [Math.round(rr.left), Math.round(rr.right)], rowOverflow: getComputedStyle(row).overflow,
        badges: shown, buildInsideRow: br.left >= rr.left - 1 && br.right <= rr.right + 1, buildOnScreen: br.right > 0 && br.left < innerWidth,
        buildHitAtItsCentre: !!hit && (hit === B || B.contains(hit)), hitBy: hit ? (hit.id || String(hit.className).slice(0, 24) || hit.tagName) : null,
        caretX: Math.round(caretX), caretPointsAt: under ? (under === B ? 'the build badge' : under.lastChild.textContent.slice(0, 26)) : (atCaret ? (atCaret.id || atCaret.tagName) : null) };`);
    console.log(W + '×' + H, JSON.stringify(r)); out.push([W + '×' + H, r]);
    const png = await g.snap(); writeFileSync(new URL(`./tags-on-candidate-${W}x${H}.png`, import.meta.url), Buffer.from(png, 'base64'));
  } finally { await g.close(); }
}
writeFileSync(new URL('./tags-on-candidate.out.json', import.meta.url), JSON.stringify(out, null, 1));
