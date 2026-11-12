# Edge Notes — Render → Cloudflare Worker → Neon

A tiny full-stack demo showing a three-layer architecture:

```
Browser
   |
   v
Render (static site: index.html + JS)   https://edge-notes.onrender.com
   |
   v
Cloudflare Worker (edge API, CORS)      https://edge-notes-api.bakisinesimdi.workers.dev
   |
   v
Neon Postgres (HTTP SQL endpoint)       project `edge-notes` / table `notes`
```

## Live

| Layer  | URL |
| ------ | --- |
| Site   | https://edge-notes.onrender.com |
| API    | https://edge-notes-api.bakisinesimdi.workers.dev |
| Health | https://edge-notes-api.bakisinesimdi.workers.dev/health |

## Layout

- `web/` — static site deployed on Render (static site, publish path `web`)
- `worker/` — Cloudflare Worker API

## API

| Method | Path             | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/api/notes`     | List latest 100    |
| POST   | `/api/notes`     | Create a note      |
| DELETE | `/api/notes/:id` | Delete a note      |
| GET    | `/health`        | Health check       |

## Secrets

Nothing sensitive lives in this repo. The Neon connection string is stored as an
encrypted Worker secret:

```bash
cd worker
npx wrangler secret put DATABASE_URL   # paste the Neon connection string
```

`web/config.js` only contains the public Worker URL.

## Deploy

```bash
# Worker
cd worker
npx wrangler login
npx wrangler deploy

# Site: Render static site
#   repo:    https://github.com/srafaef/edge-notes
#   branch:  master
#   build:   echo static-site-no-build
#   publish: web
```

## Notes

- The demo is public: anyone with the URL can read/write/delete notes. Add auth
  (e.g. a Worker secret header check or Cloudflare Access) before real use.
