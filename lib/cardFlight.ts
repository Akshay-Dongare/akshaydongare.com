import { useSyncExternalStore, type MouseEvent } from "react";

// A homepage Work card flies to its place on /work through a view transition: the clicked card and its /work twin
// share one view-transition-name, so the browser carries the one into the other while the rest of the page
// cross-fades. The CSS is under card-flight in globals.css.
export const FLIGHT_NAME = "card-flight";

// Bounds the wait for /work, so a slow navigation lands without the flight rather than holding the screen.
const ARRIVAL_TIMEOUT_MS = 1500;

type Flight = { id: string };

let flight: Flight | null = null;
let arrive: (() => void) | null = null;
const listeners = new Set<() => void>();

function setFlight(next: Flight | null) {
    flight = next;
    listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
}

// The card in flight, or null; WorkContent reads it to name its twin and hold it at rest. Nothing waits on animation
// frames, which the browser holds while the transition waits for the new page: app/template.tsx remounts the page
// wrapper, so the old page leaves at once, and arrival is signalled from a React effect.
export function useCardFlight(): Flight | null {
    return useSyncExternalStore(subscribe, () => flight, () => null);
}

// Starts the flight from a homepage card's link, or leaves the click to the link: modified clicks open elsewhere,
// and reduced motion and browsers without view transitions keep the plain navigation.
export function flyCard(e: MouseEvent<HTMLAnchorElement>, id: string, navigate: () => void) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!("startViewTransition" in document) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = e.currentTarget.closest("article");
    if (!card) return;
    e.preventDefault();
    const root = document.documentElement;
    // Named for the old snapshot only; the homepage leaves the DOM inside the update anyway.
    card.style.viewTransitionName = FLIGHT_NAME;
    root.classList.add("card-flight");
    const transition = document.startViewTransition(() => new Promise<void>((resolve) => {
        card.style.viewTransitionName = "";
        const timer = setTimeout(resolve, ARRIVAL_TIMEOUT_MS);
        arrive = () => { clearTimeout(timer); resolve(); };
        setFlight({ id });
        navigate();
    }));
    transition.finished.finally(() => {
        arrive = null;
        setFlight(null);
        root.classList.remove("card-flight");
    });
}

// /work calls this once its card is mounted and scrolled into place; the browser then takes the new snapshot.
export function cardArrived(id: string | undefined) {
    if (!flight || flight.id !== id) return;
    const done = arrive;
    arrive = null;
    done?.();
}
