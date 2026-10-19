import { getSession } from "@/lib/session";
import { listPendingEmergencies } from "@/lib/db";

// Polled every few seconds by the alarm banner. Returns the emergencies nobody has started handling.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const rows = await listPendingEmergencies();
  return Response.json(
    {
      count: rows.length,
      ids: rows.map((r) => Number(r.id)),
      items: rows.slice(0, 3).map((r) => ({
        id: Number(r.id),
        ref: r.ref_code,
        type: r.type,
        location: r.location,
        createdAt: r.created_at,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
