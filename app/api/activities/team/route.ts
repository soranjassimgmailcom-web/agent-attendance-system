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

  const activities = await prisma.agentActivity.findMany({
    where: {
      date: { startsWith: month },
      user: {
        role: "AGENT",
        isActive: true,
      },
    },
    select: {
      id: true,
      date: true,
      title: true,
      details: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          jobRole: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return NextResponse.json({ activities, month });
}
