const fetch = require('node-fetch');

async function test() {
  const loginRes = await fetch('http://localhost:3001/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '1234' })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData.token ? 'Success' : loginData);

  const invRes = await fetch('http://localhost:3001/api/admin/inventory', {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  console.log('Inventory Status:', invRes.status);
  const invData = await invRes.text();
  console.log('Inventory Data (first 200 chars):', invData.substring(0, 200));
}
test();
