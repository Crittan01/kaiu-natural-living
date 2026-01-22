import fetch from 'node-fetch';
import https from 'https';

// SSL Agent Fix for local dev environments
const agent = new https.Agent({ rejectUnauthorized: false });

export default async function handler(req, res) {
  // CORS Headers are handled by Express middleware but good to be safe if Vercel function
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  const SHEET_URL = process.env.NEXT_PUBLIC_SHEETDB_URL;
  
  if (!SHEET_URL) {
      return res.status(500).json({ error: 'SHEETDB_URL missing' });
  }

  try {
    // Support picking a specific sheet tab (e.g. ?sheet=Kits)
    const sheetName = req.query.sheet;
    let fetchUrl = SHEET_URL;

    if (sheetName) {
        // Create URL object to safely append params
        const urlObj = new URL(SHEET_URL);
        urlObj.searchParams.append('sheet', sheetName);
        fetchUrl = urlObj.toString();
        // console.log(`Fetching from sheet: ${sheetName}`);
    }

    const response = await fetch(fetchUrl, { agent });
    
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
