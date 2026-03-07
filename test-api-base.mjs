import fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts,js}');
let brokenCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // If the file uses API_BASE but doesn't define it
  if (content.includes('${API_BASE}') && !content.includes('const API_BASE')) {
      console.log(`BROKEN (Missing API_BASE): ${file}`);
      brokenCount++;
  }
}

console.log(`Broken files found: ${brokenCount}`);
