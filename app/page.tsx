import { HeroSection } from "@/components/sections/HeroSection";
import { MissionSection } from "@/components/sections/MissionSection";
import { ParticleSection } from "@/components/sections/ParticleSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { CodeSection } from "@/components/sections/CodeSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getPackageStats } from "@/lib/downloads";
import type { Metadata } from "next";

// The layout's canonical "./" would resolve to /index, a live 200 duplicate, because this segment is named "index".
// Pinned to "/" to match sitemap.xml; title, description, openGraph and twitter come from the layout.
export const metadata: Metadata = {
    alternates: { canonical: "/" },
};

export default async function Home() {
  const stats = await getPackageStats();

  return (
    <>
      <HeroSection stats={stats} />
      <ParticleSection stats={stats} />
      <AboutSection stats={stats} />
      <WorkSection stats={stats} />
      <MissionSection />
      <CodeSection />
      <ContactSection />
    </>
  );
}
