/**
 * Shape generators for the morphing particle system.
 *
 * Each generator returns a Float32Array of [x, y, z] positions for `count` particles
 * that, taken together, outline a recognizable shape.
 *
 * Shapes and what they symbolize:
 *   Lightbulb  – the spark of an idea
 *   Rocket     – the drive to launch and build
 *   Diamond    – resilience under pressure
 *   Bridge     – connecting ideas and people
 *   DNA Helix  – growth and evolution
 */

// ─── helpers ────────────────────────────────────────────────
function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function jitter(v: number, amount = 0.08) {
    return v + (Math.random() - 0.5) * amount;
}

// ─── Lightbulb ──────────────────────────────────────────────
export function generateLightbulb(count: number): Float32Array {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random();

        if (r < 0.60) {
            // Glass bulb surface (dense)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 1.6 + (Math.random() - 0.5) * 0.1;
            pos[i3] = jitter(radius * Math.sin(phi) * Math.cos(theta));
            pos[i3 + 1] = jitter(radius * Math.cos(phi) + 1.2);
            pos[i3 + 2] = jitter(radius * Math.sin(phi) * Math.sin(theta) * 0.5);
        } else if (r < 0.70) {
            // Inner glowing filament
            const t = Math.random();
            const waveX = Math.sin(t * Math.PI * 6) * 0.4;
            pos[i3] = jitter(waveX, 0.05);
            pos[i3 + 1] = jitter(t * 1.8 + 0.4, 0.05);
            pos[i3 + 2] = jitter(0, 0.05);
        } else if (r < 0.85) {
            // Screw base (threads)
            const theta = Math.random() * Math.PI * 2;
            const y = rand(-1.0, 0.0);
            const baseR = 0.6 + Math.sin(y * 20) * 0.05; // threaded texture
            pos[i3] = jitter(baseR * Math.cos(theta), 0.02);
            pos[i3 + 1] = jitter(y, 0.02);
            pos[i3 + 2] = jitter(baseR * Math.sin(theta) * 0.5, 0.02);
        } else {
            // Ambient aura
            pos[i3] = rand(-4, 4);
            pos[i3 + 1] = rand(-3, 4);
            pos[i3 + 2] = rand(-1.5, 1.5);
        }
    }
    return pos;
}

export function generateRocket(count: number): Float32Array {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random();

        if (r < 0.35) {
            // Core Stage (Main Fuselage)
            const y = rand(-1.5, 2.0);
            const theta = Math.random() * Math.PI * 2;
            const bodyR = 0.45; 
            
            // Cut out a circle for the window on the core stage
            const isWindow = y > 0.5 && y < 1.5 && Math.abs(theta) < 0.6;
            
            if (isWindow) {
                const rimR = 0.25;
                const rimAngle = Math.random() * Math.PI * 2;
                pos[i3] = jitter(0.5 + rimR * Math.cos(rimAngle) * 0.2); 
                pos[i3 + 1] = jitter(1.0 + rimR * Math.sin(rimAngle));
                pos[i3 + 2] = jitter(rimR * Math.cos(rimAngle) * 0.8);
            } else {
                pos[i3] = jitter(bodyR * Math.cos(theta));
                pos[i3 + 1] = jitter(y);
                pos[i3 + 2] = jitter(bodyR * Math.sin(theta));
            }
        } else if (r < 0.45) {
            // Core Stage Nose Cone
            const y = rand(2.0, 3.5);
            const coneR = 0.45 * (1 - (y - 2.0) / 1.5); 
            const theta = Math.random() * Math.PI * 2;
            pos[i3] = jitter(coneR * Math.cos(theta));
            pos[i3 + 1] = jitter(y);
            pos[i3 + 2] = jitter(coneR * Math.sin(theta));
        } else if (r < 0.65) {
            // Side Boosters (Left and Right)
            const isLeft = Math.random() > 0.5;
            const centerX = isLeft ? -0.8 : 0.8;
            
            const isCone = Math.random() > 0.7; // 30% of booster is the cone
            if (isCone) {
                // Booster Cone
                const y = rand(0.5, 1.2);
                const coneR = 0.25 * (1 - (y - 0.5) / 0.7);
                const theta = Math.random() * Math.PI * 2;
                pos[i3] = jitter(centerX + coneR * Math.cos(theta));
                pos[i3 + 1] = jitter(y);
                pos[i3 + 2] = jitter(coneR * Math.sin(theta));
            } else {
                // Booster Cylinder
                const y = rand(-1.5, 0.5);
                const theta = Math.random() * Math.PI * 2;
                const boostR = 0.25;
                pos[i3] = jitter(centerX + boostR * Math.cos(theta));
                pos[i3 + 1] = jitter(y);
                pos[i3 + 2] = jitter(boostR * Math.sin(theta));
            }
        } else if (r < 0.75) {
            // Booster Struts (connecting boosters to core)
            const isLeft = Math.random() > 0.5;
            const startX = isLeft ? -0.45 : 0.45;
            const endX = isLeft ? -0.55 : 0.55;
            const t = Math.random();
            const x = startX + t * (endX - startX);
            const y = Math.random() > 0.5 ? -1.0 : 0.0; // two struts per booster
            pos[i3] = jitter(x, 0.02);
            pos[i3 + 1] = jitter(y, 0.05);
            pos[i3 + 2] = jitter(0, 0.05);
        } else if (r < 0.92) {
            // Exhaust Flames (Core + 2 Boosters)
            const engine = Math.random();
            let centerX = 0;
            if (engine < 0.33) centerX = -0.8;
            else if (engine < 0.66) centerX = 0.8;
            
            const y = rand(-3.0, -1.5);
            // Flame gets wider then tapers
            const flameR = 0.35 * (1 - (-1.5 - y) / 1.5); 
            const theta = Math.random() * Math.PI * 2;
            pos[i3] = jitter(centerX + flameR * Math.cos(theta), 0.1);
            pos[i3 + 1] = jitter(y, 0.1);
            pos[i3 + 2] = jitter(flameR * Math.sin(theta), 0.1);
        } else {
            // Ambient space dust
            pos[i3] = rand(-4, 4);
            pos[i3 + 1] = rand(-4, 4);
            pos[i3 + 2] = rand(-2.0, 2.0);
        }
    }
    return pos;
}

// ─── Diamond ────────────────────────────────────────────────
export function generateDiamond(count: number): Float32Array {
    const pos = new Float32Array(count * 3);
    const radius = 2.2;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random();

        if (r < 0.2) {
            // Table (flat top octagon)
            const t = Math.random();
            const theta = Math.random() * Math.PI * 2;
            const rBase = Math.sqrt(t) * (radius * 0.5); // uniform disk
            pos[i3] = jitter(rBase * Math.cos(theta), 0.03);
            pos[i3 + 1] = jitter(1.5, 0.03);
            pos[i3 + 2] = jitter(rBase * Math.sin(theta) * 0.5, 0.03);
        } else if (r < 0.45) {
            // Crown (slanted faces connecting table to girdle)
            const theta = Math.random() * Math.PI * 2;
            const t = Math.random();
            const y = 1.5 - t * 1.5; // from y=1.5 down to y=0
            const currentR = (radius * 0.5) + t * (radius * 0.5); // expands to full radius
            
            // To make distinct facets, snap theta to 8 segments sometimes
            const facetTheta = Math.random() > 0.5 ? Math.floor(theta / (Math.PI/4)) * (Math.PI/4) : theta;
            
            pos[i3] = jitter(currentR * Math.cos(facetTheta), 0.05);
            pos[i3 + 1] = jitter(y, 0.05);
            pos[i3 + 2] = jitter(currentR * Math.sin(facetTheta) * 0.5, 0.05);
        } else if (r < 0.55) {
            // Girdle (thick edge at y=0)
            const theta = Math.random() * Math.PI * 2;
            pos[i3] = jitter(radius * Math.cos(theta), 0.08);
            pos[i3 + 1] = jitter(0, 0.1);
            pos[i3 + 2] = jitter(radius * Math.sin(theta) * 0.5, 0.08);
        } else if (r < 0.85) {
            // Pavilion (deep slanted bottom point)
            const theta = Math.random() * Math.PI * 2;
            const t = Math.random();
            const y = -2.8 * t; // down to culet at -2.8
            const currentR = radius * (1 - t); // tapers to 0
            
            // Facet snapping
            const facetTheta = Math.random() > 0.4 ? Math.floor(theta / (Math.PI/4)) * (Math.PI/4) : theta;

            pos[i3] = jitter(currentR * Math.cos(facetTheta), 0.05);
            pos[i3 + 1] = jitter(y, 0.05);
            pos[i3 + 2] = jitter(currentR * Math.sin(facetTheta) * 0.5, 0.05);
        } else {
            // Sparkles
            pos[i3] = rand(-4, 4);
            pos[i3 + 1] = rand(-3, 2);
            pos[i3 + 2] = rand(-1.5, 1.5);
        }
    }
    return pos;
}

// ─── Bridge ─────────────────────────────────────────────────
export function generateBridge(count: number): Float32Array {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random();

        if (r < 0.3) {
            // Road Deck (thick flat plane with perspective depth)
            const x = rand(-4.0, 4.0);
            const z = rand(-0.4, 0.4);
            pos[i3] = jitter(x, 0.05);
            pos[i3 + 1] = jitter(-0.5, 0.05);
            pos[i3 + 2] = jitter(z, 0.05);
        } else if (r < 0.5) {
            // Main suspension cables (parabolas)
            const x = rand(-4.0, 4.0);
            // Parabola eq: y = a*(x-h)^2 + k. Towers at x=-2 and x=2.
            let cableY = 0;
            if (x < -2) cableY = 0.8 * Math.pow(x + 2, 2); // left outer
            else if (x > 2) cableY = 0.8 * Math.pow(x - 2, 2); // right outer
            else cableY = 0.5 * Math.pow(x, 2); // center span
            
            // Two cables, one on +z side, one on -z side
            const z = Math.random() > 0.5 ? 0.3 : -0.3;
            
            pos[i3] = jitter(x, 0.05);
            pos[i3 + 1] = jitter(cableY, 0.05);
            pos[i3 + 2] = jitter(z, 0.05);
        } else if (r < 0.7) {
            // Vertical suspender cables connecting main cable to deck
            const x = rand(-3.5, 3.5);
            // Must match parabola height at x
            let cableY = 0;
            if (x < -2) cableY = 0.8 * Math.pow(x + 2, 2);
            else if (x > 2) cableY = 0.8 * Math.pow(x - 2, 2);
            else cableY = 0.5 * Math.pow(x, 2);
            
            const y = rand(-0.5, cableY); // random point along vertical line
            const z = Math.random() > 0.5 ? 0.3 : -0.3;
            
            // Snap x to discrete suspender intervals
            const snappedX = Math.round(x * 2) / 2;
            
            pos[i3] = jitter(snappedX, 0.02);
            pos[i3 + 1] = jitter(y, 0.05);
            pos[i3 + 2] = jitter(z, 0.02);
        } else if (r < 0.9) {
            // Towers
            const isLeft = Math.random() > 0.5;
            const x = isLeft ? -2.0 : 2.0;
            const y = rand(-2.5, 2.5); // tall towers
            const isLeg = Math.random() > 0.3;
            
            if (isLeg) {
                // Two vertical pillars per tower
                const z = Math.random() > 0.5 ? 0.4 : -0.4;
                pos[i3] = jitter(x, 0.1);
                pos[i3 + 1] = jitter(y, 0.05);
                pos[i3 + 2] = jitter(z, 0.1);
            } else {
                // Crossbracing (X shapes) between pillars
                const z = rand(-0.4, 0.4);
                pos[i3] = jitter(x, 0.1);
                pos[i3 + 1] = jitter(y, 0.05);
                pos[i3 + 2] = jitter(z, 0.05);
            }
        } else {
            // Fog / Water below
            pos[i3] = rand(-4, 4);
            pos[i3 + 1] = rand(-3.0, -1.0);
            pos[i3 + 2] = rand(-1.5, 1.5);
        }
    }
    return pos;
}

// ─── DNA Helix ──────────────────────────────────────────────
export function generateDNA(count: number): Float32Array {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const r = Math.random();

        if (r < 0.4) {
            // Strand 1 (thickened)
            const t = rand(-3.5, 3.5);
            const angle = t * 2.0;
            pos[i3] = jitter(Math.cos(angle) * 1.4, 0.15);
            pos[i3 + 1] = jitter(t, 0.05);
            pos[i3 + 2] = jitter(Math.sin(angle) * 0.6, 0.15);
        } else if (r < 0.8) {
            // Strand 2 (thickened, phase-shifted)
            const t = rand(-3.5, 3.5);
            const angle = t * 2.0 + Math.PI;
            pos[i3] = jitter(Math.cos(angle) * 1.4, 0.15);
            pos[i3 + 1] = jitter(t, 0.05);
            pos[i3 + 2] = jitter(Math.sin(angle) * 0.6, 0.15);
        } else if (r < 0.95) {
            // Rungs (distinct base pairs)
            const rungIndex = Math.floor(rand(-4, 5)); // discrete rungs
            const t = rungIndex * 0.7; 
            const angle = t * 2.0;
            const lerp = Math.random();
            const x1 = Math.cos(angle) * 1.4;
            const x2 = Math.cos(angle + Math.PI) * 1.4;
            const z1 = Math.sin(angle) * 0.6;
            const z2 = Math.sin(angle + Math.PI) * 0.6;
            pos[i3] = jitter(x1 + (x2 - x1) * lerp, 0.08);
            pos[i3 + 1] = jitter(t, 0.05);
            pos[i3 + 2] = jitter(z1 + (z2 - z1) * lerp, 0.08);
        } else {
            pos[i3] = rand(-4, 4);
            pos[i3 + 1] = rand(-3.5, 3.5);
            pos[i3 + 2] = rand(-1.5, 1.5);
        }
    }
    return pos;
}

// ─── Export all generators as an ordered array ──────────────
export const SHAPE_GENERATORS = [
    generateLightbulb,
    generateRocket,
    generateDiamond,
    generateBridge,
    generateDNA,
];

export const SHAPE_COUNT = SHAPE_GENERATORS.length;

