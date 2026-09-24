"use client";

import React from "react";
import Link from "next/link";

interface FooterLinkProps {
    href: string;
    label: string;
}

function FooterLink({ href, label }: FooterLinkProps) {
    return (
        <Link href={href} className="group flex items-center gap-2 cursor-none text-label text-lbl-55 hover:text-lbl-90 light:hover:text-fg-100 transition-colors duration-200">
            <span>{label}</span>
            <span className="shrink-0 whitespace-nowrap text-fg-50 group-hover:text-fg-90 transition-colors duration-200">[<span className="inline-block mx-1 font-mono">→</span>]</span>
        </Link>
    );
}

export function Footer() {
    return (
        <footer
            className="w-full pt-24 pb-12 px-6 md:px-12 lg:px-20"
            // Opens on --blend-void because every page above it ends there, so the joint is
            // a continuation rather than a 6-level step. The lift eases in below the seam
            // instead of at it, and it returns to void at the very bottom so iOS
            // rubber-band overscroll shows the same colour as body's background-color.
            style={{ background: 'var(--spine-footer)' }}
            data-theme="dark"
        >
            {/* Link lists stitched into a snippet read as noise; Google honours this on div, not footer. */}
            <div data-nosnippet className="max-w-[1400px] mx-auto">

                {/* UPPER AREA - Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">

                    {/* Column 1: Site Map */}
                    <div className="flex flex-col gap-4">
                        <FooterLink href="/" label="HOME" />
                        <FooterLink href="/work" label="WORK" />
                        <FooterLink href="/about" label="ABOUT" />
                        <FooterLink href="/contact" label="CONTACT" />
                    </div>

                    {/* Column 2: Tagline */}
                    <div className="flex flex-col text-label leading-relaxed lg:items-center">
                        <p className="text-fg-70">THE LAYER BETWEEN</p>
                        <p className="text-fg-70">APP AND MODEL</p>
                    </div>

                    {/* Column 3: Legal/Misc */}
                    <div className="flex flex-col gap-4">
                        <FooterLink href="/privacy" label="PRIVACY" />
                        <FooterLink href="/colophon" label="COLOPHON" />
                    </div>

                    {/* Column 4: Socials */}
                    <div className="flex flex-col gap-4">
                        <FooterLink href="https://github.com/Akshay-Dongare" label="GITHUB" />
                        <FooterLink href="https://www.linkedin.com/in/akshay-dongare/" label="LINKEDIN" />
                    </div>

                </div>

                {/* LOWER AREA - Logo Wordmark.
                    No rule above it on purpose. Two 1px hairlines used to sit in this
                    footer and both kept getting noticed, which is the one thing structural
                    furniture must never do. A 1px line is the highest-frequency mark you
                    can draw, so dimming it makes a fainter line rather than a softer one.
                    The gaps already separate these zones unambiguously, so the rules were
                    restating what the layout had said. This gap doubles to 64px to carry
                    the separation that the rule used to. */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between pt-16">

                    <div className="flex items-end mb-8 md:mb-0">
                        <h2 className="text-display-xl font-medium tracking-tight text-fg-80 leading-none">
                            Akshay <br /> Dongare
                        </h2>
                    </div>

                    <p className="text-label text-lbl-50">
                        © {new Date().getFullYear()} AKSHAY DONGARE
                    </p>

                </div>
            </div>
        </footer>
    );
}
