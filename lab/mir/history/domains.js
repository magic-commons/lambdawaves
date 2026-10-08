/* history/domains.js — the kit's own snapshot domain for the stack: MODULATION.
 *
 * LIFTED FROM BASINS (app/history-window.js installHistory, the 'modulation' domain, 2026-10-01).  The domain reads the
 * authored rack (`serializeRack`) and writes it back THE WAY A PRESET LOADS: the registry's bases restored, the rack
 * deserialised, dormant routes re-marked, the targets re-synced, the clock re-asked.  The LFOs' and ENVs' phases are
 * snapshotted before and put back after, so an undo does not restart them (unless a hold is live).
 *
 * THE LAWS IT KEEPS
 *   · THE KEY IS THE AUTHORED RACK.  No id counters (`seq`), no value on a macro a source is driving, no card folding
 *     (`minimized`): a source running, or a card folded, is not an edit, so it never makes a row and never ends one.
 *   · IT TOUCHES NOTHING THE MODULATION DOES NOT EXPOSE: `mod.M` (the model), `mod.host` (registry, targets, clock),
 *     `mod.view` (its window).  The colour, camera and picture domains are the app's; the timeline's is `adoptTimeline`.
 *
 * rackKey(rack) → the equality string (pure)
 * modulationDomain(mod, { present }) → { read, write, key }   — a snapshot domain for history.register('modulation', …)
 * registerModulation(history, mod, { present, name = 'modulation' }) → unregister */

/** rackKey(rack) — the authored rack as a string: without the id counters, a driven macro's value, a card's folding */
export function rackKey(rack) {
  const o = JSON.parse(JSON.stringify(rack || {})); delete o.seq;
  for (const m of o.macros || []) if (m.sourceId) delete m.value;
  for (const s of o.sources || []) delete s.minimized;
  return JSON.stringify(o);
}

export function modulationDomain(mod, { present = () => {} } = {}) {
  const M = mod.M || mod.host.model;
  return {
    read: () => M.serializeRack(),
    key: rackKey,
    write(rack) {
      const H = mod.host, phases = M.snapshotPhases ? M.snapshotPhases() : null;
      H.registry.restoreAll();
      M.deserializeRack(rack);
      try { M.syncDormant((id) => H.registry.has(id)); } catch (_) {}
      try { H.targets.sync(); } catch (_) {}
      if (phases && M.restorePhases && !(M.transport && M.transport.hold)) { try { M.restorePhases(phases); } catch (_) {} }   // an undo does not restart the LFOs
      H.clock.recomputeRunning(); H.clock.applyAll(true);
      try { if (mod.view && mod.view.rebuild) mod.view.rebuild(); } catch (_) {}
      try { if (mod.persist) mod.persist(); } catch (_) {}
      present();
    },
  };
}

export function registerModulation(history, mod, { present, name = 'modulation' } = {}) {
  return history.register(name, modulationDomain(mod, { present }));
}
