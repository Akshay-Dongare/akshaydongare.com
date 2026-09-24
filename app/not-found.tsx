import Link from "next/link";

// Before this file existed, an unmatched route fell through to Next's built-in error
// page, which Next renders INSIDE the root layout. Production served an unstyled white
// block sandwiched between the dark navbar and the dark footer, and two <title>
// elements: Next's own "404: This page could not be found." plus the layout's.
//
// not-found.tsx does not support a metadata export, so the title still comes from the
// root layout. That is fine: the point of this file is that there is now exactly one.
//
// The canvas matches the sub-pages exactly, including ending on --blend-void so the
// footer joint stays seamless here too.

const DESTINATIONS = [
    { href: "/", label: "Home", note: "Start at the top" },
    { href: "/work", label: "Work", note: "langchain-litellm, Airbnb, ISO, Harvard" },
    { href: "/about", label: "About", note: "What I work on, and what I am looking for" },
    { href: "/contact", label: "Contact", note: "Email, GitHub, LinkedIn" },
];

export default function NotFound() {
    return (
        <div
            className="masthead-glow w-full min-h-screen pt-32 pb-24"
            style={{ background: 'var(--spine-page)' }}
            data-theme="dark"
        >
            <div className="max-w-[1000px] mx-auto px-6 md:px-12 lg:px-20">

                <p className="text-label text-lbl-55 mb-6">[ 404 ]</p>

                <h1 className="text-display-xl text-fg-90 mb-8 leading-[1.05]">
                    This page doesn&apos;t exist.
                </h1>

                <p className="text-body text-fg-65 leading-relaxed max-w-[560px] mb-16">
                    Either the address is wrong, or it points at something that used to be here.
                    Nothing on this site is behind a login, so it is usually the first one.
                </p>

                <nav aria-label="Go somewhere that exists" className="border-t border-line-8">
                    {DESTINATIONS.map((d) => (
                        <Link
                            key={d.href}
                            href={d.href}
                            className="group flex items-baseline justify-between gap-6 py-6 border-b border-line-8 hover:border-line-20 transition-colors cursor-none"
                        >
                            <span className="text-display-m text-fg-80 group-hover:text-fg-100 transition-colors duration-300">
                                {d.label}
                            </span>
                            <span className="hidden md:block shrink-0 whitespace-nowrap text-label text-lbl-50 group-hover:text-lbl-80 light:group-hover:text-fg-100 transition-colors duration-300">
                                {d.note}
                            </span>
                        </Link>
                    ))}
                </nav>

            </div>
        </div>
    );
}
