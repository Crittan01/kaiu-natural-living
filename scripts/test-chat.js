
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api/chat';

async function chat(message, history = []) {
    console.log(`\n🧑 User: ${message}`);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history })
        });
        const data = await res.json();
        console.log(`🤖 Sara: ${data.text}`);
        if (data.product) {
            console.log(`📦 CARD: [Title: ${data.product.title}, Price: ${data.product.price}, Image: ${data.product.image}]`);
        } else {
            console.log(`📦 CARD: null`);
        }
        return { role: 'assistant', content: data.text };
    } catch (e) {
        console.error("❌ Error:", e.message);
        return null;
    }
}

async function runTest() {
    let history = [];
    
    // Turn 1: Ask for Lavender
    const msg1 = { role: 'user', content: 'tienes aceite de lavanda?' };
    history.push(msg1);
    const res1 = await chat(msg1.content, []);
    if (res1) history.push(res1);

    // Turn 2: Ask for Photos (Context Test)
    // const msg2 = { role: 'user', content: 'fotos?' };
    // history.push(msg2);
    // const res2 = await chat(msg2.content, history);
    // if (res2) history.push(res2);
    
    // Turn 3: Consistency Check (Availability)
    console.log("\n--- Testing Topic Lock (Availability) ---");
    const msg3 = { role: 'user', content: 'disponibilidad' };
    history.push(msg3);
    const res3 = await chat(msg3.content, history);
    if (res3) history.push(res3);

    // Turn 4: Lemon Hallucination Check
    // Flow: Tienes Lavanda? -> (Bot says yes) -> y esencial? -> (Bot says yes) -> fotos?
    // Should NOT show Lemon.
    console.log("\n--- Testing Lemon Hallucination (Strict Filter) ---");
    // Reset history for clean test
    let history2 = [];
    const m1 = { role: 'user', content: 'tienes aceite de lavanda?' };
    history2.push(m1);
    const r1 = await chat(m1.content, []); // Context: Lavanda
    if (r1) history2.push(r1);

    const m2 = { role: 'user', content: 'y esencial' }; // Context: Esencial Lavanda
    history2.push(m2);
    const r2 = await chat(m2.content, history2);
    if (r2) history2.push(r2);

    const m3 = { role: 'user', content: 'fotos' }; // Should trigger filter for "Lavanda"
    history2.push(m3);
    const r3 = await chat(m3.content, history2);
}

runTest();
