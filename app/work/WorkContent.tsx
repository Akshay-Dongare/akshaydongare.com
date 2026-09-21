"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { PackageStats } from "@/lib/downloads";

const buildProjects = (stats: PackageStats) => [
    {
        title: "langchain-litellm",
        desc: `Creator and lead maintainer of LangChain's official LiteLLM integration. Started as my own repository; now developed and released inside the langchain-ai organization, with its own page in the LangChain docs and an entry in the Python API reference. One interface to 100+ providers, plus router-backed load balancing, embeddings and OCR loading. ${stats.long} downloads across ${stats.releases} releases, and around ${stats.monthlyLong} every month.`,
        tags: ["PYTHON", "PYPI", "CREATOR", "MAINTAINER"],
        link: "https://github.com/langchain-ai/langchain-litellm"
    },
    {
        title: "Airbnb · AI Platform",
        desc: "The team already used the package I maintain, which is how they found me. Their internal LLM gateway, used by roughly 28 services, could not safely serve two providers in one process, because configuration lived in process-wide globals. I moved it to per-model registries resolved per request, giving a structural concurrency guarantee rather than a lock, and put an expiry-aware cache behind the auth path. Thirteen changes across ten repos, zero consumer migrations, and a test suite that went from 17 to 144. Two calls in two months; the rest was async.",
        tags: ["PYTHON", "LLM GATEWAY", "CONCURRENCY", "CONTRACT"],
        link: "https://www.linkedin.com/in/akshay-dongare/"
    },
    {
        title: "Harvard · Kenya Blood Donation Assistant",
        desc: "Lead developer on a WhatsApp assistant that answers blood donation questions for users in Kenya, built under the Global Alliance for Medical Innovation at Harvard. Most people do not phrase a medical question the way a clinical document answers it, so the pipeline rewrites a query before it searches. I worked on that retrieval path, added guardrails for personal data and prompt injection, and ran a red-team pass covering injection, data exposure and medical accuracy before the system went to closed beta. Won Best Presentation at the Spring 2025 showcase.",
        tags: ["RAG", "GUARDRAILS", "WHATSAPP", "HEALTHCARE"],
        link: "https://www.linkedin.com/in/akshay-dongare/"
    },
    {
        title: "ISO · Companion",
        desc: "Applied AI engineer on Companion, the assistant the International Organization for Standardization builds for its own standards work. I designed the agentic graph patterns it runs on, which is what let it scale without maintenance cost scaling with it, and ran the comparative evaluation behind its web search layer so answers come from official ISO sources rather than the open web. Started the architecture documentation and refactored the legacy codebase while I was in there.",
        tags: ["LANGGRAPH", "AGENTS", "RETRIEVAL", "CONTRACT"],
        link: "https://www.linkedin.com/in/akshay-dongare/"
    },
    {
        title: "Satellite Vision",
        desc: "Vision Transformers benchmarked head-to-head against CNNs on EuroSAT and UC Merced land-use imagery. Pure PyTorch, built to show where self-attention earns its cost on small-image remote sensing and where it does not.",
        tags: ["PYTORCH", "VIT", "CNN", "REMOTE SENSING"],
        link: "https://github.com/Akshay-Dongare/satellite-vision"
    },
    {
        title: "Ollama Local LLM",
        desc: "Running language models locally with Ollama. Custom modelfiles wired into the Python SDK and LlamaIndex for inference that never leaves the machine.",
        tags: ["OLLAMA", "LLAMA-INDEX", "LOCAL LLM"],
        link: "https://github.com/Akshay-Dongare/Ollama-Local-LLM"
    },
    {
        title: "Tech Mahindra · TinyML",
        desc: "Pruning and INT8 quantization on YOLOv5 for deployment to resource-constrained edge devices. Twelve times smaller, ten times faster on CPU, with detection accuracy held on COCO.",
        tags: ["TINYML", "QUANTIZATION", "YOLOV5", "EDGE"],
        link: "https://github.com/Akshay-Dongare/Model_Compression"
    },
    {
        title: "CookBook",
        desc: "Full-stack recipe discovery platform. FastAPI and MongoDB, React and TypeScript, Groq inference for nutrition filtering. CI-tested and coverage-tracked.",
        tags: ["FASTAPI", "REACT", "MONGODB", "GROQ"],
        link: "https://github.com/AMAPAD/CookBook"
    },
    {
        title: "Lane Segmentation + Sign Detection",
        desc: "Real-time semantic segmentation for lane detection layered with traffic-sign recognition on one video stream. Faster R-CNN and ResNet50 on GTSRB; FCN on a custom-labelled lane dataset.",
        tags: ["PYTORCH", "FASTER R-CNN", "FCN", "GTSRB"],
        link: "https://github.com/Akshay-Dongare/Lane-Segmentation-along-with-Traffic-Sign-Detection"
    },
    {
        title: "The Professional Filter",
        desc: "Work-vs-personal email classifier trained on the Enron corpus, with an LLM-augmented layer for the messy long tail.",
        tags: ["PYTHON", "NLP", "LLM"],
        link: "https://github.com/Akshay-Dongare/The-Professional-Filter"
    },
    {
        title: "WolfLease",
        desc: "Django and Streamlit sublease marketplace for student housing, with a multi-criteria search and a linting and coverage CI matrix.",
        tags: ["DJANGO", "STREAMLIT", "CI"],
        link: "https://github.com/AMAPAD/WolfLease"
    }
];

export function WorkContent({ stats }: { stats: PackageStats }) {
    const ALL_PROJECTS = buildProjects(stats);
    return (
        <div
            className="masthead-glow w-full min-h-screen pt-32 pb-24"
            style={{ background: 'linear-gradient(to bottom, #0d1117 0%, #07090f 100%)' }}
            data-theme="dark"
        >
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">

                <motion.h1
                    className="text-display-xl text-white/90 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    Selected Work
                </motion.h1>

                <motion.p
                    className="text-body text-white/55 max-w-[600px] mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    I mostly work on LLM infrastructure. Older projects are further down.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                    {ALL_PROJECTS.map((proj, i) => (
                        <motion.div
                            key={proj.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.08 + (i * 0.03), ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            <Link
                                href={proj.link}
                                className="group block h-full border border-white/[0.08] rounded-lg p-8 md:p-10 cursor-none hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(107,159,212,0.07)] transition-all duration-[300ms] cubic-bezier(0.25,0.1,0.25,1) bg-[#141920]"
                            >
                                <div className="flex justify-between items-start gap-4 mb-6">
                                    <h2 className="text-display-m tracking-tight text-white/90">{proj.title}</h2>
                                    <span className="hidden md:inline shrink-0 whitespace-nowrap font-mono text-white/60 text-xl md:opacity-0 md:-translate-x-4 md:group-hover:translate-x-0 md:group-hover:opacity-100 transition-all duration-300">
                                        [ → ]
                                    </span>
                                </div>

                                <p className="text-body text-white/55 mb-10 leading-relaxed">
                                    {proj.desc}
                                </p>

                                <div className="flex flex-wrap gap-3 mt-auto">
                                    {proj.tags.map(tag => (
                                        <span key={tag} className="text-label text-white/50 bg-white/[0.05] px-3 py-1.5 rounded-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
