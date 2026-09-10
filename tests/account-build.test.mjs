import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("packages customer authentication and Supabase hosting configuration", async () => {
  const [workerSource, hostingSource] = await Promise.all([
    readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
    readFile(new URL("../dist/.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  const hosting = JSON.parse(hostingSource);

  assert.match(workerSource, /SUPABASE_URL/);
  assert.match(workerSource, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(workerSource, /Account services are not configured/);
  assert.equal(hosting.d1, null);
  assert.equal(typeof hosting.project_id, "string");
  assert.ok(hosting.project_id.length > 0);
});
