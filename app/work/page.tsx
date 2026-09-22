import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { getPackageStats } from "@/lib/downloads";
import { WorkContent } from "./WorkContent";

export const metadata: Metadata = pageMetadata({
    title: "Work",
    description: "Work by Akshay Dongare: langchain-litellm, Airbnb's internal LLM gateway, and applied AI at ISO and Harvard.",
    path: "/work",
});

export default async function WorkPage() {
    const stats = await getPackageStats();
    return <WorkContent stats={stats} />;
}
