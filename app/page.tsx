import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-12 font-sans">
      <section className="text-center mb-20">
        <h1 className="text-5xl font-bold mb-4">Akshay Dongare</h1>
        <p className="text-xl opacity-75">
          AI Engineer. OSS Contributor. Builder of Intelligent Systems.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        <Card className="bg-zinc-900 text-white shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-2">About Me</h2>
            <p className="opacity-75">
              Placeholder text about Akshay's background, interests, and current work in applied AI.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 text-white shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-2">Projects</h2>
            <ul className="list-disc list-inside opacity-75">
              <li>LangChain Open Source Contributions</li>
              <li>Predictive Maintenance Dashboard</li>
              <li>OSS Tools for LangGraph/MCP</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 text-white shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-2">Blog</h2>
            <p className="opacity-75">Blog posts coming soon...</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 text-white shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-2">Open Source</h2>
            <p className="opacity-75">
              Featured GitHub PRs and contributions to LangChain and other tools.
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center text-sm opacity-50">
        <p>Connect with me:</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="#">GitHub</Link>
          <Link href="#">LinkedIn</Link>
          <Link href="#">Resume</Link>
          <Link href="#">Instagram</Link>
          <Link href="#">YouTube</Link>
        </div>
        <p className="mt-4">© 2025 Akshay Dongare</p>
      </footer>
    </main>
  );
}
