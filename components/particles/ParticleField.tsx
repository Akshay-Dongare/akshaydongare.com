"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { generateSilhouetteParticles, generateParticleSizes } from "@/lib/particleData";

// ── Model: sources write a decaying wake field, and each particle glides toward base + wake ──
// A first-order lag cannot overshoot, so nothing rings. Silk flow, never repulsion; AGENTS.md, Particle Systems.

const PARTICLE_COUNT   = 5000;
const INFLUENCE_RADIUS = 2.2;    // world-space reach of each wake source

// ── The wake field ─────────────────────────────────────────────────────────
const GRID_W          = 64;      // cells across; ~0.33 world units at 16:9
const GRID_H          = 40;
const GRID_MARGIN     = INFLUENCE_RADIUS;  // grid overhangs the viewport by one reach
const FIELD_TAU       = 0.42;    // seconds for the wake to fall to 1/e — the shape of the tail
const FIELD_FLOOR     = 0.70;    // magnitude bled per second ON TOP of the decay, so the wake reaches EXACTLY
                                 // zero in finite time; decay alone takes 1.68s to settle. AGENTS.md, Particle Systems.
const FIELD_DIFFUSION = 0.13;    // 5-point blur per SECOND at 60fps, scaled by dt and clamped below 0.25,
                                 // where the explicit stencil goes unstable; MAX_DT * 60 * this reaches 0.39.
const DIFFUSION_HALO  = 5;       // cells of headroom around a splat for the bloom to spread into
const MAX_DISPLACE    = 1.00;    // world units the field can pull the silk at full speed
const SPEED_HALF      = 4.5;     // world units/sec at which the speed term reaches half its range. At 7.0
                                 // an unhurried drag sits near the bottom of the curve and reads as unresponsive.
const DEPOSIT_TAU     = 0.055;   // seconds for the field to reach the cursor's demand
const TRAIL_OFFSET    = 0.55;    // splat centre sits this far behind the hand → comet, not disc
const DRAG_ALONG      = 0.45;    // share of the wake that follows the cursor's heading
const INWARD          = 0.22;    // silk drapes toward the hand; 0.22 is part of the protected character, AGENTS.md
const IDLE_FLOOR      = 0.40;    // amplitude every source gets before speed, so a resting cursor, the drift and a
                                 // finger read alike; the single liveliness dial. AGENTS.md, Particle Systems.
const PRESS_KICK      = 0.30;    // extra reach on pointerdown, so a click or tap visibly lands
const PRESS_TAU       = 0.30;    // seconds for that kick to fall to 1/e
const IDLE_SPEED      = 0.30;    // world units/sec below which the cursor counts as at rest
const LIFT            = 0.22;    // z lift proportional to local wake magnitude
const FIELD_EPS       = 2e-4;    // below this the field is zeroed and the whole system sleeps

// ── Ambient source ─────────────────────────────────────────────────────────
// Source 0: a Lissajous drift that never parks, so phones and idle desktops get a wake. AGENTS.md, Particle Systems.
const AMBIENT_OMEGA = 0.38;      // rad/sec on the x term; y runs at 0.73x for an open path
const AMBIENT_RX    = 0.30;      // share of the world box half-width the path sweeps
const AMBIENT_RY    = 0.22;

// ── The particle tracker ───────────────────────────────────────────────────
const FOLLOW_TAU = 0.10;         // seconds; scaled per particle over [0.70, 1.40]
const MAX_DT     = 0.05;         // 3-frame dt clamp at 60fps; caps the tracker gain at 0.55 (AGENTS.md)

// Golden-ratio fraction — a low-discrepancy sequence, so consecutive indices get
// very different values and the lag spread is even without needing Math.random().
const GOLDEN = 0.6180339887498949;

// The NDC band over which the field fades out toward the section foot; see the vertex shader.
const DARK_FADE: [number, number] = [-0.75, -0.05];

function PointCloud({ color = "#8da3b5", reduced = false, blend = "add", fade = DARK_FADE }: { color?: string; reduced?: boolean; blend?: "add" | "normal"; fade?: [number, number] }) {
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

    // Per-particle size scalar, 70% fine grain and 30% structural nodes. Nodes favour dense strands
    // so additive blending stacks them into glowing pools; AGENTS.md, Particle Systems.
    const particleSizes = useMemo(() => generateParticleSizes(PARTICLE_COUNT), []);

    // Phase table: the angle-sum identity takes 15,000 Math.sin calls a frame out of the loop, which pays
    // for the field. `follow` spreads each thread's lag, or the cloud moves as one rigid sheet, not fabric.
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
    // A decaying impulse so a click or a tap visibly lands: a stationary cursor has no speed term,
    // so without it a press on desktop does nothing.
    const press   = useRef(0);

    // Pointer presence gates source 1; without it R3F's stale `mouse`, (0,0) until a move, pins the wake to one point.
    // `valid` clears on leave so re-entering elsewhere cannot read as one huge single-frame cursor jump.
    useEffect(() => {
        const el = gl.domElement;
        // enter and down discard the stale position so the first frame back measures no travel. move must NOT
        // touch `valid`, or every frame starts fresh, the cursor reads as motionless and the swirl never fires.
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

    // Soft Gaussian circles. Additive in dark, so dense silhouette regions stack into bright clusters
    // on the section's dark top; the vertex shader fades them out over its light bottom.
    const material = useMemo(() => new THREE.ShaderMaterial({
        transparent: true,
        depthWrite:  false,
        // Light mode lays the same particles as colour instead: added light cannot darken paper.
        blending:    blend === "normal" ? THREE.NormalBlending : THREE.AdditiveBlending,
        uniforms: {
            uColor:         { value: new THREE.Color(color) },
            uGlobalOpacity: { value: 0.62 },
            uFade:          { value: new THREE.Vector2(fade[0], fade[1]) },
        },
        vertexShader: `
            attribute float aOpacity;
            attribute float aSize;
            varying   float vOpacity;
            varying   float vFade;
            uniform   vec2  uFade;
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
                vFade         = smoothstep(uFade.x, uFade.y, ndcY);
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
    }), [color, blend, fade]);
    // A mode switch builds a new material; free the old one's GPU program.
    useEffect(() => () => material.dispose(), [material]);

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

        // Resuming from frameloop="never" (scrolled away) hands one frame a delta of seconds, so drop the
        // stale wake and start clean rather than leave it frozen in the section.
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
        // Exponential decay is the tail; the 5-point blur spreads and softens it rather than dimming it in place.
        if (b.live) {
            const decay = Math.exp(-dt / FIELD_TAU);
            const bleed = FIELD_FLOOR * dt;
            // Scaled by dt so the bloom is as wide at 120fps as at 30. The clamp is not optional: past 0.25
            // the stencil oscillates cell to cell. AGENTS.md, Particle Systems.
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

                    // Constant bleed on the magnitude. One factor on both components keeps the direction
                    // exact, and a true zero is what lets the system detect it is finished and sleep.
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

        // TWO sources every frame: 0 is the drift, which never stops, and 1 is the pointer while one is over
        // the canvas. Never merge them into one switched source; AGENTS.md, Particle Systems, says why.
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
                tanW  = 1;              // tangential: the documented silk swirl, and the dominant term
                dragW = DRAG_ALONG;     // and some of it is dragged along the hand's heading
                radW  = -INWARD;        // drapes toward the hand, never away from it
                // Floor plus a saturating speed term: moving is never weaker than resting, and fast gestures
                // approach MAX_DISPLACE without a runaway or a clamp step. AGENTS.md, Particle Systems.
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
                radW  = 1;              // resting hand: a barely-there radial breath
                reach = IDLE_FLOOR * (0.82 + 0.18 * Math.sin(time * 0.9))
                      + (isPointer ? PRESS_KICK * press.current : 0);
                steps = 1;
                blend = 1 - Math.exp(-dt / (DEPOSIT_TAU * 6));
            }

            // The press kick sits on a curve already near MAX_DISPLACE, so a click mid-drag could ask for 1.3.
            // The clamp keeps the cap true; the kick shows where it is wanted, on a stationary press.
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

                        // Rotating the radial 90° gives the orbital current, written into the field.
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

            // Breathing base: three layered sines, read through the phase table instead of three Math.sin calls.
            const bx = ox           + (sa1 * ph[i6]     + ca1 * ph[i6 + 1]) * 0.022;
            const by = oy           + (ca2 * ph[i6 + 2] - sa2 * ph[i6 + 3]) * 0.022;
            const bz = orig[i3 + 2] + (sa3 * ph[i6 + 4] + ca3 * ph[i6 + 5]) * 0.012;

            let tx = bx;
            let ty = by;
            let tz = bz;

            if (hasWake && ox > wx0 && ox < wx1 && oy > wy0 && oy < wy1) {
                // Sampled at the REST position, so a particle can never drag its own sample around:
                // no feedback path, nothing to amplify. AGENTS.md, Particle Systems.
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

            // Exponential approach. k is frame-rate corrected and dt is clamped, so k * lag stays under 1
            // at any frame rate and the move is monotonic: it cannot overshoot. AGENTS.md, Particle Systems.
            const k = kBase * lag[i];
            pos[i3]     += (tx - pos[i3])     * k;
            pos[i3 + 1] += (ty - pos[i3 + 1]) * k;
            pos[i3 + 2] += (tz - pos[i3 + 2]) * k;
        }

        posAttr.needsUpdate = true;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export function ParticleField({ color = "#8da3b5", className = "", active = true, blend = "add", fade = DARK_FADE }: { color?: string; className?: string; active?: boolean; blend?: "add" | "normal"; fade?: [number, number] }) {
    // Reduced motion draws one still frame rather than removing the field: it keeps the composition and drops
    // the movement, which triggers vestibular symptoms. "demand" then has no ongoing CPU, GPU or battery cost.
    const reduced = !!useReducedMotion();
    return (
        <div className={`w-full h-full pointer-events-auto absolute inset-0 z-0 ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 10], fov: 50 }}
                gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 1.5]}
                // "never" stops the render loop but keeps the GL context, geometry and simulation state,
                    // so scrolling back resumes for free and an offscreen canvas does not render at 60fps.
                    frameloop={reduced ? "demand" : active ? "always" : "never"}
            >
                <PointCloud color={color} reduced={reduced} blend={blend} fade={fade} />
            </Canvas>
        </div>
    );
}
