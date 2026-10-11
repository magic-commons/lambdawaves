// opus1-a-boot-card — static census of field.js: what compiles at boot, what is lazy, and every site the CARD road (RU) touches.
import { readFileSync, writeFileSync } from 'node:fs';
const T = '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/';
const src = readFileSync(T + 'lab/field.js', 'utf8').split('\n');
const find = (re) => src.map((l, i) => [i + 1, l]).filter(([, l]) => re.test(l)).map(([n, l]) => n + ': ' + l.trim().slice(0, 150));
const bootStart = src.findIndex((l) => /const computeModule = device\.createShaderModule/.test(l)) + 1;
const bootEnd = src.findIndex((l) => /setResolution\(opts\.resolution \|\| 96\)/.test(l)) + 1;
const inBoot = (n) => n >= bootStart && n <= bootEnd;
const modules = find(/createShaderModule\(/).map((s) => ({ s, boot: inBoot(+s.split(':')[0]) }));
const pipes = find(/create(Compute|Render)Pipeline(Async)?\(/).map((s) => ({ s, boot: inBoot(+s.split(':')[0]) }));
const out = {
  bootBlock: [bootStart, bootEnd],
  modulesAtBoot: 'computeModule + renderModule + lineModule + MOL_CAPS.length (4) molWgsl + ORB_WGSL = 8 modules, each awaited through getCompilationInfo IN SEQUENCE (field.js:878–880)',
  moduleSites: modules, pipelineSites: pipes,
  lazyPrecedent: find(/createRenderPipelineAsync|specCache\.set|pushErrorScope/),
  card: {
    psiTexUsage: find(/GPUTextureUsage\.STORAGE_BINDING \| GPUTextureUsage\.TEXTURE_BINDING/),
    writeTexture: find(/writeTexture/),
    destroyOnRes: find(/psiTex\.destroy|refTex\.destroy/),
    resCallers: ['lab/shell/controller.js effectiveRes + lab/rack.js:325 field.setResolution(want) — the governor notch over RES_LADDER = [64, 96, 128] (controller.js:62)'],
    frameOwnerArms: find(/const molOn = |if \(molOn\)|\} else \{$/).filter((s) => +s.split(':')[0] > 1310 && +s.split(':')[0] < 1330),
    statsWrites: find(/writeBuffer\(statsBuf/),
    f16Decode: find(/f16|half.*float|0x3ff|>> 10/i).slice(0, 6),
    molDirtyOnRes: find(/molDirty = molDirty \|\| !!molSpec/),
  },
  verdict: [
    'RU is NOT +15: a card must OWN the volume in frame() (today two arms: molOn → encodeMolecule, else → encodeCompute; field.js:1318–1328) or the next RECONSTRUCT overwrites it — a THIRD arm on the locked dispatch path (the F3 risk the plan prices for the equalizer but not here)',
    'setResolution destroys psiTex and re-binds (field.js:1036–1054); the molecule re-dispatches itself (molDirty, :1052) but a card has no GPU producer: the main thread must keep the 64³ f32 card and re-resample on every governor notch (a 96³/128³ trilinear resample = 0.9/2.1 M taps on the frame thread) or the governor must be PINNED while a card owns the field',
    'stats[0] must be written from the CPU (writeBuffer(statsBuf, 0, maxRho)) — the presenter divides by it (field.js:390)',
    'COPY_DST on mk() changes the usage of the LOCKED texture: no texel moves (DERIVED-HERE), but it is a byte-level edit inside setResolution — a lock run as precondition',
    'honest count: COPY_DST 0 (same line) · owner flag + third arm 4 · upload + f16 pack 14 · stats word 2 · keep-and-resample on res 10 · release on setMolecule/owner change 3 ≈ +33, not +15',
  ],
};
writeFileSync(new URL('./opus1-a-boot-card.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ bootBlock: out.bootBlock, modules: modules.map((m) => (m.boot ? 'BOOT ' : 'lazy ') + m.s.slice(0, 90)), pipes: pipes.map((m) => (m.boot ? 'BOOT ' : 'lazy ') + m.s.slice(0, 90)), card: out.card }, null, 1));
