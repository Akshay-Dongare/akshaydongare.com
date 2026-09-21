import { HeroSection } from "@/components/sections/HeroSection";
import { MissionSection } from "@/components/sections/MissionSection";
import { ParticleSection } from "@/components/sections/ParticleSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { CodeSection } from "@/components/sections/CodeSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getDownloadCount } from "@/lib/downloads";

export default async function Home() {
  const downloads = await getDownloadCount();

  return (
    <>
      <HeroSection downloads={downloads} />
      <ParticleSection />
      <AboutSection />
      <WorkSection />
      <MissionSection />
      <CodeSection />
      <ContactSection />
    </>
  );
}
