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
- `POST /api/v1/auth/magic-link/verify`
- `POST /api/v1/auth/password/login`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`
- `POST /api/v1/checkout/guest/initialize`

## Public APIs

These routes are available without a customer session.

### Storefront Announcement

#### `GET /api/v1/storefront/announcement`

Returns the currently active header announcement. The `enabled` field is
`false` when the announcement is disabled or outside its scheduled dates.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "enabled": true,
    "message": "Free next-day delivery in Accra & Kumasi on orders above GHC 250",
    "cta": {
      "label": "Shop now",
      "url": "/products"
    },
    "variant": "default",
    "starts_at": null,
    "ends_at": null
  },
  "errors": null
}
```

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
- `tag` optional
- `collection` optional
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
      "badges": [
        {
          "key": "new_arrival",
          "label": "New arrival"
        },
        {
          "key": "on_sale",
          "label": "On sale"
        }
      ],
      "stock": {
        "quantity": 3,
        "status": "low_stock",
        "is_backorderable": false
      },
      "primary_image_url": "https://cdn.example.test/products/sp-001.jpg",
      "primary_image_thumb_url": "https://cdn.example.test/products/conversions/sp-001-thumb.jpg",
      "primary_image_card_url": "https://cdn.example.test/products/conversions/sp-001-card.jpg",
      "primary_image_gallery_url": "https://cdn.example.test/products/conversions/sp-001-gallery.jpg",
      "category": {
        "id": 1,
        "name": "Electronics",
        "slug": "electronics"
      },
      "brand": {
        "id": 3,
        "name": "Acme",
        "slug": "acme"
      },
      "tags": [
        {
          "id": 8,
          "name": "Editor Pick",
          "slug": "editor-pick"
        }
      ],
      "collections": [
        {
          "id": 4,
          "name": "Top Picks",
          "slug": "top-picks"
        }
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

Image behavior:

- `primary_image_url` remains the original image URL for backward compatibility.
- `primary_image_thumb_url`, `primary_image_card_url`, and `primary_image_gallery_url` expose conversion-specific URLs for storefront rendering.
- If a queued conversion is not ready yet, the backend falls back to the original image URL for that conversion field.

#### `GET /api/v1/catalog/products/{slug}`

Returns a single product with related products.

The response includes a computed `stock` object with:

- `quantity`: summed available quantity across the product's loaded stock items
- `status`: one of `in_stock`, `low_stock`, or `out_of_stock`
- `is_backorderable`: whether the product currently allows purchases beyond on-hand stock

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
    "badges": [
      {
        "key": "new_arrival",
        "label": "New arrival"
      },
      {
        "key": "on_sale",
        "label": "On sale"
      }
    ],
    "stock": {
      "quantity": 3,
      "status": "low_stock",
      "is_backorderable": false
    },
    "track_inventory": true,
    "allow_backorders": false,
    "published_at": "2026-04-01T08:00:00.000000Z",
    "images": [
      {
        "id": 99,
        "url": "https://cdn.example.test/products/sp-001.jpg",
        "thumb_url": "https://cdn.example.test/products/conversions/sp-001-thumb.jpg",
        "card_url": "https://cdn.example.test/products/conversions/sp-001-card.jpg",
        "gallery_url": "https://cdn.example.test/products/conversions/sp-001-gallery.jpg",
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
    "tags": [
      {
        "id": 8,
        "name": "Editor Pick",
        "slug": "editor-pick",
        "description": "Manual highlights for strong merchandising placements."
      }
    ],
    "collections": [
      {
        "id": 4,
        "name": "Top Picks",
        "slug": "top-picks",
        "description": "Manual highlights spanning the strongest seeded products.",
        "sort_order": 10
      }
    ],
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

Image behavior:

- `url` remains the original image URL for backward compatibility.
- `thumb_url`, `card_url`, and `gallery_url` expose conversion-specific URLs for product galleries and cards.
- If a queued conversion is not ready yet, the backend falls back to the original image URL for that conversion field.

Computed badge behavior:

- `new_arrival` is derived from `published_at` and the backend-configured new-arrival window
- `on_sale` is derived from `compare_at_price > base_price`

#### `GET /api/v1/catalog/tags`

Returns active storefront tags ordered by name.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 8,
      "name": "Editor Pick",
      "slug": "editor-pick",
      "description": "Manual highlights for strong merchandising placements.",
      "products_count": 6
    }
  ],
  "errors": null
}
```

#### `GET /api/v1/catalog/tags/{slug}`

Returns one active tag plus paginated products assigned to it.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "tag": {
      "id": 8,
      "name": "Editor Pick",
      "slug": "editor-pick",
      "description": "Manual highlights for strong merchandising placements.",
      "products_count": 6
    },
    "products": [],
    "products_meta": {
      "current_page": 1,
      "from": null,
      "last_page": 1,
      "path": "https://example.test/api/v1/catalog/tags/editor-pick",
      "per_page": 20,
      "to": null,
      "total": 0
    }
  },
  "errors": null
}
```

The `products` array in this response uses the same product-list shape as `GET /api/v1/catalog/products`, including:

- `stock`
- `primary_image_url`
- `primary_image_thumb_url`
- `primary_image_card_url`
- `primary_image_gallery_url`

#### `GET /api/v1/catalog/collections`

Returns active curated collections ordered by `sort_order`, then name.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 4,
      "name": "Top Picks",
      "slug": "top-picks",
      "description": "Manual highlights spanning the strongest seeded products.",
      "sort_order": 50,
      "products_count": 6
    }
  ],
  "errors": null
}
```

#### `GET /api/v1/catalog/collections/{slug}`

Returns one active collection plus paginated products assigned to it.

Example response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "collection": {
      "id": 4,
      "name": "Top Picks",
      "slug": "top-picks",
      "description": "Manual highlights spanning the strongest seeded products.",
      "sort_order": 50,
      "products_count": 6
    },
    "products": [],
    "products_meta": {
      "current_page": 1,
      "from": null,
      "last_page": 1,
      "path": "https://example.test/api/v1/catalog/collections/top-picks",
      "per_page": 20,
      "to": null,
      "total": 0
    }
  },
  "errors": null
}
```

The `products` array in this response uses the same product-list shape as `GET /api/v1/catalog/products`, including:

- `stock`
- `primary_image_url`
- `primary_image_thumb_url`
- `primary_image_card_url`
- `primary_image_gallery_url`

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
        "produ
```
