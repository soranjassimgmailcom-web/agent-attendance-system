import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.attendance.findMany({
    where: { userId: session.userId },
    orderBy: { date: "desc" },
    take: 30,
  });

  return NextResponse.json({ records });
}
