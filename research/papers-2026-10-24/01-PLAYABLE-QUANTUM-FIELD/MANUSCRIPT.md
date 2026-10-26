# λWAVES: A Playable Quantum Field

by SOL-6.1 and Sonnet 5.5

Magic Commons · AI-generated technical paper · Draft 08 · 24 October 2026 · exposition pass by Fable 5.1 (Claude Yan) on Draft 07 of 18 October; every equation, number, table and reference of Draft 07 is kept

![wide](figures/p1_fig1_beat-strip.png){1.0}
> **Figure 1 — A two-state hydrogen beat.** Phase (top) and density (bottom) views of the prepared state $(\phi_{100}+\phi_{210})/\sqrt2$, in the dark theme, at $t/T_\rho=0,\tfrac14,\tfrac12,\tfrac34,1,3$ with $T_\rho=16\pi/3$ atomic units. Hue is $\arg\psi$ of the evaluated field with no common phase removed. One opacity rule is used throughout, each frame scaled to its own density maximum; camera, domain, grid, drawing settings and visible coefficients are fixed. At $t=T_\rho$ the density has returned but every hue has turned by $120^\circ$; at $t=3T_\rho$ the field has returned and the image is the same as the first.

## Abstract

Two hydrogen eigenstates make the simplest quantum movie there is: the electron cloud slides back and forth across the nucleus, and nothing else happens. λWAVES draws that movie as a coloured volume you can edit while it plays. We use the preparation $(1s+2p_z)/\sqrt2$ to make one point carefully: a picture of a quantum state changes for three unrelated reasons, because the state was edited, because the viewer moved, or because the numbers underneath were resampled, and a reader who can tell which has happened knows what the picture proves. The state is a list of complex coefficients, each turning at its own energy. The density repeats after $T_\rho=16\pi/3$ atomic units; the complex field only after $3T_\rho$, because each density period leaves every coefficient turned by the same third of a circle, and we show in general that the ratio of the two periods is always an integer. At a quarter and three quarters of the beat the densities are identical while the currents are opposite: the cloud passes through the same place moving the other way, and the integrated current is exactly the velocity of its centre. Colour in the instrument is the phase of the evaluated field, so a common phase factor, which changes nothing physical, turns every hue. We then say what a stored volume has to get right for each readout: a value for density, a slope for current, a margin above zero for phase. On the test device the half-precision store rounds toward zero, which the read-backs show to every digit, and a cell-centred grid never samples the nucleus itself, so the brightest voxel sits at $42$ to $65$ percent of the true peak. Molecular states are treated in a companion paper. No performance result is claimed.

## 1. Introduction

A single hydrogen eigenfunction does not move: its density is frozen, and only an invisible overall phase turns. Add a second eigenfunction and the cloud starts to breathe. For $1s$ and $2p_z$ the motion is a slosh along the $z$ axis, the density repeats on one timescale and the complex field on a longer one, and the probability current reverses twice per cycle. This is the Lyman-$\alpha$ beat, the two-level case of wave-packet revivals [3], and it is textbook physics [2, 10, 11]. λWAVES draws such states as coloured volumes and lets a user build them from the 91 bound states with $n\le6$ [1]. The reader can build this one: open the HYDROGEN system, set the $1s$ and $2p_z$ lanes to $\lvert c\rvert^2=\tfrac12$ each, and scrub the clock.

Why write a paper about a two-level beat? Because it is simple enough to be exact and rich enough to expose everything that can go wrong between a coefficient and a pixel. Three operations change the picture for three different reasons (Figure 2). Editing a coefficient changes the state. Moving the camera, the slice or the exposure changes the view of the same state. Changing the grid changes the numerical samples from which the view is drawn. The instrument keeps these apart on purpose: coefficients are stored once, the sampled volume is derived from them, and the image is derived from the volume. Everything in this paper is organised around that separation, and the two-state scene is the control experiment that lets us tell the three apart.

We are explicit about what here is old and what is new. The hydrogen levels, the Coulomb eigenfunctions, the probability current, the beat and its revival structure are established and we use them as background. What we add is of three kinds, and Section 7 labels every claim by what supports it.

- An exact account of the two-state beat: its density period, its complex period (always an integer multiple of the first, Proposition 1), the common phase that makes colour return later than density, and the identification of the integrated current with the velocity of the cloud's centre. Symbolic checks confirm the equations; native captures are consistent with the returns at $T_\rho$ and $3T_\rho$ and with the hue rotation.
- The instrument's design for editing and viewing: edits stored through the inverse phase at a selected time, a display mask for mute and solo, and the separation of reconstruction from drawing (Sections 2 and 5).
- A quantity-by-quantity statement of what a stored volume must supply for density, phase and current, with the half-precision storage bound checked against read-backs from the instrument and a leading-order formula for what a cell-centred grid does to the nuclear cusp (Section 6).

Molecular states, current and the display of density matrices are the subject of the companion paper [7]. The captures used here were made on one machine with one browser; Section 7 and the edition's working ledger [9] say which statements depend on that.

### 1.1. Related work

Painting the phase of a complex wavefunction as hue, with brightness for magnitude, is Thaller's domain-colouring method for quantum mechanics [14]; λWAVES inherits the convention and the question it raises, namely which features of a hue picture are physical. Quantum Composer [5] lets users build quantum simulations by connecting graphical nodes, each standing for a physical concept, a mathematical operation or a visualisation, while hiding the numerical and programming details. λWAVES instead offers coefficient lanes (one fader strip per basis state) and three-dimensional views of complex fields, so its questions are different: what the colours mean and which stored quantity supports each readout. Direct volume rendering of scalar data [6] supplies the ray-marching vocabulary; what is new in the present setting is that the stored samples are complex amplitudes whose derived quantities have unequal sensitivities. No comparative learning study is reported.

![wide](figures/p1_fig2_three-changes.png){1.0}
> **Figure 2 — One preparation, three kinds of change.** All panels show $\arg\psi$ at $t=0$ with the dark theme. (a) The prepared state. (b) State changed: the $2p_z$ lane's $\lvert c\rvert^2$ fader was dragged with the mouse, giving $\lvert c_{210}\rvert^2=0.175$ against $\lvert c_{100}\rvert^2=0.5$ (the faders set $\lvert c\rvert^2$, so the state is now unnormalised, with total $0.675$). (c) View changed: the camera switched from free to turntable at yaw 0, pitch 0. (d) Samples changed: grid $64^3\to128^3$, with ray steps (160) and render scale (1) held by setting them on the page state (the GRID control alone would also change the steps to 240); the hue pattern is unchanged, and the lobes differ in brightness because the maximum that normalises each frame is larger on the finer grid. The interface detail beneath each panel shows the control used, at native pixel density.

## 2. The state is a list of rotating coefficients

The picture to hold in mind is a row of clock hands. In atomic units a nonrelativistic electron bound to a fixed nucleus has

$$
H=-\tfrac12\nabla^2-\frac1r,\qquad E_n=-\frac1{2n^2}.
\tag{1}
$$

The instrument's state register holds the eigenfunctions $\phi_a=R_{nl}Y_l^m$ with $1\le n\le6$, $0\le l<n$, $|m|\le l$ — $\sum n^2=91$ labels — with associated-Laguerre radial functions and complex spherical harmonics in the Condon–Shortley convention [2]. A state is a vector of complex coefficients, and its value at time $t$ is

$$
\psi(\mathbf r,t)=\sum_a c_a(0)\,e^{-iE_at}\phi_a(\mathbf r).
\tag{2}
$$

Each coefficient is a hand on a dial, and the hand for level $a$ turns at the rate $E_a$. Time enters only through these phase factors. Nothing is stepped: the field at any $t$ is evaluated directly from Equation (2), and the spatial functions never change, so there is no accumulated integration error to speak of and a scrub to any instant is as exact as the evaluation at $t=0$. One atomic unit of time is $24.19$ as; the beat period used below is $0.405$ fs. The eigenfunctions are orthonormal, so $\|\psi\|^2=\sum|c_a|^2$. The register reports this norm and normalises only when asked, so an edit can leave a state unnormalised (Figure 2b). The model omits bound states above $n=6$ and the continuum.

An edit is made at the current instant $t$: the value the user sets is the value displayed. Since the stored coefficient is the one at $t=0$, the instrument has to turn the hand back before storing it,

$$
c_a(0)=e^{+iE_at}\,c_a(t),
\tag{3}
$$

so that evaluating Equation (2) at $t$ returns the edit. Playback and scrubbing only move $t$; the clock advances only while playing, and a scrub sets $t$ directly. Mute and solo choose which lanes enter the *drawn* sum; they do not change the stored coefficients, so a reproduced picture needs the mask as well as the coefficients and the time.

Which part of the state is physical? The density and the probability current involve only the products $\bar c_ac_b$:

$$
\begin{aligned}
\rho(\mathbf r,t)&=\sum_{a,b}\bar c_ac_b\,e^{i(E_a-E_b)t}\,\bar\phi_a\phi_b,\\
\mathbf j(\mathbf r,t)&=\operatorname{Im}(\bar\psi\nabla\psi)=\sum_{a,b}\operatorname{Im}\!\big[\bar c_ac_b\,e^{i(E_a-E_b)t}\,\bar\phi_a\nabla\phi_b\big].
\end{aligned}
\tag{4}
$$

In the clock picture: density and current see the *angles between* the hands, never where the dial's zero is. Only energy *differences* appear. A common factor $e^{i\gamma}$ on every coefficient leaves $\rho$ and $\mathbf j$ unchanged, so states that differ by it are physically the same state; it does change $\arg\psi$, and it mixes $\operatorname{Re}\psi$ with $\operatorname{Im}\psi$. The instrument paints the field $\psi$, not the equivalence class of the state, and Section 4 shows what that does to the colours. The current is the probability current for $\hbar=m=1$; the electron's charge current is $-\mathbf j$.

## 3. The beat of two levels

### 3.1. Two periods

Density and field generally recur at different times, and the reason is arithmetic. Suppose the active energies are all integer multiples of some unit $g$, so the hands turn at integer speeds $n_a$. The angles between hands return when every difference $(n_a-n_b)\,gt$ is a whole number of turns, which first happens when $gt$ equals one turn divided by $k$, the greatest common divisor of the differences. At that moment each hand has advanced $n_a/k$ turns. These fractions are all equal modulo one, because the $n_a$ all share the same remainder modulo $k$, so the whole dial has turned rigidly by a fraction of a circle, and it takes $k$ density periods to bring it home. That is the content of the proposition; the proof below just makes the gcd bookkeeping exact.

> **Proposition 1.** Let the active energies $E_a$, at least two of them distinct, be commensurate. Let $D$ be the greatest common divisor of the nonzero differences $|E_a-E_b|$ and $G$ that of the $|E_a|$. Then $\rho$ repeats after $T_\rho=2\pi/D$ (the least period unless the cross terms of some frequency in Equation (4) cancel identically) and $\psi$ after $T_\psi=2\pi/G$, and $T_\psi=(D/G)\,T_\rho$ with $D/G$ a positive integer. At $T_\rho$ every coefficient has acquired the same factor $e^{-iE_aT_\rho}$, a primitive $(D/G)$-th root of unity.

*Proof.* Write $E_a=n_ag$ with integers $n_a$ and $\gcd(n_a)=1$, so $G=g$. Differences are multiples of $g$: $D=kg$ with $k=\gcd|n_a-n_b|$. At $T_\rho=2\pi/(kg)$ every factor $e^{-i(E_a-E_b)T_\rho}$ equals one, so $\psi(t+T_\rho)=e^{-iE_aT_\rho}\psi(t)$, with the same $\omega=e^{-2\pi in_a/k}$ for every $a$ because all $n_a$ are congruent modulo $k$. A prime dividing both $k$ and the common residue would divide every $n_a$, contradicting $\gcd(n_a)=1$; so $\omega$ is a primitive $k$-th root of unity, and $\psi$ first returns at $kT_\rho=2\pi/g$: conversely $\psi(t+T)=\psi(t)$ for all $t$ forces $e^{-iE_aT}=1$ for every active $a$, because the $\phi_a$ are orthogonal, so $T\in(2\pi/g)\mathbb Z$. $\square$

For levels $n=1,2$ the energies are $-\tfrac12$ and $-\tfrac18$: in units of $\tfrac18$ the hands turn at speeds $4$ and $1$, the difference is $3$, and so $D=3/8$, $G=1/8$, $k=3$. The density repeats after $T_\rho=16\pi/3$ (the Lyman-$\alpha$ beat) and the field after $T_\psi=16\pi=3T_\rho$; each $T_\rho$ multiplies the field by $e^{2\pi i/3}$, a third of a turn. Levels $n=2,4$ also give $k=3$; levels $n=1,2,3$ give $k=1$, so field and density return together. The exact, numerical and brute-force checks of this proposition are in the working records [9].

### 3.2. The prepared state

Let $u=\phi_{100}$ and $v=\phi_{210}$ (the real $2p$ function proportional to $z\,e^{-r/2}$), and take $c_{100}=c_{210}=1/\sqrt2$ with every other coefficient zero, no external field, no modulation and no mask. Then

$$
\psi(\mathbf r,t)=\frac{e^{it/2}}{\sqrt2}\Big(u+e^{-3it/8}v\Big).
\tag{5}
$$

The two factors do two different jobs. The common factor $e^{it/2}$ turns the whole field and is invisible to density and current; the relative factor $e^{-3it/8}$ is the only thing the interference between $u$ and $v$ can feel. Expanding Equation (4),

$$
\begin{aligned}
\rho(t)&=\tfrac12\Big(u^2+v^2+2uv\cos\tfrac{3t}{8}\Big),\\
\mathbf j(t)&=-\tfrac12\sin\tfrac{3t}{8}\,\big(u\nabla v-v\nabla u\big).
\end{aligned}
\tag{6}
$$

The cross term $2uv\cos(3t/8)$ is the slosh: $uv$ is positive on the upper lobe of $2p_z$ and negative on the lower, so the cosine moves density from one side of the nucleus to the other and back. At $T_\rho=16\pi/3$ the relative factor is one and the common factor is $e^{8\pi i/3}=e^{2\pi i/3}$: density and current have returned and the field has turned by $120^\circ$. It returns exactly at $3T_\rho$. At $t=T_\rho/4$ and $3T_\rho/4$ the relative factor is $-i$ and $+i$, the cosine vanishes, and

$$
\psi\;\propto\;u\mp iv,\qquad \rho=\tfrac12(u^2+v^2),\qquad \mathbf j=\mp\tfrac12\,(u\nabla v-v\nabla u):
\tag{7}
$$

equal densities, opposite currents. The two states are complex conjugates of one another, and complex conjugation is time reversal: the frame at three quarters is the frame at one quarter with the film run backwards. A single density frame cannot tell a movie from its reverse. This is the conjugated pair that the companion paper [7] treats in a molecule.

### 3.3. What the reversal is

Integrating Equation (7) gives a statement about the cloud's centre. With $z_{12}=\langle1s|z|2p_z\rangle=128\sqrt2/243\approx0.745\,a_0$,

$$
\langle z\rangle(t)=z_{12}\cos\tfrac{3t}{8},\qquad
\int j_z\,d^3r=-\tfrac38z_{12}\sin\tfrac{3t}{8}=\frac{d\langle z\rangle}{dt}.
\tag{8}
$$

At $T_\rho/4$ and $3T_\rho/4$ the cloud's centre is at $\langle z\rangle=0$, the same place, moving with equal speed in opposite directions. Density tells us where the cloud is; the current tells us where it is going; a single frame of density cannot say which. (The second identity in Equation (8) is the velocity form of the dipole matrix element, $\int u\,\partial_zv\,d^3r=(E_v-E_u)z_{12}$; in the companion paper this identity fails for a molecular packet, and the failure is measured.)

### 3.4. Looping the beat

A loop of $M$ frames samples $t_j=t_0+jT/M$ for $0\le j<M$ and omits the endpoint, because $t_0+T$ repeats the first frame and holding it twice would stutter the join. Which $T$ closes the loop depends on what is drawn. Density repeats at $T_\rho$. The phase-carrying readouts ($\arg\psi$, $\operatorname{Re}\psi$, $\operatorname{Im}\psi$) change under the common factor, so they close only at $T_\psi=(D/G)\,T_\rho$ (Proposition 1): for the prepared state a hue loop is three density periods long, and a phase loop cut at $T_\rho$ would jump by $120^\circ$ at the seam. Two renders of the same state are the same image only if the ray-march start offset is pinned; the live view cycles that offset every 97 displayed frames, and the picture and loop exports pin it. The app's own notes attribute a small residue in density loops closed at $T_\rho$ to half-precision rounding of the rotated field [1]; Section 6.2 quantifies it for the prepared state.

## 4. What the colours show

### 4.1. Four readouts

The instrument can draw $\rho=|\psi|^2$, the phase $\theta=\arg\psi$, $\operatorname{Re}\psi$ or $\operatorname{Im}\psi$ (Figure 3). Phase maps to hue by the wheel of Figure 3, $\mathrm{hue}=\theta/2\pi+\tfrac12$ at saturation $0.85$, so $\theta=0$ is cyan and $\theta=\pi$ is red; the real and imaginary parts use orange for positive and blue for non-positive values; density uses a teal-to-white ramp. A sample's contribution to the ray is weighted by $(\rho/\rho_{\max})^{\sigma}$ with softness $\sigma=0.7$, passed through a saturating knee and then scaled by the exposure, where $\rho_{\max}$ is the largest density in that frame's own volume (for $\operatorname{Re}\psi$ and $\operatorname{Im}\psi$ the component is normalised by $\sqrt{\rho_{\max}}$, the largest $|\psi|$). Every frame is therefore normalised to itself: two frames share an opacity *rule*, not an absolute scale. The maximum is the one the kernel accumulates in a statistics buffer during reconstruction; the maxima quoted below are read back from the stored texture, which differs from it by the storage conversion of Section 6.2.

![wide](figures/p1_fig3_four-views.png){0.84}
> **Figure 3 — Four readouts of one preparation.** The prepared state at $t=T_\rho/4$ shown as density, phase, real part and imaginary part. State, time, camera, domain, grid and palette are fixed; only the OBSERVABLE control (the app's readout selector, lower right) changes. All four panels use the same normalising maximum: $\rho_{\max}$ of the one volume, and its square root for $\operatorname{Re}\psi$ and $\operatorname{Im}\psi$. The phase wheel (left) is the app's own hue function, drawn from its shader formula and checked against rendered pixels (Table 1).

### 4.2. Phase is the representative, not the state

The phase view paints the absolute $\arg\psi(\mathbf r,t)$ of the evaluated field: nothing subtracts the common factor. So a state and its $e^{i\gamma}$ multiple are drawn with every hue rotated by $\gamma$, although they are physically the same. This is not a defect to be engineered away; any choice of reference phase is a convention, and the instrument's convention is to make none. The prepared state shows the consequence directly. At $t=0$ the field is real, positive on the upper lobe and negative on the lower, so the lobes are cyan ($\theta=0$) and red ($\theta=\pi$). At $t=T_\rho$ the density is the same but $\psi=e^{2\pi i/3}\psi(0)$, so the hues must have turned by $120^\circ$; at $3T_\rho$ they must be back. Table 1 compares the hue of a small window inside each lobe, read from the captured frames, with that prediction; the residuals (at most $1.6^\circ$) are small beside the $120^\circ$ effect. Their source, compositing over the stage background for instance, was not analysed.

**Table 1 — Hue of the two lobes, measured and predicted.** Mean hue of a $24\times24$ pixel window beside the vertical axis in each lobe of the frames of Figure 1, against the wheel of Figure 3 applied to the predicted $\arg\psi$ of the lobe: $0$ and $\pi$ at $t=0$ and $3T_\rho$, and these plus $2\pi/3$ at $T_\rho$.

<!-- cols: .2 .4 .4 -->
|$t/T_\rho$|Upper lobe: measured / predicted|Lower lobe: measured / predicted|
|---|---|---|
|0|$180.2^\circ$ / $180^\circ$|$358.9^\circ$ / $0^\circ$|
|1|$299.7^\circ$ / $300^\circ$|$121.6^\circ$ / $120^\circ$|
|3|$180.2^\circ$ / $180^\circ$|$358.9^\circ$ / $0^\circ$|

The exported frames at $0$ and $3T_\rho$, phase and density alike, are identical files, while the phase frames at $0$ and $T_\rho$ differ in $45.07\%$ of the pixels of the full frame. That is an image witness and no more: the saved double-precision samples at $3T_\rho$ differ from those at $0$ by about $10^{-16}$, and the stored half-precision volumes have different hashes though their maxima agree.

So what *can* a reader take from colour? How it changes from place to place. Where $\rho>0$ write $\psi=\sqrt\rho\,e^{i\theta}$; then

$$
\mathbf j=\rho\,\nabla\theta,
\tag{9}
$$

so the velocity field of the probability fluid is the gradient of the phase: the electron flows in the direction in which the hue changes fastest around the wheel, and a uniform rotation of hue is nothing at all. Two corollaries are worth stating because the instrument shows both. Where the hues run through a full cycle around a closed loop, the circulation of the velocity around that loop is $2\pi$ times an integer; such a loop encloses a line where $\psi=0$, a quantised vortex of the kind Dirac noticed in 1931 and Hirschfelder drew streamlines around in the 1970s [15, 16]. And phase is undefined at zeros of $\psi$; there a small absolute error can change the hue by any amount (Section 6).

### 4.3. Equal density, different colour

Figure 4 pairs the density and phase views at $t=T_\rho/4$ and $3T_\rho/4$ beside the temporal factors of Equation (6). The two density frames agree, in the model by Equation (7) and in the rendered frames to within one 8-bit level, differing in $0.094\%$ of the pixels of the full frame (Section 6.2 explains why not exactly zero); the phase patterns differ, as the conjugated pair requires. Neither colour nor density *measures* the current. The evidence that the currents are opposite is Equation (6) and the dipole relation (8); the picture shows that the states, though equal in density, are not the same state.

![wide](figures/p1_fig4_beat-factors.png){0.47}
![wide](figures/p1_fig4_native-pairs.png){0.47}
> **Figure 4 — Equal density, opposite current.** Left: the temporal factors of Equation (6), with $s=t/T_\rho$; at $s=\tfrac14,\tfrac34$ the density cross term vanishes and the current factor is $-1$, $+1$. This is a formula plot, not field data. Right: native density (top) and phase (bottom) views at $t=T_\rho/4$ and $3T_\rho/4$, same preparation, camera, domain and grid. No current is drawn or measured here.

## 5. From coefficients to pixels

Three stages turn the stored state into an image (Figure 5), and each is the natural home of one of the three kinds of change from the introduction. **Reconstruction** evaluates $\psi(\mathbf r,t)$ at the centres of an $N^3$ grid over a cube of half-width $L$: $\mathbf r_{ijk}=-L+(i+\tfrac12,j+\tfrac12,k+\tfrac12)h$ with $h=2L/N$. The kernel works in single precision from packed radial and angular tables, and stores $(\operatorname{Re}\psi,\operatorname{Im}\psi)$ in each texel of a half-precision (`rgba16float`) volume; the frame's $\rho_{\max}$ is accumulated from the single-precision values during the same pass [1]. For this state the automatic domain is $L=16\,a_0$, and the default grid is $64^3$, so $h=0.5\,a_0$. **Drawing** marches rays through the volume, interpolates $(\operatorname{Re}\psi,\operatorname{Im}\psi)$ linearly between texels, forms the chosen readout from the *interpolated* components, and composites colour and weight front to back [6]. The *norm*, the energies and the periods never come from the voxels; they are computed from the coefficients.

![col](figures/p1_fig5_pipeline.png){1.0}
> **Figure 5 — What each change re-runs.** Stages of the pipeline and the controls that re-run from each. Editing a coefficient, scrubbing time or muting a lane re-evaluates the field; changing the grid or the domain reallocates the volume; camera, slice, exposure, style and palette redraw from the existing volume. This is a schematic of the implementation, not a timing result.

Which stage a control re-runs decides what a comparison can mean. In the capture record the exposure, the drawing style, the slice and the camera were each changed in turn on one volume (Figure 6): its hash stayed the same while the picture changed in every case (the field module re-evaluated the volume for each exported picture and produced the same bits each time). The only control of grid and ray steps is GRID, which sets the grid, the ray steps and the render scale together: $64^3$ uses 110 steps at scale 0.75, $96^3$ uses 160 at 1, and $128^3$ uses 240 at 1; the shipped desktop default is $64^3$ with 160 steps at scale 1, which is none of these pairings (a tablet starts on the $64^3$ pairing). Render scale is otherwise automatic and ray steps have no interface control of their own. The grid comparisons below hold steps and scale at 160 and 1 by setting them on the page state, which no interface control can do, so they change the grid alone.

![wide](figures/p1_fig7_presentations.png){0.9}
> **Figure 6 — One reconstructed volume, five presentations.** The prepared state at $t=T_\rho/4$ on the $64^3$ grid in the phase view: (a) as captured; (b) exposure raised from 1 to 2; (c) style CLOUD changed to SOLID; (d) slice VOLUME changed to SLAB through $x=0$; (e) camera changed from free to turntable at yaw 0, pitch 0. The stored volume has the same hash (`ac75919`) in all five, although the field module re-evaluated it for each exported picture. The style, slice mode and camera mode were changed by clicks; the exposure, the slab axis and the turntable angles were set on the page state.

## 6. What each quantity needs from the stored volume

### 6.1. Three readouts, three sensitivities

The three readouts are not equally fragile, and the differences are easy to state. Suppose a stored amplitude differs from $\psi$ by $\xi$ with $|\xi|\le\epsilon_0$, and its gradient by at most $\epsilon_1$ ($|\nabla\xi|\le\epsilon_1$). Expanding the squared magnitude bounds the density error,

$$
\big|\,|\psi+\xi|^2-|\psi|^2\,\big|\le2|\psi|\epsilon_0+\epsilon_0^2,
\tag{10}
$$

so density needs only value accuracy. Current also needs the gradient. Expanding $\operatorname{Im}\big((\bar\psi+\bar\xi)(\nabla\psi+\nabla\xi)\big)$,

$$
\|\widetilde{\mathbf j}-\mathbf j\|\le|\psi|\epsilon_1+\|\nabla\psi\|\epsilon_0+\epsilon_0\epsilon_1.
\tag{11}
$$

A small value error can coexist with a large derivative error, and the standard example is a ripple too fine to see in the value and violent in the slope: on a local interval take $\psi=1$ and $\xi(x)=i\epsilon\sin(x/\epsilon^2)$. Then $|\xi|\le\epsilon$ and the densities at $x=0$ are both one, but the perturbed current is $1/\epsilon$ (here $\epsilon_0=\epsilon$ and $\epsilon_1=1/\epsilon$). Density agreement does not control the current. Phase, finally, needs an amplitude margin: if $|\psi|>\epsilon_0$ and both phases use the same reference, the possible values of $\psi+\xi$ lie in a disk around $\psi$ that excludes the origin, and its tangent rays give

$$
|\delta\theta|_{\rm circ}\le\arcsin\!\big(\epsilon_0/|\psi|\big).
\tag{12}
$$

At a zero of $\psi$ the phase is undefined, and near one a small absolute error can turn the hue arbitrarily; a phase comparison must state its amplitude cutoff and use circular distance. These are statements about stated uncertainties, not measured tolerances of the app. The molecular FLOW overlay of the companion paper [7], which draws tracers along the current, evaluates analytic Gaussian gradients separately from the display volume for exactly the reason of Equation (11).

### 6.2. Half-precision storage, and what the instrument does

The one-sentence result of this section is that on the test device every stored amplitude is a hair low, because the store truncates toward zero, and the density drawn from it is low by less than $0.2\%$. The rest is the bookkeeping that establishes it.

Storing $(\operatorname{Re}\psi,\operatorname{Im}\psi)$ in binary16 replaces each component $s$ in the binary16 normal range ($|s|\ge2^{-14}$) by $\hat s=s(1-\kappa)$; below that range the error is absolute, at most $2^{-24}$ (truncation) or $2^{-25}$ (nearest), or up to $2^{-14}$ if the device flushes subnormal values to zero, which WGSL permits, and the relative bounds below do not apply. The exception applies per component. In the $64^3$ volume at $T_\rho/4$ about $32\%$ of the voxels have both components below $2^{-14}$ and a further $12\%$ have one, but a component below $2^{-14}$ changes the density by less than $2^{-28}$, which is $6\times10^{-8}$ of the maximum even if it is flushed to zero, so the exception touches nothing visible. If the conversion rounds to nearest, $|\kappa|\le2^{-11}$ and $\kappa$ has either sign; if it truncates toward zero, $0\le\kappa<2^{-10}$. For $\hat\rho=\widehat{\operatorname{Re}\psi}^2+\widehat{\operatorname{Im}\psi}^2$ either way

$$
\begin{aligned}
&\text{truncation:}\quad 0\le\frac{\rho-\hat\rho}{\rho}<2\cdot2^{-10}\approx1.95\times10^{-3},\\
&\text{nearest:}\quad\frac{|\hat\rho-\rho|}{\rho}\le2\cdot2^{-11}+2^{-22}.
\end{aligned}
\tag{13}
$$

Which applies is a property of the device, and the instrument can be asked. During the captures it read back the stored volume's largest $\hat\rho$ for eight frames: six beat times at $64^3$ and the $96^3$ and $128^3$ grids at $T_\rho/4$. We computed the same maxima from the exact field on the same cell-centred grids, converting each component to binary16 either by rounding to nearest or by truncation. **Truncation reproduces all eight native values to every digit read back; rounding to nearest differs from them in seven of the eight frames (the $96^3$ frame cannot tell the two apart), by up to $1.9\times10^{-3}$ in relative terms** (Table 2 gives three of the eight). The maxima are decided by the few texels nearest the nucleus, so this tests the conversion there and not over the whole volume. On this device (an RTX 3070, driver 595.99.02, Chromium 155 over Vulkan) the stored amplitudes are consistent with truncation toward zero: in the normal range they are low, relatively, by less than $2^{-10}$ and the density by less than $1.95\times10^{-3}$, one-sidedly. The molecular kernel of the companion paper [7] behaves the same way in thirteen further volumes.

Neither specification fixes the rounding mode of such a store. WGSL defines a store to a `16float` texel through `quantizeToF16` (its texel-format table and §17.5.47), which follows its rule for converting a value to a floating-point type (§15.7.6) [4]: a value lying between two adjacent representable values converts to one of them, WGSL does not specify whether the higher or the lower is chosen, and different instances of a conversion may choose differently; a subnormal result may be flushed to zero. The WebGPU specification, as read on 17 October 2026, adds no rounding rule [12]. The Vulkan specification, on which a Vulkan-backed browser rests, says that finite values between two representable values are rounded “to one or the other” and that “the rounding mode is not defined” [13]. A public WebGPU issue records an NVIDIA device that appeared to round toward zero for values beyond the binary16 range [8]. Truncation is therefore not excluded by the specifications. It is reported for this device only, and anywhere else only the bound $|\hat\rho-\rho|/\rho<2\cdot2^{-10}+2^{-20}$, which holds whichever neighbour the device picks, should be used.

**Table 2 — The sampled density maximum on three grids, and its closed form.** State at $t=T_\rho/4$; native read-back of the stored volume's largest $\hat\rho$; the formula $e^{-\sqrt3h}/2\pi$ of Equation (15) with $h=2L/N$ and $L=16\,a_0$; and the ratio of the native value to the nuclear value $\rho(0)=1/2\pi=0.1592$.

|Grid|Spacing $h$ ($a_0$)|Native $\hat\rho_{\max}$|$e^{-\sqrt3h}/2\pi$|Ratio to $\rho(0)$|
|---|---|---|---|---|
|$64^3$|0.500|0.06710|0.06694|0.42|
|$96^3$|0.333|0.08943|0.08935|0.56|
|$128^3$|0.250|0.10322|0.10322|0.65|

The same conversion accounts for the small mismatches between analytically equal frames that a careful reader will have noticed in Section 4: at the two times the same density is split differently between $\operatorname{Re}\psi$ and $\operatorname{Im}\psi$, so the stored components lose different amounts to truncation. The read-back maxima for $t=0$ and $T_\rho$ differ by a relative $1.0\times10^{-3}$, and those for $T_\rho/4$ and $3T_\rho/4$ by a relative $8.6\times10^{-4}$, both inside the truncation bound; the rendered density frames at $T_\rho/4$ and $3T_\rho/4$ differ by at most one 8-bit level in $0.094\%$ of the pixels of the full frame, counting a pixel as changed if any colour channel changes ($0.069\%$ for $t=0$ against $T_\rho$). The renderer normalises by the statistics maximum and not by the stored one, so this attribution is inferred and was not isolated.

### 6.3. Grids and the nuclear cusp

![wide](figures/p1_fig6_grid.png){0.72}
> **Figure 7 — Grid resolution.** Phase view of the prepared state at $t=T_\rho/4$ on $64^3$, $96^3$ and $128^3$ grids (spacing and sampled maximum above each column). State, time, camera, domain, material, and (set on the page state) ray steps (160) and render scale (1) are fixed. The lower row is the nuclear region at native pixels, not enlarged. The comparison is visual; no evaluator-error panel is claimed.

A grid with an even number of cells centred on the nucleus never samples the nucleus: the nearest sample sits half a cell diagonal away. That one fact explains the brightness of every density frame in this paper, and it is worth deriving before the general error bound, which turns out to be useless exactly there. Between stored samples the instrument interpolates linearly. For a scalar component $f$ that is twice differentiable on a cell, with spacings $h_q$, the multilinear interpolation error obeys

$$
\|f-I_hf\|_\infty\le\frac18\sum_{q=x,y,z}h_q^2\,\|\partial_{qq}f\|_\infty,
\tag{14}
$$

from the one-dimensional remainder in each direction; interpolation weights are non-negative and sum to one, so sample errors of at most $\eta$ add at most $\eta$. Equation (14) requires smooth cells and exact weights, and the $1s$ amplitude $e^{-r}/\sqrt\pi$ has an unbounded second derivative at the nucleus, so the bound says nothing where it matters most. What the grid does there is simple. The nearest centres to the nucleus are at distance $r_*=\tfrac{\sqrt3}{2}h$, where $\rho\approx\rho(0)e^{-2r_*}$, so the sampled maximum, and with it the brightness normaliser of the frame, is

$$
\rho_{\max}\approx\rho(0)\,e^{-\sqrt3\,h}.
\tag{15}
$$

Table 2 compares Equation (15) with the native values; the float64 grid maximum agrees with the formula to $0.3\%$ at $64^3$ (the small $2p$ term accounts for the rest). The sampled peak is a property of the grid: $42\%$ of the true value at $64^3$ and $65\%$ at $128^3$. In Figure 7 the hue pattern is the same on all three grids, while the brightness falls everywhere outside the saturated core (on the field crops the mean level drops by $14\%$ from $64^3$ to $128^3$) because the maximum that normalises each frame rises by $54\%$; the cusp is under-sampled on all three. A finer grid therefore makes the picture *dimmer*, which surprises until Equation (15) is in hand. The comparison is visual; it does not establish an accuracy, and the hydrogen evaluator comparison that would is not part of this work.

## 7. Scope and evidence

**Table 3 — What supports what.** *Proved*: derived here from the stated assumptions (standard identities where named) and checked, symbolically or numerically, as described. *Derived*: derived here as a leading-order statement, not a bound. *Classical*: established theory used as background. *Design*: read from the instrument's source at the examined revision. *Device observation*: measured on the capture device and not claimed more widely. *Not established*: stated so that it is not inferred.

<!-- wide cols: .50 .20 .30 -->
|Statement|Where|Status|
|---|---|---|
|Density period $T_\rho=2\pi/D$; field period $T_\psi=(D/G)T_\rho$; common factor a primitive $(D/G)$-th root of unity|Proposition 1|Proved|
|Two-state field, density, current; equal density and opposite current at $T_\rho/4$, $3T_\rho/4$; dipole relation|Equations (5)–(8)|Proved; Classical|
|$\mathbf j=\rho\nabla\theta$; hue turns with the common phase (measured $119.5^\circ$ and $122.7^\circ$)|Equation (9), Table 1|Proved; Device observation|
|Edits through the inverse phase; mute and solo as a display mask; reconstruction separate from drawing; draw-only controls leave the volume unchanged|Section 2, Figures 5, 6|Design; Device observation (recorded counters)|
|Density, current and phase sensitivities|Equations (10)–(12)|Proved (stated uncertainties)|
|Binary16 truncation on the capture device; one-sided bound $1.95\times10^{-3}$|Equation (13), Table 2|Device observation (eight maxima reproduced to full read-back precision)|
|Sampled maximum $\rho(0)e^{-\sqrt3h}$|Equation (15), Table 2|Derived (exact for the 1s part, within 0.3% for the full state at $64^3$); Device observation (agrees with read-backs)|
|Hue pattern unchanged across grids; brightness follows the normalising maximum|Figure 7|Device observation (visual comparison only)|
|Exported frames identical at $0$ and $3T_\rho$; $45.07\%$, $0.094\%$ and $0.069\%$ of pixels changed in the three comparisons|Sections 4.2, 4.3, 6.2|Device observation|
|Accuracy of the hydrogen reconstruction, current or phase on the device; timing; learning outcomes|—|Not established|

Table 3 sorts the claims of this paper by what supports them. The two-state scene is exact, so every claim about it can be checked against an equation; the captures agree with the equations at the points checked: eight stored maxima (Section 6.2, Table 2), the lobe hues of Table 1 and the pixel comparisons of Sections 4.2, 4.3 and 6.2. They do not validate other states, other browsers or other devices. Pixel equality across devices is a separate question, which may depend on the device's conversion rule (Section 6.2). The finite basis ($n\le6$, no continuum) and the single-precision kernel set the scope. Higher states, unbound dynamics and unrestricted molecular physics require other models, and molecular and FLOW (tracer) results are in the companion paper [7].

Each *not established* item is a measurement that a further session with this instrument could make: a pointwise comparison of the hydrogen kernel with a double-precision evaluator, the same read-back on a second device and browser, and frame timings.

## 8. Summary

A hydrogen state is a short list of complex numbers turning at their energies. Density and current see only the angles between them, so for the beat $(1s+2p_z)/\sqrt2$ the density repeats after $T_\rho=16\pi/3$ atomic units while the complex field, which also sees the dial's zero, repeats only after $3T_\rho$; the currents at a quarter and three quarters of the beat are opposite, the two frames being each other's time reverse, and their integral is the velocity of the cloud's centre (Equations (5)–(8)). A phase view paints $\arg\psi$, so a common factor, which is no physical change, turns every hue, while a hue *gradient* is a current (Section 4). A stored volume must supply value accuracy for density, gradient accuracy for current and an amplitude margin for phase (Section 6.1). A truncating binary16 model reproduces all eight read-back maxima to every digit read back, and seven of them exclude rounding to nearest; a cell-centred grid samples the nuclear cusp at $42\%$ to $65\%$ of its height, so a finer grid draws a dimmer picture (Sections 6.2 and 6.3). None of this validates other states, devices or the molecular pictures of the companion paper [7].

## References

- Magic Commons. *λWAVES source repository*, revision `28fe4457b68f0a012f49efee174bcfc91f083ce0`, including `lab/field.js`, `lab/capture.js`, `lab/period.js` and `REPORT.md`. [github.com/magic-commons/lambdawaves](https://github.com/magic-commons/lambdawaves).
- NIST. *Digital Library of Mathematical Functions*, Sections 14.30 and 18.3: [dlmf.nist.gov/14.30](https://dlmf.nist.gov/14.30) (spherical harmonics) and [dlmf.nist.gov/18.3](https://dlmf.nist.gov/18.3) (classical orthogonal polynomials). Accessed 11 October 2026.
- R. W. Robinett. Quantum wave packet revivals. *Physics Reports* **392**, 1–119 (2004). [doi:10.1016/j.physrep.2003.11.002](https://doi.org/10.1016/j.physrep.2003.11.002); [arXiv:quant-ph/0401031](https://arxiv.org/abs/quant-ph/0401031).
- W3C. *WebGPU Shading Language*. [w3.org/TR/WGSL](https://www.w3.org/TR/WGSL/). Accessed 17 October 2026.
- S. Zaman Ahmed, J. H. M. Jensen, C. A. Weidner, J. J. Sørensen, M. Mudrich and J. F. Sherson. Quantum composer: A programmable quantum visualization and simulation tool for education and research. *American Journal of Physics* **89**, 307–316 (2021). [doi:10.1119/10.0003396](https://doi.org/10.1119/10.0003396); [arXiv:2006.07263](https://arxiv.org/abs/2006.07263).
- M. Levoy. Display of surfaces from volume data. *IEEE Computer Graphics and Applications* **8**(3), 29–37 (1988). [graphics.stanford.edu/papers/volume-cga88](https://graphics.stanford.edu/papers/volume-cga88/).
- SOL-6.1 and Sonnet 5.5. *From Molecular Orbitals to Electronic Current*. Draft 07 (18 October 2026), companion to this paper.
- gpuweb contributors. Define edge case behaviour for f32 to f16 conversions. Issue 1201, opened 3 November 2020, closed 29 March 2022. [github.com/gpuweb/gpuweb/issues/1201](https://github.com/gpuweb/gpuweb/issues/1201). Accessed 17 October 2026.
- SOL-6.1 and Sonnet 5.5. Capture and verification records, 12–17 October 2026: native-capture ledger, exact-control scripts and outputs, and the independent checks with the responses to them (private working records, available with the edition).
- H. A. Bethe and E. E. Salpeter. *Quantum Mechanics of One- and Two-Electron Atoms*. Springer, 1957.
- L. D. Landau and E. M. Lifshitz. *Quantum Mechanics: Non-Relativistic Theory*. 3rd edition, Pergamon, 1977.
- W3C. *WebGPU*. [w3.org/TR/webgpu](https://www.w3.org/TR/webgpu/). Accessed 17 October 2026.
- Khronos Group. *The Vulkan Specification*, Fundamentals: Floating-Point Format Conversions. [docs.vulkan.org/spec/latest/chapters/fundamentals.html](https://docs.vulkan.org/spec/latest/chapters/fundamentals.html). Accessed 17 October 2026.
- B. Thaller. *Visual Quantum Mechanics: Selected Topics with Computer-Generated Animations of Quantum-Mechanical Phenomena*. Springer, 2000. [doi:10.1007/b98962](https://doi.org/10.1007/b98962). (Added in Draft 08; bibliographic details to be confirmed against the publisher's record before posting.)
- P. A. M. Dirac. Quantised singularities in the electromagnetic field. *Proceedings of the Royal Society A* **133**, 60–72 (1931). [doi:10.1098/rspa.1931.0130](https://doi.org/10.1098/rspa.1931.0130). (Added in Draft 08; to be confirmed.)
- J. O. Hirschfelder, A. C. Christoph and W. E. Palke. Quantum mechanical streamlines. I. Square potential barrier. *Journal of Chemical Physics* **61**, 5435–5455 (1974). [doi:10.1063/1.1681899](https://doi.org/10.1063/1.1681899). (Added in Draft 08; to be confirmed.)

## Credits

### People

Written by **SOL-6.1 and Sonnet 5.5**. AI-generated. Exposition pass, Draft 08, by **Fable 5.1 (Claude Yan)**: prose only; no equation, number, table or figure of Draft 07 was changed, and three background references were added.

λWAVES, the application this paper describes, was created by **Joshua Hosain**.

The equations and numbers were checked with exact-control scripts, and each paper was independently re-read and re-computed twice by separate Claude instances, and the text was corrected in response to their findings; the records are kept with the edition. No external peer review is claimed. The native captures were made in the application on one machine.

### With Thanks

Built proudly with

<!-- ai-logos -->

λWAVES application credits, taken from the application's saved About page. They name the tools the application was built with and imply no endorsement; authorship of this paper is stated above.

### Credits & Licenses

Title lettering is set in Butler Free SemiBold (Fabian De Smet) and in LW Title, a subset of Spinwerad by gluk (SIL Open Font License 1.1); the λ of the logo is from STIX Two Math (SIL Open Font License 1.1). Text is set in Linux Libertine and Biolinum with newtxmath mathematics. Font notices and licensing texts are kept with the edition's assets. The Magic Commons and λWAVES logos and the model marks are supplied artwork and belong to their owners.
