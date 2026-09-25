/* gpu-boot.js — THE WEBGPU REQUEST, STARTED FROM THE TOP OF <head> (OPTIMIZATION 2026-09-24 · M1, AUDIT-D FD1).
 *
 * WHY THIS FILE EXISTS.  requestAdapter needs neither the DOM nor a single other module, yet it used to start only
 * when all ~100 modules of the lab had been fetched and evaluated and boot() reached createField — and then boot
 * waited ~0.5 s (cold Firefox: requestAdapter ~415 ms, requestDevice ~120 ms, measured headed and headless) before
 * it built one window.  index.html loads this file as an ASYNC module right after <meta charset>, so the request
 * runs IN PARALLEL with the module graph; field.js imports the same URL, so it is the same module instance and
 * createField picks the promise up.  Same call, same options, same limits: only the start time moves.
 *
 * THE FIVE CONDITIONS it ships under (PLAN.md §0, REFUTE-F FD1, REFUTE-A FD1):
 *   (i)   the result carries `lost`, set by `device.lost` the moment the device exists, and createField honours it
 *         (a device lost while the module graph loads is reported lost, never `ok: true` on a dead device);
 *   (ii)  rack.js's setDprCap sites test the method (M3), so createField's method-less failure object boots;
 *   (iii) SINGLE-USE: `gpuBoot()` hands the early promise out once and then answers null, so a second createField
 *         requests its own device through the same `requestGpu()` and one field's dispose() (device.destroy())
 *         can never kill another's;
 *   (iv)  NODE-SAFE: three node suites import field.js, hence this file; `globalThis.navigator?.gpu` is undefined
 *         there, so nothing is requested;
 *   (v)   the ADAPTER is returned with the device: createField reads adapterInfo and limitsRequested from it.
 * It NEVER REJECTS: every failure comes back as `{ error }` and createField turns it into the same sentence as
 * before ("WebGPU device request failed: …"); a missing adapter comes back as `{ adapter: null }` ("no WebGPU
 * adapter").  No imports: if this file failed to load, field.js — and so the whole boot — would fail with it. */

/** request the adapter and the device exactly as createField always has; resolves, never rejects */
export async function requestGpu() {
  try {
    const gpu = globalThis.navigator && globalThis.navigator.gpu;
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return { adapter: null };
    /* WAVE 58 — ASK FOR THE ADAPTER'S OWN CEILING, not WebGPU's default one.  `requestDevice()` with no
     * `requiredLimits` gives the DEFAULT limits whatever the hardware can do — maxTextureDimension2D 8192 — and
     * that number is the largest picture lab/capture.js can ever take, on an adapter that reports 32767.  The
     * ceiling was a line of this file and not the GPU, which capture.js' header says in as many words.
     * A device MUST grant a limit its own adapter reported, so this cannot fail on a conforming implementation;
     * it is still wrapped, because a device that does not come up is the whole application and a bigger PNG is
     * not worth that trade.  `capture.limits()` READS what was granted rather than believing this comment.
     * (Moved here from field.js createField, byte for byte, by M1.) */
    const want = {};
    for (const k of ['maxTextureDimension2D', 'maxTextureDimension1D']) if (adapter.limits && adapter.limits[k]) want[k] = adapter.limits[k];
    let device, limitsRequested;
    try { device = await adapter.requestDevice({ requiredLimits: want }); limitsRequested = want; }
    catch (_) { device = await adapter.requestDevice(); limitsRequested = null; }
    const r = { adapter, device, limitsRequested, lost: false };
    device.lost.then(() => { r.lost = true; });            // registered before createField's own handler: when that one runs, `lost` is already true
    return r;
  } catch (error) { return { error }; }
}

let early = globalThis.navigator?.gpu ? requestGpu() : null;

/** the early request, handed out ONCE (then null): createField falls back to `requestGpu()` when this answers null */
export function gpuBoot() { const p = early; early = null; return p; }
