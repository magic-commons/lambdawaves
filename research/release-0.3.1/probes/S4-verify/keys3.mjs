// S4 VERIFY item 4 follow-up: right after a REAL C, pendingLabel read null while the edit stood uncommitted — trace the ring's
// pending name, depth and the key/pointer events every 4 ms around one C press, then C then V 150 ms apart.
//   LW_PORT=8747 GD_PORT=5247 node research/release-0.3.1/probes/S4-verify/keys3.mjs
import { lab } from '../S3-verify/kit.mjs';
const g = await lab();
const blur = () => g.run(`document.activeElement && document.activeElement.blur && document.activeElement.blur(); return 1;`);
try {
  for (const seq of [['c'], ['c', 'v']]) {
    await g.run(`await __settle(); __LW.history.clear('probe'); const H = __LW.history; window.__tr = []; const t0 = performance.now(); let last = '';
      const ev = (e) => __tr.push((performance.now() - t0).toFixed(0) + ' ' + e.type + (e.key ? ':' + e.key : '') + (e.pointerId !== undefined ? ':p' + e.pointerId : ''));
      for (const ty of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'pointercancel', 'blur', 'focus']) window.addEventListener(ty, ev, true);
      window.__trOff = () => { for (const ty of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'pointercancel', 'blur', 'focus']) window.removeEventListener(ty, ev, true); clearInterval(window.__trI); };
      window.__trI = setInterval(() => { const s = 'pending=' + H.pendingLabel + ' depth=' + H.depth + ' rows=' + H.entries().length + ' style=' + __LW.mat.style; if (s !== last) { __tr.push((performance.now() - t0).toFixed(0) + ' ' + s); last = s; } }, 4);
      return 1;`);
    for (let i = 0; i < seq.length; i++) { if (i) await g.run(`await __w(150); return 1;`); await blur(); await g.key(seq[i]); __trace: 0; }
    const tr = await g.run(`await __w(900); __trOff(); return { tr: __tr, rows: __LW.history.entries().map((e) => e.label) };`);
    console.log('── ' + seq.join(' then ')); for (const l of tr.tr) console.log('  ' + l); console.log('  rows', JSON.stringify(tr.rows));
  }
  console.log('errs', JSON.stringify(await g.run(`return __e.slice();`)));
} catch (e) { console.error(e); }
finally { await g.close(); }
