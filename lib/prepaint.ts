import type { Mode } from "@/lib/mode";

// What the pre-paint scripts below decided, kept where React cannot reach it. They also write it onto
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

// The two scripts app/layout.tsx inlines in <head>, so they run before first paint; here so tests can run them
// (tests/prepaint.test.ts). Both record their decision in window.__prepaint.

// This visit's choice wins, then the system setting, then light; dark lands before first paint, so no light flash.
// A lasting choice in localStorage is deleted, so every new visit starts from the system.
export const MODE_SCRIPT = `(function(){var m,p=window.__prepaint=window.__prepaint||{};try{localStorage.removeItem('mode')}catch(e){}try{m=sessionStorage.getItem('mode')}catch(e){}if(m!=='dark'&&m!=='light'){try{m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}}p.mode=m==='dark'?'dark':'light';if(m==='dark'){var d=document.documentElement;d.dataset.mode='dark';d.style.colorScheme='dark';var t=document.querySelector('meta[name="theme-color"]');if(t)t.content='#07090f'}})()`;

// Neither a repeat visitor nor someone with reduced motion ever sees a frame of the boot mask. A first visit is
// recorded as played the moment the boot shows, so a reload before hydration skips it like any other; BootSequence
// reads the record, not the class, which React can strip.
export const BOOT_SKIP_SCRIPT = `(function(){var p=window.__prepaint=window.__prepaint||{};p.skipBoot=false;try{if(sessionStorage.getItem('bootPlayed')||matchMedia('(prefers-reduced-motion: reduce)').matches){p.skipBoot=true;document.documentElement.classList.add('skip-boot')}else sessionStorage.setItem('bootPlayed','true')}catch(e){}})()`;
