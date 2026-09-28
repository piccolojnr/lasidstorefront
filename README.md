# Backthred Storefront

Customer-facing storefront for Backthred, built with Astro (SSR), React, Tailwind and shadcn/ui.
Talks to the Laravel backend in [lasidcommerce](https://github.com/piccolojnr/lasidcommerce).

## Local development

```sh
pnpm install
cp .env.example .env   # set PUBLIC_API_BASE
pnpm dev               # http://localhost:4321
```

## Environment

These are baked into the build, so changing them requires a rebuild:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_API_BASE` | Backend API URL, e.g. `https://api.backthred.com/api/v1` |
| `PUBLIC_SERVER_API_BASE` | Optional. Separate API URL for server-side requests |
| `PUBLIC_SITE_URL` | Public URL of the storefront |

## Deployment

Pushing to `master` builds a Docker image and publishes it to
`ghcr.io/piccolojnr/backthred/storefront`. On the server:

```sh
cd docker
docker compose pull
docker compose up -d
```
