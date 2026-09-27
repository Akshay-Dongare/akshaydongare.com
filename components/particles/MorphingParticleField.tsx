"use client";

import React, { useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { SHAPE_GENERATORS, SHAPE_COUNT } from "@/lib/shapeGenerators";

const PARTICLE_COUNT = 8000;
const MORPH_DURATION = 2.5;
const HOLD_AFTER_MORPH = 1.0;      // hold longer so the easter egg word has time to display
const SHATTER_HOLD_TIME = 2.25;
// A held finger is effort, not rest, so the mouse's 2.25s reads as a hang. 1.1s stays well clear of the ~500ms
// iOS and Android long-press, so a sloppy tap cannot fire it, and still gives the tension ring time to sweep.
const SHATTER_HOLD_TIME_TOUCH = 1.1;
const SPRING_STRENGTH = 0.1;
const DAMPING = 0.82;
const GRAVITY = -1.5;              // gentle fall
const SHATTER_FLOOR = -6.0;
const FLOOR_BOUNCE = 0.2;
// Pointer-to-particle distance that counts as on the shape, in SCREEN pixels for any camera distance, mouse or finger.
// At 375x812, 24px charges on 85-100% of points on the artwork and 0% beyond 25px; 44px fires on a 25-50px halo.
const HIT_TOLERANCE_PX = 24;
// Test every Nth particle; the loop early-exits as soon as the threshold is met.
const HIT_TEST_STRIDE = 2;
// Many neighbours, not one: every generator scatters ~5% of its particles across the box as "stars". On all five
// shapes the circle holds a median 353-609 on structure and 5-9 on scatter; 14 (~28 unstrided) splits them.
const HIT_MIN_NEIGHBOURS = 14;
// In portrait the headline and CONNECT link stack across the top and collide with the centred artwork,
// so the camera lifts to drop the shape clear of them.
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
    /** False until real input lands and again on leave or lift, so a stale cursor position never charges. */
    pointerActive: boolean;
    /** True when the last input to aim the cursor was a finger or stylus. Drives both the hold time and the tension
        ring's radius, which must agree about which device is live. */
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

// ═══ WebGL Point Cloud ═══════════════════════════════════════
function MorphingPointCloud({ color, shared, reduced = false }: { color: string; shared: React.MutableRefObject<SharedState>; reduced?: boolean }) {
    const pointsRef = useRef<THREE.Points>(null);

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
        // Jitter is rolled once and must stay stable for the mount, which the empty-dep useMemo guarantees;
        // re-rolling on re-render would reshuffle 8,000 particles mid-animation. AGENTS.md, Commands.
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
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uColor: { value: new THREE.Color(color) },
                uGlobalOpacity: { value: 0.92 },
            },
            vertexShader: `
                attribute float opacity;
                varying float vOpacity;
                void main() {
                    vOpacity = opacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = max(5.0, 18.0 * (1.0 / -mvPosition.z));
                    gl_Position = projectionMatrix * mvPosition;
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
    }, [color]);
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

        // CameraFit pulls back in portrait, which would bring a fixed floor into frame as a flat pile. Read fov and
        // position directly, not useThree().viewport: R3F updates that only in setSize, so CameraFit's setZ misses it.
        const cam = state.camera as THREE.PerspectiveCamera;
        const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
        // Just below the bottom edge of what the camera can see, wherever it sits.
        const floorY = Math.min(SHATTER_FLOOR, cam.position.y - halfH - 1);

        // Maps cursorX/cursorY against the LIVE camera, not R3F's `mouse` or `viewport`: `mouse` misses a finger held
        // still, and `viewport` keeps the z=10 frustum after CameraFit's setZ while a phone sits at z~19.5.
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
        // Counts nearby particles; a centroid radius spans empty phone background and the diamond's hollow middle.
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

        // SharedState is a mutable ref feeding the TensionRing and ShapeWord overlays at 60fps; routing it
        // through React state would re-render the tree every frame. AGENTS.md, Commands.
        // eslint-disable-next-line react-hooks/immutability
        sh.cursorOverShape = cursorIsOverShape;
        sh.isShattered = s.isShattered;

        // ─── Cursor hold timing ─────────────────────────────
        let hoverProgress = 0;
        if (cursorIsOverShape && !s.isShattered) {
            if (s.cursorHoverStart < 0) s.cursorHoverStart = time;
            // A device switch mid-charge changes the denominator, so carry the fraction charged, not the seconds,
            // or the ring jumps to full (mouse to touch) or unwinds (touch to mouse).
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

// ═══ Tension Ring ════════════════════════════════════════════
// Subtle circular progress round the cursor, shown only over the shape: the "something is building" cue.
function TensionRing({ shared }: { shared: React.MutableRefObject<SharedState> }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);
    // A fingertip occludes roughly 44pt, so coarse input needs a radius that clears it, or the only
    // explicit progress cue is hidden exactly while it is in use.
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

// ═══ Shape Word: brief easter-egg word after each reform ══════
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

// Keeps the whole shape inside the frustum in portrait. Desktop aspects are >= 0.9 and clamp to z = 10.
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

// ═══ Main Export ═════════════════════════════════════════════
export function MorphingParticleField({ color = "#ffffff", className = "", active = true }: { color?: string; className?: string; active?: boolean }) {
    // Reduced motion keeps one still frame: the particles are the section's content, and the movement is what
    // triggers vestibular symptoms. frameloop "demand" draws on mount, then idles at no CPU, GPU or battery cost.
    const reduced = !!useReducedMotion();
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

        // Browsers replay synthetic mouse events after a tap, and a touchscreen laptop reports (hover: hover), so
        // mouse events inside the replay window are dropped, or the shape latches on and re-shatters at nobody.
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
                    // "never" stops the loop but keeps the GL context, geometry and simulation, so scrolling back
                    // resumes free; without it the canvas runs at 60fps for the whole visit once seen.
                    frameloop={reduced ? "demand" : active ? "always" : "never"}
                >
                    <CameraFit />
                    <MorphingPointCloud color={color} shared={shared} reduced={reduced} />
                </Canvas>
            </div>

            {/* HTML overlays — outside blend context */}
            <TensionRing shared={shared} />
            <ShapeWord shared={shared} />
        </div>
    );
}
