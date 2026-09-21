import type { Metadata } from "next";
import { ContactContent } from "./ContactContent";

export const metadata: Metadata = {
    title: "Contact",
    description: "Contact Akshay Dongare, AI platform engineer in Raleigh, North Carolina. Available from 11 January 2027 for AI platform, LLM infrastructure or backend engineering work anywhere in the US.",
};

export default function Page() {
    return <ContactContent />;
}
