import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  if (record && record.checkInAt) {
    return NextResponse.json({ error: "You already checked in today" }, { status: 400 });
  }

  if (record) {
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { checkInAt: now },
    });

    return NextResponse.json({ message: "Checked in successfully", record: updated });
  }

  const created = await prisma.attendance.create({
    data: {
      userId: session.userId,
      date: today,
      checkInAt: now,
    },
  });

  return NextResponse.json({ message: "Checked in successfully", record: created });
}
