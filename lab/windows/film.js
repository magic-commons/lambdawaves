/* lab/windows/film.js — THE FILM's road (0.5.2 R2c; moved verbatim out of lab/rack.js boot()): film(), capture(), the facade's takes and app.state.capApi,
 * all lazy.  filmHold stays beside the loop in boot() (app.loop.hold, by value); LW, periodEnergies and stageCaption are read through their slots at use. */
import { createFilm } from '../render-exact.js'; import { createBake } from '../film-bake.js'; import { createCapture, maxPictureSize } from '../capture.js'; import { statusOf } from '../status.js'; import { getHamiltonian } from '../hamiltonian.js';
export function createFilmApi(app) {
  const { dom, obs } = app, { hold: filmHold } = app.loop, { camera } = app.host, { rotStep, rotDriving, field } = app.ctl;
    let exact = null, cap = null, facadeRun = null;
    const caption = () => { const c = app.w.stageCaption(), ch = app.state.chem, s = c && (ch && ch.on ? ch.said : statusOf({ owner: app.reg.P && app.reg.P.stark ? 'stark' : getHamiltonian().id, Z: getHamiltonian().id === 'atom' ? getHamiltonian().Z : 0 })); return (s ? c + ' · ' + s.word : c) + (c ? app.w.wignerView.caption() : ''); };   // 0.8.2 P1: + ' · WIGNER · ∫|W| − 1 = …' while that window is open · 0.5.4 P4c (PLAN §J-3): the EXPORT caption is the stage's words + its STATE word (MOLECULES' kept status, else the owner's), read at the take, never in a frame; STAGE FORMULA off stays ''
    const film = () => exact || (exact = createFilm(app.sh.LW, { canvas: dom.canvas, energies: app.w.periodEnergies, canvasCap: 16384, host: () => app.state.modHost, hold: filmHold, bake: createBake(app),   // 025 B: THE FILM IS THE SCREEN
      road: { pending: () => ({ caption: caption(), /* 018 B4: AUTO-ROTATE holds a fling at μ = 0, so its yaw is yaw0 + dy·t — the film's pose path */ spin: camera.autoRotate && obs.mode !== 'free' ? camera.dy : 0, yaw0: obs.yaw }), step: rotStep, rotating: rotDriving, caption,   // 027 D2: the caption itself, read per frame after its modulation step (the pending keeps the start string)
       
        plan: (o) => capture().planLoop(o) } }));   // the rack's own for the film's three schedules (take) and the card's road
    const capture = () => cap || (cap = createCapture(app.sh.LW, { canvas: dom.canvas, canvasCap: 16384, energies: app.w.periodEnergies, caption }));   // wave 58: capture reads the SAME energies periodNow() does, never the labels' ⟨H⟩; 0.4.0 S3: and draws the STAGE TEXT's caption
    const take = async (kind, o, keep) => {
      if (facadeRun) { facadeRun.stop(); return null; }
      facadeRun = film().take(kind, { fps: 30, seconds: 6, scale: 2, drive: app.state.modArm, ...o });
      try { const r = await facadeRun.done; if (r && r.ok && keep) film().save(r); return r; }
      catch (e) { return { ok: false, error: String(e && e.message || e) }; } finally { facadeRun = null; }
    };
    app.state.capApi = { get exact() { return film(); }, get capture() { return capture(); }, plan: () => capture().planLoop({ fps: 30, seconds: 6 }),
      limits: () => { try { return capture().limits(); } catch (_) { return maxPictureSize(field && field.ok ? field.device.limits : null, 16384); } },
      async picture() { const r = await capture().picture({ scale: 2 }); if (r && r.ok !== false) capture().save(r); return r; },
      record: () => take('clip', {}, true), loop: () => take('period', {}, true), exportFrames: (options = {}) => take('frames', { options }, options.download !== false),
      get busy() { return !!facadeRun || !!(exact && exact.running); } };
}
