import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const maxImageSize = 1024 * 1024;
const imageTypes = new Map([
  ["image/jpeg", (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff],
  [
    "image/png",
    (bytes: Uint8Array) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  ],
  [
    "image/webp",
    (bytes: Uint8Array) =>
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  ],
]);

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { profileImage: true, profileImageType: true },
  });

  if (!user?.profileImage || !user.profileImageType) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return new NextResponse(user.profileImage, {
    headers: {
      "Content-Type": user.profileImageType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const validateImage = imageTypes.get(contentType);
  if (!validateImage) {
    return NextResponse.json({ error: "Upload a JPEG, PNG, or WebP image" }, { status: 415 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxImageSize) {
    return NextResponse.json({ error: "Profile pictures must be 1 MB or smaller" }, { status: 413 });
  }

  const image = new Uint8Array(await request.arrayBuffer());
  if (!image.length || image.length > maxImageSize) {
    return NextResponse.json({ error: "Profile pictures must be between 1 byte and 1 MB" }, { status: 413 });
  }

  if (!validateImage(image)) {
    return NextResponse.json({ error: "The uploaded file is not a valid image of the selected type" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { profileImage: Buffer.from(image), profileImageType: contentType },
  });

  return NextResponse.json({ message: "Profile picture updated" });
}

export async function DELETE() {
  const session = await getSession();

  if (!session || session.role !== "AGENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { profileImage: null, profileImageType: null },
  });

  return NextResponse.json({ message: "Profile picture removed" });
}
