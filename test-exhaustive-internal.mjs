import { generateSupportResponse } from './backend/services/ai/Retriever.js';

async function runTests() {
    console.log("🚀 INICIANDO PRUEBAS EXHAUSTIVAS DEL CEREBRO KAIU 🚀\n");
    let history = [];

    const queries = [
        "Hola, me das información sobre los aceites esenciales?",
        "Específicamente qué tamaños y precios tienes del Aceite de Lavanda?",
        "Me puedes mandar fotos del aceite de lavanda en roll-on?",
        "Y el Aceite de Árbol de Té qué vale?",
        "Tienen algún aceite de Eucalipto marciano de color azul fosforescente de 1000ml?",
        "Cuales son los tiempos de envío para Bogotá y cuánto cuesta el domicilio?"
    ];

    for (let i = 0; i < queries.length; i++) {
        const q = queries[i];
        console.log(`\n======================================================`);
        console.log(`👤 USUARIO [${i+1}/${queries.length}]: "${q}"`);
        
        history.push({ role: 'user', content: q });
        
        try {
            console.log("...pensando...");
            const response = await generateSupportResponse(q, history.slice(0, -1));
            console.log(`\n🤖 BOT: \n${response.text}`);
            history.push({ role: 'assistant', content: response.text });
        } catch (error) {
            console.error(`\n❌ ERROR: ${error.message}`);
        }
    }
    
    console.log(`\n======================================================`);
    console.log("✅ FIN DE LAS PRUEBAS EXHAUSTIVAS");
    process.exit(0);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
