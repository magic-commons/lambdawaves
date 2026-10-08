/* panels/index.js — THE KIT'S RACK WINDOWS, in one import (docs/PANELS.md).
 *
 * The panels import the kit (`../kit.js`), so `kit.js` cannot re-export them without a cycle: this file is their door.
 *   import { createGradePanel, createCurvesPanel } from './mir/panels/index.js';
 * Each panel is a rack card built only from the control language (docs/CONTROLS.md), named by a small port, its continuous
 * controls modulation targets under its own root (createApp({ modRoots }) names the roots), its values a project part and
 * one history domain.  The pure helpers stay in their own modules (camera-rig.js, morph.js, picture-filter.js, and the
 * ramp's and the curve's mathematics): import those by path. */
export { createCameraPanel, createCameraView, createCssPort, directionSphere } from './camera.js';
export { createGradePanel, createGradeView, createGradeModel } from './grade.js';
export { createCurvesPanel, createCurvesView, createCurvesModel, curveEditor } from './curves.js';
export { pictureFilter } from './picture-filter.js';
export { createXYPanel } from './xy.js';
export * as morph from './morph.js';
export { createLanesPanel, createLanesView } from './lanes.js';
export { createRampPanel, createRampView, rampLUT } from './ramp.js';
