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
    `Akshay Dongare, AI platform engineer. AI systems for Airbnb, ISO and Harvard. ` +
    `Creator of LangChain's LiteLLM integration, with ${stats.long} downloads.`;
  // Shorter line for link previews, which truncate around 160-200 characters.
  const shareDescription =
    `Creator and lead maintainer of langchain-litellm, LangChain's official LiteLLM integration. ` +
    `${stats.long} downloads and counting.`;

  return {
    // Required for the generated opengraph-image to resolve to an absolute URL.
    metadataBase: new URL("https://akshaydongare.com"),
    // Collapses query-string variants onto the clean URL, so /?x=1 and
    // /?utm_source=linkedin are indexed as the page itself rather than as
    // duplicates. "./" resolves per route, so /about canonicalises to /about.
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

// Tells Google that the site, the GitHub account, the LinkedIn profile, the YouTube
// channel and the Instagram account are ONE person. Without sameAs it sees five
// unconnected entities and has to guess, which is why searching his name returns
// scattered links rather than one cluster. Only claims that are true today: no
// alumniOf, because the degree is not finished until December 2026, and no worksFor,
// because the Airbnb engagement was a contract that has ended.
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

// Light is the default; a stored dark choice is applied before first paint so it never flashes light.
const modeScript = `try{if(localStorage.getItem('mode')==='dark'){var d=document.documentElement;d.dataset.mode='dark';d.style.colorScheme='dark';var t=document.querySelector('meta[name="theme-color"]');if(t)t.content='#07090f'}}catch(e){}`;

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
        {/* Without JS the page is a black rectangle: the boot mask is in the server HTML
            and is only ever torn down from an effect, and Framer emits inline opacity:0
            on 17 reveal elements that nothing is left to animate in. That is what a
            visitor sees with scripting off, behind a proxy or extension that blocks the
            bundle, or when a stale cached document asks for a chunk a deploy has since
            replaced. A stylesheet !important outranks a non-important inline style, so
            this reveals the content instead. */}
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
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </CursorProvider>
        </BootSequence>
      </body>
    </html>
  );
}
