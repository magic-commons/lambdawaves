/* ============================================================================
   gatekit.mjs — THE SIX MISTAKES, SOLVED ONCE.

   Written 2026-08-26 after three consecutive waves cost 3, 5 and 6 instrument
   corrections BEFORE a single real defect was found. Every one of those
   corrections was one of six recurring errors, and none was a bug in the code
   under test. They are solved here so no future gate pays for them again:

     1  WRONG READER.  I grepped debug.js for libraryFolders, found nothing, and
        concluded a wave had failed to publish its API — but library.js
        publishes its OWN surface through publishM4.   -> surface()
     2  ASKED TOO EARLY.  The chip bar, the pyramid and the module graph all
        exist AFTER __M4 does. A present 44px button was reported absent.
                                                        -> waitFor(), settle()
     3  UNTRUSTED EVENTS.  Synthetic KeyboardEvents move nothing; the app
        correctly ignores them. Only the driver's key source is real.
                                                        -> press(), tap()
     4  MID-FLIGHT MEASUREMENT.  Tiles refine after a change, so one digest
        catches whatever the pyramid happened to be. Three presses gave three
        hashes and the last was the quiet value.        -> settledDigest()
     5  WRONG SHAPE.  libraryDump() answers a SUMMARY; reading .entries off it
        gave undefined and four arms called a good migration a total loss.
                                                        -> surface() + shape()
     6  WEBGPU CANVAS READBACK LIES.  ctx2d.drawImage of a WebGPU canvas returns
        BLANK — it reported 0 non-black pixels for a lit tower and three
        identical digests for three different blend modes. The DRIVER composites
        the real page.                                  -> snap()

   USE:
     import { open, judge, done } from '<repo>/mbgate/gatekit.mjs';
     const g = await open('https://127.0.0.1:8891/?warn=0&mode=explorer');
     await g.settle();
     judge('X1 ...', <bool>, <detail>);
     await g.close(); done('mygate');
   ========================================================================== */
/* S1-KIT: the driver sits BESIDE this file, and is resolved from this file's
   own URL.  The absolute path that used to be here pinned the kit to one
   checkout on one machine — a browser proof cloned anywhere could not run. */
const drv = await import(new URL('./drv.js', import.meta.url).href);
const { default: http } = await import('node:http');

let FAILED = 0, TOTAL = 0;

/** One assertion. Prints GREEN/RED with its measured value, and counts. */
export function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + '\n      ' +
    JSON.stringify(detail === undefined ? null : detail).slice(0, 300));
  return !!ok;
}

/** The verdict line, and the exit code a runner can trust. */
export function done(label) {
  console.log((FAILED ? 'RED' : 'GREEN') + ' ' + label + ' — ' + FAILED +
    ' failing of ' + TOTAL);
  return FAILED;
}

const A = (b) => `const d=arguments[arguments.length-1];(async()=>{try{d(await (async()=>{${b}})())}catch(e){d({E:String(e&&e.message||e)+' | '+String(e&&e.stack||'').slice(0,200)})}})();`;

export async function open(url, opts = {}) {
  const gd = await drv.startDriver();
  const s = await drv.newSession({ headless: true,
    width: opts.width || 1300, height: opts.height || 850 });
  await drv.setTO(s, { script: opts.script || 600000, pageLoad: 120000 });
  await drv.go(s, url);

  const ev = async (body, args = []) => drv.evalA(s, A(body), args);

  /** MISTAKE 2 — ask only when the thing exists. Polls IN the page. */
  const waitFor = (expr, tries = 600, gap = 100) => ev(
    `for(let i=0;i<${tries};i++){ try{ if(${expr}) return {ok:1,i}; }catch(e){}
       await new Promise(r=>setTimeout(r,${gap})); } return {ok:0};`);

  /** MISTAKE 1+5 — what is ACTUALLY published, and what shape it answers. */
  const surface = (re = '.') => ev(
    `const m=window.__M4||{}; const keys=Object.keys(m).filter(k=>new RegExp(${JSON.stringify(re)},'i').test(k));
     return {keys, m3:Object.keys(window.__M3||{}).filter(k=>new RegExp(${JSON.stringify(re)},'i').test(k))};`);
  const shape = (call) => ev(
    `let v=null; try{ v=await (${call}); }catch(e){ return {threw:String(e&&e.message||e)}; }
     const t=Array.isArray(v)?'array':(v===null?'null':typeof v);
     return {type:t, len:(v&&v.length!==undefined)?v.length:null,
             keys:(v&&t==='object')?Object.keys(v).slice(0,14):null};`);

  /** MISTAKE 2 — the engine has booted AND drawn something. */
  const settle = async () => {
    await waitFor('window.__M4');
    return ev(`for(let i=0;i<600;i++){
        try{ const p=await __M4.presentSig('main',8); if(p&&p.hash!==undefined) return {ok:1}; }catch(e){}
        await new Promise(r=>setTimeout(r,150)); } return {ok:0};`);
  };

  /** MISTAKE 4 — read until two consecutive reads agree; that is the state. */
  const settledDigest = (realm = 'main', sub = 4) => ev(
    `let last=null;
     for(let i=0;i<600;i++){
       const p=await __M4.presentSig(${JSON.stringify(realm)},${sub}).catch(()=>null);
       const h=p?p.hash:null;
       if(h!=null && h===last) return {h, settled:true};
       last=h; await new Promise(r=>setTimeout(r,150)); }
     return {h:last, settled:false};`);

  /** MISTAKE 3 — a real key, from the driver's own input source. */
  let n = 0;
  const press = async (k) => {
    await drv.actions(s, [{ type: 'key', id: 'gk' + (++n), actions: [
      { type: 'keyDown', value: k }, { type: 'pause', duration: 40 },
      { type: 'keyUp', value: k }] }]);
    await drv.relActions(s);
  };
  /** a real pointer, on a real element centre. */
  const tap = async (sel) => {
    /* MISTAKE 7 — A TAP ON AN INVISIBLE ELEMENT IS NOT A TAP.  This returned
       ok:1 for a `display:none` corner button with a 0x0 box, clicked the
       viewport's top-left corner, and let the gate conclude the window it was
       waiting for had simply been slow.  A target must exist, HAVE AREA, and be
       the topmost thing at its own centre before a press means anything. */
    const r = await ev(`const e=document.querySelector(${JSON.stringify(sel)});
      if(!e) return {ok:0, why:'no such element'};
      const b=e.getBoundingClientRect(); const cs=getComputedStyle(e);
      if(b.width<1||b.height<1) return {ok:0, why:'zero area', w:b.width, h:b.height,
        display:cs.display, visibility:cs.visibility};
      if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)
        return {ok:0, why:'not visible', display:cs.display, visibility:cs.visibility, opacity:cs.opacity};
      const x=Math.round(b.left+b.width/2), y=Math.round(b.top+b.height/2);
      const hit=document.elementFromPoint(x,y);
      /* ⟡ AN ANCESTOR IS NOT A HIT.  This clause once also accepted
         hit.contains(e), which is true of <html> for EVERY element on the page
         — so a button whose centre hit-tested to the document root was reported
         as pressable, the driver clicked the background, and the gate read a
         working save as a dead button. Only the element itself or something
         inside it counts. */
      if(!hit||!(hit===e||e.contains(hit)))
        return {ok:0, why:'covered', by:hit?(hit.id||hit.className||hit.tagName):null,
                note:'getBoundingClientRect put the target here but elementFromPoint did not'};
      return {ok:1,x,y};`);
    if (!r || !r.ok) return r || { ok: 0, why: 'eval failed' };
    await drv.actions(s, [{ type: 'pointer', id: 'gp' + (++n),
      parameters: { pointerType: 'mouse' }, actions: [
        { type: 'pointerMove', duration: 0, origin: 'viewport', x: r.x, y: r.y },
        { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 40 },
        { type: 'pointerUp', button: 0 }] }]);
    await drv.relActions(s);
    return { ok: 1 };
  };

  /** MISTAKE 6 — the driver composites the page; a canvas readback does not. */
  const snap = () => new Promise((res, rej) => {
    const r = http.request({ host: '127.0.0.1', port: process.env.GD_PORT,
      path: '/session/' + s + '/screenshot', method: 'GET' }, (x) => {
      let b = ''; x.on('data', (d) => b += d);
      x.on('end', () => { try { res(JSON.parse(b).value); } catch (e) { rej(e); } });
    });
    r.on('error', rej); r.end();
  });
  const snapHash = async () => { const b64 = await snap();
    let h = 2166136261 >>> 0;
    for (let i = 0; i < b64.length; i++) { h = (h ^ b64.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; }
    return h; };

  /** RE-NAVIGATION IS NOT A DEFECT — three gates died on "Document was
      unloaded" because they held a script handle across a real navigation. */
  const nav = async (u) => { await drv.go(s, u || url); await waitFor('window.__M4'); };

  /* R1 (2026-08-27) found this reading a FALLBACK on every gate: __M0.problems is
     an ARRAY on the shipping build, so calling it threw and the catch printed [].
     Read it as data when it is data, call it when it is a lever, and say which. */
  const errors = () => ev(`let pr=[], via='absent';
    try{ const p=window.__M0&&__M0.problems;
         if(Array.isArray(p)){ pr=p.slice(); via='array'; }
         else if(typeof p==='function'){ pr=p()||[]; via='call'; }
    }catch(e){ via='threw:'+String(e&&e.message||e).slice(0,60); }
    return {errs:(window.__e||[]), problems:pr, problemsVia:via};`);
  const armErrors = () => ev(`window.__e=window.__e||[];
    addEventListener('error',e=>__e.push('ERR '+e.message));
    addEventListener('unhandledrejection',e=>__e.push('REJ '+String(e.reason&&e.reason.message||e.reason)));
    return 1;`);

  await armErrors();
  return { s, ev, waitFor, surface, shape, settle, settledDigest, press, tap,
           snap, snapHash, nav, errors, armErrors,
           close: async () => { try { await drv.quit(s); } catch (_) {} gd.kill(); } };
}

/* ⟡ 2026-08-26 — `node --check` IS NOT A SYNTAX CHECK FOR THIS APP.
 *
 * It parses a `.js` file as COMMONJS. Every module in `app/` is an ES MODULE,
 * and the two grammars disagree. Measured today: a settings hint written as
 * 'the crawl\'s interlock' — an unescaped apostrophe closing a single-quoted
 * string — PASSED `node --check` and was REJECTED by the browser with
 * "missing } after property list". The whole app booted to a blank __M4, and
 * four agents had been told to verify with `node --check`.
 *
 * THE CHECK THAT MATCHES WHAT THE BROWSER DOES:
 *
 *     node --input-type=module --check < app/whatever.js
 *
 * Use it on every file, in every commission, in place of `node --check`. */
export const ESM_CHECK = 'node --input-type=module --check < <file>';
