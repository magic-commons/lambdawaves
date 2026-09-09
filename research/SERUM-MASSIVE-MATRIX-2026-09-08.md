# Serum / MASSIVE routing applied to MIR

2026-09-08 · For Josh and the λWAVES maintainer

The useful adaptation is one routing model with two editors: direct manipulation beside a destination, and a matrix for inspecting the whole patch. Final II implements that foundation. It does not reproduce either synthesizer's complete engine or visual design.

## What the references establish

MASSIVE uses draggable modulation handles, destination slots and colored range rings. Slot gestures set the amount; a context menu supports mute and removal. Multiple ordinary sources add their contributions. Its optional sidechain instead multiplies selected modulation contributions by a control between zero and one. This is why a macro can govern the intensity of an LFO without replacing the destination's base setting. [Native Instruments, Interaction with the User Interface](https://docs.native-instruments.com/ni-tech-manuals/massive-manual/en/interaction-with-the-user-interface).

MASSIVE exposes eight macro controls, with MIDI assignment available for performance. A macro is a reusable performance control, not a separate oscillator or envelope. [Native Instruments, Macro Control Section](https://docs.native-instruments.com/ni-tech-manuals/massive-manual/en/macro-control-section).

Serum 2 explicitly adds an expanded matrix view, individual route bypass and removal, draggable reordering, dynamic route visualization, and editable source and auxiliary curves. These are distinct features: adopting bypass and an expanded editor does not imply that custom curve editing or auxiliary routing has also been implemented. [Xfer Records, What's New in Serum 2, p. 15](https://static.xferrecords.com/Serum%202%20What%27s%20New.pdf).

The Serum 2 guide describes an auxiliary source as controlling the main source's influence: an LFO gated by ModWheel contributes nothing while the wheel is at zero. Its macro pane exposes eight controls. [Xfer Records, Serum 2 User Guide, Exploring Sound Modulation / Using the Modulation Matrix](https://www.xferrecords.com/manual/serum-2/docs).

## The implementation decision

MIR retains its existing device → macro → destination path. A HAND macro can be performed directly; a bound macro reads its device. This is an intentional difference from an unrestricted synth matrix where each LFO can be selected directly on every route. The matrix SOURCE menu therefore chooses a macro; the device binding remains in the modulation window.

Each route has a destination, signed amount, unipolar/bipolar flag, response curve and bypass flag. Matrix edits, the existing ring and the new RANGE mini-knob edit the same route objects. The destination's large knob still owns its base, and bypass releases the target exactly to that base. Multiple active contributions add before the destination is clamped or wrapped.

For normalized macro value u, amount d, master depth D and curve c, the new route response is f(u)=u^(4^c), with an explicit unchanged branch for c=0. A unipolar contribution is D·d·f(u); a bipolar contribution is D·d·(f(u)−1/2). Thus d=.4 means a 0…+.4 excursion in unipolar mode and −.2…+.2 in bipolar mode. Negative d reverses direction. The base is expressed in the registry's normalized scale, so logarithmic destinations still use their existing mapping. These are λWAVES semantics, not a claim to reproduce Xfer's curve equation.

A preset now writes model version 105. Versions 3, 4 and 104 remain readable; absent curve and bypass properties retain their prior behavior. The vendored model extension is enumerated in `docs/mir-matrix-patch.json`; the frozen modulation-window files remain untouched.

## Deliberate boundary

This release provides the inspectable, editable core: add, retarget, invert amount, change polarity, bend response, bypass and remove. It does not add independent AUX sources, an auxiliary curve, arbitrary curve drawing, route reordering, MIDI/DAW automation or Serum preset import. Master depth scales all sends from one macro; it is not a substitute for a per-route AUX source. Existing inverse operations remain available.

If AUX routing is wanted later, it needs a separate optional source reference on the route and an explicitly defined multiplication stage. It should not overload the destination base, source binding or master depth. The independent control is useful precisely because those concepts differ.

## Evidence and limits

Primary-source searches covered Serum matrix controls, macro architecture, and MASSIVE range/sidechain behavior. MASSIVE's relevant manual sections and Xfer's change guide were readable. The complete Serum 2 web manual exceeded the browser fetch limit, and direct retrieval was refused; the cited guide claims above were available in indexed primary-source excerpts. The historical Serum 1 manual and the user's promised reference screenshot were not available. Consequently this is a bounded architectural synthesis, not an exhaustive comparison of every Serum 1/2 feature or a pixel-match assessment.

Sources were accessed 2026-09-08; the manual pages expose no reliable revision date in the retrieved text. Research stopped when the implemented decisions had primary support and the remaining gaps concerned excluded features or unavailable historical evidence. The planning tool required by the research workflow was unavailable in this session. This Markdown note is the project-native deliverable.
