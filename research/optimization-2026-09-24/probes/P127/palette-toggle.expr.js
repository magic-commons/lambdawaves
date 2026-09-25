/* palette-toggle.expr.js — wave 127: the P key (palette.setOn) and LW.palette.setOn, read as state + pixels after each: the
 * switch, mat.paletteOn / view, the accents the body wears, the strip canvas bytes and a pinned readPixels hash. */
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const LW = __LW, F = LW.field;
  LW.pause(); await LW.settle(); await sleep(300);
  const fnv = (a) => { let h = 2166136261 >>> 0; for (let i = 0; i < a.length; i++) { h = (h ^ a[i]) >>> 0; h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  const read = async (label) => {
    await LW.settle(); if (F.renderPipelineReady) await F.renderPipelineReady(LW.mat); F.setOcclusion([]);
    const k = F.stats.presents; F.stats.presents = 13; const p = F.readPixels(LW.obs, LW.mat, 320, 240); F.stats.presents = k;
    const st = document.body.style, strip = document.querySelector('.pal-strip');
    let sb = null; try { sb = fnv(strip.getContext('2d').getImageData(0, 0, strip.width, strip.height).data); } catch (_) {}
    return { label, on: LW.palette.on, paletteOn: LW.mat.paletteOn, view: LW.mat.view, acc: [st.getPropertyValue('--acc'), st.getPropertyValue('--acc2'), st.getPropertyValue('--acc-ink'), st.getPropertyValue('--acc-glow')].join(' | '), strip: sb, pixels: (await p).hash };
  };
  const key = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', key: 'p', bubbles: true }));
  const out = [await read('boot')];
  key(); out.push(await read('P'));
  key(); out.push(await read('P again'));
  LW.palette.setOn(true); out.push(await read('setOn(true)'));
  LW.setPalette(LW.paletteGroups[2].items[1]); out.push(await read('setPalette'));
  LW.palette.setOn(false); out.push(await read('setOn(false)'));
  return out;
})()
