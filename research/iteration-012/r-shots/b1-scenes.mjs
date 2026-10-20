// B1 · THE BLUR, PUT BACK — the GLASS BLUR knob at 0 / 22 / 30 px (30 is the knob's travel, lab/look.js) over the rack with the
// palette dropdown open, and the modulation window with its ADD MACRO sheet open, benzene behind the glass.
const unfold = `for (const id of ['chem', 'palette', 'camera', 'observer']) { const d = document.querySelector('.dev[data-id="' + id + '"]');
  if (d && d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); }`;
const blur = (v) => `__LW.look.set({ blur: ${v} }); await __w(300);`;
const census = `const out = []; for (const e of document.body.querySelectorAll('*')) { if (!e.checkVisibility()) continue;
  const cs = getComputedStyle(e); if (cs.backdropFilter && cs.backdropFilter !== 'none') out.push(e.id || [...e.classList].slice(0, 2).join('.')); } return { blur: __LW.look.get('blur'), blurred: out.length, sample: [...new Set(out)].slice(0, 14) };`;
const scenes = [];
for (const v of [0, 22, 30]) {
  scenes.push({ name: `b1-rack-palette-blur${v}`, js: `__LW.layout.modulation.collapse && __LW.layout.modulation.collapse(); await __w(300); ${unfold}; await __w(400); ${blur(v)}
    const n = document.querySelector('.dev[data-id="palette"] .mir-ramp-step .mir-step-name'); if (!document.querySelector('.mir-pick')) n && n.click(); await __w(500); __LW.pause && __LW.pause(); ${census}` });
  scenes.push({ name: `b1-modwin-blur${v}`, js: `document.querySelector('.mir-pick') && document.body.click(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await __w(200);
    __LW.layout.modulation.expand(); await __w(800); ${blur(v)}
    const b = [...document.querySelectorAll('.mir-modwindow button')].find((x) => /MACRO/i.test(x.textContent || '')); const p = document.querySelector('.mir-modwindow .m2pick.m2mpick');
    if (b && p && p.hidden) b.click(); await __w(500); ${census}` });
}
scenes.sort((a, b) => (a.name.includes('modwin') ? 1 : 0) - (b.name.includes('modwin') ? 1 : 0));
export default {
  query: '&menu=0',
  boot: `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __w(2500); __LW.chem.setView('orbital'); __LW.setStyle('solid'); await __w(800)`,
  scenes,
};
