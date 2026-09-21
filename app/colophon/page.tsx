import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ColophonContent } from "./ColophonContent";

export const metadata: Metadata = pageMetadata({
    title: "Colophon",
    description: "How akshaydongare.com is built: Next.js, React Three Fiber, two WebGL particle systems, and the decisions behind them.",
    path: "/colophon",
});

export default function Page() {
    return <ColophonContent />;
}
