import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET;

  if (!bootstrapSecret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authorization = request.headers.get("authorization") || "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expected = Buffer.from(bootstrapSecret);
  const supplied = Buffer.from(suppliedSecret);

  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const agentEmail = process.env.AGENT_EMAIL;
  const agentPassword = process.env.AGENT_PASSWORD;

  if (
    !adminEmail ||
    !adminPassword ||
    adminPassword.length < 16 ||
    !agentEmail ||
    !agentPassword ||
    agentPassword.length < 16
  ) {
    return NextResponse.json({ error: "Account configuration is incomplete" }, { status: 500 });
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (existingAdmin) {
    return NextResponse.json({ error: "An admin account already exists" }, { status: 409 });
  }

  const [hashedAdminPassword, hashedAgentPassword] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(agentPassword, 10),
  ]);

  await prisma.$transaction([
    prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: "System Admin",
        password: hashedAdminPassword,
        role: "ADMIN",
      },
      create: {
        name: "System Admin",
        email: adminEmail,
        password: hashedAdminPassword,
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { email: agentEmail },
      update: {
        name: "Sample Agent",
        password: hashedAgentPassword,
        role: "AGENT",
      },
      create: {
        name: "Sample Agent",
        email: agentEmail,
        password: hashedAgentPassword,
        role: "AGENT",
      },
    }),
  ]);

  return NextResponse.json({ message: "Initial accounts created" });
}
