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

  const description =
    `I build the layer between applications and language models. Creator and lead maintainer of ` +
    `langchain-litellm, LangChain's official LiteLLM integration, with ${stats.long} downloads and counting.`;
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
    title: TITLE,
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

// Runs before first paint so neither a repeat visitor nor someone with reduced motion
// ever sees a frame of the mask.
const bootSkipScript = `try{if(sessionStorage.getItem('bootPlayed')||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('skip-boot')}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootSkipScript }} />
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
