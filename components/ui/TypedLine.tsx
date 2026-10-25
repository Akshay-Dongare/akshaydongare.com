import React from "react";

// How the caret behaves around its line: "pass" waits at the start, types and leaves; "type" shows only while its
// line types, so segments that type in turn never show two carets; "rest" stays and blinks once its line is done.
export type Caret = "pass" | "type" | "rest";

// One line clipped open a character at a time while a block caret rides its edge. Geist Mono gives every glyph one
// advance, tracking included, so each of the `chars` steps is exactly one character. A line never wraps, so a long one
// is split into segments that type in turn and may wrap between each other. The CSS is .typed-* in globals.css.
export function TypedLine({ chars, startMs, durationMs, caret, className = "", textRef, children }: {
    chars: number; startMs: number; durationMs: number; caret: Caret; className?: string;
    textRef?: React.Ref<HTMLSpanElement>; children: React.ReactNode;
}) {
    const timing = { "--chars": chars, "--type-delay": `${startMs}ms`, "--type-ms": `${durationMs}ms` } as React.CSSProperties;
    return (
        <span className={`typed-line ${className}`} style={timing}>
            <span ref={textRef} className="typed-text">{children}</span>
            <span aria-hidden="true" className={`typed-caret typed-caret-${caret}`} />
        </span>
    );
}
