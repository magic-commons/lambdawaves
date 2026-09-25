/* dispatch-floor.js — is the 2.5 ms step in gas-kernel.out.json a property of the KERNEL or of the MEASUREMENT?
 * A near-empty compute kernel on a 64³ storage texture, dispatched n times: in one pass, in n passes, in n submits. */
const LW = __LW, F = LW.field, d = F.device;
LW.pause(); await LW.settle();
const code = `@group(0) @binding(0) var outTex: texture_storage_3d<rgba16float, write>;
@compute @workgroup_size(4, 4, 4) fn main(@builtin(global_invocation_id) gid: vec3<u32>) { if (all(gid < vec3<u32>(64u))) { textureStore(outTex, vec3<i32>(gid), vec4<f32>(f32(gid.x), 0.0, 0.0, 0.0)); } }`;
const pipe = d.createComputePipeline({ layout: 'auto', compute: { module: d.createShaderModule({ code }), entryPoint: 'main' } });
const tex = d.createTexture({ size: [64, 64, 64], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING });
const bg = d.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: tex.createView({ dimension: '3d' }) }] });
/* a second texture, so consecutive dispatches can alternate targets (no write-after-write hazard between neighbours) */
const tex2 = d.createTexture({ size: [64, 64, 64], dimension: '3d', format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING });
const bg2 = d.createBindGroup({ layout: pipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: tex2.createView({ dimension: '3d' }) }] });
const run = async (n, mode) => {
  await d.queue.onSubmittedWorkDone(); const t0 = performance.now();
  if (mode === 'onePass' || mode === 'onePassAlt') { const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(pipe); for (let i = 0; i < n; i++) { p.setBindGroup(0, mode === 'onePassAlt' && (i & 1) ? bg2 : bg); p.dispatchWorkgroups(16, 16, 16); } p.end(); d.queue.submit([enc.finish()]); }
  else if (mode === 'nPasses') { const enc = d.createCommandEncoder(); for (let i = 0; i < n; i++) { const p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(16, 16, 16); p.end(); } d.queue.submit([enc.finish()]); }
  else { for (let i = 0; i < n; i++) { const enc = d.createCommandEncoder(), p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(16, 16, 16); p.end(); d.queue.submit([enc.finish()]); } }
  await d.queue.onSubmittedWorkDone(); return +(performance.now() - t0).toFixed(1);
};
const out = {};
for (const mode of ['onePass', 'onePassAlt', 'nPasses', 'nSubmits']) { out[mode] = {}; for (const n of [1, 10, 40, 160, 640]) out[mode][n] = await run(n, mode); }
/* and the idle wait alone: how long does onSubmittedWorkDone take with nothing in flight */
const w = []; for (let i = 0; i < 5; i++) { const t0 = performance.now(); await d.queue.onSubmittedWorkDone(); w.push(+(performance.now() - t0).toFixed(1)); }
out.idleWaitMs = w;
tex.destroy(); tex2.destroy();
return out;
