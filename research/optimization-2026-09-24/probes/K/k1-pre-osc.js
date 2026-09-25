/* PREFILE for k1-variants.js: why the geometry memo moved the OSCILLATOR (space 2) texels, and which form does not */
globalThis.__K_STATES = ['oscillator', 'momentum', 'h91', 'gas', 'h2'];
globalThis.__K_RES = [64, 96, 128];
globalThis.__K_VARIANTS = (X) => {
  const { BASE, must, LOOP_FROM, LOOP_TO, GEO_FROM, GEO_TO } = X;
  const T_FROM = '        let t = r * r;\n        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));\n        f = M.c.z * ipow(r, l) * L * exp(-0.5 * t) * ipow(st, am) * D;';
  const geo = must(must(BASE, LOOP_FROM, LOOP_TO), GEO_FROM, GEO_TO);
  return {
    ship: BASE,
    shipDot: must(BASE, T_FROM, T_FROM.replace('let t = r * r;', 'let t = dot(q, q);')),
    geo,
    geoDot: must(geo, T_FROM, T_FROM.replace('let t = r * r;', 'let t = dot(q, q);')),
    geoDirect: must(geo, T_FROM, '        let qo = pos - M.ctr.xyz; let ro = length(qo); let t = ro * ro;\n        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));\n        f = M.c.z * ipow(ro, l) * L * exp(-0.5 * t) * ipow(st, am) * D;'),
    geoDirectT: must(geo, T_FROM, '        let qo = pos - M.ctr.xyz; let ro = length(qo); let t = ro * ro;\n        let L = M.lag0.x + t * (M.lag0.y + t * (M.lag0.z + t * (M.lag0.w + t * (M.lag1.x + t * M.lag1.y))));\n        f = M.c.z * ipow(r, l) * L * exp(-0.5 * t) * ipow(st, am) * D;'),
  };
};
