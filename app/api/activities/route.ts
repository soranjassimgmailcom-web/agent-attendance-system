import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const activities = await prisma.agentActivity.findMany({
    where: { userId: session.userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
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

  const activity =
    typeof body === "object" && body !== null
      ? (body as { date?: unknown; title?: unknown; details?: unknown })
      : null;

  if (
    !activity ||
    typeof activity.date !== "string" ||
    !isCalendarDate(activity.date) ||
    activity.date > new Date().toISOString().slice(0, 10) ||
    typeof activity.title !== "string" ||
    !activity.title.trim() ||
    activity.title.trim().length > 120 ||
    (activity.details !== undefined &&
      activity.details !== null &&
      (typeof activity.details !== "string" || activity.details.length > 2000))
  ) {
    return NextResponse.json(
      { error: "Enter a valid activity date, a title up to 120 characters, and details up to 2,000 characters" },
      { status: 400 }
    );
  }

  const createdActivity = await prisma.agentActivity.create({
    data: {
      userId: session.userId,
      date: activity.date,
      title: activity.title.trim(),
      details: typeof activity.details === "string" && activity.details.trim()
        ? activity.details.trim()
        : null,
    },
  });

  return NextResponse.json(
    { activity: createdActivity, message: "Activity saved successfully" },
    { status: 201 }
  );
}
