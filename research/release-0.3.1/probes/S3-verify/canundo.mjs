// VERIFY item 7 (canUndo with an edit pending AT THE BOTTOM, where it must hash the edit scope) — default and WAVE DANCER
import { lab } from './kit.mjs';
const g = await lab();
try {
  const m = `const H = __LW.history, c = []; for (let i = 0; i < 25; i++) { H.clear('probe'); __LW.setStage(0.5 + i / 100); const t0 = performance.now(); const v = H.canUndo; c.push(performance.now() - t0); if (!v) return { E: 'canUndo false with an edit pending' }; }
    c.sort((a, b) => a - b); return { med: +c[12].toFixed(3), max: +c[24].toFixed(3) };`;
  const a = await g.run(m);
  await g.run(`const P = __LW.layout.projects, c0 = window.confirm; window.confirm = () => true; const f = await fetch('./demos/wave-dancer.lambdawaves.json', { cache: 'no-cache' }); P.open(P.importText(await f.text())); window.confirm = c0; await __w(1500); return 1;`);
  const b = await g.run(m);
  console.log(JSON.stringify({ canUndoPendingAtBottom: { default: a, waveDancer: b } }));
} finally { await g.close(); }
