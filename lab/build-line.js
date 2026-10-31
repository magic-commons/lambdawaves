/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line.
   021 D1: its own module (it lived in rack.js), so no module imports from rack.js and the app's dependency graph has no cycle. */
export const BUILD_LINE = '0.9.9-beta · The Performance Pass · 2026-10-31';   // THE ONLY PLACE THE NUMBER LIVES: the ABOUT face, the copy dump and the proof all read it back through LW.build (ANTI-PATTERN 6)
