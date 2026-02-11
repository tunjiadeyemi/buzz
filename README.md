# Buzz

Buzz is a two-part project:

- `buzz-backend`: A fully typed Hono + OpenAPI JSON API with Drizzle ORM + supabase.
- `buzz-frontend`: A SvelteKit frontend (landing page) plus the browser-extension UI/assets.

This top-level README explains how to run each part independently or together.

## Repositories

- [github.com/tunjiadeyemi/buzz-backend](https://github.com/tunjiadeyemi/buzz-backend)
- [github.com/tunjiadeyemi/buzz-frontend](https://github.com/tunjiadeyemi/buzz-frontend)

## Clone both repositories

```sh
git clone https://github.com/tunjiadeyemi/buzz-backend.git
git clone https://github.com/tunjiadeyemi/buzz-frontend.git
```

## Repo layout

- `buzz-backend/` API service
- `buzz-frontend/` landing page and extension

## Prerequisites

- Node.js (LTS recommended)
- pnpm (recommended; both repos include `pnpm-lock.yaml`)

## Quick start (backend only)

```sh
cd buzz-backend
cp .env.example .env
pnpm install
pnpm drizzle-kit push
pnpm dev
```

The API will start on the port defined in `.env` (default is `9999`).

## Landing page (optional)

```sh
cd buzz-frontend
pnpm install
pnpm dev
```

This starts the SvelteKit dev server.

## Load extension

1. Open a terminal and run `npm run build`.
2. Open Chrome and go to "Manage extensions".
3. Click "Load unpacked".
4. Select the `buzz-frontend/client` folder.

### Note
Edits in the `client` folder require a manual extension refresh in Chrome. There is no live reload. Also apply the same changes to the original source files before committing.

## Run both together (local dev)

1. Start the backend as above (default `http://localhost:9999`).
2. Point the frontend extension API URL to your local backend:
   - Update `API_URL` in:
     - `/client/api.js`
   - Example:
     ```js
     const API_URL = 'http://localhost:9999';
     ```
3. Refresh the extension in Chrome.
4. Test on a webpage.

