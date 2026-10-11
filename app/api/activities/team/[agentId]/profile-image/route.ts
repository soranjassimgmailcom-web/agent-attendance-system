import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { agentId: string } }
) {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const agent = await prisma.user.findFirst({
    where: {
      id: params.agentId,
      role: "AGENT",
      isActive: true,
    },
    select: {
      profileImage: true,
      profileImageType: true,
    },
  });

  if (!agent?.profileImage || !agent.profileImageType) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return new NextResponse(agent.profileImage, {
    headers: {
      "Content-Type": agent.profileImageType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
