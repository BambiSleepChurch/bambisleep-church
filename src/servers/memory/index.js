/**
 * BambiSleep™ Church MCP Control Tower
 * Memory Module Index - Re-exports all memory components
 */

// Knowledge Graph
export { memoryGraph, memoryHandlers } from './graph.js';

// Schema definitions
export {
    ENTITY_TYPES, OBSERVATION_SOURCES, RELATION_TYPES, applyDecay, calculateConfidence, createEntity, formatObservation,
    formatSimpleObservation, generateEntityName, getDaysSince, getSourceConfig, parseObservations, validateEntity
} from './schema.js';

// User Model
export {
    UserPatterns, UserPreferences, UserProfile, getUserPatterns, getUserPreferences, getUserProfile,
    userModelHandlers
} from './user-model.js';

// Conversation Memory
export {
    ContextManager, ConversationStore,
    Summarizer, conversationHandlers, getContextManager, getConversationStore,
    getSummarizer
} from './conversation.js';

// Workspace Memory
export {
    FileKnowledge,
    PatternLearner, ProjectTracker, getFileKnowledge,
    getPatternLearner, getProjectTracker, workspaceHandlers
} from './workspace.js';

// Memory Manager
export {
    MemoryLifecycle,
    MemorySearch,
    MemorySync,
    getMemoryLifecycle,
    getMemorySearch,
    getMemorySync,
    memoryManagerHandlers
} from './manager.js';

