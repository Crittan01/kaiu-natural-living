import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Leer API Key de .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/VENNDELO_API_KEY=(.+)/);
  if (match) {
    apiKey = match[1].trim();
    // Remove quotes if user added them
    apiKey = apiKey.replace(/^['"]|['"]$/g, '');
  }
} catch (error) {
  console.error('Error leyendo .env.local:', error.message);
  process.exit(1);
}

if (!apiKey || apiKey === 'pega_tu_api_key_aqui_sin_comillas') {
  console.error('ERROR: No se encontró una API Key válida en .env.local');
  process.exit(1);
}

console.log(`API Key detectada (Longitud: ${apiKey.length})`);

// 2. Función para obtener ciudades paginadas
async function fetchAllCities() {
  let allCities = [];
  let pageToken = '';
  let hasMore = true;
  let pageCount = 0;

  console.log('Iniciando descarga de ciudades de Venndelo...');

  while (hasMore) {
    pageCount++;
    // Usamos params default para evitar errores
    const url = `https://api.venndelo.com/v1/admin/region/cities?page_size=250${pageToken ? `&page_token=${pageToken}` : ''}`;
    console.log(`Solicitando página ${pageCount} a ${url}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-Venndelo-Api-Key': apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const cities = data.items || [];
      allCities = [...allCities, ...cities];

      console.log(`Recibidas ${cities.length} ciudades.`);

      pageToken = data.next_page_token;
      if (!pageToken || cities.length === 0) {
        hasMore = false;
      }
    } catch (error) {
      console.error('Error en la petición:', error);
      hasMore = false; 
    }
  }

  // 3. Procesar y Guardar
  if (allCities.length === 0) {
      console.error("No se descargó ninguna ciudad. Abortando guardado.");
      return;
  }

  const locations = {};

  allCities.forEach(city => {
    if (city.country_code !== 'CO') return;

    const deptCode = city.subdivision_code;
    const deptName = city.subdivision_name;

    if (!locations[deptCode]) {
      locations[deptCode] = {
        code: deptCode,
        name: deptName,
        cities: []
      };
    }

    locations[deptCode].cities.push({
      code: city.code,
      name: city.name
    });
  });

  const sortedLocations = Object.values(locations).sort((a, b) => a.name.localeCompare(b.name));
  
  sortedLocations.forEach(dept => {
    dept.cities.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Asegurar que existe el directorio
  const outputDir = path.resolve(__dirname, '../src/lib');
  if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'locations.json');
  fs.writeFileSync(outputPath, JSON.stringify(sortedLocations, null, 2));
  
  console.log(`¡Éxito! ${allCities.length} ciudades procesadas y guardadas en src/lib/locations.json`);
}

fetchAllCities();
