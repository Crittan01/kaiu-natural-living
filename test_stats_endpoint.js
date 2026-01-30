import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const secret = process.env.JWT_SECRET || 'fallback-secret-dev-only';
const token = jwt.sign({ user: 'test-admin', role: 'admin' }, secret, { expiresIn: '1h' });

console.log(`🔑 Generated Test Token: ${token.substring(0, 20)}...`);

async function testStats() {
    try {
        console.log("📡 Requesting Dashboard Stats...");
        const response = await fetch('http://localhost:3001/api/admin/dashboard-stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const status = response.status;
        console.log(`📊 Status Code: ${status}`);

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log("✅ Response Body (JSON):", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("❌ Response Body (Raw Text):", text);
        }

    } catch (error) {
        console.error("❌ Request Failed:", error.message);
    }
}

testStats();
