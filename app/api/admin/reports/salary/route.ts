import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

const HOURLY_RATE_IQD = 6818;

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
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { name: "asc" },
    select: {
      name: true,
      email: true,
      isActive: true,
      attendance: {
        where: { date: { gte: start, lte: end } },
        select: { checkInAt: true, checkOutAt: true },
      },
      leaveDays: {
        where: { date: { gte: start, lte: end } },
        select: { type: true },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Monthly Salary");
  sheet.columns = [
    { header: "Agent", key: "name", width: 28 },
    { header: "Email", key: "email", width: 34 },
    { header: "Account", key: "account", width: 16 },
    { header: "Completed Days", key: "days", width: 18 },
    { header: "Vacation Days", key: "vacationDays", width: 16 },
    { header: "Authorized Absence Days", key: "authorizedAbsenceDays", width: 24 },
    { header: "Hours Worked", key: "hours", width: 18 },
    { header: "Rate (IQD/hour)", key: "rate", width: 20 },
    { header: "Monthly Salary (IQD)", key: "salary", width: 24 },
  ];
  sheet.getRow(1).font = { bold: true };

  let monthHours = 0;
  let monthSalary = 0;
  let monthVacationDays = 0;
  let monthAuthorizedAbsenceDays = 0;

  agents.forEach((agent) => {
    const completedShifts = agent.attendance.filter(
      (record) => record.checkInAt && record.checkOutAt,
    );
    const workedMilliseconds = completedShifts.reduce((total, record) => {
      const duration = record.checkOutAt!.getTime() - record.checkInAt!.getTime();
      return total + Math.max(0, duration);
    }, 0);
    const hoursWorked = workedMilliseconds / 3_600_000;
    const salary = Math.round(hoursWorked * HOURLY_RATE_IQD);
    const vacationDays = agent.leaveDays.filter((leaveDay) => leaveDay.type === "VACATION").length;
    const authorizedAbsenceDays = agent.leaveDays.filter(
      (leaveDay) => leaveDay.type === "AUTHORIZED_ABSENCE",
    ).length;

    monthHours += hoursWorked;
    monthSalary += salary;
    monthVacationDays += vacationDays;
    monthAuthorizedAbsenceDays += authorizedAbsenceDays;

    sheet.addRow({
      name: agent.name,
      email: agent.email,
      account: agent.isActive ? "Active" : "Deactivated",
      days: completedShifts.length,
      vacationDays,
      authorizedAbsenceDays,
      hours: Math.round(hoursWorked * 100) / 100,
      rate: HOURLY_RATE_IQD,
      salary,
    });
  });

  const totalRow = sheet.addRow({
    name: "MONTH TOTAL",
    vacationDays: monthVacationDays,
    authorizedAbsenceDays: monthAuthorizedAbsenceDays,
    hours: Math.round(monthHours * 100) / 100,
    salary: monthSalary,
  });
  totalRow.font = { bold: true };
  sheet.getColumn("hours").numFmt = "0.00";
  sheet.getColumn("rate").numFmt = "#,##0";
  sheet.getColumn("salary").numFmt = "#,##0";

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="salary-${month}.xlsx"`,
    },
  });
}