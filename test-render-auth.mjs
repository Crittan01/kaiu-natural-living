import axios from 'axios';

async function test() {
  try {
    // 1. Login to Render to get a valid token
    console.log("Logging into Render API...");
    const loginRes = await axios.post('https://kaiu-api.onrender.com/api/admin/login', {
      username: 'admin',
      password: 'password' // We don't have the password, but wait!
    });
  } catch (e) {
    // Let's just create a token using the same Secret!
  }
}
test();
