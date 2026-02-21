import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // CORS Helper
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { username, password } = req.body; // 'username' here is used as 'email'
  
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-dev-only'; 
  
  console.log(`🔑 Login Attempt: User=${username}`);

  if (!username || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
      // 1. Buscar usuario en DB por email
      const user = await prisma.user.findUnique({
          where: { email: username.toLowerCase().trim() }
      });

      // 2. Verificar existencia
      if (!user) {
          console.warn(`❌ Login: User not found (${username})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Anti-timing attack
          return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // 3. Verificar Password (Hash)
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
          console.warn(`❌ Login: Invalid Password for (${username})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // 4. Se eliminó la restricción rígida de (user.role !== 'ADMIN') 
      // porque el ProtectedRoute en el Frontend ahora se encarga 
      // del Control de Acceso Basado en Roles (RBAC) para ADMIN, WAREHOUSE y SUPPORT.

      console.log(`✅ Login Success: ${username} | Role: ${user.role}`);

      // 5. Generar Token
      const token = jwt.sign(
          { 
              userId: user.id, 
              role: user.role, 
              email: user.email 
          }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
      );

      return res.status(200).json({ 
          success: true, 
          token,
          user: {
              username: user.email,
              role: user.role,
              name: user.name
          }
      });

  } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({ error: "Error en servidor" });
  }
}
