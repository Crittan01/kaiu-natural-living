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

      // Dinamically import to save initial load time if possible, or just standard import
      const { OpenAIEmbeddings } = await import('@langchain/openai');
      
      const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: "text-embedding-3-small",
          dimensions: 384 // Force 384 dimensions to match the existing Postgres column
      });

      console.log(`🧠 Generating Vector Embeddings for new Knowledge Base article: ${title}`);
      
      // Request exactly 1 vector for the entire content (Or implement chunking here if huge texts)
      const vector = await embeddings.embedQuery(content);

      // Prisma ORM doesn't support direct object relational mapping for vectors. 
      // We must insert RAG records using Raw SQL 
      
      const vectorString = `[${vector.join(',')}]`;
      const stringifiedMetadata = JSON.stringify({ title: title || 'Sin Título', type: type || 'Documento' });
      
      const result = await prisma.$queryRaw`
        INSERT INTO "knowledge_base" ("id", "content", "metadata", "embedding") 
        VALUES (gen_random_uuid(), ${content}, ${stringifiedMetadata}::jsonb, ${vectorString}::vector)
        RETURNING "id"
      `;
      
      return res.status(201).json({ success: true, id: result[0].id });
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
