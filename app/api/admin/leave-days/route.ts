import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const leaveTypes = ["VACATION", "AUTHORIZED_ABSENCE"] as const;

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    throw error;
  }

  const leaveRequest =
    typeof body === "object" && body !== null
      ? (body as { userId?: unknown; date?: unknown; type?: unknown })
      : null;

  if (
    !leaveRequest ||
    typeof leaveRequest.userId !== "string" ||
    !leaveRequest.userId ||
    typeof leaveRequest.date !== "string" ||
    !isCalendarDate(leaveRequest.date) ||
    typeof leaveRequest.type !== "string" ||
    !leaveTypes.includes(leaveRequest.type as (typeof leaveTypes)[number])
  ) {
    return NextResponse.json(
      { error: "Choose an agent, a valid date, and a valid time-off type" },
      { status: 400 }
    );
  }

  const agent = await prisma.user.findUnique({
    where: { id: leaveRequest.userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!agent || agent.role !== "AGENT" || !agent.isActive) {
    return NextResponse.json({ error: "Choose an active agent" }, { status: 404 });
  }

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: agent.id,
        date: leaveRequest.date,
      },
    },
    select: { id: true },
  });

  if (attendance) {
    return NextResponse.json(
      { error: "This agent already has an attendance record for that date" },
      { status: 409 }
    );
  }

  const leaveDay = await prisma.leaveDay.upsert({
    where: {
      userId_date: {
        userId: agent.id,
        date: body.date,
      },
    },
    update: { type: leaveRequest.type as (typeof leaveTypes)[number] },
    create: {
      userId: agent.id,
      date: leaveRequest.date,
      type: leaveRequest.type as (typeof leaveTypes)[number],
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(
    { leaveDay, message: "Time off recorded successfully" },
    { status: 201 }
  );
}
