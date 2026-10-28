/* tier.js — THE WORK TIERS (§13), out of rack.js (021 G1): every cause asks for one; a frame coalesces to the strongest.
   A module reads TIER here, never from rack.js (rack.js imports and re-exports it), so no app module imports from rack.js for it. */
export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
export const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];
