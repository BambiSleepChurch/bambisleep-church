// 🌸 RAG Agent - Retrieval-Augmented Generation Agent
// Retrieves relevant context from knowledge bases and generates enhanced responses

const BaseAgent = require("./base-agent");
const fs = require("fs").promises;
const path = require("path");

/**
 * RAGAgent - Retrieval-Augmented Generation for context-aware responses
 * 
 * Features:
 * - Document indexing and retrieval
 * - Semantic search across knowledge bases
 * - Context-aware response generation
 * - Multi-source knowledge integration
 * 
 * @extends BaseAgent
 */
class RAGAgent extends BaseAgent {
  constructor(config = {}) {
    super("rag-agent", config);

    this.knowledgeBases = config.knowledgeBases || [];
    this.embeddingCache = new Map();
    this.documentIndex = new Map();
    this.maxContextLength = config.maxContextLength || 4000;
    this.topK = config.topK || 5;
    this.similarityThreshold = config.similarityThreshold || 0.7;

    this.mcpServers = [
      "sequential-thinking",
      "memory",
      "context-manager",
      ...this.mcpServers,
    ];

    this.log("INFO", "🔍 RAG Agent initialized with knowledge bases", {
      count: this.knowledgeBases.length,
      topK: this.topK,
    });
  }

  /**
   * Initialize RAG agent and index knowledge bases
   */
  async initialize() {
    await super.initialize();

    this.log("INFO", "📚 Indexing knowledge bases...");
    
    for (const kb of this.knowledgeBases) {
      try {
        await this.indexKnowledgeBase(kb);
        this.log("INFO", `✅ Indexed: ${kb.name}`);
      } catch (error) {
        this.log("ERROR", `🔥 Failed to index ${kb.name}: ${error.message}`);
      }
    }

    this.log("INFO", `💎 RAG Agent ready with ${this.documentIndex.size} documents`);
  }

  /**
   * Index a knowledge base for retrieval
   * @param {object} kb - Knowledge base configuration
   */
  async indexKnowledgeBase(kb) {
    const { name, type, source } = kb;

    switch (type) {
      case "directory":
        await this.indexDirectory(source, name);
        break;
      case "file":
        await this.indexFile(source, name);
        break;
      case "api":
        await this.indexFromAPI(source, name);
        break;
      default:
        this.log("WARN", `⚠️ Unknown KB type: ${type}`);
    }
  }

  /**
   * Index all files in a directory
   */
  async indexDirectory(dirPath, kbName) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          await this.indexDirectory(filePath, kbName);
        } else if (this.isSupportedFile(file.name)) {
          await this.indexFile(filePath, kbName);
        }
      }
    } catch (error) {
      this.log("ERROR", `🔥 Directory indexing error: ${error.message}`);
    }
  }

  /**
   * Index a single file
   */
  async indexFile(filePath, kbName) {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const chunks = this.chunkDocument(content, filePath);

      for (const chunk of chunks) {
        const docId = `${kbName}:${filePath}:${chunk.index}`;
        const embedding = await this.generateEmbedding(chunk.text);

        this.documentIndex.set(docId, {
          id: docId,
          knowledgeBase: kbName,
          source: filePath,
          chunkIndex: chunk.index,
          text: chunk.text,
          embedding,
          metadata: chunk.metadata,
        });
      }

      this.log("DEBUG", `📄 Indexed file: ${filePath} (${chunks.length} chunks)`);
    } catch (error) {
      this.log("ERROR", `🔥 File indexing error: ${filePath} - ${error.message}`);
    }
  }

  /**
   * Index from external API
   */
  async indexFromAPI(apiConfig, kbName) {
    // Placeholder for API-based knowledge retrieval
    this.log("INFO", `🌐 API indexing: ${apiConfig.endpoint}`);
  }

  /**
   * Check if file type is supported
   */
  isSupportedFile(filename) {
    const supported = [".txt", ".md", ".json", ".js", ".ts", ".py", ".cs"];
    return supported.some((ext) => filename.endsWith(ext));
  }

  /**
   * Chunk document into smaller pieces
   */
  chunkDocument(content, source, chunkSize = 500) {
    const chunks = [];
    const lines = content.split("\n");
    let currentChunk = [];
    let currentLength = 0;
    let chunkIndex = 0;

    for (const line of lines) {
      currentChunk.push(line);
      currentLength += line.length;

      if (currentLength >= chunkSize) {
        chunks.push({
          index: chunkIndex++,
          text: currentChunk.join("\n"),
          metadata: { source, lineCount: currentChunk.length },
        });
        currentChunk = [];
        currentLength = 0;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        index: chunkIndex,
        text: currentChunk.join("\n"),
        metadata: { source, lineCount: currentChunk.length },
      });
    }

    return chunks;
  }

  /**
   * Generate embedding for text
   * In production, use actual embedding model
   */
  async generateEmbedding(text) {
    // Check cache
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text);
    }

    // Simulate embedding generation (replace with actual model)
    const embedding = this.simpleHashEmbedding(text);
    this.embeddingCache.set(text, embedding);

    return embedding;
  }

  /**
   * Simple hash-based embedding (placeholder)
   */
  simpleHashEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(128).fill(0);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash = hash & hash;
      }
      vector[Math.abs(hash) % 128] += 1;
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Retrieve relevant documents for a query
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Array} - Relevant documents with scores
   */
  async retrieve(query, topK = null) {
    const k = topK || this.topK;
    const queryEmbedding = await this.generateEmbedding(query);

    this.log("DEBUG", `🔍 Retrieving documents for query: "${query.substring(0, 50)}..."`);

    // Calculate similarities
    const results = [];
    for (const [docId, doc] of this.documentIndex.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

      if (similarity >= this.similarityThreshold) {
        results.push({
          ...doc,
          similarity,
        });
      }
    }

    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, k);

    this.log("DEBUG", `✨ Found ${topResults.length} relevant documents`);

    return topResults;
  }

  /**
   * Generate response with retrieved context
   * @param {string} query - User query
   * @param {object} options - Generation options
   * @returns {object} - Generated response with context
   */
  async generate(query, options = {}) {
    const startTime = Date.now();

    try {
      // Step 1: Retrieve relevant documents
      const documents = await this.retrieve(query, options.topK);

      // Step 2: Build context from retrieved documents
      const context = this.buildContext(documents);

      // Step 3: Generate response using MCP with context
      const response = await this.callMcp("sequential-thinking", {
        query,
        context,
        maxLength: options.maxLength || 1000,
        temperature: options.temperature || 0.7,
      });

      const duration = Date.now() - startTime;

      this.log("INFO", `🌸 Generated RAG response in ${duration}ms`, {
        documentsUsed: documents.length,
        contextLength: context.length,
      });

      return {
        query,
        response: response.data,
        context: {
          documents: documents.map(d => ({
            source: d.source,
            similarity: d.similarity,
            preview: d.text.substring(0, 100) + "...",
          })),
          totalLength: context.length,
        },
        metadata: {
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log("ERROR", `🔥 Generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build context string from retrieved documents
   */
  buildContext(documents) {
    let context = "# Retrieved Context\n\n";
    let currentLength = 0;

    for (const doc of documents) {
      const docText = `## Source: ${doc.source} (Relevance: ${(doc.similarity * 100).toFixed(1)}%)\n${doc.text}\n\n`;

      if (currentLength + docText.length > this.maxContextLength) {
        break;
      }

      context += docText;
      currentLength += docText.length;
    }

    return context;
  }

  /**
   * Add document to index dynamically
   */
  async addDocument(text, metadata = {}) {
    const docId = `dynamic:${Date.now()}:${Math.random()}`;
    const chunks = this.chunkDocument(text, metadata.source || "dynamic");

    for (const chunk of chunks) {
      const chunkId = `${docId}:${chunk.index}`;
      const embedding = await this.generateEmbedding(chunk.text);

      this.documentIndex.set(chunkId, {
        id: chunkId,
        knowledgeBase: "dynamic",
        source: metadata.source || "runtime",
        chunkIndex: chunk.index,
        text: chunk.text,
        embedding,
        metadata: { ...metadata, addedAt: new Date().toISOString() },
      });
    }

    this.log("INFO", `📝 Added document with ${chunks.length} chunks`);
    return docId;
  }

  /**
   * Clear document index
   */
  clearIndex() {
    this.documentIndex.clear();
    this.embeddingCache.clear();
    this.log("INFO", "🗑️ Document index cleared");
  }

  /**
   * Get index statistics
   */
  getStats() {
    const kbCounts = {};
    for (const doc of this.documentIndex.values()) {
      kbCounts[doc.knowledgeBase] = (kbCounts[doc.knowledgeBase] || 0) + 1;
    }

    return {
      totalDocuments: this.documentIndex.size,
      cacheSize: this.embeddingCache.size,
      knowledgeBases: kbCounts,
      metrics: this.getMetrics(),
    };
  }
}

module.exports = RAGAgent;
