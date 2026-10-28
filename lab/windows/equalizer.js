/* lab/windows/equalizer.js — THE BEAT EQUALIZER window (`equalizer`), its AUDIO IN (lab/eq-audio.js) and THE CHORD (lab/chord-audio.js)
 * (021 G2, THE HINGE: moved verbatim out of lab/windows/spectrum.js, created right after SPECTRUM, so its device and its rack place are where they were).
 * It returns syncEq for the loop; app.state.eq / app.state.chord / app.state.eqNoNodes are its own. */
import { TIER } from '../tier.js';
import { el, sw, seg, readout, group, fader, stepper } from '../mir/kit.js';
import { createEqualizer, EQ_PRESETS, EQ_SHELLS } from '../equalizer.js'; import { createEqAudio } from '../eq-audio.js'; import { createChord } from '../chord-audio.js';
import { VIEW } from '../field.js';
import { BASIS } from '../hydrogen.js';
import { getHamiltonian, getZ } from '../hamiltonian.js';
import { keepT } from './spectrum.js';
export function createEqualizerCard(app) {
  const { ui, device, reg, hNote, clock, appPlay, sturm, mat, rates } = app, { schedule, MOTION } = app.loop, { rack } = app.host, { field } = app.ctl, { wSpec } = app.w;   // backward
  /* 0.6.0 B2 · THE BEAT EQUALIZER (lab/equalizer.js) under the ladder.  Cell (n, n′) of the 7 × 7 grid (iteration 009 N7: the seventh band) is the pair's beat in the picture,
     |Γ_nn′|·√(w_n w_n′) (w the shell populations), its colour the beat's log third — |ΔE| < 0.0263 Eh magenta, < 0.1130 orange, else yellow
     (the chord's own thirds: a creative choice, not a law).  A gain decoheres its shell from the others, never dims it.  A hydrogen
     position-space feature: anything else stands it down and clears the table.  syncEq() keys on what the table reads: cheap on a frame. */
  /* Iteration 002 (Josh, 2026-10-16): its OWN window, `equalizer` (an ATOMS window: MOLECULES mode hides it; closed until + or WINDOW opens it),
     polished as one MIXER (the DESIGN BOOSTER habit — the house's tokens, nothing new to learn): the grid at the screen's own pixels on the left
     (gapped cells, n along both edges, each shell's own diagonal ringed), each shell's fader on the row of its own n beside it; the colours are
     skin.css tokens (--eq-near · --eq-mid · --eq-far) and the ink is the card's.  AUDIO IN takes the faders from the MODULATION window's first
     AUDIO device (eq.audioTick, called by rack.js right after the model's feed). */
  const wEq = device({ id: 'equalizer', eyebrow: 'EQUALIZER', title: 'beat equalizer', status: '' }); wEq.root.classList.add('closed'); rack.appendChild(wEq.root);
  const eq = app.state.eq = createEqualizer(), gEq = group(wEq.body, ''), eqHead = el('div', 'row tight eq-head', gEq), mix = el('div', 'eq-mix', gEq), eqCv = el('canvas', 'eq-grid', mix), eqG = eqCv.getContext('2d');
  const eqStep = stepper({ aria: 'Equalizer preset', items: EQ_PRESETS.map((p) => ({ id: p.id, label: p.label })), value: eq.preset, cls: 'mol-step', onChange: (id) => { eq.setPreset(id); syncEq(true); hNote(); } });
  ui.eqPick = (id) => { eqStep.set(id); eq.setPreset(id); syncEq(true); hNote(); };   // 0.6.6 G1: the stepper's road for THE VERB TABLE's switch
  const eqRo = readout({ label: 'PURITY', value: '1.000', sub: 'pure' }), rFd = el('div', 'eq-faders', mix);
  const eqFd = Array.from({ length: EQ_SHELLS }, (_, i) => i).map((i) => fader({ label: 'n ' + (i + 1), min: 0, max: 1, value: 1, fmt: (v) => Math.round(v * 100) + ' %', onInput: (v) => { eq.setGain(i, v); syncEq(true); }, onChange: hNote }));
  eqHead.append(eqStep.root, eqRo.root); for (const f of eqFd) rFd.appendChild(f.root);
  /* 017 X1 · AN EFFECT SHOWS ITS WINDOW: × or POWER OFF stands the table down (syncEq's `why`); a reopen re-arms it from the knobs */
  for (const t of ['devclose', 'devopen']) wEq.root.addEventListener(t, () => syncEq(false)); wEq.root.querySelector('.dev-power').addEventListener('click', () => syncEq(false));
  const aud = createEqAudio(app, { eq, host: gEq, sync: () => { eqKey = ''; syncEq(false); } });   // iteration 002: AUDIO IN (lab/eq-audio.js)
  el('div', 'note', gEq).textContent = 'the beats fade, the shells stay';
  /* 0.6.4 S2 · THE CHORD (lab/chord-audio.js): SOUND and LEVELS · BEATS, shown only while SETTINGS › AUDIO is on; not saved (a hand press each session) */
  const chord = app.state.chord = createChord({ reg, clock, motion: MOTION, onPlay: appPlay.onChange }), snd = el('div', null, gEq), sndCap = el('div', 'note', null), paintChord = () => { sndCap.textContent = chord.caption; };
  const sndSw = sw({ label: 'SOUND', value: false, title: 'SOUND · the populated levels as tones', onChange: (v) => { chord.set({ on: v }); paintChord(); } });
  sndSw.root.dataset.keyAction = 'eq.sound';   // 021 I1: the action presses it
  el('div', 'row tight fit', snd).append(sndSw.root, seg({ label: '', value: 'levels', options: [{ id: 'levels', label: 'LEVELS' }, { id: 'beats', label: 'BEATS' }], onChange: (v) => { chord.set({ mode: v }); paintChord(); } }).root); snd.append(sndCap); snd.hidden = true;
  ui.setAudio = (v) => { snd.hidden = !v; if (!v && sndSw.get()) { sndSw.set(false); chord.set({ on: false }); } chord.retune(); paintChord(); };
  let eqKey = '', eqT = null, eqMode = 0;
  function syncEq(hand) {
    if (chord.retune() && !snd.hidden) paintChord();   // S2: keyed on version, RATE, mode — the bank moves only on change
    const H = getHamiltonian(), why = app.state.chem && app.state.chem.on ? 'MOLECULES owns the field' : wEq.root.classList.contains('closed') || wEq.root.classList.contains('off') ? 'its window is closed or off' : sturm.P ? 'STURMIAN is on' : H.id !== 'hydrogen' ? 'the operator is not HYDROGEN' : H.mass ? H.mass + ' (its beats are written at μ = mₑ)' : app.state.space !== 'x' ? 'momentum space is on' : '';
    const key = why + eq.preset + eq.gains.join() + reg.version; if (key === eqKey) return; eqKey = key;
    const P = reg.populated(), pops = reg.re0.map((r, a) => r * r + reg.im0[a] ** 2), w = new Array(EQ_SHELLS).fill(0); for (const a of P) w[BASIS[a].n - 1] += pops[a];
    const t = why ? null : eq.table({ Z: getZ(), rates, populated: P, pops }), G = t && t.gamma, m = G ? t.mode : 0;
    if (t || eqT) { field.setEqualizer(t); schedule(TIER.RECONSTRUCT); } eqT = eq.last = t;
    gEq.classList.toggle('eq-off', !!why); gEq.title = why ? 'hydrogen only: ' + why : ''; eqFd.forEach((f, i) => { f.setDisabled(!!why || aud.on); f.set(eq.gains[i]); });
    eqStep.set(eq.preset); eqRo.set(G ? t.purity.toFixed(3) : '1.000'); eqRo.setSub(t && !G ? t.gate : G && t.repaired ? 'repaired' : ['pure', 'mixture · no phase', 'signed · relative floor 2·10⁻⁴'][m]);
    if (hand && m === 2 && eqMode !== 2) { mat.view = VIEW.real; ui.viewSeg.set('real'); wSpec.setStatus('a signed table: VIEW is Re ψ, its lobes in two colours', 'live'); }
    eqMode = m; const nn = app.state.eqNoNodes = !!(G && m === 1 && t.lambdaMin > 1e-3 * t.lambda[t.lambda.length - 1]);   // E4: a positive-definite mixture has no zeros
    for (const b of [ui.vorOn, ui.pOn && ui.pOn.root]) if (b) { b.disabled = nn; b.classList.toggle('disabled', nn); keepT(b, nn, `the equalized picture has no nodes (λ_min = ${nn ? t.lambdaMin.toPrecision(3) : ''})`); }
    const K = EQ_SHELLS, cell = Array.from({ length: K * K }, (_, i) => (G ? Math.hypot(G[2 * i], G[2 * i + 1]) : 1) * Math.sqrt(w[i / K | 0] * w[i % K])), top = Math.max(...cell) || 1;
    drawGrid(cell, top);
  }
  /** the 7 × 7 grid at device pixels: n along the top and the left, a faint well per cell, the beat's third as its colour at |cell| / max, the diagonal ringed */
  function drawGrid(cell, top) {
    const cs = getComputedStyle(eqCv), css = eqCv.clientWidth || parseFloat(cs.getPropertyValue('--eq-size')), dpr = Math.min(2, devicePixelRatio || 1), px = Math.round(css * dpr);
    if (eqCv.width !== px) eqCv.width = eqCv.height = px;
    const C = ['--eq-near', '--eq-mid', '--eq-far'].map((v) => cs.getPropertyValue(v).trim() || '#888'), pad = 14 * dpr, K = EQ_SHELLS, sz = (px - pad) / K, gap = Math.max(1, 2 * dpr), r = 3 * dpr;
    const box = (x, y, w, h) => { eqG.beginPath(); if (eqG.roundRect) eqG.roundRect(x, y, w, h, r); else eqG.rect(x, y, w, h); };
    eqG.clearRect(0, 0, px, px); eqG.globalAlpha = 1; eqG.fillStyle = eqG.strokeStyle = cs.color; eqG.font = `${9 * dpr}px ${cs.fontFamily}`; eqG.textAlign = 'center'; eqG.textBaseline = 'middle';
    for (let i = 0; i < K; i++) { eqG.globalAlpha = 0.5; eqG.fillText(String(i + 1), pad + (i + 0.5) * sz, pad / 2); eqG.fillText(String(i + 1), pad / 2, pad + (i + 0.5) * sz); }
    cell.forEach((s, i) => { const n = (i / K | 0) + 1, k = i % K + 1, dE = getZ() ** 2 * Math.abs(1 / (n * n) - 1 / (k * k)) / 2, x = pad + (k - 1) * sz + gap / 2, y = pad + (n - 1) * sz + gap / 2, w = sz - gap;
      eqG.globalAlpha = 0.07; eqG.fillStyle = cs.color; box(x, y, w, w); eqG.fill();
      if (s > 0) { eqG.globalAlpha = s / top; eqG.fillStyle = dE < 0.0263 ? C[0] : dE < 0.113 ? C[1] : C[2]; box(x, y, w, w); eqG.fill(); }
      if (n === k) { eqG.globalAlpha = 0.35; eqG.lineWidth = dpr; box(x + dpr / 2, y + dpr / 2, w - dpr, w - dpr); eqG.stroke(); } });
    eqG.globalAlpha = 1;
  }
  return { syncEq };
}
