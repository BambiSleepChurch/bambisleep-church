/**
 * BambiSleep™ Church MCP Control Tower
 * StatsBar Component - Server statistics display
 */

/**
 * Render stats bar
 * @param {Object} stats - Stats object with running, stopped, error, total
 * @returns {string} HTML string
 */
export function renderStatsBar(stats) {
  return `
    <span class="stat-item stat-running">● ${stats.running} running</span>
    <span class="stat-item stat-stopped">○ ${stats.stopped} stopped</span>
    <span class="stat-item stat-error">✕ ${stats.error} errors</span>
    <span class="stat-item stat-total">◆ ${stats.total} total</span>
  `;
}

/**
 * Update stats bar in DOM
 * @param {Object} stats - Stats object
 */
export function updateStatsBar(stats) {
  const el = document.getElementById('stats');
  if (el) {
    el.innerHTML = renderStatsBar(stats);
  }
}
