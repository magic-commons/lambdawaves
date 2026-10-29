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
 *   createFilmCard({ film, capture, editor, open, isOpen, armed, digest, key, files?, gallery?, here? }) → { card, view, recorder, plan, place, preset } */
import { createRenderCard } from './mir/render/panel.js';
import { fmtBytes } from './mir/render/plan.js';
import { VIEW_NAMES } from './field.js';
import { registerClipKind } from './mir/timeline/kinds.js';
import { el, label, trig, svgNode, sw } from './mir/kit.js';
import { handOver } from './capture.js';
import { notice } from './mir/shell/notice.js';
import { fold } from './fold.js';

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
/* the placed ONE PERIOD (an unmuted `lw-period` clip), if any */
const periodOf = (ed) => { const d = ed && ed.model && ed.model.state(); return d ? d.clips.find((c) => !c.mute && (d.curves.find((x) => x.id === c.curveId) || {}).kind === 'lw-period') || null : null; };
registerClipKind('lw-period', { drives: false, value: () => null, validate: (c) => Number.isFinite(c.t0) && c.T > 0 && c.seconds > 0,
  duration: (c, bpm) => c.seconds * bpm / 60, paint: (svg, c, clip, { geometry, height }) => svgNode('rect', { class: 'tl-pattern-group', x: 0, y: 0, width: geometry.width, height }, svg) });

/* 025 C4 · THE BOUNCE SAID: "RENDERED 300 frames · 10.0 s · 1920 × 1080 · 30 fps · Opus 48 k" — read back from the FILE (render-exact.js
   fileFacts: the avc1 size, the video stts fps, its sample count and seconds, its audio trak's entry), the kit's result only where the file holds
   no such word (PNG frames' fps, the audio's rate); never the card's options */
function bounceLine(f, res, preview) {
  const fps = (f && f.fps) || res.fps, n = f && f.frames != null ? f.frames : res.frames, s = f && f.durationS != null ? f.durationS : n / fps;
  const au = res.audio ? (res.format === 'png' ? 'WAV' : f && f.audioCodec ? { mp4a: 'AAC', Opus: 'Opus' }[f.audioCodec] || f.audioCodec : res.audio.label) + ' ' + res.audio.sampleRate / 1000 + ' k' : 'silent';
  return (preview ? 'PREVIEW ' : 'RENDERED ') + n + ' frames · ' + s.toFixed(1) + ' s · ' + (f && f.w ? f.w + ' × ' + f.h : res.width + ' × ' + res.height) + ' · ' + +fps.toFixed(3) + ' fps · ' + au;
}

export function createFilmCard(o) {
  /* R7 · the first run's film is C7's — 6 s, the canvas' own size, the modulation ON when MOD is armed — seeded once (brief B1) */
  if (ls.get('duration') === null) { ls.set('duration', '6'); ls.set('size', 'current'); ls.set('modulation', o.armed() ? 'on' : 'off'); }
  let scale = SCALES.includes(ls.get('scale')) ? ls.get('scale') : '2', made = null, note = null;
  /* 025 C4 · `landed`: the line a finished run says, in place of the kit's own "Render complete" / "Preview ready" (one line, the kit's say) */
  let landed = null;
  const film = o.film, cv = film.canvas, say = (m, warn) => { if (!made) return; if (landed && /^(Render complete|Preview ready)$/.test(m)) { [m, warn] = landed; landed = null; } made.card.setStatus(m, warn ? 'warn' : 'live'); };
  /* 025 B1 · B3: NODES (ON = the screen's graph baked into each frame · OFF = the field alone, 024's film) and CHROME (LABELS = the ATOM LABELS and the
     ESP BAR on the frame · OFF), λWAVES' own rows under AUDIO; read at the take (render-exact.js describe → the job) */
  const nodesOn = () => ls.get('nodes') !== 'off', chrome = () => (ls.get('chrome') === 'off' ? 'off' : 'labels');
  const recorder = film.recorder({ nodes: nodesOn, chrome, editor: o.editor, signature: o.digest, selfTestStages: [{ name: 'λWAVES frame determinism', run: () => film.verify({ frames: 6, width: 160 }).then((v) => { if (!v.ok) throw new Error(v.message || v.error); return v.message; }) }] });
  /* 025 B4 · EVERY SETTING IS A WITNESS: each run's options, the kit's plan at the tap and the stage's CSS box, audited against the kit's result, the
     frame log and the FILE when it lands (render-exact.js audit · fileFacts) — `film.last.audit`; a row that lies is said */
  const run0 = recorder.run;
  recorder.run = (opts) => {
    const asked = { ...opts, nodes: nodesOn(), chrome: chrome() }, current = { w: cv.clientWidth || cv.width, h: cv.clientHeight || cv.height };
    let plan = null; try { plan = recorder.estimate(opts); } catch (_) { /* the run says why */ }
    return run0(opts).then(async (res) => {
      const file = await film.fileFacts(res).catch(() => null), A = film.audit({ asked, plan, res, last: film.last, file, current });
      if (film.last) film.last.audit = A;
      landed = A.ok ? [bounceLine(file, res, !!opts.previewS), false] : ['RENDER DISOBEYED: ' + A.lies.join(' · '), true];
      say(...landed); notice(landed[0], { kind: landed[1] ? 'warn' : 'ok', ms: landed[1] ? 8000 : 5000 });   // the kit's toast, once; the card's status keeps it
      return res;
    });
  };
  /* 025 C3 · THE EVEN ROWS (MIR 1.5.6-alpha.17 `even`): RANGE · FORMAT, SIZE · FPS · AUDIO, LENGTH · START AT, the switches, the estimate,
     RENDER · PREVIEW · CANCEL — each one row; PERIOD is λWAVES' RANGE: TIMELINE · ACTIVE over the placed ONE PERIOD (placed now if there is none) */
  const onPeriod = () => { const ed = o.editor(), P = periodOf(ed), a = ed && ed.activeRange ? ed.activeRange() : null; return !!(P && a && a.start === P.start && a.end === P.start + P.duration); };
  const period = { id: 'period', label: 'PERIOD', title: 'ONE PERIOD — ACTIVE over it (placed if none), MOD OFF', motion: 'timeline-active', is: onPeriod,
    pick() { const ed = o.editor(), P = periodOf(ed); if (!P) return place(); ed.setActiveRange({ start: P.start, end: P.start + P.duration }); set(C.modSelect, 'off'); set(C.motion, 'timeline-active'); return P.id; } };
  made = createRenderCard({ id: 'render', recorder, loadingMark: false, prefix: PREFIX, defaults: { fps: 30, motion: 'still' }, say, even: true, ranges: [period],
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
  /* NODES and CHROME: λWAVES' switches in the kit's switch seat, beside MODULATION · TIMELINE (stored as before: on|off, labels|off) */
  const lwSw = (key, text, tip, on, [yes, no]) => { const s = sw({ label: text, title: tip, lamp: false, value: on, onChange: (v) => ls.set(key, v ? yes : no) }); s.root.dataset.field = key; C.switches.appendChild(s.root); return s; };
  C.nodesSw = lwSw('nodes', 'NODES', 'ON · the screen’s NODES graph baked into each frame · OFF · the field alone', nodesOn(), ['on', 'off']);
  C.chromeSw = lwSw('chrome', 'CHROME', 'ON · the ATOM LABELS and the ESP BAR on the frame · OFF · the picture alone', chrome() === 'labels', ['labels', 'off']);
  /* 017 R4 (call 14) · THE SELF-TEST'S PRINTOUT IS A FOLD, not a scroller in a rack window: its last six lines show, and the fold above them opens
     the earlier ones (the card grows; only the rack scrolls).  The kit writes the whole printout into `C.lines`; the split is the app's. */
  if (C.lines) {
    const early = el('pre', 'sr-lines sr-early'), row = el('div', 'row tight sr-fold'), f = fold(row, early, { what: 'the self-test\'s earlier lines', key: 'selftest' });
    C.lines.before(row, early); row.hidden = true; let mine = false;
    new MutationObserver(() => {
      if (mine) return; const all = C.lines.textContent.split('\n'), cut = Math.max(0, all.length - 6);
      row.hidden = !cut; early.textContent = all.slice(0, cut).join('\n'); if (!cut) { f.set(false); return; }
      mine = true; C.lines.textContent = all.slice(cut).join('\n'); queueMicrotask(() => { mine = false; });
    }).observe(C.lines, { childList: true, characterData: true, subtree: true });
  }
  /* 025 C1 · THE RANGE FROM WHAT YOU HAVE (FILE › RENDER…, EXPORT FRAMES…, the TIMELINE's door): a timeline selection → SELECTION; the TIMELINE
     open with clips → ACTIVE (over every clip when no range is marked); a placed ONE PERIOD → PERIOD (the ACTIVE range over it, the modulation
     OFF, as PLACE ONE PERIOD leaves it); else STILL.  `format` 'png' is EXPORT FRAMES…; `range: 'timeline'` (the door) is SELECTION, else ACTIVE */
  function preset({ format, range } = {}) {
    const ed = o.editor(), r = ed && ed.range ? ed.range() : null, sel = !!(r && r.end > r.start), d = ed && ed.model ? ed.model.state() : null;
    const end = d ? Math.max(0, ...d.clips.map((c) => c.start + c.duration)) : 0, P = periodOf(ed), open = !!(o.isOpen && o.isOpen());
    const kind = range === 'timeline' ? (sel ? 'selection' : 'active') : sel ? 'selection' : open && end > 0 ? 'active' : P ? 'period' : 'still';
    if (kind === 'active' && ed && !(ed.activeRange && ed.activeRange()) && end > 0) ed.setActiveRange({ start: 0, end });
    if (kind === 'period') { ed.setActiveRange({ start: P.start, end: P.start + P.duration }); set(C.modSelect, 'off'); }
    set(C.motion, { still: 'still', selection: 'timeline-selection' }[kind] || 'timeline-active');
    if (format) set(C.recFormat, format);
    return kind;
  }
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
  return { card, view, recorder, plan, place, preset };
}
