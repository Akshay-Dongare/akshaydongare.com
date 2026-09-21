import type { Metadata } from "next";
import { ColophonContent } from "./ColophonContent";

export const metadata: Metadata = {
    title: "Colophon",
    description: "How akshaydongare.com is built: Next.js, React Three Fiber, two WebGL particle systems, and the decisions behind them.",
};

export default function Page() {
    return <ColophonContent />;
}
