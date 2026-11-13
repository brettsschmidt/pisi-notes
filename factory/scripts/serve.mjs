#!/usr/bin/env node
// Local dashboard for the software factory. Binds to 127.0.0.1 only.
//   node factory/scripts/serve.mjs [--port 4319] [--state <dir>]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import * as f from "./lib.mjs";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (arg("state")) f.setStateDir(arg("state"));
const port = Number(arg("port") || process.env.PORT || f.loadConfig().dashboard?.port || 4319);
const page = path.join(f.FACTORY_DIR, "dashboard", "index.html");

function send(res, status, body, type = "application/json") {
  const payload = type === "application/json" ? JSON.stringify(body) : body;
  res.writeHead(status, { "content-type": `${type}; charset=utf-8`, "cache-control": "no-store" });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

// Writes only from this page: another site open in the browser must not be
// able to steer the factory.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname) && Number(url.port) === port;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = url.pathname;
  try {
    if (req.method === "GET" && (route === "/" || route === "/index.html")) {
      return send(res, 200, fs.readFileSync(page, "utf8"), "text/html");
    }
    if (req.method === "GET" && route === "/api/state") {
      return send(res, 200, f.dashboardState());
    }
    const diff = route.match(/^\/api\/items\/([\w-]+)\/diff$/);
    if (req.method === "GET" && diff) {
      return send(res, 200, f.itemDiff(diff[1]), "text/plain");
    }

    if (req.method === "POST") {
      if (!sameOrigin(req) || !/application\/json/.test(req.headers["content-type"] || "")) {
        return send(res, 403, { error: "Forbidden" });
      }
      const body = await readBody(req);
      if (route === "/api/items") {
        return send(res, 200, f.addItem(body, "human"));
      }
      const status = route.match(/^\/api\/items\/([\w-]+)\/status$/);
      if (status) {
        return send(res, 200, f.setItemStatus(status[1], body.status, { by: "human", note: body.note }));
      }
      if (route === "/api/control") {
        return send(res, 200, f.setPaused(Boolean(body.paused), body.reason, "human"));
      }
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 400, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Factory dashboard: http://localhost:${port}`);
});
