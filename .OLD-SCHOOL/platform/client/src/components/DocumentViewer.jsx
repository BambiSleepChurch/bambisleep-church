import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import './DocumentViewer.css';
import 'highlight.js/styles/github-dark.css';

function DocumentViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    loadDocument();
  }, [location.pathname]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      // Extract file path from URL (remove /docs/ prefix)
      const docPath = location.pathname.replace(/^\/docs\//, '');
      
      const response = await fetch(`/api/docs/content?path=${encodeURIComponent(docPath)}`);
      if (!response.ok) {
        throw new Error('Document not found');
      }

      const data = await response.json();
      setContent(data.content);
      setMetadata({ path: data.path });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="document-viewer loading">
        <div className="spinner"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-viewer error">
        <h1>❌ Error Loading Document</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="document-viewer">
      <div className="document-meta">
        <span className="document-path">📄 {metadata.path}</span>
      </div>
      
      <article className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[
            rehypeHighlight,
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: 'wrap' }]
          ]}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}

export default DocumentViewer;
