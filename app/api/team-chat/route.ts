import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fail(message: string, status: number) {
  return NextResponse.json({ error: message, message }, { status });
}

export async function GET() {
  const session = await getSession();
  if (!session) return fail("Please sign in.", 401);

  const rows = await prisma.teamMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      senderId: true,
      body: true,
      imageType: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  });

  const messages = rows.reverse().map((row) => ({
    id: row.id,
    senderId: row.senderId,
    senderName: row.sender.name,
    body: row.body,
    hasImage: Boolean(row.imageType),
    createdAt: row.createdAt.toISOString(),
  }));

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return fail("Please sign in.", 401);

  const form = await request.formData();
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  const image = form.get("image");

  let imageData: Buffer | undefined;
  let imageType: string | undefined;

  if (image instanceof File && image.size > 0) {
    if (!ALLOWED_TYPES.includes(image.type)) {
      return fail("Please choose a JPEG, PNG, WebP or GIF picture.", 400);
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return fail("Pictures must be 2 MB or smaller.", 400);
    }
    imageData = Buffer.from(await image.arrayBuffer());
    imageType = image.type;
  }

  if (!body && !imageData) {
    return fail("Write a message or add a picture.", 400);
  }

  await prisma.teamMessage.create({
    data: { senderId: session.userId, body, imageData, imageType },
  });

  return NextResponse.json({ message: "Message sent." });
}