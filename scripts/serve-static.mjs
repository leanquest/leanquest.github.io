// Copyright 2026 Adam Petcher (to the extent copyright subsists)
// SPDX-License-Identifier: Apache-2.0

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const exportRoot = fileURLToPath(new URL("../out", import.meta.url));
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mid": "audio/midi",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const relativePath = pathname.replace(/^\/+/, "") || "index.html";
    let filePath = join(exportRoot, relativePath);
    if (filePath !== exportRoot && !filePath.startsWith(`${exportRoot}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`LeanQuest static export: http://127.0.0.1:${port}`);
});
