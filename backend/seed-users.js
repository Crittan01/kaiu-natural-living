import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('1234', 10);

  console.log('Seeding test users...');

  // 1. ADMIN
  await prisma.user.upsert({
    where: { email: 'admin' },
    update: { password, role: 'ADMIN' },
    create: {
      email: 'admin',
      password,
      name: 'Super Admin',
      role: 'ADMIN'
    }
  });

  // 2. WAREHOUSE
  await prisma.user.upsert({
    where: { email: 'bodega' },
    update: { password, role: 'WAREHOUSE' },
    create: {
      email: 'bodega',
      password,
      name: 'Encargado Bodega',
      role: 'WAREHOUSE'
    }
  });

  // 3. SUPPORT
  await prisma.user.upsert({
    where: { email: 'soporte' },
    update: { password, role: 'SUPPORT' },
    create: {
      email: 'soporte',
      password,
      name: 'Agente Soporte',
      role: 'SUPPORT'
    }
  });

  console.log('Test users created successfully!');
  console.log('-----------------------------------');
  console.log('Usuario: admin   | PIN: 1234 | Rol: ADMIN (Ve todo)');
  console.log('Usuario: bodega  | PIN: 1234 | Rol: WAREHOUSE (Solo Ordenes/Inventario)');
  console.log('Usuario: soporte | PIN: 1234 | Rol: SUPPORT (Solo Chats/Conocimiento)');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
