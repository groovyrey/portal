import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { 
  SCHOOL_INFO, 
  BUILDING_CODES, 
  GRADING_SYSTEM, 
  COMMON_PROCEDURES, 
  IMPORTANT_OFFICES 
} from './assistant-knowledge';

let vectorStore: MemoryVectorStore | null = null;

export async function getVectorStore() {
  if (vectorStore) return vectorStore;

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    modelName: "embedding-001", // Default Google embedding model
  });

  // Prepare documents from hardcoded knowledge
  const docs: Document[] = [];

  // 1. School Info
  docs.push(new Document({
    pageContent: `School Name: ${SCHOOL_INFO.name} (${SCHOOL_INFO.acronym})
Location: ${SCHOOL_INFO.location}
Motto: ${SCHOOL_INFO.motto}
Core Values: ${SCHOOL_INFO.coreValues.join(", ")}`,
    metadata: { source: "school_info", type: "general" }
  }));

  // 2. Building Codes
  Object.entries(BUILDING_CODES).forEach(([code, name]) => {
    docs.push(new Document({
      pageContent: `Building Code: ${code} refers to ${name}`,
      metadata: { source: "building_codes", code, type: "location" }
    }));
  });

  // 3. Grading System
  docs.push(new Document({
    pageContent: `Grading System and Scale:
${GRADING_SYSTEM}`,
    metadata: { source: "grading_system", type: "academic" }
  }));

  // 4. Common Procedures
  docs.push(new Document({
    pageContent: `Common Academic Procedures:
${COMMON_PROCEDURES}`,
    metadata: { source: "procedures", type: "academic" }
  }));

  // 5. Important Offices
  IMPORTANT_OFFICES.forEach(office => {
    docs.push(new Document({
      pageContent: `Office: ${office.name}
Purpose/Services: ${office.purpose}`,
      metadata: { source: "offices", name: office.name, type: "admin" }
    }));
  });

  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
}

export async function searchKnowledge(query: string, limit: number = 3) {
  const store = await getVectorStore();
  const results = await store.similaritySearch(query, limit);
  return results.map(doc => doc.pageContent).join("

---

");
}
