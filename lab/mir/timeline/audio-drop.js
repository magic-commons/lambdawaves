/* timeline/audio-drop.js — AN AUDIO FILE ON A LANE BECOMES A CLIP (harvested from BASINS app/audio-clip.js installAudioDrop,
 * 2026-10-05; Josh, 2026-10-01: "drop in an audio clip onto any lane to act as signal input … a choice between 'Keep Audio'
 * or 'Signal Only' when adding a clip … readjust whenever the tempo is changed or some shortcut key to stretch it").
 *
 *   installAudioDrop(editor, { mod, controller, say, busy, store }) → { add, addAll, pick, choose, playback, retempo, dispose }
 *   editor       timeline/editor.js buildTimelineEditor's api (its model, surface, onDrop seam, addClip)
 *   mod          installModulation's result (the targets, the tempo, the clock); without it there is no playback and no tempo watch
 *   controller   timeline/controller.js (the one play)         say(text)  where a notice is said (translated already)
 *   busy()       true while a recorder owns the clock (KEEP AUDIO is muted then: audio-playback.js)
 *   store        the asset store (core/assets.js; default the shared one)
 *   add(file, { laneId, start, x, y, choice?, band? }) → clip id | null      addAll(files, at) → [ids]      pick(at) opens the file picker
 *   choose(file, { x, y, laneId }) → Promise<{ keep, targetId } | null>      the small popup: DRIVES · KEEP AUDIO · SIGNAL ONLY · CANCEL
 *
 * THE PATH.  A drop on a lane (the editor's onDrop seam claims audio files at the snapped beat on the lane under the pointer;
 * anything else passes) or pick() → the popup → audioClipFromFile (decode, analyse, store by content hash) → one clip through
 * the model's one create path.  The BUDGET (64 clips, 20 minutes of distinct audio) is asked before the popup, after the
 * analysis and by the model itself on every create, paste and duplicate.  THE TEMPO LAW (audio-kind.js): a natural clip keeps
 * its SECONDS when the tempo changes — its scale and beat length are re-derived as DERIVED fields, in no undo row; the watcher
 * is the transport's own events and tick, never a poller.  THE PROJECT: a part `assets` holds the manifest { audio: [{ id, name,
 * seconds }] } (the bytes stay in the store; the project ZIP carries them) and restore says how many files this browser lacks.
 * Shift+T (STRETCH AUDIO) is the timeline's own key row: shortcuts.js. */
import { el, label, ariaLabel, hint } from '../kit.js';
import { select } from '../controls/select.js';
import { t, tn } from '../core/i18n.js';
import { assets } from '../core/assets.js';
import { registerProjectPart } from '../core/project.js';
import { audioBudget, readjustAudioTempo } from './audio-kind.js';
import { audioClipFromFile, isAudioFile, audioBaseName } from './audio-analysis.js';
import { createAudioPlayback } from './audio-playback.js';

/* the popup's three answers (`label:` and `hint:` so tools/i18n-extract.mjs reaches them) */
const CHOICES = [
  { label: 'KEEP AUDIO', keep: true, hint: 'The envelope drives the target and the file plays with the transport' },
  { label: 'SIGNAL ONLY', keep: false, hint: 'The envelope drives the target; the file stays silent' },
  { label: 'CANCEL', keep: null, hint: '' },
];

export function installAudioDrop(editor, { mod, controller, say = () => {}, busy, store = assets } = {}) {
  const model = editor.model, events = new AbortController();
  const bpm = () => mod?.host?.model?.transport?.bpm || 120;
  let lastBpm = bpm();
  /* the tempo watcher: a change of the transport's tempo re-derives the natural clips once (null = a gesture is open, ask again) */
  const retempo = () => { const b = bpm(); if (b !== lastBpm) { const r = readjustAudioTempo(model, lastBpm, b); if (r !== null) lastBpm = b; } };
  const playback = mod ? createAudioPlayback({ model, mod, controller, retempo, busy }) : null;
  const registry = mod?.host?.registry || mod?.registry;
  const targets = () => (registry?.list?.() || []).map((id) => [id, registry.describeOne(id)?.label || id]);
  const sayWhy = (b) => say(t(b.why, b.vars));
  const decodeFailed = (file, e) => (e instanceof RangeError ? e.message : t('{name} could not be decoded as audio.', { name: file.name }));

  /** choose(file, { x, y, laneId }) — the popup: where the envelope goes and whether the file plays */
  function choose(file, { x = innerWidth / 2, y = innerHeight / 2, laneId } = {}) {
    return new Promise((resolve) => {
      const doc = model.state(), lane = doc.clips.filter((c) => c.laneId === laneId).at(-1), last = lane && doc.curves.find((c) => c.id === lane.curveId)?.targetId;
      const pop = el('div', 'tl-pop glass tl-audio-pop', document.body);
      pop.dataset.mirSurface = 'menu'; pop.setAttribute('role', 'dialog'); ariaLabel(pop, 'Add audio');
      label(el('div', 'tl-pop-title', pop), 'AUDIO · {name}', { name: audioBaseName(file.name) });
      /* DRIVES is the kit's select (never the platform's list: no native field in a kit window).  Its list pane opens on the
         body, so the popup counts a press inside it as its own and an Escape that closes the list does not close the popup */
      const field = el('div', 'tl-field tl-audio-target', pop), list = targets().map(([id, name]) => ({ id, label: name }));   // data: the target's own label
      const first = registry?.has?.(last) ? last : registry?.has?.('palette.phase') ? 'palette.phase' : list[0]?.id || '';
      label(el('span', 'tl-field-word', field), 'DRIVES');
      const pickTarget = select({ aria: 'Target the envelope drives', items: list, value: first, cls: 'tl-audio-select' }); field.append(pickTarget.root);
      const life = new AbortController(), done = (v) => { life.abort(); pickTarget.destroy(); pop.remove(); resolve(v); };
      for (const { label: text, keep, hint: tip } of CHOICES) {
        const b = el('button', 'trig tl-action', pop); b.type = 'button'; label(b, text); b.dataset.audio = keep === null ? 'cancel' : keep ? 'keep' : 'signal';
        if (tip) hint(b, tip);
        b.addEventListener('click', () => done(keep === null ? null : { keep, targetId: pickTarget.get() }), { signal: life.signal });
      }
      const r = pop.getBoundingClientRect();
      pop.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x)) + 'px'; pop.style.top = Math.max(8, Math.min(innerHeight - r.height - 8, y)) + 'px';
      document.addEventListener('pointerdown', (e) => { if (!pop.contains(e.target) && !e.target.closest('.mir-pick')) done(null); }, { signal: life.signal, capture: true });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pickTarget.isOpen) { e.stopPropagation(); done(null); } }, { signal: life.signal, capture: true });
      pop.querySelector('button[data-audio]')?.focus();   // the first answer, as before: the list is opened on purpose
    });
  }

  async function add(file, at = {}) {
    const pre = audioBudget(model.state()); if (!pre.ok) { sayWhy(pre); return null; }
    const laneId = at.laneId || model.state().lanes[0].id, choice = at.choice || await choose(file, { ...at, laneId }); if (!choice) return null;
    let made;
    try { made = await audioClipFromFile(file, { bpm: bpm(), keep: choice.keep, band: at.band, store }); }
    catch (e) { say(decodeFailed(file, e)); return null; }
    const budget = audioBudget(model.state(), { seconds: made.seconds, assetId: made.source.assetId }); if (!budget.ok) { sayWhy(budget); return null; }
    const opts = { start: Math.max(0, at.start ?? 0), duration: made.duration, laneId, targetId: choice.targetId, name: audioBaseName(file.name) };
    const id = editor.addClip?.('audio', made.source, opts) ?? model.create({ ...opts, value: 0, source: made.source });
    if (!id) say(model.lastRefusal ? t(model.lastRefusal.why, model.lastRefusal.vars) : t('No room for this audio clip here: add a lane or choose another time.'));
    else playback?.sync();
    return id;
  }
  /* several files: one choice for the group, each placed after the last */
  async function addAll(files, at = {}) {
    if (!files.length) return [];
    const choice = at.choice || await choose(files[0], { ...at, laneId: at.laneId || model.state().lanes[0].id }), ids = []; if (!choice) return ids;
    for (const f of files) { const id = await add(f, { ...at, choice }); if (id) { ids.push(id); at = { ...at, start: (at.start ?? 0) + model.state().clips.find((c) => c.id === id).duration }; } }
    return ids;
  }
  /* THE DROP SEAM: audio files are claimed at the snapped beat on the lane under the pointer; anything else passes */
  const offDrop = editor.onDrop?.(({ event, files, snapped, laneId }) => {
    const audio = files.filter(isAudioFile); if (!audio.length) return false;
    void addAll(audio, { laneId, start: snapped, x: event.clientX, y: event.clientY }); return true;
  });
  /* THE PROJECT'S ASSET MANIFEST: ids, names and seconds; the bytes stay in the store */
  const manifest = () => [...new Map(model.state().curves.filter((c) => c.kind === 'audio').map((c) => [c.assetId, { id: c.assetId, name: store.meta(c.assetId)?.name || c.name, seconds: c.seconds }])).values()];
  const offPart = registerProjectPart('assets', {
    capture: () => { const audio = manifest(); return audio.length ? { audio } : null; },
    restore: async (saved) => {
      const ids = (saved?.audio || []).map((a) => a.id).filter((id) => typeof id === 'string'), found = await Promise.all(ids.map((id) => store.load(id)));
      const missing = ids.filter((_, i) => !found[i]);
      if (missing.length) say(tn(missing.length, '{n} audio file of this project is not in this browser: its envelope still drives, KEEP AUDIO stays silent until the project ZIP is imported.',
        '{n} audio files of this project are not in this browser: their envelopes still drive, KEEP AUDIO stays silent until the project ZIP is imported.', { n: missing.length }));
      return missing;
    },
    signature: () => manifest().map((a) => a.id).sort().join(','),
  });
  /* ADD AUDIO (the lane's ⋯ menu): a file picker into the same path */
  function pick(at = {}) {
    const input = el('input'); input.type = 'file'; input.accept = 'audio/*'; input.multiple = true;
    input.addEventListener('change', () => { void addAll([...input.files].filter(isAudioFile), at); }, { once: true, signal: events.signal });
    input.click();
  }
  return { add, addAll, pick, choose, playback, retempo, dispose() { events.abort(); offDrop?.(); offPart(); playback?.dispose(); } };
}
