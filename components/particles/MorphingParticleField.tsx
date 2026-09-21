"use client";

import React, { useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SHAPE_GENERATORS, SHAPE_COUNT } from "@/lib/shapeGenerators";

const PARTICLE_COUNT = 8000;
const MORPH_DURATION = 2.5;
const HOLD_AFTER_MORPH = 1.0;      // hold longer so the easter egg word has time to display
const SHATTER_HOLD_TIME = 2.25;
const SPRING_STRENGTH = 0.1;
const DAMPING = 0.82;
const GRAVITY = -1.5;              // gentle fall (was -4.0)
const SHATTER_FLOOR = -6.0;
const FLOOR_BOUNCE = 0.2;
const CURSOR_DETECT_RADIUS = 3.0;
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
    reformStartedAt: number;
    reformShapeIdx: number;
    showWord: boolean;
}

function createSharedState(): SharedState {
    return {
        hoverProgress: 0, isShattered: false, cursorOverShape: false,
        cursorX: 0, cursorY: 0, pointerActive: false,
        reformStartedAt: 0, reformShapeIdx: 0, showWord: false,
    };
}

// ═════════════════════════════════════════════════════════════
//  WebGL Point Cloud
// ═════════════════════════════════════════════════════════════
function MorphingPointCloud({ color, shared }: { color: string; shared: React.MutableRefObject<SharedState> }) {
    const pointsRef = useRef<THREE.Points>(null);

    const stateRef = useRef({
        currentShapeIdx: 0,
        nextShapeIdx: 1,
        morphProgress: 0,
        timeSinceLastMorph: 0,
        cursorHoverStart: -1,
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

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

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
        const floorY = -Math.max(-SHATTER_FLOOR, halfH + 1);

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
        const mouseY = -((sh.cursorY / state.size.height) * 2 - 1) * halfH;
        const time = state.clock.getElapsedTime();
        const dtScale = Math.min(delta * 60, 3);

        // ─── Shape center detection ─────────────────────────
        let shapeCX = 0, shapeCY = 0;
        const sampleN = 80;
        for (let j = 0; j < sampleN; j++) {
            const idx = Math.floor(Math.random() * PARTICLE_COUNT) * 3;
            shapeCX += posArr[idx];
            shapeCY += posArr[idx + 1];
        }
        shapeCX /= sampleN;
        shapeCY /= sampleN;

        if (s.isRebuilding) {
            if (time - s.rebuildStartTime > REBUILD_VULNERABILITY_DELAY) {
                s.isRebuilding = false;
            }
        }

        const cdx = mouseX - shapeCX;
        const cdy = mouseY - shapeCY;
        const cursorIsOverShape = sh.pointerActive && !s.isRebuilding && (Math.sqrt(cdx * cdx + cdy * cdy) < CURSOR_DETECT_RADIUS);

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
            const hoverTime = time - s.cursorHoverStart;
            hoverProgress = Math.min(hoverTime / SHATTER_HOLD_TIME, 1.0);
            sh.hoverProgress = hoverProgress;

            // ── Trigger shatter ─────────────────────────────
            if (hoverTime >= SHATTER_HOLD_TIME) {
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
    const R = 20;
    const C = 2 * Math.PI * R;

    useEffect(() => {
        let id: number;
        function tick() {
            const s = shared.current;
            const svg = svgRef.current;
            const circle = circleRef.current;
            if (svg && circle) {
                if (s.cursorOverShape && !s.isShattered && s.hoverProgress > 0.04) {
                    svg.style.display = "block";
                    svg.style.left = `${s.cursorX - 25}px`;
                    svg.style.top = `${s.cursorY - 25}px`;
                    svg.style.opacity = String(Math.min(0.12 + s.hoverProgress * 0.58, 0.7));
                    circle.style.strokeDashoffset = String(C * (1 - s.hoverProgress));
                } else {
                    svg.style.display = "none";
                }
            }
            id = requestAnimationFrame(tick);
        }
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [shared, C]);

    return (
        <svg ref={svgRef} width={50} height={50}
            className="absolute pointer-events-none z-[11]"
            style={{ display: "none", isolation: "isolate" }}>
            <circle ref={circleRef}
                cx={25} cy={25} r={R}
                fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5}
                strokeDasharray={C} strokeDashoffset={C}
                strokeLinecap="round" transform="rotate(-90 25 25)" />
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
            className="absolute bottom-[14%] right-[8%] pointer-events-none z-[11] font-mono text-white text-sm tracking-[0.35em] lowercase select-none"
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
        cam.position.setZ(Math.max(10, 9.0 / (size.width / size.height)));
        cam.updateProjectionMatrix();
    }, [camera, size]);
    return null;
}

//  Main Export
// ═════════════════════════════════════════════════════════════
export function MorphingParticleField({ color = "#ffffff", className = "" }: { color?: string; className?: string }) {
    const shared = useRef<SharedState>(createSharedState());
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const aim = (clientX: number, clientY: number) => {
            const rect = el.getBoundingClientRect();
            shared.current.cursorX = clientX - rect.left;
            shared.current.cursorY = clientY - rect.top;
            shared.current.pointerActive = true;
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
            aim(e.clientX, e.clientY);
        };
        const leave = () => { shared.current.pointerActive = false; };

        // Touch: press and hold on the shape to charge it, the direct analogue
        // of resting the cursor there. Lifting disarms.
        const down = (e: PointerEvent) => {
            if (e.pointerType === "mouse") return;
            lastTouch = performance.now();
            aim(e.clientX, e.clientY);
        };
        const drag = (e: PointerEvent) => {
            if (e.pointerType === "mouse") return;
            lastTouch = performance.now();
            aim(e.clientX, e.clientY);
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
                >
                    <CameraFit />
                    <MorphingPointCloud color={color} shared={shared} />
                </Canvas>
            </div>

            {/* HTML overlays — outside blend context */}
            <TensionRing shared={shared} />
            <ShapeWord shared={shared} />
        </div>
    );
}
