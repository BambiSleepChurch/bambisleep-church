# Memory & Persistence System - Game Plan

## Executive Summary

**Goal**: Implement a comprehensive memory system that enables long-term learning, user preference retention, conversation summarization, and cross-session context.

**Architecture Decision**: Extend the existing Knowledge Graph with typed entities rather than creating separate data stores.

**Estimated Scope**: ~3000 lines of new code across 15 files

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Compartments](#2-data-compartments)
3. [Entity Type Schema](#3-entity-type-schema)
4. [Observation Standards](#4-observation-standards)
5. [Relation Vocabulary](#5-relation-vocabulary)
6. [Implementation Phases](#6-implementation-phases)
7. [API Design](#7-api-design)
8. [Agent Tools](#8-agent-tools)
9. [Dashboard Integration](#9-dashboard-integration)
10. [Testing Strategy](#10-testing-strategy)
11. [File Manifest](#11-file-manifest)

---

## 1. Architecture Overview

### Design Principles

| Principle                | Implementation                                 |
| ------------------------ | ---------------------------------------------- |
| **Simplicity**           | Single data model (Knowledge Graph)            |
| **Precision**            | Typed entities with structured metadata        |
| **Accuracy**             | Timestamps, confidence scores, source tracking |
| **Compartmentalization** | Prefix-based entity type namespacing           |

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE GRAPH (Single Source)               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   user:*     │  │conversation:*│  │ workspace:*  │          │
│  │  Preferences │  │  Summaries   │  │   Projects   │          │
│  │  Patterns    │  │  Contexts    │  │    Files     │          │
│  │  Profile     │  │  History     │  │   Patterns   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         └────────────┬────┴─────────────────┘                  │
│                      ▼                                          │
│              ┌──────────────┐                                   │
│              │  memory:*    │                                   │
│              │   Indexes    │                                   │
│              │   Metadata   │                                   │
│              └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Memory  │   │ MongoDB  │   │ Storage  │
        │   MCP    │   │   MCP    │   │   MCP    │
        │ (Primary)│   │(Persist) │   │ (Backup) │
        └──────────┘   └──────────┘   └──────────┘
```

### Why This Approach?

1. **Reuse Existing Infrastructure**: Memory MCP already provides entity/relation/observation primitives
2. **Single Query Interface**: All memory queries go through one API
3. **Natural Relationships**: Relations already exist to connect entities
4. **Visualization Ready**: MemoryGraph.js can display all memory types
5. **No Schema Migrations**: Flexible observation model

---

## 2. Data Compartments

### 2.1 User Data (`user:*`)

All data about the current user - preferences, learned patterns, profile information.

| Entity Type       | Purpose                  | Example                     |
| ----------------- | ------------------------ | --------------------------- |
| `user:profile`    | Core identity & settings | `user:profile:main`         |
| `user:preference` | Explicit settings        | `user:preference:theme`     |
| `user:pattern`    | Learned behaviors        | `user:pattern:coding-style` |
| `user:expertise`  | Skill assessments        | `user:expertise:typescript` |
| `user:goal`       | Tracked objectives       | `user:goal:learn-rust`      |

### 2.2 Conversation Data (`conversation:*`)

All conversation history, summaries, and active context.

| Entity Type             | Purpose             | Example                                     |
| ----------------------- | ------------------- | ------------------------------------------- |
| `conversation:session`  | Single conversation | `conversation:session:2024-01-02-001`       |
| `conversation:summary`  | Compressed history  | `conversation:summary:week-2024-01`         |
| `conversation:context`  | Active context      | `conversation:context:current`              |
| `conversation:topic`    | Recurring topics    | `conversation:topic:phase-6`                |
| `conversation:decision` | Important decisions | `conversation:decision:use-knowledge-graph` |

### 2.3 Workspace Data (`workspace:*`)

All project and file understanding.

| Entity Type            | Purpose             | Example                                |
| ---------------------- | ------------------- | -------------------------------------- |
| `workspace:project`    | Project metadata    | `workspace:project:bambisleep-church`  |
| `workspace:file`       | File knowledge      | `workspace:file:src/servers/memory.js` |
| `workspace:pattern`    | Code patterns       | `workspace:pattern:handler-export`     |
| `workspace:convention` | Project conventions | `workspace:convention:file-headers`    |
| `workspace:dependency` | Dependency tracking | `workspace:dependency:node-test`       |

### 2.4 Memory Metadata (`memory:*`)

System-level memory management data.

| Entity Type         | Purpose          | Example                          |
| ------------------- | ---------------- | -------------------------------- |
| `memory:index`      | Search metadata  | `memory:index:tags`              |
| `memory:stats`      | Usage statistics | `memory:stats:daily`             |
| `memory:checkpoint` | Sync checkpoints | `memory:checkpoint:mongodb-sync` |

---

## 3. Entity Type Schema

### 3.1 Base Entity Structure

Every entity follows this structure (extending existing Memory MCP format):

```javascript
{
  name: "user:preference:theme",           // Namespaced unique ID
  entityType: "user:preference",           // Type for filtering
  observations: [                          // Array of facts
    "[2024-01-02T10:30:00Z] prefers dark mode",
    "[2024-01-02T10:30:00Z] source:explicit_setting",
    "[2024-01-02T10:30:00Z] confidence:1.0"
  ]
}
```

### 3.2 User Profile Entity

```javascript
{
  name: "user:profile:main",
  entityType: "user:profile",
  observations: [
    "[timestamp] name: {user_name}",
    "[timestamp] timezone: {timezone}",
    "[timestamp] communication_style: {concise|detailed|technical}",
    "[timestamp] experience_level: {beginner|intermediate|expert}",
    "[timestamp] primary_language: {language}",
    "[timestamp] active_hours: {start}-{end}"
  ]
}
```

### 3.3 User Preference Entity

```javascript
{
  name: "user:preference:{category}",
  entityType: "user:preference",
  observations: [
    "[timestamp] key: {preference_key}",
    "[timestamp] value: {preference_value}",
    "[timestamp] source: {explicit|inferred|default}",
    "[timestamp] confidence: {0.0-1.0}"
  ]
}
```

### 3.4 User Pattern Entity

```javascript
{
  name: "user:pattern:{pattern_name}",
  entityType: "user:pattern",
  observations: [
    "[timestamp] description: {what the pattern is}",
    "[timestamp] occurrences: {count}",
    "[timestamp] first_seen: {timestamp}",
    "[timestamp] last_seen: {timestamp}",
    "[timestamp] confidence: {0.0-1.0}",
    "[timestamp] examples: {json_array}"
  ]
}
```

### 3.5 Conversation Session Entity

```javascript
{
  name: "conversation:session:{session_id}",
  entityType: "conversation:session",
  observations: [
    "[timestamp] started_at: {timestamp}",
    "[timestamp] ended_at: {timestamp}",
    "[timestamp] message_count: {count}",
    "[timestamp] summary: {brief_summary}",
    "[timestamp] key_topics: {json_array}",
    "[timestamp] key_decisions: {json_array}",
    "[timestamp] tools_used: {json_array}",
    "[timestamp] files_touched: {json_array}"
  ]
}
```

### 3.6 Conversation Summary Entity

```javascript
{
  name: "conversation:summary:{timeframe}",
  entityType: "conversation:summary",
  observations: [
    "[timestamp] period: {daily|weekly|monthly}",
    "[timestamp] start_date: {date}",
    "[timestamp] end_date: {date}",
    "[timestamp] session_count: {count}",
    "[timestamp] summary: {compressed_summary}",
    "[timestamp] key_achievements: {json_array}",
    "[timestamp] recurring_topics: {json_array}",
    "[timestamp] open_items: {json_array}"
  ]
}
```

### 3.7 Workspace Project Entity

```javascript
{
  name: "workspace:project:{project_name}",
  entityType: "workspace:project",
  observations: [
    "[timestamp] path: {absolute_path}",
    "[timestamp] type: {node|python|mixed}",
    "[timestamp] framework: {framework_name}",
    "[timestamp] description: {what_it_does}",
    "[timestamp] structure: {json_structure}",
    "[timestamp] conventions: {json_array}",
    "[timestamp] last_accessed: {timestamp}"
  ]
}
```

### 3.8 Workspace File Entity

```javascript
{
  name: "workspace:file:{relative_path}",
  entityType: "workspace:file",
  observations: [
    "[timestamp] purpose: {what_file_does}",
    "[timestamp] exports: {json_array}",
    "[timestamp] imports: {json_array}",
    "[timestamp] size_lines: {count}",
    "[timestamp] last_modified: {timestamp}",
    "[timestamp] last_read: {timestamp}",
    "[timestamp] edit_count: {count}"
  ]
}
```

---

## 4. Observation Standards

### 4.1 Timestamp Format

All observations MUST be prefixed with ISO 8601 timestamp:

```
[2024-01-02T10:30:00.000Z] key: value
```

### 4.2 Standard Observation Types

| Prefix        | Purpose             | Example                              |
| ------------- | ------------------- | ------------------------------------ |
| (none)        | Human-readable fact | `prefers TypeScript over JavaScript` |
| `key:`        | Structured data     | `key: theme`                         |
| `value:`      | Structured value    | `value: dark`                        |
| `source:`     | How we learned this | `source: explicit_setting`           |
| `confidence:` | Certainty level     | `confidence: 0.85`                   |
| `count:`      | Numeric counter     | `count: 42`                          |
| `json:`       | Complex data        | `json: {"a":1,"b":2}`                |

### 4.3 Source Types

| Source               | Meaning                   | Confidence Base |
| -------------------- | ------------------------- | --------------- |
| `explicit_setting`   | User explicitly set       | 1.0             |
| `user_correction`    | User corrected agent      | 0.95            |
| `direct_statement`   | User said in conversation | 0.9             |
| `repeated_behavior`  | Observed multiple times   | 0.7-0.9         |
| `single_observation` | Seen once                 | 0.5             |
| `inference`          | Derived from other facts  | 0.3-0.7         |
| `default`            | System default            | 0.1             |

### 4.4 Confidence Decay

Confidence decays over time for non-explicit sources:

```javascript
const decayFactor = Math.exp(-daysSinceLastSeen / halfLife);
// halfLife = 30 days for patterns
// halfLife = 90 days for preferences
// halfLife = 7 days for workspace files
```

---

## 5. Relation Vocabulary

### 5.1 User Relations

| Relation Type      | From         | To                 | Example                        |
| ------------------ | ------------ | ------------------ | ------------------------------ |
| `has_preference`   | user:profile | user:preference:\* | Profile → Theme preference     |
| `exhibits_pattern` | user:profile | user:pattern:\*    | Profile → Coding pattern       |
| `has_expertise_in` | user:profile | user:expertise:\*  | Profile → TypeScript expertise |
| `working_on`       | user:profile | user:goal:\*       | Profile → Current goal         |

### 5.2 Conversation Relations

| Relation Type     | From                 | To                    | Example                  |
| ----------------- | -------------------- | --------------------- | ------------------------ |
| `summarized_in`   | conversation:session | conversation:summary  | Session → Weekly summary |
| `discussed_topic` | conversation:session | conversation:topic    | Session → Phase 6 topic  |
| `made_decision`   | conversation:session | conversation:decision | Session → Decision       |
| `mentioned`       | conversation:session | \*                    | Session → Any entity     |
| `continues_from`  | conversation:session | conversation:session  | Session chain            |

### 5.3 Workspace Relations

| Relation Type        | From              | To                   | Example           |
| -------------------- | ----------------- | -------------------- | ----------------- |
| `contains_file`      | workspace:project | workspace:file       | Project → File    |
| `imports`            | workspace:file    | workspace:file       | File → Dependency |
| `exports_to`         | workspace:file    | workspace:file       | File → Consumer   |
| `follows_pattern`    | workspace:file    | workspace:pattern    | File → Pattern    |
| `follows_convention` | workspace:file    | workspace:convention | File → Convention |

### 5.4 Cross-Domain Relations

| Relation Type  | From            | To                   | Example                  |
| -------------- | --------------- | -------------------- | ------------------------ |
| `modified_in`  | workspace:file  | conversation:session | File → When changed      |
| `prefers_for`  | user:preference | workspace:\*         | Preference → Context     |
| `learned_from` | user:pattern    | conversation:session | Pattern → Source session |

---

## 6. Implementation Phases

### Phase A: Schema & Types (Foundation)

**Duration**: 1 session  
**Files**: 1 new file

| Task | Description                                   |
| ---- | --------------------------------------------- |
| A.1  | Create `src/servers/memory-schema.js`         |
| A.2  | Define entity type constants                  |
| A.3  | Define relation type constants                |
| A.4  | Create observation parser/formatter utilities |
| A.5  | Create entity validation functions            |
| A.6  | Create confidence calculation utilities       |

**Deliverables**:

```
src/servers/memory-schema.js (~300 lines)
├── ENTITY_TYPES constant
├── RELATION_TYPES constant
├── OBSERVATION_SOURCES constant
├── formatObservation(key, value, source, confidence)
├── parseObservation(observationString)
├── validateEntity(entity, type)
├── calculateConfidence(source, age, occurrences)
└── applyDecay(confidence, daysSince, halfLife)
```

---

### Phase B: User Model System

**Duration**: 1-2 sessions  
**Files**: 2 new files  
**Dependencies**: Phase A

| Task | Description                               |
| ---- | ----------------------------------------- |
| B.1  | Create `src/servers/user-model.js`        |
| B.2  | Implement UserPreferences class           |
| B.3  | Implement UserPatterns class              |
| B.4  | Implement UserProfile class               |
| B.5  | Create preference learning algorithms     |
| B.6  | Create pattern detection algorithms       |
| B.7  | Create `tests/servers/user-model.test.js` |

**Deliverables**:

```
src/servers/user-model.js (~500 lines)
├── UserPreferences
│   ├── get(category, key)
│   ├── set(category, key, value, source)
│   ├── learn(category, key, value, confidence)
│   ├── getAll(category?)
│   └── export()
├── UserPatterns
│   ├── track(patternName, data)
│   ├── detect(behaviorData)
│   ├── get(patternName)
│   ├── getConfident(minConfidence)
│   └── decay()
├── UserProfile
│   ├── get(field)
│   ├── set(field, value)
│   ├── getExpertise(domain)
│   ├── updateExpertise(domain, level)
│   └── getCommunicationStyle()
└── userModelHandlers (API export)

tests/servers/user-model.test.js (~200 lines)
├── UserPreferences tests (10)
├── UserPatterns tests (10)
└── UserProfile tests (8)
```

---

### Phase C: Conversation Memory

**Duration**: 1-2 sessions  
**Files**: 2 new files  
**Dependencies**: Phase A, Phase B

| Task | Description                                        |
| ---- | -------------------------------------------------- |
| C.1  | Create `src/servers/conversation-memory.js`        |
| C.2  | Implement ConversationStore class                  |
| C.3  | Implement Summarizer class (LM Studio integration) |
| C.4  | Implement ContextManager class                     |
| C.5  | Create session start/end hooks                     |
| C.6  | Create summarization triggers                      |
| C.7  | Create `tests/servers/conversation-memory.test.js` |

**Deliverables**:

```
src/servers/conversation-memory.js (~600 lines)
├── ConversationStore
│   ├── startSession()
│   ├── endSession(summary?)
│   ├── addMessage(role, content, metadata)
│   ├── getSession(sessionId)
│   ├── getSessions(filter)
│   └── getRecentContext(limit)
├── Summarizer
│   ├── summarizeSession(sessionId)
│   ├── summarizePeriod(start, end)
│   ├── extractKeyPoints(messages)
│   ├── extractDecisions(messages)
│   └── compressToTokenLimit(text, maxTokens)
├── ContextManager
│   ├── getCurrentContext()
│   ├── updateContext(key, value)
│   ├── getActiveTopics()
│   ├── getPendingTasks()
│   └── buildPromptContext(maxTokens)
└── conversationHandlers (API export)

tests/servers/conversation-memory.test.js (~250 lines)
├── ConversationStore tests (12)
├── Summarizer tests (8)
└── ContextManager tests (10)
```

---

### Phase D: Workspace Memory

**Duration**: 1 session  
**Files**: 2 new files  
**Dependencies**: Phase A

| Task | Description                                     |
| ---- | ----------------------------------------------- |
| D.1  | Create `src/servers/workspace-memory.js`        |
| D.2  | Implement ProjectTracker class                  |
| D.3  | Implement FileKnowledge class                   |
| D.4  | Implement PatternLearner class                  |
| D.5  | Create file analysis utilities                  |
| D.6  | Create `tests/servers/workspace-memory.test.js` |

**Deliverables**:

```
src/servers/workspace-memory.js (~400 lines)
├── ProjectTracker
│   ├── analyzeProject(path)
│   ├── getProject(name)
│   ├── updateProject(name, data)
│   ├── getStructure(name)
│   └── getConventions(name)
├── FileKnowledge
│   ├── learnFile(path, analysis)
│   ├── getFile(path)
│   ├── getFilesByPurpose(purpose)
│   ├── getDependencies(path)
│   └── getRecentlyModified(limit)
├── PatternLearner
│   ├── learnPattern(name, examples)
│   ├── getPattern(name)
│   ├── matchPattern(code)
│   └── getProjectPatterns(projectName)
└── workspaceHandlers (API export)

tests/servers/workspace-memory.test.js (~150 lines)
├── ProjectTracker tests (8)
├── FileKnowledge tests (8)
└── PatternLearner tests (6)
```

---

### Phase E: Memory Manager

**Duration**: 1 session  
**Files**: 2 new files  
**Dependencies**: Phases A-D

| Task | Description                                   |
| ---- | --------------------------------------------- |
| E.1  | Create `src/servers/memory-manager.js`        |
| E.2  | Implement MemoryLifecycle class               |
| E.3  | Implement MemorySearch class                  |
| E.4  | Implement MemorySync class                    |
| E.5  | Create decay/cleanup routines                 |
| E.6  | Create MongoDB persistence layer              |
| E.7  | Create `tests/servers/memory-manager.test.js` |

**Deliverables**:

```
src/servers/memory-manager.js (~500 lines)
├── MemoryLifecycle
│   ├── applyDecay()
│   ├── cleanup(threshold)
│   ├── archive(olderThan)
│   ├── restore(entityNames)
│   └── getStats()
├── MemorySearch
│   ├── search(query, options)
│   ├── searchByType(entityType, query)
│   ├── searchByTimeRange(start, end)
│   ├── searchByConfidence(min, max)
│   └── getRelated(entityName, depth)
├── MemorySync
│   ├── saveToMongoDB()
│   ├── loadFromMongoDB()
│   ├── saveToFile(path)
│   ├── loadFromFile(path)
│   └── getLastSyncTime()
└── memoryManagerHandlers (API export)

tests/servers/memory-manager.test.js (~200 lines)
├── MemoryLifecycle tests (8)
├── MemorySearch tests (10)
└── MemorySync tests (6)
```

---

### Phase F: API & Tools

**Duration**: 1 session  
**Files**: 2 modified files  
**Dependencies**: Phases A-E

| Task | Description                                  |
| ---- | -------------------------------------------- |
| F.1  | Add user model routes to `routes.js`         |
| F.2  | Add conversation routes to `routes.js`       |
| F.3  | Add workspace routes to `routes.js`          |
| F.4  | Add memory manager routes to `routes.js`     |
| F.5  | Add user model tools to `agent-tools.js`     |
| F.6  | Add conversation tools to `agent-tools.js`   |
| F.7  | Add workspace tools to `agent-tools.js`      |
| F.8  | Add memory manager tools to `agent-tools.js` |
| F.9  | Update OpenAPI spec                          |

**New Routes** (20+):

```
GET  /api/user/profile
PUT  /api/user/profile
GET  /api/user/preferences
PUT  /api/user/preferences/:category
GET  /api/user/patterns
GET  /api/user/patterns/:name
GET  /api/conversation/current
GET  /api/conversation/sessions
GET  /api/conversation/sessions/:id
POST /api/conversation/sessions/:id/summarize
GET  /api/conversation/summaries
GET  /api/conversation/context
GET  /api/workspace/projects
GET  /api/workspace/projects/:name
GET  /api/workspace/files/:path
GET  /api/memory/search
GET  /api/memory/stats
POST /api/memory/sync
POST /api/memory/cleanup
POST /api/memory/decay
```

**New Tools** (20+):

```
get_user_profile, set_user_profile
get_preference, set_preference, learn_preference
get_pattern, track_pattern, detect_patterns
get_current_context, update_context
get_conversation_history, summarize_conversation
get_project_info, learn_file, get_file_knowledge
search_memory, get_related_memories
sync_memory, cleanup_memory
```

---

### Phase G: Dashboard Integration

**Duration**: 1 session  
**Files**: 3+ new/modified files  
**Dependencies**: Phase F

| Task | Description                           |
| ---- | ------------------------------------- |
| G.1  | Create `MemoryDashboard.js` component |
| G.2  | Add user preferences UI               |
| G.3  | Add conversation history viewer       |
| G.4  | Add memory statistics panel           |
| G.5  | Add memory search interface           |
| G.6  | Add CSS for memory components         |
| G.7  | Integrate with existing dashboard     |

**Deliverables**:

```
src/dashboard/js/components/MemoryDashboard.js (~300 lines)
├── renderMemoryDashboard()
├── renderUserPreferences()
├── renderPatternsList()
├── renderConversationHistory()
├── renderMemoryStats()
├── renderMemorySearch()
└── Event handlers

src/dashboard/css/components/memory.css (~200 lines)
├── .memory-dashboard styles
├── .preference-editor styles
├── .pattern-card styles
├── .conversation-timeline styles
└── .memory-search styles
```

---

## 7. API Design

### 7.1 User Model Endpoints

```yaml
/api/user/profile:
  GET:
    description: Get user profile
    response: { name, timezone, communicationStyle, experienceLevel }
  PUT:
    description: Update user profile
    body: { field, value }

/api/user/preferences:
  GET:
    description: Get all preferences
    query: { category? }
    response: { preferences: [] }

/api/user/preferences/{category}:
  PUT:
    description: Set preference
    body: { key, value, source? }

/api/user/patterns:
  GET:
    description: Get detected patterns
    query: { minConfidence? }
    response: { patterns: [] }

/api/user/patterns/{name}:
  GET:
    description: Get specific pattern
    response: { name, description, confidence, occurrences, examples }
```

### 7.2 Conversation Endpoints

```yaml
/api/conversation/current:
  GET:
    description: Get current session context
    response: { sessionId, startedAt, messageCount, topics, context }

/api/conversation/sessions:
  GET:
    description: List sessions
    query: { limit?, startDate?, endDate? }
    response: { sessions: [] }

/api/conversation/sessions/{id}:
  GET:
    description: Get session details
    response: { id, startedAt, endedAt, summary, keyPoints, decisions }

/api/conversation/sessions/{id}/summarize:
  POST:
    description: Generate/regenerate summary
    response: { summary, keyPoints, decisions }

/api/conversation/summaries:
  GET:
    description: Get period summaries
    query: { period: daily|weekly|monthly }
    response: { summaries: [] }
```

### 7.3 Workspace Endpoints

```yaml
/api/workspace/projects:
  GET:
    description: List known projects
    response: { projects: [] }

/api/workspace/projects/{name}:
  GET:
    description: Get project details
    response: { name, path, type, framework, structure, conventions }

/api/workspace/files/{path}:
  GET:
    description: Get file knowledge
    response: { path, purpose, exports, imports, lastModified }
```

### 7.4 Memory Manager Endpoints

```yaml
/api/memory/search:
  GET:
    description: Search memory
    query: { q, type?, minConfidence?, limit? }
    response: { results: [], total }

/api/memory/stats:
  GET:
    description: Get memory statistics
    response: { entityCount, relationCount, byType: {}, lastSync }

/api/memory/sync:
  POST:
    description: Sync to persistent storage
    body: { target: mongodb|file }
    response: { success, syncedAt, entityCount }

/api/memory/cleanup:
  POST:
    description: Run cleanup routine
    body: { threshold? }
    response: { removed, archived }

/api/memory/decay:
  POST:
    description: Apply confidence decay
    response: { updated, decayed }
```

---

## 8. Agent Tools

### 8.1 User Model Tools

```javascript
{
  name: "get_user_preference",
  description: "Get a user preference value",
  parameters: {
    category: { type: "string", required: true },
    key: { type: "string", required: true }
  }
}

{
  name: "set_user_preference",
  description: "Set a user preference value",
  parameters: {
    category: { type: "string", required: true },
    key: { type: "string", required: true },
    value: { type: "any", required: true },
    source: { type: "string", enum: ["explicit", "inferred"] }
  }
}

{
  name: "learn_user_preference",
  description: "Learn a preference from observed behavior",
  parameters: {
    category: { type: "string", required: true },
    key: { type: "string", required: true },
    value: { type: "any", required: true },
    confidence: { type: "number", min: 0, max: 1 }
  }
}

{
  name: "track_user_pattern",
  description: "Record a user behavior pattern occurrence",
  parameters: {
    patternName: { type: "string", required: true },
    data: { type: "object" }
  }
}

{
  name: "get_user_patterns",
  description: "Get detected user patterns",
  parameters: {
    minConfidence: { type: "number", default: 0.5 }
  }
}

{
  name: "get_user_profile",
  description: "Get user profile information",
  parameters: {
    fields: { type: "array", items: "string" }
  }
}

{
  name: "update_user_expertise",
  description: "Update user expertise level in a domain",
  parameters: {
    domain: { type: "string", required: true },
    level: { type: "string", enum: ["beginner", "intermediate", "advanced", "expert"] },
    evidence: { type: "string" }
  }
}
```

### 8.2 Conversation Tools

```javascript
{
  name: "get_conversation_context",
  description: "Get current conversation context",
  parameters: {
    includeHistory: { type: "boolean", default: false },
    maxMessages: { type: "number", default: 10 }
  }
}

{
  name: "update_conversation_context",
  description: "Update current context with new information",
  parameters: {
    key: { type: "string", required: true },
    value: { type: "any", required: true }
  }
}

{
  name: "get_conversation_history",
  description: "Get past conversation summaries",
  parameters: {
    days: { type: "number", default: 7 },
    limit: { type: "number", default: 10 }
  }
}

{
  name: "search_conversations",
  description: "Search past conversations",
  parameters: {
    query: { type: "string", required: true },
    limit: { type: "number", default: 5 }
  }
}

{
  name: "get_pending_tasks",
  description: "Get unresolved tasks from conversations",
  parameters: {}
}

{
  name: "mark_task_complete",
  description: "Mark a pending task as complete",
  parameters: {
    taskId: { type: "string", required: true }
  }
}
```

### 8.3 Workspace Tools

```javascript
{
  name: "get_project_context",
  description: "Get current project understanding",
  parameters: {
    projectName: { type: "string" }
  }
}

{
  name: "learn_file_purpose",
  description: "Record understanding of a file's purpose",
  parameters: {
    path: { type: "string", required: true },
    purpose: { type: "string", required: true },
    exports: { type: "array", items: "string" },
    imports: { type: "array", items: "string" }
  }
}

{
  name: "get_file_knowledge",
  description: "Get stored knowledge about a file",
  parameters: {
    path: { type: "string", required: true }
  }
}

{
  name: "find_files_by_purpose",
  description: "Find files matching a purpose description",
  parameters: {
    purpose: { type: "string", required: true },
    limit: { type: "number", default: 10 }
  }
}

{
  name: "learn_code_pattern",
  description: "Learn a code pattern from examples",
  parameters: {
    name: { type: "string", required: true },
    description: { type: "string", required: true },
    examples: { type: "array", items: "string" }
  }
}
```

### 8.4 Memory Manager Tools

```javascript
{
  name: "search_memory",
  description: "Search across all memory types",
  parameters: {
    query: { type: "string", required: true },
    types: { type: "array", items: "string" },
    minConfidence: { type: "number", default: 0.3 },
    limit: { type: "number", default: 10 }
  }
}

{
  name: "get_related_memories",
  description: "Get memories related to an entity",
  parameters: {
    entityName: { type: "string", required: true },
    depth: { type: "number", default: 2 }
  }
}

{
  name: "get_memory_stats",
  description: "Get memory system statistics",
  parameters: {}
}

{
  name: "sync_memory",
  description: "Sync memory to persistent storage",
  parameters: {
    target: { type: "string", enum: ["mongodb", "file"], default: "mongodb" }
  }
}
```

---

## 9. Dashboard Integration

### 9.1 Memory Dashboard Panel

New section in dashboard with tabs:

```
┌─────────────────────────────────────────────────────────────┐
│  Memory & Persistence                              [Sync]   │
├─────────────────────────────────────────────────────────────┤
│  [Preferences] [Patterns] [History] [Workspace] [Stats]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tab Content Area                                    │   │
│  │                                                      │   │
│  │  (Dynamic content based on selected tab)             │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Preferences Tab

```
┌─────────────────────────────────────────────────────────────┐
│  User Preferences                                           │
├─────────────────────────────────────────────────────────────┤
│  Theme                                                      │
│  ├── Dark Mode: [ON] (explicit)                            │
│  └── Accent Color: cyan (default)                          │
│                                                             │
│  Communication                                              │
│  ├── Style: Concise (inferred, 85%)                        │
│  └── Technical Level: Expert (inferred, 92%)               │
│                                                             │
│  Coding                                                     │
│  ├── Primary Language: TypeScript (learned, 78%)           │
│  ├── Indentation: 2 spaces (explicit)                      │
│  └── Line Length: 100 (inferred, 65%)                      │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Patterns Tab

```
┌─────────────────────────────────────────────────────────────┐
│  Detected Patterns                          [Min: 50%] ▼    │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Uses ES Modules                           95% ████▓  │ │
│  │  Seen 127 times • Last: 2 min ago                     │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Prefers async/await                       88% ████▒  │ │
│  │  Seen 84 times • Last: 1 hour ago                     │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Documents with JSDoc                      72% ███▒   │ │
│  │  Seen 45 times • Last: 3 hours ago                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 History Tab

```
┌─────────────────────────────────────────────────────────────┐
│  Conversation History                     [This Week] ▼     │
├─────────────────────────────────────────────────────────────┤
│  Today                                                      │
│  ├── 10:30 - Phase 6 Completion (45 min)                   │
│  │   ├── Completed wizard component                        │
│  │   ├── Added template library                            │
│  │   └── Implemented rate limiting                         │
│  │                                                          │
│  └── 08:15 - Documentation Update (20 min)                 │
│      └── Updated CHANGELOG and TODO                        │
│                                                             │
│  Yesterday                                                  │
│  └── 14:00 - Dashboard Integration (2 hrs)                 │
│      ├── Added workspace panel                             │
│      └── Implemented WebSocket rendering                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Module                 | Test Count | Focus Areas                        |
| ---------------------- | ---------- | ---------------------------------- |
| memory-schema.js       | 15         | Validation, formatting, confidence |
| user-model.js          | 28         | Preferences, patterns, profile     |
| conversation-memory.js | 30         | Sessions, summaries, context       |
| workspace-memory.js    | 22         | Projects, files, patterns          |
| memory-manager.js      | 24         | Lifecycle, search, sync            |
| **Total**              | **119**    |                                    |

### 10.2 Integration Tests

| Test Suite              | Test Count | Focus Areas          |
| ----------------------- | ---------- | -------------------- |
| User API routes         | 12         | CRUD operations      |
| Conversation API routes | 15         | Session lifecycle    |
| Workspace API routes    | 10         | Project/file queries |
| Memory API routes       | 10         | Search, sync, stats  |
| WebSocket events        | 8          | Real-time updates    |
| **Total**               | **55**     |                      |

### 10.3 Test Data Fixtures

Create `tests/fixtures/memory-fixtures.js`:

```javascript
export const sampleUserProfile = {
  name: "user:profile:main",
  entityType: "user:profile",
  observations: [
    "[2024-01-01T00:00:00Z] name: Test User",
    "[2024-01-01T00:00:00Z] timezone: UTC",
    "[2024-01-01T00:00:00Z] experience_level: expert",
  ],
};

export const sampleConversation = {
  /* ... */
};
export const sampleWorkspace = {
  /* ... */
};
```

---

## 11. File Manifest

### New Files (15)

| File                                             | Lines     | Phase |
| ------------------------------------------------ | --------- | ----- |
| `src/servers/memory-schema.js`                   | ~300      | A     |
| `src/servers/user-model.js`                      | ~500      | B     |
| `src/servers/conversation-memory.js`             | ~600      | C     |
| `src/servers/workspace-memory.js`                | ~400      | D     |
| `src/servers/memory-manager.js`                  | ~500      | E     |
| `src/dashboard/js/components/MemoryDashboard.js` | ~300      | G     |
| `src/dashboard/css/components/memory.css`        | ~200      | G     |
| `tests/servers/user-model.test.js`               | ~200      | B     |
| `tests/servers/conversation-memory.test.js`      | ~250      | C     |
| `tests/servers/workspace-memory.test.js`         | ~150      | D     |
| `tests/servers/memory-manager.test.js`           | ~200      | E     |
| `tests/fixtures/memory-fixtures.js`              | ~150      | B     |
| `docs/MEMORY_MCP_REFERENCE.md`                   | ~300      | G     |
| **Total**                                        | **~4050** |       |

### Modified Files (5)

| File                         | Changes          | Phase |
| ---------------------------- | ---------------- | ----- |
| `src/api/routes.js`          | +20 routes       | F     |
| `src/servers/agent-tools.js` | +20 tools        | F     |
| `src/api/openapi.js`         | +20 endpoints    | F     |
| `src/dashboard/index.html`   | +memory panel    | G     |
| `docs/TODO.md`               | Update checklist | All   |

---

## Summary

| Metric                | Value   |
| --------------------- | ------- |
| **Phases**            | 7 (A-G) |
| **New Files**         | 15      |
| **Modified Files**    | 5       |
| **New Lines of Code** | ~4000   |
| **New Agent Tools**   | 20+     |
| **New API Endpoints** | 20+     |
| **New Tests**         | ~170    |
| **Entity Types**      | 12      |
| **Relation Types**    | 15      |

**Key Benefits**:

- ✅ Single data model (Knowledge Graph)
- ✅ Typed entities for precision
- ✅ Timestamps + confidence for accuracy
- ✅ Clear compartmentalization via prefixes
- ✅ Builds on existing infrastructure
- ✅ Comprehensive test coverage
