/* lab/shell/transport.js — §12 THE TRANSPORT STRIP (0.5.2 R3b; moved verbatim out of lab/rack.js boot()): λWAVES' own bar, THE PLAY's toggle, THE POWER
 * (setModArm stays a function declaration: the strip calls it before its line, U1) and the loop clock's lock.  createTransport(app) runs at §12's seat;
 * transport, togglePlay, setModArm and barLock are registered on app.sh for KEYS and SETTINGS, and boot() destructures them for the loop and the facade. */
import { TIER } from '../tier.js'; import { el, knob, fader, readout, formula, hint, ariaLabel, chip } from '../mir/kit.js'; import { setGlyph, glyphEl } from '../mir/glyph.js'; import { barTempo } from '../mir/modulation/host.js'; import { createTransport as createBar } from '../mir/shell/transport.js'; import { infoPrefs } from './stage-words.js'; import { createCsbSearch } from '../csb-search.js'; import { createCsbFavs } from '../csb-favs.js';
import { getHamiltonian, getZ } from '../hamiltonian.js'; import { densityPeriod, densityPeriodExact, fmtPeriod, hydrogenShellPeriod, hydrogenShellBase } from '../period.js'; import { BASIS } from '../hydrogen.js'; import { aliasOf, FLASH_HZ } from '../flash-law.js'; import { createAsk, askUrlOf, ASK_ENABLED } from '../ask.js';
export function createTransport(app) {
  const { dom, ui, reg, clock, appPlay, sturm, rates, isPhone } = app, { schedule } = app.loop, { saveSettings } = app.sh, { occupiedEigen, periodEnergies, shadowView } = app.w;
  const { keep, modHand, rotDriving, saveMod, scan, setKeepFrames, stats } = app.ctl;
  const armSubs = new Set();   // the kit's bar hears THE POWER (setModArm) through its mod seam's onArm
  /* ── transport strip (§25) ─────────────────────────────────────────────── */
  const transport = (() => {
    const T = dom.transport;
    /* iteration 014 A0 · THE KIT'S BAR (lab/mir/shell/transport.js createTransport): play, the MOD power, rewind, the dock chip, the modulation door, the
       BPM pill and its tempo panel (MACROS | CLOCK) are the kit's parts; λWAVES' own nodes — ‹ ›, SCRUB, RATE, the t readout, REPEATS, ⟳ — are built here
       and handed in by name.  THE PLAY is appPlay (the kit's play part toggles it); the power is setModArm; the docked seat is λWAVES' TRANSPORT card
       (rack-wiring.js, through the kit's transportDock).  The physics behind REPEATS stays below. */
    const btn = (cls, text, title, aria) => { const b = el('button', 'tbtn ' + cls, null, text); b.type = 'button'; b.title = title; b.setAttribute('aria-label', aria); return b; };
    const sm = chip(btn('transport-step-back', '', 'step back  (←)', 'step back'), 'chevronLeft');   // 021 V2: the kit's chevrons, not ‹ ›
    const sp = chip(btn('transport-step-forward', '', 'step forward  (→)', 'step forward'), 'chevronRight');
    ui.scrub = fader({ label: 'SCRUB  t / window', min: 0, max: 1, value: 0, fmt: (v) => (v * clock.window).toFixed(2) + ' a.u.',
      onInput: (v) => appPlay.seek(v * clock.window + laps() * clock.window, { trail: false }) });   // 021 R3: THE ONE SEEK (clock.js); R6: a drag keeps the trail, as before
    ui.rateKnob = knob({ label: 'RATE a.u./s', min: 0.1, max: 3000, value: 4, log: true, fmt: (v) => v >= 100 ? v.toFixed(0) : v.toFixed(1), onInput: (v) => { if (app.state.stageText) app.state.stageText.say('rate', 'RATE · ' + (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + ' a.u./s', { hold: true }); if (modHand('transport.rate', v)) return; clock.setRate(v); } });   // iteration 007: INFORMATIONAL › RATE
    const tro = readout({ label: 't  a.u.  (lap)', value: '0.00', cls: 'time' });
    /* ── THE CLOCK's law: when does this density repeat?  T = 2π / gcd{|E_a − E_b|} over the populated labels (EXACT where the
       differences are commensurate: hydrogen and its ions, the oscillator; a near-recurrence with its error otherwise) ── */
    ui.periodRo = readout({ label: 'REPEATS every', value: '—', cls: 'period', sub: 'exact period of the density, from the energies in force' });
    /* WAVE 69 · THE THEOREM, SUBSTITUTED, LIVE.  This is the first of the three places a number was
       given permission to move (see REPORT wave 69).  It earns it because every value on the line is
       EXACT at the instant it is printed: the gcd comes from the same scan the readout above prints,
       and the lap decomposition is arithmetic on the clock.  Nothing is tweened and nothing is
       illustrative — which is the difference between this and animating a number in a video. */
    ui.periodFx = formula({ lines: [
      ['<m>T = 2π / gcd{|ΔE|} = 2π / </m>', { s: 'g' }, '<m> = </m>', { s: 'T' }],
      ['<m>t = </m>', { s: 'lap' }, '<m> · T + </m>', { s: 'ph' }, '<m> · T</m>'] ] });
    const jmp = chip(btn('jump', '', 'jump to the next exact repeat of the density', 'jump to the next exact repeat of the density'), 'repeat');   // 021 V2: lab/icons.js `repeat`, not ⟳
    /* THE PLAY's clock for the kit's play part: appPlay, and a press schedules the frame that shows it (togglePlay's law) */
    const barClock = { play: () => { const r = appPlay.play(); schedule(TIER.EVOLVE); return r; }, pause: () => { const r = appPlay.pause(); schedule(TIER.EVOLVE); return r; },
      isPlaying: () => appPlay.isPlaying(), onChange: (f) => appPlay.onChange(f),
      seek: () => appPlay.seek(0) };
    /* 021 V3 · THE PLAYING CLASS: body.lw-playing while THE PLAY runs (one edge each way, onePlay's onChange) — GRAIN's keyframes rest without it (nodes.css) */
    { const playing = (on) => document.body.classList.toggle('lw-playing', !!on); appPlay.onChange(playing); playing(appPlay.isPlaying()); }   // ⏮ (wave 106: the playhead goes back with the clock; 021 R3: through THE ONE SEEK)
    /* 021 R3 · THE ONE SEEK's hooks (clock.js): the playhead (the SCRUB, never under a hand), the shadow trail, the frame */
    appPlay.bind({ playhead: (t) => { if (ui.scrub && !ui.scrub.dragging()) ui.scrub.set(((t % clock.window) + clock.window) % clock.window / clock.window); },
      trail: () => shadowView.clearTrail(), schedule: () => schedule(TIER.EVOLVE) });
    /* the modulation seam the kit's power, door and tempo panel read (the port, the host, THE POWER, the window) */
    const barMod = { get host() { return app.state.modHost; }, get view() { return app.state.modView; },
      armed: () => app.state.modArm, arm: (v) => setModArm(v), onArm: (f) => { armSubs.add(f); return () => armSubs.delete(f); },
      isOpen: () => !!(app.state.modView && app.state.modView.isOpen), toggle: () => app.sh.layout.modulation.toggle(),
      persist: () => saveSettings() };   // iteration 016 W4: no cadence here — 60 | 120 HZ is SETTINGS › QUALITY's (the kit's tempo panel seats no key without it)
    /* REPEATS, its formula, ⟳ and ‹ › ride in the expander's first row (014 A8).  The SCRUB left the bar (Josh: "drop"): `ui.scrub` is still built,
       unmounted, so a preset's, CLEAR's and a restore's `ui.scrub.set(0)` and KEEP FRAMES stand. */
    /* iteration 018 E2 · THE CSB, FLESHED OUT (Josh: "Play/Pause floats to the left … Preset picker is dead center and on the top row. The library
       buttons plus folders should be directly underneath … Move the rate knob and tempo column to the far left … 'MOD' … near the rate and tempo
       … a dedicated icon to expand the CSB … Remove the t = n thing from the CSB"): PLAY floats outside the bar's left edge; LEFT = RATE over the
       typed BPM pill, MOD over EXPAND, then ⏮ · TIMELINE / the door · the dock; CENTRE = MOLECULES' chooser over LIBRARY · MOLECULAR · HYDROGEN ·
       FOLDERS (lab.css centres it with two equal side tracks); RIGHT = SEARCH · FINDER · ♥ · ◧ · FOLDS / NODES · INFORMATIONAL · THEME · ⚙ (020 T2).  Every seat is one
       36-px box, its icon one 20-px glyph (021 V2: lab/icons.js through the kit's roads).  t lives in the TIMELINE window (keys.js ui.tlTime).  The layout is λWAVES' own array
       under the kit's 'csb' drawing name, so the docked card keeps the kit's CONTROL SURFACE title. */
    const CSB = Object.assign([{ group: 'csb-play', items: ['play'] },
      { group: 'csb-side csb-left', items: [{ group: 'csb-col csb-tempo', items: ['app:rate', 'tempo'] }, { group: 'csb-col csb-mod', items: ['power', 'expand'] },
        { group: 'csb-ico', items: ['rewind', 'openers', 'door', 'dock'] }] },
      { group: 'csb-mid', items: ['app:chooser', { group: 'csb-row csb-lib', items: ['app:modes', 'app:folders'] }] },
      { group: 'csb-side csb-right csb-ico', items: ['app:search', 'app:finder', 'app:fav', 'app:rack', 'app:folds', 'app:nodes', 'app:info', 'app:theme', 'app:gear'] },
      'panel'], { name: 'csb', title: 'CONTROL SURFACE' });
    /* 021 I1 · THE SEATS READ THE REGISTRY (lab/actions.js): `seat(id)` takes its word (`word()` where it changes, else the label; its hint the action's short `hint`, 022 H1), its icon, its
       light (a toggle's get()) and its key hint (data-key-action) from the action, and a press runs the action — FOLDS, NODES, INFORMATIONAL, THEME
       and ⚙ are actions of their own; a seat repaints when its action says its state moved (notify) and on the hand's hover */
    const A = app.sh.ACTIONS, seats = new Map();
    const seat = (id, cls) => { const a = A.get(id), b = el('button', 'tbtn csb-ico-b ' + cls); b.type = 'button'; b.dataset.keyAction = id;   // 021 V2: paint() draws the action's glyph (FOLDS' at the same read as its word)
      const paint = () => { const w = a.word ? a.word() : a.label, g = typeof a.icon === 'function' ? a.icon() : a.icon; if (g && b.dataset.gly !== g) setGlyph(b, g); hint(b, a.word ? w : a.hint || w); ariaLabel(b, w); if (a.kind === 'toggle' && a.lit !== false) { let on = false; try { on = !!a.get(); } catch (_) { /* its owner is made later */ } b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); } };
      b.addEventListener('click', () => { A.run(id); paint(); }); b.addEventListener('pointerenter', paint); b.addEventListener('focus', paint); seats.set(id, paint); paint(); return b; };
    A.onState((id) => { const p = seats.get(id); if (p) p(); });
    const gear = seat('gui', 'csb-gear'), folders = seat('folders', 'csb-folders'), finder = seat('windowPicker', 'csb-finder'), theme = seat('theme', 'csb-theme');   // call 11: THEME the theme only (lab.css swaps sun ↔ moon)
    const info = seat('info.all', 'csb-info'), folds = seat('folds', 'csb-folds'), nodes = seat('nodes', 'csb-nodes');   // E3 · 020 T2: INFORMATIONAL, FOLDS, NODES (lit while its window is open)
    theme.append(glyphEl('moon', 'gly gly-moon'), glyphEl('sun', 'gly gly-sun'));   // csb.css shows the one the theme names (body[data-theme])
    infoPrefs().subscribe(() => A.notify('info.all')); requestAnimationFrame(() => A.notify('folds'));
    const chooser = document.querySelector('.dev[data-id="chem"] .mol-pick');
    const byId = (id) => document.getElementById(id);
    const search = createCsbSearch(app, { bar: () => T });   // A2 · THE MINIATURE PICKER (lab/csb-search.js)
    const bar = createBar({ layout: CSB, root: T, host: dom.stage, seats: 'thin',   // 021 K4: λWAVES' thin seats are a kit door since MIR 1.5.5
      nodes: { rate: ui.rateKnob.root, gear, modes: byId('lwMode'), chooser, search: search.root, folders, finder, info, theme, folds, nodes, rack: byId('rackToggle'), fav: byId('rackFav') },
      openers: [{ id: 'timeline', label: 'TIMELINE', glyph: 'lanes', hint: 'the timeline window', toggle: () => { if (app.state.tl) app.state.tl.toggle(); }, isOpen: () => !!(app.state.tl && app.state.tl.isOpen()) }],
      clock: barClock, mod: barMod, model: app.state.modHost.model, setBpm: (b) => app.state.modHost.clock.setBpm(b), persist: () => saveSettings(),
      rack: () => app.sh.rk, door: 'none', powerWord: 'MOD', seatMenu: false, opener: false,
      freeWidth: () => (app.sh.rackCardWidth ? app.sh.rackCardWidth() : 262), freeHost: () => app.host.floats,   // A8: the FREE window is one rack card wide and wears the card's drawing
      /* iteration 014 A4 · THE SEATS: the dock chip cycles RACK → STAGE → FREE (Josh's answer 1: the STAGE at boot); a phone keeps rack and stage.
         The rack seat is λWAVES' TRANSPORT card at its remembered slot (rack-wiring.js), so the kit docks through it */
      places: () => (isPhone() ? ['rack', 'stage'] : ['rack', 'stage', 'free']),
      onDock: (v) => { const rk = app.sh.rk; if (!rk) return; if (v) rk.open('transport', { index: app.sh.layout.dockIndex }); else rk.close('transport'); } });
    /* the rack's ☆ list opens beside its button, wherever the bar sits (it is the stage's, never the bar's: the bar clips) */
    for (const [b, l] of [['rackFav', 'rackFavList']]) { const btnEl = byId(b), list = byId(l); if (!btnEl || !list) continue;
      btnEl.addEventListener('click', () => requestAnimationFrame(() => { if (list.hidden) return; const r = btnEl.getBoundingClientRect(), h = list.offsetHeight, w = list.offsetWidth, up = r.top - h - 8 >= 8;
        list.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))) + 'px'; list.style.right = 'auto';
        list.style.top = Math.round(up ? r.top - h - 8 : Math.min(innerHeight - h - 8, r.bottom + 8)) + 'px'; })); }
    { const pc = bar.root.querySelector('.csb-play'); if (pc) pc.dataset.mirSurface = 'chip'; }   // E2: PLAY's chip wears the kit's material outside the bar
    ui.modB = bar.el.power; ui.modB.title = 'Enable modulation'; ui.modB.setAttribute('aria-label', 'modulation on or off');
    { const rst = bar.root.querySelector('.transport-home'); if (rst) { rst.title = 't → 0 · ψ\'s time home; beat and playhead stay'; rst.setAttribute('aria-label', 'back to t = 0'); } }   // 021 R3: the hint says what it moves
    /* A8 · the door wears the modulation window's own icon (Josh: "a sine wave icon instead of the MIR 3x3 square logo"; 021 V2: the table's
       `modulation`, an SVG); the turning mark is the kit's unplaced logoButton now */
    const door = bar.el.door; ui.modExp = door; door.title = 'Open the modulation window'; setGlyph(door, 'modulation');
    /* the expander's first row: ‹ › ⟳ as one group of round seats, then REPEATS (the kit's readout face) and its formula, one baseline (A8 tidy) */
    if (bar.el.panel) { const rep = el('div', 'csb-repeats'), steps = el('span', 'csb-steps', rep); steps.append(sm, sp, jmp); rep.append(ui.periodRo.root, ui.periodFx.root); bar.el.panel.prepend(rep); }
    /* A3 · THE EXPANDER'S FAVOURITES (lab/csb-favs.js): a strip under the macros; a knob's right-click / hold menu ADDs it, three segments are offered
       (Josh's answer 4: SPECTRUM's HYDROGEN | STURMIAN, WAVE's POSITION | MOMENTUM and its OBSERVABLE); the faces are made when the expander opens */
    const favs = createCsbFavs(app, { panel: bar.el.panel }); app.sh.csb = favs;
    if (bar.parts.panel) bar.parts.panel.onToggle((v) => { if (v) favs.show(); });
    for (const [id, c] of [['spectrum.scale', ui.scaleSeg], ['wave.space', ui.spaceSeg], ['wave.view', ui.viewSeg]]) favs.offer(id, c, { width: 150 });
    /* iteration 014 D4 (Josh: "Let Invert also be a custom button that's a 'Knob' size for the CSB"): PALETTE's INVERT, offered as a knob-sized switch */
    favs.offer('palette.invert', ui.invertSw, { width: 44, build: (c) => favs.swFace('palette.invert', c, { label: 'INVERT', glyph: 'invertColors', cls: 'pal-invert', title: 'Invert field colour without changing ψ' }) });
    /* iteration 011 Q6 · GEMMA, HIDDEN: the ASK door and THE TYPE BOX mount only under ASK_ENABLED (lab/ask.js, the one flag); off, the strip is
       the 0.6.5 strip, `openAsk` does nothing (no key row calls it) and createAsk is never made, so no request can leave */
    let echoOn = false, openAsk = () => {};
    if (ASK_ENABLED) {
      /* 0.6.6 G2 · THE TYPE BOX: ASK (or /) swaps the centre — the t readout, REPEATS, the formula — for one line to Gemma (lab/ask.js); the first press ever asks consent */
      const seat = el('span', 'ask-seat'); tro.root.before(seat);   // its seat, as 0.6.6 built it: just before the t readout
      const line = el('input', 'ask-line', seat), note = el('span', 'ask-note', seat), okB = el('button', 'tbtn ask-ok', seat, 'CONTINUE');
      line.type = 'text'; line.spellcheck = false; line.autocomplete = 'off'; line.placeholder = 'ask Gemma — what does benzene look like?'; line.setAttribute('aria-label', 'ask Gemma'); okB.type = 'button'; okB.style.flex = 'none';
      const askB = el('button', 'tbtn ask', null, 'ASK'); jmp.after(askB); askB.type = 'button'; askB.title = 'ask Gemma  (/)'; askB.setAttribute('aria-label', 'ask Gemma');
      const asker = createAsk(app), troLbl = tro.root.querySelector('.ro-lbl'); app.sh.ask = asker;
      let echoT = 0;
      function showAsk(on) {
        const first = on && !ui.askOk; T.classList.toggle('asking', on); T.classList.toggle('consent', first); if (!on) return;
        note.title = note.textContent = 'sends your words and readouts to ' + askUrlOf(ui) + ' ·';
        note.hidden = okB.hidden = !first; line.hidden = first; (first ? okB : line).focus();
      }
      function echo(s) { endEcho(); if (!s) return; echoOn = true; T.classList.add('echo'); troLbl.textContent = 'GEMMA'; tro.set(s, ''); tro.root.title = s; echoT = setTimeout(endEcho, 4000); }
      function endEcho() { clearTimeout(echoT); if (!echoOn) return; echoOn = false; T.classList.remove('echo'); troLbl.textContent = 't  a.u.  (lap)'; tro.root.title = ''; tro.set(clockText(), clock.playing ? 'live' : ''); }
      openAsk = () => { endEcho(); showAsk(true); };
      askB.addEventListener('click', () => (T.classList.contains('asking') ? showAsk(false) : openAsk()));
      okB.addEventListener('click', () => { ui.askOk = true; saveSettings(); showAsk(true); });
      line.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') { e.preventDefault(); showAsk(false); return; }
        const q = line.value.trim(); if (e.key !== 'Enter' || !q || asker.busy) return;
        line.value = '…'; line.disabled = true; const r = await asker.ask(q); line.disabled = false; line.value = '';
        showAsk(false); echo(r.error || r.echo);
      });
      document.addEventListener('pointerdown', (e) => { if (!T.contains(e.target)) endEcho(); }, true); addEventListener('keydown', (e) => { if (e.key === 'Escape') endEcho(); });
    }
    jmp.addEventListener('click', () => { const P = periodNow(true); if (P && P.T > 0) { const t = clock.t, next = t + P.T - (((t % P.T) + P.T) % P.T); appPlay.seek(next); } });
    let lastPeriod = null, periodCostMs = 0, periodSettling = false, periodPending = null;
    /* LA6 · ONE SCAN IN FLIGHT, THE LATEST KEY WAITING.  Every new key used to post a fresh O(pairs × 2·10⁶) scan into a
       FIFO worker that cannot drop stale work: 4 s of a moving register (keyboard auto-repeat on ZEEMAN B, a script)
       jammed it for over two minutes (AUDIT-F F3, REFUTE-B/D).  Now one scan runs; a newer key replaces `scanWant`; the
       worker is free again only when ITS reply arrives — a timed-out scan is tracked to that reply (worker-pool.js makeWorker, onLate),
       never to the promise, or a timeout plus a fresh post would put two scans back in the queue (REFUTE-D). */
    let scanBusy = false, scanWant = null;
    function scanPost(key, energies) {
      if (scanBusy) { scanWant = { key, energies }; return; }
      scanBusy = true;
      const done = (r) => {
        scanBusy = false; scanLand(key, r);
        if (scanWant) { const q = scanWant; scanWant = null; if (periodPending && sameKey(periodPending, q.key)) scanPost(periodPending, q.energies); }
      };
      scan.call({ op: 'period', energies, horizon: 2e4 }, undefined, done).then((r) => { if (!(r && r.error === 'timeout')) done(r); });
    }
    function scanLand(key, r) {
      if (!r || r.error) { if (periodPending && sameKey(periodPending, key)) periodPending = null; return; }
      if (!periodPending || !sameKey(periodPending, key)) return;          // a later state: this answer is stale
      const P = Object.assign({}, r); delete P.id; delete P.op;
      lastPeriod = P; Object.assign(pk, key); periodCostMs = 0; periodSettling = false; periodPending = null;
      paintPeriod(); schedule(TIER.PRESENT);                           // paused, no frame would repaint the readout
    }
    /* …and a dial held down by an ARROW KEY is a gesture too (auto-repeat bumps reg.version ~30×/s with no pointer):
       the wave-44 hold-off below reads it beside pointerHeld; a released key lets the settled scan run once. */
    let keyHeld = false;
    document.addEventListener('keydown', (e) => { if (e.repeat && e.target && e.target.closest && e.target.closest('.k, .fd')) keyHeld = true; }, true);
    const keyReleased = () => { if (!keyHeld) return; keyHeld = false; if (periodSettling) schedule(TIER.PRESENT); };
    document.addEventListener('keyup', keyReleased, true); window.addEventListener('blur', keyReleased);
    /* the scan's key, as numbers compared in place (wave 45: it was a string built on every frame) */
    const pk = { v: -2, fz: 0, bz: 0, h: '', mix: false, s: -1 };
    const keyNow = () => ({ v: reg.version, fz: reg.field.Fz, bz: reg.field.Bz, h: getHamiltonian().id, mix: !!reg.transition, s: sturm.P ? sturm.lambda : -1 });
    const sameKey = (a, b) => a.v === b.v && a.fz === b.fz && a.bz === b.bz && a.h === b.h && a.mix === b.mix && a.s === b.s;
    const periodFresh = () => pk.v === reg.version && pk.fz === reg.field.Fz && pk.bz === reg.field.Bz && pk.h === getHamiltonian().id && pk.mix === !!reg.transition && pk.s === (sturm.P ? sturm.lambda : -1);
    /**
     * THE SCAN IS NOT FREE (wave 44).  densityPeriod's near-recurrence scan is O(pairs × 2·10⁶) and it is reached on
     * every NEW register version — which the comment below the readout used to call "cheap, cached on the register's
     * version", true only while a state has one or two beats.  Under STURMIAN a generic λ occupies eleven eigenvalues,
     * fifty-five pairs, and one scan measured 594 ms; the λ knob calls setSturmian on every pointermove, so a drag was
     * a train of 0.6 s stalls (34 frames of 74 over 100 ms, the worst 650).  So a scan that has ALREADY proved
     * expensive is held off while a pointer is down — the same law history.js applies to its commits — and runs once
     * when the gesture ends.  `force` is the road every non-frame reader takes (LW.period, the ⟳ jump, the digest), so
     * no proof and no button ever sees a stale answer: only the per-frame readout waits, and it says that it is.
     */
    function periodNow(force = false) {
      if (periodFresh()) { periodSettling = false; return lastPeriod; }
      /* AND A DRIVEN ROTATION IS A GESTURE TOO.  The guard was `pointerHeld` alone, which a
         hands-off drive does not set: a running rate bumps reg.version on every frame, so
         periodPending got a new key sixty times a second and this posted a fresh O(pairs × 2·10⁶)
         scan to the worker on every one of them, for as long as the rate turned.  Same law, same
         line — an expensive answer waits until the movement stops. */
      if (!force && lastPeriod && periodCostMs > 8 && (app.state.pointerHeld || keyHeld || rotDriving())) { periodSettling = true; return lastPeriod; }
      const key = keyNow();
      if (reg.field.Fz !== 0) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, stark: true, T: 0 }; return lastPeriod; }
      if (reg.transition) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, mix: true, T: 0 }; return lastPeriod; }
      const Es = periodEnergies();          // W-STURMIAN: the OCCUPIED eigenvalues (populations > 1e-6), never the labels' ⟨H⟩ — and wave 58 hands the SAME expression to capture.js
      /* Hydrogen, ions and the oscillator normally prove commensurate in microseconds. Answer that exact half here;
         only an actually incommensurate spectrum pays module-worker startup and the bounded two-million-step scan. */
      const deep = getHamiltonian().id === 'hydrogen' && !sturm.P;   // iteration 008 A7: n = 7's ratios need the deep pass (period.js)
      const exact = densityPeriodExact(Es, { deep });
      if (exact) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; periodPending = null; lastPeriod = exact; return lastPeriod; }
      if (!force && scan.ok) {
        /* THE FRAME PATH (wave 45): the scan runs in the maths worker and the readout says it is settling until the
           answer lands — a BOX bow populates 56 incommensurate well energies and the scan measured 1.2 s on the first
           frame after the pointer lifted.  Forced readers (LW.period, ⟳, the digest) still scan here, synchronously. */
        if (!periodPending || !sameKey(periodPending, key)) { periodPending = key; scanPost(key, Array.from(Es)); }   // LA6: posted, or waiting behind the one in flight
        periodSettling = true; return lastPeriod;
      }
      const wasSettling = periodSettling;
      Object.assign(pk, key); periodSettling = false; periodPending = null;
      const t0 = performance.now();
      lastPeriod = densityPeriod(Es, { horizon: 2e4, deep });
      periodCostMs = performance.now() - t0;
      if (force && wasSettling) paintPeriod();                                 // the readout said "settling": it has the answer now
      return lastPeriod;
    }
    function periodText() {
      const P = periodNow(); if (!P) return ['—', '', ''];
      if (periodSettling) return ['…', 'settling — the recurrence scan runs off the frame, or when the gesture ends', ''];
      const src = sturm.P ? ' · from the occupied eigenvalues of S⁻¹H' : '';
      if (sturm.P && !P.exact && P.T > 0) {                          // W-STURMIAN: a "recurrence" shorter than one turn of the fastest beat is no recurrence (every phase is still small)
        const Es = occupiedEigen(); let dmax = 0; for (let i = 0; i < Es.length; i++) for (let j = i + 1; j < Es.length; j++) dmax = Math.max(dmax, Math.abs(Es[i] - Es[j]));
        if (dmax > 0 && P.T < 2 * Math.PI / dmax) return ['—', P.count + ' incommensurate eigenvalues · no recurrence within the search horizon', 'warn'];
      }
      if (P.stark) return ['— (Stark)', 'no exact period under a static field: the Stark energies are not commensurate', 'warn'];
      if (P.mix) return ['— (transition)', 'the A ↔ B mix has its own clock: the Rabi period', 'warn'];
      if (P.stationary) return ['stationary', 'one energy: the density never changes', ''];
      /* 0.6.0 B3a: the field-free hydrogen register says its closed form, T = 2π·7200/g′/Z² (hydrogenShellPeriod; 2π·352 800 with n = 7), where it equals the fit */
      const pop = reg.populated(), unit = pop.every((a) => rates[a] === 1), Z = getZ();
      const Th = unit && !sturm.P && getHamiltonian().id === 'hydrogen' && reg.field.Bz === 0 ? hydrogenShellPeriod(pop.map((a) => BASIS[a].n), Z) : 0, B2 = Th ? 2 * hydrogenShellBase(pop.map((a) => BASIS[a].n)) : 14400, gp = Math.round(B2 * Math.PI / (Th * Z * Z));
      if (P.exact) { const lap = Math.floor(clock.t / P.T), ph = clock.t - lap * P.T;
        const head = Th && Math.abs(Th - P.T) < 1e-9 * P.T ? 'exactly · T = ' + B2 + 'π' + (gp > 1 ? '/' + gp : '') + (Z !== 1 ? '/Z²' : '') + ' a.u. · ' + fmtPeriod(P.T).split(' · ')[1] : P.count + ' energies · gcd ' + P.g.toPrecision(4) + ' Eh';
        return [fmtPeriod(P.T), head + ' · lap ' + lap + ' · ' + (100 * ph / P.T).toFixed(0) + '%' + src, 'ok']; }
      return ['≈ ' + fmtPeriod(P.T), (unit || sturm.P ? '' : 'no exact period under these per-label rates · ') + 'nearest recurrence · error ' + (100 * P.err).toFixed(1) + '% of a beat' + src, 'warn'];
    }
    /** the four slots of the REPEATS formula, from the SAME `periodNow()` the readout above reads — one
        expression for one quantity (ANTI-PATTERN 20).  A state with no exact period prints an em dash in
        every slot rather than a number that would be a lie. */
    function paintPeriodFx() {
      if (!ui.periodFx) return;
      const P = periodNow();
      if (!P || periodSettling || !P.exact || !(P.T > 0)) { ui.periodFx.set({ g: '—', T: '—', lap: '—', ph: '—' }); return; }
      const lap = Math.floor(clock.t / P.T), ph = (clock.t - lap * P.T) / P.T;
      ui.periodFx.set({ g: P.g.toPrecision(6), T: fmtPeriod(P.T), lap: String(lap), ph: ph.toFixed(3) });
    }
    /** paint the REPEATS readout now — a forced scan (LW.period, ⟳, the digest) and the worker's answer both call it, so a paused
        instrument shows the answer the moment it exists rather than on a frame it will not run (wave 45) */
    function paintPeriod() { if (!ui.periodRo) return; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub + flashSub()); paintPeriodFx(); }
    /* 0.6.0 B3a · THE FLASH LAW (lab/flash-law.js) on the RATE knob and this sub, recomputed only when RATE or the register moves; it never changes RATE (the hand wins) */
    const fk = { v: -1, r: -1, sub: '' }, rateTitle = ui.rateKnob.root.title;
    function flashSub() {
      if (fk.v === reg.version && fk.r === clock.rate) return fk.sub;
      const w = aliasOf(periodEnergies(), fk.r = clock.rate, stats.fps >= 10 ? Math.round(stats.fps) : 60), on = !!w && w.alias > FLASH_HZ; fk.v = reg.version;
      ui.rateKnob.root.title = on ? 'beats ' + w.hz.toFixed(1) + ' Hz show at ' + w.alias.toFixed(1) + ' Hz: a flash' : rateTitle;
      ui.rateKnob.root.classList.toggle('flash', on); return (fk.sub = on ? ' · beats alias at ' + w.alias.toFixed(1) + ' Hz on screen' : '');
    }
    app.hooks.period = () => periodNow(true);          // every reader outside the frame loop forces the scan: no proof and no digest ever sees a settling answer
    const laps = () => Math.floor(clock.t / clock.window);
    const compactClock = (v, threshold, decimals) => Math.abs(v) < threshold
      ? v.toFixed(decimals)
      : v.toExponential(decimals).replace('e+', 'e');
    const clockText = () => {
      const lap = laps();
      return compactClock(clock.t, 1e5, 2) + (lap ? '  (' + compactClock(lap, 1e4, 1) + ')' : '');
    };
    const stepDt = () => clock.window / 48;
    sm.addEventListener('click', () => { clock.step(-stepDt()); schedule(TIER.EVOLVE); });
    sp.addEventListener('click', () => { clock.step(stepDt()); schedule(TIER.EVOLVE); });
    let troWall = 0, periodWall = 0;
    function update() {
      const on = clock.playing, now = performance.now();
      /* KEEP FRAMES (wave 45): on, the playhead follows every frame as it always did; off — the default — the bar is
         disabled and never repainted, and the t readout runs at 5 Hz while playing (every paused frame, as before) */
      if (keep.frames) {
        if (!ui.scrub.dragging()) ui.scrub.set(((clock.t % clock.window) + clock.window) % clock.window / clock.window);
        if (!echoOn) tro.set(clockText(), on ? 'live' : '');
      } else if (!echoOn && (!on || now - troWall >= 200)) { troWall = now; tro.set(clockText(), on ? 'live' : ''); }
      if (ui.periodRo && (!on || keep.frames || now - periodWall >= 200)) { periodWall = now; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub + flashSub()); paintPeriodFx(); }   // periodNow() is cached on the register's version; the scan itself runs off the frame (wave 45) or waits out a live gesture (wave 44).  WAVE 69: the formula rides the SAME cadence law — every frame with KEEP FRAMES on, 5 Hz without — so a moving number obeys the readout law the transport already owns rather than inventing a second one
    }
    setKeepFrames(keep.frames);                                // the shipped default: the bar disabled
    setModArm(app.state.modArm, { quiet: true });                        // wave 65: ONE writer paints the lamp, boot included
    return { update, stepDt, openAsk, bar, search };
  })();
  /** THE PLAY (0.5.0 A6): the physics clock's toggle; its edge plays or pauses the modulation (C4: the one clock, always). */
  function togglePlay() { appPlay.toggle(); schedule(TIER.EVOLVE); }
  /** THE POWER (MIR 1.5, R-B1 at 0.5.0 C4; the MOD button, Ctrl+Space, the window's power seat): `setModulationEnabled` is a
   *  ROUTE BYPASS — off, every routed control is back on its base and the hand owns it, while the clock, the sources, the tempo
   *  and the HOLDs run on, so power on picks the routes up in time.  Power never plays; play never powers (bind.js setArm). */
  function setModArm(on, opts) {
    const want = !!on, o = opts || {};
    app.state.modArm = want;
    if (ui.modB) {
      ui.modB.classList.toggle('on', want);
      ui.modB.setAttribute('aria-pressed', String(want));
    }
    for (const f of armSubs) f();                                        // the kit's bar repaints its power seat
    if (app.state.modHost) {
      app.state.modHost.clock.setModulationEnabled(want);
      if (app.state.modView) app.state.modView.sync();
    }
    if (!o.quiet) saveMod();
    schedule(TIER.PRESENT);
    return app.state.modArm;
  }
  app.sh.transport = transport; app.sh.togglePlay = togglePlay; app.sh.setModArm = setModArm; app.sh.barLock = barLock;
  /** THE LOOP CLOCK, LOCKED TO THE STATE (g).  `barTempo({T, rate})` turns the density's own exact
   *  recurrence into a tempo at which ONE BAR IS ONE RECURRENCE — which is what makes the BPM chip's
   *  "an existing global clock" the instrument's clock rather than a number somebody typed, and what
   *  makes `capture.js`'s loop close on the same seam the physics closes on.  It is a KEY and not a
   *  new control, because the modulation window is a ported artifact and its timing bar is not ours
   *  to grow; the sentence lives on the MOD button and in the keyboard editor.  It never guesses: no exact
   *  period, no lock, and the refusal says which. */
  function barLock() {
    if (!app.state.modHost) return { ok: false, reason: 'no modulation rack' };
    const P = app.hooks.period ? app.hooks.period() : null;
    if (!P || !P.exact || !(P.T > 0)) {
      const why = !P ? 'no recurrence scan' : P.stark ? 'no exact period under a static field'
        : P.mix ? 'the A ↔ B mix has its own clock' : P.stationary ? 'one energy: the density never changes'
        : 'no exact period — the energies are incommensurate';
      if (app.state.modView) app.state.modView.say('the loop clock cannot be locked to this state: ' + why, 'warn');
      return { ok: false, reason: why };
    }
    const r = barTempo({ T: P.T, rate: clock.rate });
    if (!r.ok) return { ok: false, reason: r.reason };
    app.state.modHost.clock.setBpm(r.clamped ? r.bpmThatFits : r.bpm);
    if (app.state.modView) { app.state.modView.sync(); app.state.modView.say(r.clamped
      ? 'one bar = ' + r.lapsThatFit + ' laps of the recurrence at ' + app.state.modHost.model.transport.bpm.toFixed(1) + ' BPM (one lap would be ' + r.wanted.toFixed(1) + ', past the tempo range)'
      : 'one bar = one recurrence of the density, at ' + app.state.modHost.model.transport.bpm.toFixed(1) + ' BPM'); }
    saveSettings();
    return { ok: true, bpm: app.state.modHost.model.transport.bpm, wanted: r.wanted, clamped: r.clamped,
             laps: r.clamped ? r.lapsThatFit : 1, T: P.T, seconds: r.seconds, fits: r.fitsAtLaps };
  }
  return { transport, togglePlay, setModArm, barLock };
}
