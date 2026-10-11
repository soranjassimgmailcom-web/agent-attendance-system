import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  const name =
    typeof body === "object" && body !== null
      ? (body as { name?: unknown }).name
      : undefined;

  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return NextResponse.json(
      { error: "Enter a name between 1 and 80 characters" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { name: name.trim() },
    select: { name: true },
  });

  return NextResponse.json({ user: updated, message: "Your profile name was updated" });
}
