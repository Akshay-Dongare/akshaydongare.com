"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PEPY_URL, type PackageStats } from "@/lib/downloads";


export function AboutSection({ stats }: { stats: PackageStats }) {
    return (
        <section className="relative w-full pt-24 pb-32" style={{ background: 'linear-gradient(to bottom, #c8d4e0 0%, #f2efe9 100%)', marginBottom: '-1px' }} data-theme="light">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 h-full flex flex-col md:flex-row gap-12 lg:gap-24">

                {/* LEFT COLUMN - 60% */}
                <div className="w-full md:w-[60%] flex flex-col justify-center">

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.35 }}
                        className="text-display-l text-[var(--color-charcoal)] mb-10 max-w-[720px] leading-tight"
                    >
                        I maintain langchain-litellm, LangChain&apos;s official interface to 100+ model providers, downloaded{" "}
                        <Link
                            href={PEPY_URL}
                            className="hover:underline hover:underline-offset-[6px] hover:decoration-[var(--color-charcoal)]/40 transition-colors cursor-none"
                        >
                            {stats.long} times
                        </Link>
                        {" "}and counting.
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className=""
                    >
                        <Link href="/about" className="group flex items-center gap-2 cursor-none text-label text-[var(--color-charcoal)]">
                            <span className="opacity-80 group-hover:opacity-100 transition-opacity">MORE ABOUT ME</span>
                            <span className="shrink-0 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">[ → ]</span>
                        </Link>
                    </motion.div>

                </div>

                {/* RIGHT COLUMN - 40% */}
                <motion.div
                    className="w-full md:w-[40%] flex justify-end items-end h-[60vh] md:h-auto min-h-[500px]"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                >
                    {/* Card container */}
                    <div className="w-full h-full max-w-[480px] rounded-xl overflow-hidden group shadow-lg">
                        <div className="w-full h-full relative transition-transform duration-[600ms] cubic-bezier(0.25,0.1,0.25,1) group-hover:scale-[1.02]">
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
        </section>
    );
}
