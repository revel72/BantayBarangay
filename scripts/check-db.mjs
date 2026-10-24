// Checks that the database settings work BEFORE you deploy.
//
// Local file (no setup):    npm run check-db
// Your Turso database (PowerShell):
//   $env:TURSO_DATABASE_URL = "libsql://your-db-name.turso.io"
//   $env:TURSO_AUTH_TOKEN   = "your-token"
//   npm run check-db
//
// It connects, creates the reports table if needed, and prints how many reports exist.
// It does NOT add any demo data.
import { getDb } from "../lib/db.js";

const url = process.env.TURSO_DATABASE_URL;
let host = "local.db (a file on this computer)";
if (url) {
  try {
    host = new URL(url.replace(/^libsql:/, "https:")).host;
  } catch {
    host = "(that URL is not valid)";
  }
}
console.log(`Checking database: ${host}`);

try {
  const db = await getDb();
  const res = await db.execute("SELECT COUNT(*) AS n FROM reports");
  const emergencies = await db.execute(
    "SELECT COUNT(*) AS n FROM reports WHERE category = 'emergency' AND status = 'pending'"
  );
  console.log(`OK: connected. ${res.rows[0].n} report(s) stored, ${emergencies.rows[0].n} emergency report(s) waiting.`);
  if (!url) {
    console.log("Note: no TURSO_DATABASE_URL set, so this checked the local file. Set it to test Turso.");
  }
  process.exit(0);
} catch (err) {
  const msg = String(err?.message || err);
  console.error(`FAILED: ${msg}`);
  if (/401|unauthor|auth|token|jwt/i.test(msg)) {
    console.error("Hint: the token looks wrong or expired. Create a new token for this database and try again.");
  } else if (/ENOTFOUND|getaddrinfo|fetch failed|ECONNREFUSED|invalid url|not valid/i.test(msg)) {
    console.error("Hint: the URL looks wrong or the internet is down. It should look like libsql://name-yourorg.turso.io");
  } else if (/404|not found/i.test(msg)) {
    console.error("Hint: the database name in the URL may be wrong, or it is not a libSQL database.");
  }
  process.exit(1);
}
