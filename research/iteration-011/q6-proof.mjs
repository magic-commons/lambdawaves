/* research/iteration-011/q6-proof.mjs — iteration 011 Q6 · GEMMA, HIDDEN: the proof in headless Firefox, for the flag as the tree holds it.
 *   LW_PORT=9451 GD_PORT=5451 node research/iteration-011/q6-proof.mjs off     (ASK_ENABLED = false in lab/ask.js — the shipped state)
 *   LW_PORT=9451 GD_PORT=5451 node research/iteration-011/q6-proof.mjs on      (after flipping the one line to true, for the comparison)
 * It seeds a stored consent, a stored address and a saved `ask` chord, boots, photographs the transport, the KEYBOARD window and SETTINGS
 * into research/iteration-011/q6-shots/<part>-<mode>.png, reads every door, presses / and (off) proves no request left and the stored
 * keys were carried through a save untouched.  Prints one JSON line of measurements and exits non-zero on a broken expectation. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { open } from '../../tools/gate/gatekit.mjs';
import { actions, relActions, go } from '../../tools/gate/drv.mjs';

const MODE = process.argv[2] === 'on' ? 'on' : 'off', ON = MODE === 'on';
const SHOTS = new URL('./q6-shots/', import.meta.url); mkdirSync(SHOTS, { recursive: true });
const url = `https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`;
const URL_SEED = 'https://gemma.invalid:9443/ask';
const g = await open(url, { width: 1600, height: 1000, script: 60000 });
const ev = async (body) => { const r = await g.ev(body); if (r && r.E) throw new Error('page threw: ' + r.E); return r; };
const shot = async (name) => writeFileSync(new URL(`${name}-${MODE}.png`, SHOTS), Buffer.from(await g.snap(), 'base64'));
let n = 0;
const key = async (value, mods = []) => { await actions(g.s, [{ type: 'key', id: 'k' + (++n), actions: [...mods.map((m) => ({ type: 'keyDown', value: m })),
  { type: 'keyDown', value }, { type: 'pause', duration: 30 }, { type: 'keyUp', value }, ...mods.map((m) => ({ type: 'keyUp', value: m }))] }]); await relActions(g.s); };
const out = { mode: MODE }, bad = [];
const expect = (name, ok, got) => { if (!ok) bad.push({ name, got }); };
try {
  await g.waitFor('window.__LW?.ready', 300, 100);
  /* the seeds: a reader who once said CONTINUE, typed an address and moved ASK to K */
  await ev(`const k = 'lambdawaves.q0.settings', s = JSON.parse(localStorage.getItem(k) || '{}'); s.askOk = true; s.askUrl = ${JSON.stringify(URL_SEED)};
    localStorage.setItem(k, JSON.stringify(s)); localStorage.setItem('lambdawaves.q0.keys', JSON.stringify({ ask: ['KeyK'] })); return 1;`);
  await go(g.s, url); await g.waitFor('window.__LW?.ready', 300, 100);
  await ev(`await __LW.settle(); window.__req = []; const f = window.fetch; window.fetch = function (u, o) { __req.push(String(u && u.url || u)); return f.apply(this, arguments); }; return 1;`);

  out.transport = await ev(`const T = document.getElementById('transport');
    return { askBtn: T.querySelectorAll('.tbtn.ask').length, seat: T.querySelectorAll('.ask-seat').length, text: /gemma|\\bASK\\b/i.test(T.innerText + [...T.querySelectorAll('[title],[aria-label],[placeholder]')].map((e) => e.title + e.getAttribute('aria-label') + (e.placeholder || '')).join(' ')) };`);
  out.keyRow = await ev(`const a = __LW.keys.actions.find((x) => x.id === 'ask'); return { row: !!a, slashHolders: __LW.keys.table.holders('Slash'), kHolders: __LW.keys.table.holders('KeyK') };`);
  await shot('transport');

  /* the / key from the stage: off, nothing happens and nothing is fetched; on, the type box opens */
  await ev(`if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return 1;`);
  await key('/');
  await ev(`await new Promise((r) => setTimeout(r, 300)); return 1;`);
  out.afterSlash = await ev(`const T = document.getElementById('transport'); return { asking: T.classList.contains('asking'), consent: T.classList.contains('consent'), lineVisible: !!(T.querySelector('.ask-line') && T.querySelector('.ask-line').offsetWidth), requests: __req.slice() };`);
  if (ON) await shot('transport-typebox');
  await key('');   // Escape: the type box closes (on), nothing (off)

  /* the KEYBOARD window */
  await ev(`__LW.keymap.open(); await new Promise((r) => setTimeout(r, 500)); return 1;`);
  out.keyboard = await ev(`const w = document.querySelector('[data-mir-window="keyboard"]');
    return { open: __LW.keymap.isOpen, askRow: w.querySelectorAll('.km-action-row[data-id="ask"]').length, rows: w.querySelectorAll('.km-action-row').length, gemma: /gemma/i.test(w.innerText) };`);
  await shot('keyboard');
  await ev(`__LW.keymap.close(); return 1;`);

  /* SETTINGS (DISPLAY) */
  await ev(`__LW.layout.reopen('settings', 'R'); await new Promise((r) => setTimeout(r, 400)); const d = document.querySelector('.dev[data-id="settings"]') || document.getElementById('settings'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); await new Promise((r) => setTimeout(r, 400)); if (d) d.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 300)); return 1;`);
  out.settings = await ev(`const d = document.querySelector('.dev[data-id="settings"]') || document.getElementById('settings'), i = d && d.querySelector('input.ask-line');
    return { found: !!d, addressInput: !!i, value: i ? i.value : null, gemma: d ? /gemma/i.test(d.innerText + [...d.querySelectorAll('[title],[aria-label],[placeholder]')].map((e) => e.title + e.getAttribute('aria-label') + (e.placeholder || '')).join(' ')) : null, emptyRows: d ? [...d.querySelectorAll('.settings-page > .row.tight')].filter((r) => !r.children.length).length : null };`);
  await shot('settings');

  /* every menubar menu's rows, opened as a hand opens them */
  out.menus = await ev(`__LW.layout.menu.open(); const bar = document.getElementById('menubar'), hits = [];
    for (const b of bar.querySelectorAll('.mb-btn')) { b.click(); await new Promise((r) => setTimeout(r, 60)); for (const l of b.parentElement.querySelectorAll('.mb-lbl')) if (/gemma|^ASK\\b/i.test(l.textContent)) hits.push(b.dataset.menu + ' › ' + l.textContent); b.click(); }
    __LW.layout.menu.close && __LW.layout.menu.close(); return { menus: bar.querySelectorAll('.mb-btn').length, hits };`);

  /* the stored keys: a save (another binding changed and reset; SETTINGS saved) leaves askOk / askUrl and the saved ask chord as stored */
  out.stored = await ev(`__LW.keys.bind('camReset', { key: 'KeyU', ctrl: false, alt: false, shift: false }); __LW.keys.reset('camReset'); __LW.saveSettings();
    const s = JSON.parse(localStorage.getItem('lambdawaves.q0.settings') || '{}'); return { askOk: s.askOk, askUrl: s.askUrl, keys: JSON.parse(localStorage.getItem('lambdawaves.q0.keys')), requests: __req.slice() };`);
  /* the verb table stands either way (the notebook's lw: links run through it) */
  out.verbs = await ev(`const v = __LW.verbs; return { here: !!(v && v.run && v.inventory), verbs: v && v.table ? Object.keys(v.table).length || v.table.length : null };`);
  out.errors = (await g.errors()).errs;

  if (ON) {
    expect('ASK button', out.transport.askBtn === 1 && out.transport.seat === 1, out.transport);
    expect('/ row', out.keyRow.row, out.keyRow);
    expect('/ opens the type box', out.afterSlash.asking && out.afterSlash.lineVisible, out.afterSlash);
    expect('keyboard lists ask', out.keyboard.askRow === 1, out.keyboard);
    expect('Settings address', out.settings.addressInput && out.settings.value === URL_SEED, out.settings);
  } else {
    expect('no ASK in the transport', !out.transport.askBtn && !out.transport.seat && !out.transport.text, out.transport);
    expect('no / row, K free of ask', !out.keyRow.row && !out.keyRow.slashHolders.includes('ask') && !out.keyRow.kHolders.includes('ask'), out.keyRow);
    expect('/ does nothing', !out.afterSlash.asking && !out.afterSlash.lineVisible && !out.afterSlash.requests.length, out.afterSlash);
    expect('keyboard has no ask row, no Gemma', out.keyboard.open && !out.keyboard.askRow && !out.keyboard.gemma, out.keyboard);
    expect('Settings has no address, no Gemma, no empty row', out.settings.found && !out.settings.addressInput && !out.settings.gemma && !out.settings.emptyRows, out.settings);
    expect('stored pair carried', out.stored.askOk === true && out.stored.askUrl === URL_SEED, out.stored);
    expect('saved ask chord kept', out.stored.keys && JSON.stringify(out.stored.keys.ask) === '["KeyK"]', out.stored.keys);
    expect('no request', !out.stored.requests.some((u) => /9443|gemma|\/ask/i.test(u)), out.stored.requests);
  }
  expect('no menubar row names her', !out.menus.hits.length, out.menus);
  expect('verb table here', out.verbs.here, out.verbs);
  expect('no page errors', !out.errors.length, out.errors);
} finally { await g.close(); }
console.log(JSON.stringify(out));
console.log(bad.length ? 'RED q6-proof ' + MODE + ' ' + JSON.stringify(bad) : 'GREEN q6-proof ' + MODE);
process.exit(bad.length ? 1 : 0);
