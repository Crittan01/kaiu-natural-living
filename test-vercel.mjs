import axios from 'axios';

async function check() {
  try {
    const htmlRes = await axios.get('https://kaiu-natural-living.vercel.app/admin');
    console.log("HTML fetched. Length:", htmlRes.data.length);
    
    // Find script tags
    const scriptRegex = /<script type="module" crossorigin src="([^"]+)"><\/script>/g;
    let match;
    while ((match = scriptRegex.exec(htmlRes.data)) !== null) {
      console.log("Found script:", match[1]);
      const jsRes = await axios.get(`https://kaiu-natural-living.vercel.app${match[1]}`);
      const js = jsRes.data;
      if (js.includes('/api/sessions')) {
        console.log(`Matched /api/sessions in ${match[1]}`);
        
        // Let's see if it's prepended with API_BASE or if it's raw
        const idx = js.indexOf('/api/sessions');
        console.log("Surrounding code:", js.substring(idx - 40, idx + 40));
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}
check();
