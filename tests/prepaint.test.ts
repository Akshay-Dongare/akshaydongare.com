import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { BOOT_SKIP_SCRIPT, MODE_SCRIPT } from "../lib/prepaint.ts";

// A stand-in for the page before first paint: just what the two inline scripts touch.
function page({ session = {}, local = {}, dark = false, reduced = false, blocked = false }: {
    session?: Record<string, string>; local?: Record<string, string>; dark?: boolean; reduced?: boolean; blocked?: boolean;
} = {}) {
    const storage = (initial: Record<string, string>) => {
        const map = new Map(Object.entries(initial));
        const guard = () => { if (blocked) throw new Error("storage blocked"); };
        return {
            map,
            getItem: (k: string) => { guard(); return map.get(k) ?? null; },
            setItem: (k: string, v: string) => { guard(); map.set(k, String(v)); },
            removeItem: (k: string) => { guard(); map.delete(k); },
        };
    };
    const classes = new Set<string>();
    const meta = { content: "#faf6ee" };
    const html = { dataset: {} as Record<string, string>, style: {} as Record<string, string>, classList: { add: (c: string) => classes.add(c) } };
    const sessionStorage = storage(session);
    const localStorage = storage(local);
    const context: Record<string, unknown> = {
        sessionStorage,
        localStorage,
        matchMedia: (query: string) => ({ matches: query.includes("dark") ? dark : query.includes("reduce") ? reduced : false }),
        document: { documentElement: html, querySelector: () => meta },
    };
    context.window = context;
    vm.createContext(context);
    const run = (script: string) => vm.runInContext(script, context);
    const record = () => context.__prepaint as { mode?: string; skipBoot?: boolean };
    return { run, record, html, classes, meta, session: sessionStorage.map, local: localStorage.map };
}

test("mode: a light system stays light, and the choice is recorded", () => {
    const p = page();
    p.run(MODE_SCRIPT);
    assert.equal(p.html.dataset.mode, undefined);
    assert.equal(p.meta.content, "#faf6ee");
    assert.equal(p.record().mode, "light");
});

test("mode: a dark system lands dark before first paint", () => {
    const p = page({ dark: true });
    p.run(MODE_SCRIPT);
    assert.equal(p.html.dataset.mode, "dark");
    assert.equal(p.html.style.colorScheme, "dark");
    assert.equal(p.meta.content, "#07090f");
    assert.equal(p.record().mode, "dark");
});

test("mode: this visit's choice beats the system, either way", () => {
    const light = page({ session: { mode: "light" }, dark: true });
    light.run(MODE_SCRIPT);
    assert.equal(light.html.dataset.mode, undefined);
    assert.equal(light.record().mode, "light");

    const dark = page({ session: { mode: "dark" } });
    dark.run(MODE_SCRIPT);
    assert.equal(dark.html.dataset.mode, "dark");
});

test("mode: a lasting choice in localStorage is deleted, so a new visit starts from the system", () => {
    const p = page({ local: { mode: "dark" } });
    p.run(MODE_SCRIPT);
    assert.equal(p.local.has("mode"), false);
    assert.equal(p.html.dataset.mode, undefined);
});

test("mode: blocked storage falls back to the system", () => {
    const p = page({ blocked: true, dark: true });
    p.run(MODE_SCRIPT);
    assert.equal(p.html.dataset.mode, "dark");
});

test("boot: a first visit plays and is marked played at once", () => {
    const p = page();
    p.run(BOOT_SKIP_SCRIPT);
    assert.equal(p.classes.has("skip-boot"), false);
    assert.equal(p.record().skipBoot, false);
    assert.equal(p.session.get("bootPlayed"), "true");
});

test("boot: any reload in the same tab skips it, even one before hydration", () => {
    const first = page();
    first.run(BOOT_SKIP_SCRIPT);
    const reload = page({ session: Object.fromEntries(first.session) });
    reload.run(BOOT_SKIP_SCRIPT);
    assert.equal(reload.classes.has("skip-boot"), true);
    assert.equal(reload.record().skipBoot, true);
});

test("boot: reduced motion skips it", () => {
    const p = page({ reduced: true });
    p.run(BOOT_SKIP_SCRIPT);
    assert.equal(p.classes.has("skip-boot"), true);
    assert.equal(p.record().skipBoot, true);
});

test("boot: blocked storage plays it rather than leave a blank page", () => {
    const p = page({ blocked: true });
    p.run(BOOT_SKIP_SCRIPT);
    assert.equal(p.classes.has("skip-boot"), false);
    assert.equal(p.record().skipBoot, false);
});
