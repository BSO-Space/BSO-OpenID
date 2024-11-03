// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. สร้าง Permissions
  const permissions = await prisma.permission.createMany({
    data: [
      { name: "read:user", description: "Permission to read user information" },
      { name: "edit:user", description: "Permission to edit user information" },
      { name: "delete:user", description: "Permission to delete user" },
      { name: "manage:role", description: "Permission to manage roles" },
    ],
    skipDuplicates: true, // ข้ามถ้ามี Permission นี้อยู่แล้ว
  });

  // 2. สร้าง Roles และเชื่อมโยงกับ Permissions
  const adminRole = await prisma.role.create({
    data: {
      name: "Admin",
      description: "Administrator with full access",
      permissions: {
        create: [
          { permission: { connect: { name: "read:user" } } },
          { permission: { connect: { name: "edit:user" } } },
          { permission: { connect: { name: "delete:user" } } },
          { permission: { connect: { name: "manage:role" } } },
        ],
      },
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: "User",
      description: "Standard user with limited access",
      permissions: {
        create: [{ permission: { connect: { name: "read:user" } } }],
      },
    },
  });

  // 3. สร้าง Services และกำหนด Roles ที่มีสิทธิ์เข้าถึงแต่ละ Service
  const authService = await prisma.service.create({
    data: {
      name: "Authentication Service",
      description: "Service for user authentication and authorization",
      serviceRoles: {
        create: [
          { role: { connect: { name: "Admin" } } },
          { role: { connect: { name: "User" } } },
        ],
      },
    },
  });

  // 4. สร้าง Users
  const user1 = await prisma.user.create({
    data: {
      username: "adminUser",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      image: "https://example.com/admin.png",
      userRoles: {
        create: [
          { role: { connect: { name: "Admin" } } }, // เชื่อมโยงกับ Admin role
        ],
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "regularUser",
      firstName: "Regular",
      lastName: "User",
      email: "user@example.com",
      image: "https://example.com/user.png",
      userRoles: {
        create: [
          { role: { connect: { name: "User" } } }, // เชื่อมโยงกับ User role
        ],
      },
    },
  });

  // 5. สร้าง Accounts สำหรับ Users
  await prisma.account.create({
    data: {
      provider: "discord",
      providerAccountId: "discord-admin-123",
      user: { connect: { id: user1.id } },
    },
  });

  await prisma.account.create({
    data: {
      provider: "google",
      providerAccountId: "google-user-456",
      user: { connect: { id: user2.id } },
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
