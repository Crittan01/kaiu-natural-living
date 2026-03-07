import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts,js}');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Pattern to match fetch('/api/...') or fetch(`/api/...`)
  // Not matching axios since we set axios.defaults.baseURL
  // 1. fetch('/api/...
  // 2. fetch(`/api/...
  
  if (content.includes("fetch('/api/") || content.includes("fetch(`/api/")) {
    if (!content.includes('import.meta.env.VITE_API_URL')) {
        // Prepend the constant if not exists
        content = "const API_BASE = import.meta.env.VITE_API_URL || '';\n" + content;
    }
    
    content = content.replace(/fetch\(\s*'\/api\//g, "fetch(`${API_BASE}/api/");
    content = content.replace(/fetch\(\s*`\/api\//g, "fetch(`${API_BASE}/api/");
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
    console.log(`Fixed ${file}`);
  }
}

console.log(`Total files fixed: ${changedCount}`);
