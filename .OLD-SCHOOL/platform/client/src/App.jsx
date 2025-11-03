import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DocumentViewer from './components/DocumentViewer';
import SearchBar from './components/SearchBar';
import Home from './pages/Home';
import './App.css';

function App() {
  const [docTree, setDocTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDocTree();
  }, []);

  const fetchDocTree = async () => {
    try {
      const response = await fetch('/api/docs/tree');
      if (!response.ok) throw new Error('Failed to load documentation');
      const data = await response.json();
      setDocTree(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Universal Machine Documentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h1>❌ Error Loading Documentation</h1>
        <p>{error}</p>
        <button onClick={fetchDocTree}>Retry</button>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <div className="header-content">
            <h1>🤖 HarleyVader - Universal Machine</h1>
            <p className="tagline">"Write once, run forever, across all machines"</p>
          </div>
          <SearchBar />
        </header>

        <div className="app-body">
          <Sidebar 
            docTree={docTree} 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          
          <main className={`app-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/docs/*" element={<DocumentViewer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
