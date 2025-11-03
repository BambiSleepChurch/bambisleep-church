import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/docs/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => handleSearch(value), 300);
  };

  const handleResultClick = (path) => {
    navigate(`/docs/${path}`);
    setShowResults(false);
    setQuery('');
  };

  const handleBlur = () => {
    // Delay to allow click events to fire
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="🔍 Search documentation..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => results.length > 0 && setShowResults(true)}
        onBlur={handleBlur}
        className="search-input"
      />
      
      {searching && <div className="search-spinner">Searching...</div>}
      
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => handleResultClick(result.path)}
            >
              <div className="result-title">📄 {result.title}</div>
              <div className="result-path">{result.path}</div>
              {result.matches && result.matches.length > 0 && (
                <div className="result-matches">
                  {result.matches.slice(0, 2).map((match, i) => (
                    <div key={i} className="result-match">
                      Line {match.line}: {match.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showResults && query && results.length === 0 && !searching && (
        <div className="search-results">
          <div className="search-no-results">No results found for "{query}"</div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
