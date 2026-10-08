/* timeline/icons.js — the timeline's three tool glyphs now live in the one icon library (glyph.js: edit, select, scrub;
 * docs/ICONS.md).  This module keeps its exports so editor.js and any app that imported them read the same strings. */
import { glyphSvg } from '../glyph.js';

export const EDIT_ICON = glyphSvg('edit', 'gly gly-edit', 16);
export const SELECT_ICON = glyphSvg('select', 'gly gly-select', 16);
export const SCRUB_ICON = glyphSvg('scrub', 'gly gly-scrub', 16);

export const TIMELINE_ICONS = { edit: EDIT_ICON, select: SELECT_ICON, scrub: SCRUB_ICON };
