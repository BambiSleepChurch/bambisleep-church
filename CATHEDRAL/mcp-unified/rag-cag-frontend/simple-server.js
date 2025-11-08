// 🌸 SIMPLE ALL-IN-ONE SERVER - NO BUILD NEEDED!
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const documents = [];
const conversations = [];

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'RAG & CAG API' });
});

app.post('/api/rag/index', (req, res) => {
  const { text, source } = req.body;
  const doc = { id: Date.now(), text, source: source || 'user-input', indexed: new Date().toISOString() };
  documents.push(doc);
  res.json({ success: true, message: 'Document indexed', document: doc, totalDocs: documents.length });
});

app.post('/api/rag/query', (req, res) => {
  const { query } = req.body;
  const results = documents.filter(doc => doc.text.toLowerCase().includes(query.toLowerCase()));
  res.json({ query, results: results.slice(0, 5), totalFound: results.length, response: `Found ${results.length} relevant documents for: "${query}"` });
});

app.get('/api/rag/documents', (req, res) => {
  res.json({ documents: documents.slice(-10), total: documents.length });
});

app.post('/api/cag/generate', (req, res) => {
  const { query, contexts } = req.body;
  conversations.push({ role: 'user', content: query, timestamp: Date.now() });
  const response = {
    query,
    response: `CAG Response: Processed "${query}" with ${contexts?.length || 0} context sources.`,
    contextsUsed: contexts?.length || 0,
    conversationLength: conversations.length,
    timestamp: new Date().toISOString()
  };
  conversations.push({ role: 'assistant', content: response.response, timestamp: Date.now() });
  res.json(response);
});

app.get('/api/cag/history', (req, res) => {
  res.json({ history: conversations.slice(-20), total: conversations.length });
});

app.post('/api/clear', (req, res) => {
  const cleared = { documents: documents.length, conversations: conversations.length };
  documents.length = 0;
  conversations.length = 0;
  res.json({ success: true, message: 'All data cleared', cleared });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌸 RAG & CAG Server LIVE on http://localhost:${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser!`);
});
