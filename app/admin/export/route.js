import { getSession } from "@/lib/session";
import { listReports } from "@/lib/db";

// Stop spreadsheet apps from running text as a formula (CSV injection).
function cell(value) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const rows = await listReports();
  const header = [
    "Reference",
    "Category",
    "Status",
    "Type",
    "Location",
    "GPS",
    "Description",
    "Reporter",
    "Contact",
    "Message to reporter",
    "Reported (UTC)",
    "Updated (UTC)",
  ];
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.ref_code,
        r.category === "non_emergency" ? "Non-emergency" : "Emergency",
        r.status,
        r.type,
        r.location,
        r.coords,
        r.description,
        r.reporter_name,
        r.contact,
        r.admin_note,
        r.created_at,
        r.updated_at,
      ]
        .map(cell)
        .join(",")
    );
  }

  // BOM so Excel opens the file as UTF-8.
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bantaybarangay-reports.csv"',
      "Cache-Control": "no-store",
    },
  });
}
