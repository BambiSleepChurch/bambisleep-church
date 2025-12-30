/**
 * BambiSleep™ Church MCP Control Tower
 * Toast Component - Notification toasts
 */

import { TOAST_CONFIG, TOAST_ICONS } from '../config.js';

/**
 * Show a toast notification
 * @param {'success' | 'error' | 'warning' | 'info'} type - Toast type
 * @param {string} title - Toast title
 * @param {string} [message] - Optional message
 * @param {number} [duration] - Duration in ms
 */
export function showToast(type, title, message = '', duration = TOAST_CONFIG.defaultDuration) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">×</button>
  `;
  
  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));
  
  container.appendChild(toast);
  
  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
  
  return toast;
}

/**
 * Dismiss a toast with animation
 */
function dismissToast(toast) {
  if (!toast || toast.classList.contains('toast-hiding')) return;
  
  toast.classList.add('toast-hiding');
  setTimeout(() => {
    toast.remove();
  }, TOAST_CONFIG.animationDuration);
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
  const container = document.getElementById('toast-container');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render toast container (called once on init)
 */
export function renderToastContainer() {
  if (document.getElementById('toast-container')) return;
  
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
}
