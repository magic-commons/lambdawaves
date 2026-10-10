/* lab/windows/film.js — THE FILM's road (0.5.2 R2c; moved verbatim out of lab/rack.js boot()): film(), capture(), the facade's takes and app.state.capApi,
 * all lazy.  filmHold stays beside the loop in boot() (app.loop.hold, by value); LW, periodEnergies and stageCaption are read through their slots at use. */
import { createFilm } from '../render-exact.js'; import { createCapture, maxPictureSize } from '../capture.js';
export function createFilmApi(app) {
  const { dom, obs } = app, { hold: filmHold } = app.loop, { camera } = app.host, { rotStep, rotDriving, field } = app.ctl;
    let exact = null, cap = null, facadeRun = null;
    const film = () => exact || (exact = createFilm(app.sh.LW, { canvas: dom.canvas, energies: app.w.periodEnergies, canvasCap: 16384, host: () => app.state.modHost, hold: filmHold,
      road: { pending: () => ({ caption: app.w.stageCaption(), spin: camera.ambient && obs.mode !== 'free' ? camera.ambient : 0, yaw0: obs.yaw }), step: rotStep, rotating: rotDriving,
        plan: (o) => capture().planLoop(o) } }));   // the rack's own for the film's three schedules (take) and the card's road
    const capture = () => cap || (cap = createCapture(app.sh.LW, { canvas: dom.canvas, canvasCap: 16384, energies: app.w.periodEnergies, caption: () => app.w.stageCaption() }));   // wave 58: capture reads the SAME energies periodNow() does, never the labels' ⟨H⟩; 0.4.0 S3: and draws the STAGE TEXT's caption
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
