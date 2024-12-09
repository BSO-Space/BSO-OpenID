import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Permissions
  const permissions = [
    { name: 'user:read', description: 'Allows reading user information' },
    { name: 'user:write', description: 'Allows writing user information' },
    { name: 'service:read', description: 'Allows reading service information' },
    { name: 'service:write', description: 'Allows writing service information' },
  ];

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });
  console.log(`Created permissions: ${permissions.map((p) => p.name).join(', ')}`);

  // 2. Create Roles
  const role = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Administrator with all permissions',
    },
  });
  console.log(`Created role: ${role.name}`);

  // Assign Permissions to Role
  const permissionRecords = await prisma.permission.findMany();
  const rolePermissions = permissionRecords.map((permission) => ({
    roleId: role.id,
    permissionId: permission.id,
  }));
  await prisma.rolePermission.createMany({
    data: rolePermissions,
    skipDuplicates: true,
  });
  console.log(`Assigned permissions to role: ${role.name}`);

  // 3. Create User
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password123', // Replace with a hashed password in production
      userStatus: 'active',
    },
  });
  console.log(`Created user: ${user.username}`);

  // Assign Role to User
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  });
  console.log(`Assigned role to user: ${user.username}`);

  // 4. Create Service
  const service = await prisma.service.create({
    data: {
      name: 'attendify',
      description: 'A service for managing attendance.',
      public: true,
      image: 'https://example.com/images/attendify.png',
      microServicesUrl: ['https://attendify.example.com'],
      publicKeys: "q", // Add appropriate public keys here
    },
  });
  console.log(`Created service: ${service.name}`);

  // Assign Permissions to Service
  const servicePermissions = permissionRecords.map((permission) => ({
    serviceId: service.id,
    permissionId: permission.id,
  }));
  await prisma.servicePermission.createMany({
    data: servicePermissions,
    skipDuplicates: true,
  });
  console.log(`Assigned permissions to service: ${service.name}`);

  // 5. Assign Service to User
  await prisma.userService.create({
    data: {
      userId: user.id,
      serviceId: service.id,
    },
  });
  console.log(`Assigned service to user: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
