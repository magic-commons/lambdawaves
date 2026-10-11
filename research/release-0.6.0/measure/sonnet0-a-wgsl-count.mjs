// (a) count COMPUTE_WGSL (lab/field.js) lines by region, and price a SEPARATE equalizer module that copies only the space-0 evaluation
import fs from 'node:fs';
const src = fs.readFileSync('/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/field.js', 'utf8').split('\n');
const start = src.findIndex((l) => l.startsWith('const COMPUTE_WGSL')) + 1;       // 1-based line of the first template line
const end = src.findIndex((l, i) => i > start && l.startsWith('}`;')) + 1;
const body = src.slice(start - 1, end);
const idx = (re, from = 0) => body.findIndex((l, i) => i >= from && re.test(l));
const L = (re, from) => idx(re, from) + start;      // absolute 1-based field.js line
const marks = {
  header_structs_bindings: [start, L(/^var<workgroup> wmax/)],
  ipow: [L(/^fn ipow/), L(/^fn ipow/)],
  sphj: [L(/^\/\* the spherical Bessel/), L(/^\/\* P_l\(x\) by Bonnet/) - 1],
  legP: [L(/^\/\* P_l\(x\) by Bonnet/), L(/^@compute/) - 1],
  main_preamble_loopstart: [L(/^@compute/), L(/for \(var a = 0u; a < P.count/)],
  per_mode_common_before_branches: [L(/for \(var a = 0u; a < P.count/) + 1, L(/var f = 0.0;/)],
  space0_5_branch: [L(/P.space == 0u \|\| P.space == 5u/), L(/else if \(P.space == 4u\)/) - 1],
  space4_branch: [L(/else if \(P.space == 4u\)/), L(/else if \(P.space == 3u\)/) - 1],
  space3_branch: [L(/else if \(P.space == 3u\)/), L(/else if \(P.space == 6u\)/) - 1],
  space6_branch: [L(/else if \(P.space == 6u\)/), L(/else if \(P.space == 2u\)/) - 1],
  space2_branch: [L(/else if \(P.space == 2u\)/), L(/\} else \{/, L(/else if \(P.space == 2u\)/)) - 1],
  space1_else_branch: [L(/\} else \{/, L(/else if \(P.space == 2u\)/)), L(/let mm = select/) - 1],
  azimuth_phase_accumulate_end: [L(/let mm = select/), end],
};
const out = { COMPUTE_WGSL_firstLine: start, COMPUTE_WGSL_lastLine: end, totalLines: body.length, regions: {} };
for (const [k, [a, b]] of Object.entries(marks)) out.regions[k] = { from: a, to: b, lines: b - a + 1 };
// A separate equalizer module, as J.2-2 proposes, keeps: header (structs+bindings) + wmax, ipow, main preamble, per-mode geometry (NO memo), the space-0 branch,
// then the 6x6 form: 6 complex accumulators S_s += f*ce  (select by mode shell), then rho' = sum_{s,t} G[s][t] Re(S_s conj S_t), store sign*sqrt|rho'|, stats.
const keep = ['header_structs_bindings', 'ipow', 'main_preamble_loopstart', 'per_mode_common_before_branches', 'space0_5_branch', 'azimuth_phase_accumulate_end'];
let keepLines = keep.reduce((s, k) => s + out.regions[k].lines, 0);
out.copyOfSpace0Path_linesBeforeEqualizerAdditions = keepLines;
// the memo block is ONE very long line (field.js:~58) that a separate module need not carry; the long geometry lines are counted as one line each.
// additions (my estimate, counted line by line in the sketch below): Gamma uniform array + 6 accumulators (3 lines), the shell index per mode (1), the final 6x6 contraction (6), sign/store/stat (3), an extra binding for the table (1)
const sketch = [
  'struct Params { n:u32, count:u32, slot:u32, space:u32, half:f32, p1:f32, p2:f32, p3:f32 };  // 1',
  '@group(0) @binding(0) var<uniform> P: Params;  // 1',
  '@group(0) @binding(1) var<storage, read> modes: array<Mode>;  // 1',
  '@group(0) @binding(2) var outTex: texture_storage_3d<rgba16float, write>;  // 1',
  '@group(0) @binding(3) var<storage, read_write> stats: array<atomic<u32>>;  // 1',
  '@group(0) @binding(4) var<uniform> G: array<vec4<f32>, 9>;  // the 6x6 Gamma (36 f32 -> 9 vec4)  // 1',
  'var<workgroup> wmax: atomic<u32>;  // 1', 'struct Mode {...}  // 1', 'fn ipow  // 1',
  'main(): preamble 4, pos 2, loop head 2, geometry 3 (q,r,ct,st,phi), n/l/am/m 1, D 1, space-0 f 3, phase 2, accumulate S[shell]+= 2, close 3',
  'contraction rho = sum_s sum_t G[s,t]*Re(S_s conj(S_t)): 6 lines',
  'store sign*sqrt|rho| , stats atomicMax, barriers: 6',
];
out.sketchOfSeparateModuleLines = { approx_total_wgsl: 9 + 1 + 4 + 2 + 2 + 3 + 1 + 1 + 3 + 2 + 2 + 3 + 6 + 6, sketch };
out.reading = 'J.2-2 prices the separate equalizer module at ~+60 WGSL. The space-0 path of the existing text is ' + out.regions.space0_5_branch.lines + ' lines of branch inside ' + out.totalLines + '; a stripped copy plus the 6x6 form is in the 45-65 range (plan holds). The JS around it (pipeline + layout + params + a dispatch select + CPU twin) is separate and is NOT in the +60.';
fs.writeFileSync(new URL('./sonnet0-a-wgsl-count.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
