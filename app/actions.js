"use server";

import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createReport, countRecentFromIp, getReportByRef } from "@/lib/db";
import { TYPES, CATEGORIES } from "@/lib/constants";
import { formatTime } from "@/lib/format";

const MAX_REPORTS_PER_10_MIN = 5;
const MAX_AUDIO_BYTES = 700 * 1024;
const COORDS_RE = /^-?\d{1,3}(\.\d+)?,\s?-?\d{1,3}(\.\d+)?$/;

// Only accept real audio: check the file's own header instead of trusting the browser's label.
function sniffAudio(b) {
  const at = (i, str) => str.split("").every((ch, k) => b[i + k] === ch.charCodeAt(0));
  if (b.length < 16) return null;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "audio/webm";
  if (at(4, "ftyp")) return "audio/mp4";
  if (at(0, "OggS")) return "audio/ogg";
  if (at(0, "RIFF") && at(8, "WAVE")) return "audio/wav";
  if (at(0, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return "audio/mpeg";
  return null;
}

async function readVoice(formData) {
  const f = formData.get("voice");
  if (!f || typeof f === "string" || !f.size) return { audio: null };
  if (f.size > MAX_AUDIO_BYTES) return { error: "audiotoolong" };
  const bytes = new Uint8Array(await f.arrayBuffer());
  const mime = sniffAudio(bytes);
  if (!mime) return { error: "audiobad" };
  const seconds = Math.max(0, Math.min(60, parseInt(String(formData.get("voiceSeconds") || "0"), 10) || 0));
  return { audio: { mime, bytes, seconds } };
}

async function ipHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "";
  if (!ip) return null;
  return createHash("sha256")
    .update(ip + (process.env.SESSION_SECRET || "bantaybarangay"))
    .digest("hex")
    .slice(0, 32);
}

// Returns { ok: true, ref } or { ok: false, code } where `code` is a key in the
// translated `errors` text, so the page can show the message in the user's language.
export async function submitReport(prevState, formData) {
  // Honeypot: real people never fill this hidden field.
  if (formData.get("website")) {
    return { ok: true, ref: "BB-000000" };
  }

  const categoryId = String(formData.get("category") || "");
  const typeId = String(formData.get("type") || "");
  const location = String(formData.get("location") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const reporterName = String(formData.get("reporterName") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  let coords = String(formData.get("coords") || "").trim();

  if (!CATEGORIES.some((c) => c.id === categoryId)) return { ok: false, code: "category" };
  // The type decides the category, and it must match what the person chose.
  const typeInfo = TYPES.find((t) => t.id === typeId && t.category === categoryId);
  if (!typeInfo) return { ok: false, code: "type" };
  const type = typeInfo.label;
  if (location.length < 3) return { ok: false, code: "location" };
  const voice = await readVoice(formData);
  if (voice.error) return { ok: false, code: voice.error };
  // A voice message can replace the written description.
  if (description.length < 5 && !voice.audio) return { ok: false, code: "description" };
  if (
    location.length > 300 ||
    description.length > 3000 ||
    reporterName.length > 100 ||
    contact.length > 100
  ) {
    return { ok: false, code: "toolong" };
  }
  if (!COORDS_RE.test(coords)) coords = "";

  try {
    const hash = await ipHash();
    if (hash && (await countRecentFromIp(hash)) >= MAX_REPORTS_PER_10_MIN) {
      return { ok: false, code: "rate" };
    }
    const ref = await createReport({
      type,
      category: categoryId,
      location,
      coords,
      description: description.length >= 5 ? description : "(Voice message only)",
      reporterName,
      contact,
      ipHash: hash,
      audio: voice.audio,
    });
    return { ok: true, ref, category: categoryId };
  } catch (err) {
    console.error("Failed to save report", err);
    return { ok: false, code: "server" };
  }
}

// Lets a reporter look up their own report with the reference number they were given.
// Only the status and the barangay's message are returned, never the report details.
export async function trackReport(prevState, formData) {
  let ref = String(formData.get("ref") || "").trim().toUpperCase().replace(/\s+/g, "");
  if (ref && !ref.startsWith("BB-")) ref = `BB-${ref}`;

  if (!/^BB-[A-Z0-9]{6}$/.test(ref)) return { found: false, code: "invalid", ref };

  try {
    const r = await getReportByRef(ref);
    if (!r) return { found: false, code: "notfound", ref };
    return {
      found: true,
      ref: r.ref_code,
      type: r.type,
      status: r.status === "new" ? "pending" : r.status,
      note: r.admin_note || "",
      createdAt: formatTime(r.created_at),
      updatedAt: r.updated_at ? formatTime(r.updated_at) : "",
    };
  } catch (err) {
    console.error("Failed to look up report", err);
    return { found: false, code: "server", ref };
  }
}
