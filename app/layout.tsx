// app/layout.tsx
import "@/styles/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Akshay Dongare",
  description: "AI Engineer, OSS Contributor, and Builder"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ... */}
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
