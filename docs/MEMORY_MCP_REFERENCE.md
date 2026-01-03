# Memory & Persistence MCP Reference

> **BambiSleep™ Church MCP Control Tower**  
> Phase 7B: Memory & Persistence System

This document provides comprehensive reference for the memory and persistence modules that enable the AI agent to remember user preferences, conversation context, and workspace knowledge.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Module Reference](#module-reference)
  - [memory-schema.js](#memory-schemajs)
  - [user-model.js](#user-modeljs)
  - [conversation-memory.js](#conversation-memoryjs)
  - [workspace-memory.js](#workspace-memoryjs)
  - [memory-manager.js](#memory-managerjs)
- [API Endpoints](#api-endpoints)
- [Agent Tools](#agent-tools)
- [Entity Types](#entity-types)
- [Observation Format](#observation-format)
- [Confidence & Decay](#confidence--decay)
- [Usage Examples](#usage-examples)

---

## Overview

The Memory & Persistence system provides:

- **User Model**: Tracks preferences, behavior patterns, expertise levels, and profile data
- **Conversation Memory**: Manages session state, message history, and context continuity
- **Workspace Memory**: Learns project structure, file purposes, and coding patterns
- **Memory Manager**: Handles search, lifecycle (decay/cleanup), and persistence (MongoDB/file)

All memory is stored in a knowledge graph with entities, relations, and observations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Memory System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  User Model  │  │ Conversation │  │  Workspace   │          │
│  │              │  │    Memory    │  │    Memory    │          │
│  │ • Preferences│  │ • Sessions   │  │ • Projects   │          │
│  │ • Patterns   │  │ • Messages   │  │ • Files      │          │
│  │ • Profile    │  │ • Context    │  │ • Patterns   │          │
│  │ • Expertise  │  │ • Summaries  │  │ • Conventions│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └────────────┬────┴────────────────┘                   │
│                      │                                          │
│              ┌───────▼───────┐                                  │
│              │ Memory Graph  │ ◄── memory.js (Knowledge Graph)  │
│              │               │                                  │
│              │ • Entities    │                                  │
│              │ • Relations   │                                  │
│              │ • Observations│                                  │
│              └───────┬───────┘                                  │
│                      │                                          │
│              ┌───────▼───────┐                                  │
│              │Memory Manager │                                  │
│              │               │                                  │
│              │ • Search      │                                  │
│              │ • Lifecycle   │                                  │
│              │ • Sync        │                                  │
│              └───────┬───────┘                                  │
│                      │                                          │
│         ┌────────────┴────────────┐                            │
│         │                         │                             │
│    ┌────▼────┐             ┌──────▼─────┐                      │
│    │ MongoDB │             │  JSON File │                      │
│    │(Archive)│             │  (Export)  │                      │
│    └─────────┘             └────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Reference

### memory-schema.js

**Location**: `src/servers/memory-schema.js`  
**Lines**: ~490

Provides the foundational schema definitions for the memory system.

#### Entity Types

```javascript
import { ENTITY_TYPES } from "./memory-schema.js";

// User data
ENTITY_TYPES.USER_PROFILE; // 'user:profile'
ENTITY_TYPES.USER_PREFERENCE; // 'user:preference'
ENTITY_TYPES.USER_PATTERN; // 'user:pattern'
ENTITY_TYPES.USER_EXPERTISE; // 'user:expertise'

// Conversation data
ENTITY_TYPES.CONVERSATION_SESSION; // 'conversation:session'
ENTITY_TYPES.CONVERSATION_SUMMARY; // 'conversation:summary'
ENTITY_TYPES.CONVERSATION_CONTEXT; // 'conversation:context'

// Workspace data
ENTITY_TYPES.WORKSPACE_PROJECT; // 'workspace:project'
ENTITY_TYPES.WORKSPACE_FILE; // 'workspace:file'
ENTITY_TYPES.WORKSPACE_PATTERN; // 'workspace:pattern'

// Memory metadata
ENTITY_TYPES.MEMORY_INDEX; // 'memory:index'
ENTITY_TYPES.MEMORY_STATS; // 'memory:stats'
```

#### Relation Types

```javascript
import { RELATION_TYPES } from "./memory-schema.js";

RELATION_TYPES.HAS_PREFERENCE; // User → Preference
RELATION_TYPES.EXHIBITS_PATTERN; // User → Pattern
RELATION_TYPES.HAS_EXPERTISE; // User → Expertise
RELATION_TYPES.PART_OF_SESSION; // Message → Session
RELATION_TYPES.CONTINUES_FROM; // Session → Session
RELATION_TYPES.BELONGS_TO; // File → Project
RELATION_TYPES.IMPORTS; // File → File
RELATION_TYPES.USES_PATTERN; // Project → Pattern
```

#### Observation Sources

```javascript
import { OBSERVATION_SOURCES } from "./memory-schema.js";

OBSERVATION_SOURCES.EXPLICIT_SETTING; // { baseConfidence: 1.0, decayHalfLife: 365 }
OBSERVATION_SOURCES.DIRECT_STATEMENT; // { baseConfidence: 0.95, decayHalfLife: 180 }
OBSERVATION_SOURCES.STRONG_INFERENCE; // { baseConfidence: 0.8, decayHalfLife: 90 }
OBSERVATION_SOURCES.WEAK_INFERENCE; // { baseConfidence: 0.5, decayHalfLife: 30 }
OBSERVATION_SOURCES.SINGLE_OBSERVATION; // { baseConfidence: 0.3, decayHalfLife: 14 }
```

#### Utility Functions

```javascript
import {
  formatObservation, // Format observation string with timestamp
  formatSimpleObservation, // Simple key:value observation
  parseObservations, // Parse observation array to object
  createEntity, // Create entity with standard structure
  calculateConfidence, // Calculate confidence from source
  applyDecay, // Apply time-based confidence decay
  getDaysSince, // Calculate days since timestamp
  generateEntityName, // Generate namespaced entity name
  getSourceConfig, // Get source configuration by name
} from "./memory-schema.js";
```

---

### user-model.js

**Location**: `src/servers/user-model.js`  
**Lines**: ~664

Manages user preferences, patterns, profile, and expertise.

#### Classes

##### UserPreferences

```javascript
import { getUserPreferences } from "./user-model.js";

const prefs = getUserPreferences();

// Get a preference
const theme = prefs.get("theme", "mode"); // 'dark'

// Set explicitly (high confidence)
prefs.set("editor", "fontSize", 14, "explicit_setting");

// Learn from observation (lower confidence)
prefs.learn("ai", "verbosity", "concise", 0.6);

// Get all preferences
const all = prefs.getAll(); // { theme: {...}, editor: {...}, ai: {...} }
const editorPrefs = prefs.getAll("editor"); // { fontSize: 14, ... }
```

##### UserPatterns

```javascript
import { getUserPatterns } from "./user-model.js";

const patterns = getUserPatterns();

// Track a pattern occurrence
patterns.track("prefers-async-await", { file: "index.js" });

// Detect patterns from code
const detected = patterns.detect({
  code: "async function fetch() { await ... }",
  message: "How do I...",
});
// Returns: [{ name: 'prefers-async-await', confidence: 0.7 }]

// Get pattern details
const pattern = patterns.get("prefers-async-await");

// Get confident patterns
const confident = patterns.getConfident(0.5);

// Apply decay to all patterns
patterns.decay();
```

##### UserProfile

```javascript
import { getUserProfile } from "./user-model.js";

const profile = getUserProfile();

// Get/set profile fields
profile.set("name", "Alice");
profile.set("role", "Developer");
const name = profile.get("name");
const fullProfile = profile.getAll();

// Manage expertise
profile.updateExpertise("javascript", "advanced", 0.9);
profile.updateExpertise("python", "intermediate");
const jsExpertise = profile.getExpertise("javascript");
// Returns: { level: 'advanced', confidence: 0.9 }
```

#### Handlers

```javascript
import { userModelHandlers } from "./user-model.js";

// Available handlers for REST API
userModelHandlers.getProfile();
userModelHandlers.setProfileField(field, value);
userModelHandlers.getExpertise(domain);
userModelHandlers.updateExpertise(domain, level, confidence);
userModelHandlers.getPreference(category, key);
userModelHandlers.setPreference(category, key, value, source);
userModelHandlers.learnPreference(category, key, value, confidence);
userModelHandlers.getAllPreferences(category);
userModelHandlers.exportPreferences();
userModelHandlers.trackPattern(patternName, data);
userModelHandlers.detectPatterns(behaviorData);
userModelHandlers.getPattern(patternName);
userModelHandlers.getConfidentPatterns(minConfidence);
userModelHandlers.applyPatternDecay();
```

---

### conversation-memory.js

**Location**: `src/servers/conversation-memory.js`  
**Lines**: ~813

Manages conversation sessions, messages, and context.

#### Classes

##### ConversationStore

```javascript
import { getConversationStore } from "./conversation-memory.js";

const store = getConversationStore();

// Session management
const sessionId = store.startSession({ topic: "Code Review" });
store.addMessage("user", "Please review my code");
store.addMessage("assistant", "I will analyze...");
const session = store.endSession("Reviewed authentication module");

// Get session data
const current = store.getCurrentSessionId();
const sessionData = store.getSession(sessionId);
const allSessions = store.getSessions({ status: "completed" });

// Context retrieval
const recent = store.getRecentContext(10); // Last 10 messages
const buffer = store.getMessageBuffer();
```

##### Summarizer

```javascript
import { getSummarizer } from "./conversation-memory.js";

const summarizer = getSummarizer();

// Summarize a session (uses LLM)
const summary = await summarizer.summarizeSession(sessionId, messages);

// Summarize a time period
const periodSummary = await summarizer.summarizePeriod(
  new Date("2026-01-01"),
  new Date("2026-01-02")
);

// Extract insights
const keyPoints = summarizer.extractKeyPoints(messages);
const decisions = summarizer.extractDecisions(messages);
```

##### ContextManager

```javascript
import { getContextManager } from "./conversation-memory.js";

const context = getContextManager();

// Get/update context
const current = context.getCurrentContext();
context.updateContext("currentTopic", "Memory System");
context.updateContext("activeFile", "/src/memory.js");

// Task management
context.addPendingTask("Write unit tests", "high");
context.completeTask("Write unit tests");
const tasks = context.getPendingTasks();

// Topic tracking
const topics = context.getActiveTopics();

// Build prompt context for LLM
const promptContext = context.buildPromptContext(2000); // max tokens

// Reset
context.reset();
```

#### Handlers

```javascript
import { conversationHandlers } from "./conversation-memory.js";

// Session handlers
conversationHandlers.startSession(metadata);
conversationHandlers.endSession(summary);
conversationHandlers.addMessage(role, content, metadata);
conversationHandlers.getCurrentSession();
conversationHandlers.getSession(sessionId);
conversationHandlers.getSessions(filter);
conversationHandlers.getRecentContext(limit);
conversationHandlers.getMessageBuffer();

// Summarization handlers
conversationHandlers.summarizeSession(sessionId, messages);
conversationHandlers.summarizePeriod(start, end);
conversationHandlers.extractKeyPoints(messages);
conversationHandlers.extractDecisions(messages);

// Context handlers
conversationHandlers.getCurrentContext();
conversationHandlers.updateContext(key, value);
conversationHandlers.addPendingTask(task, priority);
conversationHandlers.completeTask(task);
conversationHandlers.getActiveTopics();
conversationHandlers.getPendingTasks();
conversationHandlers.buildPromptContext(maxTokens);
conversationHandlers.resetContext();
```

---

### workspace-memory.js

**Location**: `src/servers/workspace-memory.js`  
**Lines**: ~654

Tracks project structure, file knowledge, and coding patterns.

#### Classes

##### ProjectTracker

```javascript
import { getProjectTracker } from "./workspace-memory.js";

const tracker = getProjectTracker();

// Analyze and register a project
const project = tracker.analyzeProject("/path/to/project", {
  type: "nodejs",
  framework: "express",
  description: "REST API server",
  structure: { src: ["index.js", "routes/"], tests: ["*.test.js"] },
  conventions: { indent: "2 spaces", quotes: "single" },
});

// Get project info
const proj = tracker.getProject("my-project");
const structure = tracker.getStructure("my-project");
const conventions = tracker.getConventions("my-project");

// Update project
tracker.updateProject("my-project", { framework: "fastify" });

// List all projects
const projects = tracker.listProjects();
```

##### FileKnowledge

```javascript
import { getFileKnowledge } from "./workspace-memory.js";

const files = getFileKnowledge();

// Learn about a file
files.learnFile("/src/index.js", {
  purpose: "Application entry point",
  exports: ["startServer", "app"],
  imports: ["express", "./routes"],
  patterns: ["singleton", "factory"],
});

// Get file info
const file = files.getFile("/src/index.js");

// Find files by purpose
const configFiles = files.getFilesByPurpose("configuration");

// Get file dependencies
const deps = files.getDependencies("/src/index.js");

// Get recently modified
const recent = files.getRecentlyModified(10);
```

##### PatternLearner

```javascript
import { getPatternLearner } from "./workspace-memory.js";

const learner = getPatternLearner();

// Learn a pattern
learner.learnPattern("error-handling", {
  examples: [
    "try { ... } catch (e) { logger.error(e); }",
    "if (error) return { success: false, error };",
  ],
  description: "Standard error handling approach",
  project: "my-project",
});

// Get pattern
const pattern = learner.getPattern("error-handling");

// Match patterns in code
const matches = learner.matchPattern(`
  try {
    const result = await fetchData();
  } catch (error) {
    logger.error(error);
  }
`);

// Get project patterns
const projectPatterns = learner.getProjectPatterns("my-project");

// List all patterns
const allPatterns = learner.listPatterns();
```

#### Handlers

```javascript
import { workspaceHandlers } from "./workspace-memory.js";

// Project handlers
workspaceHandlers.analyzeProject(path, analysis);
workspaceHandlers.getProject(name);
workspaceHandlers.updateProject(name, data);
workspaceHandlers.getProjectStructure(name);
workspaceHandlers.getProjectConventions(name);
workspaceHandlers.listProjects();

// File handlers
workspaceHandlers.learnFile(path, analysis);
workspaceHandlers.getFile(path);
workspaceHandlers.getFilesByPurpose(purpose);
workspaceHandlers.getFileDependencies(path);
workspaceHandlers.getRecentlyModifiedFiles(limit);

// Pattern handlers
workspaceHandlers.learnPattern(name, pattern);
workspaceHandlers.getPattern(name);
workspaceHandlers.matchPatterns(code);
workspaceHandlers.getProjectPatterns(projectName);
workspaceHandlers.listPatterns();
```

---

### memory-manager.js

**Location**: `src/servers/memory-manager.js`  
**Lines**: ~790

Unified memory lifecycle, search, and persistence operations.

#### Classes

##### MemoryLifecycle

```javascript
import { getMemoryLifecycle } from "./memory-manager.js";

const lifecycle = getMemoryLifecycle();

// Apply confidence decay
const decayStats = lifecycle.applyDecay();
// Returns: { processed: 100, decayed: 45, unchanged: 55 }

// Cleanup low-confidence entities
const cleanupStats = lifecycle.cleanup(0.1); // threshold
// Returns: { removed: 12, kept: 88 }

// Archive old entities to MongoDB
const archiveStats = await lifecycle.archive(90); // days
// Returns: { archived: 25, remaining: 75 }

// Restore archived entities
await lifecycle.restore(["entity:name:1", "entity:name:2"]);

// Get statistics
const stats = lifecycle.getStats();
// Returns: { totalEntities, totalRelations, byType, lastDecay, lastCleanup }
```

##### MemorySearch

```javascript
import { getMemorySearch } from "./memory-manager.js";

const search = getMemorySearch();

// General search
const results = search.search("async await", {
  entityType: "user:pattern",
  minConfidence: 0.5,
  limit: 10,
});

// Search by entity type
const preferences = search.searchByType("user:preference", "dark");

// Search by time range
const recent = search.searchByTimeRange(
  new Date("2026-01-01"),
  new Date("2026-01-02")
);

// Search by confidence range
const highConfidence = search.searchByConfidence(0.8, 1.0);

// Get related entities
const related = search.getRelated("user:profile:main", 2); // depth
```

##### MemorySync

```javascript
import { getMemorySync } from "./memory-manager.js";

const sync = getMemorySync();

// MongoDB persistence
await sync.saveToMongoDB();
await sync.loadFromMongoDB();

// File persistence
await sync.saveToFile("/path/to/memory.json");
await sync.loadFromFile("/path/to/memory.json");

// Check last sync time
const lastSync = sync.getLastSyncTime();
```

#### Handlers

```javascript
import { memoryManagerHandlers } from "./memory-manager.js";

// Lifecycle handlers
memoryManagerHandlers.applyDecay();
memoryManagerHandlers.cleanup(threshold);
memoryManagerHandlers.archive(olderThanDays);
memoryManagerHandlers.restore(entityNames);
memoryManagerHandlers.getStats();

// Search handlers
memoryManagerHandlers.search(query, options);
memoryManagerHandlers.searchByType(entityType, query);
memoryManagerHandlers.searchByTimeRange(start, end);
memoryManagerHandlers.searchByConfidence(min, max);
memoryManagerHandlers.getRelated(entityName, depth);

// Sync handlers
memoryManagerHandlers.saveToMongoDB();
memoryManagerHandlers.loadFromMongoDB();
memoryManagerHandlers.saveToFile(path);
memoryManagerHandlers.loadFromFile(path);
memoryManagerHandlers.getLastSyncTime();
```

---

## API Endpoints

### User Model Endpoints

| Method | Endpoint                               | Description             |
| ------ | -------------------------------------- | ----------------------- |
| GET    | `/api/user/preferences`                | Get all preferences     |
| GET    | `/api/user/preferences/:category/:key` | Get specific preference |
| PUT    | `/api/user/preferences/:category/:key` | Set preference          |
| POST   | `/api/user/preferences/learn`          | Learn preference        |
| GET    | `/api/user/profile`                    | Get user profile        |
| PUT    | `/api/user/profile/:field`             | Update profile field    |
| GET    | `/api/user/patterns`                   | Get user patterns       |
| POST   | `/api/user/patterns`                   | Track pattern           |
| POST   | `/api/user/patterns/detect`            | Detect patterns         |
| GET    | `/api/user/expertise/:domain`          | Get expertise           |
| PUT    | `/api/user/expertise/:domain`          | Update expertise        |

### Conversation Endpoints

| Method | Endpoint                               | Description         |
| ------ | -------------------------------------- | ------------------- |
| GET    | `/api/conversation/session`            | Get current session |
| POST   | `/api/conversation/session`            | Start new session   |
| DELETE | `/api/conversation/session`            | End session         |
| GET    | `/api/conversation/session/:sessionId` | Get session by ID   |
| GET    | `/api/conversation/sessions`           | List sessions       |
| GET    | `/api/conversation/messages`           | Get message buffer  |
| POST   | `/api/conversation/messages`           | Add message         |
| GET    | `/api/conversation/context`            | Get context         |
| PUT    | `/api/conversation/context`            | Update context      |
| DELETE | `/api/conversation/context`            | Reset context       |
| GET    | `/api/conversation/topics`             | Get active topics   |
| GET    | `/api/conversation/tasks`              | Get pending tasks   |
| POST   | `/api/conversation/tasks`              | Add task            |
| DELETE | `/api/conversation/tasks`              | Complete task       |
| POST   | `/api/conversation/summarize`          | Summarize session   |
| GET    | `/api/conversation/search`             | Search history      |

### Workspace Endpoints

| Method | Endpoint                                   | Description        |
| ------ | ------------------------------------------ | ------------------ |
| POST   | `/api/workspace/project`                   | Register project   |
| GET    | `/api/workspace/project/:name`             | Get project        |
| PUT    | `/api/workspace/project/:name`             | Update project     |
| GET    | `/api/workspace/projects`                  | List projects      |
| GET    | `/api/workspace/project/:name/conventions` | Get conventions    |
| POST   | `/api/workspace/file`                      | Learn file         |
| GET    | `/api/workspace/file/:path`                | Get file knowledge |
| GET    | `/api/workspace/files/purpose/:purpose`    | Find by purpose    |
| POST   | `/api/workspace/pattern`                   | Learn pattern      |
| GET    | `/api/workspace/patterns`                  | List patterns      |

### Memory Manager Endpoints

| Method | Endpoint                                      | Description          |
| ------ | --------------------------------------------- | -------------------- |
| GET    | `/api/memory-manager/stats`                   | Get statistics       |
| GET    | `/api/memory-manager/search`                  | Search memory        |
| GET    | `/api/memory-manager/search/type/:entityType` | Search by type       |
| GET    | `/api/memory-manager/search/time`             | Search by time range |
| GET    | `/api/memory-manager/related/:entityName`     | Get related entities |
| POST   | `/api/memory-manager/decay`                   | Apply decay          |
| POST   | `/api/memory-manager/cleanup`                 | Cleanup entities     |
| POST   | `/api/memory-manager/archive`                 | Archive to MongoDB   |
| POST   | `/api/memory-manager/sync/mongodb`            | Save to MongoDB      |
| GET    | `/api/memory-manager/sync/mongodb`            | Load from MongoDB    |
| POST   | `/api/memory-manager/sync/file`               | Save to file         |
| GET    | `/api/memory-manager/sync/file`               | Load from file       |

---

## Agent Tools

### User Model Tools

| Tool Name               | Description                       |
| ----------------------- | --------------------------------- |
| `user_get_preference`   | Get preference by category/key    |
| `user_set_preference`   | Set preference explicitly         |
| `user_learn_preference` | Learn preference from observation |
| `user_get_profile`      | Get user profile                  |
| `user_update_profile`   | Update profile field              |
| `user_track_pattern`    | Track behavior pattern            |
| `user_get_patterns`     | Get detected patterns             |
| `user_get_expertise`    | Get expertise level               |
| `user_update_expertise` | Update expertise level            |

### Conversation Tools

| Tool Name                     | Description              |
| ----------------------------- | ------------------------ |
| `conversation_start_session`  | Start new session        |
| `conversation_end_session`    | End current session      |
| `conversation_add_message`    | Add message to session   |
| `conversation_get_context`    | Get current context      |
| `conversation_update_context` | Update context           |
| `conversation_get_history`    | Get conversation history |
| `conversation_summarize`      | Summarize session        |
| `conversation_get_topics`     | Get active topics        |
| `conversation_get_tasks`      | Get pending tasks        |
| `conversation_search`         | Search conversations     |

### Workspace Tools

| Tool Name                   | Description                  |
| --------------------------- | ---------------------------- |
| `workspace_analyze_project` | Analyze and register project |
| `workspace_get_project`     | Get project information      |
| `workspace_get_conventions` | Get project conventions      |
| `workspace_learn_file`      | Store file knowledge         |
| `workspace_get_file`        | Get file knowledge           |
| `workspace_find_files`      | Find files by purpose        |
| `workspace_learn_pattern`   | Learn code pattern           |
| `workspace_get_patterns`    | Get learned patterns         |

### Memory Manager Tools

| Tool Name                | Description                    |
| ------------------------ | ------------------------------ |
| `memory_get_stats`       | Get memory statistics          |
| `memory_search_advanced` | Advanced search with filters   |
| `memory_get_related`     | Get related entities           |
| `memory_apply_decay`     | Apply confidence decay         |
| `memory_cleanup`         | Remove low-confidence entities |
| `memory_archive`         | Archive old entities           |
| `memory_sync_mongo`      | Sync to MongoDB                |
| `memory_load_mongo`      | Load from MongoDB              |
| `memory_export_file`     | Export to file                 |
| `memory_import_file`     | Import from file               |

---

## Entity Types

### User Entities

```
user:profile:main           - Main user profile
user:preference:{category}  - Preferences by category (theme, editor, ai)
user:pattern:{name}         - Detected behavior patterns
user:expertise:{domain}     - Expertise levels by domain
```

### Conversation Entities

```
conversation:session:{id}   - Conversation sessions
conversation:summary:{id}   - Session summaries
conversation:context:main   - Current context state
```

### Workspace Entities

```
workspace:project:{name}    - Project information
workspace:file:{hash}       - File knowledge
workspace:pattern:{name}    - Code patterns
```

---

## Observation Format

All observations follow a standardized format:

```
[timestamp] key: value
```

### Standard Observations

```javascript
// Timestamp format (ISO 8601)
"[2026-01-02T12:34:56.789Z] mode: dark";

// With metadata
"[2026-01-02T12:34:56.789Z] mode: dark | source: explicit_setting | confidence: 1.0";

// JSON values
'[2026-01-02T12:34:56.789Z] conventions: {"indent":"2 spaces","quotes":"single"}';
```

### Reserved Keys

| Key             | Description               |
| --------------- | ------------------------- |
| `created_at`    | Entity creation timestamp |
| `last_seen`     | Last access timestamp     |
| `source`        | Observation source type   |
| `confidence`    | Current confidence (0-1)  |
| `decay_applied` | Last decay timestamp      |

---

## Confidence & Decay

### Confidence Sources

| Source               | Base Confidence | Decay Half-Life |
| -------------------- | --------------- | --------------- |
| `explicit_setting`   | 1.0             | 365 days        |
| `direct_statement`   | 0.95            | 180 days        |
| `strong_inference`   | 0.8             | 90 days         |
| `weak_inference`     | 0.5             | 30 days         |
| `single_observation` | 0.3             | 14 days         |

### Decay Formula

Confidence decays exponentially over time:

```
new_confidence = current_confidence × 0.5^(days_since_last_seen / half_life)
```

### Reinforcement

Re-observing data reinforces confidence:

```javascript
// Each observation increases confidence
new_confidence = Math.min(
  1.0,
  current_confidence + (1 - current_confidence) * 0.2
);
```

---

## Usage Examples

### Learning User Preferences

```javascript
// User says "I prefer dark mode"
userModelHandlers.setPreference("theme", "mode", "dark", "direct_statement");

// User's code uses single quotes consistently
userModelHandlers.learnPreference("editor", "quotes", "single", 0.7);

// Detect patterns from code
const patterns = userModelHandlers.detectPatterns({
  code: `
    const getData = async () => {
      const result = await fetch('/api/data');
      return result.json();
    };
  `,
});
// Detected: ['prefers-async-await', 'uses-arrow-functions', 'prefers-const']
```

### Managing Conversation Context

```javascript
// Start a coding session
const sessionId = conversationHandlers.startSession({
  topic: "Refactoring authentication module",
});

// Add messages
conversationHandlers.addMessage("user", "Can you help me refactor auth?");
conversationHandlers.addMessage("assistant", "Of course! Let me analyze...");

// Track pending tasks
conversationHandlers.addPendingTask("Review auth.js", "high");
conversationHandlers.addPendingTask("Update tests", "medium");

// Build context for next prompt
const context = conversationHandlers.buildPromptContext(2000);

// End session with summary
conversationHandlers.endSession("Refactored auth module, updated tests");
```

### Learning Workspace Knowledge

```javascript
// Register a project
workspaceHandlers.analyzeProject("/home/user/my-project", {
  type: "nodejs",
  framework: "express",
  conventions: {
    indent: "2 spaces",
    quotes: "single",
    semicolons: true,
  },
});

// Learn about a file
workspaceHandlers.learnFile("/src/api/routes.js", {
  purpose: "REST API route definitions",
  exports: ["router", "setupRoutes"],
  imports: ["express", "./handlers"],
});

// Learn a coding pattern
workspaceHandlers.learnPattern("error-handling", {
  examples: ["try { ... } catch (e) { logger.error(e); throw e; }"],
  project: "my-project",
});
```

### Memory Maintenance

```javascript
// Get memory statistics
const stats = memoryManagerHandlers.getStats();
console.log(`Total entities: ${stats.totalEntities}`);
console.log(`By type:`, stats.byType);

// Search for relevant memories
const results = memoryManagerHandlers.search("authentication", {
  minConfidence: 0.5,
  limit: 20,
});

// Apply daily maintenance
memoryManagerHandlers.applyDecay();
memoryManagerHandlers.cleanup(0.1);

// Weekly archive to MongoDB
memoryManagerHandlers.archive(90);

// Backup to file
memoryManagerHandlers.saveToFile("./backup/memory-2026-01-02.json");
```

---

## Related Documentation

- [AGENT.md](./AGENT.md) - Agent orchestration overview
- [MCP_CONFIGURATION_GUIDE.md](./MCP_CONFIGURATION_GUIDE.md) - MCP server configuration
- [MONGODB_MCP_REFERENCE.md](./MONGODB_MCP_REFERENCE.md) - MongoDB integration
- [TODO.md](./TODO.md) - Phase 7B implementation status

---

_BambiSleep™ Church MCP Control Tower - Memory & Persistence System_
