"use client";

import Link from "next/link";
import { useEffect } from "react";

// There was no error boundary anywhere, so the nearest handler for a throw in any client
// component was Next's default global error page, which renders its OWN document: navbar,
// footer, styling and all context gone, replaced by an unstyled message. The likeliest
// sources are the two WebGL fields, which run continuously on the homepage.
//
// This keeps the layout and the canvas, offers a retry that re-renders the subtree without
// a full reload, and otherwise reads like the 404, including ending on --blend-void so the
// footer joint stays seamless.

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // No analytics on this site, so the console is the only place this can go, and it
        // is what someone reporting the problem would be asked to paste.
        console.error("[akshaydongare.com] unhandled error", error);
    }, [error]);

    return (
        <div
            className="masthead-glow w-full min-h-screen pt-32 pb-24"
            style={{ background: "linear-gradient(to bottom, var(--blend-deep) 0%, var(--blend-void) 100%)" }}
            data-theme="dark"
        >
            <div className="max-w-[1000px] mx-auto px-6 md:px-12 lg:px-20">

                <p className="text-label text-white/55 mb-6">[ ERROR ]</p>

                <h1 className="text-display-xl text-white/90 mb-8 leading-[1.05]">
                    Something broke on my end.
                </h1>

                <p className="text-body text-white/65 leading-relaxed max-w-[560px] mb-10">
                    Not your browser and not the address. Trying again usually works, because
                    most of what can fail here is the WebGL that draws the background.
                </p>

                {error.digest ? (
                    <p className="text-label text-white/50 mb-10">
                        Reference: {error.digest}
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-8 mb-16">
                    <button
                        type="button"
                        onClick={reset}
                        className="text-label text-white/80 hover:text-white transition-colors cursor-none inline-flex items-center gap-2"
                    >
                        Try again
                        <span className="shrink-0 whitespace-nowrap text-white/55">[ &rarr; ]</span>
                    </button>
                </div>

                <nav aria-label="Go somewhere that works" className="border-t border-white/[0.08]">
                    {[
                        { href: "/", label: "Home" },
                        { href: "/work", label: "Work" },
                        { href: "/contact", label: "Contact" },
                    ].map((d) => (
                        <Link
                            key={d.href}
                            href={d.href}
                            className="group flex items-baseline justify-between gap-6 py-6 border-b border-white/[0.08] hover:border-white/20 transition-colors cursor-none"
                        >
                            <span className="text-display-m text-white/80 group-hover:text-white transition-colors duration-300">
                                {d.label}
                            </span>
                            <span className="hidden md:block shrink-0 whitespace-nowrap text-label text-white/50 group-hover:text-white/80 transition-colors duration-300">
                                [ &rarr; ]
                            </span>
                        </Link>
                    ))}
                </nav>

            </div>
        </div>
    );
}
