import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const record = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId,
        date: today,
      },
    },
  });

  if (record?.checkInAt) {
    return NextResponse.json({ error: "You already checked in today" }, { status: 400 });
  }

  const updated = record
    ? await prisma.attendance.update({
        where: { id: record.id },
        data: { checkInAt: now },
      })
    : await prisma.attendance.create({
        data: {
          userId: session.userId,
          date: today,
          checkInAt: now,
        },
      });

  return NextResponse.json({ message: "Checked in successfully", record: updated });
}
