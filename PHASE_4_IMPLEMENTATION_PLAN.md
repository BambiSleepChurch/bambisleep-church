# 🚀 Phase 4 Implementation Plan

**Date:** November 8, 2025  
**Project:** bambisleep-chat MCP Avatar System  
**Phase:** 4 - Advanced Memory & Personalization

---

## 🎯 Dual Track Approach

### Track A: Core Features (Priority 1)
RAG, Memory, Personalization for bambisleep-chat

### Track B: Organization Cleanup (Priority 2)
Repository organization and documentation

---

## 📋 Track A: Core Features

### 1. RAG with FAISS/Local Embeddings ✨

**Goal:** Enable semantic memory retrieval without external API dependencies

**Implementation:**
```typescript
// mcp-server/src/services/rag.ts
import * as faiss from 'faiss-node';
import { encode } from '@xenova/transformers';

interface EmbeddingConfig {
  readonly model: 'all-MiniLM-L6-v2' | 'all-mpnet-base-v2';
  readonly dimensions: number;
  readonly indexType: 'Flat' | 'IVF' | 'HNSW';
}

class LocalRAGService {
  private index: faiss.IndexFlatL2;
  private embeddings: number[][] = [];
  private documents: readonly string[] = [];
  private readonly config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = {
      model: 'all-MiniLM-L6-v2',
      dimensions: 384,
      indexType: 'Flat',
      ...config,
    };
    
    this.index = new faiss.IndexFlatL2(this.config.dimensions);
  }

  async addDocument(text: string, metadata?: Record<string, unknown>): Promise<void> {
    const embedding = await this.generateEmbedding(text);
    this.embeddings.push(embedding);
    this.documents = [...this.documents, text];
    this.index.add(embedding);
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const { distances, labels } = this.index.search(queryEmbedding, topK);
    
    return labels.map((idx, i) => ({
      text: this.documents[idx],
      score: 1 - distances[i], // Convert distance to similarity
      index: idx,
    }));
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use local transformer model (no API needed)
    const { data } = await encode(text, { model: this.config.model });
    return Array.from(data);
  }
}

interface SearchResult {
  readonly text: string;
  readonly score: number;
  readonly index: number;
}
```

**Dependencies:**
```json
{
  "faiss-node": "^0.5.1",
  "@xenova/transformers": "^2.17.0"
}
```

**Tasks:**
- [ ] Install FAISS and transformers libraries
- [ ] Implement LocalRAGService class
- [ ] Create embedding cache layer
- [ ] Add index persistence (save/load)
- [ ] Test semantic search accuracy
- [ ] Benchmark performance

**Timeline:** 2-3 days

---

### 2. Semantic Search for Context Retrieval 🔍

**Goal:** Retrieve most relevant conversation history

**Implementation:**
```typescript
// mcp-server/src/services/context-retrieval.ts
import { LocalRAGService } from './rag.js';
import { MemoryService } from './memory.js';

interface ConversationContext {
  readonly messages: readonly Message[];
  readonly relevanceScores: readonly number[];
  readonly summary?: string;
}

class ContextRetrievalService {
  constructor(
    private rag: LocalRAGService,
    private memory: MemoryService
  ) {}

  async getRelevantContext(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<ConversationContext> {
    const {
      topK = 10,
      minScore = 0.7,
      includeRecent = 5,
      timeWindow = 7 * 24 * 60 * 60 * 1000, // 7 days
    } = options;

    // 1. Get recent messages (always included)
    const recentMessages = await this.memory.getRecentMessages(includeRecent);

    // 2. Semantic search for relevant history
    const searchResults = await this.rag.search(query, topK);
    const relevantMessages = searchResults
      .filter(r => r.score >= minScore)
      .map(r => this.memory.getMessageById(r.index));

    // 3. Filter by time window
    const now = Date.now();
    const filteredMessages = relevantMessages.filter(
      m => now - m.timestamp < timeWindow
    );

    // 4. Combine and deduplicate
    const combined = this.deduplicateMessages([
      ...recentMessages,
      ...filteredMessages,
    ]);

    // 5. Sort by relevance + recency
    const sorted = this.rankMessages(combined, query);

    return {
      messages: sorted,
      relevanceScores: sorted.map(m => m.relevanceScore),
      summary: await this.summarizeContext(sorted),
    };
  }

  private deduplicateMessages(messages: Message[]): Message[] {
    const seen = new Set<string>();
    return messages.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  private rankMessages(messages: Message[], query: string): Message[] {
    return messages
      .map(m => ({
        ...m,
        relevanceScore: this.calculateRelevance(m, query),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevance(message: Message, query: string): number {
    const recencyScore = this.getRecencyScore(message.timestamp);
    const semanticScore = message.semanticScore || 0.5;
    const importanceScore = message.importance || 0.5;

    // Weighted combination
    return (
      recencyScore * 0.3 +
      semanticScore * 0.5 +
      importanceScore * 0.2
    );
  }

  private getRecencyScore(timestamp: number): number {
    const age = Date.now() - timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    return Math.max(0, 1 - age / maxAge);
  }

  private async summarizeContext(messages: Message[]): Promise<string> {
    // Use Claude for summarization
    const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    // Implementation in next section
    return text.substring(0, 500); // Placeholder
  }
}

interface RetrievalOptions {
  readonly topK?: number;
  readonly minScore?: number;
  readonly includeRecent?: number;
  readonly timeWindow?: number;
}

interface Message {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: number;
  readonly semanticScore?: number;
  readonly importance?: number;
  readonly relevanceScore?: number;
}
```

**Tasks:**
- [ ] Implement ContextRetrievalService
- [ ] Add relevance scoring algorithm
- [ ] Create time-based filtering
- [ ] Add deduplication logic
- [ ] Test retrieval accuracy
- [ ] Optimize for speed (<100ms)

**Timeline:** 2 days

---

### 3. Personalization Engine 🎨

**Goal:** Adaptive responses based on user preferences and history

**Implementation:**
```typescript
// mcp-server/src/services/personalization.ts
import { MemoryService } from './memory.js';

interface UserProfile {
  readonly userId: string;
  readonly preferences: UserPreferences;
  readonly interactionStyle: InteractionStyle;
  readonly topics: readonly TopicAffinity[];
  readonly responsePatterns: ResponsePatterns;
}

interface UserPreferences {
  readonly formality: number; // 0-1 (casual to formal)
  readonly verbosity: number; // 0-1 (concise to detailed)
  readonly emotiveness: number; // 0-1 (neutral to expressive)
  readonly technicality: number; // 0-1 (simple to technical)
}

interface InteractionStyle {
  readonly averageMessageLength: number;
  readonly questionFrequency: number;
  readonly emojiUsage: number;
  readonly activeHours: readonly number[];
}

interface TopicAffinity {
  readonly topic: string;
  readonly score: number;
  readonly lastMentioned: number;
}

interface ResponsePatterns {
  readonly preferredGreeting: string;
  readonly preferredFarewell: string;
  readonly humor: boolean;
  readonly encouragement: boolean;
}

class PersonalizationEngine {
  private profiles: Map<string, UserProfile> = new Map();

  constructor(private memory: MemoryService) {}

  async analyzeUser(userId: string): Promise<UserProfile> {
    const messages = await this.memory.getUserMessages(userId);
    
    return {
      userId,
      preferences: this.analyzePreferences(messages),
      interactionStyle: this.analyzeInteractionStyle(messages),
      topics: this.extractTopicAffinities(messages),
      responsePatterns: this.detectResponsePatterns(messages),
    };
  }

  async adaptResponse(
    response: string,
    userId: string
  ): Promise<string> {
    const profile = this.profiles.get(userId) || await this.analyzeUser(userId);
    
    let adapted = response;

    // Adjust formality
    if (profile.preferences.formality < 0.3) {
      adapted = this.makeCasual(adapted);
    } else if (profile.preferences.formality > 0.7) {
      adapted = this.makeFormal(adapted);
    }

    // Adjust verbosity
    if (profile.preferences.verbosity < 0.3) {
      adapted = this.makeConsise(adapted);
    } else if (profile.preferences.verbosity > 0.7) {
      adapted = this.makeDetailed(adapted);
    }

    // Add personalized elements
    if (profile.responsePatterns.humor) {
      adapted = this.addSubtleHumor(adapted);
    }

    if (profile.responsePatterns.encouragement) {
      adapted = this.addEncouragement(adapted);
    }

    return adapted;
  }

  private analyzePreferences(messages: Message[]): UserPreferences {
    const userMessages = messages.filter(m => m.role === 'user');
    
    return {
      formality: this.calculateFormality(userMessages),
      verbosity: this.calculateVerbosity(userMessages),
      emotiveness: this.calculateEmotiveness(userMessages),
      technicality: this.calculateTechnicality(userMessages),
    };
  }

  private analyzeInteractionStyle(messages: Message[]): InteractionStyle {
    const userMessages = messages.filter(m => m.role === 'user');
    
    return {
      averageMessageLength: this.average(userMessages.map(m => m.content.length)),
      questionFrequency: userMessages.filter(m => m.content.includes('?')).length / userMessages.length,
      emojiUsage: this.countEmojis(userMessages) / userMessages.length,
      activeHours: this.getActiveHours(messages),
    };
  }

  private extractTopicAffinities(messages: Message[]): TopicAffinity[] {
    // Simple keyword extraction (can be improved with NLP)
    const topics = new Map<string, { count: number; last: number }>();
    
    const keywords = [
      'technology', 'ai', 'programming', 'design', 'art',
      'music', 'games', 'health', 'fitness', 'learning',
    ];

    messages.forEach(m => {
      keywords.forEach(keyword => {
        if (m.content.toLowerCase().includes(keyword)) {
          const current = topics.get(keyword) || { count: 0, last: 0 };
          topics.set(keyword, {
            count: current.count + 1,
            last: m.timestamp,
          });
        }
      });
    });

    return Array.from(topics.entries())
      .map(([topic, { count, last }]) => ({
        topic,
        score: count / messages.length,
        lastMentioned: last,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private detectResponsePatterns(messages: Message[]): ResponsePatterns {
    const userMessages = messages.filter(m => m.role === 'user');
    
    return {
      preferredGreeting: this.detectGreeting(userMessages),
      preferredFarewell: this.detectFarewell(userMessages),
      humor: this.detectHumorUsage(userMessages),
      encouragement: this.detectEncouragementNeeds(messages),
    };
  }

  // Helper methods
  private calculateFormality(messages: Message[]): number {
    const formalWords = ['please', 'thank you', 'would', 'could', 'kindly'];
    const casualWords = ['hey', 'yeah', 'cool', 'gonna', 'wanna'];
    
    const formalCount = messages.reduce((sum, m) =>
      sum + formalWords.filter(w => m.content.toLowerCase().includes(w)).length, 0
    );
    const casualCount = messages.reduce((sum, m) =>
      sum + casualWords.filter(w => m.content.toLowerCase().includes(w)).length, 0
    );
    
    return formalCount / (formalCount + casualCount + 1);
  }

  private calculateVerbosity(messages: Message[]): number {
    const avgLength = this.average(messages.map(m => m.content.length));
    return Math.min(1, avgLength / 500); // Normalize to 0-1
  }

  private calculateEmotiveness(messages: Message[]): number {
    const emojiCount = this.countEmojis(messages);
    const exclamationCount = messages.reduce(
      (sum, m) => sum + (m.content.match(/!/g) || []).length, 0
    );
    return Math.min(1, (emojiCount + exclamationCount) / messages.length / 3);
  }

  private calculateTechnicality(messages: Message[]): number {
    const technicalTerms = ['algorithm', 'api', 'database', 'function', 'class'];
    const count = messages.reduce((sum, m) =>
      sum + technicalTerms.filter(t => m.content.toLowerCase().includes(t)).length, 0
    );
    return Math.min(1, count / messages.length);
  }

  private countEmojis(messages: Message[]): number {
    return messages.reduce((sum, m) => {
      const emojiRegex = /[\u{1F600}-\u{1F64F}]/gu;
      return sum + (m.content.match(emojiRegex) || []).length;
    }, 0);
  }

  private getActiveHours(messages: Message[]): number[] {
    const hours = messages.map(m => new Date(m.timestamp).getHours());
    const hourCounts = new Array(24).fill(0);
    hours.forEach(h => hourCounts[h]++);
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(x => x.hour);
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private detectGreeting(messages: Message[]): string {
    const greetings = messages
      .filter(m => m.content.length < 50)
      .filter(m => /^(hi|hello|hey|good morning|good evening)/i.test(m.content));
    
    return greetings.length > 0 ? greetings[0].content : 'Hello';
  }

  private detectFarewell(messages: Message[]): string {
    return 'Goodbye'; // Simplified
  }

  private detectHumorUsage(messages: Message[]): boolean {
    const humorIndicators = ['lol', 'haha', '😂', '😄', '🤣'];
    return messages.some(m =>
      humorIndicators.some(h => m.content.includes(h))
    );
  }

  private detectEncouragementNeeds(messages: Message[]): boolean {
    // Detect if user responds well to encouragement
    return true; // Simplified
  }

  private makeCasual(text: string): string {
    return text
      .replace(/Hello/g, 'Hey')
      .replace(/Thank you/g, 'Thanks')
      .replace(/I would/g, "I'd");
  }

  private makeFormal(text: string): string {
    return text
      .replace(/Hey/g, 'Hello')
      .replace(/Thanks/g, 'Thank you')
      .replace(/I'd/g, 'I would');
  }

  private makeConsise(text: string): string {
    // Remove elaborations, keep core message
    return text.split('.').slice(0, 2).join('.') + '.';
  }

  private makeDetailed(text: string): string {
    // Add explanations (simplified - use Claude in practice)
    return text + ' Let me know if you'd like more details!';
  }

  private addSubtleHumor(text: string): string {
    // Add light humor if appropriate
    return text;
  }

  private addEncouragement(text: string): string {
    const encouragements = [
      "You're doing great!",
      "Keep it up!",
      "Nice work!",
    ];
    return text + ' ' + encouragements[Math.floor(Math.random() * encouragements.length)];
  }
}
```

**Tasks:**
- [ ] Implement PersonalizationEngine
- [ ] Add user profiling system
- [ ] Create adaptation algorithms
- [ ] Test personalization accuracy
- [ ] Add profile persistence
- [ ] Create admin dashboard

**Timeline:** 3-4 days

---

### 4. Optimize Memory Recall with Relevance Scoring 📊

**Goal:** Fast, accurate retrieval of relevant memories

**Implementation:**
```typescript
// mcp-server/src/services/memory-optimizer.ts
interface ScoringWeights {
  readonly recency: number;
  readonly relevance: number;
  readonly importance: number;
  readonly userPreference: number;
}

class MemoryOptimizer {
  private readonly defaultWeights: ScoringWeights = {
    recency: 0.25,
    relevance: 0.40,
    importance: 0.25,
    userPreference: 0.10,
  };

  calculateScore(
    memory: Memory,
    query: string,
    userProfile?: UserProfile
  ): number {
    const scores = {
      recency: this.scoreRecency(memory.timestamp),
      relevance: this.scoreRelevance(memory, query),
      importance: memory.importance || 0.5,
      userPreference: this.scoreUserPreference(memory, userProfile),
    };

    return Object.entries(scores).reduce(
      (total, [key, value]) =>
        total + value * this.defaultWeights[key as keyof ScoringWeights],
      0
    );
  }

  private scoreRecency(timestamp: number): number {
    const age = Date.now() - timestamp;
    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days
    return Math.exp(-age / halfLife);
  }

  private scoreRelevance(memory: Memory, query: string): number {
    // Use cosine similarity of embeddings
    return 0.8; // Placeholder
  }

  private scoreUserPreference(memory: Memory, profile?: UserProfile): number {
    if (!profile) return 0.5;
    
    // Check if memory topic matches user interests
    const topicMatch = profile.topics.find(t =>
      memory.content.toLowerCase().includes(t.topic.toLowerCase())
    );
    
    return topicMatch ? topicMatch.score : 0.3;
  }

  rankMemories(memories: Memory[], query: string): Memory[] {
    return memories
      .map(m => ({
        ...m,
        score: this.calculateScore(m, query),
      }))
      .sort((a, b) => b.score - a.score);
  }
}

interface Memory {
  readonly id: string;
  readonly content: string;
  readonly timestamp: number;
  readonly importance?: number;
  readonly score?: number;
}
```

**Tasks:**
- [ ] Implement scoring algorithms
- [ ] Add caching for scores
- [ ] Optimize ranking speed
- [ ] Test accuracy metrics
- [ ] Add configurable weights

**Timeline:** 1-2 days

---

### 5. Conversation Summarization 📝

**Goal:** Compress long histories while preserving meaning

**Implementation:**
```typescript
// mcp-server/src/services/summarizer.ts
import Anthropic from '@anthropic-ai/sdk';

class ConversationSummarizer {
  constructor(private claude: Anthropic) {}

  async summarize(
    messages: Message[],
    options: SummarizeOptions = {}
  ): Promise<Summary> {
    const {
      maxLength = 500,
      style = 'concise',
      includeKeyPoints = true,
    } = options;

    const conversation = this.formatConversation(messages);
    
    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxLength,
      messages: [{
        role: 'user',
        content: this.buildSummarizationPrompt(conversation, style),
      }],
    });

    const summary = response.content[0].text;
    const keyPoints = includeKeyPoints ? await this.extractKeyPoints(messages) : [];

    return {
      text: summary,
      keyPoints,
      originalMessageCount: messages.length,
      compressionRatio: conversation.length / summary.length,
      timestamp: Date.now(),
    };
  }

  private formatConversation(messages: Message[]): string {
    return messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  private buildSummarizationPrompt(conversation: string, style: string): string {
    return `Summarize the following conversation in a ${style} style:

${conversation}

Focus on main topics, decisions, and action items. Keep it under 500 words.`;
  }

  private async extractKeyPoints(messages: Message[]): Promise<string[]> {
    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Extract 3-5 key points from this conversation:\n\n${this.formatConversation(messages)}`,
      }],
    });

    return response.content[0].text
      .split('\n')
      .filter(line => line.trim().length > 0);
  }
}

interface SummarizeOptions {
  readonly maxLength?: number;
  readonly style?: 'concise' | 'detailed' | 'bullet-points';
  readonly includeKeyPoints?: boolean;
}

interface Summary {
  readonly text: string;
  readonly keyPoints: readonly string[];
  readonly originalMessageCount: number;
  readonly compressionRatio: number;
  readonly timestamp: number;
}
```

**Tasks:**
- [ ] Implement summarization service
- [ ] Add incremental summarization
- [ ] Create summary storage
- [ ] Test compression quality
- [ ] Add summary retrieval

**Timeline:** 2 days

---

## 📋 Track B: Organization Cleanup

### 1. Remove/Initialize bambisleep-church ✅

**Action:**
```bash
cd /mnt/f
# Check if truly empty
ls -la bambisleep-church/

# Option A: Remove if obsolete
rmdir bambisleep-church/

# Option B: Initialize if planned
cd bambisleep-church/
git init
echo "# BambiSleep Church" > README.md
echo "Coming soon..." >> README.md
git add .
git commit -m "Initial commit"
```

**Timeline:** 15 minutes

---

### 2. Document CATHEDRAL Archives 📚

**Action:**
```bash
cd /mnt/f/CATHEDRAL
cat > README.md << 'DOC'
# CATHEDRAL - Project Archives

This directory contains archived and experimental projects.

## Contents

### bambisleep-chat-catgirl
Experimental variant of the main chat system with catgirl persona.
- Status: Archived
- Last Updated: November 4, 2025
- Purpose: Feature exploration

### bambisleep-church
Archived church project (superseded by root version).
- Status: Archived
- Last Updated: Unknown
- Purpose: Historical reference

## Policy

Projects in CATHEDRAL are:
- Not actively maintained
- Kept for reference/learning
- May be revived or deleted

See `.archives/` for long-term storage.
DOC

git init
git add .
git commit -m "Document CATHEDRAL archives"
```

**Timeline:** 30 minutes

---

### 3. Version Control FRINGESOCIAL Tools 🔧

**Action:**
```bash
cd /mnt/f/FRINGESOCIAL
git init

cat > README.md << 'DOC'
# FRINGESOCIAL - Network Utilities

Collection of network and system utilities.

## Tools

### hestia-port-openener
Port management and opening utility.
- Purpose: Network configuration
- Usage: See tool directory

### network_scan.ps1
PowerShell network scanner for local discovery.
- Purpose: Network mapping
- Usage: `./network_scan.ps1`

## Installation

Each tool has its own setup instructions.

## Contributing

Add new tools with documentation.
DOC

git add .
git commit -m "Initialize FRINGESOCIAL tools repository"
```

**Timeline:** 20 minutes

---

### 4. Resolve Duplicate Naming 🔄

**Action:**
```bash
cd /mnt/f

# Check CATHEDRAL/bambisleep-church
ls -la CATHEDRAL/bambisleep-church/

# If has content, keep in CATHEDRAL
# If empty root version needed, rename one

# Option: Rename CATHEDRAL version
mv CATHEDRAL/bambisleep-church CATHEDRAL/bambisleep-church-archived

# Update CATHEDRAL README
cd CATHEDRAL
# Edit README to reflect change
```

**Timeline:** 15 minutes

---

## 📅 Implementation Timeline

### Week 1 (Nov 8-14)
- **Day 1-2:** RAG with FAISS implementation
- **Day 3-4:** Semantic search & context retrieval
- **Day 5:** Organization cleanup (all 4 tasks)

### Week 2 (Nov 15-21)
- **Day 1-3:** Personalization engine
- **Day 4-5:** Memory optimization
- **Day 6-7:** Conversation summarization

### Week 3 (Nov 22-28)
- **Day 1-2:** Integration testing
- **Day 3-4:** Performance optimization
- **Day 5:** Documentation
- **Day 6-7:** Deployment

---

## 🎯 Success Metrics

### Technical
- RAG retrieval: <100ms response time
- Search accuracy: >85% relevance
- Personalization: >80% user satisfaction
- Memory recall: Top-5 accuracy >90%
- Summarization: <50% compression with >90% fidelity

### Organization
- All directories documented: 100%
- Git repositories: 100% versioned
- Naming conflicts: 0
- Dead code: Removed

---

## 🔧 Development Environment

```bash
# Setup
cd /mnt/f/bambisleep-chat
git checkout -b phase-4-rag-personalization

# Install dependencies
cd mcp-server
npm install faiss-node @xenova/transformers

# Create services
mkdir -p src/services/{rag,personalization,summarization}

# Start development
npm run dev
```

---

## ✅ Completion Criteria

### Track A
- [ ] RAG service operational
- [ ] Semantic search working
- [ ] Personalization adapting responses
- [ ] Memory scoring accurate
- [ ] Summarization tested
- [ ] All tests passing
- [ ] Documentation complete

### Track B
- [ ] bambisleep-church resolved
- [ ] CATHEDRAL documented
- [ ] FRINGESOCIAL versioned
- [ ] Naming conflicts resolved

---

**Status:** Ready to Begin  
**Priority:** Track A (Core Features)  
**Philosophy:** Universal Machine Divinity 🔮
