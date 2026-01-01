/**
 * BambiSleep™ Church MCP Control Tower
 * Agent Tool Executor - Centralized tool execution with MCP fallback
 * 
 * Provides 60+ tools with OpenAI function calling JSON schema format.
 * Routes tool calls to appropriate MCP servers or local handlers.
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('agent-tools');

/**
 * Tool category definitions
 */
export const TOOL_CATEGORIES = Object.freeze({
  MEMORY: 'memory',
  STORAGE: 'storage',
  FETCH: 'fetch',
  SEARCH: 'search',
  PUPPETEER: 'puppeteer',
  MONGODB: 'mongodb',
  SQLITE: 'sqlite',
  THINKING: 'thinking',
  STRIPE: 'stripe',
  PATREON: 'patreon',
  CLARITY: 'clarity',
  GITHUB: 'github',
  LMSTUDIO: 'lmstudio',
  HUGGINGFACE: 'huggingface',
  RENDER: 'render',
});

/**
 * Core tool definitions with OpenAI function calling schema
 * Each tool defines:
 * - name: Tool identifier
 * - description: Human-readable description
 * - category: Tool category for routing
 * - parameters: JSON Schema for parameters
 * - handler: Name of handler method in corresponding server module
 */
export const AGENT_TOOLS = [
  // =====================================================
  // MEMORY MCP TOOLS
  // =====================================================
  {
    name: 'memory_read_graph',
    description: 'Read the entire knowledge graph from memory. Returns all entities and relations.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'readGraph',
  },
  {
    name: 'memory_create_entities',
    description: 'Create multiple new entities in the knowledge graph. Each entity needs a name, type, and optional observations array.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        entities: {
          type: 'array',
          description: 'Array of entities to create',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Entity name' },
              entityType: { type: 'string', description: 'Entity type (e.g., person, concept, event)' },
              observations: {
                type: 'array',
                items: { type: 'string' },
                description: 'Initial observations about the entity',
              },
            },
            required: ['name', 'entityType'],
          },
        },
      },
      required: ['entities'],
    },
    handler: 'createEntities',
  },
  {
    name: 'memory_create_relations',
    description: 'Create relations between entities in the knowledge graph.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        relations: {
          type: 'array',
          description: 'Array of relations to create',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string', description: 'Source entity name' },
              to: { type: 'string', description: 'Target entity name' },
              relationType: { type: 'string', description: 'Type of relation' },
            },
            required: ['from', 'to', 'relationType'],
          },
        },
      },
      required: ['relations'],
    },
    handler: 'createRelations',
  },
  {
    name: 'memory_add_observations',
    description: 'Add observations to existing entities.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        observations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entityName: { type: 'string' },
              contents: { type: 'array', items: { type: 'string' } },
            },
            required: ['entityName', 'contents'],
          },
        },
      },
      required: ['observations'],
    },
    handler: 'addObservations',
  },
  {
    name: 'memory_delete_entities',
    description: 'Delete entities from the knowledge graph.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        entityNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Names of entities to delete',
        },
      },
      required: ['entityNames'],
    },
    handler: 'deleteEntities',
  },
  {
    name: 'memory_delete_observations',
    description: 'Delete specific observations from entities.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        deletions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entityName: { type: 'string' },
              observations: { type: 'array', items: { type: 'string' } },
            },
            required: ['entityName', 'observations'],
          },
        },
      },
      required: ['deletions'],
    },
    handler: 'deleteObservations',
  },
  {
    name: 'memory_delete_relations',
    description: 'Delete relations from the knowledge graph.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        relations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              relationType: { type: 'string' },
            },
            required: ['from', 'to', 'relationType'],
          },
        },
      },
      required: ['relations'],
    },
    handler: 'deleteRelations',
  },
  {
    name: 'memory_search_nodes',
    description: 'Search for nodes in the knowledge graph by query.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
    handler: 'searchNodes',
  },
  {
    name: 'memory_open_nodes',
    description: 'Open and retrieve specific nodes by name.',
    category: TOOL_CATEGORIES.MEMORY,
    parameters: {
      type: 'object',
      properties: {
        names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Names of nodes to open',
        },
      },
      required: ['names'],
    },
    handler: 'openNodes',
  },

  // =====================================================
  // STORAGE MCP TOOLS
  // =====================================================
  {
    name: 'storage_list',
    description: 'List files in storage directory.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path within storage (default: root)' },
      },
      required: [],
    },
    handler: 'listFiles',
  },
  {
    name: 'storage_read',
    description: 'Read a file from storage.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
      },
      required: ['path'],
    },
    handler: 'readFile',
  },
  {
    name: 'storage_write',
    description: 'Write content to a file in storage.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'File content' },
      },
      required: ['path', 'content'],
    },
    handler: 'writeFile',
  },
  {
    name: 'storage_delete',
    description: 'Delete a file from storage.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
      },
      required: ['path'],
    },
    handler: 'deleteFile',
  },
  {
    name: 'storage_mkdir',
    description: 'Create a directory in storage.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
      },
      required: ['path'],
    },
    handler: 'createDirectory',
  },
  {
    name: 'storage_search',
    description: 'Search for files in storage by pattern.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (glob or regex)' },
        recursive: { type: 'boolean', description: 'Search recursively' },
      },
      required: ['pattern'],
    },
    handler: 'searchFiles',
  },
  {
    name: 'storage_info',
    description: 'Get file or directory info.',
    category: TOOL_CATEGORIES.STORAGE,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to check' },
      },
      required: ['path'],
    },
    handler: 'getInfo',
  },

  // =====================================================
  // FETCH MCP TOOLS
  // =====================================================
  {
    name: 'fetch_url',
    description: 'Fetch content from a URL. Converts HTML to markdown.',
    category: TOOL_CATEGORIES.FETCH,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
        maxLength: { type: 'number', description: 'Max content length' },
        startIndex: { type: 'number', description: 'Start index for pagination' },
        raw: { type: 'boolean', description: 'Return raw content without conversion' },
      },
      required: ['url'],
    },
    handler: 'fetch',
  },
  {
    name: 'fetch_post',
    description: 'POST data to a URL.',
    category: TOOL_CATEGORIES.FETCH,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to post to' },
        body: { type: 'object', description: 'Request body' },
        headers: { type: 'object', description: 'Request headers' },
        contentType: { type: 'string', description: 'Content type (json/form)' },
      },
      required: ['url'],
    },
    handler: 'post',
  },
  {
    name: 'fetch_ping',
    description: 'Ping a URL to check if it is reachable.',
    category: TOOL_CATEGORIES.FETCH,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to ping' },
        timeout: { type: 'number', description: 'Timeout in ms' },
      },
      required: ['url'],
    },
    handler: 'ping',
  },
  {
    name: 'fetch_download_base64',
    description: 'Download file and return as base64.',
    category: TOOL_CATEGORIES.FETCH,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to download' },
      },
      required: ['url'],
    },
    handler: 'downloadBase64',
  },

  // =====================================================
  // PUPPETEER MCP TOOLS
  // =====================================================
  {
    name: 'puppeteer_navigate',
    description: 'Navigate to a URL in the browser.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
      },
      required: ['url'],
    },
    handler: 'navigate',
  },
  {
    name: 'puppeteer_screenshot',
    description: 'Take a screenshot of the current page or element.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Screenshot name' },
        selector: { type: 'string', description: 'CSS selector for element' },
        width: { type: 'number', description: 'Viewport width' },
        height: { type: 'number', description: 'Viewport height' },
      },
      required: ['name'],
    },
    handler: 'screenshot',
  },
  {
    name: 'puppeteer_click',
    description: 'Click an element on the page.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
      },
      required: ['selector'],
    },
    handler: 'click',
  },
  {
    name: 'puppeteer_fill',
    description: 'Fill an input field with text.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        value: { type: 'string', description: 'Value to fill' },
      },
      required: ['selector', 'value'],
    },
    handler: 'fill',
  },
  {
    name: 'puppeteer_select',
    description: 'Select an option from a dropdown.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        value: { type: 'string', description: 'Option value' },
      },
      required: ['selector', 'value'],
    },
    handler: 'select',
  },
  {
    name: 'puppeteer_hover',
    description: 'Hover over an element.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
      },
      required: ['selector'],
    },
    handler: 'hover',
  },
  {
    name: 'puppeteer_evaluate',
    description: 'Execute JavaScript in the browser context.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript to execute' },
      },
      required: ['script'],
    },
    handler: 'evaluate',
  },
  {
    name: 'puppeteer_launch',
    description: 'Launch a new browser instance.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', description: 'Run in headless mode' },
        width: { type: 'number', description: 'Viewport width' },
        height: { type: 'number', description: 'Viewport height' },
      },
      required: [],
    },
    handler: 'launch',
  },
  {
    name: 'puppeteer_close',
    description: 'Close the browser instance.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'close',
  },
  {
    name: 'puppeteer_status',
    description: 'Get browser status and current URL.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'status',
  },
  {
    name: 'puppeteer_pdf',
    description: 'Generate PDF of the current page.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Output path' },
        format: { type: 'string', description: 'Paper format (A4, Letter, etc.)' },
      },
      required: [],
    },
    handler: 'pdf',
  },
  {
    name: 'puppeteer_get_content',
    description: 'Get page HTML content.',
    category: TOOL_CATEGORIES.PUPPETEER,
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (optional, default: body)' },
      },
      required: [],
    },
    handler: 'getContent',
  },

  // =====================================================
  // MONGODB MCP TOOLS
  // =====================================================
  {
    name: 'mongodb_query',
    description: 'Query documents from a MongoDB collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        filter: { type: 'object', description: 'Query filter' },
        limit: { type: 'number', description: 'Max documents to return' },
        projection: { type: 'object', description: 'Fields to include/exclude' },
        sort: { type: 'object', description: 'Sort specification' },
      },
      required: ['collection'],
    },
    handler: 'query',
  },
  {
    name: 'mongodb_insert',
    description: 'Insert documents into a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        documents: {
          type: 'array',
          items: { type: 'object' },
          description: 'Documents to insert',
        },
      },
      required: ['collection', 'documents'],
    },
    handler: 'insert',
  },
  {
    name: 'mongodb_update',
    description: 'Update documents in a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        filter: { type: 'object', description: 'Query filter' },
        update: { type: 'object', description: 'Update operations' },
        upsert: { type: 'boolean', description: 'Create if not exists' },
      },
      required: ['collection', 'filter', 'update'],
    },
    handler: 'update',
  },
  {
    name: 'mongodb_delete',
    description: 'Delete documents from a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        filter: { type: 'object', description: 'Query filter' },
      },
      required: ['collection', 'filter'],
    },
    handler: 'delete',
  },
  {
    name: 'mongodb_aggregate',
    description: 'Run aggregation pipeline on a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        pipeline: {
          type: 'array',
          items: { type: 'object' },
          description: 'Aggregation pipeline stages',
        },
      },
      required: ['collection', 'pipeline'],
    },
    handler: 'aggregate',
  },
  {
    name: 'mongodb_count',
    description: 'Count documents in a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        filter: { type: 'object', description: 'Query filter' },
      },
      required: ['collection'],
    },
    handler: 'count',
  },
  {
    name: 'mongodb_create_index',
    description: 'Create an index on a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        keys: { type: 'object', description: 'Index key specification' },
        options: { type: 'object', description: 'Index options' },
      },
      required: ['collection', 'keys'],
    },
    handler: 'createIndex',
  },
  {
    name: 'mongodb_delete_many',
    description: 'Delete multiple documents from a collection.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        filter: { type: 'object', description: 'Query filter' },
      },
      required: ['collection', 'filter'],
    },
    handler: 'deleteMany',
  },
  {
    name: 'mongodb_stats',
    description: 'Get collection statistics.',
    category: TOOL_CATEGORIES.MONGODB,
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
      },
      required: ['collection'],
    },
    handler: 'stats',
  },

  // =====================================================
  // SQLITE MCP TOOLS
  // =====================================================
  {
    name: 'sqlite_query',
    description: 'Execute a SELECT query on the database.',
    category: TOOL_CATEGORIES.SQLITE,
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL SELECT query' },
        params: { type: 'array', description: 'Query parameters' },
      },
      required: ['sql'],
    },
    handler: 'query',
  },
  {
    name: 'sqlite_execute',
    description: 'Execute a write query (INSERT, UPDATE, DELETE).',
    category: TOOL_CATEGORIES.SQLITE,
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL query' },
        params: { type: 'array', description: 'Query parameters' },
      },
      required: ['sql'],
    },
    handler: 'execute',
  },
  {
    name: 'sqlite_create_table',
    description: 'Create a new table in the database.',
    category: TOOL_CATEGORIES.SQLITE,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Table name' },
        columns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              primaryKey: { type: 'boolean' },
              notNull: { type: 'boolean' },
              unique: { type: 'boolean' },
              default: { type: 'string' },
            },
            required: ['name', 'type'],
          },
          description: 'Column definitions',
        },
      },
      required: ['name', 'columns'],
    },
    handler: 'createTable',
  },
  {
    name: 'sqlite_list_tables',
    description: 'List all tables in the database.',
    category: TOOL_CATEGORIES.SQLITE,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'listTables',
  },
  {
    name: 'sqlite_describe_table',
    description: 'Get table schema information.',
    category: TOOL_CATEGORIES.SQLITE,
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
      },
      required: ['table'],
    },
    handler: 'describeTable',
  },
  {
    name: 'sqlite_stats',
    description: 'Get database statistics.',
    category: TOOL_CATEGORIES.SQLITE,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'stats',
  },

  // =====================================================
  // SEQUENTIAL THINKING MCP TOOLS
  // =====================================================
  {
    name: 'thinking_step',
    description: 'Add a thinking step to the reasoning chain.',
    category: TOOL_CATEGORIES.THINKING,
    parameters: {
      type: 'object',
      properties: {
        thought: { type: 'string', description: 'The thought content' },
        thoughtNumber: { type: 'number', description: 'Current thought number' },
        totalThoughts: { type: 'number', description: 'Estimated total thoughts' },
        nextThoughtNeeded: { type: 'boolean', description: 'Whether more thinking is needed' },
        isRevision: { type: 'boolean', description: 'Is this revising a previous thought' },
        revisesThought: { type: 'number', description: 'Which thought is being revised' },
        branchFromThought: { type: 'number', description: 'Branch point thought number' },
        branchId: { type: 'string', description: 'Branch identifier' },
        needsMoreThoughts: { type: 'boolean', description: 'Needs additional thoughts' },
      },
      required: ['thought', 'thoughtNumber', 'totalThoughts', 'nextThoughtNeeded'],
    },
    handler: 'sequentialThinking',
  },
  {
    name: 'thinking_hypothesis',
    description: 'Generate a hypothesis based on current thinking.',
    category: TOOL_CATEGORIES.THINKING,
    parameters: {
      type: 'object',
      properties: {
        hypothesis: { type: 'string', description: 'The hypothesis statement' },
        confidence: { type: 'number', description: 'Confidence level (0-100)' },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          description: 'Supporting evidence',
        },
      },
      required: ['hypothesis'],
    },
    handler: 'generateHypothesis',
  },
  {
    name: 'thinking_conclude',
    description: 'Conclude the thinking process with a final answer.',
    category: TOOL_CATEGORIES.THINKING,
    parameters: {
      type: 'object',
      properties: {
        conclusion: { type: 'string', description: 'Final conclusion' },
        confidence: { type: 'number', description: 'Confidence level (0-100)' },
        summary: { type: 'string', description: 'Brief summary of reasoning' },
      },
      required: ['conclusion'],
    },
    handler: 'conclude',
  },
  {
    name: 'thinking_export_markdown',
    description: 'Export thinking chain as markdown document.',
    category: TOOL_CATEGORIES.THINKING,
    parameters: {
      type: 'object',
      properties: {
        includeMetadata: { type: 'boolean', description: 'Include timestamps and metadata' },
      },
      required: [],
    },
    handler: 'exportMarkdown',
  },

  // =====================================================
  // STRIPE MCP TOOLS
  // =====================================================
  {
    name: 'stripe_create_customer',
    description: 'Create a new Stripe customer.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Customer email' },
        name: { type: 'string', description: 'Customer name' },
        metadata: { type: 'object', description: 'Additional metadata' },
      },
      required: ['email'],
    },
    handler: 'createCustomer',
  },
  {
    name: 'stripe_list_customers',
    description: 'List Stripe customers.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results to return' },
        email: { type: 'string', description: 'Filter by email' },
      },
      required: [],
    },
    handler: 'listCustomers',
  },
  {
    name: 'stripe_create_product',
    description: 'Create a new Stripe product.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name' },
        description: { type: 'string', description: 'Product description' },
        metadata: { type: 'object', description: 'Additional metadata' },
      },
      required: ['name'],
    },
    handler: 'createProduct',
  },
  {
    name: 'stripe_list_products',
    description: 'List Stripe products.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results to return' },
        active: { type: 'boolean', description: 'Filter by active status' },
      },
      required: [],
    },
    handler: 'listProducts',
  },
  {
    name: 'stripe_create_price',
    description: 'Create a price for a product.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string', description: 'Product ID' },
        unit_amount: { type: 'number', description: 'Price in cents' },
        currency: { type: 'string', description: 'Currency code' },
        recurring: {
          type: 'object',
          properties: {
            interval: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
            interval_count: { type: 'number' },
          },
        },
      },
      required: ['product', 'unit_amount', 'currency'],
    },
    handler: 'createPrice',
  },
  {
    name: 'stripe_create_invoice',
    description: 'Create a new invoice.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        customer: { type: 'string', description: 'Customer ID' },
        collection_method: { type: 'string', description: 'Collection method' },
        days_until_due: { type: 'number', description: 'Days until due' },
      },
      required: ['customer'],
    },
    handler: 'createInvoice',
  },
  {
    name: 'stripe_finalize_invoice',
    description: 'Finalize an invoice.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        invoice: { type: 'string', description: 'Invoice ID' },
      },
      required: ['invoice'],
    },
    handler: 'finalizeInvoice',
  },
  {
    name: 'stripe_list_invoices',
    description: 'List invoices.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        customer: { type: 'string', description: 'Filter by customer ID' },
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: [],
    },
    handler: 'listInvoices',
  },
  {
    name: 'stripe_list_subscriptions',
    description: 'List subscriptions.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        customer: { type: 'string', description: 'Filter by customer ID' },
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: [],
    },
    handler: 'listSubscriptions',
  },
  {
    name: 'stripe_list_disputes',
    description: 'List disputes.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        charge: { type: 'string', description: 'Filter by charge ID' },
        payment_intent: { type: 'string', description: 'Filter by payment intent' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: [],
    },
    handler: 'listDisputes',
  },
  {
    name: 'stripe_create_coupon',
    description: 'Create a discount coupon.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Coupon name' },
        percent_off: { type: 'number', description: 'Percentage discount' },
        amount_off: { type: 'number', description: 'Amount discount in cents' },
        currency: { type: 'string', description: 'Currency for amount_off' },
        duration: { type: 'string', enum: ['once', 'repeating', 'forever'] },
        duration_in_months: { type: 'number', description: 'Months for repeating' },
      },
      required: ['name'],
    },
    handler: 'createCoupon',
  },
  {
    name: 'stripe_create_refund',
    description: 'Create a refund.',
    category: TOOL_CATEGORIES.STRIPE,
    parameters: {
      type: 'object',
      properties: {
        payment_intent: { type: 'string', description: 'Payment intent ID' },
        amount: { type: 'number', description: 'Amount to refund in cents' },
        reason: { type: 'string', enum: ['duplicate', 'fraudulent', 'requested_by_customer'] },
      },
      required: ['payment_intent'],
    },
    handler: 'createRefund',
  },

  // =====================================================
  // PATREON MCP TOOLS
  // =====================================================
  {
    name: 'patreon_get_status',
    description: 'Get Patreon API connection status.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'getStatus',
  },
  {
    name: 'patreon_get_identity',
    description: 'Get the current authorized Patreon user identity.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        fields: {
          type: 'object',
          description: 'Fields to return by resource type',
        },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related resources to include (campaigns, memberships)',
        },
      },
      required: [],
    },
    handler: 'getIdentity',
  },
  {
    name: 'patreon_get_campaigns',
    description: 'Get all campaigns owned by the authorized user.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related resources to include (tiers, creator, benefits)',
        },
      },
      required: [],
    },
    handler: 'getCampaigns',
  },
  {
    name: 'patreon_get_campaign',
    description: 'Get a specific Patreon campaign by ID.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Campaign ID' },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related resources to include',
        },
      },
      required: ['id'],
    },
    handler: 'getCampaign',
  },
  {
    name: 'patreon_get_campaign_members',
    description: 'Get members for a specific Patreon campaign. Returns paginated results.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID' },
        cursor: { type: 'string', description: 'Pagination cursor from previous response' },
      },
      required: ['campaignId'],
    },
    handler: 'getCampaignMembers',
  },
  {
    name: 'patreon_get_all_members',
    description: 'Get all members for a campaign, automatically handling pagination.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID' },
        maxPages: { type: 'number', description: 'Maximum pages to fetch (default 100)' },
      },
      required: ['campaignId'],
    },
    handler: 'getAllMembers',
  },
  {
    name: 'patreon_get_member',
    description: 'Get details for a specific member by ID.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Member ID' },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related resources to include (currently_entitled_tiers, address, user)',
        },
      },
      required: ['id'],
    },
    handler: 'getMember',
  },
  {
    name: 'patreon_get_campaign_posts',
    description: 'Get posts for a Patreon campaign.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID' },
        cursor: { type: 'string', description: 'Pagination cursor' },
      },
      required: ['campaignId'],
    },
    handler: 'getCampaignPosts',
  },
  {
    name: 'patreon_get_post',
    description: 'Get a specific post by ID.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Post ID' },
      },
      required: ['id'],
    },
    handler: 'getPost',
  },
  {
    name: 'patreon_get_webhooks',
    description: 'List all webhooks configured for the current client.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'getWebhooks',
  },
  {
    name: 'patreon_create_webhook',
    description: 'Create a new webhook for a campaign.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'Campaign ID' },
        uri: { type: 'string', description: 'Webhook delivery URL' },
        triggers: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'members:create',
              'members:update',
              'members:delete',
              'members:pledge:create',
              'members:pledge:update',
              'members:pledge:delete',
              'posts:publish',
              'posts:update',
              'posts:delete',
            ],
          },
          description: 'Webhook trigger events',
        },
      },
      required: ['campaignId', 'uri', 'triggers'],
    },
    handler: 'createWebhook',
  },
  {
    name: 'patreon_update_webhook',
    description: 'Update an existing webhook.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Webhook ID' },
        paused: { type: 'boolean', description: 'Whether the webhook is paused' },
        triggers: {
          type: 'array',
          items: { type: 'string' },
          description: 'New trigger events',
        },
        uri: { type: 'string', description: 'New webhook URL' },
      },
      required: ['id'],
    },
    handler: 'updateWebhook',
  },
  {
    name: 'patreon_delete_webhook',
    description: 'Delete a webhook.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Webhook ID' },
      },
      required: ['id'],
    },
    handler: 'deleteWebhook',
  },
  {
    name: 'patreon_verify_webhook_signature',
    description: 'Verify a webhook payload signature for authenticity.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        body: { type: 'string', description: 'Raw webhook request body' },
        signature: { type: 'string', description: 'X-Patreon-Signature header value' },
      },
      required: ['body', 'signature'],
    },
    handler: 'verifyWebhookSignature',
  },
  {
    name: 'patreon_get_patron_status',
    description: 'Get detailed patron status information for a member.',
    category: TOOL_CATEGORIES.PATREON,
    parameters: {
      type: 'object',
      properties: {
        member: { type: 'object', description: 'Member object from Patreon API' },
      },
      required: ['member'],
    },
    handler: 'getPatronStatus',
  },

  // =====================================================
  // CLARITY MCP TOOLS
  // =====================================================
  {
    name: 'clarity_get_project',
    description: 'Get Clarity project information.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Clarity project ID' },
      },
      required: [],
    },
    handler: 'getProject',
  },
  {
    name: 'clarity_heatmap_data',
    description: 'Get heatmap data for a page.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        pageUrl: { type: 'string', description: 'Page URL' },
        type: { type: 'string', enum: ['click', 'scroll', 'move'], description: 'Heatmap type' },
      },
      required: ['pageUrl'],
    },
    handler: 'getHeatmapData',
  },
  {
    name: 'clarity_session_recordings',
    description: 'Get session recordings.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max recordings to return' },
        startDate: { type: 'string', description: 'Start date (ISO format)' },
        endDate: { type: 'string', description: 'End date (ISO format)' },
      },
      required: [],
    },
    handler: 'getSessionRecordings',
  },
  {
    name: 'clarity_track_pageview',
    description: 'Track a pageview event.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        pageUrl: { type: 'string', description: 'Page URL' },
        pageTitle: { type: 'string', description: 'Page title' },
        referrer: { type: 'string', description: 'Referrer URL' },
      },
      required: ['pageUrl'],
    },
    handler: 'trackPageview',
  },
  {
    name: 'clarity_get_events',
    description: 'Get tracked events.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        eventType: { type: 'string', description: 'Filter by event type' },
        limit: { type: 'number', description: 'Max events to return' },
      },
      required: [],
    },
    handler: 'getEvents',
  },
  {
    name: 'clarity_top_events',
    description: 'Get top events by frequency.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max events to return' },
        period: { type: 'string', enum: ['day', 'week', 'month'], description: 'Time period' },
      },
      required: [],
    },
    handler: 'topEvents',
  },
  {
    name: 'clarity_reset',
    description: 'Reset Clarity tracking data.',
    category: TOOL_CATEGORIES.CLARITY,
    parameters: {
      type: 'object',
      properties: {
        confirm: { type: 'boolean', description: 'Confirm reset' },
      },
      required: ['confirm'],
    },
    handler: 'reset',
  },

  // =====================================================
  // GITHUB MCP TOOLS (subset - most are via MCP)
  // =====================================================
  {
    name: 'github_search_repos',
    description: 'Search GitHub repositories.',
    category: TOOL_CATEGORIES.GITHUB,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        sort: { type: 'string', enum: ['stars', 'forks', 'updated'] },
        order: { type: 'string', enum: ['asc', 'desc'] },
        perPage: { type: 'number', description: 'Results per page' },
      },
      required: ['query'],
    },
    handler: 'searchRepos',
  },
  {
    name: 'github_get_repo',
    description: 'Get repository information.',
    category: TOOL_CATEGORIES.GITHUB,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
    handler: 'getRepo',
  },
  {
    name: 'github_list_issues',
    description: 'List repository issues.',
    category: TOOL_CATEGORIES.GITHUB,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'] },
        labels: { type: 'string', description: 'Comma-separated labels' },
      },
      required: ['owner', 'repo'],
    },
    handler: 'listIssues',
  },

  // =====================================================
  // LMSTUDIO MCP TOOLS
  // =====================================================
  {
    name: 'lmstudio_list_models',
    description: 'List available models in LM Studio.',
    category: TOOL_CATEGORIES.LMSTUDIO,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: 'listModels',
  },
  {
    name: 'lmstudio_chat',
    description: 'Send a chat message to LM Studio.',
    category: TOOL_CATEGORIES.LMSTUDIO,
    parameters: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['system', 'user', 'assistant'] },
              content: { type: 'string' },
            },
            required: ['role', 'content'],
          },
          description: 'Chat messages',
        },
        model: { type: 'string', description: 'Model to use' },
        temperature: { type: 'number', description: 'Temperature (0-2)' },
        max_tokens: { type: 'number', description: 'Max tokens to generate' },
      },
      required: ['messages'],
    },
    handler: 'chat',
  },
  {
    name: 'lmstudio_complete',
    description: 'Generate text completion.',
    category: TOOL_CATEGORIES.LMSTUDIO,
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        model: { type: 'string', description: 'Model to use' },
        temperature: { type: 'number', description: 'Temperature (0-2)' },
        max_tokens: { type: 'number', description: 'Max tokens to generate' },
      },
      required: ['prompt'],
    },
    handler: 'complete',
  },
  {
    name: 'lmstudio_embeddings',
    description: 'Generate text embeddings.',
    category: TOOL_CATEGORIES.LMSTUDIO,
    parameters: {
      type: 'object',
      properties: {
        input: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          description: 'Text to embed',
        },
        model: { type: 'string', description: 'Embedding model to use' },
      },
      required: ['input'],
    },
    handler: 'embeddings',
  },

  // =====================================================
  // HUGGINGFACE MCP TOOLS
  // =====================================================
  {
    name: 'huggingface_search_models',
    description: 'Search HuggingFace models.',
    category: TOOL_CATEGORIES.HUGGINGFACE,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        filter: { type: 'string', description: 'Filter by task' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['query'],
    },
    handler: 'searchModels',
  },
  {
    name: 'huggingface_search_datasets',
    description: 'Search HuggingFace datasets.',
    category: TOOL_CATEGORIES.HUGGINGFACE,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        filter: { type: 'string', description: 'Filter by task' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['query'],
    },
    handler: 'searchDatasets',
  },
  {
    name: 'huggingface_search_papers',
    description: 'Search HuggingFace papers.',
    category: TOOL_CATEGORIES.HUGGINGFACE,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['query'],
    },
    handler: 'searchPapers',
  },

  // =====================================================
  // RENDER COMMANDS (WebSocket UI)
  // =====================================================
  {
    name: 'render_spiral',
    description: 'Render WebGL spiral effect on the dashboard.',
    category: TOOL_CATEGORIES.RENDER,
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Spiral pattern name' },
        intensity: { type: 'number', description: 'Effect intensity (0-1)' },
        duration: { type: 'number', description: 'Duration in seconds' },
        colors: { type: 'array', items: { type: 'string' }, description: 'Color array' },
      },
      required: [],
    },
    handler: 'renderSpiral',
  },
  {
    name: 'render_notification',
    description: 'Show a notification toast on the dashboard.',
    category: TOOL_CATEGORIES.RENDER,
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Notification message' },
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
        duration: { type: 'number', description: 'Duration in ms' },
      },
      required: ['message'],
    },
    handler: 'renderNotification',
  },
  {
    name: 'render_modal',
    description: 'Show a modal dialog on the dashboard.',
    category: TOOL_CATEGORIES.RENDER,
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Modal title' },
        content: { type: 'string', description: 'Modal content (HTML or text)' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              action: { type: 'string' },
              primary: { type: 'boolean' },
            },
          },
        },
      },
      required: ['title', 'content'],
    },
    handler: 'renderModal',
  },
];

/**
 * Get tool by name
 * @param {string} name - Tool name
 * @returns {Object|null} Tool definition
 */
export function getToolByName(name) {
  return AGENT_TOOLS.find(t => t.name === name) || null;
}

/**
 * Get tools by category
 * @param {string} category - Tool category
 * @returns {Array} Tools in category
 */
export function getToolsByCategory(category) {
  return AGENT_TOOLS.filter(t => t.category === category);
}

/**
 * Get core tools for a specific use case
 * @param {string} useCase - Use case: 'minimal', 'chat', 'agent', 'full'
 * @returns {Array} Filtered tools
 */
export function getCoreTools(useCase = 'chat') {
  const coreSets = {
    minimal: ['memory_read_graph', 'memory_search_nodes', 'fetch_url'],
    chat: [
      'memory_read_graph', 'memory_search_nodes', 'memory_create_entities',
      'fetch_url', 'storage_list', 'storage_read',
      'lmstudio_chat', 'lmstudio_list_models',
    ],
    agent: [
      ...getCoreTools('chat').map(t => t.name),
      'memory_create_relations', 'memory_add_observations',
      'storage_write', 'storage_search',
      'puppeteer_navigate', 'puppeteer_screenshot', 'puppeteer_click',
      'mongodb_query', 'mongodb_insert',
      'thinking_step', 'thinking_conclude',
    ],
    full: AGENT_TOOLS.map(t => t.name),
  };

  const toolNames = coreSets[useCase] || coreSets.chat;
  return AGENT_TOOLS.filter(t => toolNames.includes(t.name));
}

/**
 * Format tools for OpenAI function calling
 * @param {Array} tools - Tool definitions
 * @returns {Array} OpenAI format tools
 */
export function formatToolsForOpenAI(tools = AGENT_TOOLS) {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Agent Tool Executor
 * Routes tool calls to appropriate handlers with MCP fallback
 */
export class AgentToolExecutor {
  #handlers = new Map();
  #mcpClient = null;
  #wsServer = null;

  constructor(options = {}) {
    this.#mcpClient = options.mcpClient || null;
    this.#wsServer = options.wsServer || null;
    
    logger.info('Agent tool executor initialized', {
      hasMcpClient: !!this.#mcpClient,
      hasWsServer: !!this.#wsServer,
    });
  }

  /**
   * Register handler module for a category
   * @param {string} category - Tool category
   * @param {Object} handlers - Handler object with methods
   */
  registerHandlers(category, handlers) {
    this.#handlers.set(category, handlers);
    logger.debug(`Registered handlers for: ${category}`);
  }

  /**
   * Set MCP client for fallback
   * @param {Object} mcpClient - MCP client instance
   */
  setMcpClient(mcpClient) {
    this.#mcpClient = mcpClient;
  }

  /**
   * Set WebSocket server for render commands
   * @param {Object} wsServer - WebSocket server instance
   */
  setWsServer(wsServer) {
    this.#wsServer = wsServer;
  }

  /**
   * Execute a tool call
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Execution result
   */
  async execute(toolName, args = {}) {
    const tool = getToolByName(toolName);
    
    if (!tool) {
      logger.warn(`Unknown tool: ${toolName}`);
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
        toolName,
      };
    }

    logger.info(`Executing tool: ${toolName}`, { category: tool.category, args });

    try {
      // Handle render commands via WebSocket
      if (tool.category === TOOL_CATEGORIES.RENDER) {
        return await this.#executeRenderCommand(tool, args);
      }

      // Try local handler first
      const handlers = this.#handlers.get(tool.category);
      if (handlers && typeof handlers[tool.handler] === 'function') {
        const result = await handlers[tool.handler](args);
        return {
          success: true,
          result,
          toolName,
          source: 'local',
        };
      }

      // Fallback to MCP client
      if (this.#mcpClient) {
        const result = await this.#mcpClient.callTool(toolName, args);
        return {
          success: true,
          result,
          toolName,
          source: 'mcp',
        };
      }

      // No handler available
      return {
        success: false,
        error: `No handler available for tool: ${toolName}`,
        toolName,
      };
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, { error: error.message });
      return {
        success: false,
        error: error.message,
        toolName,
      };
    }
  }

  /**
   * Execute multiple tool calls in parallel
   * @param {Array} toolCalls - Array of {name, arguments} objects
   * @returns {Promise<Array>} Array of results
   */
  async executeMany(toolCalls) {
    return Promise.all(
      toolCalls.map(call => this.execute(call.name, call.arguments))
    );
  }

  /**
   * Execute render command via WebSocket
   * @private
   */
  async #executeRenderCommand(tool, args) {
    if (!this.#wsServer) {
      return {
        success: false,
        error: 'WebSocket server not available for render commands',
        toolName: tool.name,
      };
    }

    // Broadcast render command to connected clients
    const command = {
      type: 'render',
      command: tool.handler,
      payload: args,
      timestamp: Date.now(),
    };

    this.#wsServer.broadcast(command);

    return {
      success: true,
      result: { sent: true, command: tool.handler },
      toolName: tool.name,
      source: 'websocket',
    };
  }

  /**
   * Get available tools
   * @returns {Array} Tool definitions
   */
  getAvailableTools() {
    return AGENT_TOOLS;
  }

  /**
   * Get tools formatted for OpenAI
   * @param {string} useCase - Use case filter
   * @returns {Array} OpenAI format tools
   */
  getOpenAITools(useCase = 'full') {
    const tools = useCase === 'full' ? AGENT_TOOLS : getCoreTools(useCase);
    return formatToolsForOpenAI(tools);
  }
}

/**
 * Create agent tool executor instance
 * @param {Object} options - Executor options
 * @returns {AgentToolExecutor}
 */
export function createAgentToolExecutor(options = {}) {
  return new AgentToolExecutor(options);
}

export default AgentToolExecutor;
