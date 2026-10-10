import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "Month must use YYYY-MM format" }, { status: 400 });
  }

  const [attendance, leaveDays] = await Promise.all([
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

  const body = await request.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: String(name),
      email: String(email).toLowerCase(),
      password: hashedPassword,
      role: "AGENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json(
    { agent: user, message: "Agent account created successfully" },
    { status: 201 }
  );
}