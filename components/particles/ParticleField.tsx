"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { generateSilhouetteParticles, generateParticleSizes } from "@/lib/particleData";

// ── Model ──────────────────────────────────────────────────────────────────
// The cursor does not touch particles. It writes into a coarse displacement
// field — a wake — and every particle reads that field and glides toward
// `base + wake` with a first-order lag. Two consequences:
//
//   1. The persistence lives in the FIELD, which decays smoothly (exp, tau
//      below) and blooms outward as it fades. Motion keeps living after the
//      cursor leaves.
//   2. No particle has an oscillatory mode any more. A first-order tracker
//      cannot overshoot, so nothing rings. The old model was a spring at
//      k=0.028, D=0.91 — damping ratio 0.288, ~1.6 visible bounces per
//      particle, 5,000 of them ringing out of phase. That was the jelly.
//
// The character it is protecting is unchanged: tangential silk flow around the
// cursor path, never repulsion.

const PARTICLE_COUNT   = 5000;
const INFLUENCE_RADIUS = 2.2;    // world-space reach of the cursor — as before

// ── The wake field ─────────────────────────────────────────────────────────
const GRID_W          = 64;      // cells across; ~0.33 world units at 16:9
const GRID_H          = 40;
const GRID_MARGIN     = INFLUENCE_RADIUS;  // grid overhangs the viewport by one reach
const FIELD_TAU       = 0.42;    // seconds for the wake to fall to 1/e — the shape of the tail
const FIELD_FLOOR     = 0.70;    // magnitude bled per second ON TOP of the decay, so the wake
                                 // reaches EXACTLY zero in finite time instead of trailing an
                                 // invisible asymptote. Pure exponential decay settled slower
                                 // than the old spring did (1.68s vs 1.07s) even with no
                                 // bouncing at all; this is what buys the settle axis back.
const FIELD_DIFFUSION = 0.13;    // 5-point blur, per SECOND at 60fps. Scaled by dt below and
                                 // then clamped: an explicit 5-point stencil goes unstable above
                                 // 0.25, and MAX_DT * 60 * this would reach 0.39.
const DIFFUSION_HALO  = 5;       // cells of headroom around a splat for the bloom to spread into
const MAX_DISPLACE    = 1.00;    // world units the field can pull the silk at full speed
const SPEED_HALF      = 4.5;     // world units/sec at which the speed term reaches half its range.
                                 // Was 7.0, which meant an ordinary unhurried drag sat near the
                                 // bottom of the curve and read as barely responsive.
const DEPOSIT_TAU     = 0.055;   // seconds for the field to reach the cursor's demand
const TRAIL_OFFSET    = 0.55;    // splat centre sits this far behind the hand → comet, not disc
const DRAG_ALONG      = 0.45;    // share of the wake that follows the cursor's heading
const INWARD          = 0.22;    // silk drapes toward the hand — same 0.22 as before
const IDLE_FLOOR      = 0.40;    // amplitude every input gets before speed is considered, so a
                                 // resting cursor, a drifting ambient source and a finger between
                                 // gestures all read alike. This is the single number that makes
                                 // desktop and mobile feel the same; the speed term only adds.
const PRESS_KICK      = 0.30;    // extra reach on pointerdown, so a click or tap visibly lands
const PRESS_TAU       = 0.30;    // seconds for that kick to fall to 1/e
const IDLE_SPEED      = 0.30;    // world units/sec below which the cursor counts as at rest
const LIFT            = 0.22;    // z lift proportional to local wake magnitude
const FIELD_EPS       = 2e-4;    // below this the field is zeroed and the whole system sleeps

// ── The particle tracker ───────────────────────────────────────────────────
// ── Ambient source ─────────────────────────────────────────────────────────
// A phone never moves a pointer, and R3F parks `mouse` at (0,0) when nothing has.
// The previous model let that phantom cursor push the nebula's bright centre forever;
// excluding touch fixed the stuck push and left the field perceptually still on mobile,
// where the only motion left was a 0.022-unit breath, roughly two pixels. This restores
// the life without reintroducing a fixed point: a source that wanders a slow Lissajous
// path, so it is never parked anywhere, feeding exactly the same deposit code a real
// cursor feeds. It also covers a desktop before its first mouse move, and after the
// pointer leaves the canvas.
const AMBIENT_OMEGA = 0.38;      // rad/sec on the x term; y runs at 0.73x for an open path
const AMBIENT_RX    = 0.30;      // share of the world box half-width the path sweeps
const AMBIENT_RY    = 0.22;

const FOLLOW_TAU = 0.10;         // seconds; scaled per particle over [0.70, 1.40]
const MAX_DT     = 0.05;         // same 3-frame clamp the old dtScale had

// Golden-ratio fraction — a low-discrepancy sequence, so consecutive indices get
// very different values and the lag spread is even without needing Math.random().
const GOLDEN = 0.6180339887498949;

function PointCloud({ color = "#8da3b5", reduced = false }: { color?: string; reduced?: boolean }) {
    const pointsRef = useRef<THREE.Points>(null);
    const { mouse, viewport, gl } = useThree();

    const [positions, originalPositions] = useMemo(() => {
        const raw = generateSilhouetteParticles(PARTICLE_COUNT);
        return [raw, new Float32Array(raw)];
    }, []);

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

    // Breathing phase table + per-thread lag, rolled once at mount.
    //
    // The breathing terms are sin(w*t + phi_i). Splitting them with the angle-sum
    // identity — sin(a+b) = sin a cos b + cos a sin b — moves the three per-particle
    // trig calls out of the frame loop and into this table: three sin/cos pairs per
    // frame TOTAL, plus six array reads per particle. Same numbers, 15,000 fewer
    // Math.sin calls every frame. That saving is what pays for the field.
    //
    // `follow` is each thread's own lag multiplier. Identical lags would make the
    // cloud move as one rigid sheet; spreading them is what makes it read as fabric.
    const [phase, follow] = useMemo(() => {
        const p = new Float32Array(PARTICLE_COUNT * 6);
        const f = new Float32Array(PARTICLE_COUNT);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const i6 = i * 6;
            const a = originalPositions[i3 + 1] * 1.3;  // baseX phase
            const b = originalPositions[i3] * 1.3;      // baseY phase
            const c = i * 0.0007;                        // baseZ phase
            p[i6]     = Math.cos(a); p[i6 + 1] = Math.sin(a);
            p[i6 + 2] = Math.cos(b); p[i6 + 3] = Math.sin(b);
            p[i6 + 4] = Math.cos(c); p[i6 + 5] = Math.sin(c);
            f[i] = 0.70 + ((i * GOLDEN) % 1) * 0.70;
        }
        return [p, f];
    }, [originalPositions]);

    // Allocated once, never reallocated. 64x40x2 floats x2 buffers ≈ 41KB.
    const field   = useRef(new Float32Array(GRID_W * GRID_H * 2));
    const scratch = useRef(new Float32Array(GRID_W * GRID_H * 2));
    // Integer cell box the wake currently occupies, so a small gesture costs a small
    // grid pass. `live` false means the field is exactly zero and the whole system sleeps.
    const bounds  = useRef({ x0: 0, x1: 0, y0: 0, y1: 0, live: false });
    const prev    = useRef({ x: 0, y: 0, valid: false });
    const present = useRef(false);
    // A decaying impulse so a click or a tap visibly lands. Without it a press does nothing
    // at all on desktop, because a stationary cursor produces no path length and therefore
    // no speed term, and the only thing separating a click from a hover is the event.
    const press   = useRef(0);

    // Pointer presence. Without this, R3F's `mouse` sits at (0,0) — the bright nucleus —
    // on any device that never moves a pointer, and the old resting-cursor push was
    // applied there forever. Touch is excluded outright, so a phone gets no wake, no grid
    // pass and no field sampling at all. `valid` is cleared on leave so that re-entering
    // the canvas somewhere else cannot register as one enormous single-frame cursor jump.
    useEffect(() => {
        const el = gl.domElement;
        // enter discards the stale position so the first frame back measures no travel;
        // move only marks presence — it must NOT touch `valid`, or every frame would
        // start from a fresh sample, the cursor would read as motionless, and the swirl
        // would never fire at all.
        const enter = () => {
            present.current = true;
            prev.current.valid = false;
        };
        const down = () => {
            present.current = true;
            prev.current.valid = false;
            press.current = 1;
        };
        const move = () => {
            present.current = true;
        };
        const leave = () => {
            present.current = false;
            prev.current.valid = false;
        };
        el.addEventListener("pointerdown", down, { passive: true });
        el.addEventListener("pointerup", leave, { passive: true });
        el.addEventListener("pointerenter", enter, { passive: true });
        el.addEventListener("pointermove", move, { passive: true });
        el.addEventListener("pointerleave", leave, { passive: true });
        el.addEventListener("pointercancel", leave, { passive: true });
        return () => {
            el.removeEventListener("pointerdown", down);
            el.removeEventListener("pointerup", leave);
            el.removeEventListener("pointerenter", enter);
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
            el.removeEventListener("pointercancel", leave);
        };
    }, [gl]);

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
            varying   float vFade;
            void main() {
                vOpacity      = aOpacity;
                vec4 mvPos    = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize  = max(3.0, 45.0 * aSize / (-mvPos.z));
                gl_Position   = projectionMatrix * mvPos;

                // Additive blending adds light to whatever is behind it, so it only
                // works over a dark backdrop. This section's gradient turns pale past
                // the halfway mark, and down there every channel clips to 255: the
                // colour flattens to white and the Gaussian edge is crushed into a
                // hard dot. Scattered 3px white dots on a pale surface read as dust
                // on the screen rather than as a nebula, so fade the field out as the
                // background rises to meet it. ndcY is +1 at the top of the section
                // and -1 at the bottom: full strength to ~52% down, gone by ~87%,
                // which is before the first channel would clip.
                float ndcY    = gl_Position.y / gl_Position.w;
                vFade         = smoothstep(-0.75, -0.05, ndcY);
            }
        `,
        fragmentShader: `
            uniform vec3  uColor;
            uniform float uGlobalOpacity;
            varying float vOpacity;
            varying float vFade;
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                // Gaussian falloff — a soft glowing dot, not a hard disc
                float alpha  = exp(-d * d * 9.0) * vOpacity * uGlobalOpacity * vFade;
                if (alpha < 0.002) discard;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
    }), [color]);

    useFrame((state, delta) => {
        // Nothing animates under reduced motion; the mount frame is the whole effect.
        if (reduced) return;
        if (!pointsRef.current) return;

        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const pos  = posAttr.array as Float32Array;
        const orig = originalPositions;
        const ph   = phase;
        const lag  = follow;
        const W    = field.current;
        const S    = scratch.current;
        const b    = bounds.current;
        const time = state.clock.getElapsedTime();
        const dt   = Math.min(delta, MAX_DT);

        // Coming back from frameloop="never" (scrolled away) hands us one frame with a
        // delta of seconds. Rather than let a stale wake sit frozen in the section
        // waiting to be scrolled back to, drop it and start clean.
        if (delta > 0.25 && b.live) {
            W.fill(0);
            b.live = false;
            prev.current.valid = false;
        }

        // Grid placement, recomputed every frame so a resize costs nothing to handle.
        const halfW = viewport.width  / 2 + GRID_MARGIN;
        const halfH = viewport.height / 2 + GRID_MARGIN;
        const cellW = (halfW * 2) / GRID_W;
        const cellH = (halfH * 2) / GRID_H;
        const invCW = 1 / cellW;
        const invCH = 1 / cellH;
        const minX  = -halfW;
        const minY  = -halfH;

        let peak = 0;

        // ── 1. The wake decays and blooms ───────────────────────────────────
        // Exponential decay is the tail; the 5-point blur is why the wake softens
        // and spreads as it goes rather than just dimming in place.
        if (b.live) {
            const decay = Math.exp(-dt / FIELD_TAU);
            const bleed = FIELD_FLOOR * dt;
            // Diffusion was the one term still measured in frames rather than seconds, so
            // the wake bloomed about twice as wide at 120fps as at 30 for the same gesture.
            // The clamp is not optional: without it a long frame drives the stencil past
            // its 0.25 stability limit and the field oscillates cell to cell.
            const diff = Math.min(FIELD_DIFFUSION * dt * 60, 0.24);
            const { x0, x1, y0, y1 } = b;

            for (let y = y0; y <= y1; y++) {
                const row = y * GRID_W;
                const rowUp = y > 0 ? row - GRID_W : row;
                const rowDn = y < GRID_H - 1 ? row + GRID_W : row;
                for (let x = x0; x <= x1; x++) {
                    const c = (row + x) * 2;
                    const l = (row + (x > 0 ? x - 1 : x)) * 2;
                    const r = (row + (x < GRID_W - 1 ? x + 1 : x)) * 2;
                    const u = (rowUp + x) * 2;
                    const d = (rowDn + x) * 2;

                    const cx = W[c];
                    const cy = W[c + 1];
                    let nx = (cx + diff * (W[l] + W[r] + W[u] + W[d] - 4 * cx)) * decay;
                    let ny = (cy + diff * (W[l + 1] + W[r + 1] + W[u + 1] + W[d + 1] - 4 * cy)) * decay;

                    // Constant bleed on the magnitude. Scaling both components by the same
                    // factor keeps the direction exact, and the cell lands on a true zero
                    // rather than creeping toward one — which is also what lets the whole
                    // system detect that it is finished and go back to sleep.
                    let m = (nx < 0 ? -nx : nx) + (ny < 0 ? -ny : ny);
                    if (m <= bleed) {
                        nx = 0; ny = 0; m = 0;
                    } else {
                        const shrink = 1 - bleed / m;
                        nx *= shrink; ny *= shrink; m -= bleed;
                    }

                    S[c] = nx;
                    S[c + 1] = ny;
                    if (m > peak) peak = m;
                }
            }
            for (let y = y0; y <= y1; y++) {
                const row = y * GRID_W;
                for (let x = x0; x <= x1; x++) {
                    const c = (row + x) * 2;
                    W[c] = S[c];
                    W[c + 1] = S[c + 1];
                }
            }

            if (peak < FIELD_EPS) {
                for (let y = y0; y <= y1; y++) {
                    const row = y * GRID_W;
                    for (let x = x0; x <= x1; x++) {
                        const c = (row + x) * 2;
                        W[c] = 0;
                        W[c + 1] = 0;
                    }
                }
                b.live = false;
                peak = 0;
            }
        }

        // ── 2. The cursor lays down new wake ────────────────────────────────
        const mouseXReal = (mouse.x * viewport.width)  / 2;
        const mouseYReal = (mouse.y * viewport.height) / 2;

        let mvxReal = 0;
        let mvyReal = 0;
        if (prev.current.valid) {
            mvxReal = mouseXReal - prev.current.x;
            mvyReal = mouseYReal - prev.current.y;
        }
        prev.current.x = mouseXReal;
        prev.current.y = mouseYReal;
        prev.current.valid = true;

        press.current *= Math.exp(-dt / PRESS_TAU);
        if (press.current < 1e-3) press.current = 0;

        // TWO sources, both deposited every frame. The drift is the field's own life and it
        // never stops; a hand does not replace it, it disturbs it. Source 0 is the drift,
        // source 1 is the pointer and exists only while one is over the canvas.
        //
        // This also deletes a whole class of bug. Every jerk and teleport in this file came
        // from handing a single source back and forth between the drift and the cursor, so
        // the path needed rebasing onto wherever control changed hands. With the drift
        // running continuously there is no handover left to smooth: the ambient path is
        // evaluated absolutely again, and the rebasing machinery is gone.
        const ax = (t: number) => Math.sin(t * AMBIENT_OMEGA) * halfW * AMBIENT_RX;
        const ay = (t: number) => Math.sin(t * AMBIENT_OMEGA * 0.73 + 1.3) * halfH * AMBIENT_RY;
        const nSources = present.current ? 2 : 1;

        for (let si = 0; si < nSources; si++) {
            const isPointer = si === 1;
            const mouseX = isPointer ? mouseXReal : ax(time);
            const mouseY = isPointer ? mouseYReal : ay(time);
            const mvx    = isPointer ? mvxReal    : ax(time) - ax(time - dt);
            const mvy    = isPointer ? mvyReal    : ay(time) - ay(time - dt);
            const pathLen = Math.sqrt(mvx * mvx + mvy * mvy);
            const speed   = pathLen / dt;                 // world units per SECOND — frame-rate free

            // One code path for both moods; only the direction recipe and the demand differ.
            let tanW: number, dragW: number, radW: number;
            let ux = 0, uy = 0;
            let reach: number, blend: number, steps: number;

            if (speed > IDLE_SPEED) {
                ux = mvx / pathLen;
                uy = mvy / pathLen;
                tanW  = 1;              // tangential — the documented silk swirl, still dominant
                dragW = DRAG_ALONG;     // and some of it is dragged along the hand's heading
                radW  = -INWARD;        // drapes toward the hand, never away from it
                // Saturating demand: fast gestures pull further, but never past MAX_DISPLACE,
                // so there is no accumulation runaway and no clamp discontinuity.
                // Floor plus a saturating speed term. Moving is therefore always at least
                // as strong as resting, which the old two-branch version could not promise:
                // ambient sat at a pinned 0.32 while a slow drag computed 0.12, so drifting
                // looked livelier than dragging.
                reach = IDLE_FLOOR + (MAX_DISPLACE - IDLE_FLOOR) * speed / (speed + SPEED_HALF)
                      + (isPointer ? PRESS_KICK * press.current : 0);
                // A fast flick can cross more than a radius in one frame; substep so it
                // lays a continuous ribbon instead of a row of separate dots.
                steps = 1 + Math.floor(pathLen / (INFLUENCE_RADIUS * 0.7));
                if (steps > 4) steps = 4;
                blend = 1 - Math.exp(-dt / (DEPOSIT_TAU * steps));
            } else {
                tanW  = 0;
                dragW = 0;
                radW  = 1;              // resting hand: a barely-there radial breath, as before
                reach = IDLE_FLOOR * (0.82 + 0.18 * Math.sin(time * 0.9))
                      + (isPointer ? PRESS_KICK * press.current : 0);
                steps = 1;
                blend = 1 - Math.exp(-dt / (DEPOSIT_TAU * 6));
            }

            // The press kick is added on top of a curve that already approaches MAX_DISPLACE,
            // so a click during a fast drag could ask for 1.3 and make MAX_DISPLACE a lie.
            // Clamp it: the kick then does its work where it is actually wanted, on a
            // stationary press, and cannot stack into something the cap was meant to prevent.
            if (reach > MAX_DISPLACE) reach = MAX_DISPLACE;

            const R2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

            for (let s = 0; s < steps; s++) {
                const t  = steps === 1 ? 0 : s / (steps - 1);
                const sx = mouseX - mvx * (1 - t) - ux * TRAIL_OFFSET;
                const sy = mouseY - mvy * (1 - t) - uy * TRAIL_OFFSET;

                let gx0 = Math.floor((sx - INFLUENCE_RADIUS - minX) * invCW) - DIFFUSION_HALO;
                let gx1 = Math.floor((sx + INFLUENCE_RADIUS - minX) * invCW) + DIFFUSION_HALO;
                let gy0 = Math.floor((sy - INFLUENCE_RADIUS - minY) * invCH) - DIFFUSION_HALO;
                let gy1 = Math.floor((sy + INFLUENCE_RADIUS - minY) * invCH) + DIFFUSION_HALO;
                if (gx0 < 0) gx0 = 0;
                if (gy0 < 0) gy0 = 0;
                if (gx1 > GRID_W - 1) gx1 = GRID_W - 1;
                if (gy1 > GRID_H - 1) gy1 = GRID_H - 1;
                if (gx0 > gx1 || gy0 > gy1) continue;

                // The halo is claimed up front so the bloom has somewhere to spread into
                // without the box having to creep outward a cell per frame.
                if (!b.live) {
                    b.x0 = gx0; b.x1 = gx1; b.y0 = gy0; b.y1 = gy1; b.live = true;
                } else {
                    if (gx0 < b.x0) b.x0 = gx0;
                    if (gx1 > b.x1) b.x1 = gx1;
                    if (gy0 < b.y0) b.y0 = gy0;
                    if (gy1 > b.y1) b.y1 = gy1;
                }

                for (let y = gy0; y <= gy1; y++) {
                    const dy  = minY + (y + 0.5) * cellH - sy;
                    const row = y * GRID_W;
                    for (let x = gx0; x <= gx1; x++) {
                        const dx = minX + (x + 0.5) * cellW - sx;
                        const d2 = dx * dx + dy * dy;
                        if (d2 >= R2 || d2 < 1e-8) continue;

                        const dist = Math.sqrt(d2);
                        const nx   = dx / dist;   // unit vector, cursor → cell
                        const ny   = dy / dist;

                        // Smoothstep falloff: 1 at the splat centre, 0 at the radius edge
                        const q       = 1 - dist / INFLUENCE_RADIUS;
                        const falloff = q * q * (3 - 2 * q);

                        // Rotating the radial 90° gives the orbital current. This is the
                        // same construction as before — it just lands in the field now.
                        const dirX = tanW * -ny + radW * nx + dragW * ux;
                        const dirY = tanW *  nx + radW * ny + dragW * uy;
                        const dl   = Math.sqrt(dirX * dirX + dirY * dirY);
                        if (dl < 1e-6) continue;

                        const scale = reach * falloff / dl;
                        const c  = (row + x) * 2;
                        const wx = W[c]     + (dirX * scale - W[c])     * blend;
                        const wy = W[c + 1] + (dirY * scale - W[c + 1]) * blend;
                        W[c]     = wx;
                        W[c + 1] = wy;

                        const m = (wx < 0 ? -wx : wx) + (wy < 0 ? -wy : wy);
                        if (m > peak) peak = m;
                    }
                }
            }
        }

        // ── 3. Particles track the field — first order, so nothing can ring ─
        const kBase   = 1 - Math.exp(-dt / FOLLOW_TAU);
        const hasWake = peak > FIELD_EPS;

        // World box the wake occupies. Outside it the sample is provably zero, so most
        // particles pay four compares instead of a bilinear fetch.
        let wx0 = 0, wx1 = 0, wy0 = 0, wy1 = 0;
        if (hasWake) {
            wx0 = minX + b.x0 * cellW;
            wx1 = minX + (b.x1 + 1) * cellW;
            wy0 = minY + b.y0 * cellH;
            wy1 = minY + (b.y1 + 1) * cellH;
        }

        const sa1 = Math.sin(time * 0.38), ca1 = Math.cos(time * 0.38);
        const sa2 = Math.sin(time * 0.44), ca2 = Math.cos(time * 0.44);
        const sa3 = Math.sin(time * 0.27), ca3 = Math.cos(time * 0.27);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const i6 = i * 6;
            const ox = orig[i3];
            const oy = orig[i3 + 1];

            // Breathing base — bit-for-bit the same layered sines as before, just
            // evaluated through the phase table instead of three Math.sin calls.
            const bx = ox           + (sa1 * ph[i6]     + ca1 * ph[i6 + 1]) * 0.022;
            const by = oy           + (ca2 * ph[i6 + 2] - sa2 * ph[i6 + 3]) * 0.022;
            const bz = orig[i3 + 2] + (sa3 * ph[i6 + 4] + ca3 * ph[i6 + 5]) * 0.012;

            let tx = bx;
            let ty = by;
            let tz = bz;

            if (hasWake && ox > wx0 && ox < wx1 && oy > wy0 && oy < wy1) {
                // Sampled at the REST position, not the current one. That keeps the
                // lookup a pure function of the field: a particle can never drag its own
                // sample around, so there is no feedback path and nothing to amplify.
                let gx = (ox - minX) * invCW - 0.5;
                let gy = (oy - minY) * invCH - 0.5;
                if (gx < 0) gx = 0; else if (gx > GRID_W - 1.001) gx = GRID_W - 1.001;
                if (gy < 0) gy = 0; else if (gy > GRID_H - 1.001) gy = GRID_H - 1.001;

                const ix = gx | 0;
                const iy = gy | 0;
                const fx = gx - ix;
                const fy = gy - iy;
                const gx1c = 1 - fx;
                const gy1c = 1 - fy;
                const w00 = gx1c * gy1c;
                const w10 = fx   * gy1c;
                const w01 = gx1c * fy;
                const w11 = fx   * fy;

                const o00 = (iy * GRID_W + ix) * 2;
                const o10 = o00 + 2;
                const o01 = o00 + GRID_W * 2;
                const o11 = o01 + 2;

                const dxw = W[o00]     * w00 + W[o10]     * w10 + W[o01]     * w01 + W[o11]     * w11;
                const dyw = W[o00 + 1] * w00 + W[o10 + 1] * w10 + W[o01 + 1] * w01 + W[o11 + 1] * w11;

                tx = bx + dxw;
                ty = by + dyw;
                // Displaced silk lifts very slightly toward the camera, which reads as a
                // faint brightening along the wake rather than a flat slide.
                tz = bz + ((dxw < 0 ? -dxw : dxw) + (dyw < 0 ? -dyw : dyw)) * LIFT;
            }

            // Exponential approach. k is frame-rate corrected and dt is clamped, so
            // k * lag stays well under 1 at any frame rate: the move is monotonic and
            // cannot overshoot, which is the entire point of the redesign.
            const k = kBase * lag[i];
            pos[i3]     += (tx - pos[i3])     * k;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * k;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * k;
        }

        posAttr.needsUpdate = true;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export function ParticleField({ color = "#8da3b5", className = "", active = true }: { color?: string; className?: string; active?: boolean }) {
    // Reduced motion: render the field once and then stop, rather than removing it.
    // The particles are this section's visual content, so a still frame keeps the
    // composition while the movement — which is the part that triggers vestibular
    // symptoms — goes away entirely. frameloop "demand" draws on mount and then only
    // when something invalidates, so there is no ongoing CPU, GPU or battery cost.
    const reduced = !!useReducedMotion();
    return (
        <div className={`w-full h-full pointer-events-auto absolute inset-0 z-0 ${className}`}>
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
                <PointCloud color={color} reduced={reduced} />
            </Canvas>
        </div>
    );
}
