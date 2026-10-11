// opus1-g-estimates — the tree's own estimate-vs-actual record (BUILD files, quoted lines), and two of the plan's numbers re-derived.
import { writeFileSync } from 'node:fs';
const rows = [ // [build, kind, estimate, actual, source line]
  ['0.5.0 A7 occlusion', 'add', 25, 28, 'A7-BUILD.md: "+28 … The design estimated +25"'],
  ['0.5.0 C6 project-store', 'add', 220, 436, 'C6-BUILD.md: "436 lines against the 220 estimated"'],
  ['0.5.0 C6B step 3 session', 'add', 65, 38, 'C6B-BUILD.md: "+38 … estimated step 3 at ≈ +65"'],
  ['0.5.0 C7B film card road', 'add', 45, 91, 'C7B-BUILD.md: "card road cost +91 at step 1 where +45 was estimated"'],
  ['0.5.0 C7B whole', 'net', -15, 40, 'C7B-BUILD.md: "The design estimated −15 … It lands +40"'],
  ['0.5.0 C2 theme', 'subtract', -160, -124, 'C2-BUILD.md: "−124 … The design estimated ≈ −160; the brief\'s −250 to −350"'],
  ['0.5.0 C7 render-exact', 'subtract', -1500, -716, 'C7-BUILD.md: "C7\'s own −716 … The plan estimated 1,200–1,800"'],
  ['0.5.1 D1', 'subtract', -70, -35, 'D1-BUILD.md: "The brief\'s estimate was ≈ −70: the block is ≈ 35 lines as planned"'],
];
const ratio = (k) => rows.filter((r) => r[1] === k).map((r) => +(r[3] / r[2]).toFixed(2));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const adds = ratio('add'), subs = ratio('subtract');
// the plan's own numbers re-derived
const T_au = 2 * Math.PI * 7200;          // lcm(2n^2, n ≤ 6) = 7200 → E in units of 1/7200 Eh → T = 2π·7200
const lcm = [2, 8, 18, 32, 50, 72].reduce((a, b) => { const g = (x, y) => (y ? g(y, x % y) : x); return a * b / g(a, b); });
const out = { rows, addRatios: adds, addMedian: med(adds), subtractRatios: subs, subtractMedian: med(subs),
  reading: 'additions land at 0.6–2.0× (median ≈ 1.1, the two UI/road rows 2.0×); NAMED subtractions deliver 0.5–0.8× of their estimate (C7 0.48, D1 0.5, C2 0.78 vs design, 0.4–0.5 vs brief)',
  planConsequence: 'DRAFT 1 names −275 over the ladder: at the tree\'s own 0.5–0.8× it yields ≈ −140…−220; the cuts that lean on a subtraction to fit (0.6.4 −85, 0.6.5 −90, 0.7.2 −70) are the ones at risk',
  period: { lcm2n2: lcm, T_au, T_ps: +(T_au * 2.4188843265857e-17 * 1e12).toFixed(4), planSays: '1.094 ps, T = 14400π' } };
writeFileSync(new URL('./opus1-g-estimates.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ addRatios: adds, addMedian: out.addMedian, subtractRatios: subs, subtractMedian: out.subtractMedian, period: out.period }));
