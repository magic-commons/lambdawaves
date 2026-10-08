/* render/panel.js — THE RENDER PANEL: the picture and the film, as a panel FOLDERS seats and as a rack card.
 *
 * Harvested from BASINS app/save-window.js `buildRender` (the SAVE window's RENDER tab; Josh: "old Basins had a file and save
 * system with rendering, images, etc. I thought the window is amazing").  The rows, their order, their words and their
 * behaviour are BASINS'; what is the app's arrives as options:
 *
 *   SUBJECT   THIS VIEW, or the project the gallery's i pointed at: the name, two key facts, VIEW DETAILS, COPY and JSON   (`subject`)
 *   IMAGE     FORMAT · CAPTURE IMAGE · DOWNLOAD IMAGE: two taps, so the save runs inside the tap on iPad                   (`picture`)
 *   DETERMINISTIC RENDER   motion (STILL · TIMELINE · ACTIVE · TIMELINE · SELECTION · the app's) · format · resolution · frame
 *             rate · length · start at · modulation · timeline · the estimate · RENDER · PREVIEW FIRST 3 SECONDS · progress ·
 *             the finished files · DISCARD · the stored renders (RECOVER COMPLETED FRAMES, RESUME WITH MATCHING PROJECT, DISCARD)
 *   CHECK     RUN SELF-TEST
 *   FILES     SAVE AS ZIP… · OPEN ZIP… (FOLDERS' project zip; BASINS' SETTINGS & FILES had them)                          (`files`)
 *   then      whatever the app's `sections(wrap)` adds (BASINS: SETTINGS & FILES)
 *
 *   renderPanel(options) → { id:'render', label, glyph, hint, build(body, api), onShow(), view() }       for createFolders({ panels: [panel] })
 *   createRenderView(parent, options) → { root, paint(), state(), destroy() }                             the same rows, anywhere
 *   createRenderCard(options) → { card, view }                                                            a rack card (kit.device) holding the rows
 *
 * options
 *   recorder   the createRecorder() handle (required)
 *   subject    { facts(entry | null, gallery) → [[label, value], …] (the first two are the key facts, the rest are VIEW DETAILS),
 *                name?(entry, gallery) → string, text(entry | null, gallery) → string (COPY), json(entry | null, gallery) → { name, body }
 *                (JSON) }: each is handed the view's own gallery, so one subject serves the window and the rack card
 *   picture    { capture() → Promise<held { w, h, name, bytes, settled? }>, save(held) → 'share' | 'download', stale(held) → bool,
 *                size() → { w, h }, formats?: [{ id, label }], format?(), setFormat?(id) }
 *   motionUi   { [motionId]: (host, tools) → { options() → motionOptions, paint(estimate), text(estimate) → string } } the app's rows
 *                for its own motion (BASINS: ZOOM's route and speed), shown only while that motion is chosen.  tools:
 *                  row(text, tip, at?)   a row; `at` seats it under one of the panel's own rows ('motion' — the default — 'format',
 *                                        'size', 'fps', 'length', 'start', 'modulation', 'timeline'): BASINS' SPEED sits under LENGTH
 *                  fields { length, size, fps }   the panel's own inputs (SPEED → LENGTH reads and writes them; a write is followed
 *                                        by a 'change' event the caller dispatches)
 *                  change()   repaint the estimate        el, label, prefix
 *                `paint` may throw a sentence: RENDER then stays off and the sentence is the estimate row (a ZOOM the device
 *                cannot fly), as BASINS' panel had it
 *   gallery    the FOLDERS gallery (api.gallery): `selected()` and `select(null)` for the subject
 *   say(text, warn)   a toast        save(blob, name)   hand a file over (default: an anchor download, the share sheet on iPad)
 *   prefix     the storage keys' prefix (BASINS: "mandel.record."); defaults { fps: 30, motion: 'still' } (BASINS: motion 'zoom'):
 *              the first run's choices; a stored one wins
 *   seat       'window' | 'card'      sections(wrap, gallery)   the app's own sections, after CHECK and FILES
 *   files      { save(), open() } (FOLDERS' api.zip): SAVE AS ZIP… and OPEN ZIP… in a FILES section; renderPanel takes FOLDERS'
 *              own by default (`files: false` leaves them out); a card is handed them (createRenderCard({ files: folders.zip }))
 *   loadingMark   createRenderCard only: the card's waiting mark (kit.device; false: none, as BASINS' card had)
 * view.state() → { motion, motions: [[id, label]], format, size, fps, estimate, status, progress, running,
 *                  plan: { frames, startFrame, fps, range } | null (null while the rows refuse), held: { w, h, bytes } | null,
 *                  done: { name, bytes } | null (the finished film's first file, until DISCARD) }
 * Every row is a kit control (never a native select or number input: call 19, 2026-10-07), hit-testable; touch targets are 44 px. */
import { el, label, hint, trig, seg, select, number, device } from '../kit.js';
import { glyphEl, setGlyph } from '../glyph.js';
import { t } from '../core/i18n.js';
import { RECORD_FPS, fmtBytes, fmtMs, fmtClock } from './plan.js';
import { saveBlob as defaultSave, prefersVideoDownload } from '../folders/save-blob.js';
import { copyText } from '../shell/clipboard.js';

const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* storage refused */ } };

export function createRenderView(parent, o = {}) {
  const rec = o.recorder;
  if (!rec) throw new TypeError('render/panel: createRenderView needs a recorder');
  const prefix = o.prefix || 'mir.render.', say = o.say || (() => {}), save = o.save || defaultSave;
  const get = (k, d) => lsGet(prefix + k) || d, set = (k, v) => lsSet(prefix + k, v);
  const life = new AbortController();
  const wrap = el('div', 'mir-render sr-wrap', parent);
  wrap.dataset.seat = o.seat === 'card' ? 'card' : 'window';
  const section = (cls, title) => { const s = el('section', 'sr-section ' + cls, wrap); if (title) label(el('div', 'sv-title sr-title', s), title); return s; };
  const row = (parent_, text, tip) => { const r = el('div', 'sr-row', parent_); const l = label(el('span', 'sr-label', r), text); if (tip) hint(l, tip); return r; };

  /* ── the SUBJECT: THIS VIEW, or the project the gallery's i pointed at ── */
  const subject = o.subject ? section('sr-subject', null) : null;
  function paintSubject() {
    if (!subject) return;
    const detailsOpen = !!subject.querySelector('.sr-view-details[open]');
    subject.textContent = '';
    const e = o.gallery ? o.gallery.selected() : null;
    const head = el('div', 'sr-subject-head', subject);
    const name = e ? (o.subject.name ? o.subject.name(e, o.gallery || null) : e.name) : t('THIS VIEW');
    el('strong', 'sr-subject-name', head, name);
    if (e) {
      const back = trig({ label: 'THIS VIEW', cls: 'sv-act sr-back', title: ['Stop inspecting {name} and describe the live view again', { name: e.name }], onFire: () => { o.gallery.select(null); paintSubject(); } });
      head.appendChild(back.root);
    }
    const verbs = el('div', 'sr-verbs', subject);
    const rows = o.subject.facts(e, o.gallery || null) || [];
    const summary = el('div', 'sr-subject-summary', subject);
    for (const [k, v] of rows.slice(0, 2)) { const f = el('div', 'sr-keyfact', summary); label(el('span', 'sr-label', f), k); el('b', 'sr-value', f, String(v)); }
    const details = el('details', 'sr-view-details', subject);
    details.open = detailsOpen;
    const toggle = el('summary', 'sr-detail-toggle', details), caret = el('i', 'sr-detail-glyph', toggle);
    label(el('span', 'sr-detail-t', toggle), 'VIEW DETAILS');
    const turn = () => setGlyph(caret, details.open ? 'chevronUp' : 'chevronDown', { size: 14 });   // the fold caret (docs/ICONS.md: no text glyphs)
    turn(); details.addEventListener('toggle', turn, { signal: life.signal });
    for (const [k, v] of rows.slice(2)) { const r = el('div', 'sr-row', details); label(el('span', 'sr-label', r), k); el('b', 'sr-value', r, String(v)); }
    const copyBtn = trig({ label: 'COPY', cls: 'sv-act', title: 'Copy the exact centre, zoom and rotation as text', onFire: async () => {
      const ok = await copyText(o.subject.text(o.gallery ? o.gallery.selected() : null, o.gallery || null));
      copyBtn.setLabel(ok ? 'COPIED' : 'FAILED'); setTimeout(() => copyBtn.setLabel('COPY'), 1400);
    } });
    const fileBtn = trig({ label: 'JSON', cls: 'sv-act', title: 'Download the same numbers as a .json file', onFire: () => {
      const j = o.subject.json(o.gallery ? o.gallery.selected() : null, o.gallery || null);
      save(new Blob([JSON.stringify(j.body, null, 1)], { type: 'application/json' }), j.name);
    } });
    for (const [button, glyph] of [[copyBtn, 'duplicate'], [fileBtn, 'projectFile']]) {
      const icon = glyphEl(glyph, 'gly sr-action-glyph', 16);
      if (icon) button.root.insertBefore(icon, button.root.querySelector('.trig-l'));
    }
    verbs.append(copyBtn.root, fileBtn.root);
  }

  /* ── the IMAGE: two taps, because the save must run inside a tap with no await before it (iPad) ── */
  const pic = o.picture ? section('sr-picture', 'IMAGE') : null;
  let held = null, picBusy = false, capture = null, saveImg = null, picSize = null, picNote = null;
  if (pic) {
    const meta = el('div', 'sr-picture-meta', pic);
    if (o.picture.formats && o.picture.formats.length) {
      const fmtRow = el('div', 'sr-picture-format', meta);
      label(el('span', 'sr-label', fmtRow), 'FORMAT');
      fmtRow.appendChild(seg({ aria: 'Image format', options: o.picture.formats, value: o.picture.format ? o.picture.format() : o.picture.formats[0].id,
        onChange: (v) => { if (o.picture.setFormat) o.picture.setFormat(v); held = null; paintPicture(); } }).root);
    }
    picSize = el('span', 'sr-picture-size', meta);
    hint(picSize, 'The picture on screen, without controls');
    const actions = el('div', 'sr-picture-actions', pic);
    capture = trig({ label: 'CAPTURE IMAGE', cls: 'sv-act sr-capture', onFire: async () => {
      if (picBusy || rec.running()) { if (!picBusy) say(t('A film is rendering — wait for it, or CANCEL it in RENDER, before moving the picture.'), true); return; }
      picBusy = true; capture.root.disabled = true; capture.setLabel('MAKING…');
      try { held = await o.picture.capture(); say(t('Picture made — {w}×{h}. Tap DOWNLOAD IMAGE to keep it.', { w: held.w, h: held.h })); }
      catch (e) { say(t('Could not make the picture: {why}', { why: String((e && e.message) || e) }), true); }
      finally { picBusy = false; capture.root.disabled = false; capture.setLabel('CAPTURE IMAGE'); paintPicture(); }
    } });
    actions.appendChild(capture.root);
    saveImg = trig({ label: 'DOWNLOAD IMAGE', cls: 'sv-act sr-download', onFire: () => {
      if (!held) return;
      if (o.picture.stale && o.picture.stale(held)) { held = null; paintPicture(); say(t('The view moved since the picture was made — tap CAPTURE IMAGE again.'), true); return; }
      const via = o.picture.save(held);   // nothing awaited before this line inside the tap
      say(via === 'share' ? t('Handed to the share sheet — choose Save Image or Save to Files.') : t('Saved — {name}', { name: held.name }));
    } });
    actions.appendChild(saveImg.root);
    picNote = el('div', 'sv-note sr-picture-note', pic);
  }
  function paintPicture() {
    if (!pic) return;
    const z = o.picture.size ? o.picture.size() : null;
    if (z) { picSize.textContent = z.w + ' × ' + z.h; picSize.title = z.w + ' × ' + z.h + ' · ' + (z.w * z.h / 1e6).toFixed(1) + ' megapixels'; }
    if (held && o.picture.stale && o.picture.stale(held)) held = null;
    pic.classList.toggle('has-capture', !!held);
    saveImg.root.disabled = !held;
    saveImg.root.title = held ? t('Download {name} · {size}', { name: held.name, size: fmtBytes(held.bytes) }) : t('Capture an image first');
    picNote.textContent = held ? held.name + ' · ' + fmtBytes(held.bytes) + (held.settled === false ? ' · ' + t('captured before the picture finished resolving') : '') : t('Capture an image to enable Download');
  }

  /* ── the FILM: one deterministic pipeline for stationary recordings, timeline ranges and the app's own motions ── */
  const film = section('sr-record sr-film', 'DETERMINISTIC RENDER');
  label(el('div', 'sv-note', film), 'Exact video time, fixed resolution, complete frames. The active project supplies the colours and rack.');
  /* THE KIT'S OWN CONTROLS, never a native <select> or type=number (Josh, 2026-10-07, call 19; docs/CONTROLS.md): each choice
     is the kit's SELECT in the native one's seat (one row: BASINS' rows, whose long words a segment would wrap onto two to
     four lines), FPS — four short modes, all visible — a SEGMENT on its one row; a number is the NUMBER FIELD.  Each one's
     root is a FIELD — `value` (a string), `disabled`, and a 'change' event when the hand changes it — the surface the rows
     below and an app's motion rows (BASINS' SPEED writes LENGTH, then dispatches 'change') already speak, so the values,
     the events and the stored keys are the selects' and inputs'. */
  const asField = (root, key, read, write, disable) => {
    let off = false; root.dataset.field = key;
    Object.defineProperty(root, 'value', { get: () => String(read()), set: (v) => write(String(v)), configurable: true });
    Object.defineProperty(root, 'disabled', { get: () => off, set: (on) => { off = !!on; disable(off); }, configurable: true });
    return root;
  };
  const choice = (key, text, aria, choices, current, kind = 'select') => {
    const line = row(film, text, aria), items = choices.map(([id, name]) => ({ id, label: name })), value = choices.some(([id]) => id === current) ? current : choices[0][0];
    const changed = () => ctl.root.dispatchEvent(new Event('change'));
    const ctl = kind === 'segment' ? seg({ aria, options: items, value, onChange: changed }) : select({ aria, items, value, onChange: changed });
    if (kind === 'segment') line.classList.add('sr-' + key + '-row');   // the rack card lays a segment's row out (render.css .sr-fps-row)
    ctl.root.classList.add('sr-sel'); line.appendChild(ctl.root);
    return asField(ctl.root, key, () => ctl.get(), (v) => ctl.set(v),
      (on) => { if (ctl.setDisabled) ctl.setDisabled(on); else for (const b of ctl.root.querySelectorAll('button')) b.disabled = on; });
  };
  const num = (key, text, aria, val, min, max, step, unit) => {
    const line = row(film, text, aria), v = Number.parseFloat(val);
    const n = number({ aria, min, max, step, snap: false, fmt: (x) => String(+x.toFixed(3)), value: Number.isFinite(v) ? v : min, onChange: () => n.root.dispatchEvent(new Event('change')) });   // snap: false — a written 0.25 s stays 0.25 (the input's value never rounded to its step)
    n.root.classList.add('sr-record-time'); line.appendChild(n.root); label(el('span', 'sr-unit', line), unit);
    let raw = String(val);                                   // the value as it was written ("0.250"), while the number is still that
    return asField(n.root, key, () => (Number.parseFloat(raw) === n.get() ? raw : String(n.get())), (s) => { const x = Number.parseFloat(s); if (Number.isFinite(x)) { raw = s; n.set(x); } }, (on) => n.setDisabled(on));
  };
  const motionChoices = Object.entries(rec.motions()).map(([id, m]) => [id, m.label]);
  const motion = choice('motion', 'motion', 'Recording motion', motionChoices, get('motion', (o.defaults && o.defaults.motion) || 'still'));
  const isTimeline = () => motion.value === 'timeline-active' || motion.value === 'timeline-selection';
  const recFormat = choice('format', 'format', 'Recording format', [['mp4', 'MP4 · HIGH BITRATE'], ['png', 'PNG FRAMES · LOSSLESS']], get('format', 'mp4'));
  const sizes = [['1080p', '1920 × 1080'], ['1440p', '2560 × 1440'], ['2160p', '3840 × 2160']];
  if (rec.hasCurrentSize()) sizes.push(['current', 'CURRENT DEVICE WINDOW']);
  const recSize = choice('size', 'size', 'Recording resolution', sizes, get('size', '1080p'));
  const recFps = choice('fps', 'fps', 'Recording frame rate', RECORD_FPS.map((v) => [String(v), v + ' FPS']), get('fps', String((o.defaults && o.defaults.fps) || 30)), 'segment');
  const recDuration = num('duration', 'length', 'Recording duration in seconds', get('duration', '60'), 0.1, 3600, 0.1, 'SECONDS');
  const recOffset = num('offset', 'start at', 'Recording start offset in seconds', get('offset', '0'), 0, 3600, 0.1, 'SECONDS');
  const modSelect = choice('modulation', 'modulation', 'Recording modulation', [['off', 'OFF · FREEZE THIS LOOK'], ['on', 'ON · FROM FIRST SPACE']], get('modulation', 'off'));
  const timelineSelect = choice('timeline', 'timeline', 'Recording Timeline automation', [['on', 'ON · FROM BEAT ZERO'], ['off', 'OFF · BYPASS AUTOMATION']], get('timeline', 'on'));
  label(el('div', 'sv-note', film), 'Modulation ON replays the rack from its first Space edge. Timeline ON replays clips from beat zero. Both skip to “start at”. With both OFF, the current look is frozen. Escape cancels.');
  /* the app's motions: their rows are seated under MOTION, or under the panel row a row names (BASINS: SPEED under LENGTH); one
     holder per motion and seat, shown only while that motion is chosen */
  const seats = { motion, format: recFormat, size: recSize, fps: recFps, length: recDuration, start: recOffset, modulation: modSelect, timeline: timelineSelect };
  const motionUis = {};
  for (const [id, build] of Object.entries(o.motionUi || {})) {
    const holders = new Map();
    const holderAt = (at) => {
      const seat = seats[at] ? at : 'motion';
      if (!holders.has(seat)) {
        const h = el('div', 'sr-motion-ui'); h.dataset.motion = id; if (seat !== 'motion') h.dataset.seat = seat;
        let after = seats[seat].closest('.sr-row');
        while (after.nextElementSibling && after.nextElementSibling.classList.contains('sr-motion-ui')) after = after.nextElementSibling;
        after.after(h); holders.set(seat, h);
      }
      return holders.get(seat);
    };
    const host = holderAt('motion');
    const ui = build(host, { row: (text, tip, at) => row(holderAt(at), text, tip), fields: { length: recDuration, size: recSize, fps: recFps },
      el, label, change: () => { paintEstimate(); void paintPath(); }, prefix });
    motionUis[id] = { holders, ui };
  }
  const estimate = el('div', 'sv-note sr-record-estimate', film);
  const renderBtn = trig({ label: 'RENDER', cls: 'sv-act sv-wide sv-primary', onFire: () => startFilm(false) }); film.appendChild(renderBtn.root);
  const previewBtn = trig({ label: 'PREVIEW FIRST 3 SECONDS', cls: 'sv-act sv-wide', onFire: () => startFilm(true) }); film.appendChild(previewBtn.root);
  /* THE HAND (1.5.0-alpha.19): the progress row is always there (CANCEL disabled while nothing runs), and the status
     sentence sits BELOW the buttons, so a render starting, ending or being cancelled moves no button */
  const progRow = el('div', 'sr-row sr-prog', film);
  const prog = el('span', 'sr-value', progRow);
  const cancel = trig({ label: 'CANCEL', cls: 'sv-act sv-danger', onFire: () => rec.cancel() });
  cancel.root.dataset.renderCancel = ''; cancel.root.disabled = true; progRow.appendChild(cancel.root);
  const renderStatus = el('div', 'sv-note sr-record-status', film);
  const doneRow = el('div', 'sr-record-files sr-done', film); doneRow.hidden = true;
  const videoPreview = el('video', 'sr-video-preview', doneRow); videoPreview.controls = true; videoPreview.playsInline = true; videoPreview.hidden = true;
  const doneFiles = el('div', 'sr-record-files', doneRow);
  const doneNote = el('div', 'sv-note', doneRow);
  const recoveryRow = el('div', 'sr-record-files', film);
  let starting = false, videoUrl = null, pathStamp = 0, ready = null, result = null;

  const runOptions = (preview) => {
    const opts = { motion: motion.value, fps: Number(recFps.value), durationS: Number(recDuration.value), offsetS: Number(recOffset.value),
      format: preview ? 'mp4' : recFormat.value, resolution: recSize.value, modulation: modSelect.value === 'on', timeline: isTimeline() || timelineSelect.value === 'on' };
    if (motionUis[motion.value]) opts.motionOptions = motionUis[motion.value].ui.options();
    if (preview) {
      opts.previewS = 3;
      try { const full = rec.plan({ ...opts, previewS: 0 }); opts.size = { w: 640, h: Math.max(16, Math.round(640 * full.size.h / full.size.w) & ~1) }; opts.resolution = null; } catch (_) { /* the run says why */ }
    }
    return opts;
  };
  function paintEstimate() {
    for (const [id, m] of Object.entries(motionUis)) for (const h of m.holders.values()) h.hidden = motion.value !== id;
    recDuration.parentElement.hidden = recOffset.parentElement.hidden = isTimeline();
    ready = null;
    try {
      const e = rec.estimate(runOptions(false));
      const ui = motionUis[motion.value] && motionUis[motion.value].ui;
      if (ui && ui.paint) ui.paint(e);                 // a paint that throws refuses the run: its sentence is the estimate row
      ready = e;
      estimate.textContent = e.size.w + ' × ' + e.size.h + ' · ' + e.plan.frames.toLocaleString() + ' ' + t('frames') + ' · ' + fmtClock(e.plan.durationS) +
        (ui && ui.text ? ' · ' + ui.text(e) : '') +
        (e.range ? ' · ' + t('beats {from} → {to} at {bpm} BPM', { from: +e.range.start.toFixed(3), to: +e.range.end.toFixed(3), bpm: +e.plan.bpm.toFixed(2) }) : '') +
        (e.format === 'mp4' ? ' · ' + t('{mbps} Mbps target · ≈ {size}', { mbps: Math.round(e.bitrate / 1e6), size: fmtBytes(e.est.bytes) }) : ' · ' + t('numbered lossless PNG frames')) +
        ' · ' + t('≈ {time} to render', { time: fmtMs(e.est.renderMs) }) + (e.learned ? ' ' + t('(learned from the last render)') : '') + e.warning;
      estimate.classList.toggle('is-over-limit', !!e.warning);
    } catch (e) { estimate.textContent = String(e.message || e); }
    const busy = rec.running() || starting;
    /* a timeline motion with no range keeps RENDER pressable: the press explains itself with a toast */
    renderBtn.root.disabled = previewBtn.root.disabled = busy || (!ready && !isTimeline());
    for (const x of [motion, recFormat, recSize, recFps, recDuration, recOffset, modSelect, timelineSelect]) x.disabled = busy;
    timelineSelect.disabled = busy || isTimeline();   // a timeline render always plays the arrangement
  }
  async function paintPath() {
    const stamp = ++pathStamp;
    if (!ready || recFormat.value !== 'mp4' || rec.running() || starting) return;
    try {
      const path = await rec.encoderPath(runOptions(false));
      if (stamp !== pathStamp || rec.running() || starting) return;
      if (path.kind !== 'webcodecs') { renderStatus.textContent = t('MP4 unavailable at this size/FPS. Choose PNG frames or a smaller size.'); renderBtn.root.disabled = true; }
      else renderStatus.textContent = '';
    } catch (e) { if (stamp === pathStamp) renderStatus.textContent = String(e.message || e); }
  }
  for (const [input, key] of [[motion, 'motion'], [recFormat, 'format'], [recSize, 'size'], [recFps, 'fps'], [recDuration, 'duration'], [recOffset, 'offset'], [modSelect, 'modulation'], [timelineSelect, 'timeline']]) {
    input.addEventListener('change', () => {
      set(key, input.value); paintEstimate(); void paintPath();
      if (input === motion && isTimeline() && !ready) { const why = estimate.textContent; say(why, true); }
    }, { signal: life.signal });
  }
  window.addEventListener('resize', () => { if (!rec.running() && !starting) paintEstimate(); }, { signal: life.signal });
  const offRange = rec.onRange(() => { if (isTimeline() && !rec.running() && !starting && wrap.isConnected) paintEstimate(); });

  function releasePreview() {
    videoPreview.pause(); videoPreview.removeAttribute('src'); videoPreview.load(); videoPreview.hidden = true;
    if (videoUrl) URL.revokeObjectURL(videoUrl); videoUrl = null;
  }
  function offerFiles(res, preview) {
    result = res; doneFiles.textContent = ''; doneRow.hidden = false;
    for (const file of res.files) {
      const button = trig({ label: t('SAVE {name} · {size}', { name: file.name, size: fmtBytes(file.bytes) }), cls: 'sv-act sv-wide', onFire: () => save(file.blob, file.name) });
      doneFiles.appendChild(button.root);
    }
    const discard = trig({ label: 'DISCARD RENDER', cls: 'sv-act sv-wide', onFire: async () => {
      releasePreview(); doneFiles.textContent = ''; doneRow.hidden = true;
      await rec.discard(result).catch(() => {}); result = null; void paintRecoveries();
    } }); doneFiles.appendChild(discard.root);
    if (preview && res.format === 'mp4') { videoUrl = URL.createObjectURL(res.files[0].blob); videoPreview.src = videoUrl; videoPreview.hidden = false; }
    doneNote.textContent = t('Complete · {frames} frames · {time} render time', { frames: res.frames, time: fmtMs(res.wallMs) }) + (res.diskBacked ? ' · ' + t('stored on disk') : '') +
      (prefersVideoDownload() ? ' · ' + t('Download, then share from Files.') : '');
  }
  async function paintRecoveries() {
    if (rec.running() || starting) return;
    try {
      const jobs = await rec.recoveries(); recoveryRow.textContent = '';
      for (const job of jobs) {
        const item = el('div', '', recoveryRow);
        el('div', 'sv-note', item, (job.files.length ? t('STORED RENDER') : t('RECOVERABLE FRAMES')) + ' · ' + job.frames + ' ' + t('frames') + ' · ' + new Date(job.store.manifest.at).toLocaleString());
        const action = trig({ label: job.files.length ? (job.spec.format === 'png' ? 'DOWNLOAD STORED PNG PART' : 'DOWNLOAD STORED MP4') : 'RECOVER COMPLETED FRAMES', cls: 'sv-act sv-wide', onFire: async () => {
          action.root.disabled = true;
          try {
            const f = job.files[0] || await job.store.finalize(rec.app + '-recovered-partial.mp4');
            save(f.blob, f.name); void paintRecoveries();
          } catch (e) { say(String(e.message || e), true); }
          finally { action.root.disabled = false; }
        } }); item.appendChild(action.root);
        for (const file of job.files.slice(1)) item.appendChild(trig({ label: t('DOWNLOAD {name}', { name: file.name }), cls: 'sv-act sv-wide', onFire: () => save(file.blob, file.name) }).root);
        if (job.store.manifest.state !== 'ready' && job.spec.rendererVersion === 1 && job.frames < job.spec.frames)
          item.appendChild(trig({ label: 'RESUME WITH MATCHING PROJECT', cls: 'sv-act sv-wide', onFire: () => startFilm(false, job) }).root);
        item.appendChild(trig({ label: 'DISCARD STORED RENDER', cls: 'sv-act sv-wide', onFire: async () => { await job.store.discard(); void paintRecoveries(); } }).root);
      }
    } catch (_) { /* no store, no list */ }
  }
  /* the tap: everything up to rec.run() is synchronous, so the wake lock and the share sheet see the gesture */
  async function startFilm(preview = false, recovery = null) {
    if (rec.running() || starting) return;
    paintEstimate();
    if (!recovery && !ready) { if (isTimeline()) say(estimate.textContent, true); return; }
    starting = true; paintEstimate(); releasePreview(); doneFiles.textContent = ''; doneRow.hidden = true; renderStatus.textContent = ''; result = null;
    let lastPaint = 0;
    const onProgress = (p) => {
      const now = performance.now();
      if (now - lastPaint < 150 && p.frame < p.frames) return;
      lastPaint = now;
      const remainingMs = p.renderedFrames && p.elapsedMs ? p.elapsedMs / p.renderedFrames * (p.frames - p.frame) : 0;
      prog.textContent = p.phase + ' · ' + p.frame + '/' + p.frames + (p.seekTotal ? ' · ' + t('seek') + ' ' + p.seek + '/' + p.seekTotal : '') + (p.writtenBytes ? ' · ' + fmtBytes(p.writtenBytes) + ' ' + t('written') : '') +
        (remainingMs > 0 ? ' · ≈ ' + fmtMs(remainingMs) + ' ' + t('left') : '');
    };
    try {
      const run = recovery ? rec.recover(recovery, { onProgress }) : rec.run({ ...runOptions(preview), onProgress });
      starting = false; cancel.root.disabled = false; paintEstimate();
      const res = await run; offerFiles(res, preview); say(preview ? t('Preview ready') : t('Render complete'));
    } catch (e) {
      const cancelled = rec.state().phase === 'cancelled';
      renderStatus.textContent = cancelled ? t('Render cancelled. Completed checkpoints remain available below.') : t('Render failed: {why}', { why: String(e.message || e) });
      say(renderStatus.textContent, !cancelled);
    } finally { starting = false; cancel.root.disabled = true; prog.textContent = ''; paintEstimate(); void paintRecoveries(); }
  }

  /* ── the CHECK ── */
  const check = section('sr-check', 'check — does saving work on this device');
  const lines = el('pre', 'sr-lines');                            // its report goes in BELOW the button (THE HAND), appended after it
  const runCheck = trig({ label: 'RUN SELF-TEST', cls: 'sv-act sv-wide', onFire: async () => {
    runCheck.root.disabled = true; lines.textContent = t('running…');
    try { const res = await rec.selfTest(runOptions(false)); lines.textContent = rec.selfTestLines(res).join('\n'); }
    catch (e) { lines.textContent = t('the self-test threw: {why}', { why: String((e && e.message) || e) }); }
    finally { runCheck.root.disabled = false; }
  } });
  check.append(runCheck.root, lines);
  /* ── FILES: SAVE AS ZIP… and OPEN ZIP…, where BASINS' SETTINGS & FILES had them (FOLDERS' project zip: `files` = api.zip) ── */
  const zipVerbs = o.files && typeof o.files.save === 'function' ? o.files : null;
  if (zipVerbs) {
    const det = el('details', 'sr-section sr-files', wrap);
    label(el('summary', 'sv-title sr-title sr-files-toggle', det), 'FILES');
    const body = el('div', 'sr-files-body', det);
    const zipSave = trig({ label: 'SAVE AS ZIP…', cls: 'sv-act sv-wide sr-zip', title: 'Save the current project, with the audio files it uses, as one .zip.', onFire: () => zipVerbs.save() });
    /* OPEN ZIP… asks "save this first?" when what is on screen is unsaved (Josh, 2026-10-07, call 10): FOLDERS' own ask,
       opened in `ask`, below the button (folders.js openZip) */
    const ask = el('div', 'sr-zip-ask mir-folders');
    const zipOpen = trig({ label: 'OPEN ZIP…', cls: 'sv-act sv-wide sr-zip', title: 'Open a project saved as one .zip (SAVE AS ZIP): its audio comes back with it and it becomes the current project.', onFire: () => zipVerbs.open({ seat: ask }) });
    zipSave.root.dataset.zip = 'save'; zipOpen.root.dataset.zip = 'open';
    body.append(zipSave.root, zipOpen.root, ask);
  }
  if (typeof o.sections === 'function') o.sections(wrap, o.gallery || null);

  const paint = () => { paintSubject(); paintPicture(); if (!rec.running() && !starting) paintEstimate(); void paintPath(); void paintRecoveries(); };
  paint();
  const state = () => ({ motion: motion.value, motions: motionChoices.map(([id, name]) => [id, t(name)]), format: recFormat.value, size: recSize.value, fps: recFps.value,
    estimate: estimate.textContent, status: renderStatus.textContent, progress: prog.textContent, running: rec.running(),
    plan: ready ? { frames: ready.plan.frames, startFrame: ready.plan.startFrame, fps: ready.plan.fps, range: ready.range || null } : null,
    held: held ? { w: held.w, h: held.h, bytes: held.bytes } : null,
    done: result && result.files && result.files[0] ? { name: result.files[0].name, bytes: result.files[0].bytes } : null });
  return { root: wrap, paint, state,
    controls: { motion, recFormat, recSize, recFps, recDuration, recOffset, modSelect, timelineSelect, renderBtn: renderBtn.root, previewBtn: previewBtn.root, cancel: cancel.root, runCheck: runCheck.root, lines, estimate, renderStatus, doneRow, doneFiles, recoveryRow },
    destroy() { life.abort(); offRange(); releasePreview(); wrap.remove(); } };
}

/** the panel FOLDERS seats: createFolders({ panels: [renderPanel({ recorder, … })] }) */
export function renderPanel(o = {}) {
  let view = null;
  return { id: 'render', label: 'RENDER', glyph: 'render', hint: 'Render — this project, and the picture or film you make of it',
    build(body, api) {   // `files`: FOLDERS' SAVE AS ZIP… / OPEN ZIP… by default when it has its zip; false leaves them out
      const files = o.files === false ? null : (o.files && typeof o.files === 'object' ? o.files : (api && api.zip) || null);
      view = createRenderView(body, { ...o, files, gallery: o.gallery || (api && api.gallery) });
    },
    onShow() { if (view) view.paint(); },
    view: () => view };
}

/** the rack card (BASINS' `rackRender`): the same rows in a kit.device, painted when it opens */
export function createRenderCard(o = {}) {
  const card = device({ id: o.id || 'rackRender', eyebrow: o.eyebrow || 'RENDER', status: o.status || 'IMAGE · FILM', loadingMark: o.loadingMark });
  card.root.classList.add('mir-render-card');
  const view = createRenderView(card.body, { ...o, seat: 'card' });
  card.root.addEventListener('devopen', () => view.paint());
  return { card, view };
}
