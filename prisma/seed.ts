import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding permission and role database...');

    // Define permissions based on all entities
    const permissions = [
        // User Permissions
        { name: 'read:user', description: 'Allows reading user information' },
        { name: 'write:user', description: 'Allows writing user information' },
        { name: 'delete:user', description: 'Allows deleting user information' },
        { name: 'manage:user', description: 'Allows managing user-related actions' },

        // Role Permissions
        { name: 'read:role', description: 'Allows reading role information' },
        { name: 'write:role', description: 'Allows writing role information' },
        { name: 'delete:role', description: 'Allows deleting role information' },
        { name: 'manage:role', description: 'Allows managing roles and permissions' },

        // Permission Permissions
        { name: 'read:permission', description: 'Allows reading permission information' },
        { name: 'write:permission', description: 'Allows writing permission information' },
        { name: 'delete:permission', description: 'Allows deleting permission information' },
        { name: 'manage:permission', description: 'Allows managing permissions' },

        // Service Permissions
        { name: 'read:service', description: 'Allows reading service information' },
        { name: 'write:service', description: 'Allows writing service information' },
        { name: 'delete:service', description: 'Allows deleting service information' },
        { name: 'manage:service', description: 'Allows managing services and APIs' },

        // Key Permissions
        { name: 'read:keys', description: 'Allows reading key information' },
        { name: 'write:keys', description: 'Allows writing key information' },
        { name: 'delete:keys', description: 'Allows deleting key information' },
        { name: 'manage:keys', description: 'Allows managing keys' },

        // key Permissions
        { name: 'manage:keys', description: 'Allows manage key information' },
        { name: 'manage:keys:read', description: 'Allows reading key information' },
        { name: 'manage:keys:write', description: 'Allows writing key information' },

        // Logs Permissions
        { name: 'read:logs', description: 'Allows reading audit logs' },
        { name: 'delete:logs', description: 'Allows deleting audit logs' },
    ];

    // Create permissions
    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { name: permission.name },
            update: {},
            create: permission,
        });
    }
    console.log('Permissions seeded successfully.');

    // Define BSO-Admin role
    const adminRole = await prisma.role.upsert({
        where: { name: 'BSO-Admin' },
        update: {},
        create: {
            name: 'BSO-Admin',
            description: 'Administrator role with full permissions',
        },
    });
    console.log(`Role seeded: ${adminRole.name}`);

    // Assign all permissions to BSO-Admin role
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        });
    }
    console.log('All permissions assigned to BSO-Admin role.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
