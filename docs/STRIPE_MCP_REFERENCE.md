# Stripe MCP Server Reference

> Quick reference for building the Stripe MCP server integration.

## API Overview

- **Base URL**: `https://api.stripe.com`
- **Current Version**: `2025-12-15.clover`
- **Authentication**: API keys (`sk_test_*` for test, `sk_live_*` for production)
- **Format**: REST, form-encoded requests, JSON responses

## Authentication

```bash
# All requests require API key authentication
curl https://api.stripe.com/v1/charges \
  -u sk_test_YOUR_API_KEY:
```

**Key Types:**

- `pk_test_*` / `pk_live_*` - Publishable keys (client-side)
- `sk_test_*` / `sk_live_*` - Secret keys (server-side only)

## Core API Endpoints

### Customers

| Operation | Endpoint               | Method |
| --------- | ---------------------- | ------ |
| Create    | `/v1/customers`        | POST   |
| Retrieve  | `/v1/customers/{id}`   | GET    |
| Update    | `/v1/customers/{id}`   | POST   |
| Delete    | `/v1/customers/{id}`   | DELETE |
| List      | `/v1/customers`        | GET    |
| Search    | `/v1/customers/search` | GET    |

### Payment Intents

| Operation | Endpoint                           | Method |
| --------- | ---------------------------------- | ------ |
| Create    | `/v1/payment_intents`              | POST   |
| Retrieve  | `/v1/payment_intents/{id}`         | GET    |
| Update    | `/v1/payment_intents/{id}`         | POST   |
| Confirm   | `/v1/payment_intents/{id}/confirm` | POST   |
| Capture   | `/v1/payment_intents/{id}/capture` | POST   |
| Cancel    | `/v1/payment_intents/{id}/cancel`  | POST   |
| List      | `/v1/payment_intents`              | GET    |

### Setup Intents (Save payment methods)

| Operation | Endpoint                         | Method |
| --------- | -------------------------------- | ------ |
| Create    | `/v1/setup_intents`              | POST   |
| Retrieve  | `/v1/setup_intents/{id}`         | GET    |
| Confirm   | `/v1/setup_intents/{id}/confirm` | POST   |
| Cancel    | `/v1/setup_intents/{id}/cancel`  | POST   |

### Payment Methods

| Operation | Endpoint                          | Method |
| --------- | --------------------------------- | ------ |
| Create    | `/v1/payment_methods`             | POST   |
| Retrieve  | `/v1/payment_methods/{id}`        | GET    |
| Attach    | `/v1/payment_methods/{id}/attach` | POST   |
| Detach    | `/v1/payment_methods/{id}/detach` | POST   |
| List      | `/v1/payment_methods`             | GET    |

### Subscriptions

| Operation | Endpoint                 | Method |
| --------- | ------------------------ | ------ |
| Create    | `/v1/subscriptions`      | POST   |
| Retrieve  | `/v1/subscriptions/{id}` | GET    |
| Update    | `/v1/subscriptions/{id}` | POST   |
| Cancel    | `/v1/subscriptions/{id}` | DELETE |
| List      | `/v1/subscriptions`      | GET    |

### Products & Prices

| Operation      | Endpoint       | Method |
| -------------- | -------------- | ------ |
| Create Product | `/v1/products` | POST   |
| Create Price   | `/v1/prices`   | POST   |
| List Products  | `/v1/products` | GET    |
| List Prices    | `/v1/prices`   | GET    |

### Invoices

| Operation | Endpoint                     | Method |
| --------- | ---------------------------- | ------ |
| Create    | `/v1/invoices`               | POST   |
| Retrieve  | `/v1/invoices/{id}`          | GET    |
| Finalize  | `/v1/invoices/{id}/finalize` | POST   |
| Pay       | `/v1/invoices/{id}/pay`      | POST   |
| Void      | `/v1/invoices/{id}/void`     | POST   |
| List      | `/v1/invoices`               | GET    |

### Charges & Refunds

| Operation       | Endpoint           | Method |
| --------------- | ------------------ | ------ |
| Retrieve Charge | `/v1/charges/{id}` | GET    |
| List Charges    | `/v1/charges`      | GET    |
| Create Refund   | `/v1/refunds`      | POST   |
| List Refunds    | `/v1/refunds`      | GET    |

## Pagination

All list endpoints support cursor-based pagination:

```javascript
// Parameters
{
  limit: 10,              // 1-100, default 10
  starting_after: "obj_xxx", // Cursor for next page
  ending_before: "obj_xxx"   // Cursor for previous page
}

// Response
{
  object: "list",
  data: [...],
  has_more: true,
  url: "/v1/customers"
}
```

## Search API

Search endpoints use query strings:

```javascript
// POST /v1/customers/search
{
  query: "email:'jenny@example.com'",
  limit: 10,
  page: "cursor_token"  // For pagination
}
```

## Error Handling

```javascript
// Error response structure
{
  error: {
    type: "card_error",      // api_error, card_error, idempotency_error, invalid_request_error
    code: "card_declined",   // Machine-readable error code
    message: "Your card was declined",
    param: "card_number",    // Parameter that caused error
    decline_code: "generic_decline"
  }
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad request
- `401` - Unauthorized (invalid API key)
- `402` - Request failed (card declined, etc.)
- `404` - Not found
- `429` - Rate limited
- `500` - Stripe server error

## Idempotency

Use `Idempotency-Key` header for safe retries:

```bash
curl https://api.stripe.com/v1/charges \
  -u sk_test_KEY: \
  -H "Idempotency-Key: unique-key-12345" \
  -d amount=2000 \
  -d currency=usd
```

## Expanding Responses

Request related objects inline:

```bash
# Expand customer on charge
curl https://api.stripe.com/v1/charges/ch_xxx?expand[]=customer

# Multiple expansions
curl https://api.stripe.com/v1/charges/ch_xxx?expand[]=customer&expand[]=payment_method
```

## Metadata

Attach custom key-value data (up to 50 keys):

```javascript
{
  metadata: {
    order_id: "12345",
    user_id: "user_abc"
  }
}
```

## MCP Server Implementation Notes

### Recommended Tools

| Tool Name               | Stripe Endpoint                       | Description                     |
| ----------------------- | ------------------------------------- | ------------------------------- |
| `create_customer`       | POST /v1/customers                    | Create new customer             |
| `list_customers`        | GET /v1/customers                     | List all customers              |
| `create_payment_intent` | POST /v1/payment_intents              | Create payment                  |
| `confirm_payment`       | POST /v1/payment_intents/{id}/confirm | Confirm payment                 |
| `create_subscription`   | POST /v1/subscriptions                | Create subscription             |
| `cancel_subscription`   | DELETE /v1/subscriptions/{id}         | Cancel subscription             |
| `create_invoice`        | POST /v1/invoices                     | Create invoice                  |
| `create_product`        | POST /v1/products                     | Create product                  |
| `create_price`          | POST /v1/prices                       | Create price for product        |
| `create_refund`         | POST /v1/refunds                      | Refund a payment                |
| `list_disputes`         | GET /v1/disputes                      | List payment disputes           |
| `search_resources`      | GET /v1/{resource}/search             | Search customers, charges, etc. |

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...  # Required
STRIPE_WEBHOOK_SECRET=whsec_... # For webhooks
```

### NPM Package

```bash
npm install stripe
```

```javascript
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Example: Create customer
const customer = await stripe.customers.create({
  email: "customer@example.com",
  name: "Jenny Rosen",
});
```

## Stripe.js (Client-Side)

```html
<script src="https://js.stripe.com/v3/"></script>
```

```javascript
const stripe = Stripe("pk_test_...");

// Create Elements
const elements = stripe.elements({
  mode: "payment",
  currency: "usd",
  amount: 1099,
});

// Confirm payment
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: "https://example.com/complete",
  },
});
```

## Webhooks (Future Enhancement)

Common webhook events to handle:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

_Reference: [Stripe API Docs](https://docs.stripe.com/api) | [Stripe.js](https://docs.stripe.com/js)_
