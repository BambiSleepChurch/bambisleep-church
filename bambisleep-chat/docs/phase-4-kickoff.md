# 🚀 Phase 4 Kickoff - Memory and Personalization

**Status**: READY TO START  
**Prerequisites**: ✅ Phase 3 complete (78/78 tests passing)  
**Date**: November 8, 2025

---

## 🎯 Phase 4 Objectives

From `guide.md` development sequence:

> **Phase 4: Memory and Personalization**
>
> - Conversation history management
> - User context persistence
> - RAG (Retrieval-Augmented Generation) setup
> - Personalization engine

---

## 📋 Implementation Checklist

### 1. Conversation History Management

- [ ] Design message storage schema (SQLite or in-memory Redis)
- [ ] Implement conversation buffer with sliding window
- [ ] Add timestamp tracking for context relevance
- [ ] Create history pruning strategy (token limits)
- [ ] Test conversation continuity across sessions

### 2. User Context Persistence

- [ ] Design user profile schema (preferences, boundaries)
- [ ] Implement consent tracking (opt-in/opt-out for memory)
- [ ] Create session ID generation system
- [ ] Add user anonymization support (GDPR/privacy)
- [ ] Test context retrieval across multiple conversations

### 3. RAG (Retrieval-Augmented Generation)

- [ ] Select vector database (Pinecone, Weaviate, or local FAISS)
- [ ] Implement embedding generation (OpenAI embeddings or local)
- [ ] Create semantic search for relevant context
- [ ] Design retrieval prompt injection strategy
- [ ] Test accuracy of context-enhanced responses

### 4. Personalization Engine

- [ ] Track user preferences (conversation style, topics)
- [ ] Implement nickname/identity learning
- [ ] Create mood/emotional state tracking
- [ ] Design adaptive response tuning
- [ ] Test personalization without compromising safety boundaries

---

## 🏗️ Proposed Architecture

### Memory Stack

```
┌─────────────────────────────────────────────┐
│ User Input                                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ SafetyFilter (Phase 3 ✅)                   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ MemoryService                               │
│ - Load conversation history                 │
│ - Retrieve relevant context (RAG)           │
│ - Apply user preferences                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ ClaudeService (Phase 3 ✅)                  │
│ - Enhanced with memory context              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ PersonaValidator (Phase 3 ✅)               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ MemoryService.store()                       │
│ - Save conversation turn                    │
│ - Update embeddings                         │
│ - Track preferences                         │
└─────────────────────────────────────────────┘
```

### Data Models (Proposed)

**ConversationMessage**:

```typescript
interface ConversationMessage {
  id: string;
  sessionId: string;
  userId: string; // anonymized
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tokens: number;
  embedding?: number[]; // for RAG
  metadata?: {
    emotion?: string;
    safety_check?: SafetyResult;
  };
}
```

**UserProfile**:

```typescript
interface UserProfile {
  userId: string; // anonymized
  preferences: {
    nickname?: string;
    conversationStyle?: "playful" | "supportive" | "balanced";
    topics?: string[]; // interests
  };
  boundaries: {
    memoryEnabled: boolean;
    dataRetentionDays: number;
    shareWithAvatar: boolean;
  };
  created: Date;
  lastActive: Date;
}
```

**SessionContext**:

```typescript
interface SessionContext {
  sessionId: string;
  userId: string;
  messages: ConversationMessage[];
  preferences: UserProfile["preferences"];
  startTime: Date;
  lastActivity: Date;
}
```

---

## 🔧 Technology Decisions Needed

### 1. Storage Backend

**Options:**

- **SQLite** (local, simple, no external deps) ✅ **RECOMMENDED for MVP**
- **Redis** (fast, in-memory, requires separate service)
- **PostgreSQL** (robust, relational, overkill for current scale)

**Decision**: Start with SQLite for simplicity, migrate to Redis/Postgres if scale demands.

### 2. Vector Database (RAG)

**Options:**

- **FAISS** (local, fast, no cost) ✅ **RECOMMENDED for MVP**
- **Pinecone** (managed, scalable, $70/mo minimum)
- **Weaviate** (self-hosted, open-source, more complex)

**Decision**: FAISS for local development, evaluate Pinecone for production scale.

### 3. Embeddings

**Options:**

- **OpenAI Embeddings** (`text-embedding-3-small` - $0.02/1M tokens)
- **Sentence Transformers** (local, free, slightly lower quality)

**Decision**: Start with Sentence Transformers to avoid external API dependency during dev.

---

## 📦 New Dependencies Required

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.0", // SQLite driver
    "uuid": "^9.0.1", // Session ID generation
    "@xenova/transformers": "^2.6.0", // Local embeddings (FAISS alternative)
    "faiss-node": "^0.5.0" // Vector similarity search
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/uuid": "^9.0.7"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Target: 50+ tests)

- Message storage/retrieval
- Session management
- Embedding generation
- Context ranking (relevance scoring)
- Privacy compliance (data deletion)

### Integration Tests (Target: 20+ tests)

- End-to-end conversation with memory
- RAG context injection accuracy
- Preference learning over time
- Multi-session continuity
- GDPR right-to-be-forgotten

---

## 🔐 Privacy & Safety Considerations

**Critical from Phase 3:**

- ✅ All memory features MUST respect safety boundaries
- ✅ No storage of flagged/rejected content
- ✅ User consent required before enabling memory
- ✅ Clear data retention policies (default: 30 days)
- ✅ Anonymous user IDs (no PII in database)

**New for Phase 4:**

- [ ] Implement "forget this conversation" command
- [ ] Add "clear my memory" tool
- [ ] Create data export functionality (GDPR compliance)
- [ ] Log all memory access for audit trail

---

## 🎯 Success Criteria

**Phase 4 is complete when:**

1. ✅ Conversations persist across sessions
2. ✅ Bambi remembers user preferences (nickname, topics)
3. ✅ RAG successfully retrieves relevant past context
4. ✅ Personalization doesn't compromise safety boundaries
5. ✅ Privacy controls implemented (consent, deletion)
6. ✅ 70+ tests passing (50 unit + 20 integration)
7. ✅ Documentation complete for memory system

---

## 📅 Estimated Timeline

**Phase 4 Duration**: 2-3 weeks (based on Phase 3 = 1 week)

**Breakdown:**

- Week 1: Storage backend + conversation history (40 hrs)
- Week 2: RAG implementation + embeddings (30 hrs)
- Week 3: Personalization engine + privacy tools (30 hrs)

**Total**: ~100 development hours

---

## 🚦 Next Immediate Actions

1. **Install Dependencies**:

   ```powershell
   cd mcp-server
   npm install better-sqlite3 uuid @xenova/transformers faiss-node
   npm install -D @types/better-sqlite3 @types/uuid
   ```

2. **Create File Structure**:

   ```
   mcp-server/src/
   ├── services/
   │   ├── memory.ts          # Conversation storage
   │   ├── embeddings.ts      # Vector generation
   │   └── rag.ts             # Context retrieval
   ├── database/
   │   ├── schema.ts          # SQLite schema
   │   └── migrations/        # Schema versioning
   └── __tests__/
       └── memory.test.ts     # Memory service tests
   ```

3. **Update MCP Tools**:

   - Add `memory_recall` tool (retrieve past context)
   - Add `memory_forget` tool (delete conversation)
   - Add `memory_status` tool (show stored data)

4. **Create Test Database**:
   - SQLite file: `mcp-server/data/test.db`
   - Schema: messages, users, sessions, embeddings

---

## 📚 Reference Materials

- **SQLite Docs**: https://github.com/WiseLibs/better-sqlite3
- **FAISS Tutorial**: https://github.com/facebookresearch/faiss/wiki
- **Sentence Transformers**: https://huggingface.co/sentence-transformers
- **RAG Best Practices**: https://docs.anthropic.com/claude/docs/guide-to-rag
- **GDPR Compliance**: https://gdpr.eu/right-to-be-forgotten/

---

## 🌸 Alignment with BambiSleep™ Brand

**Memory features enhance intimacy:**

- "I remember you told me about [topic], babe—how's that going?" 💜
- "Your nickname is [name], right? I've got you, hon." 🌸
- "Last time we talked, you seemed [emotion]—feeling better today?" ✨

**Privacy respects boundaries:**

- "Want me to remember this conversation, or keep it private?" 🔮
- "You can say 'forget this' anytime, and I'll erase it—your choice." ⚡

---

**Phase 4 Status**: READY TO START 🚀  
**Lead Developer**: [Your Name]  
**Contact**: @BambiSleepChurch/dev-team
