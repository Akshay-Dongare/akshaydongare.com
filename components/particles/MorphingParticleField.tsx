"use client";

import React, { useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { SHAPE_GENERATORS, SHAPE_COUNT } from "@/lib/shapeGenerators";
import { useMode, type Mode } from "@/lib/mode";

// Light mode lays pigment; white only reads as light against a dark ground. Deep enough that a lone dot is a mark, not a speck.
const LIGHT_EMBER = "#a8532b";

// The shader has no colorspace_fragment, so hand it the sRGB bytes as if they were linear.
function displayColor(hex: string) {
    const n = parseInt(hex.slice(1), 16);
    return new THREE.Color().setRGB(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, THREE.LinearSRGBColorSpace);
}

const PARTICLE_COUNT = 8000;
const MORPH_DURATION = 2.5;
const HOLD_AFTER_MORPH = 1.0;      // hold longer so the easter egg word has time to display
const SHATTER_HOLD_TIME = 2.25;
// Touch gets roughly half. Resting a mouse is passive — your hand is doing
// nothing — but holding a finger against glass is active effort, and 2.25s of
// it reads as a hang rather than a charge. 1.1s still sits well clear of the
// ~500ms long-press threshold both iOS and Android use, so a sloppy tap cannot
// trigger it, and it is long enough for the tension ring to visibly sweep.
const SHATTER_HOLD_TIME_TOUCH = 1.1;
const SPRING_STRENGTH = 0.1;
const DAMPING = 0.82;
const GRAVITY = -1.5;              // gentle fall (was -4.0)
const SHATTER_FLOOR = -6.0;
const FLOOR_BOUNCE = 0.2;
// How close the pointer must come to an actual particle to count as "on the
// shape", in SCREEN pixels so it means the same thing at every camera distance.
// A fingertip covers roughly 44pt, hence the coarse value.
// How close the pointer must come to a real particle to count as "on the shape",
// in SCREEN pixels so it behaves the same at any camera distance. Measured
// against the actual shape generators at 375x812: 24px starts the charge on
// 85-100% of points that are genuinely on the artwork and on 0% of points more
// than 25px from it. Wider (44px) reinstated the original complaint — a 25-50px
// halo fired 43-70% of the time. Same value for mouse and finger: there is no
// reason a mouse should be the less reliable of the two.
const HIT_TOLERANCE_PX = 24;
// Test every Nth particle; the loop early-exits as soon as the threshold is met.
const HIT_TEST_STRIDE = 2;
// ...and require MANY of them, not one. Every generator scatters ~5% of its
// particles uniformly across the whole box as ambient "stars", so a
// nearest-particle test treats the entire bounding box as the shape — press
// beside the DNA helix and you are still within 24px of a stray dot. Density
// separates the two cleanly: measured across all five shapes, real structure has
// a median of 353-609 particles inside the tolerance circle while scatter-only
// regions have 5-9. At 14 (strided, so ~28 unstrided) every shape detects 100%
// of its real structure and the stars stop counting.
const HIT_MIN_NEIGHBOURS = 14;
// Portrait stacks the headline and the CONNECT link across the top of the
// section while the artwork is centred, so they collide. Lift the camera on
// portrait aspects to drop the shape clear of them.
const PORTRAIT_CAMERA_LIFT = 1.5;
const SETTLE_TIME = 1.0;           // time on ground before reform
const REBUILD_VULNERABILITY_DELAY = 4.0; // time to ignore cursor while reforming & showing word

// Easter-egg words that appear after each shatter→reform cycle
const SHAPE_WORDS = ["imagine.", "build.", "endure.", "connect.", "evolve."];

// ─── Shared mutable state (WebGL ↔ HTML overlays) ───────────
interface SharedState {
    hoverProgress: number;
    isShattered: boolean;
    cursorOverShape: boolean;
    cursorX: number;
    cursorY: number;
    /** False until a real mousemove lands. R3F's `mouse` starts at (0,0),
        which is the centre of the viewport and therefore on top of the shape,
        so without this the charge begins before any input exists. */
    pointerActive: boolean;
    /** True when the last input to aim the cursor was a finger or stylus.
        Drives both the hold duration and the tension ring's radius, which have
        to agree about which device is live. */
    coarsePointer: boolean;
    /** Hold required to shatter — see SHATTER_HOLD_TIME_TOUCH. */
    holdTime: number;
    reformStartedAt: number;
    reformShapeIdx: number;
    showWord: boolean;
}

function createSharedState(): SharedState {
    return {
        hoverProgress: 0, isShattered: false, cursorOverShape: false,
        cursorX: 0, cursorY: 0, pointerActive: false,
        coarsePointer: false, holdTime: SHATTER_HOLD_TIME,
        reformStartedAt: 0, reformShapeIdx: 0, showWord: false,
    };
}

// ═════════════════════════════════════════════════════════════
//  WebGL Point Cloud
// ═════════════════════════════════════════════════════════════
function MorphingPointCloud({ color, shared, reduced = false, mode = "light" }: { color: string; shared: React.MutableRefObject<SharedState>; reduced?: boolean; mode?: Mode }) {
    const pointsRef = useRef<THREE.Points>(null);
    const gl = useThree((state) => state.gl);

    const stateRef = useRef({
        currentShapeIdx: 0,
        nextShapeIdx: 1,
        morphProgress: 0,
        timeSinceLastMorph: 0,
        cursorHoverStart: -1,
        lastHoldTime: SHATTER_HOLD_TIME,
        isShattered: false,
        shatterTime: 0,
        isRebuilding: false,
        rebuildStartTime: 0,
    });

    const shapesRef = useRef<Float32Array[]>([]);
    if (shapesRef.current.length === 0) {
        for (let i = 0; i < SHAPE_COUNT; i++) {
            shapesRef.current.push(SHAPE_GENERATORS[i](PARTICLE_COUNT));
        }
    }

    const positions = useMemo(() => new Float32Array(shapesRef.current[0]), []);
    const velocities = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
    const fromPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
    const toPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

    const particleRand = useMemo(() => {
        const r = new Float32Array(PARTICLE_COUNT * 2);
        // Deliberate: per-particle jitter must be random once and then STABLE for the
        // lifetime of the mount, which is what the empty-dep useMemo guarantees. Re-rolling
        // it on re-render would visibly reshuffle 8,000 particles mid-animation.
        // eslint-disable-next-line react-hooks/purity
        for (let i = 0; i < PARTICLE_COUNT * 2; i++) r[i] = (Math.random() - 0.5) * 2;
        return r;
    }, []);

    useMemo(() => {
        fromPositions.set(shapesRef.current[0]);
        toPositions.set(shapesRef.current[1]);
    }, [fromPositions, toPositions]);

    const advanceShape = useCallback(() => {
        const s = stateRef.current;
        s.currentShapeIdx = s.nextShapeIdx;
        s.nextShapeIdx = (s.nextShapeIdx + 1) % SHAPE_COUNT;
        s.morphProgress = 0;
        s.timeSinceLastMorph = 0;
        fromPositions.set(positions);
        toPositions.set(shapesRef.current[s.nextShapeIdx]);
    }, [fromPositions, toPositions, positions]);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const opacities = new Float32Array(PARTICLE_COUNT);
        // Same rationale: baked into the geometry buffer once, never re-rolled.
        // eslint-disable-next-line react-hooks/purity
        for (let i = 0; i < PARTICLE_COUNT; i++) opacities[i] = 0.6 + Math.random() * 0.4;
        geo.setAttribute("opacity", new THREE.BufferAttribute(opacities, 1));
        return geo;
    }, [positions]);

    // ── Bigger, thicker dots ────────────────────────────────
    // Dark keeps its exact colour path; light uses the true ember and CSS-pixel dot sizes.
    const light = mode === "light";
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uColor: { value: light ? displayColor(LIGHT_EMBER) : new THREE.Color(color) },
                uGlobalOpacity: { value: 0.92 },
                uPixelRatio: { value: light ? gl.getPixelRatio() : 1.0 },
                // Light only: the ~5% ambient scatter reads as dust on paper, so it shrinks away toward the edges.
                uVignette: { value: light ? 1.0 : 0.0 },
            },
            vertexShader: `
                attribute float opacity;
                varying float vOpacity;
                uniform float uPixelRatio;
                uniform float uVignette;
                void main() {
                    vOpacity = opacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = max(5.0, 18.0 * (1.0 / -mvPosition.z)) * uPixelRatio;
                    gl_Position = projectionMatrix * mvPosition;
                    // Radius in half-heights of the shorter side, so the fade is round on any aspect;
                    // a perspective projection already carries the aspect as P[1][1] / P[0][0].
                    float aspect = projectionMatrix[1][1] / projectionMatrix[0][0];
                    vec2 ndc = gl_Position.xy / gl_Position.w;
                    float r = length(ndc * vec2(aspect, 1.0)) / min(aspect, 1.0);
                    // Shrink the outer scatter rather than fade it: a faded hard dot is exactly a low-contrast speck.
                    float vig = mix(1.0, 1.0 - smoothstep(0.6, 1.0, r), uVignette);
                    gl_PointSize *= vig;
                    vOpacity *= smoothstep(0.15, 0.4, vig);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uGlobalOpacity;
                varying float vOpacity;
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.0, d) * vOpacity * uGlobalOpacity;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
        });
    }, [color, light, gl]);
    // A mode switch builds a new material; free the old one's GPU program.
    useEffect(() => () => material.dispose(), [material]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        // No morph, no charge, no shatter under reduced motion: one still shape.
        if (reduced) return;

        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        const s = stateRef.current;
        const sh = shared.current;

        // CameraFit pulls the camera back on portrait aspects, which would bring the
        // fixed floor into frame and end every phone shatter in a visible flat pile.
        // Derive it from the live camera so particles always fall just out of shot.
        // Read fov/position directly, NOT useThree().viewport — R3F only recomputes
        // that in setSize, so CameraFit's imperative setZ leaves it stale for exactly
        // the aspects that matter here.
        const cam = state.camera as THREE.PerspectiveCamera;
        const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
        // Just below the bottom edge of what the camera can see, wherever it sits.
        const floorY = Math.min(SHATTER_FLOOR, cam.position.y - halfH - 1);

        // Map the pointer from CSS pixels to world space against the LIVE camera.
        // Two separate reasons this cannot use R3F's `mouse` / `viewport`:
        //  - `mouse` only updates on pointermove, and a touch press-and-hold fires
        //    pointerdown with no move, so a finger at rest never registers at all;
        //  - `viewport` is recomputed only in setSize, so CameraFit's imperative
        //    setZ leaves it describing the z=10 frustum while the camera actually
        //    sits at z~19.5 on a phone — about half the true world extent.
        // Both the mouse and touch handlers already write cursorX/cursorY in
        // element-relative CSS pixels, so derive from those instead.
        const halfW = halfH * (state.size.width / state.size.height);
        const mouseX = ((sh.cursorX / state.size.width) * 2 - 1) * halfW;
        const mouseY = cam.position.y - ((sh.cursorY / state.size.height) * 2 - 1) * halfH;
        const time = state.clock.getElapsedTime();
        const dtScale = Math.min(delta * 60, 3);

        if (s.isRebuilding) {
            if (time - s.rebuildStartTime > REBUILD_VULNERABILITY_DELAY) {
                s.isRebuilding = false;
            }
        }

        // ─── Is the pointer actually ON the shape? ──────────
        // This used to measure distance from the shape's CENTROID against a fixed
        // 3.0 world-unit radius — a circle, not the shape. The mismatch is hidden
        // on desktop, where the artwork is wider than the circle, but obvious on a
        // phone: CameraFit pulls the camera back for the narrow aspect, so the same
        // radius spans 71% of the screen width and reaches well outside the
        // artwork. You could charge it by pressing empty background, or the hollow
        // middle of an outline shape like the diamond.
        // Measure proximity to an actual particle instead, with the tolerance in
        // screen pixels so it behaves identically at any camera distance.
        const pxPerUnit = (state.size.height / 2) / halfH;
        const tolWorld = HIT_TOLERANCE_PX / pxPerUnit;
        const tol2 = tolWorld * tolWorld;
        let near = 0;
        let overShape = false;
        for (let i = 0; i < PARTICLE_COUNT; i += HIT_TEST_STRIDE) {
            const i3 = i * 3;
            const dx = posArr[i3] - mouseX;
            const dy = posArr[i3 + 1] - mouseY;
            if (dx * dx + dy * dy < tol2 && ++near >= HIT_MIN_NEIGHBOURS) { overShape = true; break; }
        }
        const cursorIsOverShape = sh.pointerActive && !s.isRebuilding && overShape;

        // Deliberate: SharedState is a mutable ref bridging this useFrame loop to the
        // TensionRing/ShapeWord overlays at 60fps without re-rendering React. Routing
        // this through state would re-render the tree every frame. See AGENTS.md.
        // eslint-disable-next-line react-hooks/immutability
        sh.cursorOverShape = cursorIsOverShape;
        sh.isShattered = s.isShattered;

        // ─── Cursor hold timing ─────────────────────────────
        let hoverProgress = 0;
        if (cursorIsOverShape && !s.isShattered) {
            if (s.cursorHoverStart < 0) s.cursorHoverStart = time;
            // Switching input device mid-charge changes the denominator. Carry the
            // fraction already charged rather than the elapsed seconds, or the ring
            // jumps to full (mouse -> touch) or visibly unwinds (touch -> mouse).
            if (sh.holdTime !== s.lastHoldTime) {
                const carried = Math.min((time - s.cursorHoverStart) / s.lastHoldTime, 1.0);
                s.cursorHoverStart = time - carried * sh.holdTime;
                s.lastHoldTime = sh.holdTime;
            }
            const hoverTime = time - s.cursorHoverStart;
            hoverProgress = Math.min(hoverTime / sh.holdTime, 1.0);
            sh.hoverProgress = hoverProgress;

            // ── Trigger shatter ─────────────────────────────
            if (hoverTime >= sh.holdTime) {
                s.isShattered = true;
                s.shatterTime = time;
                s.cursorHoverStart = -1;
                sh.isShattered = true;
                sh.hoverProgress = 0;

                // Gentle explosion
                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    const i3 = i * 3;
                    // Deliberate: writing the shatter impulse straight into the velocity buffer.
                    // Allocating a new Float32Array for 8,000 particles each frame would thrash GC.
                    // eslint-disable-next-line react-hooks/immutability
                    velocities[i3]     = particleRand[i * 2] * 0.35;
                    velocities[i3 + 1] = Math.random() * 0.15 + 0.05;
                    velocities[i3 + 2] = particleRand[i * 2 + 1] * 0.08;
                }
            }
        } else if (!cursorIsOverShape) {
            s.cursorHoverStart = -1;
            sh.hoverProgress = 0;
        }

        // ─── SHATTER MODE ───────────────────────────────────
        if (s.isShattered) {
            const elapsed = time - s.shatterTime;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const i3 = i * 3;

                // Gravity
                velocities[i3 + 1] += GRAVITY * delta;

                // Air resistance
                velocities[i3]     *= 0.998;
                velocities[i3 + 1] *= 0.998;
                velocities[i3 + 2] *= 0.998;

                posArr[i3]     += velocities[i3]     * dtScale;
                posArr[i3 + 1] += velocities[i3 + 1] * dtScale;
                posArr[i3 + 2] += velocities[i3 + 2] * dtScale;

                // Floor
                if (posArr[i3 + 1] < floorY) {
                    posArr[i3 + 1] = floorY;
                    velocities[i3 + 1] = Math.abs(velocities[i3 + 1]) * FLOOR_BOUNCE;
                    velocities[i3]     *= 0.85;
                    velocities[i3 + 2] *= 0.85;
                }
            }

            // Settle → reform
            if (elapsed > SETTLE_TIME) {
                s.isShattered = false;
                s.isRebuilding = true;
                s.rebuildStartTime = time;
                sh.isShattered = false;
                sh.reformStartedAt = Date.now() / 1000;
                advanceShape();
                sh.reformShapeIdx = s.nextShapeIdx;
                sh.showWord = true;
            }

            posAttr.needsUpdate = true;
            return;
        }

        // ─── Normal morph ───────────────────────────────────
        s.timeSinceLastMorph += delta;
        const totalCycle = MORPH_DURATION + HOLD_AFTER_MORPH;
        const rawT = Math.min(s.timeSinceLastMorph / MORPH_DURATION, 1.0);
        s.morphProgress = 1 - Math.pow(1 - rawT, 3);

        if (s.timeSinceLastMorph >= totalCycle) advanceShape();

        // ─── Per-particle spring + tremble ──────────────────
        const trembleAmp = (cursorIsOverShape && !s.isShattered)
            ? hoverProgress * hoverProgress * 0.18   // quadratic ramp — subtle then dramatic
            : 0;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const t = s.morphProgress;

            let targetX = fromPositions[i3]     + (toPositions[i3]     - fromPositions[i3])     * t + Math.sin(time * 0.4 + fromPositions[i3 + 1] * 2) * 0.025;
            let targetY = fromPositions[i3 + 1] + (toPositions[i3 + 1] - fromPositions[i3 + 1]) * t + Math.cos(time * 0.5 + fromPositions[i3]     * 2) * 0.025;
            const targetZ = fromPositions[i3 + 2] + (toPositions[i3 + 2] - fromPositions[i3 + 2]) * t + Math.sin(time * 0.3 + i * 0.001) * 0.015;

            // Tremble — high-frequency jitter that escalates as hover builds
            if (trembleAmp > 0) {
                targetX += Math.sin(time * 22 + i * 1.7) * trembleAmp;
                targetY += Math.cos(time * 19 + i * 2.3) * trembleAmp;
            }

            const cx = posArr[i3], cy = posArr[i3 + 1], cz = posArr[i3 + 2];

            velocities[i3]     = (velocities[i3]     + (targetX - cx) * SPRING_STRENGTH) * DAMPING;
            velocities[i3 + 1] = (velocities[i3 + 1] + (targetY - cy) * SPRING_STRENGTH) * DAMPING;
            velocities[i3 + 2] = (velocities[i3 + 2] + (targetZ - cz) * SPRING_STRENGTH) * DAMPING;

            posArr[i3]     += velocities[i3]     * dtScale;
            posArr[i3 + 1] += velocities[i3 + 1] * dtScale;
            posArr[i3 + 2] += velocities[i3 + 2] * dtScale;
        }

        posAttr.needsUpdate = true;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ═════════════════════════════════════════════════════════════
//  Tension Ring  — subtle circular progress around cursor
//  Appears only when hovering over the shape.
//  It's the cinematic "something is building" cue.
// ═════════════════════════════════════════════════════════════
function TensionRing({ shared }: { shared: React.MutableRefObject<SharedState> }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);
    // Fine pointers get a tight ring at the cursor; a fingertip occludes roughly
    // 44pt, so coarse input needs a radius that clears it or the only explicit
    // progress cue is invisible exactly when it is being used.
    const R_FINE = 20;
    const R_COARSE = 44;
    const BOX = (r: number) => r * 2 + 10;
    const CIRC = (r: number) => 2 * Math.PI * r;

    useEffect(() => {
        let id: number;
        let appliedR = -1;   // only rewrite geometry when the pointer kind changes
        function tick() {
            const s = shared.current;
            const svg = svgRef.current;
            const circle = circleRef.current;
            if (svg && circle) {
                if (s.cursorOverShape && !s.isShattered && s.hoverProgress > 0.04) {
                    const r = s.coarsePointer ? R_COARSE : R_FINE;
                    const box = BOX(r);
                    const c = CIRC(r);
                    if (appliedR !== r) {
                        svg.setAttribute("width", String(box));
                        svg.setAttribute("height", String(box));
                        circle.setAttribute("cx", String(box / 2));
                        circle.setAttribute("cy", String(box / 2));
                        circle.setAttribute("r", String(r));
                        circle.setAttribute("transform", `rotate(-90 ${box / 2} ${box / 2})`);
                        circle.style.strokeDasharray = String(c);
                        appliedR = r;
                    }
                    svg.style.display = "block";
                    svg.style.left = `${s.cursorX - box / 2}px`;
                    svg.style.top = `${s.cursorY - box / 2}px`;
                    svg.style.opacity = String(Math.min(0.12 + s.hoverProgress * 0.58, 0.7));
                    circle.style.strokeDashoffset = String(c * (1 - s.hoverProgress));
                } else {
                    svg.style.display = "none";
                }
            }
            id = requestAnimationFrame(tick);
        }
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [shared]);

    return (
        <svg ref={svgRef} width={BOX(R_FINE)} height={BOX(R_FINE)}
            className="absolute pointer-events-none z-[11]"
            style={{ display: "none", isolation: "isolate" }}>
            <circle ref={circleRef}
                cx={BOX(R_FINE) / 2} cy={BOX(R_FINE) / 2} r={R_FINE}
                fill="none" style={{ stroke: "var(--tension-ring)" }} strokeWidth={1.5}
                strokeDasharray={CIRC(R_FINE)} strokeDashoffset={CIRC(R_FINE)}
                strokeLinecap="round" transform={`rotate(-90 ${BOX(R_FINE) / 2} ${BOX(R_FINE) / 2})`} />
        </svg>
    );
}

// ═════════════════════════════════════════════════════════════
//  Shape Word  — brief easter-egg word after each reform
// ═════════════════════════════════════════════════════════════
function ShapeWord({ shared }: { shared: React.MutableRefObject<SharedState> }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let id: number;
        function tick() {
            const s = shared.current;
            const el = ref.current;
            if (el) {
                if (s.showWord && s.reformStartedAt > 0) {
                    const elapsed = Date.now() / 1000 - s.reformStartedAt;
                    let opacity = 0;
                    if      (elapsed > 1.8 && elapsed < 2.2) opacity = (elapsed - 1.8) / 0.4;
                    else if (elapsed >= 2.2 && elapsed < 3.5) opacity = 1;
                    else if (elapsed >= 3.5 && elapsed < 4.0) opacity = 1 - (elapsed - 3.5) / 0.5;
                    else if (elapsed >= 4.0) s.showWord = false;

                    if (opacity > 0.01) {
                        el.style.display = "block";
                        el.style.opacity = String(opacity * 0.3);
                        el.textContent = SHAPE_WORDS[s.reformShapeIdx % SHAPE_WORDS.length];
                    } else {
                        el.style.display = "none";
                    }
                } else {
                    el.style.display = "none";
                }
            }
            id = requestAnimationFrame(tick);
        }
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [shared]);

    return (
        <div ref={ref}
            className="absolute bottom-[14%] right-[8%] pointer-events-none z-[11] font-mono text-fg-100 text-sm tracking-[0.35em] lowercase select-none"
            style={{ display: "none", isolation: "isolate" }} />
    );
}

// ═════════════════════════════════════════════════════════════
// Keeps the whole shape inside the frustum in portrait. Desktop aspects are
// >= 0.9, which clamps to the original z = 10, so nothing changes there.
function CameraFit() {
    const { camera, size } = useThree();
    useLayoutEffect(() => {
        const cam = camera as THREE.PerspectiveCamera;
        const aspect = size.width / size.height;
        cam.position.setZ(Math.max(10, 9.0 / aspect));
        cam.position.setY(aspect < 1 ? PORTRAIT_CAMERA_LIFT : 0);
        cam.updateProjectionMatrix();
    }, [camera, size]);
    return null;
}

//  Main Export
// ═════════════════════════════════════════════════════════════
export function MorphingParticleField({ color = "#ffffff", className = "", active = true }: { color?: string; className?: string; active?: boolean }) {
    // Reduced motion: render the field once and then stop, rather than removing it.
    // The particles are this section's visual content, so a still frame keeps the
    // composition while the movement — which is the part that triggers vestibular
    // symptoms — goes away entirely. frameloop "demand" draws on mount and then only
    // when something invalidates, so there is no ongoing CPU, GPU or battery cost.
    const reduced = !!useReducedMotion();
    const mode = useMode();
    const shared = useRef<SharedState>(createSharedState());
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const aim = (clientX: number, clientY: number, coarse: boolean) => {
            const rect = el.getBoundingClientRect();
            shared.current.cursorX = clientX - rect.left;
            shared.current.cursorY = clientY - rect.top;
            shared.current.pointerActive = true;
            shared.current.coarsePointer = coarse;
            shared.current.holdTime = coarse ? SHATTER_HOLD_TIME_TOUCH : SHATTER_HOLD_TIME;
        };

        // After a tap, browsers replay a synthetic mouse sequence. A touchscreen
        // laptop also reports (hover: hover), so it cannot be branched away --
        // instead ignore mouse events that land inside the replay window, or the
        // shape latches on and re-shatters at nobody.
        let lastTouch = 0;
        const REPLAY_WINDOW = 700;

        // Arming only once a pointer genuinely moves keeps the shape intact when
        // the section is reached by scrolling without nudging the cursor.
        const move = (e: MouseEvent) => {
            if (performance.now() - lastTouch < REPLAY_WINDOW) return;
            aim(e.clientX, e.clientY, false);
        };
        const leave = () => { shared.current.pointerActive = false; };

        // Touch: press and hold on the shape to charge it, the direct analogue
        // of resting the cursor there. Lifting disarms.
        const down = (e: PointerEvent) => {
            if (e.pointerType === "mouse") return;
            lastTouch = performance.now();
            aim(e.clientX, e.clientY, true);
        };
        const drag = (e: PointerEvent) => {
            if (e.pointerType === "mouse") return;
            lastTouch = performance.now();
            aim(e.clientX, e.clientY, true);
        };
        const lift = (e: PointerEvent) => {
            if (e.pointerType === "mouse") return;
            lastTouch = performance.now();
            shared.current.pointerActive = false;
        };

        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        el.addEventListener("pointerdown", down, { passive: true });
        el.addEventListener("pointermove", drag, { passive: true });
        el.addEventListener("pointerup", lift, { passive: true });
        el.addEventListener("pointercancel", lift, { passive: true });
        return () => {
            el.removeEventListener("mousemove", move);
            el.removeEventListener("mouseleave", leave);
            el.removeEventListener("pointerdown", down);
            el.removeEventListener("pointermove", drag);
            el.removeEventListener("pointerup", lift);
            el.removeEventListener("pointercancel", lift);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="w-full h-full pointer-events-auto absolute inset-0 z-0">
            {/* Canvas layer — receives blend mode / opacity from parent */}
            <div className={`w-full h-full ${className}`}>
                <Canvas
                    camera={{ position: [0, 0, 10], fov: 50 }}
                    gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
                    dpr={[1, 1.5]}
                    // "never" stops the render loop without tearing down the GL context, the
                    // geometry or the simulation state, so scrolling back costs nothing to
                    // resume. Before this the canvas kept running at 60fps for the rest of the
                    // visit once it had been seen once, six screens away from the viewport.
                    frameloop={reduced ? "demand" : active ? "always" : "never"}
                >
                    <CameraFit />
                    <MorphingPointCloud color={color} shared={shared} reduced={reduced} mode={mode} />
                </Canvas>
            </div>

            {/* HTML overlays — outside blend context */}
            <TensionRing shared={shared} />
            <ShapeWord shared={shared} />
        </div>
    );
}
