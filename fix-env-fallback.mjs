import fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts,js}');
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace `import.meta.env.VITE_API_URL || ''` with `import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://kaiu-api.onrender.com' : 'http://localhost:3001')`
  // But be careful because we might have modified it in different ways.

  // 1. ChatView/ChatList socketUrl fallbacks
  content = content.replace(
      /const socketUrl = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001';/g,
      "const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://kaiu-api.onrender.com' : 'http://localhost:3001');"
  );

  // 2. API_BASE fallbacks
  content = content.replace(
      /const API_BASE = import\.meta\.env\.VITE_API_URL \|\| '';/g,
      "const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://kaiu-api.onrender.com' : '');"
  );
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedCount++;
    console.log(`Updated fallbacks in ${file}`);
  }
}

console.log(`Updated files: ${changedCount}`);
