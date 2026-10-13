import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const row = await prisma.teamMessage.findUnique({
    where: { id: params.id },
    select: { imageData: true, imageType: true },
  });

  if (!row?.imageData || !row.imageType) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.imageData), {
    headers: {
      "Content-Type": row.imageType,
      "Cache-Control": "private, max-age=86400",
    },
  });
}