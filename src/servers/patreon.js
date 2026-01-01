/**
 * BambiSleep™ Church MCP Control Tower
 * Patreon MCP Server Wrapper - Creator Platform Operations
 * Reference: docs/PATREON_MCP_REFERENCE.md
 */

import crypto from 'crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('patreon');

const PATREON_API = 'https://www.patreon.com/api/oauth2/v2';
const PATREON_OAUTH = 'https://www.patreon.com/api/oauth2/token';

/**
 * Patreon API client
 */
class PatreonClient {
  constructor(accessToken = process.env.PATREON_ACCESS_TOKEN) {
    this.accessToken = accessToken;
    this.clientId = process.env.PATREON_CLIENT_ID;
    this.clientSecret = process.env.PATREON_CLIENT_SECRET;
    this.webhookSecret = process.env.PATREON_WEBHOOK_SECRET;
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }

  /**
   * Build fields query parameter
   * @param {Object} fields - Fields by resource type e.g. { member: ['full_name', 'email'] }
   */
  buildFieldsParam(fields = {}) {
    const params = new URLSearchParams();
    for (const [resource, fieldList] of Object.entries(fields)) {
      if (Array.isArray(fieldList) && fieldList.length > 0) {
        params.append(`fields[${resource}]`, fieldList.join(','));
      }
    }
    return params;
  }

  /**
   * Make Patreon API request
   */
  async request(endpoint, options = {}) {
    const url = `${PATREON_API}${endpoint}`;
    
    logger.debug(`Patreon API: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers },
    });

    const data = await response.json();
    
    if (!response.ok) {
      const error = data.errors?.[0]?.detail || `Patreon API error: ${response.status}`;
      logger.error(`Patreon API error: ${error}`);
      throw new Error(error);
    }

    return data;
  }

  // ============ IDENTITY ============

  /**
   * Get current user identity
   * @param {Object} options - Query options
   */
  async getIdentity(options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      user: ['about', 'created', 'email', 'first_name', 'full_name', 'image_url', 'last_name', 'thumb_url', 'url', 'vanity', 'is_email_verified'],
    });
    
    if (options.include) {
      params.append('include', options.include.join(','));
    }
    
    const query = params.toString();
    return this.request(`/identity${query ? `?${query}` : ''}`);
  }

  // ============ CAMPAIGNS ============

  /**
   * Get all campaigns owned by authorized user
   * @param {Object} options - Query options
   */
  async getCampaigns(options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      campaign: ['created_at', 'creation_name', 'discord_server_id', 'image_url', 'is_monthly', 'is_nsfw', 'patron_count', 'pledge_url', 'published_at', 'summary', 'url', 'vanity'],
    });
    
    if (options.include) {
      params.append('include', options.include.join(','));
    }
    
    const query = params.toString();
    return this.request(`/campaigns${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific campaign by ID
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   */
  async getCampaign(campaignId, options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      campaign: ['created_at', 'creation_name', 'discord_server_id', 'image_url', 'is_monthly', 'is_nsfw', 'patron_count', 'pledge_url', 'published_at', 'summary', 'thanks_msg', 'thanks_video_url', 'url', 'vanity'],
    });
    
    if (options.include) {
      params.append('include', options.include.join(','));
    }
    
    const query = params.toString();
    return this.request(`/campaigns/${campaignId}${query ? `?${query}` : ''}`);
  }

  // ============ MEMBERS ============

  /**
   * Get all members for a campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   */
  async getCampaignMembers(campaignId, options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      member: ['full_name', 'is_follower', 'last_charge_date', 'last_charge_status', 'lifetime_support_cents', 'currently_entitled_amount_cents', 'patron_status', 'email', 'pledge_relationship_start'],
      tier: ['title', 'amount_cents', 'description', 'discord_role_ids'],
      user: ['full_name', 'email', 'image_url', 'url'],
    });
    
    if (options.include) {
      params.append('include', options.include.join(','));
    } else {
      params.append('include', 'currently_entitled_tiers,user');
    }
    
    if (options.cursor) {
      params.append('page[cursor]', options.cursor);
    }
    
    const query = params.toString();
    return this.request(`/campaigns/${campaignId}/members${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific member by ID
   * @param {string} memberId - Member ID
   * @param {Object} options - Query options
   */
  async getMember(memberId, options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      member: ['full_name', 'is_follower', 'last_charge_date', 'last_charge_status', 'lifetime_support_cents', 'currently_entitled_amount_cents', 'patron_status', 'email', 'note', 'pledge_cadence', 'pledge_relationship_start', 'will_pay_amount_cents'],
      tier: ['title', 'amount_cents', 'description'],
      address: ['addressee', 'city', 'line_1', 'line_2', 'postal_code', 'state', 'country'],
    });
    
    if (options.include) {
      params.append('include', options.include.join(','));
    } else {
      params.append('include', 'currently_entitled_tiers,user');
    }
    
    const query = params.toString();
    return this.request(`/members/${memberId}${query ? `?${query}` : ''}`);
  }

  /**
   * Get all members with pagination support
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   */
  async getAllMembers(campaignId, options = {}) {
    const allMembers = [];
    let cursor = null;
    let pageCount = 0;
    const maxPages = options.maxPages || 100;
    
    do {
      const response = await this.getCampaignMembers(campaignId, {
        ...options,
        cursor,
      });
      
      allMembers.push(...(response.data || []));
      pageCount++;
      
      // Extract cursor from next link
      const nextLink = response.links?.next;
      if (nextLink) {
        const nextUrl = new URL(nextLink);
        cursor = nextUrl.searchParams.get('page[cursor]');
      } else {
        cursor = null;
      }
      
      logger.debug(`Fetched page ${pageCount}, ${response.data?.length || 0} members`);
    } while (cursor && pageCount < maxPages);
    
    return {
      data: allMembers,
      meta: { total: allMembers.length, pages: pageCount },
    };
  }

  // ============ POSTS ============

  /**
   * Get posts for a campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options
   */
  async getCampaignPosts(campaignId, options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      post: ['title', 'content', 'is_paid', 'is_public', 'published_at', 'url', 'embed_url'],
    });
    
    if (options.cursor) {
      params.append('page[cursor]', options.cursor);
    }
    
    const query = params.toString();
    return this.request(`/campaigns/${campaignId}/posts${query ? `?${query}` : ''}`);
  }

  /**
   * Get a specific post by ID
   * @param {string} postId - Post ID
   * @param {Object} options - Query options
   */
  async getPost(postId, options = {}) {
    const params = this.buildFieldsParam(options.fields || {
      post: ['title', 'content', 'is_paid', 'is_public', 'published_at', 'url', 'embed_data', 'embed_url'],
    });
    
    const query = params.toString();
    return this.request(`/posts/${postId}${query ? `?${query}` : ''}`);
  }

  // ============ WEBHOOKS ============

  /**
   * Get all webhooks for current client
   */
  async getWebhooks() {
    const params = this.buildFieldsParam({
      webhook: ['last_attempted_at', 'num_consecutive_times_failed', 'paused', 'secret', 'triggers', 'uri'],
    });
    return this.request(`/webhooks?${params.toString()}`);
  }

  /**
   * Create a new webhook
   * @param {string} campaignId - Campaign ID
   * @param {string} uri - Webhook delivery URL
   * @param {string[]} triggers - Array of trigger types
   */
  async createWebhook(campaignId, uri, triggers) {
    const payload = {
      data: {
        type: 'webhook',
        attributes: {
          triggers,
          uri,
        },
        relationships: {
          campaign: {
            data: { type: 'campaign', id: campaignId },
          },
        },
      },
    };
    
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update a webhook
   * @param {string} webhookId - Webhook ID
   * @param {Object} updates - Updates to apply
   */
  async updateWebhook(webhookId, updates) {
    const payload = {
      data: {
        type: 'webhook',
        id: webhookId,
        attributes: updates,
      },
    };
    
    return this.request(`/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete a webhook
   * @param {string} webhookId - Webhook ID
   */
  async deleteWebhook(webhookId) {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Verify webhook signature
   * @param {string} body - Raw request body
   * @param {string} signature - X-Patreon-Signature header
   */
  verifyWebhookSignature(body, signature) {
    if (!this.webhookSecret) {
      logger.warn('No webhook secret configured');
      return false;
    }
    
    const hash = crypto.createHmac('md5', this.webhookSecret)
      .update(body)
      .digest('hex');
    
    return hash === signature;
  }

  // ============ OAUTH ============

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   */
  async refreshToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    
    const response = await fetch(PATREON_OAUTH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error_description || 'Token refresh failed');
    }
    
    // Update instance token
    this.accessToken = data.access_token;
    
    return data;
  }

  /**
   * Get OAuth authorization URL
   * @param {string} redirectUri - Redirect URI after auth
   * @param {string[]} scopes - Requested scopes
   * @param {string} state - CSRF state parameter
   */
  getAuthorizationUrl(redirectUri, scopes, state = null) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
    });
    
    if (state) {
      params.append('state', state);
    }
    
    return `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @param {string} redirectUri - Redirect URI used in auth request
   */
  async exchangeCode(code, redirectUri) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
    });
    
    const response = await fetch(PATREON_OAUTH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error_description || 'Token exchange failed');
    }
    
    // Update instance token
    this.accessToken = data.access_token;
    
    return data;
  }

  // ============ UTILITIES ============

  /**
   * Check if patron is entitled to a specific tier
   * @param {Object} member - Member data from API
   * @param {string} tierTitle - Tier title to check
   */
  isEntitledToTier(member, tierTitle) {
    const tiers = member.relationships?.currently_entitled_tiers?.data || [];
    const tierIds = tiers.map(t => t.id);
    
    // Need included data to check tier titles
    if (member.included) {
      const tierData = member.included.filter(r => 
        r.type === 'tier' && tierIds.includes(r.id)
      );
      return tierData.some(t => t.attributes?.title === tierTitle);
    }
    
    return tierIds.length > 0;
  }

  /**
   * Get patron tier amount in dollars
   * @param {Object} member - Member data from API
   */
  getPatronTierAmount(member) {
    const cents = member.attributes?.currently_entitled_amount_cents || 0;
    return cents / 100;
  }

  /**
   * Check if patron is active (paid)
   * @param {Object} member - Member data from API
   */
  isActivePatron(member) {
    return member.attributes?.patron_status === 'active_patron';
  }

  /**
   * Get patron status
   * @param {Object} member - Member data from API
   */
  getPatronStatus(member) {
    return {
      status: member.attributes?.patron_status,
      isActive: member.attributes?.patron_status === 'active_patron',
      isDeclined: member.attributes?.patron_status === 'declined_patron',
      isFormer: member.attributes?.patron_status === 'former_patron',
      isFollower: member.attributes?.is_follower === true,
      lastChargeStatus: member.attributes?.last_charge_status,
      lastChargeDate: member.attributes?.last_charge_date,
      lifetimeSupportCents: member.attributes?.lifetime_support_cents || 0,
      currentlyEntitledCents: member.attributes?.currently_entitled_amount_cents || 0,
    };
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: !!this.accessToken,
      hasClientCredentials: !!(this.clientId && this.clientSecret),
      hasWebhookSecret: !!this.webhookSecret,
    };
  }
}

// Singleton instance
export const patreonClient = new PatreonClient();

/**
 * Patreon API handlers for REST endpoints
 */
export const patreonHandlers = {
  // Status
  getStatus: () => patreonClient.getStatus(),
  
  // Identity
  getIdentity: (options) => patreonClient.getIdentity(options),
  
  // Campaigns
  getCampaigns: (options) => patreonClient.getCampaigns(options),
  getCampaign: (id, options) => patreonClient.getCampaign(id, options),
  
  // Members
  getCampaignMembers: (campaignId, options) => patreonClient.getCampaignMembers(campaignId, options),
  getMember: (id, options) => patreonClient.getMember(id, options),
  getAllMembers: (campaignId, options) => patreonClient.getAllMembers(campaignId, options),
  
  // Posts
  getCampaignPosts: (campaignId, options) => patreonClient.getCampaignPosts(campaignId, options),
  getPost: (id, options) => patreonClient.getPost(id, options),
  
  // Webhooks
  getWebhooks: () => patreonClient.getWebhooks(),
  createWebhook: (campaignId, uri, triggers) => patreonClient.createWebhook(campaignId, uri, triggers),
  updateWebhook: (id, updates) => patreonClient.updateWebhook(id, updates),
  deleteWebhook: (id) => patreonClient.deleteWebhook(id),
  verifyWebhookSignature: (body, signature) => patreonClient.verifyWebhookSignature(body, signature),
  
  // OAuth
  refreshToken: (refreshToken) => patreonClient.refreshToken(refreshToken),
  getAuthorizationUrl: (redirectUri, scopes, state) => patreonClient.getAuthorizationUrl(redirectUri, scopes, state),
  exchangeCode: (code, redirectUri) => patreonClient.exchangeCode(code, redirectUri),
  
  // Utilities
  isEntitledToTier: (member, tierTitle) => patreonClient.isEntitledToTier(member, tierTitle),
  getPatronTierAmount: (member) => patreonClient.getPatronTierAmount(member),
  isActivePatron: (member) => patreonClient.isActivePatron(member),
  getPatronStatus: (member) => patreonClient.getPatronStatus(member),
};

export default patreonHandlers;
