import type { Mode } from "@/lib/mode";

// What the pre-paint scripts in app/layout.tsx decided, kept where React cannot reach it. They also write it onto
// <html>, for CSS before hydration, but when anything edits the server HTML before hydrating (an extension, Chrome
// translate, a password manager), React client-renders the root and strips every attribute off <html> as it takes it
// over. This copy is what puts them back.
export type Prepaint = { mode?: Mode; skipBoot?: boolean };

declare global {
    interface Window {
        __prepaint?: Prepaint;
    }
}

// Undefined when the scripts never ran, for example under a CSP that blocks inline scripts.
export function readPrepaint(): Prepaint | undefined {
    return window.__prepaint;
}
