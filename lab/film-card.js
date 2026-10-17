/* film-card.js — THE RENDER CARD (0.5.0 C7b, research/release-0.5.0/C7B-DESIGN.md §2): MIR's createRenderCard over createFilm's host
 * recorder, so the film's UI is the kit's — IMAGE (CAPTURE IMAGE · DOWNLOAD IMAGE: two taps, the save inside a live tap, R8), the
 * DETERMINISTIC RENDER rows (STILL · TIMELINE · ACTIVE · TIMELINE · SELECTION, MP4 · PNG FRAMES, the size, FPS, LENGTH, START AT,
 * MODULATION, TIMELINE, the estimate, RENDER, PREVIEW, CANCEL, SAVE · DISCARD RENDER and the stored renders: RECOVER · RESUME ·
 * DISCARD), CHECK — and λWAVES' one section, PERIOD: THE LOOP PLAN, PLAN and PLACE ONE PERIOD (R3).  ONE PERIOD is a `lw-period` clip,
 * registered here: it marks a span and drives nothing (as the kit's `pattern` fires); the film's frame reads its t0 and T
 * (render-exact.js THE TIME LAW, rule 1).  Every file leaves through capture.js handOver under λWAVES' name (R10).
 * ITERATION 004 (the MIR 1.5 gaps): FILES — SAVE AS ZIP… · OPEN ZIP…, FOLDERS' project zip (`files`, its api.zip), which no button reached —
 * and the SUBJECT (BASINS' renderSubject): THIS VIEW, or the project FOLDERS' ⓘ pointed at (`gallery`, projects.js `inspected`), as the
 * system, the observable and, for a saved one, its folder, date and size; COPY copies them, JSON downloads them.
 *   createFilmCard({ film, capture, editor, open, armed, digest, key, files?, gallery?, here? }) → { card, view, recorder, plan, place } */
import { createRenderCard } from './mir/render/panel.js';
import { fmtBytes } from './mir/render/plan.js';
import { VIEW_NAMES } from './field.js';
import { registerClipKind } from './mir/timeline/kinds.js';
import { el, label, trig, svgNode } from './mir/kit.js';
import { handOver } from './capture.js';

const PREFIX = 'lambdawaves.q0.render.', SCALES = ['1', '2', '3', '4'];
/* what a picture is OF, read the same way off the live lab (`here()`) and off a saved project's data */
const atOf = (d) => { const P = (d && d.presentation) || {}, X = (d && d.experiment) || {}, C = P.instruments && P.instruments.chem;
  return { chem: C && C.on ? C : null, ham: P.hamiltonian && P.hamiltonian.id, preset: X.preset, view: P.mat && P.mat.view, t: X.t }; };
function factsOf(x, e) {
  const vol = x.chem && x.chem.volume;   // iteration 004 V2: a volume's molecule names itself and its rung
  const rows = [['SYSTEM', x.chem ? 'MOLECULE · ' + String(vol ? vol.id + ' · ' + vol.volume : x.chem.preset || '—') : String(x.ham || '—').toUpperCase()], ['VIEW', String((x.chem && x.chem.view) || VIEW_NAMES[x.view] || '—').toUpperCase()]];
  if (x.chem) rows.push(['BASIS', String((vol || x.chem).basis || '—')]); else if (x.preset) rows.push(['PRESET', String(x.preset)]);
  if (e) rows.push(['FOLDER', e.folder || 'ROOT'], ['SAVED', new Date(e.at).toLocaleString()], ['SIZE', fmtBytes(e.bytes)]);
  else rows.push(['t', (+x.t || 0).toFixed(3) + ' a.u.']);
  return rows;
}
function subjectOf(here) {
  const facts = (e) => factsOf(e ? atOf(e.payload && e.payload.parts && e.payload.parts.lambdawaves && e.payload.parts.lambdawaves.data) : here(), e);
  return { facts, text: (e) => (e ? (e.folder ? e.folder + '/' : '') + e.name : 'THIS VIEW') + '\n' + facts(e).map(([k, v]) => k + '\t' + v).join('\n'),
    json: (e) => ({ name: (e ? e.name : 'this-view').replace(/[\\/:*?"<>|]+/g, ' ') + '.facts.json', body: { name: e ? e.name : 'THIS VIEW', ...Object.fromEntries(facts(e)) } }) };
}
const ls = { get: (k) => { try { return localStorage.getItem(PREFIX + k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(PREFIX + k, v); } catch (_) { /* refused */ } } };
registerClipKind('lw-period', { drives: false, value: () => null, validate: (c) => Number.isFinite(c.t0) && c.T > 0 && c.seconds > 0,
  duration: (c, bpm) => c.seconds * bpm / 60, paint: (svg, c, clip, { geometry, height }) => svgNode('rect', { class: 'tl-pattern-group', x: 0, y: 0, width: geometry.width, height }, svg) });

export function createFilmCard(o) {
  /* R7 · the first run's film is C7's — 6 s, the canvas' own size, the modulation ON when MOD is armed — seeded once (brief B1) */
  if (ls.get('duration') === null) { ls.set('duration', '6'); ls.set('size', 'current'); ls.set('modulation', o.armed() ? 'on' : 'off'); }
  let scale = SCALES.includes(ls.get('scale')) ? ls.get('scale') : '2', made = null, note = null;
  const film = o.film, cv = film.canvas, say = (m, warn) => { if (made) made.card.setStatus(m, warn ? 'warn' : 'live'); };
  const recorder = film.recorder({ editor: o.editor, signature: o.digest, selfTestStages: [{ name: 'λWAVES frame determinism', run: () => film.verify({ frames: 6, width: 160 }).then((v) => { if (!v.ok) throw new Error(v.message || v.error); return v.message; }) }] });
  made = createRenderCard({ id: 'render', recorder, loadingMark: false, prefix: PREFIX, defaults: { fps: 30, motion: 'still' }, say,
    ...(o.files ? { files: o.files } : {}), ...(o.gallery && o.here ? { gallery: o.gallery, subject: subjectOf(o.here) } : {}),
    save: (blob, name) => handOver(blob, film.nameFor(name)),
    picture: { formats: SCALES.map((s) => ({ id: s, label: '×' + s })), format: () => scale, setFormat: (v) => { scale = v; ls.set('scale', v); },
      size: () => ({ w: Math.round(cv.width * scale), h: Math.round(cv.height * scale) }), save: (held) => handOver(held.blob, held.name), stale: (held) => held.key !== o.key(),
      async capture() { const r = await o.capture.picture({ scale: +scale }); if (!r || r.ok === false) throw new Error(String((r && r.error) || 'no picture')); r.key = o.key(); return r; } },
    sections(wrap) {
      const s = el('section', 'sr-section sr-period', wrap); label(el('div', 'sv-title sr-title', s), 'PERIOD');
      note = el('div', 'sv-note sr-period-plan', s, 'THE LOOP PLAN · press PLAN, or PLACE ONE PERIOD to put one recurrence on the TIMELINE and render it');
      s.append(trig({ label: 'PLAN', cls: 'sv-act sv-wide', onFire: () => plan() }).root, trig({ label: 'PLACE ONE PERIOD', cls: 'sv-act sv-wide', onFire: () => place() }).root);
    } });
  const { card, view } = made, C = view.controls, set = (f, v) => { f.value = v; f.dispatchEvent(new Event('change')); };
  /** THE LOOP PLAN at the card's FPS and LENGTH (capture.js planLoop: a refused or STATIONARY plan says its sentence) */
  function plan() {
    let P; try { P = o.capture.planLoop({ fps: Number(C.recFps.value), seconds: Number(C.recDuration.value) }); } catch (e) { P = { ok: false, label: 'ERROR', message: String((e && e.message) || e) }; }
    note.textContent = P.label + ' · ' + P.message + (P.usedPeriod ? ' · period used: ' + P.usedPeriod + ' (' + P.laps + ' lap' + (P.laps === 1 ? '' : 's') + ' of T_ρ)' : '');
    return P;
  }
  /** PLACE ONE PERIOD: the plan as a `lw-period` clip at beat 0, the ACTIVE range over it, and the card on TIMELINE · ACTIVE with the
   *  modulation OFF — a loop closes only if nothing else moves; RENDER then films ONE PERIOD bit for bit */
  function place() {
    const P = plan(), ed = o.editor();
    if (!ed || !P.ok || P.kind === 'stationary') { say(!ed ? 'PLACE ONE PERIOD needs the TIMELINE' : P.message, true); return null; }
    const id = ed.addClip('lw-period', { t0: P.schedule.t0, T: P.T, seconds: P.N / P.fps, mode: 'loop', plan: P.kind, label: P.label }, { start: 0, targetId: 'lw.period', name: 'ONE PERIOD · ' + P.label });
    const c = id && ed.model.state().clips.find((x) => x.id === id);
    if (!c) { say('PLACE ONE PERIOD: no lane is free at beat 0', true); return null; }
    ed.setActiveRange({ start: c.start, end: c.start + c.duration }); set(C.motion, 'timeline-active'); set(C.modSelect, 'off'); if (o.open) o.open();
    return id;
  }
  return { card, view, recorder, plan, place };
}
