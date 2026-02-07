/// <reference types="node" />
import { PrismaClient, Prisma } from '@prisma/client';
import 'dotenv/config';

// ------------------------------------------------------------------
// CONFIGURACION HTTPS AGENT (Solo si es necesario para certificados self-signed o raros)
// Para SheetDB y Supabase, native fetch suele bastar.
// Solución para entorno de desarrollo con proxy/SSL estricto:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 
// ------------------------------------------------------------------

const prisma = new PrismaClient();

const SHEETDB_URL = "https://sheetdb.io/api/v1/glilzl705s35r";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           
    .replace(/[^\w-]+/g, '')       
    .replace(/--+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

// Basic interface for SheetDB response
interface SheetRow {
  SKU: string;
  NOMBRE: string;
  PRECIO: string;
  DESCRIPCION_LARGA: string;
  DESCRIPCION_CORTA: string;
  BENEFICIOS: string;
  STOCK: string;
  CATEGORIA: string;
  IMAGEN_URL: string;
  VARIANTES: string;
  
  // Logística
  PESO: string;
  ALTO: string;
  ANCHO: string;
  LARGO: string;
}

async function main() {
  console.log('🌱 Starting seed...');
  console.log(`📡 Fetching data from SheetDB: ${SHEETDB_URL}`);

  try {
    // Native Node 18+ fetch (no extra import needed)
    const response = await fetch(SHEETDB_URL);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    // Type saftey for JSON response
    const data = (await response.json()) as SheetRow[]; 
    console.log(`📦 Found ${data.length} products to migrate.`);

    for (const item of data) {
      const price = parseInt(item.PRECIO) || 0;
      
      // Smart Logic: Detect Container Type (Roll-on / Gotero)
      let containerType = "";
      if (item.SKU.includes('ROL') || (item.NOMBRE || '').toLowerCase().includes('roll-on')) {
          containerType = "Roll-on";
      } else if (item.SKU.includes('GOT') || item.SKU.includes('ACE') || (item.NOMBRE || '').toLowerCase().includes('gotero')) {
          containerType = "Gotero";
      }

      // Logic to determine the final variant name to store
      const skuParts = item.SKU.split('-');
      const lastPart = skuParts.length > 1 ? skuParts[skuParts.length - 1] : item.SKU;
      
      let variantName = item.VARIANTES?.trim();
      
      if (!variantName) {
         variantName = containerType ? `${containerType} ${lastPart}` : lastPart;
      }
      
      const slug = slugify(item.NOMBRE || '') + '-' + slugify(item.SKU || '');

      // Upsert: Create if new, Update if exists
      // Note: variantName is now stored explicitly
      await prisma.product.upsert({
        where: { sku: item.SKU },
        update: {
            name: item.NOMBRE,
            variantName: variantName, // STORED IN DB
            description: item.DESCRIPCION_LARGA || item.DESCRIPCION_CORTA,
            benefits: item.BENEFICIOS, 
            price: price,
            stock: item.STOCK === 'DISPONIBLE' ? 100 : 0,
            category: item.CATEGORIA,
             // Update images only if provided, else keep existing
            // Logistics Update
            weight: parseFloat((item.PESO || "0").toString().replace(',', '.')) || undefined,
            width: parseFloat((item.ANCHO || "0").toString().replace(',', '.')) || undefined,
            height: parseFloat((item.ALTO || "0").toString().replace(',', '.')) || undefined,
            length: parseFloat((item.LARGO || "0").toString().replace(',', '.')) || undefined,

            ...(item.IMAGEN_URL ? { images: [item.IMAGEN_URL] } : {})
        } as Prisma.ProductUpdateInput,
        create: {
            sku: item.SKU,
            name: item.NOMBRE,
            variantName: variantName, // STORED IN DB
            slug: slug,
            description: item.DESCRIPCION_LARGA || item.DESCRIPCION_CORTA,
            benefits: item.BENEFICIOS, 
            price: price,
            stock: item.STOCK === 'DISPONIBLE' ? 100 : 0,
            category: item.CATEGORIA,
            weight: parseFloat((item.PESO || "0.2").toString().replace(',', '.')) || 0.2,
            width: parseFloat((item.ANCHO || "10").toString().replace(',', '.')) || 10,
            height: parseFloat((item.ALTO || "10").toString().replace(',', '.')) || 10,
            length: parseFloat((item.LARGO || "10").toString().replace(',', '.')) || 10,
            images: item.IMAGEN_URL ? [item.IMAGEN_URL] : []
        } as Prisma.ProductCreateInput
      });
      console.log(`✅ Synced: ${item.NOMBRE}`);
    }
    
    console.log('🏁 Seeding finished.');

    // ---------------------------------------------------------
    // SEED ADMIN USER
    // ---------------------------------------------------------
    let adminUsers: { username: string; pin: string }[] = [];

    // Validar si es JSON (Nuevo formato)
    if (process.env.KAIU_ADMIN_USERS && process.env.KAIU_ADMIN_USERS.startsWith('[')) {
       try {
          adminUsers = JSON.parse(process.env.KAIU_ADMIN_USERS);
       } catch (e) {
          console.error("Error parsing KAIU_ADMIN_USERS JSON:", e);
       }
    } 
    // Fallback Legacy (Usuario único o formato simple)
    else if (process.env.KAIU_ADMIN_USER && process.env.KAIU_ADMIN_PIN) {
        adminUsers.push({
            username: process.env.KAIU_ADMIN_USER,
            pin: process.env.KAIU_ADMIN_PIN
        });
    }

    if (adminUsers.length > 0) {
        console.log(`🔐 Seeding ${adminUsers.length} Admin Users...`);
        const bcrypt = await import('bcryptjs');

        for (const u of adminUsers) {
            if (!u.username || !u.pin) continue;
            
            const hashedPassword = await bcrypt.hash(u.pin, 10);
            
            await prisma.user.upsert({
                where: { email: u.username }, // Usamos username como email para login
                update: {
                    password: hashedPassword,
                    role: 'ADMIN'
                },
                create: {
                    email: u.username,
                    password: hashedPassword,
                    name: `Admin ${u.username}`,
                    role: 'ADMIN'
                }
            });
            console.log(`✅ Admin upserted: ${u.username}`);
        }
    } else {
        console.warn("⚠️ No Admin credentials found in env. Skipping Admin seed.");
    }

  } catch (error) {
    console.error('❌ Error seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
