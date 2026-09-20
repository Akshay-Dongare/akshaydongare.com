"use client";

import PageTransition from "@/components/wrappers/PageTransition";

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransition>{children}</PageTransition>;
}
