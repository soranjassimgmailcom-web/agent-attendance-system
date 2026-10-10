import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

type AttendanceReportRow = {
  id: string;
  userId: string;
  date: string;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type LeaveReportRow = {
  id: string;
  userId: string;
  date: string;
  type: "VACATION" | "AUTHORIZED_ABSENCE";
  user: {
    id: string;
    name: string;
    email: string;
  };
};

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
  const start = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
  const end = `${month}-${String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, "0")}`;

  const [records, leaveDays] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "asc" },
    }) as Promise<AttendanceReportRow[]>,
    prisma.leaveDay.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "asc" },
    }) as Promise<LeaveReportRow[]>,
  ]);

  const workbook = new ExcelJS.Workbook();
  const sheetsByDate = new Map<string, ExcelJS.Worksheet>();
  const columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Date", key: "date", width: 15 },
    { header: "Status", key: "status", width: 24 },
    { header: "Check In", key: "checkIn", width: 20 },
    { header: "Check Out", key: "checkOut", width: 20 },
    { header: "Hours", key: "hours", width: 15 },
  ];

  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const sheet = workbook.addWorksheet(date);
    sheet.columns = columns;
    sheetsByDate.set(date, sheet);
  }

  records.forEach((record: AttendanceReportRow) => {
    const sheet = sheetsByDate.get(record.date);
    if (!sheet) return;

    const checkIn = record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : "--";
    const checkOut = record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : "--";

    const totalMinutes =
      record.checkInAt && record.checkOutAt
        ? Math.max(0, (new Date(record.checkOutAt).getTime() - new Date(record.checkInAt).getTime()) / 60000)
        : 0;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const hoursText = `${hours}h ${minutes}m`;

    sheet.addRow({
      name: record.user.name,
      email: record.user.email,
      date: record.date,
      status: "Present",
      checkIn,
      checkOut,
      hours: totalMinutes > 0 ? hoursText : "--",
    });
  });

  leaveDays.forEach((leaveDay) => {
    const sheet = sheetsByDate.get(leaveDay.date);
    if (!sheet) return;

    sheet.addRow({
      name: leaveDay.user.name,
      email: leaveDay.user.email,
      date: leaveDay.date,
      status: leaveDay.type === "VACATION" ? "Vacation" : "Authorized absence",
      checkIn: "--",
      checkOut: "--",
      hours: "--",
    });
  });

  sheetsByDate.forEach((sheet) => {
    if (sheet.rowCount === 1) {
      sheet.addRow({ name: "No attendance or time-off records" });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${month}.xlsx"`,
    },
  });
}