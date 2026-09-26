// S4 VERIFY item 8a: ROTATE z 0.3 on 1s+2pz (m = 0) — a palette change through the palette card's own <select> is a named row
const w = (n) => new Promise((r) => setTimeout(r, n)), H = __LW.history;
__LW.loadPreset('1s+2pz'); __LW.pause(); H.flush(); await w(450); H.flush(); H.clear('probe');
__LW.setRotRate('z', 0.3); await w(700); H.flush(); const n0 = H.entries().length;
const sel = document.querySelector('.dev[data-id="palette"] select'); if (!sel) return { E: 'no palette select' };
const cur = sel.value, next = [...sel.options].map((o) => o.value).find((v) => v && v !== cur);
sel.value = next; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
await w(700); H.flush();
const rows = H.entries().slice(n0).map((e) => e.label), driving = __LW.rotDriving;
const u = H.undo(); await w(200); const back = sel.value === cur;
__LW.setRotRate('z', 0); await w(600); H.flush();
return { from: cur, to: next, rows, driving, undid: u, back, errs: (window.__e || []).slice() };
