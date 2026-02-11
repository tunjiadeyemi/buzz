# Buzz

Buzz is a two-part project:

- `buzz-backend`: A fully typed Hono + OpenAPI JSON API with Drizzle ORM + supabase.
- `buzz-frontend`: A SvelteKit frontend (landing page) plus the browser-extension UI/assets.

This top-level README explains how to run each part independently or together.

## About

Buzz is a browser extension and API that generate short quizzes from the content of your current tab.

Core features:

- Generate quiz questions from a page URL or page text
- Optional AI provider key support
- Local dev-friendly setup with a simple API

Tech stack:

- Backend: Hono, OpenAPI, Drizzle ORM, SQLite
- Frontend: SvelteKit, Chrome extension

Architecture:

- The extension gathers page context and calls the API (`POST /question`).
- The backend returns generated questions for the extension UI.

## Repositories

- [github.com/tunjiadeyemi/buzz-backend](https://github.com/tunjiadeyemi/buzz-backend)
- [github.com/tunjiadeyemi/buzz-frontend](https://github.com/tunjiadeyemi/buzz-frontend)

## Links

- Landing page: https://tunny-buzz.netlify.app/

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

## How to deploy your version on chrome store

1. revisit the manifest.json and edit whatever you feel you need to change
2. here's a step-by-step guide for the chrome store developer dashboard: https://developer.chrome.com/docs/webstore/publish
