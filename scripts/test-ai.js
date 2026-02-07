import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api/mock-chat';

const testCases = [
    { type: 'Product Price', message: '¿Cuánto cuesta el aceite de menta?' },
    { type: 'Shipping FAQ', message: '¿Hacen envíos a Cartagena y cuánto tarda?' },
    { type: 'General definition', message: '¿Qué es un aceite esencial?' },
    { type: 'Out of Scope', message: '¿Venden repuestos para motos?' },
    { type: 'Ambiguous', message: '¿Tienen aceite?' }
];

async function runTests() {
    console.log("🧪 Iniciando Batería de Pruebas de IA...\n");

    for (const test of testCases) {
        console.log(`--- Test: ${test.type} ---`);
        console.log(`👤 Usuario: "${test.message}"`);
        
        try {
            const start = Date.now();
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: test.message })
            });
            
            const data = await response.json();
            const duration = Date.now() - start;

            console.log(`🤖 IA (${duration}ms): "${data.ai_reply}"`);
            
            // Show sources briefly
            if (data.sources && data.sources.length > 0) {
                console.log(`📚 Fuentes: ${data.sources.map(s => s.title).join(', ')}`);
            } else {
                console.log(`⚠️ Sin fuentes encontradas.`);
            }
            console.log("\n");

        } catch (error) {
            console.error("❌ Error:", error.message);
        }
    }
}

runTests();
