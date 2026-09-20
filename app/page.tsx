import { HeroSection } from "@/components/sections/HeroSection";
import { MissionSection } from "@/components/sections/MissionSection";
import { ParticleSection } from "@/components/sections/ParticleSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { CodeSection } from "@/components/sections/CodeSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ParticleSection />
      <AboutSection />
      <WorkSection />
      <MissionSection />
      <CodeSection />
      <ContactSection />
    </>
  );
}
