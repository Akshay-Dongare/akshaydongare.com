import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "@/components/cursor/CustomCursor";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/sections/Footer";
import { BootSequence } from "@/components/boot/BootSequence";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Akshay Dongare · AI Platform Engineer";
const DESCRIPTION =
  "I build the layer between applications and language models. Creator and lead maintainer of langchain-litellm, LangChain's official LiteLLM integration, with 15 million downloads and counting.";
// Shorter line for link previews, which truncate around 160-200 characters.
const SHARE_DESCRIPTION =
  "Creator and lead maintainer of langchain-litellm, LangChain's official LiteLLM integration. 15 million downloads and counting.";

export const metadata: Metadata = {
  // Required for the generated opengraph-image to resolve to an absolute URL.
  metadataBase: new URL("https://akshaydongare.com"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: SHARE_DESCRIPTION,
    url: "https://akshaydongare.com",
    siteName: "Akshay Dongare",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SHARE_DESCRIPTION,
  },
};

const bootSkipScript = `try{if(sessionStorage.getItem('bootPlayed'))document.documentElement.classList.add('skip-boot')}catch(e){}`;

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
