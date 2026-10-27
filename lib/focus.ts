// Next leaves focus where it was after a client navigation, so a footer link keeps focus in the persistent footer
// and the next Tab goes back into it. These move it to the new content without scrolling: the router, the hash
// landing and ScrollCue own the scroll.

let firstPage: object | null = null;
let clientNavigation = false;

// PageTransition calls this from a layout effect, so it has run before any page's passive effect asks. The first
// page's wrapper is the first load, and any other is a client navigation; an object rather than a flag, so Strict
// Mode's second effect run in development still reads as the first load.
export function notePageMount(page: object) {
    firstPage ??= page;
    clientNavigation = firstPage !== page;
}

// The first load moves no focus: the reader has not acted yet, and the skip link is the first stop.
export function afterClientNavigation() {
    return clientNavigation;
}

// A target that is not focusable gets tabindex -1 only until it blurs, or a later click on it would keep taking
// focus and send the next Tab back to it, as tabIndex on <main> once did.
export function focusWithoutScroll(target: HTMLElement | null) {
    if (!target) return;
    if (target.tabIndex < 0 && !target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
    target.focus({ preventScroll: true });
}
