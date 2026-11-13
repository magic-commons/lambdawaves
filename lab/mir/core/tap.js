/* core/tap.js — THE ONE TAP AND THE ONE HOLD, as numbers (1.6.0-alpha.4).  A leaf with no import, so a module that sits in the
 * kit's import ring (window/rail.js, shell/rack.js, shell/transport.js) can read it while its own constants are being made;
 * kit.js re-exports it, and that is where an app reads it (`TAP`, `holdTap`, `onContext`, `tapWatcher`).
 *
 *   ms · px   THE ONE DOUBLE-TAP LAW (Josh, 2026-10-07, call 20: "300ms"): two presses within 300 ms and 14 px
 *   hold      THE HOLD IS 550 (Josh, 2026-11-12: "perhaps a longer time; 550?"): a still press this long lifts, opens or stores,
 *             wherever the kit has a long press (the rack head, a window's rail, the transport bar, INFORMATIONAL, the XY corner,
 *             the route pop-over, the timeline's knob menu, holdTap / onContext)
 *   slop      the stillness radius of that hold, px (a drag's own start threshold is each control's) */
export const TAP = Object.freeze({ ms: 300, px: 14, hold: 550, slop: 8 });
