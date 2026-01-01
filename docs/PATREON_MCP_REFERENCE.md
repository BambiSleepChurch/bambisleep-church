# Patreon MCP Reference

**BambiSleep™ Church MCP Control Tower**

Complete reference for Patreon API v2 integration via MCP handlers.

---

## Overview

The Patreon MCP provides OAuth2-authenticated access to Patreon's creator platform, enabling:

- Campaign and membership management
- Patron data retrieval with tier entitlements
- Post management and content access
- Real-time webhooks for membership events
- Discord integration via tier role assignments

**Base URL**: `https://www.patreon.com`
**API Version**: v2 (recommended)
**Auth**: OAuth2 Bearer Token

---

## Environment Variables

| Variable                 | Required | Description                                   |
| ------------------------ | -------- | --------------------------------------------- |
| `PATREON_CLIENT_ID`      | Yes      | OAuth client ID from Patreon developer portal |
| `PATREON_CLIENT_SECRET`  | Yes      | OAuth client secret                           |
| `PATREON_ACCESS_TOKEN`   | Yes      | Creator access token (for server-to-server)   |
| `PATREON_REFRESH_TOKEN`  | No       | Token refresh support                         |
| `PATREON_WEBHOOK_SECRET` | No       | HMAC verification for webhooks                |

---

## OAuth2 Scopes

Request scopes during OAuth authorization flow. Scopes are cumulative (previously approved scopes persist).

| Scope                       | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `identity`                  | Read access to user data (id, name, vanity, URLs, images) |
| `identity[email]`           | Read access to user's email address                       |
| `identity.memberships`      | Read access to user's memberships across campaigns        |
| `campaigns`                 | Read access to basic campaign data                        |
| `campaigns.members`         | Read access to campaign member data                       |
| `campaigns.members[email]`  | Read access to member email addresses                     |
| `campaigns.members.address` | Read access to member shipping addresses                  |
| `campaigns.posts`           | Read access to campaign posts                             |
| `w:campaigns.webhook`       | Full CRUD access to webhooks                              |

---

## API v2 Key Concepts

### Explicit Field Selection

**Critical**: API v2 returns only `type` and `id` by default. All attributes must be explicitly requested:

```
fields[resource]=attribute1,attribute2,attribute3
```

URL-encode brackets: `fields%5Bresource%5D=attribute1,attribute2`

### Includes (Relationships)

Request related resources with the `include` parameter:

```
include=related1,related2
```

### Pagination

- Members endpoint: 1000 results per page (500 if pledge_history included)
- Use `page[cursor]` for pagination
- Check `links.next` in response for next page URL

---

## Resource Endpoints

### Identity

**GET** `/api/oauth2/v2/identity`

Get the current authorized user's information.

**Scope**: `identity`

**Includes**: `memberships`, `campaign`

**Fields** (`fields[user]`):

- `about`, `created`, `email`, `first_name`, `full_name`, `last_name`
- `image_url`, `thumb_url`, `url`, `vanity`
- `is_email_verified`, `can_see_nsfw`
- `social_connections` (object with platform links)

**Example**:

```
GET /api/oauth2/v2/identity?fields[user]=email,full_name,image_url&include=memberships
```

---

### Campaigns

**GET** `/api/oauth2/v2/campaigns`

List all campaigns owned by the authorized user.

**Scope**: `campaigns`

**Includes**: `tiers`, `creator`, `benefits`, `goals`

**Fields** (`fields[campaign]`):

| Field                    | Type    | Description                         |
| ------------------------ | ------- | ----------------------------------- |
| `created_at`             | string  | ISO 8601 datetime                   |
| `creation_name`          | string  | Type of creation (e.g., "podcasts") |
| `discord_server_id`      | string  | Linked Discord server ID            |
| `google_analytics_id`    | string  | GA tracking ID                      |
| `has_rss`                | boolean | RSS feed enabled                    |
| `image_url`              | string  | Campaign banner image               |
| `image_small_url`        | string  | Thumbnail image                     |
| `is_charged_immediately` | boolean | Charge on pledge                    |
| `is_monthly`             | boolean | Monthly billing cycle               |
| `is_nsfw`                | boolean | Adult content flag                  |
| `main_video_embed`       | string  | Embedded video HTML                 |
| `main_video_url`         | string  | Video URL                           |
| `one_liner`              | string  | Short description                   |
| `patron_count`           | integer | Total patron count                  |
| `pay_per_name`           | string  | Payment interval name               |
| `pledge_url`             | string  | Direct pledge link                  |
| `published_at`           | string  | Publication datetime                |
| `rss_artwork_url`        | string  | RSS feed artwork                    |
| `rss_feed_title`         | string  | RSS feed title                      |
| `show_earnings`          | boolean | Public earnings display             |
| `summary`                | string  | Full campaign description           |
| `thanks_embed`           | string  | Thank you page embed                |
| `thanks_msg`             | string  | Thank you message                   |
| `thanks_video_url`       | string  | Thank you video                     |
| `url`                    | string  | Campaign URL                        |
| `vanity`                 | string  | Custom URL slug                     |

---

### Campaign by ID

**GET** `/api/oauth2/v2/campaigns/{campaign_id}`

Get a single campaign by ID.

**Scope**: `campaigns`

**Includes**: `tiers`, `creator`, `benefits`, `goals`

---

### Campaign Members

**GET** `/api/oauth2/v2/campaigns/{campaign_id}/members`

Get all members (patrons) for a campaign.

**Scope**: `campaigns.members`

**Includes**:

- `address` (requires `campaigns.members.address` scope)
- `campaign`
- `currently_entitled_tiers`
- `user`
- `pledge_history`

**Fields** (`fields[member]`):

| Field                             | Type    | Description                                   |
| --------------------------------- | ------- | --------------------------------------------- |
| `campaign_lifetime_support_cents` | integer | Total support in cents                        |
| `currently_entitled_amount_cents` | integer | Current pledge amount                         |
| `email`                           | string  | Member email (requires scope)                 |
| `full_name`                       | string  | Display name                                  |
| `is_follower`                     | boolean | Free follower status                          |
| `last_charge_date`                | string  | Last successful charge                        |
| `last_charge_status`              | string  | Paid, Declined, Pending, etc.                 |
| `lifetime_support_cents`          | integer | Lifetime support total                        |
| `next_charge_date`                | string  | Next billing date                             |
| `note`                            | string  | Creator's note on member                      |
| `patron_status`                   | string  | active_patron, declined_patron, former_patron |
| `pledge_cadence`                  | integer | Months between charges                        |
| `pledge_relationship_start`       | string  | Initial pledge datetime                       |
| `will_pay_amount_cents`           | integer | Next charge amount                            |

**Pagination**: 1000 results per page (500 with pledge_history)

**Example**:

```
GET /api/oauth2/v2/campaigns/{id}/members?include=currently_entitled_tiers,user&fields[member]=full_name,patron_status,currently_entitled_amount_cents&fields[tier]=title,amount_cents
```

---

### Member by ID

**GET** `/api/oauth2/v2/members/{member_id}`

Get a single member's details.

**Scope**: `campaigns.members`

**Includes**: `address`, `campaign`, `currently_entitled_tiers`, `user`

---

### Campaign Posts

**GET** `/api/oauth2/v2/campaigns/{campaign_id}/posts`

Get all posts for a campaign.

**Scope**: `campaigns.posts`

**Fields** (`fields[post]`):

| Field          | Type    | Description             |
| -------------- | ------- | ----------------------- |
| `app_id`       | integer | Platform app ID         |
| `app_status`   | string  | App-specific status     |
| `content`      | string  | Post content (HTML)     |
| `embed_data`   | object  | Embedded media metadata |
| `embed_url`    | string  | Embedded content URL    |
| `is_paid`      | boolean | Patron-only post        |
| `is_public`    | boolean | Publicly visible        |
| `published_at` | string  | Publication datetime    |
| `title`        | string  | Post title              |
| `url`          | string  | Post URL                |

---

### Post by ID

**GET** `/api/oauth2/v2/posts/{post_id}`

Get a single post by ID.

**Scope**: `campaigns.posts`

---

## Webhook Endpoints

### List Webhooks

**GET** `/api/oauth2/v2/webhooks`

Get all webhooks created by your OAuth client.

**Scope**: `w:campaigns.webhook`

**Includes**: `client`, `campaign`

**Fields** (`fields[webhook]`):

| Field                          | Type    | Description           |
| ------------------------------ | ------- | --------------------- |
| `last_attempted_at`            | string  | Last delivery attempt |
| `num_consecutive_times_failed` | integer | Failure count         |
| `paused`                       | boolean | Webhook paused status |
| `secret`                       | string  | HMAC signing secret   |
| `triggers`                     | array   | Event triggers        |
| `uri`                          | string  | Delivery URL          |

---

### Create Webhook

**POST** `/api/oauth2/v2/webhooks`

Create a new webhook for a campaign.

**Scope**: `w:campaigns.webhook`

**Request Body**:

```json
{
  "data": {
    "type": "webhook",
    "attributes": {
      "triggers": ["members:create", "members:update", "members:delete"],
      "uri": "https://your-server.com/webhooks/patreon"
    },
    "relationships": {
      "campaign": {
        "data": { "type": "campaign", "id": "12345" }
      }
    }
  }
}
```

---

### Update Webhook

**PATCH** `/api/oauth2/v2/webhooks/{webhook_id}`

Update webhook configuration.

**Scope**: `w:campaigns.webhook`

---

### Delete Webhook

**DELETE** `/api/oauth2/v2/webhooks/{webhook_id}`

Remove a webhook.

**Scope**: `w:campaigns.webhook`

---

## Webhook Triggers

### Member Events

| Trigger          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `members:create` | New member created (no prior payment history)    |
| `members:update` | Membership info changed (includes charge events) |
| `members:delete` | Membership deleted (no prior payment)            |

### Pledge Events

| Trigger                 | Description                                   |
| ----------------------- | --------------------------------------------- |
| `members:pledge:create` | New pledge created (includes follower→patron) |
| `members:pledge:update` | Pledge upgraded or downgraded                 |
| `members:pledge:delete` | Pledge cancelled                              |

### Post Events

| Trigger         | Description    |
| --------------- | -------------- |
| `posts:publish` | Post published |
| `posts:update`  | Post edited    |
| `posts:delete`  | Post removed   |

---

## Webhook Payload

Webhook deliveries include:

- **Header**: `X-Patreon-Signature` - HMAC-MD5 hex digest for verification
- **Body**: JSON:API formatted member/post data

**Signature Verification**:

```javascript
import crypto from "crypto";

function verifyWebhook(body, signature, secret) {
  const hash = crypto.createHmac("md5", secret).update(body).digest("hex");
  return hash === signature;
}
```

**Sample Payload**:

```json
{
  "data": {
    "attributes": {
      "currently_entitled_amount_cents": 500,
      "full_name": "Patron Name",
      "is_follower": false,
      "last_charge_date": "2026-01-01T12:00:00+00:00",
      "last_charge_status": "Paid",
      "lifetime_support_cents": 1500,
      "patron_status": "active_patron"
    },
    "id": "member-uuid",
    "relationships": {
      "campaign": { "data": { "id": "123456", "type": "campaign" } },
      "currently_entitled_tiers": { "data": [{ "id": "54321", "type": "tier" }] },
      "user": { "data": { "id": "987654", "type": "user" } }
    },
    "type": "member"
  },
  "included": [
    { "type": "campaign", "id": "123456", "attributes": { ... } },
    { "type": "user", "id": "987654", "attributes": { ... } },
    { "type": "tier", "id": "54321", "attributes": { ... } }
  ]
}
```

---

## Resource Types

### Address

| Field          | Type   | Description     |
| -------------- | ------ | --------------- |
| `addressee`    | string | Recipient name  |
| `city`         | string | City            |
| `country`      | string | Country code    |
| `line_1`       | string | Street address  |
| `line_2`       | string | Apt/Suite       |
| `phone_number` | string | Phone           |
| `postal_code`  | string | ZIP/Postal code |
| `state`        | string | State/Province  |

### Benefit

| Field                              | Type    | Description          |
| ---------------------------------- | ------- | -------------------- |
| `app_external_id`                  | string  | External app ID      |
| `app_meta`                         | object  | App metadata         |
| `benefit_type`                     | string  | Type identifier      |
| `created_at`                       | string  | Creation datetime    |
| `deliverables_due_today_count`     | integer | Pending deliverables |
| `delivered_deliverables_count`     | integer | Completed count      |
| `description`                      | string  | Benefit description  |
| `is_deleted`                       | boolean | Soft delete flag     |
| `is_ended`                         | boolean | Benefit ended        |
| `is_published`                     | boolean | Published status     |
| `next_deliverable_due_date`        | string  | Next due date        |
| `not_delivered_deliverables_count` | integer | Pending count        |
| `rule_type`                        | string  | Fulfillment rules    |
| `tiers_count`                      | integer | Associated tiers     |
| `title`                            | string  | Benefit title        |

### Tier

| Field               | Type    | Description          |
| ------------------- | ------- | -------------------- |
| `amount_cents`      | integer | Price in cents (USD) |
| `created_at`        | string  | Creation datetime    |
| `description`       | string  | Tier description     |
| `discord_role_ids`  | array   | Discord role IDs     |
| `edited_at`         | string  | Last edit datetime   |
| `image_url`         | string  | Tier image           |
| `patron_count`      | integer | Current patrons      |
| `post_count`        | integer | Posts for this tier  |
| `published`         | boolean | Published status     |
| `published_at`      | string  | Publication datetime |
| `remaining`         | integer | Slots remaining      |
| `requires_shipping` | boolean | Physical rewards     |
| `title`             | string  | Tier name            |
| `unpublished_at`    | string  | Unpublish datetime   |
| `url`               | string  | Direct tier URL      |
| `user_limit`        | integer | Maximum patrons      |

### Pledge Event

| Field                   | Type    | Description                              |
| ----------------------- | ------- | ---------------------------------------- |
| `amount_cents`          | integer | Event amount                             |
| `currency_code`         | string  | ISO currency                             |
| `date`                  | string  | Event datetime                           |
| `payment_status`        | string  | Paid, Declined, Refunded, etc.           |
| `pledge_payment_status` | string  | queued, pending, valid, declined         |
| `tier_id`               | string  | Associated tier                          |
| `tier_title`            | string  | Tier name                                |
| `type`                  | string  | pledge_start, upgrade, downgrade, delete |

### User

| Field                | Type   | Description            |
| -------------------- | ------ | ---------------------- |
| `about`              | string | Bio text               |
| `created`            | string | Account creation       |
| `email`              | string | Email (requires scope) |
| `first_name`         | string | First name             |
| `full_name`          | string | Display name           |
| `image_url`          | string | Profile image          |
| `last_name`          | string | Last name              |
| `social_connections` | object | Linked accounts        |
| `thumb_url`          | string | Thumbnail image        |
| `url`                | string | Profile URL            |
| `vanity`             | string | Custom URL slug        |

---

## MCP Handler Methods

### Identity & Auth

| Method                    | Description            |
| ------------------------- | ---------------------- |
| `getIdentity(options)`    | Get current user info  |
| `getMemberships(options)` | Get user's memberships |

### Campaign Management

| Method                                    | Description              |
| ----------------------------------------- | ------------------------ |
| `getCampaigns(options)`                   | List creator's campaigns |
| `getCampaign(campaignId, options)`        | Get single campaign      |
| `getCampaignMembers(campaignId, options)` | List campaign members    |
| `getMember(memberId, options)`            | Get single member        |

### Posts

| Method                                  | Description         |
| --------------------------------------- | ------------------- |
| `getCampaignPosts(campaignId, options)` | List campaign posts |
| `getPost(postId, options)`              | Get single post     |

### Webhooks

| Method                                     | Description    |
| ------------------------------------------ | -------------- |
| `getWebhooks()`                            | List webhooks  |
| `createWebhook(campaignId, uri, triggers)` | Create webhook |
| `updateWebhook(webhookId, updates)`        | Update webhook |
| `deleteWebhook(webhookId)`                 | Delete webhook |

### Utilities

| Method                                    | Description         |
| ----------------------------------------- | ------------------- |
| `verifyWebhookSignature(body, signature)` | Verify HMAC         |
| `refreshToken(refreshToken)`              | Refresh OAuth token |

---

## Example Flows

### Check Patron Tier Entitlement

```javascript
// Get member with entitled tiers
const member = await patreonHandlers.getMember(memberId, {
  include: ["currently_entitled_tiers"],
  fields: {
    member: ["full_name", "patron_status"],
    tier: ["title", "amount_cents"],
  },
});

const tiers = member.included
  .filter((r) => r.type === "tier")
  .map((t) => t.attributes.title);

const hasAccess = tiers.includes("Premium Tier");
```

### Set Up Membership Webhooks

```javascript
// Create webhook for all member events
await patreonHandlers.createWebhook(
  campaignId,
  "https://api.example.com/webhooks/patreon",
  [
    "members:create",
    "members:update",
    "members:delete",
    "members:pledge:create",
    "members:pledge:update",
    "members:pledge:delete",
  ]
);
```

### Paginate All Members

```javascript
async function getAllMembers(campaignId) {
  const allMembers = [];
  let cursor = null;

  do {
    const response = await patreonHandlers.getCampaignMembers(campaignId, {
      cursor,
      fields: { member: ["full_name", "patron_status"] },
    });

    allMembers.push(...response.data);
    cursor = response.links?.next
      ? new URL(response.links.next).searchParams.get("page[cursor]")
      : null;
  } while (cursor);

  return allMembers;
}
```

---

## Rate Limits

Patreon API enforces rate limits per OAuth client:

- **Standard**: ~25-50 requests per minute
- **Bulk operations**: Use pagination, avoid rapid successive calls
- **Webhooks**: Implement exponential backoff for retries

---

## Error Codes

| Code  | Description                     |
| ----- | ------------------------------- |
| `401` | Invalid or expired access token |
| `403` | Insufficient scope for endpoint |
| `404` | Resource not found              |
| `429` | Rate limit exceeded             |
| `500` | Patreon server error            |

---

## Related Documentation

- [Patreon API Docs](https://docs.patreon.com)
- [OAuth2 Setup Guide](https://www.patreon.com/platform/documentation/oauth)
- [Webhook Registration](https://www.patreon.com/portal/registration/register-webhooks)
- [JSON:API Specification](https://jsonapi.org/)

---

_BambiSleepChurch™ MCP Control Tower - Patreon Integration_
