// R1 · INFORMATIONAL: the window open and unfolded over benzene → water (a dipole), BALL AND STICK and NAME on.
const open = `const P = __LW.layout; P.reopen ? P.reopen('informational') : 0; await __w(600);
  const d = document.querySelector('.dev[data-id="informational"]'); if (d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); await __w(300);
  const f = d.querySelector('.info-more .lw-fold'); if (f && f.getAttribute('aria-expanded') === 'false') f.click(); await __w(300);
  const sw = (lbl) => [...d.querySelectorAll('.sw')].find((s) => (s.textContent || '').trim().startsWith(lbl));
  for (const l of ['NAME', 'BALL AND STICK', 'SKELETON']) { const s = sw(l); if (s && s.getAttribute('aria-checked') !== 'true' && !s.classList.contains('on')) (s.querySelector('button') || s).click(); }`;
export default {
  query: '&menu=0',
  boot: `await __LW.chem.solve('H2O'); __LW.chem.setOn(true); await __w(2500)`,
  scenes: [
    { name: process.env.R1_NAME || 'r1-informational', js: `${open}; await __w(1200); __LW.pause && __LW.pause();
      return { rows: [...d.querySelectorAll('.dev-body .grp-lbl, .dev-body .sw .sw-lbl, .dev-body .k .k-lbl')].filter((e) => e.offsetParent).map((e) => e.textContent.trim()), h: d.getBoundingClientRect().height };` },
    { name: 'r1-ball-and-stick-dipole', js: `const c = document.querySelector('.dev[data-id="chem"]'); if (c.classList.contains('folded')) c.querySelector('.dev-fold')?.click();
      const d = document.querySelector('.dev[data-id="informational"]'); const s = [...d.querySelectorAll('.sw')].find((x) => (x.textContent || '').trim().startsWith('DIPOLE'));
      (s.querySelector('button') || s).click(); __LW.ui && 0; await __w(300); __LW.play && __LW.play(); await __w(1500); __LW.pause && __LW.pause(); await __w(300);
      return { dipole: s.getAttribute('aria-checked') || s.className };` },
  ],
};
