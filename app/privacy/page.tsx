import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
    title: "Privacy",
    description: "What akshaydongare.com collects, which is almost nothing. No analytics, no tracking, no cookies.",
};

export default function Page() {
    return <PrivacyContent />;
}
