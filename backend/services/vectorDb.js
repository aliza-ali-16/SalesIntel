const axios = require('axios');
const { VectorMemory } = require('../models/schemas');

// Cosine similarity between two float vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embedding values from Gemini API
async function getEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return standard size vector (768 dimensions)
    return Array.from({ length: 768 }, (_, i) => Math.sin(i) * 0.1);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const response = await axios.post(url, {
      model: "models/text-embedding-004",
      content: { parts: [{ text }] }
    }, { timeout: 8000 });

    if (response.data && response.data.embedding && response.data.embedding.values) {
      return response.data.embedding.values;
    }
  } catch (err) {
    console.error("❌ Embedding generation failed:", err.message);
  }

  // Fallback vector on error
  return Array.from({ length: 768 }, (_, i) => Math.cos(i) * 0.1);
}

// Save a memory entry
async function saveMemory(id, text, metadata = {}, userId = 'test_user_id') {
  try {
    const embedding = await getEmbedding(text);
    await VectorMemory.findOneAndUpdate(
      { id, text, userId },
      { $set: { id, text, metadata, embedding, userId } },
      { new: true, upsert: true }
    );
    console.log(`[VECTOR DB] Saved memory for ID: ${id} scoped to User: ${userId}`);
  } catch (err) {
    console.error(`[VECTOR DB ERROR] Failed to save memory:`, err.message);
  }
}

// Query the memory database using cosine similarity
async function queryMemory(queryText, limit = 3, filterId = null, userId = 'test_user_id') {
  try {
    const queryVector = await getEmbedding(queryText);
    
    // Find candidate documents
    let query = { userId };
    if (filterId) {
      query.id = filterId;
    }
    
    const memories = await VectorMemory.find(query);
    if (memories.length === 0) return [];

    const results = memories.map(mem => {
      const memObj = typeof mem.toObject === 'function' ? mem.toObject() : mem;
      const similarity = cosineSimilarity(queryVector, memObj.embedding);
      return {
        id: memObj.id,
        text: memObj.text,
        metadata: memObj.metadata,
        similarity
      };
    });

    // Sort descending by similarity score
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  } catch (err) {
    console.error(`[VECTOR DB ERROR] Query failed:`, err.message);
    return [];
  }
}

module.exports = {
  getEmbedding,
  saveMemory,
  queryMemory,
  cosineSimilarity
};
