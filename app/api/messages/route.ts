import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const partnerId = new URL(request.url).searchParams.get("with");
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", isActive: true, id: { not: session.userId } },
    select: { id: true, name: true, jobRole: true },
    orderBy: { name: "asc" },
  });

  if (partnerId) {
    const partner = agents.find((agent) => agent.id === partnerId);
    if (!partner) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: session.userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        body: true,
        createdAt: true,
      },
    });

    await prisma.chatMessage.updateMany({
      where: { senderId: partnerId, receiverId: session.userId, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      partner,
      messages: messages.reverse(),
    });
  }

  const recentMessages = await prisma.chatMessage.findMany({
    where: { OR: [{ senderId: session.userId }, { receiverId: session.userId }] },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      body: true,
      createdAt: true,
      readAt: true,
    },
  });
  const latestByPartner = new Map<string, (typeof recentMessages)[number]>();
  const unreadByPartner = new Map<string, number>();

  for (const message of recentMessages) {
    const otherId = message.senderId === session.userId ? message.receiverId : message.senderId;
    if (!latestByPartner.has(otherId)) latestByPartner.set(otherId, message);
    if (message.receiverId === session.userId && !message.readAt) {
      unreadByPartner.set(otherId, (unreadByPartner.get(otherId) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    agents: agents.map((agent) => ({
      ...agent,
      lastMessage: latestByPartner.get(agent.id) ?? null,
      unreadCount: unreadByPartner.get(agent.id) ?? 0,
    })),
  });
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

  const message =
    typeof body === "object" && body !== null
      ? (body as { receiverId?: unknown; body?: unknown })
      : null;
  if (
    !message ||
    typeof message.receiverId !== "string" ||
    message.receiverId === session.userId ||
    typeof message.body !== "string" ||
    !message.body.trim() ||
    message.body.trim().length > 2000
  ) {
    return NextResponse.json({ error: "Enter a recipient and a message up to 2,000 characters" }, { status: 400 });
  }

  const recipient = await prisma.user.findFirst({
    where: { id: message.receiverId, role: "AGENT", isActive: true },
    select: { id: true },
  });
  if (!recipient) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const created = await prisma.chatMessage.create({
    data: {
      senderId: session.userId,
      receiverId: recipient.id,
      body: message.body.trim(),
    },
    select: { id: true, senderId: true, receiverId: true, body: true, createdAt: true },
  });
  return NextResponse.json({ message: created }, { status: 201 });
}
