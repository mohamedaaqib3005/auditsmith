// scripts/env.js
// Loads KEY=value lines from a local .env file (if present) into
// process.env, without overriding values already set on the command line.
// .env is gitignored: keys live on your machine only, never in the repo.
import fs from "fs";
try {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}
