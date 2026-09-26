"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { PackageStats } from "@/lib/downloads";
import { GAMI_AWARD_POST, GAMI_SITE, HARVARD_SITE, LINKEDIN_EXPERIENCE, LITELLM_REPO } from "@/lib/links";
import { OrgLogo, type Org } from "@/components/ui/OrgLogo";

// affiliation names the organisation for cards whose title does not, so it is not left to the logo alone.
type Project = { title: string; desc: React.ReactNode; tags: string[]; link: string; logo?: Org; affiliation?: string };

// Links inside a description sit above the card's stretched title link, so both stay clickable.
const INLINE = "relative z-10 text-fg-85 underline underline-offset-4 decoration-line-20 hover:text-fg-55 transition-colors cursor-none";

const buildProjects = (stats: PackageStats): Project[] => [
    {
        title: "langchain-litellm",
        logo: "langchain",
        desc: `Creator and lead maintainer of LangChain's official LiteLLM integration. Started as my own repository; now developed and released inside the langchain-ai organization, with its own page in the LangChain docs and an entry in the Python API reference. One interface to 140+ providers, plus router-backed load balancing, embeddings and OCR loading. ${stats.long} downloads across ${stats.releases} releases, and around ${stats.monthlyLong} every month.`,
        tags: ["PYTHON", "PYPI", "CREATOR", "MAINTAINER"],
        link: LITELLM_REPO
    },
    {
        title: "Airbnb · AI Platform",
        logo: "airbnb",
        desc: "The team already used the package I maintain, which is how they found me. Their internal LLM gateway, used by roughly 28 services, could not safely serve two providers in one process, because configuration lived in process-wide globals. I moved it to per-model registries resolved per request, giving a structural concurrency guarantee rather than a lock, and put an expiry-aware cache behind the auth path. Thirteen changes across ten repos, zero consumer migrations, and a test suite that went from 17 to 144. Two calls in two months; the rest was async.",
        tags: ["PYTHON", "LLM GATEWAY", "CONCURRENCY", "CONTRACT"],
        link: LINKEDIN_EXPERIENCE
    },
    {
        title: "Harvard University · Kenya Blood Donation Assistant",
        logo: "harvard",
        desc: (
            <>
                Lead developer on a WhatsApp assistant that answers blood donation questions for users in Kenya, built under
                the <Link href={GAMI_SITE} className={INLINE}>Global Alliance for Medical Innovation</Link> at <Link href={HARVARD_SITE} className={INLINE}>Harvard University</Link>.
                Most people do not phrase a medical question the way a clinical document answers it, so the pipeline rewrites a query before it searches. I worked on that retrieval path, added guardrails for personal data and prompt injection, and ran a red-team pass covering injection, data exposure and medical accuracy before the system went to closed beta.
                Won <Link href={GAMI_AWARD_POST} className={INLINE}>Best Presentation</Link> at the Spring 2025 showcase.
            </>
        ),
        tags: ["RAG", "GUARDRAILS", "WHATSAPP", "HEALTHCARE"],
        link: LINKEDIN_EXPERIENCE
    },
    {
        title: "ISO · Companion",
        logo: "iso",
        desc: "Applied AI engineer on Companion, the assistant the International Organization for Standardization builds for its own standards work. I designed the agentic graph patterns it runs on, which is what let it scale without maintenance cost scaling with it, and ran the comparative evaluation behind its web search layer so answers come from official ISO sources rather than the open web. Started the architecture documentation and refactored the legacy codebase while I was in there.",
        tags: ["LANGGRAPH", "AGENTS", "RETRIEVAL", "CONTRACT"],
        link: LINKEDIN_EXPERIENCE
    },
    {
        title: "Satellite Vision",
        logo: "ncstate",
        affiliation: "NC State University",
        desc: "Vision Transformers benchmarked head-to-head against CNNs on EuroSAT and UC Merced land-use imagery. Pure PyTorch, built to show where self-attention earns its cost on small-image remote sensing and where it does not.",
        tags: ["PYTORCH", "VIT", "CNN", "REMOTE SENSING"],
        link: "https://github.com/Akshay-Dongare/satellite-vision"
    },
    {
        title: "Ollama Local LLM",
        logo: "self",
        desc: "Running language models locally with Ollama. Custom modelfiles wired into the Python SDK and LlamaIndex for inference that never leaves the machine.",
        tags: ["OLLAMA", "LLAMA-INDEX", "LOCAL LLM"],
        link: "https://github.com/Akshay-Dongare/Ollama-Local-LLM"
    },
    {
        title: "Tech Mahindra · TinyML",
        logo: "techmahindra",
        desc: "Pruning and INT8 quantization on YOLOv5 for deployment to resource-constrained edge devices. Twelve times smaller, ten times faster on CPU, with detection accuracy held on COCO.",
        tags: ["TINYML", "QUANTIZATION", "YOLOV5", "EDGE"],
        link: "https://github.com/Akshay-Dongare/Model_Compression"
    },
    {
        title: "CookBook",
        logo: "ncstate",
        affiliation: "NC State University",
        desc: "Full-stack recipe discovery platform. FastAPI and MongoDB, React and TypeScript, Groq inference for nutrition filtering. CI-tested and coverage-tracked.",
        tags: ["FASTAPI", "REACT", "MONGODB", "GROQ"],
        link: "https://github.com/AMAPAD/CookBook"
    },
    {
        title: "Lane Segmentation + Sign Detection",
        logo: "self",
        desc: "Real-time semantic segmentation for lane detection layered with traffic-sign recognition on one video stream. Faster R-CNN and ResNet50 on GTSRB; FCN on a custom-labelled lane dataset.",
        tags: ["PYTORCH", "FASTER R-CNN", "FCN", "GTSRB"],
        link: "https://github.com/Akshay-Dongare/Lane-Segmentation-along-with-Traffic-Sign-Detection"
    },
    {
        title: "The Professional Filter",
        logo: "ncstate",
        affiliation: "NC State University",
        desc: "Work-vs-personal email classifier trained on the Enron corpus, with an LLM-augmented layer for the messy long tail.",
        tags: ["PYTHON", "NLP", "LLM"],
        link: "https://github.com/Akshay-Dongare/The-Professional-Filter"
    },
    {
        title: "WolfLease",
        logo: "ncstate",
        affiliation: "NC State University",
        desc: "Django and Streamlit sublease marketplace for student housing, with a multi-criteria search and a linting and coverage CI matrix.",
        tags: ["DJANGO", "STREAMLIT", "CI"],
        link: "https://github.com/AMAPAD/WolfLease"
    }
];

// Three of these cards point at the same LinkedIn profile, because the work is closed
// source and there is nothing public to link. Naming the destination up front is what
// stops that reading as broken: a reader who clicks Airbnb, comes back and clicks Harvard
// used to land on the identical page twice with no warning either time.
function destinationLabel(url: string) {
    if (url.includes("github.com")) return "GITHUB";
    if (url.includes("linkedin.com")) return "LINKEDIN";
    return "OPEN";
}

export function WorkContent({ stats }: { stats: PackageStats }) {
    const ALL_PROJECTS = buildProjects(stats);
    return (
        <div
            className="masthead-glow w-full min-h-screen pt-32 pb-24"
            style={{ background: 'var(--spine-page)' }}
            data-theme="dark"
        >
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">

                <motion.h1
                    className="text-display-xl text-fg-90 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    Work
                </motion.h1>

                <motion.p
                    className="text-body text-fg-55 max-w-[600px] mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    I mostly work on LLM infrastructure. Older projects are further down.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {ALL_PROJECTS.map((proj, i) => (
                        <motion.div
                            key={proj.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.08 + (i * 0.03), ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {/* The title link stretches over the card through its ::after, so the card stays one target while
                                the description can hold links of its own; an <a> inside an <a> is invalid HTML. */}
                            <div className="group relative h-full border border-[var(--work-card-edge)] rounded-[20px] md:rounded-3xl p-6 md:p-8 cursor-none bg-[var(--work-card)] shadow-[var(--work-card-shadow)] hover:bg-[var(--work-card-hover-bg)] hover:shadow-[var(--work-card-hover)] transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0,0,0.5,1)]">
                                {/* A row of its own, since Tech Mahindra's 4:1 lockup broke titles inline. 40px holds the
                                    tallest mark, Harvard's shield, and the destination sits at its far end. */}
                                <div className="flex h-10 items-center justify-between gap-4 mb-5">
                                    {proj.logo && <OrgLogo org={proj.logo} alt={proj.affiliation} />}
                                    <span aria-hidden="true" className="hidden lg:inline-flex shrink-0 whitespace-nowrap items-baseline gap-2 font-mono text-fg-60 lg:opacity-0 lg:-translate-x-4 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 transition-all duration-300">
                                        <span className="text-label text-fg-60">{destinationLabel(proj.link)}</span>
                                        <span className="text-xl">[ → ]</span>
                                    </span>
                                </div>
                                {/* The separator binds to the word before it, so a wrapped title never opens a line with it. */}
                                <h2 className="text-display-m tracking-tight text-fg-90 mb-6">
                                    <Link
                                        href={proj.link}
                                        aria-label={`${proj.title}${proj.affiliation ? `, ${proj.affiliation}` : ""}, on ${destinationLabel(proj.link).toLowerCase()}`}
                                        className="cursor-none outline-none after:absolute after:inset-0 after:rounded-[20px] md:after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-current"
                                    >
                                        {proj.title.replaceAll(" · ", "\u00a0· ")}
                                    </Link>
                                </h2>

                                <p className="text-body text-fg-55 mb-10 leading-relaxed">
                                    {proj.desc}
                                </p>

                                <div className="flex flex-wrap gap-3 mt-auto">
                                    {proj.tags.map(tag => (
                                        <span key={tag} className="text-label text-fg-60 bg-line-5 px-3 py-1.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
