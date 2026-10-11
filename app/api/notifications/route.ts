import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const allowedReactions = ["👍", "❤️", "🎉", "🙏"] as const;

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (session.role === "ADMIN") {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sender: { select: { name: true } },
        _count: { select: { reactions: true, reads: true } },
        reactions: { select: { reaction: true } },
      },
    });
    return NextResponse.json({ announcements, unreadCount: 0 });
  }

  const [announcements, reads] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sender: { select: { name: true } },
        reactions: {
          select: { userId: true, reaction: true },
        },
      },
    }),
    prisma.announcementRead.findMany({
      where: { userId: session.userId },
      select: { announcementId: true },
    }),
  ]);

  const readIds = new Set(reads.map((read) => read.announcementId));
  const unreadCount = announcements.filter((announcement) => !readIds.has(announcement.id)).length;

  return NextResponse.json({
    announcements: announcements.map(({ reactions, ...announcement }) => ({
      ...announcement,
      ownReaction: reactions.find((reaction) => reaction.userId === session.userId)?.reaction ?? null,
      reactions: allowedReactions.map((reaction) => ({
        reaction,
        count: reactions.filter((entry) => entry.reaction === reaction).length,
      })),
    })),
    unreadCount,
  });
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

  const announcement =
    typeof body === "object" && body !== null
      ? (body as { title?: unknown; message?: unknown })
      : null;

  if (
    !announcement ||
    typeof announcement.title !== "string" ||
    !announcement.title.trim() ||
    announcement.title.trim().length > 120 ||
    typeof announcement.message !== "string" ||
    !announcement.message.trim() ||
    announcement.message.trim().length > 2000
  ) {
    return NextResponse.json(
      { error: "Enter a title up to 120 characters and a message up to 2,000 characters" },
      { status: 400 }
    );
  }

  const created = await prisma.announcement.create({
    data: {
      title: announcement.title.trim(),
      message: announcement.message.trim(),
      senderId: session.userId,
    },
    select: { id: true, title: true, message: true, createdAt: true },
  });

  return NextResponse.json({ announcement: created, message: "Announcement sent to all agents" }, { status: 201 });
}

export async function PATCH(request: Request) {
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

  const reactionRequest =
    typeof body === "object" && body !== null
      ? (body as { announcementId?: unknown; reaction?: unknown })
      : null;

  if (
    !reactionRequest ||
    typeof reactionRequest.announcementId !== "string" ||
    !reactionRequest.announcementId ||
    typeof reactionRequest.reaction !== "string" ||
    !allowedReactions.includes(reactionRequest.reaction as (typeof allowedReactions)[number])
  ) {
    return NextResponse.json({ error: "Choose a valid announcement and reaction" }, { status: 400 });
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id: reactionRequest.announcementId },
    select: { id: true },
  });

  if (!announcement) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  const reaction = reactionRequest.reaction;
  await prisma.announcementReaction.upsert({
    where: {
      announcementId_userId: {
        announcementId: announcement.id,
        userId: session.userId,
      },
    },
    update: { reaction },
    create: {
      announcementId: announcement.id,
      userId: session.userId,
      reaction,
    },
  });

  return NextResponse.json({ message: "Reaction saved" });
}

export async function PUT(request: Request) {
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

  const ids =
    typeof body === "object" && body !== null
      ? (body as { announcementIds?: unknown }).announcementIds
      : undefined;

  if (!Array.isArray(ids) || ids.length > 100 || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Provide a valid list of announcement IDs" }, { status: 400 });
  }

  if (ids.length > 0) {
    await prisma.announcementRead.createMany({
      data: [...new Set(ids)].map((announcementId) => ({
        announcementId: announcementId as string,
        userId: session.userId,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ message: "Announcements marked as read" });
}
