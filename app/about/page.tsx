import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { getPackageStats } from "@/lib/downloads";
import { AboutContent } from "./AboutContent";

// Server shell so the package figures can be fetched; the page itself stays a
// client component because of the scroll and reveal animations.
export const metadata: Metadata = pageMetadata({
    title: "About",
    description: "Akshay Dongare is an AI platform engineer in Raleigh, North Carolina, and the creator and lead maintainer of langchain-litellm, LangChain's official LiteLLM integration.",
    path: "/about",
});

export default async function AboutPage() {
    const stats = await getPackageStats();
    return <AboutContent stats={stats} />;
}
