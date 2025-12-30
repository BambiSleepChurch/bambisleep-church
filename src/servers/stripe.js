/**
 * BambiSleep™ Church MCP Control Tower
 * Stripe MCP Server Wrapper - Payment Operations
 * Reference: docs/STRIPE_MCP_REFERENCE.md
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('stripe');

const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Stripe API client
 */
class StripeClient {
  constructor(secretKey = process.env.STRIPE_SECRET_KEY) {
    this.secretKey = secretKey;
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (secretKey) {
      this.headers.Authorization = `Bearer ${secretKey}`;
    }
  }

  /**
   * Make Stripe API request
   */
  async request(endpoint, options = {}) {
    const url = `${STRIPE_API}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Stripe API error: ${response.status}`);
    }

    return data;
  }

  /**
   * Encode object to form data
   */
  encodeForm(obj, prefix = '') {
    const pairs = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          pairs.push(this.encodeForm(value, fullKey));
        } else {
          pairs.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
        }
      }
    }
    return pairs.join('&');
  }

  // ============ CUSTOMERS ============

  async createCustomer(email, name, metadata = {}) {
    return this.request('/customers', {
      method: 'POST',
      body: this.encodeForm({ email, name, metadata }),
    });
  }

  async getCustomer(customerId) {
    return this.request(`/customers/${customerId}`);
  }

  async listCustomers(options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 10,
    });
    if (options.email) params.set('email', options.email);
    return this.request(`/customers?${params}`);
  }

  async updateCustomer(customerId, updates) {
    return this.request(`/customers/${customerId}`, {
      method: 'POST',
      body: this.encodeForm(updates),
    });
  }

  async deleteCustomer(customerId) {
    return this.request(`/customers/${customerId}`, { method: 'DELETE' });
  }

  // ============ PRODUCTS & PRICES ============

  async createProduct(name, description, metadata = {}) {
    return this.request('/products', {
      method: 'POST',
      body: this.encodeForm({ name, description, metadata }),
    });
  }

  async listProducts(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    return this.request(`/products?${params}`);
  }

  async createPrice(productId, unitAmount, currency = 'usd', recurring = null) {
    const data = { product: productId, unit_amount: unitAmount, currency };
    if (recurring) data.recurring = recurring;
    return this.request('/prices', {
      method: 'POST',
      body: this.encodeForm(data),
    });
  }

  async listPrices(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    if (options.product) params.set('product', options.product);
    return this.request(`/prices?${params}`);
  }

  // ============ PAYMENT INTENTS ============

  async createPaymentIntent(amount, currency = 'usd', options = {}) {
    return this.request('/payment_intents', {
      method: 'POST',
      body: this.encodeForm({ amount, currency, ...options }),
    });
  }

  async getPaymentIntent(paymentIntentId) {
    return this.request(`/payment_intents/${paymentIntentId}`);
  }

  async confirmPaymentIntent(paymentIntentId, paymentMethod) {
    return this.request(`/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      body: this.encodeForm({ payment_method: paymentMethod }),
    });
  }

  async cancelPaymentIntent(paymentIntentId) {
    return this.request(`/payment_intents/${paymentIntentId}/cancel`, {
      method: 'POST',
    });
  }

  // ============ SUBSCRIPTIONS ============

  async createSubscription(customerId, priceId, options = {}) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: this.encodeForm({
        customer: customerId,
        items: [{ price: priceId }],
        ...options,
      }),
    });
  }

  async getSubscription(subscriptionId) {
    return this.request(`/subscriptions/${subscriptionId}`);
  }

  async cancelSubscription(subscriptionId) {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  async listSubscriptions(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    if (options.customer) params.set('customer', options.customer);
    return this.request(`/subscriptions?${params}`);
  }

  // ============ INVOICES ============

  async createInvoice(customerId, options = {}) {
    return this.request('/invoices', {
      method: 'POST',
      body: this.encodeForm({ customer: customerId, ...options }),
    });
  }

  async finalizeInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}/finalize`, { method: 'POST' });
  }

  async payInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}/pay`, { method: 'POST' });
  }

  async listInvoices(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    if (options.customer) params.set('customer', options.customer);
    return this.request(`/invoices?${params}`);
  }

  // ============ REFUNDS ============

  async createRefund(paymentIntentId, amount = null, reason = null) {
    const data = { payment_intent: paymentIntentId };
    if (amount) data.amount = amount;
    if (reason) data.reason = reason;
    return this.request('/refunds', {
      method: 'POST',
      body: this.encodeForm(data),
    });
  }

  async listRefunds(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    return this.request(`/refunds?${params}`);
  }

  // ============ COUPONS ============

  async createCoupon(percentOff, duration = 'once', options = {}) {
    return this.request('/coupons', {
      method: 'POST',
      body: this.encodeForm({ percent_off: percentOff, duration, ...options }),
    });
  }

  async listCoupons(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    return this.request(`/coupons?${params}`);
  }

  // ============ PAYMENT LINKS ============

  async createPaymentLink(priceId, quantity = 1) {
    return this.request('/payment_links', {
      method: 'POST',
      body: this.encodeForm({ line_items: [{ price: priceId, quantity }] }),
    });
  }

  // ============ BALANCE ============

  async getBalance() {
    return this.request('/balance');
  }

  // ============ DISPUTES ============

  async listDisputes(options = {}) {
    const params = new URLSearchParams({ limit: options.limit || 10 });
    return this.request(`/disputes?${params}`);
  }
}

// Singleton instance
export const stripeClient = new StripeClient();

/**
 * Stripe API handlers for REST endpoints
 */
export const stripeHandlers = {
  // Customers
  createCustomer: (email, name, metadata) => stripeClient.createCustomer(email, name, metadata),
  getCustomer: (id) => stripeClient.getCustomer(id),
  listCustomers: (options) => stripeClient.listCustomers(options),
  updateCustomer: (id, updates) => stripeClient.updateCustomer(id, updates),
  deleteCustomer: (id) => stripeClient.deleteCustomer(id),

  // Products & Prices
  createProduct: (name, description, metadata) => stripeClient.createProduct(name, description, metadata),
  listProducts: (options) => stripeClient.listProducts(options),
  createPrice: (productId, amount, currency, recurring) => stripeClient.createPrice(productId, amount, currency, recurring),
  listPrices: (options) => stripeClient.listPrices(options),

  // Payment Intents
  createPaymentIntent: (amount, currency, options) => stripeClient.createPaymentIntent(amount, currency, options),
  getPaymentIntent: (id) => stripeClient.getPaymentIntent(id),
  confirmPaymentIntent: (id, method) => stripeClient.confirmPaymentIntent(id, method),
  cancelPaymentIntent: (id) => stripeClient.cancelPaymentIntent(id),

  // Subscriptions
  createSubscription: (customerId, priceId, options) => stripeClient.createSubscription(customerId, priceId, options),
  getSubscription: (id) => stripeClient.getSubscription(id),
  cancelSubscription: (id) => stripeClient.cancelSubscription(id),
  listSubscriptions: (options) => stripeClient.listSubscriptions(options),

  // Invoices
  createInvoice: (customerId, options) => stripeClient.createInvoice(customerId, options),
  finalizeInvoice: (id) => stripeClient.finalizeInvoice(id),
  payInvoice: (id) => stripeClient.payInvoice(id),
  listInvoices: (options) => stripeClient.listInvoices(options),

  // Refunds
  createRefund: (paymentIntentId, amount, reason) => stripeClient.createRefund(paymentIntentId, amount, reason),
  listRefunds: (options) => stripeClient.listRefunds(options),

  // Coupons
  createCoupon: (percentOff, duration, options) => stripeClient.createCoupon(percentOff, duration, options),
  listCoupons: (options) => stripeClient.listCoupons(options),

  // Payment Links
  createPaymentLink: (priceId, quantity) => stripeClient.createPaymentLink(priceId, quantity),

  // Balance & Disputes
  getBalance: () => stripeClient.getBalance(),
  listDisputes: (options) => stripeClient.listDisputes(options),
};

export default stripeHandlers;
