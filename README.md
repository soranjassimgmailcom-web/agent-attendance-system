import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

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

  const agentPassword = await bcrypt.hash("agent123", 10);

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

  console.log("Seed complete. Default admin: admin@bardarash.co / admin123");
  console.log("Default agent: agent@bardarash.co / agent123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
