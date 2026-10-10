import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  await prisma.user.upsert({
    where: { email: "admin@projectsystem.com" },
    update: {
      name: "System Admin",
      password: adminPassword,
      role: "ADMIN",
    },
    create: {
      name: "System Admin",
      email: "admin@projectsystem.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@projectsystem.com" },
    update: {
      name: "Sample Agent",
      password: agentPassword,
      role: "AGENT",
    },
    create: {
      name: "Sample Agent",
      email: "agent@projectsystem.com",
      password: agentPassword,
      role: "AGENT",
    },
  });

  console.log("Seed complete. Admin and agent test accounts are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
