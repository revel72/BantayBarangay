import { getSession } from "@/lib/session";
import { getReportAudio } from "@/lib/db";

// Plays a report's voice clip. Admin only. Supports Range requests, which Safari needs to play audio.
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });

  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return new Response("Not found", { status: 404 });

  const clip = await getReportAudio(n);
  if (!clip) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const total = clip.bytes.length;
  const base = {
    "Content-Type": clip.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };

  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (m && (m[1] || m[2])) {
    let start = m[1] === "" ? total - Number(m[2]) : Number(m[1]);
    let end = m[1] === "" || m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
    start = Math.max(0, start);
    if (start > end || start >= total) {
      return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${total}` } });
    }
    return new Response(clip.bytes.slice(start, end + 1), {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(clip.bytes, { status: 200, headers: { ...base, "Content-Length": String(total) } });
}
