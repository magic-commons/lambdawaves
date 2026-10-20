// B1 · the two narrow rules read live, and the 2× frame rate (LW_DSF=2) with the knob at 22 px: benzene PLAYING under the
// unfolded rack, the modulation window open, then the timeline open.
const bf = (sel) => `(() => { const e = document.querySelector('${sel}'); return e ? getComputedStyle(e).backdropFilter : 'absent'; })()`;
const fps = `__LW.play && __LW.play(); await __w(1500); const reads = []; for (let k = 0; k < 5; k++) { const iv = []; let last = performance.now();
  await new Promise((done) => { const step = (t) => { iv.push(t - last); last = t; if (iv.length < 121) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
  iv.shift(); reads.push(+(1000 / (iv.reduce((a, b) => a + b, 0) / iv.length)).toFixed(1)); } __LW.pause && __LW.pause(); return { dpr: devicePixelRatio, fps: reads };`;
export default {
  query: '&menu=0',
  boot: `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); await __w(2000); __LW.look.set({ blur: 22 });
    for (const id of ['chem', 'palette', 'camera', 'observer']) { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold')?.click(); }`,
  scenes: [
    { name: null, js: `__LW.timeline.open(); await __w(1200); return { timeline: ${bf('.mir-win.mir-timeline')}, lane: ${bf('.mir-timeline .tl-pane')}, toolbar: ${bf('.mir-timeline .tl-toolbar')}, ruler: ${bf('.mir-timeline .tl-ruler')} };` },
    { name: null, js: `__LW.timeline.close(); __LW.layout.menu.open(); const btn = [...document.querySelectorAll('#menubar .mb-btn')].find((b) => b.dataset.menu === 'WINDOW') || document.querySelector('#menubar .mb-btn'); btn && btn.click(); await __w(500);
      const frost = ${bf('#menubar .mb-list:not([hidden])')}; __LW.setFrost('off'); await __w(200); const off = ${bf('#menubar .mb-list:not([hidden])')}; __LW.setFrost('always'); await __w(200);
      document.querySelectorAll('.mb-list').forEach((l) => { l.hidden = true; }); return { menuFrost: frost, menuFrostOff: off };` },
    { name: null, js: `__LW.layout.modulation.expand(); await __w(800); ${fps}` },
    { name: null, js: `__LW.timeline.open(); await __w(1000); ${fps}` },
  ],
};
