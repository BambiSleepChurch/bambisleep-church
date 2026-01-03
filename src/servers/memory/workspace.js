/**
 * BambiSleep™ Church MCP Control Tower
 * Workspace Memory - Project tracking, file knowledge, and pattern learning
 */

import { createLogger } from '../../utils/logger.js';
import { memoryGraph } from './graph.js';
import {
    ENTITY_TYPES,
    parseObservations
} from './schema.js';

const logger = createLogger('workspace-memory');

// ============================================================================
// PROJECT TRACKER CLASS
// ============================================================================

/**
 * Tracks project structure and conventions
 */
export class ProjectTracker {
  #projectCache = new Map();

  /**
   * Analyze and register a project
   * @param {string} path - Project root path
   * @param {Object} [analysis] - Pre-computed analysis data
   * @returns {Object} Project data
   */
  analyzeProject(path, analysis = {}) {
    const timestamp = new Date().toISOString();
    const projectName = this.#extractProjectName(path);
    const entityName = `${ENTITY_TYPES.WORKSPACE_PROJECT}:${projectName}`;

    const observations = [
      `[${timestamp}] path: ${path}`,
      `[${timestamp}] last_accessed: ${timestamp}`,
    ];

    // Add analysis data
    if (analysis.type) {
      observations.push(`[${timestamp}] type: ${analysis.type}`);
    }
    if (analysis.framework) {
      observations.push(`[${timestamp}] framework: ${analysis.framework}`);
    }
    if (analysis.description) {
      observations.push(`[${timestamp}] description: ${analysis.description}`);
    }
    if (analysis.structure) {
      observations.push(`[${timestamp}] structure: ${JSON.stringify(analysis.structure)}`);
    }
    if (analysis.conventions) {
      observations.push(`[${timestamp}] conventions: ${JSON.stringify(analysis.conventions)}`);
    }

    // Check if project exists
    const existing = memoryGraph.openNodes([entityName]);
    
    if (existing.length === 0) {
      memoryGraph.createEntities([{
        name: entityName,
        entityType: ENTITY_TYPES.WORKSPACE_PROJECT,
        observations,
      }]);
      logger.info('Registered new project', { projectName, path });
    } else {
      memoryGraph.addObservations(entityName, observations);
      logger.info('Updated project', { projectName });
    }

    // Update cache
    const projectData = this.getProject(projectName);
    this.#projectCache.set(projectName, projectData);

    return projectData;
  }

  /**
   * Get project by name
   * @param {string} name - Project name
   * @returns {Object|null} Project data
   */
  getProject(name) {
    // Check cache first
    if (this.#projectCache.has(name)) {
      const cached = this.#projectCache.get(name);
      if (Date.now() - cached._cacheTime < 60000) {
        return cached;
      }
    }

    const entityName = `${ENTITY_TYPES.WORKSPACE_PROJECT}:${name}`;
    const nodes = memoryGraph.openNodes([entityName]);

    if (nodes.length === 0) return null;

    const parsed = parseObservations(nodes[0].observations);
    const project = {
      name,
      path: parsed.path?.value,
      type: parsed.type?.value || 'unknown',
      framework: parsed.framework?.value,
      description: parsed.description?.value,
      structure: parsed.structure?.value,
      conventions: parsed.conventions?.value || [],
      lastAccessed: parsed.last_accessed?.value,
      _cacheTime: Date.now(),
    };

    this.#projectCache.set(name, project);
    return project;
  }

  /**
   * Update project data
   * @param {string} name - Project name
   * @param {Object} data - Data to update
   * @returns {boolean} Success
   */
  updateProject(name, data) {
    const entityName = `${ENTITY_TYPES.WORKSPACE_PROJECT}:${name}`;
    const existing = memoryGraph.openNodes([entityName]);

    if (existing.length === 0) {
      logger.warn('Project not found', { name });
      return false;
    }

    const timestamp = new Date().toISOString();
    const observations = [`[${timestamp}] last_accessed: ${timestamp}`];

    for (const [key, value] of Object.entries(data)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
      observations.push(`[${timestamp}] ${key}: ${valueStr}`);
    }

    memoryGraph.addObservations(entityName, observations);
    this.#projectCache.delete(name); // Invalidate cache

    logger.info('Updated project', { name, fields: Object.keys(data) });
    return true;
  }

  /**
   * Get project structure
   * @param {string} name - Project name
   * @returns {Object|null} Structure data
   */
  getStructure(name) {
    const project = this.getProject(name);
    return project?.structure || null;
  }

  /**
   * Get project conventions
   * @param {string} name - Project name
   * @returns {string[]} Conventions list
   */
  getConventions(name) {
    const project = this.getProject(name);
    return project?.conventions || [];
  }

  /**
   * List all tracked projects
   * @returns {Object[]} Project list
   */
  listProjects() {
    const graph = memoryGraph.readGraph();
    const projects = [];

    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.WORKSPACE_PROJECT) continue;

      const name = entity.name.split(':').slice(2).join(':');
      const project = this.getProject(name);
      if (project) {
        projects.push(project);
      }
    }

    return projects;
  }

  /**
   * Extract project name from path
   * @private
   */
  #extractProjectName(path) {
    // Get last directory name from path
    const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || 'unnamed';
  }
}

// ============================================================================
// FILE KNOWLEDGE CLASS
// ============================================================================

/**
 * Tracks knowledge about files in the workspace
 */
export class FileKnowledge {
  /**
   * Learn about a file from analysis
   * @param {string} path - File path (relative to project)
   * @param {Object} analysis - File analysis data
   * @returns {Object} File knowledge
   */
  learnFile(path, analysis = {}) {
    const timestamp = new Date().toISOString();
    const normalizedPath = this.#normalizePath(path);
    const entityName = `${ENTITY_TYPES.WORKSPACE_FILE}:${normalizedPath}`;

    const observations = [
      `[${timestamp}] last_read: ${timestamp}`,
    ];

    if (analysis.purpose) {
      observations.push(`[${timestamp}] purpose: ${analysis.purpose}`);
    }
    if (analysis.exports) {
      observations.push(`[${timestamp}] exports: ${JSON.stringify(analysis.exports)}`);
    }
    if (analysis.imports) {
      observations.push(`[${timestamp}] imports: ${JSON.stringify(analysis.imports)}`);
    }
    if (analysis.sizeLines) {
      observations.push(`[${timestamp}] size_lines: ${analysis.sizeLines}`);
    }
    if (analysis.lastModified) {
      observations.push(`[${timestamp}] last_modified: ${analysis.lastModified}`);
    }

    const existing = memoryGraph.openNodes([entityName]);

    if (existing.length === 0) {
      observations.push(`[${timestamp}] edit_count: 0`);
      memoryGraph.createEntities([{
        name: entityName,
        entityType: ENTITY_TYPES.WORKSPACE_FILE,
        observations,
      }]);
      logger.info('Learned new file', { path: normalizedPath });
    } else {
      // Increment edit count
      const parsed = parseObservations(existing[0].observations);
      const editCount = (parsed.edit_count?.value || 0) + 1;
      observations.push(`[${timestamp}] edit_count: ${editCount}`);
      
      memoryGraph.addObservations(entityName, observations);
      logger.debug('Updated file knowledge', { path: normalizedPath });
    }

    return this.getFile(path);
  }

  /**
   * Get file knowledge
   * @param {string} path - File path
   * @returns {Object|null} File data
   */
  getFile(path) {
    const normalizedPath = this.#normalizePath(path);
    const entityName = `${ENTITY_TYPES.WORKSPACE_FILE}:${normalizedPath}`;
    const nodes = memoryGraph.openNodes([entityName]);

    if (nodes.length === 0) return null;

    const parsed = parseObservations(nodes[0].observations);
    return {
      path: normalizedPath,
      purpose: parsed.purpose?.value,
      exports: parsed.exports?.value || [],
      imports: parsed.imports?.value || [],
      sizeLines: parsed.size_lines?.value,
      lastModified: parsed.last_modified?.value,
      lastRead: parsed.last_read?.value,
      editCount: parsed.edit_count?.value || 0,
    };
  }

  /**
   * Find files by purpose
   * @param {string} purpose - Purpose substring to match
   * @returns {Object[]} Matching files
   */
  getFilesByPurpose(purpose) {
    const graph = memoryGraph.readGraph();
    const files = [];
    const searchLower = purpose.toLowerCase();

    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.WORKSPACE_FILE) continue;

      const parsed = parseObservations(entity.observations);
      const filePurpose = parsed.purpose?.value || '';

      if (filePurpose.toLowerCase().includes(searchLower)) {
        const path = entity.name.split(':').slice(2).join(':');
        files.push(this.getFile(path));
      }
    }

    return files.filter(Boolean);
  }

  /**
   * Get file dependencies (imports)
   * @param {string} path - File path
   * @returns {string[]} Import paths
   */
  getDependencies(path) {
    const file = this.getFile(path);
    return file?.imports || [];
  }

  /**
   * Get recently modified files
   * @param {number} [limit=10] - Max files to return
   * @returns {Object[]} Recent files
   */
  getRecentlyModified(limit = 10) {
    const graph = memoryGraph.readGraph();
    const files = [];

    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.WORKSPACE_FILE) continue;

      const parsed = parseObservations(entity.observations);
      const lastRead = parsed.last_read?.value;

      if (lastRead) {
        const path = entity.name.split(':').slice(2).join(':');
        files.push({
          path,
          lastRead: new Date(lastRead),
          editCount: parsed.edit_count?.value || 0,
        });
      }
    }

    return files
      .sort((a, b) => b.lastRead - a.lastRead)
      .slice(0, limit)
      .map(f => this.getFile(f.path))
      .filter(Boolean);
  }

  /**
   * Normalize file path for storage
   * @private
   */
  #normalizePath(path) {
    return path
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .replace(/^\//, '');
  }
}

// ============================================================================
// PATTERN LEARNER CLASS
// ============================================================================

/**
 * Learns and detects code patterns in the workspace
 */
export class PatternLearner {
  /**
   * Learn a code pattern from examples
   * @param {string} name - Pattern name
   * @param {Object} pattern - Pattern data
   * @returns {Object} Pattern record
   */
  learnPattern(name, pattern = {}) {
    const timestamp = new Date().toISOString();
    const entityName = `${ENTITY_TYPES.WORKSPACE_PATTERN}:${name}`;

    const observations = [
      `[${timestamp}] name: ${name}`,
      `[${timestamp}] last_seen: ${timestamp}`,
    ];

    if (pattern.description) {
      observations.push(`[${timestamp}] description: ${pattern.description}`);
    }
    if (pattern.example) {
      observations.push(`[${timestamp}] example: ${pattern.example}`);
    }
    if (pattern.regex) {
      observations.push(`[${timestamp}] regex: ${pattern.regex}`);
    }
    if (pattern.files) {
      observations.push(`[${timestamp}] files: ${JSON.stringify(pattern.files)}`);
    }

    const existing = memoryGraph.openNodes([entityName]);

    if (existing.length === 0) {
      observations.push(`[${timestamp}] occurrence_count: 1`);
      memoryGraph.createEntities([{
        name: entityName,
        entityType: ENTITY_TYPES.WORKSPACE_PATTERN,
        observations,
      }]);
      logger.info('Learned new pattern', { name });
    } else {
      const parsed = parseObservations(existing[0].observations);
      const count = (parsed.occurrence_count?.value || 0) + 1;
      observations.push(`[${timestamp}] occurrence_count: ${count}`);
      
      memoryGraph.addObservations(entityName, observations);
      logger.debug('Updated pattern', { name, count });
    }

    return this.getPattern(name);
  }

  /**
   * Get a specific pattern
   * @param {string} name - Pattern name
   * @returns {Object|null} Pattern data
   */
  getPattern(name) {
    const entityName = `${ENTITY_TYPES.WORKSPACE_PATTERN}:${name}`;
    const nodes = memoryGraph.openNodes([entityName]);

    if (nodes.length === 0) return null;

    const parsed = parseObservations(nodes[0].observations);
    return {
      name,
      description: parsed.description?.value,
      example: parsed.example?.value,
      regex: parsed.regex?.value,
      files: parsed.files?.value || [],
      occurrenceCount: parsed.occurrence_count?.value || 0,
      lastSeen: parsed.last_seen?.value,
    };
  }

  /**
   * Match code against known patterns
   * @param {string} code - Code to analyze
   * @returns {Object[]} Matching patterns
   */
  matchPattern(code) {
    const graph = memoryGraph.readGraph();
    const matches = [];

    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.WORKSPACE_PATTERN) continue;

      const parsed = parseObservations(entity.observations);
      const regex = parsed.regex?.value;

      if (regex) {
        try {
          const pattern = new RegExp(regex, 'gm');
          if (pattern.test(code)) {
            const name = entity.name.split(':').slice(2).join(':');
            matches.push(this.getPattern(name));
          }
        } catch {
          // Invalid regex, skip
        }
      }
    }

    return matches.filter(Boolean);
  }

  /**
   * Get all patterns for a project
   * @param {string} projectName - Project name
   * @returns {Object[]} Project patterns
   */
  getProjectPatterns(projectName) {
    const graph = memoryGraph.readGraph();
    const patterns = [];

    // Look for patterns that reference project files
    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.WORKSPACE_PATTERN) continue;

      const parsed = parseObservations(entity.observations);
      const files = parsed.files?.value || [];

      // Check if any file belongs to this project
      const belongsToProject = files.some(f => 
        f.includes(projectName) || f.startsWith(projectName)
      );

      if (belongsToProject || files.length === 0) {
        const name = entity.name.split(':').slice(2).join(':');
        patterns.push(this.getPattern(name));
      }
    }

    return patterns.filter(Boolean);
  }

  /**
   * List all learned patterns
   * @returns {Object[]} All patterns
   */
  listPatterns() {
    const graph = memoryGraph.readGraph();
    const patterns = [];

    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.WORKSPACE_PATTERN) continue;

      const name = entity.name.split(':').slice(2).join(':');
      patterns.push(this.getPattern(name));
    }

    return patterns.filter(Boolean);
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let projectTracker = null;
let fileKnowledge = null;
let patternLearner = null;

/**
 * Get ProjectTracker singleton
 */
export function getProjectTracker() {
  if (!projectTracker) {
    projectTracker = new ProjectTracker();
  }
  return projectTracker;
}

/**
 * Get FileKnowledge singleton
 */
export function getFileKnowledge() {
  if (!fileKnowledge) {
    fileKnowledge = new FileKnowledge();
  }
  return fileKnowledge;
}

/**
 * Get PatternLearner singleton
 */
export function getPatternLearner() {
  if (!patternLearner) {
    patternLearner = new PatternLearner();
  }
  return patternLearner;
}

// ============================================================================
// WORKSPACE HANDLERS (for API integration)
// ============================================================================

/**
 * Workspace memory handlers for REST API
 */
export const workspaceHandlers = {
  // Project handlers
  analyzeProject(path, analysis) {
    return getProjectTracker().analyzeProject(path, analysis);
  },

  getProject(name) {
    return getProjectTracker().getProject(name);
  },

  updateProject(name, data) {
    return getProjectTracker().updateProject(name, data);
  },

  getProjectStructure(name) {
    return getProjectTracker().getStructure(name);
  },

  getProjectConventions(name) {
    return getProjectTracker().getConventions(name);
  },

  listProjects() {
    return getProjectTracker().listProjects();
  },

  // File handlers
  learnFile(path, analysis) {
    return getFileKnowledge().learnFile(path, analysis);
  },

  getFile(path) {
    return getFileKnowledge().getFile(path);
  },

  getFilesByPurpose(purpose) {
    return getFileKnowledge().getFilesByPurpose(purpose);
  },

  getFileDependencies(path) {
    return getFileKnowledge().getDependencies(path);
  },

  getRecentlyModifiedFiles(limit) {
    return getFileKnowledge().getRecentlyModified(limit);
  },

  // Pattern handlers
  learnPattern(name, pattern) {
    return getPatternLearner().learnPattern(name, pattern);
  },

  getPattern(name) {
    return getPatternLearner().getPattern(name);
  },

  matchPatterns(code) {
    return getPatternLearner().matchPattern(code);
  },

  getProjectPatterns(projectName) {
    return getPatternLearner().getProjectPatterns(projectName);
  },

  listPatterns() {
    return getPatternLearner().listPatterns();
  },
};

export default {
  ProjectTracker,
  FileKnowledge,
  PatternLearner,
  getProjectTracker,
  getFileKnowledge,
  getPatternLearner,
  workspaceHandlers,
};
