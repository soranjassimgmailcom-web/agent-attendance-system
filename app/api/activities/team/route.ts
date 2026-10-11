import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "Month must use YYYY-MM format" }, { status: 400 });
  }

  const [agents, categoryCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "AGENT", isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        jobRole: true,
        profileImageType: true,
        _count: {
          select: {
            activities: {
              where: { date: { startsWith: month } },
            },
          },
        },
        activities: {
          where: { date: { startsWith: month } },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 4,
          select: {
            id: true,
            date: true,
            title: true,
            details: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.agentActivity.groupBy({
      by: ["userId", "title"],
      where: { date: { startsWith: month } },
      _count: { _all: true },
    }),
  ]);

  const countsByAgent = new Map<string, { title: string; count: number }[]>();
  for (const entry of categoryCounts) {
    const categories = countsByAgent.get(entry.userId) ?? [];
    categories.push({ title: entry.title, count: entry._count._all });
    countsByAgent.set(entry.userId, categories);
  }

  const team = agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    jobRole: agent.jobRole,
    hasProfileImage: agent.profileImageType !== null,
    activityCount: agent._count.activities,
    categoryCounts: countsByAgent.get(agent.id) ?? [],
    recentActivities: agent.activities,
  }));

  return NextResponse.json({ agents: team, month });
}
