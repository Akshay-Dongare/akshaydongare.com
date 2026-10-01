import type { MouseEvent } from "react";

// A page cannot move the pointer, so a homepage Work card hands /work the spot it was clicked and /work moves the
// page instead. Module state, not storage: it lives exactly as long as the client navigation that carries it.
type CardHandoff = { id: string; y: number; clientY: number };

let pending: CardHandoff | null = null;

export function handOffCard(e: MouseEvent<HTMLElement>, id: string) {
    pending = null;
    // Plain mouse clicks only: a key press has no pointer, a modified click opens elsewhere, touch keeps the anchor jump.
    if (e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const card = e.currentTarget.closest("article");
    if (!card) return;
    const r = card.getBoundingClientRect();
    pending = { id, y: (e.clientY - r.top) / r.height, clientY: e.clientY };
}

// Runs after Next's hash scroll, which happens in the layout phase, and replaces it with one that puts the same
// relative height of the matching card under the pointer. Both grids share one geometry, so the column lines up too.
export function landCardUnderPointer() {
    const h = pending;
    pending = null;
    if (!h || location.hash !== `#${h.id}`) return;
    const card = document.getElementById(h.id);
    if (!card) return;
    // Layout offsets, not getBoundingClientRect: the page is still sliding in, and the scroll must match where it rests.
    let top = 0;
    for (let n: HTMLElement | null = card; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
    window.scrollTo({ top: top + h.y * card.offsetHeight - h.clientY, behavior: "instant" });
}
