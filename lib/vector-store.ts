import { LibSQLVectorStore } from "@langchain/community/vectorstores/libsql";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { client } from "./turso";

let vectorStore: LibSQLVectorStore | null = null;

export async function getVectorStore() {
  if (vectorStore) return vectorStore;

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("Missing Gemini API key for embeddings");
    return null;
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: "text-embedding-004",
  });

  try {
    vectorStore = new LibSQLVectorStore(embeddings, {
      db: client,
      table: "assistant_knowledge",
      column: "embedding",
    });
    return vectorStore;
  } catch (error) {
    console.error("Failed to initialize LibSQL vector store:", error);
    return null;
  }
}

export async function searchKnowledge(query: string, limit: number = 3) {
  const store = await getVectorStore();
  if (!store) return [];

  try {
    const results = await store.similaritySearch(query, limit);
    return results;
  } catch (error) {
    console.error("Error searching vector store:", error);
    return [];
  }
}

/**
 * Helper to add new information to the assistant's knowledge base.
 */
export async function addKnowledge(content: string, metadata: Record<string, any> = {}) {
  const store = await getVectorStore();
  if (!store) throw new Error("Vector store not initialized");

  try {
    await store.addDocuments([{ pageContent: content, metadata }]);
    return true;
  } catch (error) {
    console.error("Error adding to vector store:", error);
    throw error;
  }
}

/**
 * Helper to delete information from the knowledge base by ID.
 */
export async function deleteKnowledge(id: number | string) {
  const store = await getVectorStore();
  if (!store) throw new Error("Vector store not initialized");

  try {
    // Cast to any or appropriate array type to satisfy the library's union type requirement
    await store.delete({ ids: [id] as any[] });
    return true;
  } catch (error) {
    console.error("Error deleting from vector store:", error);
    throw error;
  }
}
