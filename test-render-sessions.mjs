import axios from 'axios';
import https from 'https';

const agent = new https.Agent({  
  rejectUnauthorized: false
});

async function test() {
  try {
    console.log("Logging into Render API...");
    const loginRes = await axios.post('https://kaiu-api.onrender.com/api/admin/login', {
      username: 'admin',
      password: process.env.ADMIN_PASSWORD || '1234'
    }, { httpsAgent: agent });
    
    const token = loginRes.data.token;
    console.log("Got token.");
    
    console.log("Fetching /api/sessions from Render...");
    const sessionRes = await axios.get('https://kaiu-api.onrender.com/api/sessions', {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: agent
    });
    
    console.log("Success! Sessions Count:", sessionRes.data.length);
  } catch (e) {
    if (e.response) {
       console.error("API Error:", e.response.status, e.response.data);
    } else {
       console.error("Network Error:", e.message);
    }
  }
}
test();
