import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "@/components/cursor/CustomCursor";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/sections/Footer";
import { BootSequence } from "@/components/boot/BootSequence";
import { getPackageStats } from "@/lib/downloads";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Akshay Dongare · AI Platform Engineer";

// Async so the download figure in the description stays current. Next caches
// this alongside the page; getPackageStats carries its own revalidate window.
export async function generateMetadata(): Promise<Metadata> {
  const stats = await getPackageStats();

  // Name, employers, figure, in that order: phones cut near 110 characters and still show the first two.
  const description =
    `Akshay Dongare, AI platform engineer. AI systems for Airbnb, ISO and Harvard University. ` +
    `Creator of LangChain’s LiteLLM integration, with ${stats.long} downloads.`;
  // Shorter line for link previews, which truncate around 160-200 characters.
  const shareDescription =
    `Creator and lead maintainer of langchain-litellm, LangChain’s official LiteLLM integration. ` +
    `${stats.long} downloads and counting.`;

  return {
    // Required for the generated opengraph-image to resolve to an absolute URL.
    metadataBase: new URL("https://akshaydongare.com"),
    // Collapses query-string variants such as /?utm_source=linkedin onto the clean URL, so they index as the page.
    // "./" resolves per route, so /about canonicalises to /about.
    alternates: { canonical: "./" },
    // default covers the homepage; template gives every other route its own title
    // while keeping the name in it, which is the string we want to rank for.
    title: { default: TITLE, template: "%s · Akshay Dongare" },
    description,
    openGraph: {
      title: TITLE,
      description: shareDescription,
      url: "https://akshaydongare.com",
      siteName: "Akshay Dongare",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: shareDescription,
    },
  };
}

// sameAs tells Google the site and these four profiles are one person, not five entities it has to guess between.
// Only true claims: no alumniOf until the degree finishes in December 2026, no worksFor as the Airbnb contract is over.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Akshay Dongare",
  url: "https://akshaydongare.com",
  image: "https://akshaydongare.com/Akshay_Headshot.jpg",
  jobTitle: "AI Platform Engineer",
  email: "mailto:contact@akshaydongare.com",
  homeLocation: {
    "@type": "Place",
    address: { "@type": "PostalAddress", addressLocality: "Raleigh", addressRegion: "NC", addressCountry: "US" },
  },
  knowsAbout: ["LLM infrastructure", "AI platform engineering", "LangChain", "LiteLLM", "Python", "Distributed systems"],
  sameAs: [
    "https://github.com/Akshay-Dongare",
    "https://www.linkedin.com/in/akshay-dongare/",
    "https://www.youtube.com/@akshay-dongare",
    "https://www.instagram.com/akshaydongare.ai/",
  ],
};

// Lets Google show "Akshay Dongare" as the site name in results instead of the
// bare domain.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Akshay Dongare",
  // Google's documented fallback when it is not confident enough to use the name.
  alternateName: ["akshaydongare.com"],
  url: "https://akshaydongare.com",
};

// This visit's choice wins, then the system setting, then light; dark lands before first paint, so no light flash.
// A lasting choice in localStorage is deleted, so every new visit starts from the system.
const modeScript = `(function(){var m;try{localStorage.removeItem('mode')}catch(e){}try{m=sessionStorage.getItem('mode')}catch(e){}if(m!=='dark'&&m!=='light'){try{m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}}if(m==='dark'){var d=document.documentElement;d.dataset.mode='dark';d.style.colorScheme='dark';var t=document.querySelector('meta[name="theme-color"]');if(t)t.content='#07090f'}})()`;

// Runs before first paint so neither a repeat visitor nor someone with reduced motion
// ever sees a frame of the mask.
const bootSkipScript = `try{if(sessionStorage.getItem('bootPlayed')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('skip-boot')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" data-mode="light" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <head>
        {/* Owned here, not by viewport metadata, which Next re-inserts on every navigation. */}
        <meta name="theme-color" content="#faf6ee" suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
        <script dangerouslySetInnerHTML={{ __html: bootSkipScript }} />
        {/* With no JS (scripting off, a blocked bundle, a stale page missing its chunk) the boot mask and Framer's
            inline opacity:0 never clear; a stylesheet !important beats a non-important inline style, so this does. */}
        <noscript>
          <style>{`.boot-mask{display:none!important}[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BootSequence>
          <CursorProvider>
            {/* The first tab stop skips the seven header controls; data-nosnippet sits on the div, where Google honours it. */}
            <div data-nosnippet>
              <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[120] focus:rounded-full focus:px-4 focus:py-2 focus:bg-[var(--page-bg)] focus:text-fg-100 text-label cursor-none">
                Skip to content
              </a>
            </div>
            <Navbar />
            <main id="main" className="min-h-screen">
              {children}
            </main>
            <Footer />
          </CursorProvider>
        </BootSequence>
      </body>
    </html>
  );
}
