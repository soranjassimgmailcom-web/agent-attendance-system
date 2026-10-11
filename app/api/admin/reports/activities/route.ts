import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "Month must use YYYY-MM format" }, { status: 400 });
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = `${month}-${String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, "0")}`;
  const activities = await prisma.agentActivity.findMany({
    where: { date: { gte: start, lte: end } },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Agent Activities");
  sheet.columns = [
    { header: "Agent", key: "name", width: 26 },
    { header: "Email", key: "email", width: 32 },
    { header: "Date", key: "date", width: 15 },
    { header: "Activity", key: "title", width: 36 },
    { header: "Details", key: "details", width: 60 },
    { header: "Logged At", key: "createdAt", width: 24 },
  ];

  activities.forEach((activity) => {
    sheet.addRow({
      name: activity.user.name,
      email: activity.user.email,
      date: activity.date,
      title: activity.title,
      details: activity.details ?? "",
      createdAt: activity.createdAt.toISOString(),
    });
  });

  if (activities.length === 0) {
    sheet.addRow({ name: "No agent activities recorded for this month." });
  }

  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="agent-activities-${month}.xlsx"`,
    },
  });
}
