import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const payload = {
    name: "Aceite Vegetal de Manzanilla",
    sku: "AV-MAN-GOT-100ML",
    price: 60000,
    stock: 10,
    description: "El aceite vegetal de manzanilla es conocido por su suavidad y uso tradicional en pieles sensibles.",
    benefits: "Calma, confort, cuidado delicado",
    category: "Aceites Vegetales",
    variantName: "Gotero 100ml"
};

// Use the correct token manually loaded from .env.local
const token = process.env.KAIU_ADMIN_TOKEN;

async function test() {
    console.log("Using Token from ENV:", token ? "Present" : "Missing");
    const res = await fetch('http://localhost:8080/api/admin/inventory', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // This needs to match localStorage
        },
        body: JSON.stringify(payload)
    });
    
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("RAW RESPONSE:", text);
}

test();
