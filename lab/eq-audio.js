/* lab/eq-audio.js — THE EQUALIZER's AUDIO IN (iteration 002, Josh 2026-10-16: "let modulation window audio in be the source for the beat
 * wave equalizer").  The faders follow the MODULATION window's first AUDIO device — its LOW, MID and HIGH followers (0–1, the device's own floor
 * and ceiling): LOW → n 1–2, MID → n 3–4, HIGH → n 5–7 (the seventh band, iteration 009 N7), louder is more coherent (a creative mapping, not a law) — on 1/32 steps, so a quiet hum
 * re-tables nothing.  `eq.audioTick` is called by rack.js right after the model's feed, so it reads this frame's numbers and opens nothing:
 * the microphone is the device's MIC press (MIR's privacy law).  Not saved: a hand press each session. */
import { el, sw, readout } from './mir/kit.js';
const BAND = ['low', 'low', 'mid', 'mid', 'high', 'high', 'high'], span = (b) => `${BAND.indexOf(b) + 1}–${BAND.lastIndexOf(b) + 1}`;   // the words read the table
export function createEqAudio(app, { eq, host, sync }) {
  let on = false, said = '';
  const device = () => { const M = app.state.modHost && app.state.modHost.model; if (!M) return null; const L = M.sourceList(), d = L.find((q) => q.kind === 'audio');
    return d ? { d, outs: Object.fromEntries(L.filter((q) => q.kind === 'audioout' && q.parentId === d.id).map((q) => [q.key, q])) } : null; };
  const ro = readout({ label: 'SOURCE', cls: 'wide', value: 'off' });
  function say(A = device()) { const live = app.state.audioCap && app.state.audioCap.live, t = !on ? 'off' : !A ? 'no AUDIO device' : live ? 'AUDIO · live' : 'AUDIO · press its MIC';
    if (t === said) return; said = t; ro.set(t); ro.setSub(on && !A ? 'add AUDIO in the MODULATION window, then press its MIC' : on ? `low n ${span('low')} · mid n ${span('mid')} · high n ${span('high')}` : ''); }
  const s = sw({ label: 'AUDIO IN', value: false, title: `The faders follow the MODULATION window's first AUDIO device: LOW drives n = ${span('low')}, MID n = ${span('mid')}, HIGH n = ${span('high')} — louder is more coherent (a creative mapping, not a law)`,
    onChange: (v) => { on = v; sync(); say(); } });
  el('div', 'row tight eq-audio', host).append(s.root, ro.root);
  eq.audioTick = () => {
    if (!on) return; const A = device(); say(A); if (!A) return;
    let moved = false;
    for (let i = 0; i < BAND.length; i++) { const o = A.outs[BAND[i]], g = o ? Math.round(Math.max(0, Math.min(1, +o.out || 0)) * 32) / 32 : 1; if (g !== eq.gains[i]) { eq.setGain(i, g); moved = true; } }
    if (moved) sync();
  };
  return { get on() { return on; } };
}
