import axios from 'axios';

axios.defaults.baseURL = 'https://kaiu-api.onrender.com';
const API_BASE = 'https://kaiu-api.onrender.com';

// Does it form https://kaiu-api.onrender.com/api/sessions or double it?
try {
  await axios.get(`${API_BASE}/api/sessions`);
  console.log("Absolute URL Request succeeded.");
} catch (error) {
  console.log("Absolute URL Request failed:", error.message);
}

try {
  await axios.get('/api/sessions');
  console.log("Relative URL Request succeeded.");
} catch (error) {
  console.log("Relative URL Request failed:", error.message);
}
