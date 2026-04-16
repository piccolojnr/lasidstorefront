# Storefront API Guide

This document is the contract for the external storefront.

The backend exposes one storefront domain with two route files:

- `routes/api.php` for public catalog, cart, and shipping resolution
- `routes/storefront.php` for session, auth, checkout, orders, payments, addresses, and profile

Both are mounted under `/api/v1`.

## Base URL

All storefront requests use:

`/api/v1`

The storefront should send browser credentials on every request that depends on session cookies:

```ts
fetch(url, {
  credentials: "include",
});
```

For browser clients, the CSRF bootstrap flow is required before any state-changing session request.

## Transport Rules

- Use cookie/session auth for customer flows.
- Keep the guest cart token in browser storage.
- Send the guest cart token through the `X-Cart-Token` header on cart and checkout requests.
- Money values are always minor units.
- Do not convert money values in transport payloads.

Example:

- `1000` means `GHS 10.00`
- `2500` means `GHS 25.00`

## Response Envelope

Most responses use this envelope:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {},
  "errors": null
}
```

Error responses use the same envelope:

```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "errors": {
    "field": ["The field is required."]
  }
}
```

Paginated responses also include `meta`:

```json
{
  "success": true,
  "message": null,
  "data": [],
  "errors": null,
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 4,
    "path": "https://example.test/api/v1/products",
    "per_page": 20,
    "to": 20,
    "total": 78
  }
}
```

## Status Codes

- `200` for successful reads and successful mutations that do not create a resource
- `201` for created resources and checkout initialization
- `401` for unauthenticated customer-only routes
- `403` for authenticated accounts that are not storefront customers
- `404` when a resource does not belong to the current customer
- `409` for CSRF token mismatch on browser session requests
- `422` for validation and business-rule failures
- `502` when checkout is created but payment initialization fails

## Session-backed Public Routes

These routes do not require an authenticated customer, but they do run inside the storefront session middleware because they create or update session state.

- `GET /api/v1/auth/csrf-cookie`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/magic-link/request`
- `GET /api/v1/auth/magic-link/verify`
- `POST /api/v1/auth/password/login`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`
- `POST /api/v1/checkout/guest/initialize`

## Public APIs

These routes are available without a customer session.

### Catalog

#### `GET /api/v1/catalog/brands`

Returns active public brands ordered by name.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 1,
      "name": "Adidas",
      "slug": "adidas",
      "description": "Brand description.",
      "image_url": "https://cdn.example.test/brands/adidas.jpg",
      "products_count": 12
    }
  ],
  "errors": null
}
```

#### `GET /api/v1/catalog/brands/{slug}`

Returns a single active brand or `404`.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 1,
    "name": "Adidas",
    "slug": "adidas",
    "description": "Brand description.",
    "image_url": "https://cdn.example.test/brands/adidas.jpg",
    "products_count": 12
  },
  "errors": null
}
```

#### `GET /api/v1/catalog/categories`

Query parameters:

- `root_only` optional, boolean

Example request:

```http
GET /api/v1/catalog/categories?root_only=1
```

Example response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "children": []
    }
  ],
  "errors": null
}
```

#### `GET /api/v1/catalog/categories/{slug}`

Returns a single active category or `404`.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics",
    "children": []
  },
  "errors": null
}
```

#### `GET /api/v1/catalog/products`

Query parameters:

- `search` optional
- `category` optional
- `brand` optional
- `featured` optional
- `sort` optional, defaults to `latest`

Example request:

```http
GET /api/v1/catalog/products?search=phone&featured=1&sort=latest
```

Example response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 12,
      "name": "Smart Phone",
      "slug": "smart-phone",
      "sku": "SP-001",
      "base_price": 250000,
      "compare_at_price": 300000,
      "is_featured": true,
      "primary_image_url": "https://cdn.example.test/products/sp-001.jpg",
      "category": {
        "id": 1,
        "name": "Electronics",
        "slug": "electronics"
      },
      "brand": {
        "id": 3,
        "name": "Acme",
        "slug": "acme"
      }
    }
  ],
  "errors": null,
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "https://example.test/api/v1/catalog/products",
    "per_page": 20,
    "to": 1,
    "total": 1
  }
}
```

#### `GET /api/v1/catalog/products/{slug}`

Returns a single product with related products.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 12,
    "name": "Smart Phone",
    "slug": "smart-phone",
    "sku": "SP-001",
    "product_type": "simple",
    "short_description": "A compact smartphone.",
    "description": "Full product description.",
    "base_price": 250000,
    "compare_at_price": 300000,
    "is_featured": true,
    "track_inventory": true,
    "allow_backorders": false,
    "published_at": "2026-04-01T08:00:00.000000Z",
    "images": [
      {
        "id": 99,
        "url": "https://cdn.example.test/products/sp-001.jpg",
        "is_primary": true
      }
    ],
    "category": {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "image_url": "https://cdn.example.test/categories/electronics.jpg"
    },
    "brand": {
      "id": 3,
      "name": "Acme",
      "slug": "acme",
      "image_url": "https://cdn.example.test/brands/acme.jpg"
    },
    "variants": [
      {
        "id": 44,
        "name": "128GB",
        "sku": "SP-001-128",
        "price": 250000,
        "compare_at_price": 300000,
        "is_active": true
      }
    ],
    "related_products": []
  },
  "errors": null
}
```

### Guest Cart

#### `GET /api/v1/cart`

Reads or creates the active cart for the current browser session or customer.

The response includes `cart_token`. The storefront should store this and send it back through `X-Cart-Token`.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "cart_token": "cart_8d3f...",
    "status": "active",
    "currency_code": "GHS",
    "subtotal_amount": 250000,
    "discount_amount": 0,
    "tax_amount": 0,
    "shipping_amount": 0,
    "total_amount": 250000,
    "items": []
  },
  "errors": null
}
```

#### `POST /api/v1/cart/items`

Request body:

```json
{
  "product_id": 12,
  "product_variant_id": 44,
  "quantity": 2
}
```

Validation:

- `product_id` required
- `product_variant_id` optional
- `quantity` required, minimum `1`

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "cart_token": "cart_8d3f...",
    "status": "active",
    "currency_code": "GHS",
    "subtotal_amount": 500000,
    "discount_amount": 0,
    "tax_amount": 0,
    "shipping_amount": 0,
    "total_amount": 500000,
    "items": [
      {
        "id": 1,
        "product_id": 12,
        "product_variant_id": 44,
        "product_name_snapshot": "Smart Phone",
        "variant_name_snapshot": "128GB",
        "sku_snapshot": "SP-001-128",
        "unit_price": 250000,
        "quantity": 2,
        "line_total": 500000
      }
    ]
  },
  "errors": null
}
```

#### `PATCH /api/v1/cart/items/{cartItem}`

Request body:

```json
{
  "quantity": 3
}
```

#### `DELETE /api/v1/cart/items/{cartItem}`

Returns the updated cart envelope after removal.

#### `POST /api/v1/cart/coupon`

Present in the route surface, but the controller is still a placeholder.

Do not rely on this for production coupon logic yet.

#### `DELETE /api/v1/cart/coupon`

Present in the route surface, but the controller is still a placeholder.

Do not rely on this for production coupon logic yet.

### Shipping Resolution

#### `POST /api/v1/checkout/shipping-methods/resolve`

Request body:

```json
{
  "country": "GH",
  "region": "Greater Accra",
  "city": "Accra",
  "cart_id": 1
}
```

Validation:

- `country` required, 2-character code
- `city` required
- `region` optional
- `cart_id` optional

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "shipping_zone": {
      "id": 2,
      "name": "Accra Metro",
      "code": "ACC"
    },
    "shipping_methods": [
      {
        "id": 7,
        "name": "Standard Delivery",
        "code": "standard",
        "min_delivery_days": 2,
        "max_delivery_days": 5
      }
    ],
    "cart_id": 1
  },
  "errors": null
}
```

If no zone matches, the request still succeeds with:

- `shipping_zone = null`
- `shipping_methods = []`

### Guest Checkout

#### `POST /api/v1/checkout/guest/initialize`

Creates or resolves a storefront customer from the submitted email, logs that customer into the storefront session, saves the submitted shipping address as the default customer address, creates the order, and initializes payment.

The storefront should call the CSRF bootstrap endpoint first and send the guest cart token through `X-Cart-Token`.

Request body:

```json
{
  "email": "guest@example.test",
  "name": "Ada Doe",
  "phone": "+233240000000",
  "country": "Ghana",
  "region": "Greater Accra",
  "city": "Accra",
  "district": "Osu",
  "address_line_1": "12 Market Street",
  "address_line_2": null,
  "landmark": "Near the pharmacy",
  "postal_code": "GA-123-4567",
  "shipping_method_id": 7,
  "payment_provider": "paystack",
  "notes": "Leave at reception",
  "delivery_notes": "Call on arrival"
}
```

Validation:

- `email` required
- `name` required
- `country` required
- `city` required
- `address_line_1` required
- `shipping_method_id` required
- `payment_provider` required, currently `paystack`
- `phone`, `region`, `district`, `address_line_2`, `landmark`, `postal_code`, `notes`, `delivery_notes`, `coupon_code` optional

Example success response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "order": {
      "id": 101,
      "order_number": "ORD-2026-000101",
      "status": "pending",
      "payment_status": "unpaid",
      "fulfillment_status": "unfulfilled",
      "currency_code": "GHS",
      "subtotal_amount": 500000,
      "discount_amount": 0,
      "tax_amount": 0,
      "shipping_amount": 25000,
      "total_amount": 525000,
      "shipping_zone_name": "Accra Metro",
      "shipping_method_name": "Standard Delivery",
      "notes": "Leave at reception",
      "delivery_notes": "Call on arrival",
      "placed_at": "2026-04-15T12:30:00.000000Z",
      "items": [],
      "shipping_address": {
        "type": "shipping",
        "name": "Ada Doe"
      }
    },
    "payment": {
      "provider": "paystack",
      "authorization_url": "https://checkout.paystack.com/...",
      "access_code": "ACCESS_CODE",
      "reference": "PSK-REF-123"
    }
  },
  "errors": null
}
```

Behavior:

- rejects platform users and staff emails
- creates a brand-new storefront customer if the email is new
- reuses an existing storefront customer if the email already belongs to a customer account
- logs the resolved customer into the storefront session before the response is returned
- saves the submitted checkout address onto the customer account as the default shipping address
- merges the guest cart into the existing customer cart when the email already belongs to a customer with an active cart
- sends the same order/payment notifications as the standard checkout flow

Example failure response when order creation succeeds but payment initialization fails:

```json
{
  "success": false,
  "message": "Checkout was created, but payment initialization failed.",
  "data": null,
  "errors": {
    "order_id": 101,
    "payment": "Gateway timeout"
  }
}
```

If that happens, the customer session is still established and the storefront can retry payment initialization with the existing authenticated route:

- `POST /api/v1/payments/initialize`

## Storefront Auth

These routes use cookie/session auth and live under the storefront route group.

### CSRF Bootstrap

#### `GET /api/v1/auth/csrf-cookie`

Call this once before any browser session write.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "csrf_token": "abc123...",
    "csrf_cookie": "XSRF-STOREFRONT-TOKEN",
    "csrf_header": "X-XSRF-TOKEN"
  },
  "errors": null
}
```

Use the returned cookie/header names for later requests that mutate session state.

### Session State

#### `GET /api/v1/auth/session`

Example response when authenticated:

```json
{
  "success": true,
  "message": null,
  "data": {
    "authenticated": true,
    "user": {
      "id": 5,
      "name": "Ada Doe",
      "email": "ada@example.test",
      "phone": "+233240000000",
      "status": "active",
      "email_verified_at": "2026-04-10T12:00:00.000000Z",
      "profile_completion_required": false
    },
    "email_verified": true
  },
  "errors": null
}
```

#### `POST /api/v1/auth/logout`

Example response:

```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": {
    "authenticated": false
  },
  "errors": null
}
```

### Magic-Link Auth

Magic link is the primary storefront sign-in flow.

#### `POST /api/v1/auth/magic-link/request`

Request body:

```json
{
  "email": "ada@example.test",
  "cart_token": "cart_8d3f...",
  "redirect_to": "/account"
}
```

Validation:

- `email` required
- `cart_token` optional
- `redirect_to` optional

Example response:

```json
{
  "success": true,
  "message": "If the account is eligible, a sign-in link has been sent.",
  "data": null,
  "errors": null
}
```

Important behavior:

- The request does not reveal whether the account exists.
- Platform users and staff accounts are rejected from this flow.
- The request is rate limited.

#### `GET /api/v1/auth/magic-link/verify?token=...`

This endpoint redirects instead of returning JSON.

Behavior:

- validates the one-time token
- creates the customer if needed
- marks email as verified
- logs the customer into the storefront session
- adopts or merges the guest cart if one was attached
- redirects to the storefront destination

### Password Auth

Password auth is a fallback for customers who already have a password.

#### `POST /api/v1/auth/password/login`

Request body:

```json
{
  "email": "ada@example.test",
  "password": "secret-password",
  "cart_token": "cart_8d3f..."
}
```

Example response:

```json
{
  "success": true,
  "message": "Logged in successfully.",
  "data": {
    "authenticated": true,
    "user": {
      "id": 5,
      "name": "Ada Doe",
      "email": "ada@example.test",
      "phone": "+233240000000",
      "status": "active",
      "email_verified_at": "2026-04-10T12:00:00.000000Z",
      "profile_completion_required": false
    }
  },
  "errors": null
}
```

#### `POST /api/v1/auth/password/forgot`

Request body:

```json
{
  "email": "ada@example.test"
}
```

#### `POST /api/v1/auth/password/reset`

Request body:

```json
{
  "token": "reset-token",
  "email": "ada@example.test",
  "password": "new-secret-password",
  "password_confirmation": "new-secret-password"
}
```

## Customer Routes

These routes require:

- `auth:customer`
- `ensure.storefront.customer`

### Checkout Preview

#### `POST /api/v1/checkout/preview`

Request body:

```json
{
  "address_id": 10,
  "shipping_method_id": 7
}
```

Validation:

- `address_id` required
- `shipping_method_id` required

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "cart": {
      "id": 1,
      "currency": "GHS",
      "items": []
    },
    "address": {
      "id": 10,
      "type": "shipping",
      "name": "Ada Doe",
      "phone": "+233240000000",
      "country": "GH",
      "region": "Greater Accra",
      "city": "Accra",
      "district": "Osu",
      "address_line_1": "12 Market Street",
      "address_line_2": null,
      "landmark": "Near the pharmacy",
      "postal_code": "GA-123-4567",
      "is_default": true,
      "created_at": "2026-04-10T12:00:00.000000Z",
      "updated_at": "2026-04-10T12:00:00.000000Z"
    },
    "shipping_zone": {
      "id": 2,
      "name": "Accra Metro",
      "code": "ACC"
    },
    "shipping_method": {
      "id": 7,
      "name": "Standard Delivery",
      "code": "standard",
      "min_delivery_days": 2,
      "max_delivery_days": 5
    },
    "totals": {
      "subtotal_amount": 500000,
      "discount_amount": 0,
      "tax_amount": 0,
      "shipping_amount": 25000,
      "total_amount": 525000
    }
  },
  "errors": null
}
```

### Create Order

#### `POST /api/v1/checkout/orders`

Request body:

```json
{
  "address_id": 10,
  "shipping_method_id": 7,
  "notes": "Leave at reception",
  "delivery_notes": "Call on arrival"
}
```

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 101,
    "order_number": "ORD-2026-000101",
    "status": "pending",
    "payment_status": "pending",
    "fulfillment_status": "unfulfilled",
    "currency_code": "GHS",
    "subtotal_amount": 500000,
    "discount_amount": 0,
    "tax_amount": 0,
    "shipping_amount": 25000,
    "total_amount": 525000,
    "shipping_zone_name": "Accra Metro",
    "shipping_method_name": "Standard Delivery",
    "notes": "Leave at reception",
    "delivery_notes": "Call on arrival",
    "placed_at": "2026-04-15T12:30:00.000000Z",
    "items": [],
    "shipping_address": {
      "type": "shipping",
      "name": "Ada Doe"
    }
  },
  "errors": null
}
```

### Checkout Initialize

#### `POST /api/v1/checkout/initialize`

Request body:

```json
{
  "address_id": 10,
  "shipping_method_id": 7,
  "payment_provider": "paystack",
  "notes": "Leave at reception",
  "delivery_notes": "Call on arrival",
  "coupon_code": "WELCOME10"
}
```

Validation:

- `address_id` required
- `shipping_method_id` required
- `payment_provider` required, currently `paystack`
- `coupon_code` optional
- `notes` optional
- `delivery_notes` optional

Example success response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "order": {
      "id": 101,
      "order_number": "ORD-2026-000101",
      "status": "pending",
      "payment_status": "pending",
      "fulfillment_status": "unfulfilled",
      "currency_code": "GHS",
      "subtotal_amount": 500000,
      "discount_amount": 0,
      "tax_amount": 0,
      "shipping_amount": 25000,
      "total_amount": 525000,
      "shipping_zone_name": "Accra Metro",
      "shipping_method_name": "Standard Delivery",
      "notes": "Leave at reception",
      "delivery_notes": "Call on arrival",
      "placed_at": "2026-04-15T12:30:00.000000Z",
      "items": [],
      "shipping_address": {
        "type": "shipping",
        "name": "Ada Doe"
      }
    },
    "payment": {
      "provider": "paystack",
      "authorization_url": "https://checkout.paystack.com/...",
      "access_code": "ACCESS_CODE",
      "reference": "PSK-REF-123"
    }
  },
  "errors": null
}
```

Example failure response when order creation succeeds but payment initialization fails:

```json
{
  "success": false,
  "message": "Checkout was created, but payment initialization failed.",
  "data": null,
  "errors": {
    "order_id": 101,
    "payment": "Gateway timeout"
  }
}
```

If that happens, retry payment initialization with:

#### `POST /api/v1/payments/initialize`

Request body:

```json
{
  "order_id": 101
}
```

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "ACCESS_CODE",
    "reference": "PSK-REF-123"
  },
  "errors": null
}
```

### Addresses

#### `GET /api/v1/addresses`

Returns the current customer’s addresses ordered by default first.

#### `POST /api/v1/addresses`

Request body:

```json
{
  "type": "shipping",
  "name": "Ada Doe",
  "phone": "+233240000000",
  "country": "GH",
  "region": "Greater Accra",
  "city": "Accra",
  "district": "Osu",
  "address_line_1": "12 Market Street",
  "address_line_2": null,
  "landmark": "Near the pharmacy",
  "postal_code": "GA-123-4567",
  "is_default": true
}
```

Validation:

- `type` required, `shipping` or `billing`
- `name` required
- `country` required
- `city` required
- `address_line_1` required
- `phone`, `region`, `district`, `address_line_2`, `landmark`, `postal_code` optional
- `is_default` optional

#### `PATCH /api/v1/addresses/{address}`

Same fields as create, all optional except the route parameter.

#### `DELETE /api/v1/addresses/{address}`

Returns a success envelope with `data: null`.

#### `PATCH /api/v1/addresses/{address}/default`

Marks the address as default and returns the updated address resource.

### Orders and Timeline

#### `GET /api/v1/orders`

Returns the authenticated customer’s orders.

Response is paginated and includes `meta`.

#### `GET /api/v1/orders/{order}`

Returns one order only if it belongs to the current customer.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 101,
    "order_number": "ORD-2026-000101",
    "status": "pending",
    "payment_status": "pending",
    "fulfillment_status": "unfulfilled",
    "currency_code": "GHS",
    "subtotal_amount": 500000,
    "discount_amount": 0,
    "tax_amount": 0,
    "shipping_amount": 25000,
    "total_amount": 525000,
    "shipping_zone_name": "Accra Metro",
    "shipping_method_name": "Standard Delivery",
    "notes": "Leave at reception",
    "delivery_notes": "Call on arrival",
    "placed_at": "2026-04-15T12:30:00.000000Z",
    "items": [],
    "shipping_address": {
      "type": "shipping",
      "name": "Ada Doe"
    },
    "shipments": []
  },
  "errors": null
}
```

#### `GET /api/v1/orders/{order}/timeline`

Returns the shipment/order timeline events for the current customer’s order.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "status": "packed",
      "label": "Packed",
      "occurred_at": "2026-04-15T14:00:00.000000Z"
    }
  ],
  "errors": null
}
```

### Payments

#### `POST /api/v1/payments/initialize`

Request body:

```json
{
  "order_id": 101
}
```

Behavior:

- only works for the current customer
- rejects cancelled orders
- rejects already-paid orders
- rejects zero-total orders
- reuses an existing pending payment attempt when possible

### Profile

#### `GET /api/v1/profile`

Returns the current customer profile.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 5,
    "name": "Ada Doe",
    "email": "ada@example.test",
    "phone": "+233240000000",
    "status": "active",
    "email_verified_at": "2026-04-10T12:00:00.000000Z",
    "profile_completion_required": false,
    "notification_preferences": {
      "auth_magic_link": true,
      "auth_verify_email": true,
      "auth_password_reset": true,
      "auth_welcome": true,
      "orders_placed": true,
      "orders_status_updates": true,
      "payments_action_required": true,
      "payments_received": true,
      "shipments_status_updates": true
    }
  },
  "errors": null
}
```

#### `PUT /api/v1/profile`

#### `PATCH /api/v1/profile`

Request body:

```json
{
  "name": "Ada Doe",
  "phone": "+233240000000",
  "email": "ada@example.test",
  "password": "new-secret-password",
  "password_confirmation": "new-secret-password",
  "notification_preferences": {
    "orders_placed": false,
    "payments_received": false
  }
}
```

Validation:

- `name` optional, may be `null`
- `phone` optional
- `email` optional, must be unique
- `password` optional, minimum 8 characters, confirmed
- `notification_preferences` optional object of boolean flags

If the email changes, email verification is cleared.

## Cart Continuity

Guest carts and customer carts are linked through the `X-Cart-Token` header.

The storefront should:

- preserve the guest cart token in browser storage
- send the token on cart and checkout requests
- pass the token into magic-link and password login requests when available

When login succeeds:

- if the customer has no active cart, the guest cart is adopted
- if the customer already has an active cart, line items are merged by product and variant
- the guest cart is marked merged

This is automatic on the backend. The storefront should not merge carts itself.

## Common Error Responses

The storefront should expect these common messages:

- `Unauthenticated.`
- `This account is not available on the storefront.`
- `Address not found.`
- `Order not found.`
- `Order is already paid.`
- `Order is cancelled.`
- `Order total must be greater than zero.`
- `CSRF token mismatch.`

Validation failures return the `errors` envelope.

## Recommended Storefront Flow

1. Call `GET /api/v1/auth/csrf-cookie` on app bootstrap.
2. Call `GET /api/v1/auth/session` to determine auth state.
3. Browse catalog and build the guest cart.
4. Resolve shipping methods with the shipping endpoint.
5. Preview checkout.
6. If authenticated, use standard checkout preview/create/initialize.
7. If not authenticated, use guest checkout initialize with the guest cart token and shipping/contact details.
8. Redirect to the payment provider if needed.
9. Poll order detail or timeline after return from payment.

## Current Limitations

- Coupon application endpoints exist in the route surface, but the controller is still a placeholder.
- The storefront should not depend on admin-only routes or admin session state.
