import "@/styles/globals.css";
import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";

export const metadata = {
  title: "Akshay Dongare",
  description: "AI Engineer, OSS Contributor, and Builder"
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
  { href: "/social", label: "Social" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="font-Quicksand bg-matteblack text-lightgray antialiased">
        <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-smokeblack bg-matteblack z-50 sticky top-0">
          <div className="text-lightblue font-Mono text-xl font-bold tracking-tight">Akshay Dongare</div>
          <div className="flex gap-6 text-lightgray font-Mono text-base">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative transition-colors duration-200 hover:text-lightblue after:content-[''] after:block after:h-0.5 after:bg-lightblue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
