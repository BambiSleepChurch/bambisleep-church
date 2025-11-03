import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ docTree, isOpen, onClose }) {
  const location = useLocation();
  const [expandedFolders, setExpandedFolders] = useState(new Set(['projects', 'bambisleep-church']));

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTree = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <ul className={`tree-level-${level}`}>
        {nodes.map((node, index) => {
          const isExpanded = expandedFolders.has(node.path);
          const currentPath = `/docs/${node.path}`;
          const isActive = location.pathname === currentPath;

          if (node.type === 'directory') {
            return (
              <li key={index} className="tree-directory">
                <div 
                  className={`tree-item ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleFolder(node.path)}
                >
                  <span className="tree-icon">{isExpanded ? '📂' : '📁'}</span>
                  <span className="tree-name">{node.name}</span>
                </div>
                {isExpanded && renderTree(node.children, level + 1)}
              </li>
            );
          }

          return (
            <li key={index} className="tree-file">
              <Link 
                to={currentPath}
                className={`tree-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="tree-icon">📄</span>
                <span className="tree-name">{node.title || node.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>📚 Documentation</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            🏠 Home
          </Link>
          {renderTree(docTree)}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
