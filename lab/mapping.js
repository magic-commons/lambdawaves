/* lab/mapping.js — THE MAPPING (021 I2): the KEYBOARD window's second face.  Every `surface` row of THE ACTION REGISTRY (lab/actions.js) with
 * its group and three chips — KEY (the bound chord), MIDI (the learned note or CC, the kit's mir/shell/midi.js), MOD (`action.<id>` routed) —
 * and ONE LEARN that arms all three at once: the first input wins (a keydown binds through the table with the steal law: a taken chord asks,
 * LEARN and the same chord again take it; a MIDI message is mapped; a moved MACRO knob is routed to the action).  A `gesture` row (full screen,
 * a clipboard, a file picker) wants a real press: KEY only.  × on a chip unbinds.  The search line filters by word.  MIDI is asked for only on
 * a press (LEARN or CONNECT MIDI); Safari and the iPad have none, and the MIDI column says so.  The map is PREFERENCE `lambdawaves.q0.midi`. */
import { el, label, trig } from './mir/kit.js'; import { createMidi, midiSupport } from './mir/shell/midi.js'; import { jsonStore } from './mir/core/prefs.js';
import { displayChord } from './mir/shell/keys.js'; import { t } from './mir/core/i18n.js';
import { ORDER } from './key-table.js';

export const MIDI_KEY = 'lambdawaves.q0.midi';
/** targetOf(id) — the modulation target an action answers as: `action.` + its id, each segment lower-case alphanumeric (the registry's grammar) */
export const targetOf = (id) => 'action.' + id.toLowerCase().split('.').map((s) => s.replace(/[^a-z0-9]/g, '').replace(/^(\d)/, 'n$1') || 'x').join('.');
const midiText = (k) => { const [kind, ch, n] = k.split(':'); return (kind === 'cc' ? 'CC ' : 'NOTE ') + ch + '·' + n; };

export function createMapping(app, { kt }) {
  const A = app.sh.ACTIONS, T = kt.table, support = midiSupport();
  const midi = createMidi({ storage: jsonStore(MIDI_KEY), run: (id) => { if (!A.get(id) || A.get(id).gesture) return; A.run(id); }, up: (id) => A.up(id), onState: () => paint() });
  const root = el('div', 'mp'), head = el('div', 'mp-head', root);
  const find = el('input', 'mp-find', head); find.type = 'search'; find.placeholder = t('Find an action…'); find.setAttribute('aria-label', t('Find an action'));
  const conn = trig({ label: 'CONNECT MIDI', cls: 'mp-connect', title: 'ask the browser for MIDI (only on this press) and list the inputs', onFire: () => midi.start() });
  head.appendChild(conn.root); if (!support.ok) conn.root.hidden = true;
  const status = el('div', 'mp-status', root); status.setAttribute('role', 'status');
  const cols = el('div', 'mp-row mp-cols', root);
  for (const w of ['ACTION', 'KEY', support.ok ? 'MIDI' : 'MIDI · ' + t(support.why), 'MOD', '']) label(el('span', 'mp-col', cols), w);
  const list = el('div', 'mp-list', root); list.setAttribute('role', 'list');
  let learning = null, pending = null;
  const say = (m, tone = 'info') => { status.dataset.tone = tone; status.textContent = m; };
  const routes = (id) => { const h = app.state.modHost; return h ? h.model.routesOfTarget(targetOf(id)).filter((r) => !r.dormant) : []; };
  const surfaced = () => A.list().filter((r) => r.surface);

  function chip(row, kind, text, unbind) {
    const c = el('span', 'mp-chip mp-chip-' + kind + (text ? '' : ' mp-none'), row); c.translate = false;
    el('span', 'mp-chip-t', c, text || '—');
    if (text && unbind) { const x = el('button', 'mp-x', c, '×'); x.type = 'button'; x.setAttribute('aria-label', t('unbind')); x.addEventListener('click', () => { unbind(); paint(); }); }
  }
  function paint() {
    const q = find.value.trim().toLowerCase(), P = T.platform; list.textContent = '';
    conn.setLabel(midi.state === 'live' ? 'MIDI · ' + (midi.devices().map((d) => d.name).join(', ') || t('no inputs')) : 'CONNECT MIDI');
    const rows = surfaced().filter((r) => !q || [r.label, r.short, r.group, r.id].some((s) => s && String(s).toLowerCase().includes(q)));
    rows.sort((a, b) => ((ORDER.indexOf(a.group) + 1 || 99) - (ORDER.indexOf(b.group) + 1 || 99)));
    let g = null;
    for (const r of rows) {
      if (r.group !== g) { g = r.group; label(el('div', 'mp-group', list), g); }
      const row = el('div', 'mp-row', list); row.dataset.id = r.id; row.setAttribute('role', 'listitem'); row.classList.toggle('mp-learning', learning === r.id);
      label(el('span', 'mp-name', row), r.short || r.label).title = r.label;
      const k = T.chords(r.id)[0]; chip(row, 'key', k ? displayChord(k, P) : '', () => T.unbind(r.id));
      if (r.gesture) { el('span', 'mp-chip mp-off', row, t('KEY only')); el('span', 'mp-chip mp-off', row, '·'); }
      else { const m = midi.keyOf(r.id); chip(row, 'midi', m ? midiText(m) : '', m && (() => midi.remove(m)));
        const rs = r.kind === 'hold' ? null : routes(r.id); if (rs) chip(row, 'mod', rs.length ? t('ROUTED') + (rs.length > 1 ? ' ×' + rs.length : '') : '', () => { for (const x of routes(r.id)) app.sh.LW.mod.unroute(x.id); });
        else el('span', 'mp-chip mp-off', row, '·'); }
      const b = trig({ label: learning === r.id ? 'LISTENING…' : 'LEARN', cls: 'mp-learn', title: 'the next key, MIDI message or moved macro knob is this action’s', onFire: () => (learning === r.id ? stop() : learn(r.id)) });
      b.on = learning === r.id; row.appendChild(b.root);
    }
    if (!rows.length) label(el('div', 'mp-empty', list), 'Nothing matches');
  }

  /* LEARN: the three roads race; the first to answer wins and the others stand down */
  let poll = 0;
  function stop(msg) { learning = null; cancelAnimationFrame(poll); if (T.recording()) T.stopRecording(); midi.cancelLearn(); if (msg) say(msg); paint(); }
  async function learn(id) {
    if (learning) stop(); learning = id; paint();
    const r = A.get(id), name = r.short || r.label, gesture = !!r.gesture;
    say(t(gesture ? 'Press a key for “{a}” (Esc cancels)' : 'Press a key, a MIDI note or knob, or move a macro knob for “{a}” (Esc cancels)', { a: name }));
    /* MOD: the first macro knob that moves is routed to the action's target */
    const host = app.state.modHost, macros = () => (host ? host.model.macroList().filter((m) => m.kind !== 'trigger') : []), was = new Map(macros().map((m) => [m.id, m.value]));
    if (!gesture && r.kind !== 'hold' && host) { const look = () => { if (learning !== id) return; const m = macros().find((x) => was.has(x.id) && Math.abs(x.value - was.get(x.id)) > 0.02);
      if (m) { app.sh.LW.mod.route(m.id, targetOf(id), 0, 1); stop(t('{m} now fires “{a}”', { m: m.name || m.id, a: name })); } else poll = requestAnimationFrame(look); }; poll = requestAnimationFrame(look); }
    /* MIDI: only on this press; the first note-on or CC */
    if (!gesture && support.ok) midi.start().then((ok) => { if (!ok || learning !== id) return; midi.learn().then((m) => { if (!m || learning !== id) return;
      midi.set(m.key, { id, mode: r.kind === 'hold' ? 'hold' : r.kind === 'toggle' ? 'toggle' : 'trigger' }); stop(t('{m} now runs “{a}”', { m: midiText(m.key), a: name })); }); });
    /* KEY: the table's recorder, λWAVES' binding law (key-table.js check), the steal on the second time */
    const c = await T.record(); if (learning !== id) return;
    if (!c) return stop(t('Cancelled: “{a}” keeps its inputs', { a: name }));
    const why = kt.window.check(id, c); if (why) return stop(t(why));
    const others = T.holders(c).filter((x) => x !== id && !(T.get(x) && T.get(x).when));
    if (others.length && pending !== id + c) { pending = id + c; return stop(t('{k} runs “{o}”: LEARN and press it again to take it', { k: displayChord(c, T.platform), o: (A.get(others[0]) || {}).label || others[0] })); }
    pending = null; T.bind(id, c); stop(t('“{a}” is now bound to {k}', { a: name, k: displayChord(c, T.platform) }));
  }
  find.addEventListener('input', () => paint());
  T.onChange(() => { if (root.isConnected) paint(); });
  /** install() — once the facade exists: every surface row (not a held one, not a gesture) as an `action.<id>` target, trigger or toggle */
  function install() {
    const M = app.sh.LW && app.sh.LW.mod; if (!M) return 0; let n = 0;
    const reg = (rows) => M.batch(() => { for (const r of rows) if (r.surface && !r.gesture && r.kind !== 'hold') { const toggle = r.kind === 'toggle' && r.get;
      M.register(targetOf(r.id), { label: (r.short || r.label).toUpperCase(), group: 'action', map: toggle ? 'toggle' : 'trigger', get: () => (toggle ? +!!r.get() : 0), set: () => {},
        fire: (on) => (toggle ? A.fire(r.id, on) : A.run(r.id)) }); n++; } });
    reg(A.list()); A.onAdd(reg); return n;
  }
  return { root, midi, paint, install, learn, stop, targetOf };
}
