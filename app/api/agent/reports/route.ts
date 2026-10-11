import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const period = params.get("period");
  const anchor = params.get("date");
  if ((period !== "week" && period !== "month") || !anchor || !isCalendarDate(anchor)) {
    return NextResponse.json({ error: "Choose a valid report period and date" }, { status: 400 });
  }

  const anchorDate = new Date(`${anchor}T00:00:00.000Z`);
  let start: string;
  let end: string;
  if (period === "week") {
    const day = (anchorDate.getUTCDay() + 6) % 7;
    const weekStart = new Date(anchorDate);
    weekStart.setUTCDate(weekStart.getUTCDate() - day);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    start = weekStart.toISOString().slice(0, 10);
    end = weekEnd.toISOString().slice(0, 10);
  } else {
    start = `${anchor.slice(0, 7)}-01`;
    const monthEnd = new Date(Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() + 1, 0));
    end = monthEnd.toISOString().slice(0, 10);
  }

  const activities = await prisma.agentActivity.findMany({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: { id: true, date: true, title: true, details: true, createdAt: true },
  });

  const totals = activities.reduce<Record<string, number>>((counts, activity) => {
    counts[activity.title] = (counts[activity.title] ?? 0) + 1;
    return counts;
  }, {});

  return NextResponse.json({ period, start, end, activities, totals });
}
