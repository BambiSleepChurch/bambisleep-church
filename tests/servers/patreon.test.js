/**
 * BambiSleep™ Church MCP Control Tower
 * Patreon Handler Tests
 */

import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Mock fetch globally
const originalFetch = globalThis.fetch;

describe('Patreon Handlers', async () => {
  let patreonClient;
  let patreonHandlers;

  beforeEach(async () => {
    // Reset module for fresh import
    const module = await import('../../src/servers/patreon.js');
    patreonClient = module.patreonClient;
    patreonHandlers = module.patreonHandlers;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('getStatus', () => {
    it('should return connection status', () => {
      const status = patreonHandlers.getStatus();
      
      assert.ok(typeof status === 'object');
      assert.ok('connected' in status);
      assert.ok('hasClientCredentials' in status);
      assert.ok('hasWebhookSecret' in status);
    });

    it('should reflect token availability', () => {
      const status = patreonHandlers.getStatus();
      
      // Will be false unless env vars are set
      assert.strictEqual(typeof status.connected, 'boolean');
    });
  });

  describe('buildFieldsParam', () => {
    it('should build fields query parameter correctly', () => {
      const params = patreonClient.buildFieldsParam({
        member: ['full_name', 'email'],
        tier: ['title', 'amount_cents'],
      });
      
      const paramStr = params.toString();
      assert.ok(paramStr.includes('fields%5Bmember%5D=full_name%2Cemail'));
      assert.ok(paramStr.includes('fields%5Btier%5D=title%2Camount_cents'));
    });

    it('should handle empty fields object', () => {
      const params = patreonClient.buildFieldsParam({});
      assert.strictEqual(params.toString(), '');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return false without webhook secret', () => {
      // Without PATREON_WEBHOOK_SECRET env var
      const isValid = patreonHandlers.verifyWebhookSignature('test body', 'test signature');
      assert.strictEqual(isValid, false);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate valid OAuth URL', () => {
      const url = patreonHandlers.getAuthorizationUrl(
        'https://example.com/callback',
        ['identity', 'campaigns'],
        'test-state'
      );
      
      assert.ok(url.startsWith('https://www.patreon.com/oauth2/authorize'));
      assert.ok(url.includes('response_type=code'));
      assert.ok(url.includes('redirect_uri='));
      assert.ok(url.includes('scope=identity+campaigns'));
      assert.ok(url.includes('state=test-state'));
    });

    it('should handle missing state parameter', () => {
      const url = patreonHandlers.getAuthorizationUrl(
        'https://example.com/callback',
        ['identity']
      );
      
      assert.ok(url.startsWith('https://www.patreon.com/oauth2/authorize'));
      assert.ok(!url.includes('state='));
    });
  });

  describe('isActivePatron', () => {
    it('should return true for active patron', () => {
      const member = { attributes: { patron_status: 'active_patron' } };
      assert.strictEqual(patreonHandlers.isActivePatron(member), true);
    });

    it('should return false for former patron', () => {
      const member = { attributes: { patron_status: 'former_patron' } };
      assert.strictEqual(patreonHandlers.isActivePatron(member), false);
    });

    it('should return false for declined patron', () => {
      const member = { attributes: { patron_status: 'declined_patron' } };
      assert.strictEqual(patreonHandlers.isActivePatron(member), false);
    });
  });

  describe('getPatronTierAmount', () => {
    it('should convert cents to dollars', () => {
      const member = { attributes: { currently_entitled_amount_cents: 1000 } };
      assert.strictEqual(patreonHandlers.getPatronTierAmount(member), 10);
    });

    it('should handle zero amount', () => {
      const member = { attributes: { currently_entitled_amount_cents: 0 } };
      assert.strictEqual(patreonHandlers.getPatronTierAmount(member), 0);
    });

    it('should handle missing amount', () => {
      const member = { attributes: {} };
      assert.strictEqual(patreonHandlers.getPatronTierAmount(member), 0);
    });
  });

  describe('getPatronStatus', () => {
    it('should return full status object', () => {
      const member = {
        attributes: {
          patron_status: 'active_patron',
          is_follower: false,
          last_charge_status: 'Paid',
          last_charge_date: '2024-01-15T00:00:00.000+00:00',
          lifetime_support_cents: 5000,
          currently_entitled_amount_cents: 500,
        },
      };
      
      const status = patreonHandlers.getPatronStatus(member);
      
      assert.strictEqual(status.status, 'active_patron');
      assert.strictEqual(status.isActive, true);
      assert.strictEqual(status.isDeclined, false);
      assert.strictEqual(status.isFormer, false);
      assert.strictEqual(status.isFollower, false);
      assert.strictEqual(status.lastChargeStatus, 'Paid');
      assert.strictEqual(status.lifetimeSupportCents, 5000);
      assert.strictEqual(status.currentlyEntitledCents, 500);
    });
  });

  describe('API request methods', async () => {
    it('getIdentity should call correct endpoint', async () => {
      // Mock successful response
      globalThis.fetch = mock.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { id: '123', attributes: { full_name: 'Test User' } },
          }),
        })
      );
      
      const result = await patreonHandlers.getIdentity();
      
      assert.ok(result.data);
      assert.strictEqual(globalThis.fetch.mock.calls.length, 1);
      
      const callUrl = globalThis.fetch.mock.calls[0].arguments[0];
      assert.ok(callUrl.includes('/identity'));
    });

    it('getCampaigns should call correct endpoint', async () => {
      globalThis.fetch = mock.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [{ id: 'camp1', type: 'campaign' }],
          }),
        })
      );
      
      const result = await patreonHandlers.getCampaigns();
      
      assert.ok(Array.isArray(result.data));
      const callUrl = globalThis.fetch.mock.calls[0].arguments[0];
      assert.ok(callUrl.includes('/campaigns'));
    });

    it('should handle API errors gracefully', async () => {
      globalThis.fetch = mock.fn(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            errors: [{ detail: 'Unauthorized' }],
          }),
        })
      );
      
      await assert.rejects(
        patreonHandlers.getIdentity(),
        /Unauthorized/
      );
    });
  });

  describe('Handler exports', () => {
    it('should export all required handlers', () => {
      const requiredHandlers = [
        'getStatus',
        'getIdentity',
        'getCampaigns',
        'getCampaign',
        'getCampaignMembers',
        'getMember',
        'getAllMembers',
        'getCampaignPosts',
        'getPost',
        'getWebhooks',
        'createWebhook',
        'updateWebhook',
        'deleteWebhook',
        'verifyWebhookSignature',
        'refreshToken',
        'getAuthorizationUrl',
        'exchangeCode',
        'isEntitledToTier',
        'getPatronTierAmount',
        'isActivePatron',
        'getPatronStatus',
      ];

      for (const handler of requiredHandlers) {
        assert.ok(
          typeof patreonHandlers[handler] === 'function',
          `Missing handler: ${handler}`
        );
      }
    });
  });
});
