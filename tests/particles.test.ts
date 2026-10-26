import { test } from "node:test";
import assert from "node:assert/strict";
import { SHAPE_GENERATORS } from "../lib/shapeGenerators.ts";
import { generateParticleSizes, generateSilhouetteParticles } from "../lib/particleData.ts";

// A NaN or a runaway coordinate in a position buffer renders as a missing or stray particle, silently.
function assertPositions(positions: Float32Array, count: number, bound: number, label: string) {
    assert.equal(positions.length, count * 3, `${label}: one xyz triple per particle`);
    for (let i = 0; i < positions.length; i++) {
        const v = positions[i];
        assert.ok(Number.isFinite(v) && Math.abs(v) < bound, `${label}: coordinate ${i} is ${v}`);
    }
}

test("every morph shape fills its 8,000 particles with finite, in-frame positions", () => {
    assert.equal(SHAPE_GENERATORS.length, 5);
    for (const generate of SHAPE_GENERATORS) assertPositions(generate(8000), 8000, 20, generate.name);
});

test("the nebula fills its 5,000 particles with finite positions", () => {
    assertPositions(generateSilhouetteParticles(5000), 5000, 20, "nebula");
});

test("particle sizes are fine grain or structural nodes, nothing in between", () => {
    const sizes = generateParticleSizes(5000);
    assert.equal(sizes.length, 5000);
    for (const s of sizes) assert.ok((s >= 0.75 && s <= 1.0) || (s >= 1.5 && s <= 2.5), `size ${s}`);
});
