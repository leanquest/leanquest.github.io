import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function availablePort() {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const address = socket.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function render(t) {
  const port = await availablePort();
  const output = [];
  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (chunk) => output.push(chunk));
  server.stderr.on("data", (chunk) => output.push(chunk));
  t.after(async () => {
    if (server.exitCode !== null) return;
    server.kill("SIGTERM");
    await Promise.race([once(server, "exit"), delay(5_000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  });

  const url = `http://127.0.0.1:${port}/`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) break;
    try {
      return await fetch(url, { headers: { accept: "text/html" } });
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Next.js server did not become ready:\n${Buffer.concat(output).toString("utf8")}`);
}

test("server-renders LeanQuest", async (t) => {
  const response = await render(t);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>LeanQuest — The Proof Dungeon<\/title>/i);
  assert.match(html, /ENTERING THE DUNGEON/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
