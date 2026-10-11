/* tests/helpers/field-law.mjs — THE FIELD LAW's constants, each named by its metric (PLAN §J-2, the P7c ruling).
 *
 * PROVISIONAL until PAIR B2's field law lands; the integrator reconciles at merge.  This file was written by P4, not by the field law:
 * PAIR B2 ships the measured constants (tests/field-law.browser-test.mjs and its helper) and its file REPLACES this one.  The numbers below
 * are the ruling's own text ("picture good to 2e-5 RMS (worst voxel 2e-4)" for hydrogen, "0.03 % of ρmax" for a molecule's density); the
 * readings beside them are PAIR B's probe (agent-ad656ab600f3fbae8 .tmp/fieldlaw-probe.out: 1s+2pz at t = 3.7 and water, 64³; f16 rounds
 * toward zero on this rig).  tests/status.test.mjs holds lab/status.js' FIELD_LAW equal to what this file exports, so a number that moves
 * here at the merge turns that suite RED until the lab constant follows — the lab cannot import tests/ (the deployed site serves lab/ alone).
 */
export const FIELD_LAW = Object.freeze({
  hydrogen: Object.freeze({
    rms: 2e-5,          // RMS of |ψ_GPU − ψ_closed form| over the grid · read 2.3e-6 (64³), 2.3e-6 (96³)
    worstVoxel: 2e-4,   // worst voxel of |ψ_GPU − ψ_closed form| · read 1.68e-4 (64³), 1.29e-4 (96³)
  }),
  density: Object.freeze({
    ofRhoMax: 3e-4,     // worst voxel of |ρ_GPU − ρ_f64| as a share of ρmax (0.03 %) · read 2.86e-4 on water (64³)
  }),
});
