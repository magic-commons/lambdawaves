/* MIR · shell/midi.js — THE MIDI DOOR (1.5.6-alpha.2, from λWAVES 021 I2): a controller's notes and knobs run an app's actions, and a
 * continuous knob is a value 0…1 the app may offer as a modulation source.  The capture half only, in audio-capture.js' pattern: what
 * a press means is the app's action table; what a knob drives is the app's modulation.
 *
 * THE PRIVACY LAW (audio-capture.js' first): nothing asks for MIDI until a press — `start()` is the only caller of
 * navigator.requestMIDIAccess, and an app calls it from a hand's act (LEARN, a MIDI chip).  Chrome, Edge and Firefox have Web MIDI;
 * Safari and the iPad have none (`support()` says so, and a macro pad that sends keys is that browser's road).
 *
 * THE MAP is a PREFERENCE in the kit's jsonStore shape: { v: 1, map: { 'note:<ch>:<n>' | 'cc:<ch>:<n>': { id, mode } } }, mode
 *   'trigger'  note-on, or a CC rising across 64, runs run(id)
 *   'toggle'   the same press runs run(id) (the app's toggle flips)
 *   'hold'     note-on (CC ≥ 64) runs run(id); note-off (CC < 64) runs up(id)
 * Channels are 1–16 as a person reads them.  Every CC message is also handed to source(key, value 0…1) when given.
 *
 * createMidi({ storage, run, up, source, onState }) → { support(), start(), stop(), state, devices(), learn(), cancelLearn(), map(),
 *   set(key, { id, mode }), remove(key), keyOf(id), value(key), sources(), handle(bytes), destroy() }
 *   storage   { get() → record | null, set(record), remove?() } (core/prefs.js jsonStore)
 *   learn()   → Promise<{ key, kind: 'note' | 'cc', ch, n, value } | null>: the next message (a note-on or any CC); cancelLearn() → null
 *   sources() → [{ id: 'midi:cc:<ch>:<n>', kind: 'midi', key, value() }] — one per CC the map or the hand has met, 0…1 */

/** support() → { ok, why }: Web MIDI here or not, decided without asking */
export function midiSupport() {
  if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') return { ok: false, why: 'no MIDI on this browser' };
  if (typeof window !== 'undefined' && window.isSecureContext === false) return { ok: false, why: 'MIDI needs a secure page (HTTPS or localhost)' };
  return { ok: true, why: '' };
}
export const MIDI_MODES = Object.freeze(['trigger', 'toggle', 'hold']);

export function createMidi({ storage = null, run = () => {}, up = () => {}, source = null, onState = null } = {}) {
  let access = null, state = 'idle', learning = null, entries = read();
  const values = new Map(), held = new Set();
  function read() {
    let r = null; try { r = storage && storage.get ? storage.get() : null; } catch (_) { r = null; }
    const out = {}; if (r && r.v === 1 && r.map && typeof r.map === 'object')
      for (const [k, e] of Object.entries(r.map)) if (/^(note|cc):\d{1,2}:\d{1,3}$/.test(k) && e && typeof e.id === 'string' && MIDI_MODES.includes(e.mode)) out[k] = { id: e.id, mode: e.mode };
    return out;
  }
  const save = () => { try { if (!storage) return; if (Object.keys(entries).length) storage.set({ v: 1, map: entries }); else if (storage.remove) storage.remove(); else storage.set(null); } catch (_) { /* a full store costs the save */ } };
  const say = (s) => { state = s; if (onState) { try { onState(s); } catch (_) { /* a face's error is its own */ } } };

  /** handle(bytes) — one MIDI message (exported so a test, or an app's own transport, can feed it) */
  function handle(d) {
    if (!d || d.length < 2) return;
    const type = d[0] & 0xf0, ch = (d[0] & 0x0f) + 1, n = d[1], v = d.length > 2 ? d[2] : 0;
    if (type !== 0x90 && type !== 0x80 && type !== 0xb0) return;
    const kind = type === 0xb0 ? 'cc' : 'note', key = kind + ':' + ch + ':' + n, on = type === 0x90 && v > 0;
    if (kind === 'cc') { const prev = values.has(key) ? values.get(key) : 0; values.set(key, v / 127); if (source) { try { source(key, v / 127); } catch (_) { /* the app's */ } }
      if (learning) return settle({ key, kind, ch, n, value: v / 127 });
      const e = entries[key]; if (!e) return;
      if (e.mode === 'hold') { if (v >= 64 && prev < 64 / 127) run(e.id); else if (v < 64 && prev >= 64 / 127) up(e.id); } else if (v >= 64 && prev < 64 / 127) run(e.id);
      return; }
    if (learning) { if (on) settle({ key, kind, ch, n, value: v / 127 }); return; }
    const e = entries[key]; if (!e) return;
    if (on) { held.add(key); run(e.id); } else if (held.delete(key) && e.mode === 'hold') up(e.id);
  }
  const settle = (msg) => { const l = learning; learning = null; l(msg); };
  const listen = () => { if (!access) return; for (const input of access.inputs.values()) input.onmidimessage = (ev) => handle(ev.data); };

  const api = {
    support: midiSupport,
    get state() { return state; },
    /** start() — ask for MIDI (a hand's act only); → true when live */
    async start() {
      if (access) return true;
      if (!midiSupport().ok) { say('unavailable'); return false; }
      say('asking');
      try { access = await navigator.requestMIDIAccess({ sysex: false }); } catch (_) { say('denied'); return false; }
      access.onstatechange = () => { listen(); say('live'); }; listen(); say('live'); return true;
    },
    stop() { if (access) { for (const input of access.inputs.values()) input.onmidimessage = null; access.onstatechange = null; } access = null; say('idle'); },
    devices: () => (access ? [...access.inputs.values()].map((i) => ({ id: i.id, name: i.name || 'MIDI input', manufacturer: i.manufacturer || '', state: i.state })) : []),
    learn() { if (learning) settle(null); return new Promise((resolve) => { learning = resolve; }); },
    cancelLearn() { if (learning) { settle(null); return true; } return false; },
    learning: () => !!learning,
    map: () => ({ ...entries }),
    set(key, { id, mode = 'trigger' } = {}) { if (!/^(note|cc):\d{1,2}:\d{1,3}$/.test(key) || !id || !MIDI_MODES.includes(mode)) return false;
      for (const [k, e] of Object.entries(entries)) if (e.id === id) delete entries[k];   // one message per action: a learn replaces the old one
      entries[key] = { id, mode }; save(); return true; },
    remove(key) { if (!(key in entries)) return false; delete entries[key]; save(); return true; },
    keyOf: (id) => Object.keys(entries).find((k) => entries[k].id === id) || null,
    value: (key) => (values.has(key) ? values.get(key) : 0),
    sources: () => [...new Set([...values.keys(), ...Object.keys(entries).filter((k) => k.startsWith('cc:'))])].map((key) => ({ id: 'midi:' + key, kind: 'midi', key, value: () => api.value(key) })),
    /** reload() — read the stored map again (an app's FORGET, or another tab's save) */
    reload() { entries = read(); },
    handle,
    destroy() { api.cancelLearn(); api.stop(); },
  };
  return api;
}
