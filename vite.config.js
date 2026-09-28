import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

// On Vercel, each file in /api is a server function. In `vite dev` nothing
// serves them, so this runs the same files in the dev server: a request to
// /api/<name> calls the GET/POST/DELETE export of api/<name>.mjs with a
// standard Request and streams back its Response. Secrets for them come from
// .env (never VITE_-prefixed, so they stay out of the browser bundle).
function apiFunctions(mode) {
  return {
    name: "api-functions",
    configureServer(server) {
      Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const name = /^\/api\/([\w-]+)$/.exec(url.pathname)?.[1];
        const file = name && path.resolve("api", `${name}.mjs`);
        if (!file || !fs.existsSync(file)) return next();
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const request = new Request(url, {
            method: req.method,
            headers: req.headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.ssrFixStacktrace?.(e);
          console.error(e);
          res.statusCode = 500;
          res.end(String(e?.message || e));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: "build",
    },
    plugins: [react(), apiFunctions(mode)],
  };
});
