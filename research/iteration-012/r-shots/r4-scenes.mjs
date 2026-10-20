// R4 · THE PALETTE DROPDOWN: the preset list open over benzene (REFRACTIVE, the first run's clear glass), at the knob's 22 px and at 0.
const open = `for (const d of document.querySelectorAll('#rack > .dev')) { const want = d.dataset.id === 'palette'; if (d.classList.contains('folded') === want) d.querySelector('.dev-fold')?.click(); }
  await __w(600); if (!document.querySelector('.mir-pick')) document.querySelector('.dev[data-id="palette"] .mir-ramp-step .mir-step-name').click(); await __w(500); __LW.pause && __LW.pause();
  const p = document.querySelector('.mir-pick'), cs = getComputedStyle(p), r = p.getBoundingClientRect(), i = p.querySelector('.mir-pick-i');
  return { cls: p.className, bg: cs.backgroundColor, bf: cs.backdropFilter, rows: p.querySelectorAll('.mir-pick-i').length, rowH: i.getBoundingClientRect().height, strips: p.querySelectorAll('.pal-strip').length, box: [r.left, r.top, r.width, r.height].map(Math.round), card: __LW.cardStyle };`;
export default {
  query: '&menu=0',
  boot: `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __w(2500); __LW.setStyle('solid'); await __w(500)`,
  scenes: [
    { name: 'r4-palette-dropdown', js: open },
    { name: 'r4-palette-dropdown-blur0', js: `document.body.click(); document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await __w(200); __LW.look.set({ blur: 0 }); await __w(300); ${open}` },
  ],
};
