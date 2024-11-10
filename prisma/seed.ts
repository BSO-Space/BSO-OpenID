// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create Permissions
  await prisma.permission.createMany({
    data: [
      { name: "read:user", description: "Permission to read user information" },
      { name: "edit:user", description: "Permission to edit user information" },
      { name: "delete:user", description: "Permission to delete user" },
      { name: "manage:role", description: "Permission to manage roles" },
    ],

    // Skip duplicates if they already exist
    skipDuplicates: true,
  });

  // 2. Create Roles and associate with Permissions
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

  // Create Admin role with full access
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

  // Create User role with limited access
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

  // Create service
  const bsoBlog = await prisma.service.create({
    data: {
      name: "blog",
      description: "Service for BSO Blog",
      microServicesUrl: ["http://localhost:3005"],
      public: true,
    },
  });

  const portHive = await prisma.service.create({
    data: {
      name: "portHive",
      description: "Service for Port Hive",
      microServicesUrl: ["http://localhost:3005"],
      public: false,
    },
  });

  const chat = await prisma.service.create({
    data: {
      name: "chat",
      description: "Service for chat",
      microServicesUrl: ["http://localhost:3001"],
      public: false,
    },
  });

  // Create Users and associate with Roles and Services
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
        create: [{ role: { connect: { name: "Admin" } } }],
      },
      userServices: {
        create: [{ service: { connect: { name: "blog" } } }],
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
        create: [{ service: { connect: { name: "blog" } } }],
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
