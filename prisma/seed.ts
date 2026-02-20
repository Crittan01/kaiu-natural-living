/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Initial Product Data (Static / Minimal)
const INITIAL_PRODUCTS = [
    {
        sku: 'ACE-LAV-10ML',
        name: 'Aceite Esencial de Lavanda',
        slug: 'aceite-esencial-lavanda',
        description: 'Aceite 100% puro para relajación y sueño profundo.',
        benefits: 'Sueño, Relajación, Ansiedad',
        price: 45000,
        stock: 100,
        category: 'Aceites Esenciales',
        variantName: 'Gotero 10ml',
        weight: 0.2,
        width: 10,
        height: 10,
        length: 10,
        images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=1000']
    },
    {
        sku: 'KIT-SUEÑO-PRO',
        name: 'Kit Sueño Profundo',
        slug: 'kit-sueno-profundo',
        description: 'La combinación perfecta para descansar mejor.',
        benefits: 'Sueño reparador, Calma mental',
        price: 85000,
        stock: 50,
        category: 'Kits',
        variantName: 'Standard',
        weight: 0.5,
        width: 15,
        height: 10,
        length: 20,
        images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1000']
    }
];

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed Products
  console.log(`📦 Seeding ${INITIAL_PRODUCTS.length} products...`);
  for (const p of INITIAL_PRODUCTS) {
      await prisma.product.upsert({
          where: { sku: p.sku },
          update: {}, // Don't overwrite if exists
          create: p
      });
  }
  console.log('✅ Products seeded.');

  // 2. Seed Admin Users
  let adminUsers = [];
  try {
      if (process.env.KAIU_ADMIN_USERS) {
          adminUsers = JSON.parse(process.env.KAIU_ADMIN_USERS);
      }
  } catch (e) { console.warn("Invalid Admin JSON env"); }

  if (adminUsers.length > 0) {
      console.log(`🔐 Seeding ${adminUsers.length} Admin Users...`);
      for (const u of adminUsers) {
          if (!u.username || !u.pin) continue;
          const hashedPassword = await bcrypt.hash(u.pin, 10);
          
          await prisma.user.upsert({
              where: { email: u.username },
              update: { password: hashedPassword, role: 'ADMIN' },
              create: {
                  email: u.username,
                  password: hashedPassword,
                  name: `Admin ${u.username}`,
                  role: 'ADMIN'
              }
          });
          console.log(`✅ Admin synced: ${u.username}`);
      }
  }

  console.log('🏁 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
