import { getPackageStats } from "@/lib/downloads";
import { AboutContent } from "./AboutContent";

// Server shell so the package figures can be fetched; the page itself stays a
// client component because of the scroll and reveal animations.
export default async function AboutPage() {
    const stats = await getPackageStats();
    return <AboutContent stats={stats} />;
}
