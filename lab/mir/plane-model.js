/* plane-model.js — MIR · a sphere-and-plane orientation control: drag or arrow keys tilt the plane's normal
 * about the world X and Y axes (never gimbal-locked at the pole), Home resets. Paints only when something moved.
 * 1.4.0: the drawing is 400 × 280 CSS units whatever the backing store, so it is sharp at every device-pixel
 * ratio; a theme flip repaints it (it held the other theme's ink); an accent written inline on <body> (the kit's
 * accent engine, λWAVES', BASINS') is noticed on the next paint().  Its size and material are mir/css/skin.css's. */
import { el, onThemeChange } from './kit.js';

export function planeModel(host, { getNormal, getPosition = () => 0, onTurn }) {
  const cv = el('canvas', 'plane-model', host); cv.width = 400; cv.height = 280; cv.tabIndex = 0;
  let dpr = 0;
  const fitStore = () => { const d = Math.max(1, Math.min(3, globalThis.devicePixelRatio || 1)); if (d === dpr) return false; dpr = d; cv.width = Math.round(400 * d); cv.height = Math.round(280 * d); return true; };
  cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Slice sphere and plane. Drag or use arrow keys to rotate; Home resets.');
  cv.title = 'Orient the plane. Shift gives finer motion; Home resets.';
  const unit = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const project = p => [200+85*Math.SQRT1_2*(p[0]-p[1]),140+85*((p[0]+p[1])/Math.sqrt(6)-p[2]*Math.sqrt(2/3))];
  let lastX = NaN, lastY = NaN, lastZ = NaN, lastPos = NaN, lastTheme = '', lastCard = '', lastAccent = '';
  function paint(force = false) {
    const raw=getNormal(),len=Math.hypot(...raw)||1,nx=raw[0]/len,ny=raw[1]/len,nz=raw[2]/len,pos=getPosition();
    const theme=document.body.dataset.theme||'',card=document.body.dataset.card||'',bs=document.body.style,accent=bs.getPropertyValue('--acc')+bs.getPropertyValue('--hue-acc')+document.documentElement.style.getPropertyValue('--acc');   /* inline reads only: this runs every frame in λWAVES, so no style resolution here (1.4.0) */
    if(fitStore())force=true;
    if(!force && Object.is(nx,lastX) && Object.is(ny,lastY) && Object.is(nz,lastZ) && Object.is(pos,lastPos) && theme===lastTheme && card===lastCard && accent===lastAccent)return false;
    if(cv.clientWidth<2){lastX=lastY=lastZ=lastPos=NaN;return false;}
    lastX=nx;lastY=ny;lastZ=nz;lastPos=pos;lastTheme=theme;lastCard=card;lastAccent=accent;
    const n=[nx,ny,nz];
    const g = cv.getContext('2d'), css = getComputedStyle(cv), ink = css.getPropertyValue('--fg').trim(), cssAccent = css.getPropertyValue('--acc').trim();
    g.setTransform(dpr,0,0,dpr,0,0);
    g.clearRect(0,0,400,280); g.strokeStyle = ink; g.globalAlpha = .25; g.lineWidth = 1.4;
    g.beginPath();g.arc(200,140,85,0,Math.PI*2);g.stroke();
    for (let axis=0;axis<3;axis++) { g.beginPath(); for(let j=0;j<=96;j++){ const a=j*Math.PI/48,p=[0,0,0];p[(axis+1)%3]=Math.cos(a);p[(axis+2)%3]=Math.sin(a);const q=project(p);j?g.lineTo(...q):g.moveTo(...q); }g.stroke(); }
    const u=unit(cross(n,Math.abs(n[2])<.9?[0,0,1]:[0,1,0])),v=cross(n,u);
    g.beginPath(); for(const [i,j] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const p=project(n.map((a,k)=>a*pos+.8*(u[k]*i+v[k]*j)));g.lineTo(...p);}g.closePath();g.globalAlpha=.22;g.fillStyle=cssAccent;g.fill();g.globalAlpha=1;g.strokeStyle=cssAccent;g.stroke();
    g.beginPath();g.moveTo(...project(n.map(a=>a*pos)));g.lineTo(...project(n.map(a=>a*(pos+.8))));g.stroke();
    g.fillStyle=ink;g.font='18px sans-serif';for(const [i,label] of ['X','Y','Z'].entries()){const p=[0,0,0];p[i]=1.18;g.fillText(label,...project(p));}
  }
  /* Two small rotations about the world X and Y axes, not azimuth/elevation: the old parametrisation was
     degenerate at the pole, which is exactly where the plane STARTS (normal = z), so a horizontal drag did
     nothing and an upward one was clamped — "the control is not sliding the plane". Every drag now tilts. */
  function turn(dx,dy) { let [x,y,z]=unit(getNormal());
    let cy=Math.cos(dy),sy=Math.sin(dy); [y,z]=[y*cy-z*sy, y*sy+z*cy];            // about X: a vertical drag tips the plane forward/back
    let cx=Math.cos(dx),sx=Math.sin(dx); [x,z]=[x*cx+z*sx, -x*sx+z*cx];           // about Y: a horizontal drag tips it left/right
    onTurn(unit([x,y,z]));paint();paint(true); }
  let drag=null;
  cv.addEventListener('pointerdown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;drag=[e.clientX,e.clientY];try{cv.setPointerCapture(e.pointerId);}catch(_){}cv.focus();});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const gain=e.shiftKey?.003:.015;turn((e.clientX-drag[0])*gain,(drag[1]-e.clientY)*gain);drag=[e.clientX,e.clientY];});
  for(const type of ['pointerup','pointercancel'])cv.addEventListener(type,()=>{drag=null;});
  cv.addEventListener('keydown',e=>{if(cv.getAttribute('aria-disabled')==='true')return;const k=e.shiftKey?.015:.1;if(e.key==='Home'){onTurn([0,0,1]);paint(true);}else if(e.key.startsWith('Arrow'))turn(e.key==='ArrowLeft'?-k:e.key==='ArrowRight'?k:0,e.key==='ArrowUp'?k:e.key==='ArrowDown'?-k:0);else return;e.preventDefault();});
  const ro = new ResizeObserver(()=>paint(true)); ro.observe(cv);
  const offTheme = onThemeChange(()=>paint(true));
  paint(true); return { root:cv, paint, destroy(){ offTheme(); ro.disconnect(); cv.remove(); } };
}

