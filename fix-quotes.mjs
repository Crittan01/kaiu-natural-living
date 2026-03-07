import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts,js}');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Find mixed quotes: fetch(`${API_BASE}/api/some-endpoint',
  // and replace with: fetch(`${API_BASE}/api/some-endpoint`,
  content = content.replace(/fetch\(`\$\{API_BASE\}\/api\/([^']+)'/g, "fetch(`${API_BASE}/api/$1`");

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
    console.log(`Fixed quotes in ${file}`);
  }
}

console.log(`Total files fixed: ${changedCount}`);
