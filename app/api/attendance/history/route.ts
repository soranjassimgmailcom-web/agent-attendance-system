import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const records = await prisma.attendance.findMany({
    where: {
      userId: session.userId,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json({ records });
}