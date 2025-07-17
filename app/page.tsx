import Link from "next/link";
import Image from "next/image";
import "@/styles/globals.css";

function GlitchText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <span className="absolute inset-0 animate-pulse text-lightblue/30 blur-sm pointer-events-none select-none">
        {children}
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-matteblack text-lightgray font-sans">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 bg-grid bg-lightblue/40 bg-repeat bg-[length:36px_36px] opacity-20 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] pointer-events-none" />
      {/* Animated Blurred Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-lightblue/10 to-darkblue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-br from-darkblue/10 to-lightblue/10 rounded-full blur-3xl animate-pulse" />
      </div>
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 py-24 text-center">
        <div className="backdrop-blur-2xl bg-lightblue/10 border border-lightblue/20 rounded-3xl p-10 md:p-16 shadow-2xl max-w-3xl mx-auto flex flex-col items-center">
          <Image
            src="/profile.jpg"
            alt="Akshay Dongare"
            width={120}
            height={120}
            className="rounded-full mx-auto mb-6 border-4 border-lightblue shadow-lg"
          />
          <h1 className="font-Mono text-4xl sm:text-5xl md:text-6xl font-bold text-lightblue mb-4">
            <GlitchText>Akshay Dongare</GlitchText>
          </h1>
          <p className="text-xl md:text-2xl font-Quicksand text-lightgray mb-8">
            AI Engineer. OSS Contributor. Builder of Intelligent Systems.
          </p>
          <Link
            href="/about"
            className="inline-block font-Mono text-base md:text-lg text-lightblue px-8 py-3 rounded-full border border-lightblue/50 bg-matteblack/60 hover:bg-lightblue/10 hover:border-lightblue/80 transition-colors duration-300 shadow-lg hover:shadow-lightblue/30"
          >
            Learn More About Me
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className="relative z-10 text-center text-sm opacity-70 mt-12 pb-8">
        <p className="mb-2">Connect with me:</p>
        <div className="flex justify-center gap-4 mb-4">
          <Link href="#" className="hover:text-lightblue transition-colors">GitHub</Link>
          <Link href="#" className="hover:text-lightblue transition-colors">LinkedIn</Link>
          <Link href="#" className="hover:text-lightblue transition-colors">Resume</Link>
          <Link href="#" className="hover:text-lightblue transition-colors">Instagram</Link>
          <Link href="#" className="hover:text-lightblue transition-colors">YouTube</Link>
        </div>
        <p className="mt-2">© 2025 Akshay Dongare</p>
      </footer>
    </main>
  );
}
