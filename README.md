# Edge Notes — Render -> Cloudflare Worker -> Neon

A tiny full-stack demo showing a three-layer architecture:

```
Browser
   |
   v
Render (static site: index.html + JS)
   |
   v
Cloudflare Worker (edge API, CORS, validation)
   |
   v
Neon Postgres (HTTP SQL endpoint, DATABASE_URL secret)
```

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

## Deploy

```bash
# Worker
cd worker
npx wrangler login
npx wrangler secret put DATABASE_URL   # paste Neon connection string
npx wrangler deploy

# Site: Render static site
#   repo:  <this repo>
#   build: echo "no build"
#   publish: web
```
