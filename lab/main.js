/* main.js — boot the lab. */
import { boot } from './rack.js';
window.__e = window.__e || [];
addEventListener('error', (e) => __e.push('ERR ' + e.message));
addEventListener('unhandledrejection', (e) => __e.push('REJ ' + String(e.reason && e.reason.message || e.reason)));
const $ = (id) => document.getElementById(id);
boot({ canvas: $('field'), stage: $('stage'), rack: $('rack'), transport: $('transport'), badges: $('badges'), sheet: $('sheet'), banner: $('banner'), hint: $('hint') })
  .catch((e) => { __e.push('BOOT ' + (e && e.stack || e)); const b = $('banner'); b.hidden = false; b.querySelector('h3').textContent = 'boot failed'; b.querySelector('p').textContent = String(e && e.message || e); });
