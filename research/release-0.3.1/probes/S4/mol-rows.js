// S4 probe: MOLECULES ON by its switch (a press) — which rows, and what does each carry?  Polls the edit scope every 10 ms for 1.5 s.
const w = (n) => new Promise((r) => setTimeout(r, n));
const L = __LW, H = L.history, S = () => L.serialize({ scope: 'edit' });
const diff = (a, b, p = '', o = []) => { if (o.length > 30) return o; if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + '.' + k, o); } else if (JSON.stringify(a) !== JSON.stringify(b)) o.push(p + ': ' + String(JSON.stringify(a)).slice(0, 50) + ' → ' + String(JSON.stringify(b)).slice(0, 50)); return o; };
let pid = 990;
const PE = (el, type, x, y, id) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
const sw = [...document.querySelectorAll('.sw')].find((e) => (e.querySelector('.sw-lbl')?.textContent || '').trim() === 'MOLECULES ON');
const d = sw.closest('.dev'); d.classList.remove('closed'); sw.scrollIntoView({ block: 'center' }); await w(100);
const btn = sw.querySelector('button') || sw;
H.flush(); await w(450); H.flush(); H.clear('probe');
const s0 = S(), t0 = performance.now();
const b = btn.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, id = ++pid;
PE(btn, 'pointerdown', x, y, id); PE(btn, 'pointerup', x, y, id); btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
const events = []; let last = S(), rows = 1;
for (let i = 0; i < 150; i++) { await w(10); const s = S(), n = H.entries().length, t = +(performance.now() - t0).toFixed(0);
  const dd = diff(last, s); if (dd.length) events.push({ t, change: dd }); if (n !== rows) events.push({ t, rows: H.entries().map((e) => e.label), cursor: H.cursor }); last = s; rows = n; }
await w(600); H.flush();
return { events, rows: H.entries().map((e) => e.label), total: diff(s0, S()), errs: __e.slice() };
