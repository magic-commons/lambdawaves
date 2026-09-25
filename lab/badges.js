/* badges.js — THE BADGES (§41) over the stage: what is exact (STATE · EVOLUTION · SHADOW), what is numerical (the FIELD grid),
 * what is masked or truncated, the static field in force, the offer of a new build — and the canvas's own sentence
 * (wave 62), which says what the INSTRUMENT is showing and never describes the ray-marched picture.  A seam out of
 * rack.js boot() (optimization 2026-09-24 · N7 seam 6, AUDIT-E §6); eleven closure edges, handed in: `dom` (the
 * badge row, the model sheet, the canvas), `accept` (the fifth badge's press: LW.sw's accept), `field`, `reg`, `mat`,
 * `clock`, `domain`, `quality`, `getSpace` (a boot `let`), `stateReaders` and `ui` (H IN FORCE is written here).
 * createBadges() runs where the block stood; update() is the meters' 10 Hz tick's, exactly as before. */
import { el } from './mir/kit.js';
import { getHamiltonian } from './hamiltonian.js';
import { BASIS } from './hydrogen.js';
import { VIEW_NAMES, STYLE_NAMES } from './field.js';

export function createBadges({ dom, accept, field, reg, mat, clock, domain, quality, getSpace, stateReaders, ui }) {
  const B = dom.badges; B.innerHTML = '';
  const sheetToggle = () => { dom.sheet.hidden = !dom.sheet.hidden; for (const b of B.querySelectorAll('.badge[aria-controls]')) b.setAttribute('aria-expanded', String(!dom.sheet.hidden)); };
  const mk = (cls, text, onClick) => { const b = el('button', 'badge ' + cls, B); b.type = 'button'; el('i', '', b); el('span', '', b, text);
    if (!onClick) { b.setAttribute('aria-controls', 'sheet'); b.setAttribute('aria-expanded', String(!dom.sheet.hidden)); }
    b.addEventListener('click', onClick || sheetToggle); return b; };
  const b1 = mk('exact', 'STATE · EVOLUTION · SHADOW');
  const b2 = mk('numerical', 'FIELD');
  const b3 = mk('warn', ''); b3.hidden = true;
  const b4 = mk('warn', ''); b4.hidden = true;
  /* WAVE 56: the fifth badge is the only one that is not about ψ — it is the offer of a NEW BUILD, and it
     is the only badge whose press is not the sheet.  It is hidden until the worker says a build is waiting
     (lab/sw.js §3), and pressing it is the ONE thing in this app that can end a session's build. */
  const b5 = mk('warn', '', () => accept()); b5.hidden = true;
  let last = '', lastF = '', lastSay = '';
  /* ── WAVE 62 · THE CANVAS SAYS WHAT IS DRAWN, AND SAYS IT RARELY ───────────────────────────────
   * Everything the sentence needs is already assembled here, on the meters' 10 Hz tick, beside four
   * writes that are already change-guarded.  A description that updates ten times a second is
   * unusable, and the answer is NOT a longer throttle: it is that THE SENTENCE CONTAINS NOTHING
   * THAT CHANGES ON ITS OWN.  That is why the clock appears only when the transport is PAUSED —
   * while playing, `t` moves every frame and any string carrying it would defeat the guard below and
   * rewrite the attribute at 10 Hz for the whole session.  With the clock out of it the string moves
   * only when the INSTRUMENT moves: the observable, the style, the grid, the half-width, the mode
   * count, the norm, the operator, the field, position or momentum — a handful of times a session,
   * every one of them a user's own act.  (Field-free evolution moves phases, not amplitudes, so the
   * mode count and the norm fraction are genuinely still while it runs.)
   * WHAT IT DOES NOT DO is describe the ray-marched volume.  A density isosurface, a phase hue field
   * and a nodal reconstruction are not text at any useful fidelity; describing the picture would be
   * fabrication.  The honest claim, and the one this makes true: THE INSTRUMENT'S STATE IS FULLY
   * READABLE; THE RENDERING IS NOT.
   * And the mechanism cannot become a live region by accident: an `aria-label` on a non-live,
   * tabIndex = -1 node is read on demand and never announced spontaneously. */
  const VIEW_SAY = ['ρ = |ψ|² — density', 'arg ψ — phase', 'Re ψ', 'Im ψ', 'Δρ — difference', 'Re + Im superposed'];
  function canvasSentence(rs) {
    if (!field.ok) return 'no field — WebGPU unavailable';
    const H = getHamiltonian(), who = stateReaders().populated;
    const names = who.slice(0, 3).map((a) => H.labelOf(BASIS[a])).join(' + ') + (who.length > 3 ? ' + ' + (who.length - 3) + ' more' : '');
    const half = Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2);
    /* `quality.res`, NOT `field.resolution`: the governor drops the live grid under load and restores
       it on pause, entirely on its own, and a sentence carrying that number rewrote itself twice in
       three seconds of playback with nobody touching anything.  The chosen grid is the user's; the
       governed one is already on the NUMERICAL badge and in the PERFORMANCE readouts, where a number
       that moves by itself belongs. */
    const where = getSpace() === 'p' ? `momentum space, ${quality.res}³ grid` : `${quality.res}³ grid over ±${half} ${H.lengthUnit}`;
    const modes = `${rs.rendered} of ${rs.populated} modes, ${(rs.coveredFraction * 100).toFixed(0)} % of the norm` + (rs.masked ? ` (${rs.masked} muted)` : '');
    const law = reg.field.Fz !== 0 ? `${H.short} + F z, F = ${reg.field.Fz.toExponential(1)}, within each shell`
      : reg.field.Bz !== 0 ? `${H.short} + (B/2) L_z, B = ${reg.field.Bz.toFixed(4)}, diagonal` : H.label;
    const when = clock.playing ? 'playing' : `paused at t = ${clock.t.toFixed(2)} a.u.`;
    return `${names ? names + '; ' : ''}${VIEW_SAY[mat.view] || VIEW_NAMES[mat.view]}, drawn as ${STYLE_NAMES[mat.style]}; ${where}; ${modes}; ${law}; ${when}`;
  }
  function update() {
    const f = reg.field.Fz !== 0 ? `STARK F = ${reg.field.Fz.toExponential(1)} · shell model · use F ≪ ${reg.fieldValidUpTo().toExponential(1)}`
      : reg.field.Bz !== 0 ? `ZEEMAN B = ${reg.field.Bz.toFixed(4)}` : '';
    if (f !== lastF) { lastF = f; b4.hidden = !f; b4.lastChild.textContent = f; b4.className = 'badge ' + (reg.field.Fz !== 0 ? 'warn' : 'exact'); }
    b1.lastChild.textContent = reg.field.Fz !== 0 ? 'STATE · SHADOW · SHELL EVOLUTION' : 'STATE · EVOLUTION · SHADOW';
    if (ui.fieldRo) {
      ui.fieldRo.set(reg.field.Fz !== 0 ? 'H₀ + F z' : reg.field.Bz !== 0 ? 'H₀ + (B/2)L_z' : 'H₀ (bare Coulomb)', reg.field.Fz !== 0 ? 'warn' : reg.field.Bz !== 0 ? 'live' : '');
      ui.fieldRo.setSub(reg.field.Fz !== 0 ? `within-shell model · use F ≪ ${reg.fieldValidUpTo().toExponential(1)}` : reg.field.Bz !== 0 ? 'diagonal in this basis' : 'current Hamiltonian');
    }
    const rs = stateReaders().rendered;
    const t2 = field.ok ? `FIELD ${field.resolution}³ · ±${Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2)} ${getHamiltonian().lengthUnit}${getSpace() === 'p' ? '⁻¹ · MOMENTUM' : ''} · f16` : 'NO FIELD · WebGPU unavailable';
    if (b2.lastChild.textContent !== t2) b2.lastChild.textContent = t2;
    b2.className = 'badge ' + (field.ok ? 'numerical' : 'bad');
    const warn = rs.masked ? `RENDERED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM · ${rs.masked} MUTED` : rs.truncated ? `TRUNCATED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM` : '';
    if (warn !== last) { last = warn; b3.hidden = !warn; b3.lastChild.textContent = warn; }
    const say = canvasSentence(rs);
    if (say !== lastSay) { lastSay = say; dom.canvas.setAttribute('aria-label', say); }   // one string build and one !== per 100 ms, the same shape as the four writes above
  }
  return { update, build: b5, say: () => lastSay };
}
