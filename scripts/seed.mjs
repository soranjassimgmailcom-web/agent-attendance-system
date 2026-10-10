import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set in .env before seeding.`);
  }

  return value;
}

async function main() {
  const adminEmail = getRequiredEnv("ADMIN_EMAIL");
  const adminPassword = getRequiredEnv("ADMIN_PASSWORD");
  const agentEmail = getRequiredEnv("AGENT_EMAIL");
  const agentPassword = getRequiredEnv("AGENT_PASSWORD");

  if (adminPassword.length < 16 || agentPassword.length < 16) {
    throw new Error("ADMIN_PASSWORD and AGENT_PASSWORD must each be at least 16 characters.");
  }

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  const hashedAgentPassword = await bcrypt.hash(agentPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "System Admin",
      password: hashedAdminPassword,
      role: "ADMIN",
    },
    create: {
      name: "System Admin",
      email: adminEmail,
      password: hashedAdminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: agentEmail },
    update: {
      name: "Sample Agent",
      password: hashedAgentPassword,
      role: "AGENT",
    },
    create: {
      name: "Sample Agent",
      email: agentEmail,
      password: hashedAgentPassword,
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
