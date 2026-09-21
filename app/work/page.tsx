import type { Metadata } from "next";
import { getPackageStats } from "@/lib/downloads";
import { WorkContent } from "./WorkContent";

export const metadata: Metadata = {
    title: "Selected Work",
    description: "Work by Akshay Dongare: langchain-litellm, Airbnb's internal LLM gateway, and applied AI at ISO and Harvard.",
};

export default async function WorkPage() {
    const stats = await getPackageStats();
    return <WorkContent stats={stats} />;
}
