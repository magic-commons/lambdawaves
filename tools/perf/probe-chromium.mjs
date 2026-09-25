import { launch, sleep } from './cdp.mjs';
const PORT = process.env.LW_PORT || '8721';
const extra = (process.env.CHROME_ARGS || '').split(' ').filter(Boolean);
const b = await launch({ width: 1600, height: 900, gpu: true, args: ['--ignore-certificate-errors', ...extra] });
try {
  await b.goto(`https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0`, 500);
  for (let i = 0; i < 300; i++) { if (await b.eval('!!(window.__LW && __LW.ready)')) break; await sleep(100); }
  console.log(JSON.stringify(await b.eval(`({ready: !!(window.__LW&&__LW.ready), ok: __LW.field.ok, err: __LW.field.error, adapter: __LW.field.adapterInfo, errs: window.__e, ua: navigator.userAgent, dpr: devicePixelRatio, w: innerWidth, h: innerHeight})`), null, 1));
  const fps = await b.eval(`new Promise(r=>{__LW.play();let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else{__LW.pause();r({fps:n/2, median:__LW.perf.median, appFps:__LW.stats.fps})}};requestAnimationFrame(f)})`);
  console.log('play 2 s:', JSON.stringify(fps));
  console.log('logs:', b.logs.slice(0, 10));
} finally { await b.close(); }
