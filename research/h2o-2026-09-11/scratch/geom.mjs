/* geom.mjs — the ledger geometry, once, for every scratch script.
 * ANG is 1/0.52917721092 to full double precision: PySCF's nist.BOHR reciprocal.  The ledger's rounded
 * 1.8897261246 is 3.5e-11 relative too large and alone costs 3.2e-10 in E_nuc (MEASURED, cmp-h2o.py). */
export const ANG = 1 / 0.52917721092;                                        // 1.8897261245650618
export const H2O_ANG = [ { Z: 8, c: [0, 0, 0.1173] }, { Z: 1, c: [0, 0.7572, -0.4692] }, { Z: 1, c: [0, -0.7572, -0.4692] } ];
export const toBohr = (a) => a.map((x) => ({ Z: x.Z, c: x.c.map((v) => v * ANG) }));
export const H2O = toBohr(H2O_ANG);
/** symmetric O–H stretch by ds ångström, bond angle fixed */
export function stretched(ds) {
  const O = H2O_ANG[0].c;
  return toBohr(H2O_ANG.map((at, i) => {
    if (i === 0) return at;
    const v = at.c.map((x, k) => x - O[k]), r = Math.hypot(v[0], v[1], v[2]), f = (r + ds) / r;
    return { Z: at.Z, c: v.map((x, k) => O[k] + f * x) };
  }));
}
