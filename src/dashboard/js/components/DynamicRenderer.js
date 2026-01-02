/**
 * BambiSleep™ Church MCP Control Tower
 * DynamicRenderer - Runtime component factory for agent-generated UI
 * 
 * Renders components dynamically based on render_* tool calls from agents.
 * Supports: card, table, form, alert, progress, list, code
 */

/**
 * Component registry - maps render types to render functions
 */
const COMPONENT_RENDERERS = {
  card: renderCard,
  table: renderTable,
  form: renderForm,
  alert: renderAlert,
  progress: renderProgress,
  list: renderList,
  code: renderCode,
  wizard: renderWizard,
};

/**
 * Active component state tracking
 * @type {Map<string, {type: string, element: HTMLElement, data: Object}>}
 */
const activeComponents = new Map();

/**
 * Event handlers registry for component actions
 * @type {Map<string, Function>}
 */
const actionHandlers = new Map();

/**
 * Register an action handler
 * @param {string} action - Action identifier
 * @param {Function} handler - Handler function
 */
export function registerActionHandler(action, handler) {
  actionHandlers.set(action, handler);
}

/**
 * Unregister an action handler
 * @param {string} action - Action identifier
 */
export function unregisterActionHandler(action) {
  actionHandlers.delete(action);
}

/**
 * Trigger an action handler
 * @param {string} action - Action identifier
 * @param {Object} data - Action data
 */
function triggerAction(action, data = {}) {
  const handler = actionHandlers.get(action);
  if (handler) {
    handler(data);
  } else {
    // Dispatch custom event for unregistered actions
    window.dispatchEvent(new CustomEvent('agent:action', {
      detail: { action, data }
    }));
  }
}

/**
 * Render a component based on type and props
 * @param {string} type - Component type
 * @param {Object} props - Component properties
 * @param {HTMLElement} container - Target container element
 * @returns {HTMLElement|null} Rendered element
 */
export function renderComponent(type, props, container) {
  const renderer = COMPONENT_RENDERERS[type];
  if (!renderer) {
    console.warn(`Unknown component type: ${type}`);
    return null;
  }

  const { id } = props;
  
  // Check for existing component with same ID
  if (id && activeComponents.has(id)) {
    const existing = activeComponents.get(id);
    existing.element.remove();
    activeComponents.delete(id);
  }

  // Render new component
  const html = renderer(props);
  const wrapper = document.createElement('div');
  wrapper.className = 'dynamic-component';
  wrapper.dataset.componentId = id || crypto.randomUUID();
  wrapper.dataset.componentType = type;
  wrapper.innerHTML = html;

  // Add to container
  container.appendChild(wrapper);

  // Track active component
  activeComponents.set(wrapper.dataset.componentId, {
    type,
    element: wrapper,
    data: props,
  });

  // Attach event listeners
  attachEventListeners(wrapper, props);

  return wrapper;
}

/**
 * Update an existing component
 * @param {string} id - Component ID
 * @param {Object} props - Updated properties
 * @returns {boolean} Success
 */
export function updateComponent(id, props) {
  const component = activeComponents.get(id);
  if (!component) return false;

  const renderer = COMPONENT_RENDERERS[component.type];
  if (!renderer) return false;

  const mergedProps = { ...component.data, ...props, id };
  component.element.innerHTML = renderer(mergedProps);
  component.data = mergedProps;

  attachEventListeners(component.element, mergedProps);
  return true;
}

/**
 * Remove a component
 * @param {string} id - Component ID
 * @returns {boolean} Success
 */
export function removeComponent(id) {
  const component = activeComponents.get(id);
  if (!component) return false;

  component.element.remove();
  activeComponents.delete(id);
  return true;
}

/**
 * Clear components by type or all
 * @param {string} [type] - Component type to clear (omit for all)
 */
export function clearComponents(type) {
  for (const [id, component] of activeComponents) {
    if (!type || type === 'all' || component.type === type) {
      component.element.remove();
      activeComponents.delete(id);
    }
  }
}

/**
 * Get active component by ID
 * @param {string} id - Component ID
 * @returns {Object|null} Component state
 */
export function getComponent(id) {
  return activeComponents.get(id) || null;
}

/**
 * Get all active components
 * @returns {Array<{id: string, type: string, data: Object}>}
 */
export function getAllComponents() {
  return Array.from(activeComponents.entries()).map(([id, comp]) => ({
    id,
    type: comp.type,
    data: comp.data,
  }));
}

// =====================================================
// COMPONENT RENDERERS
// =====================================================

/**
 * Render glass card component
 */
function renderCard(props) {
  const {
    title,
    content,
    icon,
    variant = 'default',
    actions = [],
    collapsible = false,
    collapsed = false,
  } = props;

  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  const collapsedClass = collapsed ? 'collapsed' : '';

  return `
    <div class="glass-card dynamic-card ${variantClass} ${collapsedClass}">
      ${title ? `
        <div class="card-header" ${collapsible ? 'data-collapsible="true"' : ''}>
          ${icon ? `<span class="card-icon">${icon}</span>` : ''}
          <h3 class="card-title">${escapeHtml(title)}</h3>
          ${collapsible ? '<span class="collapse-toggle">▼</span>' : ''}
        </div>
      ` : ''}
      <div class="card-body">
        ${content}
      </div>
      ${actions.length > 0 ? `
        <div class="card-actions">
          ${actions.map(action => `
            <button class="btn btn-sm" data-action="${escapeHtml(action.action)}">
              ${action.icon ? `<span class="btn-icon">${action.icon}</span>` : ''}
              ${escapeHtml(action.label)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render data table component
 */
function renderTable(props) {
  const {
    title,
    columns,
    rows,
    pagination,
    rowActions = [],
  } = props;

  return `
    <div class="glass-card dynamic-table">
      ${title ? `<h3 class="table-title">${escapeHtml(title)}</h3>` : ''}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              ${columns.map(col => `
                <th ${col.width ? `style="width: ${col.width}"` : ''} 
                    ${col.sortable ? 'data-sortable="true"' : ''}>
                  ${escapeHtml(col.label)}
                  ${col.sortable ? '<span class="sort-icon">⇅</span>' : ''}
                </th>
              `).join('')}
              ${rowActions.length > 0 ? '<th class="actions-col">Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, idx) => `
              <tr data-row-index="${idx}">
                ${columns.map(col => `
                  <td>${formatCellValue(row[col.key], col.format)}</td>
                `).join('')}
                ${rowActions.length > 0 ? `
                  <td class="row-actions">
                    ${rowActions.map(action => `
                      <button class="btn btn-xs" data-action="${escapeHtml(action.action)}" data-row="${idx}">
                        ${action.icon || action.label}
                      </button>
                    `).join('')}
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${pagination ? `
        <div class="table-pagination">
          <span>Page ${pagination.page} of ${Math.ceil(pagination.total / pagination.pageSize)}</span>
          <div class="pagination-controls">
            <button class="btn btn-sm" data-action="page-prev" ${pagination.page <= 1 ? 'disabled' : ''}>←</button>
            <button class="btn btn-sm" data-action="page-next" ${pagination.page >= Math.ceil(pagination.total / pagination.pageSize) ? 'disabled' : ''}>→</button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render form component
 */
function renderForm(props) {
  const {
    title,
    fields,
    submitAction,
    submitLabel = 'Submit',
    cancelAction,
  } = props;

  return `
    <div class="glass-card dynamic-form">
      ${title ? `<h3 class="form-title">${escapeHtml(title)}</h3>` : ''}
      <form data-submit-action="${submitAction || ''}">
        ${fields.map(field => renderFormField(field)).join('')}
        <div class="form-actions">
          ${cancelAction ? `
            <button type="button" class="btn btn-secondary" data-action="${escapeHtml(cancelAction)}">
              Cancel
            </button>
          ` : ''}
          <button type="submit" class="btn btn-primary">
            ${escapeHtml(submitLabel)}
          </button>
        </div>
      </form>
    </div>
  `;
}

/**
 * Render individual form field
 */
function renderFormField(field) {
  const {
    name,
    label,
    type,
    placeholder = '',
    required = false,
    disabled = false,
    value = '',
    options = [],
    validation = {},
  } = field;

  const requiredAttr = required ? 'required' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const patternAttr = validation.pattern ? `pattern="${validation.pattern}"` : '';
  
  let input = '';
  
  switch (type) {
    case 'textarea':
      input = `<textarea name="${name}" placeholder="${escapeHtml(placeholder)}" 
        ${requiredAttr} ${disabledAttr} ${patternAttr}
        ${validation.minLength ? `minlength="${validation.minLength}"` : ''}
        ${validation.maxLength ? `maxlength="${validation.maxLength}"` : ''}
      >${escapeHtml(value)}</textarea>`;
      break;
      
    case 'select':
      input = `
        <select name="${name}" ${requiredAttr} ${disabledAttr}>
          <option value="">${placeholder || 'Select...'}</option>
          ${options.map(opt => `
            <option value="${escapeHtml(opt.value)}" ${opt.value === value ? 'selected' : ''}>
              ${escapeHtml(opt.label)}
            </option>
          `).join('')}
        </select>
      `;
      break;
      
    case 'radio':
      input = `
        <div class="radio-group">
          ${options.map(opt => `
            <label class="radio-label">
              <input type="radio" name="${name}" value="${escapeHtml(opt.value)}" 
                ${opt.value === value ? 'checked' : ''} ${requiredAttr} ${disabledAttr}>
              ${escapeHtml(opt.label)}
            </label>
          `).join('')}
        </div>
      `;
      break;
      
    case 'checkbox':
      input = `
        <label class="checkbox-label">
          <input type="checkbox" name="${name}" ${value ? 'checked' : ''} ${disabledAttr}>
          ${label ? '' : placeholder}
        </label>
      `;
      break;
      
    case 'hidden':
      return `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`;
      
    default:
      input = `<input type="${type}" name="${name}" value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}" ${requiredAttr} ${disabledAttr} ${patternAttr}
        ${validation.min !== undefined ? `min="${validation.min}"` : ''}
        ${validation.max !== undefined ? `max="${validation.max}"` : ''}
        ${validation.minLength ? `minlength="${validation.minLength}"` : ''}
        ${validation.maxLength ? `maxlength="${validation.maxLength}"` : ''}
      >`;
  }

  return `
    <div class="form-field">
      ${label && type !== 'checkbox' ? `<label for="${name}">${escapeHtml(label)}${required ? ' *' : ''}</label>` : ''}
      ${input}
      ${validation.message ? `<span class="field-error">${escapeHtml(validation.message)}</span>` : ''}
    </div>
  `;
}

/**
 * Render alert banner component
 */
function renderAlert(props) {
  const {
    id,
    message,
    type = 'info',
    title,
    dismissible = true,
    actions = [],
  } = props;

  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return `
    <div class="dynamic-alert alert-${type}">
      <span class="alert-icon">${iconMap[type]}</span>
      <div class="alert-content">
        ${title ? `<strong class="alert-title">${escapeHtml(title)}</strong>` : ''}
        <p class="alert-message">${escapeHtml(message)}</p>
        ${actions.length > 0 ? `
          <div class="alert-actions">
            ${actions.map(action => `
              <button class="btn btn-sm" data-action="${escapeHtml(action.action)}">
                ${escapeHtml(action.label)}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${dismissible ? `<button class="alert-dismiss" data-action="dismiss" data-target="${id}">×</button>` : ''}
    </div>
  `;
}

/**
 * Render progress indicator component
 */
function renderProgress(props) {
  const {
    label,
    value = 0,
    max = 100,
    variant = 'bar',
    steps = [],
    showPercentage = true,
    animated = true,
  } = props;

  const percentage = Math.round((value / max) * 100);
  const animatedClass = animated ? 'animated' : '';

  if (variant === 'steps' && steps.length > 0) {
    return `
      <div class="dynamic-progress progress-steps">
        ${label ? `<div class="progress-label">${escapeHtml(label)}</div>` : ''}
        <div class="steps-container">
          ${steps.map((step, idx) => `
            <div class="step step-${step.status}">
              <div class="step-indicator">${idx + 1}</div>
              <div class="step-label">${escapeHtml(step.label)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;
    return `
      <div class="dynamic-progress progress-circular ${animatedClass}">
        <svg viewBox="0 0 100 100">
          <circle class="progress-bg" cx="50" cy="50" r="45"/>
          <circle class="progress-fill" cx="50" cy="50" r="45"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="progress-text">
          ${showPercentage ? `${percentage}%` : ''}
          ${label ? `<span class="progress-label">${escapeHtml(label)}</span>` : ''}
        </div>
      </div>
    `;
  }

  // Default bar variant
  return `
    <div class="dynamic-progress progress-bar-container ${animatedClass}">
      ${label ? `<div class="progress-header">
        <span class="progress-label">${escapeHtml(label)}</span>
        ${showPercentage ? `<span class="progress-percentage">${percentage}%</span>` : ''}
      </div>` : ''}
      <div class="progress-track">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render list component
 */
function renderList(props) {
  const {
    title,
    items,
    variant = 'default',
    selectable = false,
    multiSelect = false,
    emptyMessage = 'No items',
  } = props;

  if (items.length === 0) {
    return `
      <div class="glass-card dynamic-list list-${variant}">
        ${title ? `<h3 class="list-title">${escapeHtml(title)}</h3>` : ''}
        <div class="list-empty">${escapeHtml(emptyMessage)}</div>
      </div>
    `;
  }

  const selectableAttr = selectable ? `data-selectable="${multiSelect ? 'multi' : 'single'}"` : '';

  return `
    <div class="glass-card dynamic-list list-${variant}" ${selectableAttr}>
      ${title ? `<h3 class="list-title">${escapeHtml(title)}</h3>` : ''}
      <ul class="list-items">
        ${items.map(item => `
          <li class="list-item" data-item-id="${escapeHtml(item.id)}" 
              ${item.action ? `data-action="${escapeHtml(item.action)}"` : ''}>
            ${item.avatar ? `<img class="item-avatar" src="${escapeHtml(item.avatar)}" alt="">` : ''}
            ${item.icon ? `<span class="item-icon">${item.icon}</span>` : ''}
            <div class="item-content">
              <span class="item-primary">${escapeHtml(item.primary)}</span>
              ${item.secondary ? `<span class="item-secondary">${escapeHtml(item.secondary)}</span>` : ''}
            </div>
            ${item.badge ? `
              <span class="item-badge ${item.badgeVariant ? `badge-${item.badgeVariant}` : ''}">
                ${escapeHtml(item.badge)}
              </span>
            ` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render code block component
 */
function renderCode(props) {
  const {
    title,
    code,
    language = 'plaintext',
    lineNumbers = true,
    highlightLines = [],
    copyable = true,
    editable = false,
    onChangeAction,
  } = props;

  const lines = code.split('\n');
  const editableAttr = editable ? 'contenteditable="true"' : '';
  const changeAction = onChangeAction ? `data-change-action="${escapeHtml(onChangeAction)}"` : '';

  return `
    <div class="glass-card dynamic-code">
      <div class="code-header">
        ${title ? `<span class="code-title">${escapeHtml(title)}</span>` : ''}
        <span class="code-language">${escapeHtml(language)}</span>
        ${copyable ? `<button class="btn btn-xs code-copy" data-action="copy-code">📋 Copy</button>` : ''}
      </div>
      <div class="code-container">
        ${lineNumbers ? `
          <div class="line-numbers">
            ${lines.map((_, idx) => `
              <span class="line-number ${highlightLines.includes(idx + 1) ? 'highlighted' : ''}">${idx + 1}</span>
            `).join('')}
          </div>
        ` : ''}
        <pre class="code-content" ${editableAttr} ${changeAction}><code class="language-${language}">${escapeHtml(code)}</code></pre>
      </div>
    </div>
  `;
}

/**
 * Render interactive wizard component
 * Multi-step flow with conditional branching
 */
function renderWizard(props) {
  const {
    id,
    title,
    steps = [],
    currentStep = 0,
    showProgress = true,
    canGoBack = true,
    onComplete,
    onCancel,
  } = props;

  const wizardId = id || crypto.randomUUID();
  const step = steps[currentStep] || {};
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Calculate progress percentage
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return `
    <div class="glass-card dynamic-wizard" data-wizard-id="${wizardId}" data-current-step="${currentStep}">
      ${title ? `<h3 class="wizard-title">${escapeHtml(title)}</h3>` : ''}
      
      ${showProgress ? `
        <div class="wizard-progress">
          <div class="wizard-steps">
            ${steps.map((s, idx) => `
              <div class="wizard-step ${idx < currentStep ? 'completed' : ''} ${idx === currentStep ? 'active' : ''} ${idx > currentStep ? 'pending' : ''}">
                <div class="step-indicator">
                  ${idx < currentStep ? '✓' : idx + 1}
                </div>
                <span class="step-label">${escapeHtml(s.title || `Step ${idx + 1}`)}</span>
              </div>
            `).join('')}
          </div>
          <div class="wizard-progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="wizard-progress-text">${currentStep + 1} of ${steps.length} (${progressPercent}%)</div>
        </div>
      ` : ''}
      
      <div class="wizard-content">
        ${step.description ? `<p class="wizard-description">${escapeHtml(step.description)}</p>` : ''}
        
        ${step.component ? renderWizardComponent(step.component) : ''}
        
        ${step.fields && step.fields.length > 0 ? `
          <form class="wizard-form" data-step="${currentStep}">
            ${step.fields.map(field => renderFormField(field)).join('')}
          </form>
        ` : ''}
      </div>
      
      <div class="wizard-actions">
        ${onCancel ? `
          <button type="button" class="btn btn-secondary" data-action="wizard-cancel" data-wizard-id="${wizardId}">
            Cancel
          </button>
        ` : ''}
        
        <div class="wizard-nav">
          ${canGoBack && !isFirstStep ? `
            <button type="button" class="btn btn-outline" data-action="wizard-back" data-wizard-id="${wizardId}">
              ← Back
            </button>
          ` : ''}
          
          ${isLastStep ? `
            <button type="button" class="btn btn-primary" data-action="wizard-complete" data-wizard-id="${wizardId}">
              ${step.completeLabel || 'Complete'} ✓
            </button>
          ` : `
            <button type="button" class="btn btn-primary" data-action="wizard-next" data-wizard-id="${wizardId}">
              ${step.nextLabel || 'Next'} →
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render component inside wizard step
 */
function renderWizardComponent(component) {
  const { type, ...props } = component;
  const renderer = COMPONENT_RENDERERS[type];
  
  if (!renderer || type === 'wizard') {
    return `<div class="wizard-component-error">Unknown component: ${escapeHtml(type)}</div>`;
  }
  
  // Wrap in a div without the glass-card class to avoid double styling
  return `<div class="wizard-embedded-component">${renderer(props)}</div>`;
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Escape HTML entities
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format cell value based on format type
 * @param {*} value - Cell value
 * @param {string} format - Format type
 * @returns {string} Formatted HTML
 */
function formatCellValue(value, format) {
  if (value === null || value === undefined) return '—';
  
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : escapeHtml(value);
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'badge':
      return `<span class="badge">${escapeHtml(value)}</span>`;
    case 'link':
      return `<a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>`;
    case 'code':
      return `<code>${escapeHtml(value)}</code>`;
    default:
      return escapeHtml(value);
  }
}

/**
 * Attach event listeners to rendered component
 * @param {HTMLElement} element - Component element
 * @param {Object} props - Component props
 */
function attachEventListeners(element, props) {
  // Action buttons
  element.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      const row = e.currentTarget.dataset.row;
      const target = e.currentTarget.dataset.target;
      
      if (action === 'dismiss' && target) {
        removeComponent(target);
        return;
      }
      
      if (action === 'copy-code') {
        const code = element.querySelector('code')?.textContent;
        if (code) {
          navigator.clipboard.writeText(code);
          e.currentTarget.textContent = '✓ Copied';
          setTimeout(() => { e.currentTarget.textContent = '📋 Copy'; }, 2000);
        }
        return;
      }

      triggerAction(action, { row: row ? parseInt(row) : undefined, componentId: props.id });
    });
  });

  // Form submission
  element.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const action = form.dataset.submitAction;
      if (action) {
        triggerAction(action, { formData: data, componentId: props.id });
      }
    });
  });

  // Collapsible cards
  element.querySelectorAll('[data-collapsible="true"]').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.dynamic-card')?.classList.toggle('collapsed');
    });
  });

  // Selectable list items
  const list = element.querySelector('[data-selectable]');
  if (list) {
    const selectMode = list.dataset.selectable;
    list.querySelectorAll('.list-item').forEach(item => {
      item.addEventListener('click', () => {
        if (selectMode === 'single') {
          list.querySelectorAll('.list-item').forEach(i => i.classList.remove('selected'));
        }
        item.classList.toggle('selected');
        
        const selectedIds = Array.from(list.querySelectorAll('.list-item.selected'))
          .map(i => i.dataset.itemId);
        triggerAction('list-selection', { selectedIds, componentId: props.id });
      });
    });
  }

  // Sortable table columns
  element.querySelectorAll('[data-sortable="true"]').forEach(th => {
    th.addEventListener('click', () => {
      const key = props.columns?.[th.cellIndex]?.key;
      const currentOrder = th.dataset.sortOrder || 'none';
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      
      // Reset other columns
      th.closest('tr')?.querySelectorAll('th').forEach(h => {
        h.dataset.sortOrder = 'none';
        h.querySelector('.sort-icon')?.classList.remove('asc', 'desc');
      });
      
      th.dataset.sortOrder = newOrder;
      th.querySelector('.sort-icon')?.classList.add(newOrder);
      
      triggerAction('table-sort', { column: key, order: newOrder, componentId: props.id });
    });
  });

  // Wizard navigation
  element.querySelectorAll('[data-action^="wizard-"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      const wizardId = e.currentTarget.dataset.wizardId;
      const wizard = element.querySelector(`[data-wizard-id="${wizardId}"]`);
      
      if (!wizard) return;
      
      const currentStep = parseInt(wizard.dataset.currentStep) || 0;
      
      // Collect form data from current step if present
      const stepForm = wizard.querySelector('.wizard-form');
      let stepData = {};
      if (stepForm) {
        stepData = Object.fromEntries(new FormData(stepForm).entries());
      }
      
      switch (action) {
        case 'wizard-next':
          triggerAction('wizard-next', { 
            wizardId, 
            currentStep, 
            stepData, 
            componentId: props.id 
          });
          break;
          
        case 'wizard-back':
          triggerAction('wizard-back', { 
            wizardId, 
            currentStep, 
            componentId: props.id 
          });
          break;
          
        case 'wizard-complete':
          triggerAction('wizard-complete', { 
            wizardId, 
            stepData, 
            componentId: props.id 
          });
          break;
          
        case 'wizard-cancel':
          triggerAction('wizard-cancel', { 
            wizardId, 
            componentId: props.id 
          });
          break;
      }
    });
  });
}

/**
 * Process WebSocket render command
 * @param {Object} command - Render command from agent
 * @param {HTMLElement} container - Target container
 */
export function processRenderCommand(command, container) {
  const { type, ...props } = command;
  
  if (type === 'clear') {
    clearComponents(props.type || props.id);
    return;
  }

  if (type === 'update' && props.id) {
    updateComponent(props.id, props);
    return;
  }

  renderComponent(type, props, container);
}

export default {
  renderComponent,
  updateComponent,
  removeComponent,
  clearComponents,
  getComponent,
  getAllComponents,
  registerActionHandler,
  unregisterActionHandler,
  processRenderCommand,
};
