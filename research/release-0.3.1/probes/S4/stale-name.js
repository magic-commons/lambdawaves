// S4 probe: the stale name.  A press on the THEME segment (a PREFERENCE: no edit) leaves its name pending, and the next
// unnamed edit (a preset loaded through the API, as a keyboard road would) takes it.  Also: the UNDO trigger's own name.
const w = (n) => new Promise((r) => setTimeout(r, n));
const H = __LW.history, ser = () => JSON.stringify(__LW.serialize({ scope: 'edit' }));
let pid = 900;
const PE = (el, type, x, y, id) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: id, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, isPrimary: true, clientX: x, clientY: y }));
const press = async (el) => { const id = ++pid, b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2; PE(el, 'pointerdown', x, y, id); PE(el, 'pointerup', x, y, id); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); await w(30); };
const show = (el) => { const d = el.closest('.dev'); if (d) { d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); } el.scrollIntoView({ block: 'center', behavior: 'instant' }); return el; };
const seg = (group, word) => [...document.querySelectorAll('.seg-b')].find((b) => b.textContent.trim() === word && b.closest('.segw')?.querySelector('.k-lbl')?.textContent.trim() === group);
const out = {};
H.flush(); await w(450); H.flush();
/* 1 · THEME DARK, then a preset through the API */
const pre = ser(), n0 = H.entries().length;
await press(show(seg('THEME', __LW.themeChoice === 'dark' ? 'LIGHT' : 'DARK'))); await w(520); H.flush();
out.theme = { rows: H.entries().length - n0, changedEditScope: ser() !== pre, pending: H.pendingLabel === undefined ? '(no pendingLabel on the api)' : H.pendingLabel };
__LW.loadPreset('2p+'); await w(520); H.flush();
out.presetAfterTheme = { rows: H.entries().length - n0, name: H.entries().at(-1).label };
/* 2 · the UNDO trigger, then an API edit */
const undoBtn = [...document.querySelectorAll('.dev[data-id="history"] .trig')].find((t) => t.textContent.trim() === 'UNDO');
await press(show(undoBtn)); await w(50);
__LW.setStage(0.37); await w(520); H.flush();
out.editAfterUndoButton = { name: H.entries().at(-1).label };
out.errs = __e.slice();
return out;
