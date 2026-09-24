// Two exports for ParticleField:
//   generateSilhouetteParticles — base XYZ positions (Float32Array, stride 3)
//   generateParticleSizes       — per-particle aSize scalars (Float32Array, stride 1)
//
// Both use the same four-population structure so particle indices align:
//   0        … coreN-1              → nebula core       (20%)
//   coreN    … coreN+spiralN-1      → Fibonacci spiral  (40%)
//   coreN+spiralN … -filamentN-1   → sinuous filaments  (28%)
//   rest                            → cosmic dust        (12%)
//
// Defines initial positions and sizes only. The motion, shader and blending
// live in components/particles/ParticleField.tsx.

export function generateSilhouetteParticles(count: number = 5000): Float32Array {
    const positions = new Float32Array(count * 3);
    let idx = 0;

    const TWO_PI = Math.PI * 2;

    // Golden angle in radians — irrational, so every placement lands in a new sector.
    // This is the basis of the classic Fermat / phyllotaxis spiral.
    const PHI = 2.39996323; // 2π × (2 − φ) ≈ 137.508°

    const write = (x: number, y: number, z: number) => {
        if (idx >= positions.length) return;
        positions[idx++] = x;
        positions[idx++] = y;
        positions[idx++] = z;
    };

    // ── 1. Nebula core — area-weighted disc haze (20%) ────────────────────
    // r = R·√u gives a uniform areal density: f(r) ∝ r, so particles-per-unit-
    // area is constant everywhere in the disc. The centre is naturally sparse
    // (small area = few particles) with no hard cutoff and no forced ring.
    // P(r < 0.1) ≈ (0.1/2.2)² ≈ 0.002 → ~2 particles within r=0.1 total —
    // far below the additive-blending blowout threshold.
    const coreN = Math.floor(count * 0.20);
    for (let i = 0; i < coreN; i++) {
        const r = 2.2 * Math.sqrt(Math.random()); // uniform over disc area, r ∈ [0, 2.2]
        const θ = Math.random() * TWO_PI;
        const z = Math.sin(θ * 3.0 + r * 1.8) * r * 0.45
                + (Math.random() - 0.5) * 0.60;
        write(
            r * Math.cos(θ),
            r * Math.sin(θ) * 0.78,   // slight vertical compression
            z
        );
    }

    // ── 2. Fibonacci / Fermat spiral arms (40%) ─────────────────────────────
    // r = c·√n (Fermat), θ = n·golden_angle → natural arm-like clustering without
    // explicit branch logic. Two mechanisms create dark voids and luminous strands:
    //   a) rUndulate: sinusoidal deviation ripples each arm inward and outward.
    //   b) densityWave: a slow sine across the index modulates the lateral XY
    //      scatter width; in wave troughs (≈0) particles are tightly bunched
    //      (bright additive cluster); in peaks (≈1) they are spread wide (dark void).
    // Z is layered with two independent frequencies for thick volumetric depth.
    const spiralN = Math.floor(count * 0.40);
    for (let i = 0; i < spiralN; i++) {
        const t     = i / spiralN;                             // normalised index [0,1)
        const rBase = 0.12 + Math.sqrt(t) * 5.2;              // Fermat spiral radius
        const θ     = i * PHI;                                 // golden-angle placement

        // Arm undulation — two overlapping sine frequencies keep arms from looking like
        // rigid spokes; they wave and kink as the spiral unwinds
        const rUndulate = Math.sin(i * 0.110 + θ * 1.80) * 0.32
                        + Math.cos(i * 0.068 + θ * 0.85) * 0.18;

        // Density wave: slow sine over the full spiral index
        const densityWave = Math.sin(i * 0.033) * 0.50 + 0.50; // [0, 1]

        // XY scatter: wide in void zones, very tight in bright strands so that
        // the large node particles (added via aSize) stack densely and the
        // additive blending merges them into brilliant glowing pools.
        const xyScatter = (1.0 - densityWave) * 0.92 + 0.04;

        const r           = rBase + rUndulate + (Math.random() - 0.5) * xyScatter;
        const lateralJitter = (Math.random() - 0.5) * xyScatter;

        // Z: two sinusoidal layers give plankton-in-deep-ocean volumetric thickness.
        // Dense zones stay in a thin Z slab (well-defined glowing ribbon);
        // void zones scatter deep in Z (tiny, faint dots receding into the dark).
        const zRibbon = Math.sin(θ * 3.6 + i * 0.019) * 1.25
                      + Math.cos(θ * 1.5 + i * 0.012) * 0.65;
        const zNoise  = densityWave > 0.45
            ? (Math.random() - 0.5) * 0.45   // bright strand: thin Z slice
            : (Math.random() - 0.5) * 2.40;  // void: deep Z scatter → tiny on screen

        write(
            r * Math.cos(θ) + lateralJitter,
            r * Math.sin(θ) * 0.82 + lateralJitter * 0.50,
            zRibbon + zNoise
        );
    }

    // ── 3. Sinuous branching filaments (28%) ────────────────────────────────
    // Seven arms radiate outward. Each arm is a parametric curve:
    //   centreline: linear march in a base angle + sinusoidal lateral sway (sway = amp·sin(…))
    //   scatter:    power-law radial displacement from the centreline — most particles
    //               hug the strand tightly; the outermost are gossamer-thin halos.
    // Power-bias on t (t = rand^0.7) slightly favours the outer half of each arm so
    // the tips are not barren — combined with sparser scatter at high t this gives a
    // natural taper without hard truncation.
    const filamentN = Math.floor(count * 0.28);
    const NUM_ARMS  = 7;
    const perArm    = Math.floor(filamentN / NUM_ARMS);

    for (let f = 0; f < NUM_ARMS; f++) {
        const angle  = (f / NUM_ARMS) * TWO_PI + (Math.random() - 0.5) * 0.55;
        const perp   = angle + Math.PI * 0.5;    // perpendicular direction for sway
        const phase1 = Math.random() * TWO_PI;   // XY sway phase
        const phase2 = Math.random() * TWO_PI;   // Z oscillation phase
        const amp    = 0.35 + Math.random() * 0.50;  // lateral sway amplitude
        const len    = 3.2 + Math.random() * 1.80;   // arm length [3.2, 5.0]

        // Assign leftover particles to the final arm
        const particles = f === NUM_ARMS - 1
            ? filamentN - perArm * (NUM_ARMS - 1)
            : perArm;

        for (let p = 0; p < particles; p++) {
            // rand^0.70 is tip-biased: P(t<0.05) ≈ 1.4% × 1400 total ≈ 20 particles,
            // spread across 7 arm angles — negligible per-direction density near origin.
            const t    = Math.pow(Math.random(), 0.70);

            // Centreline with sinusoidal lateral sway (3.5 full cycles per arm)
            const sway = amp * Math.sin(t * Math.PI * 3.5 + phase1);
            const cx   = t * len * Math.cos(angle) + sway * Math.cos(perp);
            const cy   = t * len * Math.sin(angle) + sway * Math.sin(perp);

            // Radial scatter: cube-root power-law — almost all particles < 0.25 units
            // from centreline; a tiny fraction extend to 0.40 as ethereal halos
            const scatter      = Math.pow(Math.random(), 2.80) * 0.40;
            const scatterAngle = Math.random() * TWO_PI;

            // Z: sinusoidal along the arm + small noise
            const z = Math.sin(t * Math.PI * 5.0 + phase2) * 1.60
                    + (Math.random() - 0.5) * 0.55;

            write(
                cx + scatter * Math.cos(scatterAngle),
                cy + scatter * Math.sin(scatterAngle),
                z
            );
        }
    }

    // ── 4. Cosmic dust — sparse outer annulus (remaining ≈ 12%) ─────────────
    // Particles beyond the main structure (r ∈ [2.2, 7.2]).
    // The annular floor (r ≥ 2.2) keeps the bright core region clean.
    // Power bias on radius (r = rand^0.55 * 5.0 + 2.2) slightly clusters
    // them just outside the main body rather than uniformly at the far edge.
    while (idx < count * 3) {
        const r = 2.2 + Math.pow(Math.random(), 0.55) * 5.0;
        const θ = Math.random() * TWO_PI;
        const z = (Math.random() - 0.5) * 4.5;
        write(r * Math.cos(θ), r * Math.sin(θ) * 0.82, z);
    }

    return positions;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateParticleSizes
// Returns a per-particle aSize scalar that the vertex shader multiplies into
// gl_PointSize. Uses the same population boundaries as generateSilhouetteParticles
// so indices align and each particle's size matches its structural role:
//   node  (≈30%): aSize ∈ [1.50, 2.50] — prominent filament anchors
//   grain (≈70%): aSize ∈ [0.75, 1.00] — fine-dust background texture
//
// Node probability is elevated in regions that will be bright under additive
// blending (core nucleus, spiral dense-wave zones, filament strands), so the
// large particles stack exactly where glow accumulation is already strongest.
// ─────────────────────────────────────────────────────────────────────────────
export function generateParticleSizes(count: number = 5000): Float32Array {
    const sizes     = new Float32Array(count);
    const coreN     = Math.floor(count * 0.20);
    const spiralN   = Math.floor(count * 0.40);
    const filamentN = Math.floor(count * 0.28);
    // dust indices: coreN + spiralN + filamentN … count - 1

    const node  = () => 1.50 + Math.random() * 1.00;  // [1.50, 2.50]
    const grain = () => 0.75 + Math.random() * 0.25;  // [0.75, 1.00]

    for (let i = 0; i < count; i++) {

        if (i < coreN) {
            // Nucleus: half are prominent nodes — creates the blazing-bright centre
            sizes[i] = Math.random() < 0.50 ? node() : grain();

        } else if (i < coreN + spiralN) {
            // Spiral: node probability scales with the same densityWave used for
            // position scatter, so large particles land on the tight bright strands
            // rather than in the wide void zones.
            const localIdx    = i - coreN;
            const densityWave = Math.sin(localIdx * 0.033) * 0.50 + 0.50; // [0, 1]
            const pNode       = 0.10 + densityWave * 0.40; // [0.10, 0.50], avg ≈ 0.30
            sizes[i] = Math.random() < pNode ? node() : grain();

        } else if (i < coreN + spiralN + filamentN) {
            // Filaments: 30% nodes anchor the sinuous arms; the rest are fine halo
            sizes[i] = Math.random() < 0.30 ? node() : grain();

        } else {
            // Cosmic dust: almost exclusively fine grain — rare bright outlier
            sizes[i] = Math.random() < 0.05 ? node() : grain();
        }
    }

    return sizes;
}
