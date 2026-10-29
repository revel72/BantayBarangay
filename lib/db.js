import { randomBytes } from "node:crypto";
import { categoryOfLabel } from "./constants.js";

// Local dev: a SQLite file (local.db).
// Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. Turso recommends the "web"
// (HTTP) client on Vercel because it needs no native code; it cannot open local files.
let clientPromise;
function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = process.env.TURSO_DATABASE_URL;
      const { createClient } = url ? await import("@libsql/client/web") : await import("@libsql/client");
      return createClient({ url: url || "file:local.db", authToken: process.env.TURSO_AUTH_TOKEN });
    })();
  }
  return clientPromise;
}

// No 0/O/1/I/L so a reference number is easy to read out over the phone.
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeRef() {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `BB-${out}`;
}

async function init() {
  const client = await getClient();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      reporter_name TEXT,
      contact TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      category TEXT NOT NULL DEFAULT 'emergency',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Upgrade older databases that were created before these columns existed.
  const info = await client.execute("PRAGMA table_info(reports)");
  const have = new Set(info.rows.map((r) => r.name));

  if (!have.has("category")) {
    try {
      await client.execute("ALTER TABLE reports ADD COLUMN category TEXT NOT NULL DEFAULT 'emergency'");
      // Older reports used a plain "Other" type, which is now the non-emergency "Other concern".
      await client.execute(
        "UPDATE reports SET category = 'non_emergency', type = 'Other concern' WHERE type = 'Other'"
      );
    } catch (err) {
      if (!/duplicate column/i.test(String(err))) throw err;
    }
  }
  for (const [name, def] of [
    ["ref_code", "TEXT"],
    ["coords", "TEXT"],
    ["admin_note", "TEXT"],
    ["updated_at", "TEXT"],
    ["ip_hash", "TEXT"],
  ]) {
    if (!have.has(name)) {
      try {
        await client.execute(`ALTER TABLE reports ADD COLUMN ${name} ${def}`);
      } catch (err) {
        if (!/duplicate column/i.test(String(err))) throw err;
      }
    }
  }

  await client.execute("UPDATE reports SET status = 'pending' WHERE status = 'new'");

  const missing = await client.execute("SELECT id FROM reports WHERE ref_code IS NULL");
  for (const row of missing.rows) {
    await client.execute({
      sql: "UPDATE reports SET ref_code = ? WHERE id = ?",
      args: [makeRef(), row.id],
    });
  }
  // Voice clips live in their own table so the report list stays light.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS report_audio (
      report_id INTEGER PRIMARY KEY,
      mime TEXT NOT NULL,
      seconds INTEGER,
      data BLOB NOT NULL
    )
  `);
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_ref ON reports(ref_code)");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_reports_alert ON reports(category, status)");
}

let ready;

export function getDb() {
  // Vercel's disk is read-only and wiped between requests, so a local file can never work there.
  if (process.env.VERCEL && !process.env.TURSO_DATABASE_URL) {
    return Promise.reject(
      new Error(
        "TURSO_DATABASE_URL is not set. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel > Settings > Environment Variables, then redeploy."
      )
    );
  }
  if (!ready) {
    ready = init().catch((err) => {
      ready = null; // allow a retry on the next request
      throw err;
    });
  }
  return ready.then(() => getClient());
}

export async function createReport({
  type,
  category,
  location,
  coords,
  description,
  reporterName,
  contact,
  ipHash,
  createdAt, // optional, only used by the seed script
  audio, // optional { mime, bytes: Uint8Array, seconds }
}) {
  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = makeRef();
    try {
      const inserted = await db.execute({
        sql: `INSERT INTO reports
                (ref_code, type, category, location, coords, description, reporter_name, contact, ip_hash, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', COALESCE(?, datetime('now')))`,
        args: [
          ref,
          type,
          category || categoryOfLabel(type),
          location,
          coords || null,
          description,
          reporterName || null,
          contact || null,
          ipHash || null,
          createdAt || null,
        ],
      });
      if (audio) {
        try {
          await db.execute({
            sql: "INSERT INTO report_audio (report_id, mime, seconds, data) VALUES (?, ?, ?, ?)",
            args: [Number(inserted.lastInsertRowid), audio.mime, audio.seconds ?? null, audio.bytes],
          });
        } catch (err) {
          // The written report is still saved even if the clip could not be.
          console.error("Failed to save voice clip", err);
        }
      }
      return ref;
    } catch (err) {
      if (!/UNIQUE/i.test(String(err))) throw err;
    }
  }
  throw new Error("Could not generate a unique reference number");
}

export async function countRecentFromIp(ipHash, minutes = 10) {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM reports WHERE ip_hash = ? AND created_at >= datetime('now', ?)",
    args: [ipHash, `-${Number(minutes)} minutes`],
  });
  return Number(res.rows[0].c);
}

export async function getReportByRef(ref) {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT ref_code, type, status, admin_note, created_at, updated_at
          FROM reports WHERE ref_code = ?`,
    args: [ref],
  });
  return res.rows[0] || null;
}

export async function listReports() {
  const db = await getDb();
  const res = await db.execute(
    `SELECT r.*, a.seconds AS audio_seconds, (a.report_id IS NOT NULL) AS has_audio
     FROM reports r LEFT JOIN report_audio a ON a.report_id = r.id
     ORDER BY r.created_at DESC, r.id DESC`
  );
  return res.rows;
}

// Emergencies nobody has started handling yet, oldest first. These drive the admin alarm.
export async function listPendingEmergencies() {
  const db = await getDb();
  const res = await db.execute(
    `SELECT id, ref_code, type, location, created_at FROM reports
     WHERE category = 'emergency' AND status = 'pending'
     ORDER BY created_at ASC, id ASC`
  );
  return res.rows;
}

export async function setReportStatus(id, status) {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE reports SET status = ?, updated_at = datetime('now') WHERE id = ?",
    args: [status, id],
  });
}

export async function setReportNote(id, note) {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE reports SET admin_note = ?, updated_at = datetime('now') WHERE id = ?",
    args: [note || null, id],
  });
}

export async function deleteReport(id) {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM report_audio WHERE report_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM reports WHERE id = ?", args: [id] });
}

export async function getReportAudio(id) {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT mime, data FROM report_audio WHERE report_id = ?",
    args: [id],
  });
  const row = res.rows[0];
  if (!row) return null;
  return { mime: String(row.mime), bytes: new Uint8Array(row.data) };
}
