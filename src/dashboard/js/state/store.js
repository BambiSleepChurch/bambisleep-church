/**
 * BambiSleep™ Church MCP Control Tower
 * Global State Store - Simple reactive state management
 */

/**
 * Create a reactive store with subscribers
 */
export function createStore(initialState) {
  let state = { ...initialState };
  const subscribers = new Set();

  return {
    getState() {
      return state;
    },

    setState(updates) {
      const prevState = state;
      state = { ...state, ...updates };
      subscribers.forEach(fn => fn(state, prevState));
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },

    select(selector) {
      return selector(state);
    }
  };
}

// ============================================================================
// GLOBAL APPLICATION STATE
// ============================================================================

export const AppState = createStore({
  // Server data
  servers: [],
  filteredServers: [],
  
  // UI state
  searchQuery: '',
  currentFilter: 'all',
  
  // Connection state
  wsStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected'
  apiStatus: 'connecting',  // 'connected' | 'disconnected'
  
  // Modal state
  activeModal: null,        // 'server' | 'shortcuts' | null
  selectedServer: null,     // Server name for detail modal
  
  // Logs & Activity
  serverLogs: {},           // { serverName: [log entries] }
  activities: [],           // Activity feed timeline
});

// ============================================================================
// SELECTORS
// ============================================================================

export const Selectors = {
  servers: (state) => state.servers,
  filteredServers: (state) => state.filteredServers,
  searchQuery: (state) => state.searchQuery,
  currentFilter: (state) => state.currentFilter,
  wsStatus: (state) => state.wsStatus,
  apiStatus: (state) => state.apiStatus,
  activeModal: (state) => state.activeModal,
  selectedServer: (state) => state.selectedServer,
  serverLogs: (state) => state.serverLogs,
  activities: (state) => state.activities,
  
  // Computed selectors
  stats: (state) => ({
    running: state.servers.filter(s => s.status === 'running').length,
    stopped: state.servers.filter(s => s.status === 'stopped').length,
    error: state.servers.filter(s => s.status === 'error' || s.error).length,
    total: state.servers.length
  }),
  
  serverByName: (name) => (state) => state.servers.find(s => s.name === name),
  logsForServer: (name) => (state) => state.serverLogs[name] || [],
};

// ============================================================================
// ACTIONS
// ============================================================================

export const Actions = {
  setServers(servers) {
    const state = AppState.getState();
    AppState.setState({ 
      servers,
      filteredServers: filterServerList(servers, state.searchQuery, state.currentFilter)
    });
  },

  updateServer(payload) {
    const { servers } = AppState.getState();
    const index = servers.findIndex(s => s.name === payload.name);
    if (index >= 0) {
      const updated = [...servers];
      updated[index] = { ...updated[index], ...payload };
      Actions.setServers(updated);
    }
  },

  setSearchQuery(query) {
    const { servers, currentFilter } = AppState.getState();
    AppState.setState({ 
      searchQuery: query,
      filteredServers: filterServerList(servers, query, currentFilter)
    });
  },

  setFilter(filter) {
    const { servers, searchQuery } = AppState.getState();
    AppState.setState({ 
      currentFilter: filter,
      filteredServers: filterServerList(servers, searchQuery, filter)
    });
  },

  setWsStatus(status) {
    AppState.setState({ wsStatus: status });
  },

  setApiStatus(status) {
    AppState.setState({ apiStatus: status });
  },

  openModal(modalType, serverName = null) {
    AppState.setState({ 
      activeModal: modalType,
      selectedServer: serverName
    });
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    AppState.setState({ 
      activeModal: null,
      selectedServer: null
    });
    document.body.style.overflow = '';
  },

  appendServerLog(serverName, logEntry) {
    const { serverLogs } = AppState.getState();
    const logs = serverLogs[serverName] || [];
    const updated = [...logs, logEntry].slice(-100); // Keep last 100
    AppState.setState({
      serverLogs: { ...serverLogs, [serverName]: updated }
    });
  },

  clearServerLogs(serverName) {
    const { serverLogs } = AppState.getState();
    AppState.setState({
      serverLogs: { ...serverLogs, [serverName]: [] }
    });
  }
};

// ============================================================================
// HELPERS
// ============================================================================

function filterServerList(servers, searchQuery, filter) {
  return servers.filter(server => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      server.name.toLowerCase().includes(query) ||
      (server.config?.command || '').toLowerCase().includes(query);
    
    // Status filter
    let matchesStatus = true;
    if (filter !== 'all') {
      if (filter === 'error') {
        matchesStatus = server.status === 'error' || server.error;
      } else {
        matchesStatus = server.status === filter;
      }
    }
    
    return matchesSearch && matchesStatus;
  });
}
