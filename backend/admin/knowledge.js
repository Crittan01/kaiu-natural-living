import { prisma } from '../db.js';
import { verifyAdminToken } from './auth-helper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyAdminToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      // Fetch knowledge without the massive vector embeddings to save bandwidth
      const items = await prisma.$queryRaw`
        SELECT id, content, metadata, "createdAt" 
        FROM knowledge_base 
        ORDER BY "createdAt" DESC
      `;
      return res.status(200).json(items);
    } 
    
    else if (req.method === 'POST') {
      const { content, title, type } = req.body;
      if (!content) return res.status(400).json({ error: 'Content is required' });

      // Idealmente, aquí también llamaríamos al modelo de Embeddings (ej. OpenAI)
      // para generar el vector y guardarlo. Por ahora, guardamos el texto plano
      // que puede ser usado como RAG estático o indexado luego por un worker.
      
      const newKnowledge = await prisma.knowledgeBase.create({
        data: {
          content,
          metadata: { title: title || 'Sin Título', type: type || 'Documento' }
        }
      });
      return res.status(201).json({ success: true, id: newKnowledge.id });
    }

    else if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID is required' });

      await prisma.knowledgeBase.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error) {
    console.error('Knowledge Base Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
