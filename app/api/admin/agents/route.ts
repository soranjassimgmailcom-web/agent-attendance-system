import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isAgentJobRole } from "@/lib/agent-roles";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "Month must use YYYY-MM format" }, { status: 400 });
  }

  const [agents, attendance, leaveDays] = await Promise.all([
    prisma.user.findMany({
      where: { role: "AGENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobRole: true,
        isActive: true,
      },
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          startsWith: month,
        },
      },
      orderBy: { date: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.leaveDay.findMany({
      where: {
        date: {
          startsWith: month,
        },
      },
      orderBy: { date: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ agents, attendance, leaveDays });
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

  const agentRequest =
    typeof body === "object" && body !== null
      ? (body as { name?: unknown; email?: unknown; password?: unknown; jobRole?: unknown })
      : null;
  const { name, email, password, jobRole } = agentRequest ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password ||
    !isAgentJobRole(jobRole) ||
    jobRole === "UNASSIGNED"
  ) {
    return NextResponse.json(
      { error: "Name, email, password, and an assigned agent role are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "AGENT",
      jobRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      jobRole: true,
    },
  });

  return NextResponse.json(
    { agent: user, message: "Agent account created successfully" },
    { status: 201 }
  );
}