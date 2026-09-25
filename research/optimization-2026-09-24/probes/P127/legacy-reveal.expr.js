/* legacy-reveal.expr.js — wave 127: the legacy H₂⁺ card (MOLECULE, its MO panel and its PULSE panel) revealed by a restore,
 * as molecular-names.browser-test does it, then every canvas in that card hashed after the reveal has laid out and its
 * ResizeObservers have run — and the same after a saved project WITHOUT the owner (the card stays hidden). */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW;
  LW.pause(); await LW.settle(); await sleep(300);
  const fnv = (a) => { let h = 2166136261 >>> 0; for (let i = 0; i < a.length; i++) { h = (h ^ a[i]) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  const card = () => document.querySelector('.dev[data-id="molecule"]');
  const hashes = () => [...card().querySelectorAll('canvas')].map((c) => { let h = null; try { h = c.width && c.height ? fnv(c.getContext('2d').getImageData(0, 0, c.width, c.height).data) : 'empty'; } catch (e) { h = 'err'; } return c.className + ' ' + c.width + 'x' + c.height + ' ' + h; });
  const hidden0 = JSON.parse(JSON.stringify(LW.serialize()));
  LW.molecule.setOn(true);
  const saved = LW.serialize();
  saved.presentation.layout.cards.find((c) => c.id === 'molecule').closed = true;
  LW.molecule.setOn(false);
  const ok = LW.restore(saved);
  await LW.settle(); await sleep(600); await LW.settle();
  const revealed = { ok, on: LW.molecule.on, visible: !card().hidden && !card().classList.contains('closed'), canvases: hashes() };
  LW.molecule.setOn(false);
  const ok2 = LW.restore(hidden0);
  await LW.settle(); await sleep(600);
  return { revealed, back: { ok: ok2, on: LW.molecule.on, hidden: card().hidden, canvases: hashes() }, errors: (window.__e || []).map(String).slice(0, 5) };
})()
