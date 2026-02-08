
import { generateSupportResponse } from './services/ai/Retriever.js';

export default async function handler(req, res) {
    const start = Date.now();
    try {
        console.log("🧪 Debug AI: Starting...");
        // Test query
        const query = req.query.q || "¿Para qué sirve el aceite de lavanda?";
        
        const response = await generateSupportResponse(query);
        
        const duration = Date.now() - start;
        
        res.status(200).json({
            success: true,
            duration_ms: duration,
            query: query,
            response: response,
            env: {
                node_env: process.env.NODE_ENV,
                tmp_dir: '/tmp' 
            }
        });
    } catch (error) {
        console.error("❌ Debug AI Error:", error);
        res.status(500).json({
            success: false,
            duration_ms: Date.now() - start,
            error: error.message,
            stack: error.stack
        });
    }
}
