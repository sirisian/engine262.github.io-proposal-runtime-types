/// <reference path="node_modules/@types/node/index.d.ts" />
import { createAdaptorServer } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type { Context } from "hono";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { proxy } from "hono/proxy";
import { request as httpRequest, type IncomingMessage } from "node:http";
import { resolve } from "node:path";
import type { Duplex } from "node:stream";

const website = resolve(import.meta.dirname, "..");
const dist = resolve(website, "dist");
const engine262Lib = resolve(website, "lib", "engine262", "lib");
const port = Number(process.env.PORT ?? 1262);
const dev = process.argv[2] === "dev";
const docsProxy = (c: Context) => {
  const url = new URL(c.req.url);
  url.hostname = "localhost";
  url.port = "10262";
  return proxy(url, { raw: c.req.raw });
};
const formatHeaders = (headers: readonly string[]) => {
  const lines = [];
  for (let i = 0; i < headers.length; i += 2) {
    lines.push(`${headers[i]}: ${headers[i + 1]}`);
  }
  return lines.join("\r\n");
};
const proxyDocsWebSocket = (request: IncomingMessage, socket: Duplex, head: Buffer) => {
  if (!dev || !request.url?.startsWith("/docs/")) return;

  const upstream = httpRequest({
    hostname: "127.0.0.1",
    port: 10262,
    path: request.url,
    method: request.method,
    headers: { ...request.headers, host: "localhost:10262" },
    agent: false,
  });

  upstream.on("upgrade", (response, upstreamSocket, upstreamHead) => {
    const headers = response.rawHeaders;
    socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n${formatHeaders(headers)}\r\n\r\n`);
    if (head.length > 0) upstreamSocket.write(head);
    if (upstreamHead.length > 0) socket.write(upstreamHead);
    socket.pipe(upstreamSocket).pipe(socket);
  });

  upstream.on("response", (response) => {
    socket.write(
      `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n${formatHeaders(response.rawHeaders)}\r\n\r\n`,
    );
    response.pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  upstream.end();
};

const app = new Hono().use(etag()).use(compress());

if (dev) {
  app.all("/docs", docsProxy).all("/docs/*", docsProxy).all("/__nextjs_original-stack-frames", docsProxy);
}

app
  .get("/engine262/engine262.mjs", serveStatic({ root: engine262Lib, path: "engine262.mjs" }))
  .get("/engine262/inspector.mjs", serveStatic({ root: engine262Lib, path: "inspector.mjs" }))
  .use(serveStatic({ root: dist }));

const server = createAdaptorServer({ fetch: app.fetch });
if (dev) server.on("upgrade", proxyDocsWebSocket);
server.listen(port, () => {
  const address = server.address();
  const listeningPort = typeof address === "object" && address ? address.port : port;
  console.log(`Serving engine262.js.org at http://localhost:${listeningPort}`);
});
