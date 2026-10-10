import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { agentId: string } }
) {
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

  if (typeof body !== "object" || body === null || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be true or false" }, { status: 400 });
  }

  const agent = await prisma.user.findUnique({
    where: { id: params.agentId },
    select: { id: true, role: true },
  });

  if (!agent || agent.role !== "AGENT") {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: agent.id },
    data: { isActive: body.isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json({
    agent: updated,
    message: updated.isActive ? "Agent account reactivated" : "Agent account deactivated",
  });
}
