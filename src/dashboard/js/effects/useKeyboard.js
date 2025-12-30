/**
 * BambiSleep™ Church MCP Control Tower
 * useKeyboard Effect - Keyboard shortcut handler
 */

import { closeAllModals, getModal } from '../components/Modal.js';
import { clearSearch, focusSearch } from '../components/SearchBar.js';
import { showToast } from '../components/Toast.js';
import { AppState, Selectors } from '../state/store.js';

/**
 * Initialize keyboard shortcuts
 * @param {Object} handlers - Custom action handlers
 */
export function useKeyboard(handlers = {}) {
  const {
    onRefresh = () => {},
    onToggleServer = () => {},
  } = handlers;

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    
    // Escape always works
    if (e.key === 'Escape') {
      if (isInputFocused) {
        clearSearch();
      } else {
        closeAllModals();
      }
      return;
    }
    
    // Ignore other shortcuts when typing
    if (isInputFocused) return;
    
    // Ctrl+R - Refresh
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      onRefresh();
      showToast('info', 'Refreshing', 'Fetching latest server status...');
      return;
    }
    
    // Ctrl+K - Focus search
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      focusSearch();
      return;
    }
    
    // ? - Show shortcuts help
    if (e.key === '?') {
      const modal = getModal('shortcuts');
      if (modal) {
        modal.isOpen() ? modal.close() : modal.open();
      }
      return;
    }
    
    // Number keys 1-9 - Toggle server by index
    if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      const servers = Selectors.filteredServers(AppState.getState());
      if (servers[index]) {
        onToggleServer(servers[index]);
      }
      return;
    }
  });
}

/**
 * Cleanup keyboard listeners (for SPA navigation)
 */
export function cleanupKeyboard() {
  // Store reference to handler for removal if needed
}
