import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAgentJobRole } from "@/lib/agent-roles";

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

  const agentRequest =
    typeof body === "object" && body !== null
      ? (body as { isActive?: unknown; jobRole?: unknown })
      : null;
  const isActive = agentRequest?.isActive;
  const jobRole = agentRequest?.jobRole;

  if (
    (!agentRequest || typeof isActive !== "boolean") &&
    (!agentRequest || jobRole === undefined)
  ) {
    return NextResponse.json(
      { error: "Provide an account status or agent role to update" },
      { status: 400 }
    );
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be true or false" }, { status: 400 });
  }

  if (
    jobRole !== undefined &&
    (!isAgentJobRole(jobRole) || jobRole === "UNASSIGNED")
  ) {
    return NextResponse.json({ error: "Choose a valid assigned agent role" }, { status: 400 });
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
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(jobRole !== undefined ? { jobRole } : {}),
    },
    select: { id: true, isActive: true, jobRole: true },
  });

  const message =
    isActive !== undefined
      ? updated.isActive
        ? "Agent account reactivated"
        : "Agent account deactivated"
      : "Agent role updated";

  return NextResponse.json({
    agent: updated,
    message,
  });
}
