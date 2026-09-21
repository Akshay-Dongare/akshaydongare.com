import { getPackageStats } from "@/lib/downloads";
import { WorkContent } from "./WorkContent";

export default async function WorkPage() {
    const stats = await getPackageStats();
    return <WorkContent stats={stats} />;
}
