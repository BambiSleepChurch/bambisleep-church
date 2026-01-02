/**
 * BambiSleep™ Church MCP Control Tower
 * OpenAPI 3.0 Specification Generator
 */

/**
 * OpenAPI 3.0 specification for MCP Control Tower API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BambiSleep™ MCP Control Tower API',
    description: 'REST API for orchestrating MCP (Model Context Protocol) servers. Provides unified access to Memory, GitHub, HuggingFace, Stripe, Patreon, MongoDB, SQLite, Puppeteer, Fetch, Sequential Thinking, Storage, Clarity, LM Studio, and Agent services.',
    version: '1.0.0',
    contact: {
      name: 'BambiSleepChurch™',
      url: 'https://bambisleep.church',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080',
      description: 'Local development server',
    },
    {
      url: 'https://bambisleep.church/api',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Health', description: 'Health check and system status' },
    { name: 'Servers', description: 'MCP server management' },
    { name: 'Memory', description: 'Knowledge graph operations' },
    { name: 'GitHub', description: 'GitHub API integration' },
    { name: 'HuggingFace', description: 'ML model inference' },
    { name: 'LMStudio', description: 'LM Studio LLM operations' },
    { name: 'Stripe', description: 'Payment operations' },
    { name: 'Patreon', description: 'Patreon creator platform' },
    { name: 'MongoDB', description: 'MongoDB database operations' },
    { name: 'SQLite', description: 'SQLite database operations' },
    { name: 'Puppeteer', description: 'Browser automation' },
    { name: 'Storage', description: 'File storage operations' },
    { name: 'Fetch', description: 'HTTP request utilities' },
    { name: 'Thinking', description: 'Sequential thinking chains' },
    { name: 'Clarity', description: 'Microsoft Clarity analytics' },
    { name: 'Agent', description: 'Agent orchestrator' },
    { name: 'ModelRouter', description: 'Smart model selection' },
    { name: 'BambiSleepChat', description: 'BambiSleep triggers and TTS' },
    { name: 'Tools', description: 'Agent tool execution' },
    { name: 'Metrics', description: 'Prometheus metrics' },
  ],
  paths: {
    // ============ HEALTH ============
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns server health status, version, and environment',
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                    env: { type: 'string', example: 'development' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/stats/rate-limit': {
      get: {
        tags: ['Health'],
        summary: 'Rate limit statistics',
        description: 'Returns current rate limit stats per IP',
        responses: {
          200: {
            description: 'Rate limit stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalTracked: { type: 'integer' },
                    ipStats: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/stats/websocket': {
      get: {
        tags: ['Health'],
        summary: 'WebSocket statistics',
        description: 'Returns WebSocket connection stats',
        responses: {
          200: {
            description: 'WebSocket stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    connections: { type: 'integer' },
                    messagesSent: { type: 'integer' },
                    messagesReceived: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/metrics': {
      get: {
        tags: ['Metrics'],
        summary: 'Prometheus metrics',
        description: 'Returns metrics in Prometheus exposition format',
        responses: {
          200: {
            description: 'Prometheus metrics',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },

    // ============ SERVERS ============
    '/api/servers': {
      get: {
        tags: ['Servers'],
        summary: 'List all MCP servers',
        description: 'Returns all registered MCP servers and integrated handlers',
        responses: {
          200: {
            description: 'List of servers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    servers: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Server' },
                    },
                    stats: { $ref: '#/components/schemas/ServerStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/servers/{name}': {
      get: {
        tags: ['Servers'],
        summary: 'Get server details',
        parameters: [
          { name: 'name', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Server details' },
          404: { description: 'Server not found' },
        },
      },
    },
    '/api/servers/{name}/start': {
      post: {
        tags: ['Servers'],
        summary: 'Start a server',
        parameters: [
          { name: 'name', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Server started' },
          400: { description: 'Failed to start' },
        },
      },
    },
    '/api/servers/{name}/stop': {
      post: {
        tags: ['Servers'],
        summary: 'Stop a server',
        parameters: [
          { name: 'name', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Server stopped' },
          400: { description: 'Failed to stop' },
        },
      },
    },

    // ============ MEMORY ============
    '/api/memory': {
      get: {
        tags: ['Memory'],
        summary: 'Read entire knowledge graph',
        responses: {
          200: {
            description: 'Knowledge graph data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KnowledgeGraph' },
              },
            },
          },
        },
      },
    },
    '/api/memory/entities': {
      post: {
        tags: ['Memory'],
        summary: 'Create entities',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  entities: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Entity' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Entities created' },
        },
      },
      delete: {
        tags: ['Memory'],
        summary: 'Delete entities',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  names: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Entities deleted' },
        },
      },
    },
    '/api/memory/relations': {
      post: {
        tags: ['Memory'],
        summary: 'Create relations',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  relations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Relation' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Relations created' },
        },
      },
      delete: {
        tags: ['Memory'],
        summary: 'Delete relations',
        responses: {
          200: { description: 'Relations deleted' },
        },
      },
    },
    '/api/memory/search': {
      get: {
        tags: ['Memory'],
        summary: 'Search nodes',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query' },
        ],
        responses: {
          200: { description: 'Search results' },
        },
      },
    },

    // ============ GITHUB ============
    '/api/github/user': {
      get: {
        tags: ['GitHub'],
        summary: 'Get authenticated user',
        responses: {
          200: { description: 'User info' },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/api/github/repos': {
      get: {
        tags: ['GitHub'],
        summary: 'List repositories',
        parameters: [
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 30 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'List of repositories' },
        },
      },
    },
    '/api/github/search/repos': {
      get: {
        tags: ['GitHub'],
        summary: 'Search repositories',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Search results' },
        },
      },
    },

    // ============ HUGGINGFACE ============
    '/api/huggingface/models': {
      get: {
        tags: ['HuggingFace'],
        summary: 'Search ML models',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Model search results' },
        },
      },
    },
    '/api/huggingface/datasets': {
      get: {
        tags: ['HuggingFace'],
        summary: 'Search datasets',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Dataset search results' },
        },
      },
    },
    '/api/huggingface/inference': {
      post: {
        tags: ['HuggingFace'],
        summary: 'Run inference',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  model: { type: 'string' },
                  inputs: { type: 'string' },
                  options: { type: 'object' },
                },
                required: ['model', 'inputs'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Inference result' },
        },
      },
    },

    // ============ LM STUDIO ============
    '/api/lmstudio/health': {
      get: {
        tags: ['LMStudio'],
        summary: 'Test LM Studio connection',
        responses: {
          200: { description: 'Connection healthy' },
          500: { description: 'Connection failed' },
        },
      },
    },
    '/api/lmstudio/models': {
      get: {
        tags: ['LMStudio'],
        summary: 'List loaded models',
        responses: {
          200: { description: 'List of models' },
        },
      },
    },
    '/api/lmstudio/chat': {
      post: {
        tags: ['LMStudio'],
        summary: 'Chat completion',
        requestBody: {
          content: {
            'application/json': {
              schema: {
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
                    },
                  },
                  options: { type: 'object' },
                },
                required: ['messages'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Chat response' },
        },
      },
    },
    '/api/lmstudio/embed': {
      post: {
        tags: ['LMStudio'],
        summary: 'Generate embeddings',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  input: { type: 'string' },
                  options: { type: 'object' },
                },
                required: ['input'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Embedding vector' },
        },
      },
    },

    // ============ STRIPE ============
    '/api/stripe/customers': {
      get: {
        tags: ['Stripe'],
        summary: 'List customers',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'email', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Customer list' },
        },
      },
      post: {
        tags: ['Stripe'],
        summary: 'Create customer',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                  metadata: { type: 'object' },
                },
                required: ['email'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Customer created' },
        },
      },
    },
    '/api/stripe/products': {
      get: {
        tags: ['Stripe'],
        summary: 'List products',
        responses: {
          200: { description: 'Product list' },
        },
      },
      post: {
        tags: ['Stripe'],
        summary: 'Create product',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Product created' },
        },
      },
    },
    '/api/stripe/balance': {
      get: {
        tags: ['Stripe'],
        summary: 'Get account balance',
        responses: {
          200: { description: 'Balance info' },
        },
      },
    },

    // ============ PATREON ============
    '/api/patreon/identity': {
      get: {
        tags: ['Patreon'],
        summary: 'Get creator identity',
        responses: {
          200: { description: 'Creator info' },
        },
      },
    },
    '/api/patreon/campaigns': {
      get: {
        tags: ['Patreon'],
        summary: 'List campaigns',
        responses: {
          200: { description: 'Campaign list' },
        },
      },
    },
    '/api/patreon/members': {
      get: {
        tags: ['Patreon'],
        summary: 'List members',
        parameters: [
          { name: 'campaignId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Member list' },
        },
      },
    },

    // ============ MONGODB ============
    '/api/mongodb/connect': {
      post: {
        tags: ['MongoDB'],
        summary: 'Connect to MongoDB',
        responses: {
          200: { description: 'Connected' },
        },
      },
    },
    '/api/mongodb/collections': {
      get: {
        tags: ['MongoDB'],
        summary: 'List collections',
        parameters: [
          { name: 'database', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Collection list' },
        },
      },
    },
    '/api/mongodb/{database}/{collection}': {
      get: {
        tags: ['MongoDB'],
        summary: 'Query documents',
        parameters: [
          { name: 'database', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'collection', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Documents' },
        },
      },
      post: {
        tags: ['MongoDB'],
        summary: 'Insert document',
        parameters: [
          { name: 'database', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'collection', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          200: { description: 'Inserted' },
        },
      },
    },

    // ============ SQLITE ============
    '/api/sqlite/query': {
      post: {
        tags: ['SQLite'],
        summary: 'Execute SQL query',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sql: { type: 'string' },
                  params: { type: 'array' },
                },
                required: ['sql'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Query results' },
        },
      },
    },
    '/api/sqlite/tables': {
      get: {
        tags: ['SQLite'],
        summary: 'List tables',
        responses: {
          200: { description: 'Table list' },
        },
      },
    },

    // ============ PUPPETEER ============
    '/api/puppeteer/status': {
      get: {
        tags: ['Puppeteer'],
        summary: 'Get browser status',
        responses: {
          200: { description: 'Browser status' },
        },
      },
    },
    '/api/puppeteer/launch': {
      post: {
        tags: ['Puppeteer'],
        summary: 'Launch browser',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  headless: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Browser launched' },
        },
      },
    },
    '/api/puppeteer/navigate': {
      post: {
        tags: ['Puppeteer'],
        summary: 'Navigate to URL',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                },
                required: ['url'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Navigation complete' },
        },
      },
    },
    '/api/puppeteer/screenshot': {
      post: {
        tags: ['Puppeteer'],
        summary: 'Take screenshot',
        responses: {
          200: { description: 'Screenshot data' },
        },
      },
    },

    // ============ STORAGE ============
    '/api/storage/files': {
      get: {
        tags: ['Storage'],
        summary: 'List files',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['images', 'videos'] } },
        ],
        responses: {
          200: { description: 'File list' },
        },
      },
    },
    '/api/storage/upload': {
      post: {
        tags: ['Storage'],
        summary: 'Upload file',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  type: { type: 'string', enum: ['images', 'videos'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'File uploaded' },
        },
      },
    },

    // ============ FETCH ============
    '/api/fetch/url': {
      post: {
        tags: ['Fetch'],
        summary: 'Fetch URL content',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  options: { type: 'object' },
                },
                required: ['url'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Fetched content' },
        },
      },
    },

    // ============ THINKING ============
    '/api/thinking/think': {
      post: {
        tags: ['Thinking'],
        summary: 'Start thinking chain',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  thought: { type: 'string' },
                  thoughtNumber: { type: 'integer' },
                  totalThoughts: { type: 'integer' },
                },
                required: ['thought'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Thought recorded' },
        },
      },
    },
    '/api/thinking/sessions': {
      get: {
        tags: ['Thinking'],
        summary: 'List thinking sessions',
        responses: {
          200: { description: 'Session list' },
        },
      },
    },

    // ============ CLARITY ============
    '/api/clarity/init': {
      post: {
        tags: ['Clarity'],
        summary: 'Initialize Clarity analytics',
        responses: {
          200: { description: 'Initialized' },
        },
      },
    },
    '/api/clarity/events': {
      get: {
        tags: ['Clarity'],
        summary: 'Get event history',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Event list' },
        },
      },
    },

    // ============ AGENT ============
    '/api/agent/chat': {
      post: {
        tags: ['Agent'],
        summary: 'Send message to agent',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  conversationId: { type: 'string' },
                  options: { type: 'object' },
                },
                required: ['message'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Agent response' },
        },
      },
    },
    '/api/agent/tools': {
      get: {
        tags: ['Agent'],
        summary: 'List agent tools',
        responses: {
          200: {
            description: 'Tool list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tools: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Tool' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/agent/tools/execute': {
      post: {
        tags: ['Tools'],
        summary: 'Execute agent tool',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tool: { type: 'string' },
                  arguments: { type: 'object' },
                },
                required: ['tool'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Tool result' },
        },
      },
    },
    '/api/agent/personality': {
      get: {
        tags: ['Agent'],
        summary: 'Get agent personality',
        responses: {
          200: { description: 'Personality info' },
        },
      },
    },
    
    // ============ AGENT RENDER (Phase 6) ============
    '/api/agent/render': {
      post: {
        tags: ['Agent'],
        summary: 'Render component to workspace',
        description: 'Broadcasts a render command to the Agent Workspace via WebSocket',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'data'],
                properties: {
                  type: { 
                    type: 'string', 
                    enum: ['card', 'table', 'form', 'alert', 'progress', 'list', 'code'],
                    description: 'Component type to render'
                  },
                  data: { type: 'object', description: 'Component data' },
                  options: { type: 'object', description: 'Rendering options' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Component rendered successfully' },
        },
      },
    },
    '/api/agent/render/card': {
      post: {
        tags: ['Agent'],
        summary: 'Render card component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  icon: { type: 'string' },
                  variant: { type: 'string', enum: ['default', 'success', 'warning', 'error', 'info'] },
                  actions: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Card rendered' } },
      },
    },
    '/api/agent/render/table': {
      post: {
        tags: ['Agent'],
        summary: 'Render table component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['columns', 'rows'],
                properties: {
                  title: { type: 'string' },
                  columns: { type: 'array', items: { type: 'string' } },
                  rows: { type: 'array', items: { type: 'array' } },
                  sortable: { type: 'boolean' },
                  filterable: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Table rendered' } },
      },
    },
    '/api/agent/render/form': {
      post: {
        tags: ['Agent'],
        summary: 'Render form component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fields'],
                properties: {
                  title: { type: 'string' },
                  fields: { 
                    type: 'array', 
                    items: { 
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        label: { type: 'string' },
                        required: { type: 'boolean' },
                      }
                    } 
                  },
                  submitText: { type: 'string' },
                  onSubmit: { type: 'string', description: 'Callback function name' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Form rendered' } },
      },
    },
    '/api/agent/render/alert': {
      post: {
        tags: ['Agent'],
        summary: 'Render alert component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
                  dismissible: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Alert rendered' } },
      },
    },
    '/api/agent/render/progress': {
      post: {
        tags: ['Agent'],
        summary: 'Render progress component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'number', default: 0 },
                  max: { type: 'number', default: 100 },
                  showPercent: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Progress rendered' } },
      },
    },
    '/api/agent/render/list': {
      post: {
        tags: ['Agent'],
        summary: 'Render list component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  title: { type: 'string' },
                  items: { type: 'array', items: { type: 'string' } },
                  ordered: { type: 'boolean', default: false },
                  selectable: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'List rendered' } },
      },
    },
    '/api/agent/render/code': {
      post: {
        tags: ['Agent'],
        summary: 'Render code component',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: {
                  title: { type: 'string' },
                  code: { type: 'string' },
                  language: { type: 'string', default: 'text' },
                  showLineNumbers: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Code rendered' } },
      },
    },
    '/api/agent/render/clear': {
      post: {
        tags: ['Agent'],
        summary: 'Clear workspace content',
        description: 'Removes all rendered components from the Agent Workspace',
        responses: { 200: { description: 'Workspace cleared' } },
      },
    },

    // ============ MODEL ROUTER ============
    '/api/model-router/select': {
      post: {
        tags: ['ModelRouter'],
        summary: 'Select optimal model for task',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  taskType: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Selected model' },
        },
      },
    },
    '/api/model-router/profiles': {
      get: {
        tags: ['ModelRouter'],
        summary: 'List model profiles',
        responses: {
          200: { description: 'Model profiles' },
        },
      },
    },

    // ============ BAMBISLEEP CHAT ============
    '/api/bambisleep/triggers': {
      get: {
        tags: ['BambiSleepChat'],
        summary: 'List BambiSleep triggers',
        responses: {
          200: { description: 'Trigger list by category' },
        },
      },
    },
    '/api/bambisleep/spiral': {
      post: {
        tags: ['BambiSleepChat'],
        summary: 'Start spiral effect',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  duration: { type: 'integer' },
                  intensity: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Spiral started' },
        },
      },
    },

    // ============ DOCS ============
    '/api/docs': {
      get: {
        tags: ['Health'],
        summary: 'List documentation files',
        responses: {
          200: { description: 'Documentation list' },
        },
      },
    },
    '/api/docs/{filename}': {
      get: {
        tags: ['Health'],
        summary: 'Get documentation file',
        parameters: [
          { name: 'filename', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Documentation content' },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/openapi': {
      get: {
        tags: ['Health'],
        summary: 'OpenAPI specification',
        responses: {
          200: { description: 'OpenAPI 3.0 spec' },
        },
      },
    },
  },
  components: {
    schemas: {
      Server: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          status: { type: 'string', enum: ['running', 'stopped', 'error'] },
          type: { type: 'string', enum: ['mcp', 'integrated'] },
          description: { type: 'string' },
          pid: { type: 'integer' },
          startedAt: { type: 'string', format: 'date-time' },
        },
      },
      ServerStats: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          running: { type: 'integer' },
          stopped: { type: 'integer' },
          errors: { type: 'integer' },
          integrated: { type: 'integer' },
        },
      },
      KnowledgeGraph: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: { $ref: '#/components/schemas/Entity' },
          },
          relations: {
            type: 'array',
            items: { $ref: '#/components/schemas/Relation' },
          },
        },
      },
      Entity: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          entityType: { type: 'string' },
          observations: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['name', 'entityType'],
      },
      Relation: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          relationType: { type: 'string' },
        },
        required: ['from', 'to', 'relationType'],
      },
      Tool: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          parameters: { type: 'object' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
};

/**
 * Get OpenAPI specification as JSON
 */
export function getOpenApiSpec() {
  return openApiSpec;
}

/**
 * Generate HTML API documentation page
 */
export function generateApiDocsHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌸 BambiSleep™ API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    :root {
      --bg: #0a0a0f;
      --glass: rgba(255,255,255,0.05);
      --accent: #ff6b9d;
      --text: #e0e0e0;
    }
    body {
      background: var(--bg);
      margin: 0;
    }
    .swagger-ui {
      font-family: system-ui, -apple-system, sans-serif;
    }
    .swagger-ui .topbar {
      background: var(--glass);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 1rem;
    }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info { margin: 2rem 0; }
    .swagger-ui .info .title { color: var(--accent); }
    .swagger-ui .opblock-tag { color: var(--text); }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; }
    .header-brand {
      color: var(--accent);
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
    }
    .header-brand:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout',
        defaultModelsExpandDepth: 0,
      });
    };
  </script>
</body>
</html>`;
}

export default { getOpenApiSpec, generateApiDocsHtml };
