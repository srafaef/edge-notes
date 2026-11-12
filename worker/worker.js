/**
 * Edge Notes API — Cloudflare Worker
 *
 * Browser (Render) -> this Worker -> Neon Postgres (HTTP SQL endpoint)
 *
 * Secret: DATABASE_URL (Neon connection string, set with `wrangler secret put`
 * or the Cloudflare MCP `workers_secrets_update` tool).
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

async function query(env, sql, params = []) {
  const target = new URL(env.DATABASE_URL);
  const res = await fetch(`https://${target.host}/sql`, {
    method: "POST",
    headers: {
      "Neon-Connection-String": env.DATABASE_URL,
      "Neon-Content-Type": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql, params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Neon SQL error ${res.status}`);
  return data;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      if (url.pathname === "/" || url.pathname === "/health") {
        return json({ ok: true, service: "edge-notes-api", ts: new Date().toISOString() });
      }

      if (url.pathname === "/api/notes" && request.method === "GET") {
        const { rows } = await query(
          env,
          `select id, title, content, created_at
             from notes
            order by created_at desc
            limit 100`,
        );
        return json({ notes: rows });
      }

      if (url.pathname === "/api/notes" && request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const title = String(body.title ?? "").slice(0, 200).trim();
        const content = String(body.content ?? "").slice(0, 5000).trim();
        if (!title && !content) {
          return json({ error: "title veya content gerekli" }, 400);
        }
        const { rows } = await query(
          env,
          `insert into notes (title, content)
           values ($1, $2)
           returning id, title, content, created_at`,
          [title, content],
        );
        return json({ note: rows[0] }, 201);
      }

      const match = url.pathname.match(/^\/api\/notes\/([0-9a-fA-F-]{36})$/);
      if (match && request.method === "DELETE") {
        await query(env, "delete from notes where id = $1", [match[1]]);
        return json({ ok: true });
      }

      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err?.message || err) }, 500);
    }
  },
};
