// R3 · WAVE · CAMERA · PALETTE · CLIP: two pairs of the right rack's cards unfolded over benzene (MOLECULES owns the field).
const only = (ids) => `for (const d of document.querySelectorAll('#rack > .dev')) { const want = ${JSON.stringify(ids)}.includes(d.dataset.id);
  if (d.classList.contains('folded') === want) d.querySelector('.dev-fold')?.click(); } await __w(700);
  for (const f of document.querySelectorAll('#rack .dev:not(.folded) .lw-fold[aria-expanded="false"]')) f.click(); await __w(400); __LW.pause && __LW.pause();`;
const tag = process.env.R3_TAG || '';
export default {
  query: '&menu=0',
  boot: `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __w(2500)`,
  scenes: [
    { name: `r3${tag}-palette-camera`, js: `${only(['palette', 'camera'])} return [...document.querySelectorAll('.dev[data-id="camera"] .k-lbl, .dev[data-id="camera"] .grp-lbl')].filter((e) => e.offsetParent).map((e) => e.textContent.trim());` },
    { name: `r3${tag}-wave-clip`, js: `${only(['observer', 'clip'])} return [...document.querySelectorAll('.dev[data-id="observer"] .seg button')].filter((e) => e.offsetParent).map((e) => e.textContent.trim()).slice(0, 4);` },
  ],
};
