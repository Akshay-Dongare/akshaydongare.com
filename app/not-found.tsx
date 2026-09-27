import Link from "next/link";

// Replaces Next's built-in 404, which renders unstyled inside the root layout and adds a second <title>.
// It takes no metadata export, so the layout's title is the only one; the canvas ends on --blend-void like sub-pages.

const DESTINATIONS = [
    { href: "/", label: "Home", note: "Start at the top" },
    { href: "/work", label: "Work", note: "langchain-litellm, Airbnb, ISO, Harvard University" },
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

                <h1 className="text-display-xl text-fg-90 mb-8">
                    This page doesn’t exist.
                </h1>

                <p className="text-body text-fg-65 max-w-[560px] mb-16">
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
