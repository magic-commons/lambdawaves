/* serialize-diff.mjs — which serialize() fields move between two identical sessions (to know what to mask). */
import { page } from './lib.mjs';
const run = async () => { const g = await page(); try { return await g.ev(`__LW.pause(); __LW.scrub(0); await __LW.settle(); await __LW.settle(); const H = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', key: 'h', bubbles: true })); __LW.play(); await new Promise((r) => setTimeout(r, 600)); __LW.pause(); __LW.scrub(0); await __LW.settle(); H(); await __LW.settle(); __LW.play(); await new Promise((r) => setTimeout(r, 700)); __LW.pause(); H(); __LW.scrub(0); await __LW.settle(); return __LW.serialize();`); } finally { await g.close(); } };
const a = await run(), b = await run();
const diffs = [];
const walk = (x, y, p) => { if (typeof x !== typeof y) { diffs.push([p, x, y]); return; }
  if (x && typeof x === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})])) walk(x[k], y ? y[k] : undefined, p + '.' + k); return; }
  if (x !== y) diffs.push([p, x, y]); };
walk(a, b, '');
console.log(JSON.stringify(diffs.slice(0, 40)));
