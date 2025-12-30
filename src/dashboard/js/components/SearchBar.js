/**
 * BambiSleep™ Church MCP Control Tower
 * SearchBar Component - Search and filter controls
 */

import { Actions } from '../state/store.js';

/**
 * Render search bar
 * @param {string} currentFilter - Current active filter
 * @returns {string} HTML string
 */
export function renderSearchBar(currentFilter = 'all') {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'running', label: 'Running' },
    { id: 'stopped', label: 'Stopped' },
    { id: 'error', label: 'Errors' },
  ];
  
  return `
    <div class="search-bar glass-card">
      <input 
        type="text" 
        id="server-search" 
        class="search-input" 
        placeholder="🔍 Search servers... (Ctrl+K)" 
      />
      <div class="search-filters">
        ${filters.map(f => `
          <button 
            class="filter-btn ${f.id === currentFilter ? 'active' : ''}" 
            data-filter="${f.id}"
          >
            ${f.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Initialize search bar event handlers
 */
export function initSearchBar() {
  const searchInput = document.getElementById('server-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      Actions.setSearchQuery(e.target.value);
    });
  }
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Actions.setFilter(btn.dataset.filter);
    });
  });
}

/**
 * Focus search input
 */
export function focusSearch() {
  const input = document.getElementById('server-search');
  if (input) input.focus();
}

/**
 * Clear search input
 */
export function clearSearch() {
  const input = document.getElementById('server-search');
  if (input) {
    input.value = '';
    input.blur();
    Actions.setSearchQuery('');
  }
}
