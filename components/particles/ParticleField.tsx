"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateSilhouetteParticles, generateParticleSizes } from "@/lib/particleData";

// ── Physics constants ──────────────────────────────────────────────────────
const PARTICLE_COUNT   = 5000;
const SPRING_STIFFNESS = 0.028;  // softer than before — allows travel & organic overshoot
const DAMPING          = 0.91;   // less friction than before (0.85) → underdamped wobble
const INFLUENCE_RADIUS = 2.2;    // world-space radius of mouse influence
const SWIRL_STRENGTH   = 0.50;   // silk vortex force scaled by mouse velocity

function PointCloud({ color = "#8da3b5" }: { color?: string }) {
    const pointsRef = useRef<THREE.Points>(null);
    const { mouse, viewport } = useThree();

    // Tracks previous mouse world position to compute per-frame velocity
    const prevMouse = useRef({ x: 0, y: 0 });

    const [positions, originalPositions] = useMemo(() => {
        const raw = generateSilhouetteParticles(PARTICLE_COUNT);
        return [raw, new Float32Array(raw)];
    }, []);

    const velocities = useRef(new Float32Array(PARTICLE_COUNT * 3));

    // Per-particle opacity baked into geometry — silhouette edges are more diffuse
    const particleOpacities = useMemo(() => {
        const ops = new Float32Array(PARTICLE_COUNT);
        // Deliberate: opacity jitter is baked into the geometry once per mount so the
        // silhouette edges stay diffuse. Stability is the point; useMemo provides it.
        // eslint-disable-next-line react-hooks/purity
        for (let i = 0; i < PARTICLE_COUNT; i++) ops[i] = 0.25 + Math.random() * 0.75;
        return ops;
    }, []);

    // Per-particle size scalar — 70% fine grain [0.75, 1.0], 30% structural nodes [1.5, 2.5].
    // Node probability is higher where positions are densely packed (core, spiral strands,
    // filament anchors) so additive blending stacks them into brilliant glowing pools.
    const particleSizes = useMemo(() => generateParticleSizes(PARTICLE_COUNT), []);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions,         3));
        geo.setAttribute("aOpacity", new THREE.BufferAttribute(particleOpacities, 1));
        geo.setAttribute("aSize",    new THREE.BufferAttribute(particleSizes,     1));
        return geo;
    }, [positions, particleOpacities, particleSizes]);

    // Soft Gaussian circles via GLSL + additive blending = holographic ghost glow.
    // On the dark top of the Particle section, particles accumulate into bright clusters
    // where the silhouette is dense; on the light bottom they fade gracefully.
    const material = useMemo(() => new THREE.ShaderMaterial({
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
        uniforms: {
            uColor:         { value: new THREE.Color(color) },
            uGlobalOpacity: { value: 0.62 },
        },
        vertexShader: `
            attribute float aOpacity;
            attribute float aSize;
            varying   float vOpacity;
            void main() {
                vOpacity      = aOpacity;
                vec4 mvPos    = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize  = max(3.0, 45.0 * aSize / (-mvPos.z));
                gl_Position   = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: `
            uniform vec3  uColor;
            uniform float uGlobalOpacity;
            varying float vOpacity;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                // Gaussian falloff — a soft glowing dot, not a hard disc
                float alpha  = exp(-d * d * 9.0) * vOpacity * uGlobalOpacity;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
    }), [color]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const pos     = posAttr.array as Float32Array;
        const vel     = velocities.current;
        const time    = state.clock.getElapsedTime();
        const dtScale = Math.min(delta * 60, 3);

        const mouseX = (mouse.x * viewport.width)  / 2;
        const mouseY = (mouse.y * viewport.height) / 2;

        // Per-frame mouse velocity in world units
        const mvx        = mouseX - prevMouse.current.x;
        const mvy        = mouseY - prevMouse.current.y;
        const mouseSpeed = Math.sqrt(mvx * mvx + mvy * mvy);
        prevMouse.current.x = mouseX;
        prevMouse.current.y = mouseY;

        const influenceR2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;

            // Breathing base — layered sine waves give each particle a unique organic phase.
            // Amplitude is deliberately small so the silhouette reads clearly at rest.
            const baseX = originalPositions[i3]     + Math.sin(time * 0.38 + originalPositions[i3 + 1] * 1.3) * 0.022;
            const baseY = originalPositions[i3 + 1] + Math.cos(time * 0.44 + originalPositions[i3]     * 1.3) * 0.022;
            const baseZ = originalPositions[i3 + 2] + Math.sin(time * 0.27 + i * 0.0007) * 0.012;

            const cx = pos[i3], cy = pos[i3 + 1], cz = pos[i3 + 2];

            const dx = cx - mouseX;
            const dy = cy - mouseY;
            const d2 = dx * dx + dy * dy;

            let fx = 0, fy = 0;

            if (d2 < influenceR2 && d2 > 0.0001) {
                const dist = Math.sqrt(d2);
                const nx   = dx / dist;  // unit vector: particle → cursor
                const ny   = dy / dist;

                // Smoothstep falloff: 1 at cursor, 0 at INFLUENCE_RADIUS edge
                const t       = 1.0 - dist / INFLUENCE_RADIUS;
                const falloff = t * t * (3.0 - 2.0 * t);

                if (mouseSpeed > 0.005) {
                    // ── Silk swirl: force is perpendicular to (particle → cursor) ──────
                    // Rotating the unit vector 90° produces a consistent orbital current —
                    // particles flow tangentially around the cursor path rather than scattering.
                    const swirlMag = mouseSpeed * SWIRL_STRENGTH * falloff;
                    fx += (-ny) * swirlMag;          // perp X
                    fy += ( nx) * swirlMag;          // perp Y

                    // Slight inward pull — silk drapes toward the hand rather than fleeing it
                    fx -= nx * swirlMag * 0.22;
                    fy -= ny * swirlMag * 0.22;
                } else {
                    // Cursor resting still: barely-perceptible radial micro-push so it
                    // doesn't feel frozen, just breathes softly around a stationary hand
                    fx += nx * falloff * 0.010;
                    fy += ny * falloff * 0.010;
                }
            }

            // Under-damped spring back to breathing base.
            // Lower stiffness + higher damping ratio = overshoot + slow oscillation
            // before settling — the "string snapping back" wobble.
            vel[i3]     = (vel[i3]     + fx + (baseX - cx) * SPRING_STIFFNESS) * DAMPING;
            vel[i3 + 1] = (vel[i3 + 1] + fy + (baseY - cy) * SPRING_STIFFNESS) * DAMPING;
            vel[i3 + 2] = (vel[i3 + 2]      + (baseZ - cz) * SPRING_STIFFNESS) * DAMPING;

            pos[i3]     += vel[i3]     * dtScale;
            pos[i3 + 1] += vel[i3 + 1] * dtScale;
            pos[i3 + 2] += vel[i3 + 2] * dtScale;
        }

        posAttr.needsUpdate = true;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export function ParticleField({ color = "#8da3b5", className = "" }: { color?: string; className?: string }) {
    return (
        <div className={`w-full h-full pointer-events-auto absolute inset-0 z-0 ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 10], fov: 50 }}
                gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 1.5]}
            >
                <PointCloud color={color} />
            </Canvas>
        </div>
    );
}
