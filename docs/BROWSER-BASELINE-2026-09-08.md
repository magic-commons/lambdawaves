# Browser baseline failure ledger — 2026-09-08

Command: `LW_PORT=8719 GD_PORT=5239 bash test.sh browser`.
Runtime baseline: `78ecb30`, before the notebook fallback security fix.
**Incomplete, red run:** 102 assertions emitted; 25 were red. Last completed block: B87.
The run stopped making progress during B88's palette/reload sequence. After several minutes
without a new assertion the owned Node runner was terminated; the HTTPS server exited
via its cleanup trap. This was an interrupted test, not the suite's final verdict.
The cause of the stalled reload has not been isolated. No claim is made about later blocks.
The Snap geckodriver on port 5239 refused SIGTERM with Permission denied and may
remain on this machine; use a different free port. Do not kill unrelated sessions.

Default-port run failed before testing because port 5202 belonged to an existing
session. The updated driver now rejects occupied ports before spawning.

The details below are the harness's original 300-character excerpts; they can be
incomplete JSON. Reproduce with fuller diagnostics before assigning root cause.
Approved native UI changes supersede old visual assertions. In particular, 11px blur,
hidden Spectrum dials, and keyboard settings outside Settings are intentional.

## Failed assertions

### B43 THE SHIPPED DEFAULTS

B43 THE SHIPPED DEFAULTS: SPECTRUM on the left rack with MODE open, KEPLER off, LIGHT theme, arg ψ as the observable, the vortex census and its overlay off; Roboto is the interface face; every window has ⏻ ▾ ×, INFO panels have ⧉ COPY, CONTROL and OTHER windows start folded, CORE open; SETTINGS exists with the key bindings inside; both racks carry a + and no veil; the card shadow is the tight one

```text
{"specSide":"L","pickerOpen":true,"keplerOn":false,"theme":"light","phaseDefault":true,"vortexOn":false,"vortexOverlay":false,"font":true,"bodyFont":"\"Roboto\", \"Inter\", system-ui, -apple-system, \"Segoe UI\", sans-serif","kinds":{"transport":{"kind":"core","folded":false,"power":true,"close":tru
```

### B11 SPECTRUM lane buttons are real touch targets (≥ 34 × 40 px)

B11 SPECTRUM lane buttons are real touch targets (≥ 34 × 40 px)

```text
{"w":0,"h":0,"ok":false}
```

### B11 tapping a lane's M mutes it through the same road

B11 tapping a lane's M mutes it through the same road

```text
{"muteTap":{"ok":0,"why":"zero area","w":0,"h":0,"display":"block","visibility":"visible"},"muted":{"on":false,"rendered":2}}
```

### B28 KEYS

B28 KEYS: H hides the rack, badges, hint and frame and H shows them again; TAB brings the next window to the top unfolded and Shift+TAB the previous — FROM THE STAGE, which is wave 57's change to this block and the only one: Tab was an application key everywhere, so keyboard focus could not move at all, and it now cycles windows only while the stage holds focus and is the browser's everywhere else (proved both ways here); Ctrl+R seeds the particles; rebinding the camera reset from R to T takes effect at once and is saved in localStorage

```text
{"hidden":{"cls":true,"rack":"none","frame":false},"shown":{"cls":false,"rack":"flex"},"first0":"orbit","stageHeld":true,"tab1":{"id":"orbit","folded":false},"tab2":"orbit","offSame":true,"seeded":{"on":true,"count":160},"notReset":2,"reset":0.65,"saved":{"camReset":{"key":"KeyT","ctrl":false,"alt":
```

### B36 CALCULUS

B36 CALCULUS: on 1s + 2p_z at t = 1.3 the live table shows five rows with Ehrenfest I and II holding (residuals < 1e-5 relative, marked ok), the dipole moving (|⟨p_z⟩| > 0.01), and under the oscillator the law reads Newton (−⟨z⟩)

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:8:18\n"}
```

### B38 THE FLOATING RACK

B38 THE FLOATING RACK: the stage fills the window and the rack floats over it; every note is folded behind a hint icon and N opens them all; the hide button slides the rack out and the right-edge peek brings it back; a card can be moved to the top; the transport is a slim bar that docks into the rack as a card and undocks

```text
{"stageFull":true,"rackPos":"absolute","notesHidden":false,"icons":20,"notesShown":true,"hidden":{"cls":true,"op":"0"},"peek":"1","peekDbg":{"who":[],"cls":"frost disconnected window-info-off rack-l rack-hidden rack-peek","tf":"none","disp":"flex","rule":true,"hiddenAttr":false,"parent":"lab"},"befo
```

### B39 THEME + MIRROR + LOGO

B39 THEME + MIRROR + LOGO: LIGHT sets the theme, lightens the stage so the frame's mean luminance jumps; GAMMA 2.2 changes the picture; FROST applies the GLASS BLUR radius (18 px by default) as a backdrop blur only while on; a card moves to the left rack by the API and back by its ⇄ button; TAB's order spans both racks; the title carries the nine-square diamond mark and the wordmark face loads under the name it is licensed to use — WAVE 59 RENAMED IT: our five-glyph subset of gluk's Spinwerad is a Modified Version, "spinwerad" is a Reserved Font Name, and SIL OFL §3 forbids a Modified Version from using one (the TERMINATION clause voids the g…

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:14:75\n"}
```

### B41 THE iPAD ROUND

B41 THE iPAD ROUND: AUTO SCALE is on with a floor and a measured frame interval; the rack is a real scroller (pointer-events auto, pan-y) and cards pan; entering the BOX launches a held gas packet and plays; COHERENT BOUNCE puts the oscillator in a slapped ground state of unit norm across many N; the phase view with the palette on stays lit and the guarded shader compiles clean

```text
{"auto":{"on":true,"scale":0.35,"min":0.35,"ema":0,"changes":7},"rackPE":"auto","rackTA":"pan-y","rackBottom":"0px","devTA":"pan-y","box":{"h":"well","launched":true,"held":0.940431868845912,"playing":true,"modes":56},"coh":{"h":"qho","coherent":true,"norm":0.9999999119787666,"modes":56,"playing":tr
```

### B42 THE SECOND UX ROUND

B42 THE SECOND UX ROUND: a theme change leaves INVERT alone; SIGNED, BANDS and the overlay-shaded SOLID all draw the real 1s+2pz; the rack runs to the top; each card has one ⓘ in its header whose panel opens outside the rack and cycles the card's notes; the logo and hide button sit between the racks; the logo opens FILE · EDIT · WINDOW with the windows listed; the transport floats 60 px up, docks into the LEFT rack at the top and remembers its slot; a real drag turns the GAMMA knob and a double-click resets it; a hidden rack peeks at the edge and goes when the pointer leaves its column

```text
{"error":"no result"}
```

### B45 RATE · A/B · CHROME

B45 RATE · A/B · CHROME: changing a channel's RATE leaves c(t) continuous and flags a TOY, resetting it clears the flag; every channel has two knobs; the spectrum head carries HIDE · +MODE · CLEAR · NORMALIZE; A = 1s and B = 2pz stored, TRANSITION plays the exact two-level Rabi mix — unit norm, both listed, all B at θ = π/2 — and turning it off freezes one state; a kick on an empty box conjures a state; the play bar keeps its width across rates; H hides the toggles and the title; menu items show their keys; the polar palette draws the real view

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:16:106\n"}
```

### B46 THE OBSERVER SPLIT AND THE REST (wave 56

B46 THE OBSERVER SPLIT AND THE REST (wave 56: PALETTE · WAVE · CAMERA · SLICE/CLIP are FOUR windows in that order, DRAW STYLE having been absorbed into WAVE, and no card carries the id `style` any more); the SPECTRUM's ladder comes first and the Hamiltonian block sits below the picker; each channel stacks two half-size knobs, alternate rows staggered; a VIVID knob and a glow token exist; the right rack scrolls on its left edge with the cards left-to-right and accent scrollbars; Re+Im draws; F and the VIEW menu offer full screen; the palette ROTATE is a wheel

```text
{"inOrder":true,"has":{"palette":true,"style":true,"styleGone":true,"camera":true,"clip":true,"observer":true},"ladderIdx":0,"hamIdx":5,"pickerIdx":4,"knobs":[2,2],"dial":"17px","tx":["none","none"],"rateDial":"15px","liveRing":"rgba(255, 255, 255, 0.05) -1px -1px 3px 0px, rgba(0, 0, 0, 0.42) 2px 2p
```

### B47 THE NOTEBOOK GLASS

B47 THE NOTEBOOK GLASS: opens as a free window with a real backdrop blur and no colour behind it, its title in the logo's face ('LW Title' since wave 59 renamed the subset for OFL §3) and its notes in Roboto, kept in this browser; it drags to a place; ⓘ flips it into the ABOUT face with the logo, the three credits, the team line and a copy dump, and back; J is its key; FROST is now a blur with only a whisper of tint; a GLASS BLUR knob exists; the +MODE picker has no slab; hiding the rack slides the playhead away and the pointer near its place brings it back; the rack peeks within 60 px

```text
{"blur":"blur(11px) saturate(1.15)","bg":"rgba(0, 0, 0, 0)","titleFont":"\"LW Title\", \"Roboto\", \"Inter\", system-ui, -apple-system, \"Segoe UI\", sans-serif","textFont":"\"Roboto\", \"Inter\", system-ui, -apple-system, \"Segoe UI\", sans-serif","kept":"the 2p_z bounce at t = 3.1","moved":true,"f
```

### B56 THE SCALE (W-STURMIAN, a switch)

B56 THE SCALE (W-STURMIAN, a switch): hydrogen 1s → STURMIAN at λ = 1 keeps E(1s) = −½ (1e-12) with population 1 and renders the same cloud (pixels within 1 %, the same field integral); λ = ½ with 2p_z puts −1/8 on the eigen ladder (1e-10) with a stationary density (frames 5 a.u. apart within 1 %); λ = 1.4 with 1s + 2p_z played to t = 50 conserves ⟨c|S|c⟩ (1e-9) and the populations (Σ = 1, each constant to 1e-9), the GPU voxel matches the CPU twin on the scaled records (1 %), the cloud moves, and the transport says NO EXACT PERIOD; Z = 2 at λ = 2 gives −2 (1e-10); select(k) loads an eigenstate with population 1 on it, unit S-norm, stationary;…

```text
{"E1":-0.5,"pop1":1,"on1":true,"same1":true,"dInt":0,"hashSame":true,"laneE":"-0.5000 Eh","capShown":true,"capText":"non-orthogonal basis: populations are projections ⟨C_k|S|c⟩ (the ladder) · a lane's energy is the label's ⟨H⟩, not an eigenvalue","status1":"STURMIAN  λ = 1.000 · Z = 1 · S⁻¹H on the
```

### B59 UNDO / REDO over the register side (Ctrl+Z · Ctrl+Shift+Z · Ctrl+Y)

B59 UNDO / REDO over the register side (Ctrl+Z · Ctrl+Shift+Z · Ctrl+Y): a ring of at most 60 snapshots of what changes ψ or its law — the anchor c(0) with its mask and static field, the DRAG γ, the Hamiltonian selection, the SCALE, the 91 RATEs and the two A/B stores — and of nothing the observer owns. Set a label on 1s+2pz and UNDO puts the preset's two labels back, REDO puts the third back; three distinct edits (a coefficient, a Zeeman field, one label's RATE) are three steps and three undos return the state digest, Bz = 0 and rate = 1 exactly, with canUndo false at the bottom and canRedo true. A whole pointer drag on a lane fader — pointe…

```text
{"chk":{"boot":true,"one":true,"three":true,"drag":false,"ham":true,"stur":true,"proj":true,"menu":true,"keys":false,"observer":true,"layout":true,"cap":true,"err":true},"out":{"one":{"preset":[0,3],"edited":[0,3,20],"undone":[0,3],"redone":[0,3,20],"boot":{"canUndo":false,"canRedo":false,"depth":0,
```

### B62 CARD STYLE (Josh

B62 CARD STYLE (Josh: "I love that refractive glass effect"). The card's pane was never a decision: `background: var(--glass-sheen), hsl(var(--glass-tint) / …)` parses but cannot COMPUTE where --glass-sheen is a colour — a colour is legal only as the LAST background layer — so in the LIGHT theme the whole declaration fell back to `initial` and every card, popover and chrome pane rendered fully TRANSPARENT. That accident is the look, so it is now the DEFAULT and it is written down: with no card remembered, applySettings lands on REFRACTIVE even from a body wearing the other one, and .dev and .glass compute to rgba(0, 0, 0, 0) with no image in …

```text
{"dflt":"refractive","R":{"dark":{"dev":"rgba(0, 0, 0, 0)","glass":"rgba(0, 0, 0, 0)","img":"none"},"light":{"dev":"rgba(0, 0, 0, 0)","glass":"rgba(0, 0, 0, 0)","img":"none"}},"T":{"dark":{"dev":"rgba(28, 32, 38, 0.84)","glass":"rgba(28, 32, 38, 0.84)","tint":[28,32,38],"a":0.84,"matches":true},"lig
```

### B63 THE THEME REACHES THE ONE THING IT COULD NOT (Josh

B63 THE THEME REACHES THE ONE THING IT COULD NOT (Josh: "Make the cube frame become black when in lightmode", "darkmode turns the xyz axis to a vivid CMY color"). The domain cube and the three axes are drawn by the GPU, not by CSS, so no token could ever reach them: rack.js now hands the RESOLVED theme down as mat.lightUI and field.js keeps one ink palette per theme. LIGHT paints the box near-black — the stroke is #05080d at .42 and the rendered frame comes back at luminance 88 against a ground of 243, achromatic and unmistakably a black line — while the shipped warm/cool axes stay. DARK keeps the shipped white box at .13 and takes vivid CMY:…

```text
{"theme0":"dark","darkInk":{"box":[1,1,1,0.12999999523162842],"x":[0,1,1,0.8500000238418579],"y":[1,0,1,0.8500000238418579],"z":[1,1,0,0.8999999761581421]},"darkPix":{"w":320,"h":320,"buckets":{"cyan":99,"magenta":55,"yellow":95,"warm":0,"green":0,"blue":0,"grey":102151},"top":{"cyan":[1,218,219],"m
```

### B64 THE MARK, THE GRIP, AND A HIDDEN INTERFACE THAT IS ACTUALLY FASTER. The nine squares of the logo now TILE — step equals width in both directions,

B64 THE MARK, THE GRIP, AND A HIDDEN INTERFACE THAT IS ACTUALLY FASTER. The nine squares of the logo now TILE — step equals width in both directions, so the grid of gutters Josh saw is gone and the colours touch — and all three copies of the wheel (the header, the ABOUT face's clone, the busy mark's) are painted by ONE function from the SAME nine samples, so turning the accent wheel moves all of them together instead of leaving the clone frozen at whatever it was cloned from. THE BUSY MARK is a nesting counter, not a flag: it goes up the instant a Worker job is issued (the bow's slap, the packet, the period scan — every call goes through one …

```text
{"n":9,"square":true,"gapX":0,"gapY":0,"head0":"#00ff00,#8ce079,#bcbea9,#dd94cf,#f459ef,#f556f0,#dd92d1,#bdbdab,#8edf7b","about0":"#00ff00,#8ce079,#bcbea9,#dd94cf,#f459ef,#f556f0,#dd92d1,#bdbdab,#8edf7b","busy0":"#00ff00,#8ce079,#bcbea9,#dd94cf,#f459ef,#f556f0,#dd92d1,#bdbdab,#8edf7b","head1":"#dc96
```

### B66 THE CAMERA WINDOW, ported in our own kit (Josh

B66 THE CAMERA WINDOW, ported in our own kit (Josh: "port every other control; seed gets an intuitive use or is dropped"). The card carries AUTO-ROTATE, SPIN, FRICTION, ZOOM, FOV, RESET VIEW and SET Δρ REF and no widget that is not already in the kit — and since wave 58 the two dials Josh asked to be copied out of the View window (DRAG GAIN and FLING, beside FRICTION because all three are the feel of the same hand) and the CAPTURE group with them, which is where SECONDS, TAKE A PICTURE and ONE PERIOD come from. The knob list is pinned EXACTLY, on purpose: what this window contains is the assertion. FRICTION ships at μ = 1.00 /s reading "μ 1.0…

```text
{"knobs":["SPIN","FRICTION","DRAG GAIN","FLING","ZOOM","FOV","SECONDS"],"sws":["AUTOROTATE"],"trigs":["RESET VIEW","SET Δρ REF","TAKE A PICTURE","RECORD","ONE PERIOD","PLAN","EXPORT FRAMES",""],"note":"The camera has an angular velocity and one constant: ω̇ = −μ(ω − ωamb), integrated exactly every f
```

### B70 W-MOBILE · TOUCH TARGETS WITHOUT INFLATION, portrait. Every interactive control on the screen — knob dials, switches, segments, triggers, faders,

B70 W-MOBILE · TOUCH TARGETS WITHOUT INFLATION, portrait. Every interactive control on the screen — knob dials, switches, segments, triggers, faders, selects, the SPECTRUM lane's M / S / ×, picker chips, key chips, the card-header buttons, the transport buttons, the status tags, the two rack buttons and the transport pill's own seats — carries a hit region of at least 44 × 44 CSS px, measured by walking outward from each control's centre with elementFromPoint, which answers exactly ONE owner per point: that every one of them clears 44 SIMULTANEOUSLY is the proof that no two overlap, since an overlap would truncate the loser. The INK is untouc…

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:138:13\n"}
```

### B71 W-MOBILE · LANDSCAPE (844 × 390) IS STILL ONE RACK, and the one tip is still reachable by a finger. Turning the phone on its side crosses into the

B71 W-MOBILE · LANDSCAPE (844 × 390) IS STILL ONE RACK, and the one tip is still reachable by a finger. Turning the phone on its side crosses into the query's SECOND arm — no hover, ≤ 520 px tall, ≤ 1000 px wide — not out of the phone: the rack is the same single left-hand rack at x = 0 running to the foot of the screen, the mirror rack is still down and empty, the transport is still the first card with no × on it, the glass is still opaque and the field still runs 64³ at a 1.5 device-pixel ceiling. Every on-screen control clears 44 × 44 here too. And graphHover — kit.js's ONE tip mechanism, whose touch path pins the tip on pointerdown and di…

```text
{"lsT":{"vp":[844,390],"sentinel":"1","api":true,"rack":{"l":0,"t":46,"w":300,"bot":390},"rackLDisplay":"none","inRackL":0,"docked":true,"trIndex":0,"trCloseDisplay":"none","glassOpacity":"1","dprCap":1.5,"res":64,"spill":[],"labScroll":[844,844]},"hitL":{"error":"@https://127.0.0.1:8719/lab/?preset
```

### B72 W-MOBILE · THE CROSSING UNDOES ITSELF, AND THE DESKTOP AND THE IPAD ARE UNTOUCHED. Back at 1400 × 814 the sentinel falls to 0, body.phone comes of

B72 W-MOBILE · THE CROSSING UNDOES ITSELF, AND THE DESKTOP AND THE IPAD ARE UNTOUCHED. Back at 1400 × 814 the sentinel falls to 0, body.phone comes off, and every card is in the rack it was in BEFORE the crossing — judged against the layout this run actually had, since earlier blocks move windows between racks — with the main rack back in the right-hand column at the shipped --rack-w, the transport back to the dock state it had, the field back to the grid it had and the device-pixel ceiling to 2, the surface back to the one that was worn, the glass to its .84 token, ⇄ SWAP back on every header and the header back to 34 px, and the hide toggle…

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:14:13\n"}
```

### B74 W-MODWINDOW · THE MODULATION RACK REPLACES THE PLAYHEAD, AND THE PLAYHEAD IS ITS MINIMISED MODE. The transport pill is glass mini, 560 x 46 at bot

B74 W-MODWINDOW · THE MODULATION RACK REPLACES THE PLAYHEAD, AND THE PLAYHEAD IS ITS MINIMISED MODE. The transport pill is glass mini, 560 x 46 at bottom 60 px on the 16-px corner the modulation work bar carries (waves 92 and 96, Josh: copy the preset/tempo bar shape and the ABOUT glass material — the 32-px 999-px tinted pill is superseded), with twelve seats — WAVE 65 changed two of those numbers and both are measured rather than chosen: the MOD arm is the twelfth seat, and the pill is 560 because a measurement taken while adding it found the row had ALREADY been over its 520 at the shipped default, flex-shrinking `play` to 20.3 px of its 26…

```text
{"mini":{"cls":"glass mini","box":[560,46,420,708],"bottom":"60px","radius":"16px","allKids":["native-play-row","native-tempo"],"kids":["native-play-row"]},"expLast":false,"expAfterDock":true,"allStatic":true,"geom":{"b0":[560,46,420,708],"b1":[560,46,420,708],"b2":[560,46,420,708],"same":true,"back
```

### B77 THE AXIS IS ITS OWN OBJECT (wave 53, Josh, board #40

B77 THE AXIS IS ITS OWN OBJECT (wave 53, Josh, board #40: "Toggle Space window for an Axis button alongside frame to make the axis and frame two individual objects"). ONE switch used to draw the domain cube AND the three xyz axes, so neither could ever be seen without the other. They are two switches now, side by side in OBSERVER, and the split is in the GPU rather than in a flag: field.js keeps the one line buffer with its layout unmoved — the box is vertices 0…23, the axes 24…29 and the slice rectangle 30…37, which is exactly what lineColors() reads — and issues two draw calls into it. Judged off the RENDERED chrome on LIGHT, where the box …

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:25:16\n"}
```

### B78 SLAP BECOMES IMPULSE AND THE BOW BECOMES THE IMPULSE VECTOR (wave 53, Josh, board #44). A sweep of the whole LIVE document — every text node, and

B78 SLAP BECOMES IMPULSE AND THE BOW BECOMES THE IMPULSE VECTOR (wave 53, Josh, board #44). A sweep of the whole LIVE document — every text node, and every title, aria-label and placeholder on every element, with the four windows that carried the words open — finds not one SLAP, BOW, slap, slapped or bow left in anything a user can read. The new words are in every seat the old ones held: the trigger reads IMPULSE, the group reads "IMPULSE · a sudden momentum kick ψ ↦ e^{ik·x}ψ", the readout reads LAST IMPULSE, the key sheet prints "impulse along the axis (k = 0.2)" against the K key, the hint bar reads "ctrl+drag = impulse vector", the STATE …

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:23:32\n"}
```

### B82 THE '?' KEY IS A LIVE BINDINGS SHEET (wave 53, Josh, board #46

B82 THE '?' KEY IS A LIVE BINDINGS SHEET (wave 53, Josh, board #46: "? - shortcut key for keyboard binds (should also show the dynamic current keyboard binding)"). It ships closed; '?' opens it, '?' closes it and Escape closes it. Every one of the 40 rebindable actions is on it (wave 65 added MOD on m and the loop-clock lock on g, and the fixture below moved its own rebinds to I and O, because aiming a rebind at a key that is now BOUND tests a collision rather than a rebind) with the action's OWN name beside its key, formatted by the same keyName() the SETTINGS chips use — including the row for '?' itself, which prints '?' rather than Shift+/…

```text
{"error":"@https://127.0.0.1:8719/lab/?preset=1s%2B2pz:8:5\n"}
```
