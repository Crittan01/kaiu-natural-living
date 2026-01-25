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

  const { username, pin } = req.body;
  
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-dev-only'; 
  
  let validUsers = [];
  try {
      validUsers = JSON.parse(process.env.KAIU_ADMIN_USERS || '[]');
  } catch (e) {
      console.error("Error parsing KAIU_ADMIN_USERS", e);
  }

  // Fallback if env is missing (Safety)
  if (validUsers.length === 0) {
      // Legacy or Default
      validUsers.push({ 
          username: process.env.KAIU_ADMIN_USER || 'kaiu', 
          pin: process.env.KAIU_ADMIN_PIN || '5411' 
      });
  }

  // Find user
  const userMatch = validUsers.find(u => 
      u.username.toLowerCase() === username?.toLowerCase().trim() && 
      u.pin === pin
  );

  if (!userMatch) {
      // Delay artificial para mitigar fuerza bruta
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ error: 'Usuario o PIN Incorrecto' });
  }

  // Generar Token con Role y Username (para logs futuros)
  const token = jwt.sign({ role: 'admin', user: userMatch.username }, JWT_SECRET, { expiresIn: '24h' });

  return res.status(200).json({ 
      success: true, 
      token,
      user: {
          username: userMatch.username,
          role: 'admin' // Future proofing
      }
  });
}
