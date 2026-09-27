// Rest positions and aSize scalars for ParticleField. Both exports share the four populations' index ranges so each
// size fits its particle (AGENTS.md, Particle Systems); motion, shader and blending live in ParticleField.tsx.

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

    // ── 1. Nebula core: area-weighted disc haze (20%) ─────────────────────
    // r = R·√u gives uniform areal density, so the centre is too sparse (P(r < 0.1) ≈ 0.002) to blow out additively.
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
    // Golden-angle placement forms arms with no branch logic; rUndulate and densityWave carve strands and voids.
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

        // XY scatter: wide in void zones, very tight in bright strands, so the large aSize nodes stack densely
        // there and additive blending merges them into glowing pools.
        const xyScatter = (1.0 - densityWave) * 0.92 + 0.04;

        const r           = rBase + rUndulate + (Math.random() - 0.5) * xyScatter;
        const lateralJitter = (Math.random() - 0.5) * xyScatter;

        // Z: two sinusoidal layers for volumetric depth. Dense zones stay in a thin slab (a defined glowing ribbon);
        // void zones scatter deep in Z, so they shrink to faint dots receding into the dark.
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
    // Seven swaying arms with power-law scatter; t = rand^0.7 favours the outer half so the tips are not barren.
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

            // Radial scatter: a rand^2.8 power law, so ~85% of particles sit under 0.25 units from the centreline
            // and a tiny fraction extend to 0.40 as ethereal halos
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

    // ── 4. Cosmic dust: sparse outer annulus (remaining ≈ 12%) ──────────────
    // The r ≥ 2.2 floor keeps the bright core clean; rand^0.55 clusters dust near the body, not at the far edge.
    while (idx < count * 3) {
        const r = 2.2 + Math.pow(Math.random(), 0.55) * 5.0;
        const θ = Math.random() * TWO_PI;
        const z = (Math.random() - 0.5) * 4.5;
        write(r * Math.cos(θ), r * Math.sin(θ) * 0.82, z);
    }

    return positions;
}

// aSize multiplies gl_PointSize, on generateSilhouetteParticles' index ranges. Nodes (about 30%) are likelier where
// additive glow is already strongest, so large particles stack on the bright structure. AGENTS.md, Particle Systems.
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
            // Spiral: node probability follows the same densityWave as the position scatter, so large
            // particles land on the tight bright strands rather than in the wide void zones.
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
