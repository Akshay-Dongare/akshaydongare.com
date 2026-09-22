import { HeroSection } from "@/components/sections/HeroSection";
import { MissionSection } from "@/components/sections/MissionSection";
import { ParticleSection } from "@/components/sections/ParticleSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { CodeSection } from "@/components/sections/CodeSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getPackageStats } from "@/lib/downloads";
import type { Metadata } from "next";

// The root layout sets alternates.canonical to "./", which resolves correctly for every
// sub-page because their segment name matches their path. The home route's segment is
// named "index", so "./" resolved to https://akshaydongare.com/index — a URL that serves
// 200 rather than redirecting, so the most important page on the site was pointing Google
// at a live duplicate of itself while sitemap.xml pointed at "/". Pinning it here fixes
// only that field; title, description, openGraph and twitter still come from the layout.
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
