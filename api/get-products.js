import fetch from 'node-fetch';
import https from 'https';

// SSL Agent Fix for local dev environments
const agent = new https.Agent({ rejectUnauthorized: false });

export default async function handler(req, res) {
  // CORS Headers are handled by Express middleware but good to be safe if Vercel function
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  const SHEET_URL = process.env.NEXT_PUBLIC_SHEETDB_URL;
  
  if (!SHEET_URL) {
      return res.status(500).json({ error: 'SHEETDB_URL missing' });
  }

  try {
    const response = await fetch(SHEET_URL, { agent });
    
    if (!response.ok) {
        throw new Error(`SheetDB responded with ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("PROXY ERROR:", error);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
}
