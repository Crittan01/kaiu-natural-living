import jwt from 'jsonwebtoken';

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

  const { pin } = req.body;
  const ADMIN_PIN = process.env.KAIU_ADMIN_PIN;
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-dev-only'; // En prod debe ser ENV

  if (!ADMIN_PIN) {
      console.error("Falta KAIU_ADMIN_PIN en variables de entorno");
      return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  if (pin !== ADMIN_PIN) {
      // Delay artificial para mitigar fuerza bruta
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ error: 'PIN Incorrecto' });
  }

  // Generar Token (Expira en 24 horas)
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

  return res.status(200).json({ success: true, token });
}
