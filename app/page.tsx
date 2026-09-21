import { HeroSection } from "@/components/sections/HeroSection";
import { MissionSection } from "@/components/sections/MissionSection";
import { ParticleSection } from "@/components/sections/ParticleSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { CodeSection } from "@/components/sections/CodeSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getPackageStats } from "@/lib/downloads";

export default async function Home() {
  const stats = await getPackageStats();

  return (
    <>
      <HeroSection downloads={stats.compact} />
      <ParticleSection />
      <AboutSection stats={stats} />
      <WorkSection stats={stats} />
      <MissionSection />
      <CodeSection />
      <ContactSection />
    </>
  );
}
