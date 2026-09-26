"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PYPI_URL, type PackageStats } from "@/lib/downloads";
import { ScrollCue } from "@/components/ui/ScrollCue";


export function AboutSection({ stats }: { stats: PackageStats }) {
    return (
        <section className="relative w-full pt-24 pb-32" style={{ background: 'var(--spine-about)', marginBottom: '-1px' }} data-theme="light">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 h-full flex flex-col md:flex-row gap-12 lg:gap-24">

                {/* LEFT COLUMN - 60% */}
                <div className="w-full md:w-[60%] flex flex-col justify-center">

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.35 }}
                        className="text-display-l text-on-paper mb-10 max-w-[720px]"
                    >
                        I maintain <span className="whitespace-nowrap">langchain-litellm</span>, LangChain’s official interface to 140+ model providers, downloaded <Link
                            href={PYPI_URL}
                            className="whitespace-nowrap hover:underline hover:underline-offset-[6px] hover:decoration-on-paper/40 transition-colors cursor-none"
                        >
                            {stats.long}
                        </Link> times and counting.
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className=""
                    >
                        <Link href="/about" className="group flex items-center gap-2 py-3 -my-3 cursor-none text-label text-on-paper">
                            <span className="opacity-80 group-hover:opacity-100 transition-opacity">MORE ABOUT ME</span>
                            <span aria-hidden="true" className="shrink-0 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">[ → ]</span>
                        </Link>
                    </motion.div>

                </div>

                {/* RIGHT COLUMN - 40% */}
                <motion.div
                    className="w-full md:w-[40%] flex justify-end items-end"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                >
                    {/* A fixed 4:5 frame, the source's own shape and the /about portrait's, on the cards' surface language:
                        the same corners and soft ink shadow, and no hover zoom, since the photo is not a link. */}
                    <div className="relative w-full aspect-[4/5] max-w-[480px] rounded-[20px] md:rounded-3xl overflow-hidden shadow-[var(--card-shadow)]">
                        <div className="w-full h-full relative">
                            {/* No priority: this sits below the fold, so the default lazy
                                load is correct. `fill` supplies absolute/inset-0/w-full/h-full
                                itself, so only the object-fit classes remain. */}
                            <Image
                                src="/Akshay_Headshot.jpg"
                                alt="Portrait of Akshay Dongare"
                                fill
                                sizes="(max-width: 768px) 100vw, 480px"
                                className="object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.18)] to-transparent pointer-events-none" />
                        </div>
                    </div>
                </motion.div>

            </div>
            <ScrollCue tone="paper" />
        </section>
    );
}
