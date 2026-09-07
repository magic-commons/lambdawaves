/* ══════════════════════════════════════════════════════════════════════════════
 * VENDORED FILE — lab/mir/glyph.js
 *
 *   Source     $MB/app/glyph.js  (MB = the local MANDELBROT checkout; see PORT-NOTES.md — wave 68
 *              took the absolute path out of a file that ships)
 *   Taken      2026-09-05, at 453 lines
 *   sha256     513cd3120ec539f13e139d940d089f29cf71cbbc5cad427445351fb6c3ab3831
 *   Forced     2 edits — both the M4 overlay sink, which is MANDELBROT's diagnostics
 *              bus and does not exist here.  Every other byte below this header is
 *              the source, unmodified.  No glyph was redrawn, re-scaled or renamed.
 *
 * THE LAW OF THIS FILE: IT IS MAINTAINED BY DIFF AGAINST ITS SOURCE, NEVER
 * REWRITTEN.  These are JOSH'S OWN DRAWINGS and an upstream correction to one of
 * them must still be a three-line patch a year from now.  So: do not reformat it,
 * do not re-order it, do not tidy it, do not "improve" a comment, do not add a
 * glyph here — add it upstream and re-take the file — and do not let a linter near
 * it.  Every forced change carries a `λWAVES:` marker on the line above and is
 * listed in PORT-NOTES.md with its reason.
 *
 * WHAT USES IT: lab/kit.js (`device()`'s header chips) and lab/rack.js (the rack's
 * own chrome).  Sizing is the caller's, exactly as the module says; our surfaces
 * pass no `size` and let lab.css own it, which is why every call site here reads
 * `glyphEl(name, cls)` and never a pixel count.
 *
 * To take an upstream fix:
 *   diff -u "<source>/glyph.js" lab/mir/glyph.js     # the header + the two marked lines
 *   cp "<source>/glyph.js" lab/mir/glyph.js && re-apply this header and the markers
 * ══════════════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════════
 * glyph.js — ONE DRAWING PER MEANING, and never a text character
 *
 * WHY THIS MODULE EXISTS.  The app had been spelling its small icons as
 * literal characters in strings: 'X' for close, an info symbol for the hint
 * button, a shaded square for a folder, a lozenge for render.  Each of those
 * is a request to whatever font the device happens to resolve, and the three
 * devices this app ships to answer it differently:
 *
 *   - iOS/iPadOS substitutes its own EMOJI for many of them, arriving in full
 *     colour with a baked-in shape, ignoring the surrounding `color` entirely.
 *     Josh's chrome is monochrome; a colour emoji is instantly foreign.
 *   - the glyph's ADVANCE WIDTH is the font's business, not the layout's, so a
 *     character centred on one device sits off-centre on another.
 *   - a font without the codepoint at all renders the notdef box.
 *
 * A path is none of those things.  It is the same shape everywhere, it takes
 * its colour from `currentColor` like text does, and it is centred because the
 * geometry says so.
 *
 * ⟡ THE GLYPHS CARRY THEIR OWN PAINT.  Every shape below states `fill` or
 * `stroke` as a PRESENTATION ATTRIBUTE, not through a stylesheet.  Two reasons,
 * and the second is the load-bearing one:
 *
 *   1. a glyph can then be dropped into any surface — window, rail, chip,
 *      toast — without that surface needing a rule for it;
 *   2. THE APP HAS ALREADY LOST A RULE THIS WAY.  On 2026-08-26 an
 *      unterminated comment in index.html silently swallowed `.circ > svg`;
 *      the rule was in the file, it matched its element, and it was absent
 *      from the CSSOM.  The corner icons had never been sized.  A drawing that
 *      depends on no stylesheet cannot be erased by a stylesheet's accident.
 *
 * Presentation attributes are also the LOWEST-priority source of colour, below
 * every CSS rule, so a surface that DOES want to restyle a glyph still can.
 * They are a floor, not a ceiling.
 *
 * THE GRID IS 24×24 for every glyph, matching the app's existing `ico-mandel`,
 * with an optical margin of about 2.5 units. Sizing is the caller's — set
 * width/height in CSS on the parent, or pass `size`.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* λWAVES: forced edit 1/2 — overlay.js is MANDELBROT's M4 diagnostics sink and has no counterpart here; our gate reads the DOM. */
// import { publishM4 } from './overlay.js';

const NS = 'http://www.w3.org/2000/svg';

/* ⟡ EVERY GLYPH IS SIZED, AND SIZED HERE, NOT BY A STYLESHEET.
 *
 * An <svg> carrying a viewBox and NO width/height is sized by CSS alone; with
 * no rule to find, engines fall back to the replaced-element default (300×150)
 * or stretch it to the parent.  Either way the button is destroyed.
 *
 * This module was written arguing that a drawing which needs no stylesheet
 * cannot be erased by a stylesheet's accident — and then the first four call
 * sites were checked and NONE of the surfaces they land on had a rule to size
 * an svg: no `.crail-chip svg`, no ink rule on `.sethint`.  The argument was
 * right and the code had not yet honoured it.  So a size always exists, the
 * caller may override it, and CSS may still win over both because width/height
 * attributes are presentation attributes.
 */
const DEFAULT_SIZE = 20;

/* Stroke weight is ONE number for the whole set, so a close and a play beside
   each other read as the same hand.  1.9 at 24 units is ~0.8px at an 18px icon,
   which survives a 1× display without going wispy. */
const W = 1.9;

/* Shorthand for the stroked-shape attribute block every outline glyph repeats.
   Round caps and joins throughout — the app's drawing language is round (the
   corner circles, the chips, the knob arcs). */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="' + W +
               '" stroke-linecap="round" stroke-linejoin="round"';

/**
 * THE SET.  Each entry is the INNER markup of a 24×24 viewBox.
 *
 * Keys are named for MEANING, not for the character they replaced — `close`,
 * not `times`.  When a glyph's drawing changes the name should not have to.
 */
const GLYPHS = {
  /* ── close.  Two strokes crossing at centre, inset 6.7 so the cross sits
     inside a round chip without touching its edge.  Deliberately NOT the
     multiplication sign it replaced: that character is 0.55 em wide in most
     faces and rides the maths axis, so it sat high in a 1:1 button. */
  close:
    '<path ' + STROKE + ' d="M7.1 7.1 L16.9 16.9 M16.9 7.1 L7.1 16.9"/>',

  /* ── leave.  The close chip's OTHER state, under the Leave-Chips setting:
     the window hides but its controls stay on screen.  A single bar, because
     the act is a MINIMISE and not a dismissal — and drawn at the same weight
     and inset as `close` so the chip does not change visual mass when the
     setting is flipped.  It replaces U+2212 MINUS SIGN, which iOS renders from
     the maths axis and therefore sat visibly higher than the cross it
     alternates with. */
  leave:
    '<path ' + STROKE + ' d="M6.6 12 L17.4 12"/>',

  /* ── reopen.  The second face of the Leave-Chips close toggle.  A window
     hidden behind a live rail shows this square to say that the next tap puts
     the device back.  It is drawn, not a hollow-square font character, and it
     shares the close/leave weight and rounded drawing language. */
  reopen:
    '<rect x="6.4" y="6.4" width="11.2" height="11.2" rx="1.8" ' + STROKE + '/>',

  /* ── north.  A solid north-east arrow in the soft, chunky language of the
     supplied target: broad stem, deep arrow head, and a curve at every outer
     vertex.  The extents balance around the 12,12 viewBox centre so rotating
     the compass about its box centre does not make the mark orbit. */
  north:
    '<path fill="currentColor" transform="translate(1 0)" d="M5 2.2 H17.2 ' +
    'C19.75 2.2 21.8 4.25 21.8 6.8 V18.1 ' +
    'C21.8 20.35 19.95 22.2 17.7 22.2 ' +
    'C15.45 22.2 13.6 20.35 13.6 18.1 V15.35 L8.25 20.7 ' +
    'C6.55 22.4 3.8 22.4 2.1 20.7 ' +
    'C0.4 19 0.4 16.25 2.1 14.55 L7.45 9.2 H5 ' +
    'C2.35 9.2 0.2 7.05 0.2 4.7 C0.2 3.25 2.35 2.2 5 2.2 Z"/>',

  /* ── info.  A ring with a tittle and a stem.  The stem is a stroke rather
     than a letter so it stays a stem at every size; an actual "i" would be
     hinted differently by every font and go crooked when small. */
  info:
    '<circle cx="12" cy="12" r="9.05" ' + STROKE + '/>' +
    '<circle cx="12" cy="7.6" r="1.15" fill="currentColor"/>' +
    '<path ' + STROKE + ' d="M12 10.9 L12 17.1"/>',

  /* ── gallery.  Four panes: the contact sheet, which is what the window
     actually shows.  Rounded to the same 1.5 the app's cards use. */
  gallery:
    '<rect x="3.3" y="3.3" width="7.6" height="7.6" rx="1.5" ' + STROKE + '/>' +
    '<rect x="13.1" y="3.3" width="7.6" height="7.6" rx="1.5" ' + STROKE + '/>' +
    '<rect x="3.3" y="13.1" width="7.6" height="7.6" rx="1.5" ' + STROKE + '/>' +
    '<rect x="13.1" y="13.1" width="7.6" height="7.6" rx="1.5" ' + STROKE + '/>',

  /* ── render.  The lozenge Josh already had, kept because it is HIS ink for
     this button — but drawn as a rotated square with a true centre, and given
     an inner facet so it reads as an object being cut rather than an empty
     outline.  Render is the act that produces a thing. */
  render:
    '<path ' + STROKE + ' d="M12 2.7 L21.3 12 L12 21.3 L2.7 12 Z"/>' +
    '<path ' + STROKE + ' opacity="0.55" d="M12 7.4 L16.6 12 L12 16.6 L7.4 12 Z"/>',

  /* ── folder.  Tab and body, the universal shape.  This is the placeholder a
     folder wears when it has no picture yet, so it must read as EMPTY without
     reading as broken — hence an open outline and no contents drawn. */
  folder:
    '<path ' + STROKE + ' d="M2.9 6.6 A1.7 1.7 0 0 1 4.6 4.9 L9.4 4.9 ' +
    'L11.6 7.5 L19.4 7.5 A1.7 1.7 0 0 1 21.1 9.2 L21.1 17.7 ' +
    'A1.7 1.7 0 0 1 19.4 19.4 L4.6 19.4 A1.7 1.7 0 0 1 2.9 17.7 Z"/>',

  /* ── transport.  Play is solid because it is the primary act; pause is two
     bars of the same visual mass so the button does not flicker in weight when
     it toggles.  THE TWO MUST BALANCE — a hollow play beside a solid pause
     makes the transport look like it is doing something when it is not. */
  play:
    '<path fill="currentColor" d="M8.9 6.15 A0.9 0.9 0 0 1 10.3 5.4 ' +
    'L18.05 11.25 A0.95 0.95 0 0 1 18.05 12.75 L10.3 18.6 ' +
    'A0.9 0.9 0 0 1 8.9 17.85 Z"/>',
  pause:
    '<rect x="7.6" y="5.6" width="3.4" height="12.8" rx="1.35" fill="currentColor"/>' +
    '<rect x="13" y="5.6" width="3.4" height="12.8" rx="1.35" fill="currentColor"/>',

  /* ── direction.  Small solid triangles, lighter than play so a DIR chip does
     not compete with the transport beside it. */
  dirNext:
    '<path fill="currentColor" d="M9.4 6.4 L17.4 11.4 A0.7 0.7 0 0 1 17.4 12.6 ' +
    'L9.4 17.6 A0.7 0.7 0 0 1 8.3 17 L8.3 7 A0.7 0.7 0 0 1 9.4 6.4 Z"/>',
  dirPrev:
    '<path fill="currentColor" d="M14.6 6.4 L6.6 11.4 A0.7 0.7 0 0 0 6.6 12.6 ' +
    'L14.6 17.6 A0.7 0.7 0 0 0 15.7 17 L15.7 7 A0.7 0.7 0 0 0 14.6 6.4 Z"/>',

  /* ── plus.  For ADD COLOUR and any other "one more of these" chip. */
  plus:
    '<path ' + STROKE + ' d="M12 5.6 L12 18.4 M5.6 12 L18.4 12"/>',

  /* ── grip.  Six dots, the drag-handle idiom.  It replaces U+283F BRAILLE
     PATTERN DOTS-123456, which is a genuinely bad choice for a handle: it is a
     BRAILLE CELL, so a screen reader may announce it as a letter, and its size
     is set by the braille metrics of whatever font answers rather than by the
     control it sits in. */
  grip:
    '<circle cx="9" cy="7" r="1.45" fill="currentColor"/>' +
    '<circle cx="15" cy="7" r="1.45" fill="currentColor"/>' +
    '<circle cx="9" cy="12" r="1.45" fill="currentColor"/>' +
    '<circle cx="15" cy="12" r="1.45" fill="currentColor"/>' +
    '<circle cx="9" cy="17" r="1.45" fill="currentColor"/>' +
    '<circle cx="15" cy="17" r="1.45" fill="currentColor"/>',

  /* ── clear.  The backspace tablet.  U+232B is in very few UI faces and on
     iOS resolves to a colour emoji key. */
  clear:
    '<path ' + STROKE + ' d="M8.6 5.4 L20.1 5.4 A1.7 1.7 0 0 1 21.8 7.1 ' +
    'L21.8 16.9 A1.7 1.7 0 0 1 20.1 18.6 L8.6 18.6 L2.4 12 Z"/>' +
    '<path ' + STROKE + ' d="M11.6 9.4 L16.8 14.6 M16.8 9.4 L11.6 14.6"/>',

  /* ── tune.  A crossed circle: the operator that ADDS a motif into a copy. */
  tune:
    '<circle cx="12" cy="12" r="8.4" ' + STROKE + '/>' +
    '<path ' + STROKE + ' d="M12 7.2 L12 16.8 M7.2 12 L16.8 12"/>',

  /* ── Julia restore.  This is not a spiral or a hand-drawn fractal sign.
     The path is the largest filled-boundary contour of the actual quadratic
     Julia set z² + c at c = -0.123 + 0.745i, traced on a 384² grid at 160
     iterations and simplified from 3,467 to 105 vertices for icon weight.
     The contour is a solid mark: currentColor carries the surface's ink and
     evenodd keeps the traced folds deterministic at icon scale. */
  juliaRestore:
    '<path fill="currentColor" fill-rule="evenodd" stroke="none" d="' +
    'M2.5 8.03 L3.25 7.65 L2.87 7.16 L3.37 7.59 L3.74 6.78 L5.11 7.03 ' +
    'L4.49 6.16 L4.98 5.73 L4.55 5.36 L5.17 5.36 L5.67 6.35 L5.11 7.09 ' +
    'L6.35 6.35 L7.34 6.41 L7.22 5.67 L9.95 8.4 L9.83 6.35 L10.2 5.92 ' +
    'L9.83 5.67 L11.63 5.48 L11.07 4.74 L11.5 4.42 L11.69 5.36 ' +
    'L12.62 5.05 L12.31 5.6 L11.69 5.48 L12.12 6.1 L12 7.59 L10.01 8.52 ' +
    'L11.69 9.08 L12 8.71 L12.75 9.39 L12.99 8.77 L13.12 9.7 L14.42 10.45 ' +
    'L14.42 9.39 L15.1 9.45 L15.04 9.02 L15.35 9.39 L14.48 10.7 ' +
    'L14.67 12.25 L15.29 12.19 L14.61 12.75 L14.05 15.48 L15.48 14.36 ' +
    'L16.28 14.48 L16.16 13.99 L17.46 14.61 L17.71 13.68 L17.71 14.48 ' +
    'L18.21 14.48 L17.65 14.61 L18.15 15.42 L18.4 15.17 L18.71 16.84 ' +
    'L19.2 15.79 L20.13 15.6 L20.69 16.35 L20.82 15.73 L21.44 15.54 ' +
    'L21.5 16.04 L20.75 16.35 L21.07 16.91 L20.63 16.41 L20.07 17.28 ' +
    'L18.64 16.91 L17.65 17.65 L16.66 17.59 L16.78 18.33 L14.05 15.6 ' +
    'L13.99 17.77 L13.3 18.52 L12.37 18.52 L12.93 18.83 L12.5 19.58 ' +
    'L12.31 18.64 L11.38 18.83 L11.57 18.4 L12.31 18.52 L11.88 17.9 ' +
    'L12 16.41 L13.99 15.48 L11.25 14.61 L11.01 15.23 L10.88 14.3 ' +
    'L9.45 13.55 L9.39 11.88 L8.77 11.32 L9.39 11.25 L9.95 8.52 ' +
    'L8.96 9.33 L7.72 9.52 L7.78 9.95 L6.54 9.39 L6.66 10.01 ' +
    'L6.29 10.08 L6.29 9.52 L5.73 9.52 L6.29 9.21 L5.29 7.16 ' +
    'L4.61 8.15 L3.68 8.15 L3.37 7.65 L3.12 8.21 L2.5 8.03 Z"/>',

  /* ── lock.  A CLOSED padlock: body, shackle, keyhole stem.  The same body
     and stem colors.js draws for its rail lock (nameIconButton, kind 'lock'),
     with the shackle brought home because this one means LOCKED, not "lock
     me".  It replaces U+1F512 in the controls-frozen badge (window.js's
     ensureLockChip) — the emoji the sweep could never see because the badge
     only exists after a person presses L, and which iOS painted in colour
     inside monochrome chrome. */
  lock:
    '<rect x="5.5" y="10.5" width="12" height="9" rx="2" ' + STROKE + '/>' +
    '<path ' + STROKE + ' d="M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5"/>' +
    '<path ' + STROKE + ' d="M12 14 V16.2"/>',

  /* ── Mandelbrot, vertical.  Moved verbatim from settings.js so the SAVE
     FRACTAL action and the dual-view edge control spend one mathematical
     drawing.  The boundary is the real cardioid, followed by the period-2
     disc, p3/p4 bulbs and antenna, all already rotated so minus-x points up. */
  mandelbrot:
    '<path fill="currentColor" stroke="none" d="M12.00 20.35 L12.00 20.38 L12.02 20.45 ' +
    'L12.08 20.57 L12.18 20.72 L12.33 20.88 L12.56 21.05 L12.85 21.20 L13.21 21.31 ' +
    'L13.62 21.37 L14.09 21.36 L14.59 21.26 L15.11 21.06 L15.62 20.76 L16.10 20.35 ' +
    'L16.53 19.84 L16.89 19.23 L17.15 18.55 L17.30 17.80 L17.32 17.01 L17.20 16.20 ' +
    'L16.95 15.40 L16.55 14.64 L16.03 13.94 L15.38 13.33 L14.63 12.83 L13.80 12.46 ' +
    'L12.92 12.23 L12.00 12.15 L11.08 12.23 L10.20 12.46 L9.37 12.83 L8.62 13.33 ' +
    'L7.97 13.94 L7.45 14.64 L7.05 15.40 L6.80 16.20 L6.68 17.01 L6.70 17.80 ' +
    'L6.85 18.55 L7.11 19.23 L7.47 19.84 L7.90 20.35 L8.38 20.76 L8.89 21.06 ' +
    'L9.41 21.26 L9.91 21.36 L10.38 21.37 L10.79 21.31 L11.15 21.20 L11.44 21.05 ' +
    'L11.67 20.88 L11.82 20.72 L11.92 20.57 L11.98 20.45 L12.00 20.38 L12.00 20.35 Z"/>' +
    '<circle cx="12.00" cy="10.10" r="2.05" fill="currentColor" stroke="none"/>' +
    '<circle cx="12.00" cy="7.57" r="0.48" fill="currentColor" stroke="none"/>' +
    '<circle cx="18.10" cy="17.28" r="0.77" fill="currentColor" stroke="none"/>' +
    '<circle cx="5.90" cy="17.28" r="0.77" fill="currentColor" stroke="none"/>' +
    '<circle cx="16.35" cy="20.61" r="0.36" fill="currentColor" stroke="none"/>' +
    '<circle cx="7.65" cy="20.61" r="0.36" fill="currentColor" stroke="none"/>' +
    '<path class="ant" fill="none" stroke="currentColor" stroke-width="1.1" ' +
    'stroke-linecap="round" d="M12.00 1.90 L12.00 7.08"/>',

  /* ── morph.  One period of a sine, the LFO's own shape.  Drawn rather than
     borrowed from U+223F, which most faces do not carry at all. */
  morph:
    '<path ' + STROKE + ' d="M2.9 12 C5.3 5.1, 9.1 5.1, 12 12 ' +
    'S18.7 18.9, 21.1 12"/>',

  /* ── the three state marks.  Same 24-unit centre, so a card whose state
     changes does not appear to jump. */
  dot:      '<circle cx="12" cy="12" r="4.15" fill="currentColor"/>',
  pending:  '<circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" ' +
            'stroke-width="' + W + '" stroke-linecap="round" stroke-dasharray="2.6 3.6"/>',
  warn:     '<path ' + STROKE + ' d="M12 3.6 L21.6 19.9 L2.4 19.9 Z"/>' +
            '<path ' + STROKE + ' d="M12 9.9 L12 14.3"/>' +
            '<circle cx="12" cy="17.1" r="1.05" fill="currentColor"/>',

  /* ── swap.  Two arrows passing, for exchanging one surface with another.
     It replaces U+21C4, which is missing from several UI faces outright. */
  swap:
    '<path ' + STROKE + ' d="M3.4 9.1 L20.6 9.1 M16.6 5.1 L20.6 9.1 L16.6 13.1"/>' +
    '<path ' + STROKE + ' d="M20.6 16.5 L3.4 16.5 M7.4 12.5 L3.4 16.5 L7.4 20.5"/>',

  /* ── rename.  A pencil, for the rename affordance on a saved entry.  It
     replaces U+270E LOWER RIGHT PENCIL, which iOS renders as a full-colour
     emoji pencil — yellow barrel, pink eraser — inside monochrome chrome.
     Drawn as a nib and a body so it still reads as a pencil at 14 px. */
  rename:
    '<path ' + STROKE + ' d="M16.4 3.9 L20.1 7.6 L8.4 19.3 L3.6 20.4 L4.7 15.6 Z"/>' +
    '<path ' + STROKE + ' d="M14.1 6.2 L17.8 9.9"/>',

  /* ── check.  A confirmation mark for a settled state. */
  check:
    '<path ' + STROKE + ' d="M4.9 12.6 L9.7 17.4 L19.1 6.9"/>',

  /* ── compact.  THE SIZE CHIP (Josh, Note 9: "Compact (idk what icon this
     should be)").  TWO BARS CLOSING ON THE VERTICAL AXIS, with the arrows that
     say which way they travel: the card narrows and grows taller, which is his
     whole sentence — "this will increase the height while narrowing the device"
     — so the mark has to say NARROW rather than SMALLER.  A plain shrink-arrow
     square would have said the second thing.
     Drawn, not typed: the obvious characters here are U+2B0C and the CJK
     bracket forms, and iOS resolves both from faces this app does not ship. */
  compact:
    '<path ' + STROKE + ' d="M7.6 3.9 L7.6 20.1 M16.4 3.9 L16.4 20.1"/>' +
    '<path ' + STROKE + ' d="M2.2 12 L6.5 12 M4.5 9.6 L6.9 12 L4.5 14.4"/>' +
    '<path ' + STROKE + ' d="M21.8 12 L17.5 12 M19.5 9.6 L17.1 12 L19.5 14.4"/>',

  /* ── save.  A FLOPPY DISK IN A CIRCLE — Josh, Note 9, in those words: *"the
     save button … Let it be an icon that's a floppy disk in a circle."*  R4
     drew it in anim.js as a stopgap (the m2powIcon precedent) and wrote down
     that glyph.js should own it; this is that.
     The floppy is R4's outline scaled 0.62 about the box centre so its rounded
     corners clear the ring by 1.3 units — the diagonal is what binds, not the
     width, because a square inside a circle meets it at the corner.  Never a
     text character: U+1F4BE arrives from iOS as a colour emoji. */
  save:
    '<circle cx="12" cy="12" r="9.2" ' + STROKE + '/>' +
    '<path ' + STROKE + ' d="M7.78 6.79 H14.23 L17.21 9.77 V16.22 ' +
    'A0.99 0.99 0 0 1 16.22 17.21 H7.78 A0.99 0.99 0 0 1 6.79 16.22 V7.78 ' +
    'A0.99 0.99 0 0 1 7.78 6.79 Z"/>' +
    '<path ' + STROKE + ' d="M9.52 6.79 V9.89 H13.61 V6.79"/>' +
    '<path ' + STROKE + ' d="M9.15 17.21 V13.36 H14.85 V17.21"/>',

  /* ── chevronDown.  The ▾ the preset bar opens its folder list with, and the
     caret each folder header turns.  R4 rotated `dirNext` by a quarter turn in
     the stylesheet and named the seam; a chevron is not a triangle and a rule
     that rotates one drawing into another's meaning is a rule that gets lost
     (index.html swallowed `.circ > svg` exactly that way). */
  chevronDown:
    '<path ' + STROKE + ' d="M6.6 9.4 L12 15.2 L17.4 9.4"/>',

  /* ── expand.  Compact's other face, so ONE chip can say which way the next
     press goes: the same two bars, the arrows pointing out. */
  expand:
    '<path ' + STROKE + ' d="M7.6 3.9 L7.6 20.1 M16.4 3.9 L16.4 20.1"/>' +
    '<path ' + STROKE + ' d="M5.2 12 L1.7 12 M3.7 9.6 L1.3 12 L3.7 14.4"/>' +
    '<path ' + STROKE + ' d="M18.8 12 L22.3 12 M20.3 9.6 L22.7 12 L20.3 14.4"/>',

  /* ── work-bar lane.  Two separated bars against the edge they occupy; the
     empty centre is deliberate because PRESET and TIMING never become one
     dock.  These are the two faces of Modulation's shared lane chip. */
  barsTop:
    '<path ' + STROKE + ' d="M3.1 5.2 H9.2 M14.8 5.2 H20.9"/>' +
    '<path ' + STROKE + ' opacity="0.42" d="M3.1 18.8 H20.9"/>',
  barsBottom:
    '<path ' + STROKE + ' opacity="0.42" d="M3.1 5.2 H20.9"/>' +
    '<path ' + STROKE + ' d="M3.1 18.8 H9.2 M14.8 18.8 H20.9"/>'
};

/** The names this module can draw, for a gate to enumerate against the DOM. */
export function glyphNames() { return Object.keys(GLYPHS); }

/** True when `name` is one of them — callers should not guess. */
export function hasGlyph(name) {
  return Object.prototype.hasOwnProperty.call(GLYPHS, name);
}

/**
 * The glyph as MARKUP, for the innerHTML sites that already exist.
 *
 * `cls` becomes the svg's class so a surface can still size or restyle it.
 * An unknown name returns '' rather than throwing — a missing icon must never
 * be able to take down a window that was only trying to decorate a button.
 * It is reported instead, once, so it cannot rot silently.
 */
export function glyphSvg(name, cls, size) {
  const body = GLYPHS[name];
  if (!body) { missing(name); return ''; }
  const d = Number.isFinite(size) ? size : DEFAULT_SIZE;
  const dim = ' width="' + d + '" height="' + d + '"';
  return '<svg class="' + (cls || 'gly gly-' + name) + '" viewBox="0 0 24 24"' +
         dim + ' aria-hidden="true" focusable="false">' + body + '</svg>';
}

/**
 * The glyph as an ELEMENT, for the sites that build DOM rather than strings.
 *
 * ⟡ BUILT THROUGH innerHTML ON A NAMESPACED PARENT, not by assembling nodes.
 * `createElement('svg')` makes an *HTML* element named svg, which lays out as
 * an unknown inline box and draws nothing — a trap this codebase can hit
 * because most of its DOM is built with a plain `mk()` helper.  Setting
 * innerHTML on a real SVG element parses the children in the SVG namespace.
 */
export function glyphEl(name, cls, size) {
  if (typeof document === 'undefined') return null;
  const body = GLYPHS[name];
  if (!body) { missing(name); return null; }
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', cls || 'gly gly-' + name);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const d = Number.isFinite(size) ? size : DEFAULT_SIZE;
  svg.setAttribute('width', String(d));
  svg.setAttribute('height', String(d));
  svg.innerHTML = body;
  return svg;
}

/**
 * Replace an element's contents with a glyph, keeping the element itself.
 *
 * This is the one to use for a TOGGLING button — play/pause, normal/invert.
 * It returns the element so a caller can chain, and it is idempotent: setting
 * the same glyph twice redraws the same shape rather than accumulating.
 *
 * `label` sets aria-label at the same time, because a button whose only
 * content is an aria-hidden drawing has NO accessible name otherwise.  The two
 * belong in one call so they cannot drift apart — which is exactly how the app
 * ended up with buttons announcing a state they no longer showed.
 */
export function setGlyph(el, name, opts) {
  if (!el) return el;
  const o = typeof opts === 'string' ? { label: opts } : (opts || {});
  const label = o.label;
  const svg = glyphEl(name, o.cls || el.getAttribute('data-gly-cls') || undefined,
                      Number.isFinite(o.size) ? o.size : DEFAULT_SIZE);
  if (!svg) return el;
  el.textContent = '';
  el.appendChild(svg);
  el.setAttribute('data-gly', name);
  if (label) el.setAttribute('aria-label', label);
  return el;
}

/* Unknown names are reported ONCE each.  A per-name guard, not a global one,
   so a second distinct mistake is not hidden by the first. */
const told = new Set();
function missing(name) {
  const k = String(name);
  if (told.has(k)) return;
  told.add(k);
  try {
    console.warn('glyph: no drawing named ' + JSON.stringify(k) +
                 ' — known: ' + Object.keys(GLYPHS).join(', '));
  } catch (e) { /* a console that refuses is not worth a second failure */ }
}

/* ── THE INSTRUMENT.  A gate must be able to ask the RUNNING app which glyphs
   it knows and which names a call site got wrong, so the sweep is verifiable
   from the browser instead of from the source.

   ⟡ THROUGH publishM4, NOT BY ASSIGNING window.__M4 DIRECTLY.  The direct form
   was written first and measured ABSENT from the live page: the app installs
   its own __M4 sink, and overlay.js's armM4() intercepts that assignment, so a
   plain `window.__M4 = window.__M4 || {}` here is simply overwritten by the
   real sink arriving later.  publishM4 QUEUES until the sink exists and then
   merges — which is the app's convention precisely because module order is not
   something any one module gets to know. */
/* λWAVES: forced edit 2/2 — the same sink, at its one call site.  Kept commented rather than deleted so the diff stays two lines. */
// try { publishM4({ glyphNames, glyphMissing: () => [...told] }); }
// catch (e) { /* a page without the overlay is still a page that can draw */ }
