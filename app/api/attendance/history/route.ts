import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [records, leaveDays] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.leaveDay.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        date: "desc",
      },
    }),
  ]);

  return NextResponse.json({ records, leaveDays });
}