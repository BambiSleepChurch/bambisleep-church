import { useState, useEffect } from 'react';
import './App.css';

const API_URL = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('rag');
  const [health, setHealth] = useState(null);
  
  // RAG State
  const [ragText, setRagText] = useState('');
  const [ragSource, setRagSource] = useState('');
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  // CAG State
  const [cagQuery, setCagQuery] = useState('');
  const [cagResult, setCagResult] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkHealth();
    loadDocuments();
    loadHistory();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
      setHealth(null);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/rag/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/cag/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleRAGIndex = async () => {
    if (!ragText.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rag/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ragText, source: ragSource })
      });
      
      const data = await res.json();
      setRagResult(data);
      setRagText('');
      setRagSource('');
      loadDocuments();
    } catch (err) {
      console.error('Index failed:', err);
    }
    setLoading(false);
  };

  const handleRAGQuery = async () => {
    if (!ragQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery })
      });
      
      const data = await res.json();
      setRagResult(data);
    } catch (err) {
      console.error('Query failed:', err);
    }
    setLoading(false);
  };

  const handleCAGGenerate = async () => {
    if (!cagQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cag/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cagQuery, contexts: ['user', 'system'] })
      });
      
      const data = await res.json();
      setCagResult(data);
      setCagQuery('');
      loadHistory();
    } catch (err) {
      console.error('Generate failed:', err);
    }
    setLoading(false);
  };

  const handleClear = async () => {
    if (!confirm('Clear all data?')) return;
    
    try {
      await fetch(`${API_URL}/clear`, { method: 'POST' });
      setRagResult(null);
      setCagResult(null);
      setDocuments([]);
      setHistory([]);
      alert('All data cleared!');
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🌸 RAG & CAG Frontend</h1>
        <p>Retrieval-Augmented Generation & Context-Augmented Generation</p>
        {health && (
          <span className="status">
            {health.status === 'healthy' ? '✅ Online' : '❌ Offline'}
          </span>
        )}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'rag' ? 'active' : ''}`}
          onClick={() => setActiveTab('rag')}
        >
          🔍 RAG Agent
        </button>
        <button 
          className={`tab ${activeTab === 'cag' ? 'active' : ''}`}
          onClick={() => setActiveTab('cag')}
        >
          🎯 CAG Agent
        </button>
      </div>

      {activeTab === 'rag' && (
        <div>
          <div className="section">
            <h2>📚 Index Documents</h2>
            <textarea
              placeholder="Enter text to index..."
              value={ragText}
              onChange={(e) => setRagText(e.target.value)}
            />
            <div className="input-group">
              <input
                placeholder="Source (optional)"
                value={ragSource}
                onChange={(e) => setRagSource(e.target.value)}
              />
              <button onClick={handleRAGIndex} disabled={loading}>
                {loading ? '⏳ Indexing...' : '📝 Index'}
              </button>
            </div>
          </div>

          <div className="section">
            <h2>🔎 Query Documents</h2>
            <div className="input-group">
              <input
                placeholder="Enter your query..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRAGQuery()}
              />
              <button onClick={handleRAGQuery} disabled={loading}>
                {loading ? '⏳ Searching...' : '🔍 Search'}
              </button>
            </div>

            {ragResult && (
              <div className="result">
                <h3>Results</h3>
                <pre>{JSON.stringify(ragResult, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="section">
            <h2>📄 Indexed Documents ({documents.length})</h2>
            <div className="documents">
              {documents.length === 0 ? (
                <p>No documents indexed yet. Add some above!</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="doc-item">
                    <h4>📄 {doc.source}</h4>
                    <p>{doc.text}</p>
                    <small>{new Date(doc.indexed).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cag' && (
        <div>
          <div className="section">
            <h2>💬 Generate with Context</h2>
            <div className="input-group">
              <input
                placeholder="Enter your message..."
                value={cagQuery}
                onChange={(e) => setCagQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCAGGenerate()}
              />
              <button onClick={handleCAGGenerate} disabled={loading}>
                {loading ? '⏳ Generating...' : '🌸 Generate'}
              </button>
            </div>

            {cagResult && (
              <div className="result">
                <h3>Response</h3>
                <pre>{JSON.stringify(cagResult, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="section">
            <h2>📜 Conversation History ({history.length})</h2>
            <div className="history">
              {history.length === 0 ? (
                <p>No conversation history yet. Start chatting above!</p>
              ) : (
                history.slice(-10).reverse().map((item, idx) => (
                  <div key={idx} className="history-item">
                    <strong>{item.role === 'user' ? '👤 User' : '🤖 Assistant'}</strong>
                    <p>{item.content}</p>
                    <small>{new Date(item.timestamp).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="btn-secondary" onClick={handleClear}>
          🗑️ Clear All Data
        </button>
      </div>
    </div>
  );
}

export default App;
