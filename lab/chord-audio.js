/* lab/chord-audio.js — THE CHORD (0.6.4 S2, PLAN §F-7 ★): the register sounds.  A sine bank through one master gain at −18 dBFS: LEVELS voices each
 * populated shell n at |E_n|·RATE/2π Hz (gain its population), BEATS each populated pair m < n at |E_m − E_n|·RATE/2π (gain Σ|c_a||c_b|), both FOLDED
 * into [220, 440) Hz by ×2^k, equal notes merged, gains summing to 1.  The context is made on the first hand press of SOUND (the autoplay law) and runs
 * only while THE play runs, SOUND is on, the page is shown, no film records and the reader has not asked for reduced motion.  retune() is keyed on
 * the register's version, RATE and the mode, and touches the bank only when the notes moved (30 ms ramps); it is never a per-frame rebuild. */
import { BASIS, energy } from './hydrogen.js';
const fold = (f) => { const k = Math.ceil(Math.log2(220 / f)); return { f: f * 2 ** k, k }; };
export function createChord({ reg, clock, motion, onPlay }) {
  let ctx = null, master = null, on = false, mode = 'levels', held = false, was = false, key = '', sig = '', err = '';
  const voices = [], table = [], live = () => on && clock.playing && !held && !document.hidden && !motion.reduced;
  function gate() {
    was = live(); if (!ctx) return; master.gain.setTargetAtTime(was ? 0.126 : 0, ctx.currentTime, 0.01);
    if (was && ctx.state !== 'running') ctx.resume(); else if (!was) setTimeout(() => { if (ctx && !live() && ctx.state === 'running') ctx.suspend(); }, 60);
  }
  function notes() {
    const w = new Map(), amp = new Map(), out = new Map();
    for (const a of reg.populated()) { const n = BASIS[a].n, p = reg.re0[a] ** 2 + reg.im0[a] ** 2; w.set(n, (w.get(n) || 0) + p); amp.set(n, (amp.get(n) || 0) + Math.sqrt(p)); }
    const add = (dE, g) => { const v = fold(Math.abs(dE) * clock.rate / (2 * Math.PI)), id = v.f.toFixed(2); out.set(id, { ...v, ...out.get(id), g: g + (out.has(id) ? out.get(id).g : 0) }); };
    for (const m of w.keys()) if (mode === 'levels') add(energy(m), w.get(m)); else for (const n of w.keys()) if (m < n) add(energy(m) - energy(n), amp.get(m) * amp.get(n));
    const V = [...out.values()].sort((a, b) => a.f - b.f), tot = V.reduce((s, v) => s + v.g, 0) || 1; for (const v of V) v.g /= tot; return V;
  }
  /** on CHANGE (the register's version, RATE, the mode): true when the notes moved; a call with nothing new touches nothing */
  function retune() {
    if (live() !== was) gate();
    const k0 = mode + reg.version + ':' + clock.rate + !!ctx; if (k0 === key) return false; key = k0;
    const V = notes(), s = V.map((v) => v.f.toFixed(2) + '*' + v.g.toFixed(3)).join(); table.splice(0, table.length, ...V); if (s === sig) return false; sig = s;
    if (!ctx) return true; const t = ctx.currentTime;
    while (voices.length > V.length) { const x = voices.pop(); x.g.gain.setTargetAtTime(0, t, 0.01); x.o.stop(t + 0.1); }
    V.forEach((v, i) => { let x = voices[i]; if (!x) { x = voices[i] = { o: ctx.createOscillator(), g: ctx.createGain() }; x.g.gain.value = 0; x.o.frequency.value = v.f; x.o.connect(x.g).connect(master); x.o.start(); }
      x.o.frequency.setTargetAtTime(v.f, t, 0.01); x.g.gain.setTargetAtTime(v.g, t, 0.01); });
    return true;
  }
  function set(o) {
    if (o.mode) mode = o.mode;
    if (o.on !== undefined) on = !!o.on;
    if (on && !ctx && !err) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); sig = ''; } catch (e) { err = 'no audio device'; ctx = null; }
    retune(); gate();
  }
  document.addEventListener('visibilitychange', gate); if (onPlay) onPlay(gate);
  return { set, retune, suspend() { held = true; gate(); }, resume() { held = false; gate(); }, dispose() { if (ctx) ctx.close(); ctx = null; voices.length = 0; key = sig = ''; },
    get playing() { return !!ctx && ctx.state === 'running' && live(); }, get voices() { return table.map((v) => ({ ...v })); },
    get caption() { return err || (motion.reduced ? 'muted: reduced motion · ' : '') + (table.length ? `folded ×2^k · ${table.length} note${table.length > 1 ? 's' : ''} · ${table.map((v) => v.f.toFixed(1)).join(' · ')} Hz` : 'no populated level'); } };
}
