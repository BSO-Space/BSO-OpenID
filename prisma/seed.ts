// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. สร้าง Permissions
  await prisma.permission.createMany({
    data: [
      { name: "read:user", description: "Permission to read user information" },
      { name: "edit:user", description: "Permission to edit user information" },
      { name: "delete:user", description: "Permission to delete user" },
      { name: "manage:role", description: "Permission to manage roles" },
    ],
    skipDuplicates: true, // ข้ามถ้ามี Permission นี้อยู่แล้ว
  });

  // ดึง ID ของ Permissions ที่ต้องการเชื่อมโยงกับ Admin role
  const readUserPermission = await prisma.permission.findUnique({
    where: { name: "read:user" },
  });
  const editUserPermission = await prisma.permission.findUnique({
    where: { name: "edit:user" },
  });
  const deleteUserPermission = await prisma.permission.findUnique({
    where: { name: "delete:user" },
  });
  const manageRolePermission = await prisma.permission.findUnique({
    where: { name: "manage:role" },
  });

  // 2. สร้าง Roles และเชื่อมโยงกับ Permissions
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Administrator with full access",
      permissions: {
        create: [
          {
            permission: {
              connect: { id: readUserPermission?.id },
            },
          },
          {
            permission: {
              connect: { id: editUserPermission?.id },
            },
          },
          {
            permission: {
              connect: { id: deleteUserPermission?.id },
            },
          },
          {
            permission: {
              connect: { id: manageRolePermission?.id },
            },
          },
        ],
      },
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: {
      name: "User",
      description: "Standard user with limited access",
      permissions: {
        create: [
          {
            permission: {
              connect: { id: readUserPermission?.id },
            },
          },
        ],
      },
    },
  });

  // 3. สร้าง Services
  const authService = await prisma.service.upsert({
    where: { name: "Authentication Service" },
    update: {},
    create: {
      name: "Authentication Service",
      description: "Service for user authentication and authorization",
      public: false,
    },
  });

  // 4. สร้าง Users และเชื่อมโยง Roles
  const user1 = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
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
      userServices: {
        create: [{ service: { connect: { name: "Authentication Service" } } }],
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      username: "regularUser",
      firstName: "Regular",
      lastName: "User",
      email: "user@example.com",
      image: "https://example.com/user.png",
      userRoles: {
        create: [{ role: { connect: { name: "User" } } }],
      },
      userServices: {
        create: [{ service: { connect: { name: "Authentication Service" } } }],
      },
    },
  });

  // 5. สร้าง Accounts สำหรับ Users
  await prisma.account.upsert({
    where: { providerAccountId: "discord-admin-123" },
    update: {},
    create: {
      provider: "discord",
      providerAccountId: "discord-admin-123",
      user: { connect: { id: user1.id } },
    },
  });

  await prisma.account.upsert({
    where: { providerAccountId: "google-user-456" },
    update: {},
    create: {
      provider: "google",
      providerAccountId: "google-user-456",
      user: { connect: { id: user2.id } },
    },
  });

  // 6. สร้าง Refresh Token สำหรับ Users
  await prisma.refreshToken.createMany({
    data: [
      {
        userId: user1.id,
        token: "admin-refresh-token",
        issuedAt: new Date(),
        expiresAt: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
      },
      {
        userId: user2.id,
        token: "user-refresh-token",
        issuedAt: new Date(),
        expiresAt: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
      },
    ],
    skipDuplicates: true,
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
