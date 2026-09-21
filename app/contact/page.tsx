import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ContactContent } from "./ContactContent";

export const metadata: Metadata = pageMetadata({
    title: "Contact",
    description: "Contact Akshay Dongare, AI platform engineer in Raleigh, North Carolina. Available from 11 January 2027 for AI platform, LLM infrastructure or backend engineering work anywhere in the US.",
    path: "/contact",
});

export default function Page() {
    return <ContactContent />;
}
