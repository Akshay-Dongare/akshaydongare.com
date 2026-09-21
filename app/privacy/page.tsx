import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = pageMetadata({
    title: "Privacy",
    description: "What akshaydongare.com collects, which is almost nothing. No analytics, no tracking, no cookies.",
    path: "/privacy",
});

export default function Page() {
    return <PrivacyContent />;
}
