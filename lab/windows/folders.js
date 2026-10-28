/* lab/windows/folders.js — THE FOLDERS CARD (`projects`), out of boot() (021 G3), created at its seat before `go`: the kit's mountGallery over FOLDERS'
 * one library (`layout.projects`, rack-wiring's), prepended to the LEFT rack and registered closed. */
export function createFolders(app) {
  const { device } = app, { rack, rackL } = app.host, { layout, rk } = app.sh;   // backward: the rack and its layout are made before this seat
  /* iteration 004 · THE FOLDERS CARD (BASINS' rackSave, save-window.js:380): the kit's mountGallery, a second live view of FOLDERS' one library,
     8 a page — closed at the top of the LEFT rack, in + and WINDOW.  Built here, as BASINS builds it (a saved layout opens a card by its
     class alone, shell/rack-wiring.js, so a first-open build would leave it empty); painted again when it opens.  The id `projects` is
     permanent (a WORKSPACE layout row, Gemma's window list); a layout that does not list it leaves it where it is seated here */
  const wFolders = device({ id: 'projects', eyebrow: 'FOLDERS', status: 'PROJECTS' });
  const foldersView = layout.projects ? layout.projects.folders.mountGallery(wFolders.body, { pageSize: 8 }) : null;
  (rackL || rack).prepend(wFolders.root);
  rk.register({ id: 'projects', el: wFolders, side: 'left', closed: true, title: 'FOLDERS', glyph: 'folder', hint: 'your projects and the DEMOS',
    onOpen: () => { if (foldersView) { layout.projects.demosFirst(foldersView); foldersView.paint(); } } });   // iteration 012 M1: the demos when ROOT holds nothing of the reader's
}
