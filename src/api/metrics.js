/**
 * BambiSleep™ Church MCP Control Tower
 * Prometheus Metrics Collector
 */

import { createLogger } from '../utils/logger.js';
import { registry } from '../servers/index.js';

const logger = createLogger('metrics');

/**
 * Metrics storage
 */
const metrics = {
  // Counters
  httpRequestsTotal: new Map(), // path:method -> count
  httpErrorsTotal: new Map(),   // status_code -> count
  toolExecutionsTotal: new Map(), // tool_name -> count
  wsMessagesTotal: { sent: 0, received: 0 },
  
  // Gauges
  activeConnections: 0,
  serverStatus: new Map(), // server_name -> 0/1
  
  // Histograms (simplified - just tracking counts and sums)
  httpDuration: new Map(), // path:method -> { count, sum }
  
  // Info
  startTime: Date.now(),
};

/**
 * Record HTTP request
 */
export function recordHttpRequest(path, method, statusCode, durationMs) {
  const key = `${method}:${path}`;
  
  // Increment request counter
  metrics.httpRequestsTotal.set(key, (metrics.httpRequestsTotal.get(key) || 0) + 1);
  
  // Record errors
  if (statusCode >= 400) {
    metrics.httpErrorsTotal.set(statusCode, (metrics.httpErrorsTotal.get(statusCode) || 0) + 1);
  }
  
  // Record duration
  const duration = metrics.httpDuration.get(key) || { count: 0, sum: 0 };
  duration.count++;
  duration.sum += durationMs;
  metrics.httpDuration.set(key, duration);
}

/**
 * Record tool execution
 */
export function recordToolExecution(toolName) {
  metrics.toolExecutionsTotal.set(toolName, (metrics.toolExecutionsTotal.get(toolName) || 0) + 1);
}

/**
 * Record WebSocket message
 */
export function recordWsMessage(direction) {
  if (direction === 'sent') {
    metrics.wsMessagesTotal.sent++;
  } else {
    metrics.wsMessagesTotal.received++;
  }
}

/**
 * Set active connections gauge
 */
export function setActiveConnections(count) {
  metrics.activeConnections = count;
}

/**
 * Update server status gauge
 */
export function updateServerStatus(name, running) {
  metrics.serverStatus.set(name, running ? 1 : 0);
}

/**
 * Get uptime in seconds
 */
function getUptimeSeconds() {
  return Math.floor((Date.now() - metrics.startTime) / 1000);
}

/**
 * Format metrics in Prometheus exposition format
 */
export function formatPrometheusMetrics() {
  const lines = [];
  
  // Add help and type declarations
  
  // HTTP Requests Total
  lines.push('# HELP mcp_http_requests_total Total number of HTTP requests');
  lines.push('# TYPE mcp_http_requests_total counter');
  for (const [key, count] of metrics.httpRequestsTotal) {
    const [method, path] = key.split(':');
    const normalizedPath = path.replace(/\/[a-f0-9-]{36}/g, '/:id').replace(/\/\d+/g, '/:id');
    lines.push(`mcp_http_requests_total{method="${method}",path="${normalizedPath}"} ${count}`);
  }
  
  // HTTP Errors Total
  lines.push('');
  lines.push('# HELP mcp_http_errors_total Total number of HTTP errors by status code');
  lines.push('# TYPE mcp_http_errors_total counter');
  for (const [statusCode, count] of metrics.httpErrorsTotal) {
    lines.push(`mcp_http_errors_total{status_code="${statusCode}"} ${count}`);
  }
  
  // HTTP Duration
  lines.push('');
  lines.push('# HELP mcp_http_request_duration_seconds HTTP request duration in seconds');
  lines.push('# TYPE mcp_http_request_duration_seconds summary');
  for (const [key, { count, sum }] of metrics.httpDuration) {
    const [method, path] = key.split(':');
    const normalizedPath = path.replace(/\/[a-f0-9-]{36}/g, '/:id').replace(/\/\d+/g, '/:id');
    lines.push(`mcp_http_request_duration_seconds_count{method="${method}",path="${normalizedPath}"} ${count}`);
    lines.push(`mcp_http_request_duration_seconds_sum{method="${method}",path="${normalizedPath}"} ${(sum / 1000).toFixed(3)}`);
  }
  
  // Tool Executions
  lines.push('');
  lines.push('# HELP mcp_tool_executions_total Total number of tool executions');
  lines.push('# TYPE mcp_tool_executions_total counter');
  for (const [tool, count] of metrics.toolExecutionsTotal) {
    lines.push(`mcp_tool_executions_total{tool="${tool}"} ${count}`);
  }
  
  // WebSocket Messages
  lines.push('');
  lines.push('# HELP mcp_websocket_messages_total Total WebSocket messages');
  lines.push('# TYPE mcp_websocket_messages_total counter');
  lines.push(`mcp_websocket_messages_total{direction="sent"} ${metrics.wsMessagesTotal.sent}`);
  lines.push(`mcp_websocket_messages_total{direction="received"} ${metrics.wsMessagesTotal.received}`);
  
  // Active Connections
  lines.push('');
  lines.push('# HELP mcp_active_connections Current number of active connections');
  lines.push('# TYPE mcp_active_connections gauge');
  lines.push(`mcp_active_connections ${metrics.activeConnections}`);
  
  // Server Status
  lines.push('');
  lines.push('# HELP mcp_server_status MCP server status (1=running, 0=stopped)');
  lines.push('# TYPE mcp_server_status gauge');
  
  // Get current server status from registry
  try {
    const servers = registry.getAll();
    for (const server of servers) {
      const status = server.status === 'running' ? 1 : 0;
      lines.push(`mcp_server_status{server="${server.name}"} ${status}`);
    }
  } catch {
    // Use cached metrics if registry unavailable
    for (const [name, status] of metrics.serverStatus) {
      lines.push(`mcp_server_status{server="${name}"} ${status}`);
    }
  }
  
  // Uptime
  lines.push('');
  lines.push('# HELP mcp_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE mcp_uptime_seconds gauge');
  lines.push(`mcp_uptime_seconds ${getUptimeSeconds()}`);
  
  // Process Info
  lines.push('');
  lines.push('# HELP mcp_process_start_time_seconds Unix timestamp of process start');
  lines.push('# TYPE mcp_process_start_time_seconds gauge');
  lines.push(`mcp_process_start_time_seconds ${Math.floor(metrics.startTime / 1000)}`);
  
  // Memory usage (Node.js)
  const memUsage = process.memoryUsage();
  lines.push('');
  lines.push('# HELP mcp_nodejs_heap_used_bytes Node.js heap memory used');
  lines.push('# TYPE mcp_nodejs_heap_used_bytes gauge');
  lines.push(`mcp_nodejs_heap_used_bytes ${memUsage.heapUsed}`);
  
  lines.push('');
  lines.push('# HELP mcp_nodejs_heap_total_bytes Node.js total heap size');
  lines.push('# TYPE mcp_nodejs_heap_total_bytes gauge');
  lines.push(`mcp_nodejs_heap_total_bytes ${memUsage.heapTotal}`);
  
  lines.push('');
  lines.push('# HELP mcp_nodejs_external_bytes Node.js external memory');
  lines.push('# TYPE mcp_nodejs_external_bytes gauge');
  lines.push(`mcp_nodejs_external_bytes ${memUsage.external}`);
  
  lines.push('');
  lines.push('# HELP mcp_nodejs_rss_bytes Node.js resident set size');
  lines.push('# TYPE mcp_nodejs_rss_bytes gauge');
  lines.push(`mcp_nodejs_rss_bytes ${memUsage.rss}`);
  
  // Build info
  lines.push('');
  lines.push('# HELP mcp_build_info Build information');
  lines.push('# TYPE mcp_build_info gauge');
  lines.push(`mcp_build_info{version="1.0.0",nodejs_version="${process.version}"} 1`);
  
  return lines.join('\n');
}

/**
 * Get metrics as JSON (for internal use)
 */
export function getMetricsJson() {
  return {
    httpRequestsTotal: Object.fromEntries(metrics.httpRequestsTotal),
    httpErrorsTotal: Object.fromEntries(metrics.httpErrorsTotal),
    toolExecutionsTotal: Object.fromEntries(metrics.toolExecutionsTotal),
    wsMessagesTotal: metrics.wsMessagesTotal,
    activeConnections: metrics.activeConnections,
    uptimeSeconds: getUptimeSeconds(),
    memory: process.memoryUsage(),
    startTime: new Date(metrics.startTime).toISOString(),
  };
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics() {
  metrics.httpRequestsTotal.clear();
  metrics.httpErrorsTotal.clear();
  metrics.toolExecutionsTotal.clear();
  metrics.httpDuration.clear();
  metrics.wsMessagesTotal = { sent: 0, received: 0 };
  metrics.activeConnections = 0;
  metrics.serverStatus.clear();
  metrics.startTime = Date.now();
  logger.debug('Metrics reset');
}

export default {
  recordHttpRequest,
  recordToolExecution,
  recordWsMessage,
  setActiveConnections,
  updateServerStatus,
  formatPrometheusMetrics,
  getMetricsJson,
  resetMetrics,
};
