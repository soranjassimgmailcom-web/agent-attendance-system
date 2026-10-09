import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  await prisma.user.upsert({
    where: { email: "admin@bardarash.co" },
    update: {
      name: "System Admin",
      password: adminPassword,
      role: "ADMIN",
    },
    create: {
      name: "System Admin",
      email: "admin@bardarash.co",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@bardarash.co" },
    update: {
      name: "Sample Agent",
      password: agentPassword,
      role: "AGENT",
    },
    create: {
      name: "Sample Agent",
      email: "agent@bardarash.co",
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
