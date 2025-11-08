// 🌸 Simple Express Server for RAG & CAG Frontend
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo
const documents = [];
const conversations = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'RAG & CAG API'
  });
});

// RAG Endpoints
app.post('/api/rag/index', (req, res) => {
  const { text, source } = req.body;
  
  const doc = {
    id: Date.now(),
    text,
    source: source || 'user-input',
    indexed: new Date().toISOString()
  };
  
  documents.push(doc);
  
  res.json({ 
    success: true, 
    message: 'Document indexed',
    document: doc,
    totalDocs: documents.length
  });
});

app.post('/api/rag/query', (req, res) => {
  const { query } = req.body;
  
  // Simple keyword search
  const results = documents.filter(doc => 
    doc.text.toLowerCase().includes(query.toLowerCase())
  );
  
  res.json({
    query,
    results: results.slice(0, 5),
    totalFound: results.length,
    response: `Found ${results.length} relevant documents for: "${query}"`
  });
});

app.get('/api/rag/documents', (req, res) => {
  res.json({
    documents: documents.slice(-10),
    total: documents.length
  });
});

// CAG Endpoints
app.post('/api/cag/context', (req, res) => {
  const { name, type, data, priority } = req.body;
  
  const context = {
    id: Date.now(),
    name,
    type: type || 'user',
    priority: priority || 0.5,
    data,
    created: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Context added',
    context
  });
});

app.post('/api/cag/generate', (req, res) => {
  const { query, contexts } = req.body;
  
  conversations.push({
    role: 'user',
    content: query,
    timestamp: Date.now()
  });
  
  const response = {
    query,
    response: `CAG Response: Processed "${query}" with ${contexts?.length || 0} context sources.`,
    contextsUsed: contexts?.length || 0,
    conversationLength: conversations.length,
    timestamp: new Date().toISOString()
  };
  
  conversations.push({
    role: 'assistant',
    content: response.response,
    timestamp: Date.now()
  });
  
  res.json(response);
});

app.get('/api/cag/history', (req, res) => {
  res.json({
    history: conversations.slice(-20),
    total: conversations.length
  });
});

// Clear data
app.post('/api/clear', (req, res) => {
  const docsCount = documents.length;
  const convsCount = conversations.length;
  
  documents.length = 0;
  conversations.length = 0;
  
  res.json({
    success: true,
    message: 'All data cleared',
    cleared: {
      documents: docsCount,
      conversations: convsCount
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌸 RAG & CAG Server running on http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/rag/index`);
  console.log(`   POST /api/rag/query`);
  console.log(`   GET  /api/rag/documents`);
  console.log(`   POST /api/cag/context`);
  console.log(`   POST /api/cag/generate`);
  console.log(`   GET  /api/cag/history`);
  console.log(`   POST /api/clear`);
});
