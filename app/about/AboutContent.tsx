"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PEPY_URL, type PackageStats } from "@/lib/downloads";

export function AboutContent({ stats }: { stats: PackageStats }) {
    return (
        <div
            className="w-full min-h-screen pt-32 pb-24"
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #07090f 100%)' }}
            data-theme="dark"
        >
            <div className="max-w-[660px] mx-auto px-6 md:px-0">

                <motion.h1
                    className="text-display-xl text-white/90 mb-16 leading-[1.05]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    I work on the unglamorous half of AI
                </motion.h1>

                <motion.div
                    className="relative mb-16 w-full max-w-[320px] aspect-[4/5] rounded-xl overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    {/* priority: this is the page's LCP element, so it must not lazy-load.
                        sizes is the box's real cap (max-w-[320px]) rather than a viewport
                        fraction, so the srcset tops out at 320px x DPR instead of the
                        source's 1197px. */}
                    <Image
                        src="/Akshay_Headshot.jpg"
                        alt="Portrait of Akshay Dongare"
                        fill
                        priority
                        sizes="320px"
                        className="object-cover object-top"
                    />
                </motion.div>

                <motion.div
                    className="font-sans leading-relaxed text-body space-y-8 text-white/70"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    <p>
                        I’m Akshay Dongare, an AI platform engineer in Raleigh, North Carolina, finishing a Master’s in Computer Science at NC State. I work on LLM infrastructure: the gateways, provider routing, auth and concurrency that sit between an application and a model. The degree finishes in December 2026, and from 11 January 2027 this is the whole job: AI platform, LLM infrastructure, or the backend work underneath both, wherever in the country the team sits. I’m authorized to work in the US on F-1 OPT through January 2030.
                    </p>
                    <p>
                        I created{" "}
                        <Link
                            href="https://github.com/langchain-ai/langchain-litellm"
                            className="text-white/85 underline underline-offset-4 decoration-white/20 hover:text-white/55 transition-colors cursor-none"
                        >
                            langchain-litellm
                        </Link>
                        {" "}and still lead its maintenance. It began as my own repository and now lives inside the langchain-ai organization as LangChain’s official LiteLLM integration, with its own page in the LangChain docs and an entry in the Python API reference. One interface to 100+ model providers, plus router-backed load balancing, embeddings and OCR loading. <Link
                            href={PEPY_URL}
                            className="text-white/85 hover:underline hover:underline-offset-4 hover:decoration-white/40 hover:text-white/70 transition-colors cursor-none"
                        >
                            {stats.long} downloads
                        </Link>
                        {" "}across {stats.releases} releases, and around {stats.monthlyLong} every month. I also contribute upstream to{" "}
                        <Link
                            href="https://github.com/langchain-ai/langchain/pulls?q=is%3Apr+author%3AAkshay-Dongare+"
                            className="text-white/85 underline underline-offset-4 decoration-white/20 hover:text-white/55 transition-colors cursor-none"
                        >
                            LangChain
                        </Link>
                        ,{" "}
                        <Link
                            href="https://github.com/langchain-ai/langchain-community/pulls?q=is%3Apr+author%3AAkshay-Dongare+"
                            className="text-white/85 underline underline-offset-4 decoration-white/20 hover:text-white/55 transition-colors cursor-none"
                        >
                            langchain-community
                        </Link>
                        {" "}and the{" "}
                        <Link
                            href="https://github.com/langchain-ai/docs/pulls?q=is%3Apr+author%3AAkshay-Dongare+"
                            className="text-white/85 underline underline-offset-4 decoration-white/20 hover:text-white/55 transition-colors cursor-none"
                        >
                            LangChain documentation
                        </Link>
                        .
                    </p>
                    <p>
                        Most recently I spent two months contracting on Airbnb’s AI platform. The team already used the package I maintain, which is how they found me. The work was their internal LLM gateway, the library roughly 28 services use to reach a model. It could not safely serve two providers in one process, because configuration lived in process-wide globals: a second setup silently overwrote the first, and concurrent calls were dispatched to each other’s endpoints. The documented workaround was to re-initialize before every single call.
                    </p>
                    <p>
                        I moved configuration out of shared globals into per-model registries resolved per request, which makes the concurrency guarantee structural rather than something a lock has to defend. Thirteen changes across ten repos, and because the public API never moved, not one consuming team had to change a line. The test suite grew from 17 tests to 144 alongside the work, and the documented code samples became the test bodies, so published text and executed text are now the same bytes and cannot drift apart. I also closed a set of credential-handling paths that were not in the original scope. The whole engagement took two calls; everything else was async.
                    </p>
                    <p>
                        Before that I was lead developer on a WhatsApp assistant answering blood donation questions for users in Kenya, built under the Global Alliance for Medical Innovation at Harvard. Almost nobody phrases a medical question the way a clinical document answers it, so the pipeline rewrites a query before it searches. I worked on that retrieval path, added guardrails for personal data and prompt injection, and ran a red-team pass covering injection, data exposure and medical accuracy before the system went to closed beta. It won Best Presentation at the Spring 2025 showcase.
                    </p>
                    <p>
                        The summer before that I was applied AI engineer on Companion, the assistant the International Organization for Standardization builds for its own standards work. I designed the agentic graph patterns underneath it, which is what let the system grow without its maintenance cost growing at the same rate, and ran the comparative evaluation behind its web search layer so that answers come from official ISO sources rather than the open web. I also started the architecture documentation and refactored the legacy codebase, which is the sort of thing nobody assigns you. All of it remote, from India and North Carolina.
                    </p>
                    <p>
                        Earlier work includes vision transformers for satellite imagery, real-time semantic segmentation for autonomous driving, signature-forgery detection, and squeezing object detectors small enough to run on edge hardware.
                    </p>
                    <p>
                        I build in the open. Infrastructure this many teams depend on should be inspectable, and the parts that fail in production are rarely the parts anyone demos.
                    </p>

                    <h3 className="text-display-m font-medium mb-6 mt-16 text-white/90">Selected timeline</h3>

                    <div className="flex flex-col border-b border-white/[0.08]">
                        {[
                            { year: "2026", text: "AI platform engineering at Airbnb (contract). LLM gateway concurrency, auth and release safety" },
                            { year: "Since 2025", text: "Creator and lead maintainer, langchain-litellm, now developed inside the langchain-ai organization" },
                            { year: "2025", text: "Applied AI engineer on Companion at the International Organization for Standardization, Geneva" },
                            { year: "2025", text: "Lead developer, Kenya Blood Donation Assistant at Harvard GAMI. Best Presentation, Spring 2025 showcase" },
                            { year: "2025", text: "Vision Transformer vs CNN benchmarks on EuroSAT and UC Merced satellite imagery" },
                            { year: "2024", text: "Local LLM infrastructure: Ollama and Code Llama coding-assistant pipeline" },
                            { year: "2023", text: "Real-time lane segmentation and traffic-sign detection (Faster R-CNN, FCN, ResNet50)" },
                            { year: "2022", text: "Signature-forgery detection with CycleGAN, YOLOv5 and VGG16 transfer learning" },
                            { year: "2022", text: "TinyML internship: pruning and INT8 quantization for edge inference" },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col md:flex-row border-t border-white/[0.08] py-6 items-start md:items-baseline">
                                <div className="w-auto md:w-24 mb-1 md:mb-0 font-mono text-[0.8rem] text-white/50">{item.year}</div>
                                <div className="flex-1 text-[1rem] text-white/70">{item.text}</div>
                            </div>
                        ))}
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
