-- Enable the vector extension if not enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column to existing table
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS embedding vector(384); 
-- 384 dimensions matches the Xenova/all-MiniLM-L6-v2 model we will use locally
