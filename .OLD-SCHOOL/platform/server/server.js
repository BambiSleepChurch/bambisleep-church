import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow React dev server
}));
app.use(cors());
app.use(compression());
app.use(express.json());

// Serve static files from dist (production) or public (dev)
const distPath = join(__dirname, 'dist');
const publicPath = join(__dirname, 'public');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(publicPath));
}

// API: Get documentation tree structure
app.get('/api/docs/tree', async (req, res) => {
  try {
    const docsPath = join(__dirname, 'docs');
    const tree = await buildDocTree(docsPath);
    res.json(tree);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error building doc tree:', error);
    }
    res.status(500).json({ error: 'Failed to load documentation tree' });
  }
});

// API: Get specific markdown file content
app.get('/api/docs/content', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security: Prevent directory traversal
    const normalizedPath = join(__dirname, 'docs', filePath);
    if (!normalizedPath.startsWith(join(__dirname, 'docs'))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(normalizedPath, 'utf-8');
    res.json({ 
      content,
      path: filePath 
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error reading file:', error);
    }
    res.status(404).json({ error: 'File not found' });
  }
});

// API: Search documentation
app.get('/api/docs/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const docsPath = join(__dirname, 'docs');
    const results = await searchDocs(docsPath, q.toLowerCase());
    res.json(results);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error searching docs:', error);
    }
    res.status(500).json({ error: 'Search failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = existsSync(distPath) 
    ? join(distPath, 'index.html')
    : join(publicPath, 'index.html');
  
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Application not built. Run `npm run build` first.' });
  }
});

// Helper: Build documentation tree
async function buildDocTree(dir, basePath = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const tree = [];

  for (const entry of entries) {
    const relativePath = join(basePath, entry.name);
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      const children = await buildDocTree(fullPath, relativePath);
      tree.push({
        name: entry.name,
        type: 'directory',
        path: relativePath,
        children
      });
    } else if (entry.name.endsWith('.md')) {
      // Read first few lines for preview
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').slice(0, 5).join('\n');
      const title = extractTitle(content);
      
      tree.push({
        name: entry.name,
        type: 'file',
        path: relativePath,
        title,
        preview: lines
      });
    }
  }

  return tree;
}

// Helper: Extract title from markdown
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : 'Untitled';
}

// Helper: Search documentation
async function searchDocs(dir, query, basePath = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let results = [];

  for (const entry of entries) {
    const relativePath = join(basePath, entry.name);
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      const subResults = await searchDocs(fullPath, query, relativePath);
      results = results.concat(subResults);
    } else if (entry.name.endsWith('.md')) {
      const content = await fs.readFile(fullPath, 'utf-8');
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes(query)) {
        const title = extractTitle(content);
        const matches = extractMatches(content, query);
        
        results.push({
          path: relativePath,
          title,
          matches
        });
      }
    }
  }

  return results;
}

// Helper: Extract search matches with context
function extractMatches(content, query) {
  const lines = content.split('\n');
  const matches = [];
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(query)) {
      matches.push({
        line: index + 1,
        text: line.trim(),
        context: lines.slice(Math.max(0, index - 1), index + 2).join(' ')
      });
    }
  });

  return matches.slice(0, 5); // Limit to 5 matches per file
}

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌸 HarleyVader Documentation Server running on http://localhost:${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`   GET /api/docs/tree       - Get documentation structure`);
    console.log(`   GET /api/docs/content    - Get file content (?path=...)`);
    console.log(`   GET /api/docs/search     - Search docs (?q=...)`);
    console.log(`   GET /health              - Health check`);
  }
});
