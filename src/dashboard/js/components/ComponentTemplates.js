/**
 * BambiSleep™ Church MCP Control Tower
 * Component Templates - Pre-built patterns for agent UI
 * 
 * Templates are factory functions that generate component configurations
 * for common UI patterns like CRUD interfaces, dashboards, and data entry.
 */

// =====================================================
// CRUD TEMPLATES
// =====================================================

/**
 * Generate a CRUD interface for a collection
 * @param {Object} options - CRUD options
 * @returns {Object} Component configuration array
 */
export function crudTemplate(options) {
  const {
    entityName,
    entityPlural,
    columns,
    fields,
    actions = ['create', 'read', 'update', 'delete'],
  } = options;

  const components = [];

  // Header card with actions
  components.push({
    type: 'card',
    id: `${entityName}-header`,
    title: `${entityPlural} Management`,
    icon: '📋',
    variant: 'info',
    content: `Manage your ${entityPlural.toLowerCase()} with create, read, update, and delete operations.`,
    actions: actions.includes('create') ? [
      { label: `➕ Add ${entityName}`, action: `create-${entityName}` }
    ] : [],
  });

  // Data table
  if (actions.includes('read')) {
    components.push({
      type: 'table',
      id: `${entityName}-table`,
      title: `All ${entityPlural}`,
      columns: columns.map(col => ({
        key: col.key || col.name,
        label: col.label || col.name,
        sortable: col.sortable !== false,
        format: col.format,
      })),
      rows: [], // Populated by data
      pagination: { page: 1, pageSize: 10, total: 0 },
      rowActions: [
        ...(actions.includes('update') ? [{ label: '✏️', action: `edit-${entityName}` }] : []),
        ...(actions.includes('delete') ? [{ label: '🗑️', action: `delete-${entityName}`, variant: 'danger' }] : []),
      ],
    });
  }

  // Create/Edit form (hidden by default)
  if (actions.includes('create') || actions.includes('update')) {
    components.push({
      type: 'form',
      id: `${entityName}-form`,
      title: `${entityName} Details`,
      fields: fields.map(field => ({
        name: field.name,
        label: field.label || field.name,
        type: field.type || 'text',
        placeholder: field.placeholder || `Enter ${field.label || field.name}`,
        required: field.required !== false,
        validation: field.validation || {},
        options: field.options,
      })),
      submitAction: `save-${entityName}`,
      submitLabel: 'Save',
      cancelAction: `cancel-${entityName}`,
    });
  }

  return components;
}

// =====================================================
// SEARCH & FILTER TEMPLATES
// =====================================================

/**
 * Generate a search/filter panel
 * @param {Object} options - Search options
 * @returns {Object} Component configuration
 */
export function searchFilterTemplate(options) {
  const {
    id = 'search-filter',
    placeholder = 'Search...',
    filters = [],
    onSearch,
    onFilter,
  } = options;

  const fields = [
    {
      name: 'query',
      label: 'Search',
      type: 'text',
      placeholder,
    },
    ...filters.map(filter => ({
      name: filter.name,
      label: filter.label,
      type: 'select',
      options: filter.options,
      placeholder: filter.placeholder || `Select ${filter.label}`,
    })),
  ];

  return {
    type: 'form',
    id,
    fields,
    submitAction: onSearch || 'search',
    submitLabel: '🔍 Search',
    inline: true,
  };
}

// =====================================================
// DASHBOARD TEMPLATES
// =====================================================

/**
 * Generate a stats dashboard layout
 * @param {Object} options - Dashboard options
 * @returns {Array} Component configurations
 */
export function dashboardTemplate(options) {
  const {
    title = 'Dashboard',
    stats = [],
    charts = [],
    recentActivity = [],
  } = options;

  const components = [];

  // Stats cards row
  stats.forEach((stat, idx) => {
    components.push({
      type: 'card',
      id: `stat-${idx}`,
      title: stat.label,
      icon: stat.icon,
      variant: stat.variant || 'default',
      content: `<div class="stat-value">${stat.value}</div>
        ${stat.change ? `<div class="stat-change ${stat.change > 0 ? 'positive' : 'negative'}">${stat.change > 0 ? '+' : ''}${stat.change}%</div>` : ''}`,
    });
  });

  // Charts placeholder
  charts.forEach((chart, idx) => {
    components.push({
      type: 'card',
      id: `chart-${idx}`,
      title: chart.title,
      icon: chart.icon || '📊',
      content: `<div class="chart-placeholder" data-chart-type="${chart.type}" data-chart-data='${JSON.stringify(chart.data)}'></div>`,
    });
  });

  // Activity feed
  if (recentActivity.length > 0) {
    components.push({
      type: 'list',
      id: 'recent-activity',
      title: 'Recent Activity',
      items: recentActivity.map(item => ({
        id: item.id,
        label: item.label,
        badge: item.badge,
        icon: item.icon,
        secondary: item.timestamp,
      })),
      ordered: false,
    });
  }

  return components;
}

// =====================================================
// FORM TEMPLATES
// =====================================================

/**
 * Generate a login/signup form
 * @param {Object} options - Auth form options
 * @returns {Object} Form configuration
 */
export function authFormTemplate(options) {
  const {
    type = 'login', // 'login', 'signup', 'forgot-password'
    onSubmit,
    onCancel,
  } = options;

  const baseFields = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'your@email.com',
      required: true,
      validation: { pattern: '[^@]+@[^@]+\\.[^@]+' },
    },
  ];

  const loginFields = [
    ...baseFields,
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      validation: { minLength: 8 },
    },
  ];

  const signupFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    ...loginFields,
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      required: true,
    },
  ];

  const forgotFields = baseFields;

  const fieldMap = {
    login: loginFields,
    signup: signupFields,
    'forgot-password': forgotFields,
  };

  const titleMap = {
    login: 'Sign In',
    signup: 'Create Account',
    'forgot-password': 'Reset Password',
  };

  const submitMap = {
    login: 'Sign In',
    signup: 'Create Account',
    'forgot-password': 'Send Reset Link',
  };

  return {
    type: 'form',
    id: `auth-${type}`,
    title: titleMap[type],
    fields: fieldMap[type],
    submitAction: onSubmit || `auth-${type}`,
    submitLabel: submitMap[type],
    cancelAction: onCancel,
  };
}

/**
 * Generate a settings/preferences form
 * @param {Object} options - Settings options
 * @returns {Object} Form configuration
 */
export function settingsFormTemplate(options) {
  const {
    sections = [],
    onSave,
    onCancel,
  } = options;

  const fields = [];

  sections.forEach(section => {
    // Section header (as hidden divider)
    fields.push({
      name: `section-${section.name}`,
      label: section.label,
      type: 'section',
    });

    // Section fields
    section.fields.forEach(field => {
      fields.push({
        name: `${section.name}.${field.name}`,
        label: field.label,
        type: field.type || 'text',
        placeholder: field.placeholder,
        value: field.value,
        options: field.options,
      });
    });
  });

  return {
    type: 'form',
    id: 'settings-form',
    title: 'Settings',
    fields,
    submitAction: onSave || 'save-settings',
    submitLabel: '💾 Save Changes',
    cancelAction: onCancel,
  };
}

// =====================================================
// WIZARD TEMPLATES
// =====================================================

/**
 * Generate a setup wizard
 * @param {Object} options - Wizard options
 * @returns {Object} Wizard configuration
 */
export function setupWizardTemplate(options) {
  const {
    id = 'setup-wizard',
    title = 'Setup Wizard',
    steps = [],
    onComplete,
    onCancel,
  } = options;

  return {
    type: 'wizard',
    id,
    title,
    steps: steps.map((step, idx) => ({
      title: step.title,
      description: step.description,
      fields: step.fields || [],
      component: step.component,
      nextLabel: step.nextLabel || (idx === steps.length - 1 ? 'Finish' : 'Next'),
      completeLabel: step.completeLabel,
    })),
    showProgress: true,
    canGoBack: true,
    onComplete: onComplete || 'wizard-complete',
    onCancel: onCancel || 'wizard-cancel',
  };
}

/**
 * Generate an onboarding wizard
 * @param {Object} options - Onboarding options
 * @returns {Object} Wizard configuration
 */
export function onboardingWizardTemplate(options) {
  const {
    userName = 'there',
    features = [],
    onComplete,
  } = options;

  const steps = [
    {
      title: 'Welcome',
      description: `Hey ${userName}! Let's get you set up with the basics.`,
      component: {
        type: 'card',
        icon: '👋',
        title: 'Welcome Aboard!',
        content: 'We\'re excited to have you. This quick tour will help you get started.',
        variant: 'success',
      },
    },
    ...features.map((feature, idx) => ({
      title: feature.title,
      description: feature.description,
      component: feature.component || {
        type: 'card',
        icon: feature.icon || '✨',
        title: feature.title,
        content: feature.content,
      },
    })),
    {
      title: 'All Set!',
      description: 'You\'re ready to go!',
      component: {
        type: 'card',
        icon: '🎉',
        title: 'Setup Complete!',
        content: 'You\'re all set to start using the application. Enjoy!',
        variant: 'success',
      },
      completeLabel: 'Get Started',
    },
  ];

  return setupWizardTemplate({
    id: 'onboarding-wizard',
    title: 'Getting Started',
    steps,
    onComplete: onComplete || 'onboarding-complete',
  });
}

// =====================================================
// CONFIRMATION TEMPLATES
// =====================================================

/**
 * Generate a confirmation dialog
 * @param {Object} options - Confirmation options
 * @returns {Object} Alert/Card configuration
 */
export function confirmationTemplate(options) {
  const {
    id = 'confirmation',
    title = 'Confirm Action',
    message,
    variant = 'warning',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
  } = options;

  return {
    type: 'card',
    id,
    icon: variant === 'warning' ? '⚠️' : variant === 'error' ? '❌' : 'ℹ️',
    title,
    variant,
    content: message,
    actions: [
      { label: cancelLabel, action: onCancel || 'cancel', variant: 'secondary' },
      { label: confirmLabel, action: onConfirm || 'confirm', variant: 'primary' },
    ],
  };
}

/**
 * Generate a delete confirmation
 * @param {Object} options - Delete confirmation options
 * @returns {Object} Card configuration
 */
export function deleteConfirmationTemplate(options) {
  const {
    entityName,
    entityId,
    entityLabel,
    onConfirm,
    onCancel,
  } = options;

  return confirmationTemplate({
    id: `delete-${entityName}-${entityId}`,
    title: `Delete ${entityName}?`,
    message: `Are you sure you want to delete "${entityLabel}"? This action cannot be undone.`,
    variant: 'error',
    confirmLabel: '🗑️ Delete',
    onConfirm: onConfirm || `confirm-delete-${entityName}`,
    onCancel: onCancel || `cancel-delete-${entityName}`,
  });
}

// =====================================================
// NOTIFICATION TEMPLATES
// =====================================================

/**
 * Generate a notification/toast component
 * @param {Object} options - Notification options
 * @returns {Object} Alert configuration
 */
export function notificationTemplate(options) {
  const {
    type = 'info',
    title,
    message,
    dismissible = true,
    actions = [],
  } = options;

  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return {
    type: 'alert',
    id: `notification-${Date.now()}`,
    variant: type,
    title,
    message,
    icon: iconMap[type],
    dismissible,
    actions,
  };
}

// =====================================================
// TEMPLATE REGISTRY
// =====================================================

/**
 * Template registry for easy lookup
 */
export const TEMPLATES = {
  crud: crudTemplate,
  searchFilter: searchFilterTemplate,
  dashboard: dashboardTemplate,
  authForm: authFormTemplate,
  settingsForm: settingsFormTemplate,
  setupWizard: setupWizardTemplate,
  onboardingWizard: onboardingWizardTemplate,
  confirmation: confirmationTemplate,
  deleteConfirmation: deleteConfirmationTemplate,
  notification: notificationTemplate,
};

/**
 * Generate components from template
 * @param {string} templateName - Template name
 * @param {Object} options - Template options
 * @returns {Object|Array} Component configuration(s)
 */
export function generateFromTemplate(templateName, options) {
  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Unknown template: ${templateName}`);
  }
  return template(options);
}

export default {
  TEMPLATES,
  generateFromTemplate,
  crudTemplate,
  searchFilterTemplate,
  dashboardTemplate,
  authFormTemplate,
  settingsFormTemplate,
  setupWizardTemplate,
  onboardingWizardTemplate,
  confirmationTemplate,
  deleteConfirmationTemplate,
  notificationTemplate,
};
