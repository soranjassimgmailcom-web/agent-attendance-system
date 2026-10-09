import { AgentDashboard } from "@/components/agent-dashboard";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AgentPage() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    redirect("/login");
  }

  return <AgentDashboard user={session} />;
}
