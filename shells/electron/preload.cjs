// preload.cjs — the only thing the host tells the page: that it is on the desktop, and where.
'use strict';
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('lwavesDesktop', { platformInfo: () => ({ kind: 'desktop', platform: process.platform, versions: process.versions }) });
