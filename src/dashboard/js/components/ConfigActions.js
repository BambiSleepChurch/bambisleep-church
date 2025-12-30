/**
 * BambiSleep™ Church MCP Control Tower
 * Config Export/Import - Server configuration management
 */

import { showToast } from './Toast.js';

/**
 * Export server configurations to JSON file
 */
export function exportConfigs(servers) {
  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    servers: servers.map(s => ({
      name: s.name,
      config: s.config,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcp-servers-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('success', 'Exported', `${servers.length} server configs exported`);
}

/**
 * Import server configurations from JSON file
 */
export function importConfigs(onImport) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.servers || !Array.isArray(data.servers)) {
        throw new Error('Invalid config file format');
      }

      // Validate each server config
      const validServers = data.servers.filter(s => 
        s.name && typeof s.name === 'string' &&
        s.config && typeof s.config === 'object'
      );

      if (validServers.length === 0) {
        throw new Error('No valid server configurations found');
      }

      showToast('success', 'Imported', `${validServers.length} server configs imported`);
      
      if (onImport) {
        onImport(validServers);
      }
    } catch (error) {
      showToast('error', 'Import Failed', error.message);
    }
  };

  input.click();
}

/**
 * Render export/import buttons
 */
export function renderConfigActions() {
  return `
    <div class="config-actions">
      <button class="btn btn-secondary" onclick="window.Dashboard.exportConfigs()" title="Export server configs">
        📤 Export
      </button>
      <button class="btn btn-secondary" onclick="window.Dashboard.importConfigs()" title="Import server configs">
        📥 Import
      </button>
    </div>
  `;
}
