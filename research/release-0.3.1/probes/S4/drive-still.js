// S4 probe: ROTATE z on an m = 0 state (1s+2pz), paused: does a STAGE knob drag make its own row now?  And the drive's state.
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, count = () => H.entries().length, ser = () => JSON.stringify(__LW.serialize({ scope: 'edit' }));
let pid = 950;
const PE = (el, type, x, y, id) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
const drag = async (el, dx, dy, n = 6, gap = 15) => { const id = ++pid, b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; PE(el, 'pointerdown', x, y, id); for (let i = 1; i <= n; i++) { PE(el, 'pointermove', x + dx * i / n, y + dy * i / n, id); await w(gap); } PE(el, 'pointerup', x + dx, y + dy, id); await w(30); };
const knob = [...document.querySelectorAll('.k')].find((e) => (e.querySelector('.k-lbl')?.textContent || '').trim() === 'STAGE');
const d = knob.closest('.dev'); d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); knob.scrollIntoView({ block: 'center' });
__LW.loadPreset('1s+2pz'); __LW.pause(); H.note(); await w(600); H.flush();
__LW.setRotRate('z', 0.3); H.note(); await w(600); H.flush();
const a = { driving: __LW.rotDriving, rows: count(), canUndo: H.canUndo, depth: H.depth };
const s0 = ser(); await w(500); const s1 = ser();
const n0 = count(); await drag(knob.querySelector('.k-dial'), 0, -30); await w(520); H.flush();
const b = { rows: count() - n0, name: H.entries().at(-1).label, drifted: s0 !== s1, stageMoved: ser() !== s1 };
__LW.setRotRate('z', 0); await w(600); H.flush();
return { a, b, errs: __e.slice() };
