"use client";

import React from "react";
import Link from "next/link";

interface FooterLinkProps {
    href: string;
    label: string;
}

function FooterLink({ href, label }: FooterLinkProps) {
    return (
        <Link href={href} className="group flex items-center gap-2 cursor-none text-label text-white/55 hover:text-white/90 transition-colors duration-200">
            <span>{label}</span>
            <span className="shrink-0 whitespace-nowrap text-white/50 group-hover:text-white/90 transition-colors duration-200">[<span className="inline-block mx-1 font-mono">→</span>]</span>
        </Link>
    );
}

export function Footer() {
    return (
        <footer
            className="w-full pt-24 pb-12 px-6 md:px-12 lg:px-20"
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #07090f 100%)' }}
            data-theme="dark"
        >
            {/* Gradient top fade — replaces sharp border-t */}
            <div className="w-full h-px mb-24" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />

            <div className="max-w-[1400px] mx-auto">

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
                        <p className="text-white/70">THE LAYER BETWEEN</p>
                        <p className="text-white/70">APP AND MODEL</p>
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

                {/* LOWER AREA - Logo Wordmark */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-t border-white/[0.06] pt-8">

                    <div className="flex items-end mb-8 md:mb-0">
                        <h2 className="text-display-xl font-medium tracking-tight text-white/80 leading-none">
                            Akshay <br /> Dongare
                        </h2>
                    </div>

                    <p className="text-label text-white/50">
                        © {new Date().getFullYear()} AKSHAY DONGARE
                    </p>

                </div>
            </div>
        </footer>
    );
}
