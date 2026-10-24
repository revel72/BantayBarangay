import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { listReports } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  TYPES,
  CATEGORIES,
  CATEGORY_LABEL,
  STATUSES,
  STATUS_LABEL,
  STATUS_ICON,
  typeIcon,
} from "@/lib/constants";
import { formatTime, dayKey, shortDay } from "@/lib/format";
import { updateReportStatus, saveReportNote, deleteReport } from "./actions";
import AdminShell from "@/components/AdminShell";
import DeleteReportButton from "@/components/DeleteReportButton";

export const metadata = {
  title: "Dashboard – BantayBarangay Admin",
  robots: { index: false, follow: false },
};

const COORDS_RE = /^-?\d{1,3}(\.\d+)?,\s?-?\d{1,3}(\.\d+)?$/;

// Lower number = shown first. Emergencies nobody has started on come first.
function rank(r) {
  if (r.status === "resolved") return 4;
  const emergency = r.category === "emergency";
  if (r.status === "pending") return emergency ? 0 : 2;
  return emergency ? 1 : 3;
}

export default function AdminPage({ searchParams }) {
  return (
    <Suspense fallback={<p className="page">Loading dashboard…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

function filterHref(params, patch) {
  const next = { ...params, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/admin?${s}` : "/admin";
}

async function Dashboard({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  await connection();

  const sp = await searchParams;
  const statusFilter = STATUSES.includes(sp?.status) ? sp.status : "";
  const categoryFilter = CATEGORIES.some((c) => c.id === sp?.category) ? sp.category : "";
  const typeFilter = TYPES.some((t) => t.label === sp?.type) ? sp.type : "";
  const q = String(sp?.q || "").trim().slice(0, 100);
  const params = { status: statusFilter, category: categoryFilter, type: typeFilter, q };

  const all = (await listReports()).map((r) => ({
    ...r,
    id: Number(r.id),
    status: STATUSES.includes(r.status) ? r.status : "pending",
    category: r.category === "non_emergency" ? "non_emergency" : "emergency",
  }));

  // ---- Numbers for the dashboard (always across ALL reports) ----
  const counts = {};
  for (const s of STATUSES) counts[s] = { total: 0, emergency: 0, non_emergency: 0 };
  const catTotals = { emergency: 0, non_emergency: 0 };
  for (const r of all) {
    counts[r.status].total++;
    counts[r.status][r.category]++;
    catTotals[r.category]++;
  }
  const waitingEmergencies = counts.pending.emergency;

  const today = dayKey(new Date());
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(dayKey(new Date(Date.now() - i * 86400000)));
  const perDay = Object.fromEntries(days.map((d) => [d, 0]));
  for (const r of all) {
    const k = dayKey(r.created_at);
    if (k in perDay) perDay[k]++;
  }
  const maxDay = Math.max(1, ...Object.values(perDay));

  const byType = {};
  for (const r of all) byType[r.type] = (byType[r.type] || 0) + 1;
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(1, ...typeRows.map(([, n]) => n));

  // ---- The filtered list ----
  const needle = q.toLowerCase();
  const shown = all
    .filter((r) => !statusFilter || r.status === statusFilter)
    .filter((r) => !categoryFilter || r.category === categoryFilter)
    .filter((r) => !typeFilter || r.type === typeFilter)
    .filter(
      (r) =>
        !needle ||
        [r.ref_code, r.location, r.description, r.reporter_name, r.contact, r.type]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
    )
    .sort((a, b) => rank(a) - rank(b)); // stable: newest first inside each group

  const statusTabs = [
    { id: "", label: "All", n: all.length },
    ...STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s], n: counts[s].total })),
  ];
  const categoryTabs = [
    { id: "", label: "All reports", n: all.length },
    ...CATEGORIES.map((c) => ({ id: c.id, label: `${c.icon} ${c.label}`, n: catTotals[c.id] })),
  ];

  return (
    <AdminShell alertCount={waitingEmergencies} autoRefresh>
      <>
        <div className="admin-title">
          <h1>Reports dashboard</h1>
          <p className="muted">
            Emergencies ring an alarm until someone presses “Start handling”. The list updates by itself.
          </p>
        </div>

        {/* Headline numbers: each tile filters the list below */}
        <ul className="tiles" aria-label="Report totals">
          {STATUSES.map((s) => (
            <li key={s}>
              <a className={`tile tile-${s}`} href={filterHref(params, { status: s })}>
                <span className="tile-num">{counts[s].total}</span>
                <span className="tile-label">
                  <span aria-hidden="true">{STATUS_ICON[s]}</span> {STATUS_LABEL[s]}
                </span>
                <span className="tile-sub">
                  {counts[s].emergency} emergency · {counts[s].non_emergency} non-emergency
                </span>
              </a>
            </li>
          ))}
          <li>
            <a className="tile tile-total" href={filterHref(params, { status: "" })}>
              <span className="tile-num">{all.length}</span>
              <span className="tile-label">All reports</span>
              <span className="tile-sub">{perDay[today]} today</span>
            </a>
          </li>
        </ul>

        {all.length > 0 && (
          <section className="charts" aria-label="Report trends">
            <figure className="chart">
              <figcaption>Reports per day, last 7 days</figcaption>
              <div
                className="cols"
                role="img"
                aria-label={days.map((d) => `${shortDay(d)}: ${perDay[d]}`).join(", ")}
              >
                {days.map((d) => (
                  <div key={d} className="col">
                    <span className="col-n">{perDay[d]}</span>
                    <span className="col-bar" style={{ height: `${(perDay[d] / maxDay) * 100}%` }} />
                    <span className="col-l">{d === today ? "Today" : shortDay(d)}</span>
                  </div>
                ))}
              </div>
            </figure>

            <figure className="chart">
              <figcaption>Reports by type</figcaption>
              <ul className="hbars">
                {typeRows.map(([label, n]) => (
                  <li key={label}>
                    <span className="hbar-label">
                      <span aria-hidden="true">{typeIcon(label)}</span> {label}
                    </span>
                    <span className="hbar-track">
                      <span className="hbar-fill" style={{ width: `${(n / maxType) * 100}%` }} />
                    </span>
                    <span className="hbar-n">{n}</span>
                  </li>
                ))}
              </ul>
            </figure>
          </section>
        )}

        {/* Filters */}
        <section className="filters-wrap" aria-label="Filter reports">
          <nav className="tabs" aria-label="Category">
            {categoryTabs.map((tab) => (
              <a
                key={tab.id || "all"}
                href={filterHref(params, { category: tab.id })}
                aria-current={categoryFilter === tab.id ? "page" : undefined}
              >
                {tab.label} <span className="tab-n">{tab.n}</span>
              </a>
            ))}
          </nav>
          <nav className="tabs tabs-status" aria-label="Status">
            {statusTabs.map((tab) => (
              <a
                key={tab.id || "all"}
                href={filterHref(params, { status: tab.id })}
                aria-current={statusFilter === tab.id ? "page" : undefined}
              >
                {tab.label} <span className="tab-n">{tab.n}</span>
              </a>
            ))}
          </nav>
          <form method="get" action="/admin" className="filters">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
            <label className="sr-only" htmlFor="q">
              Search reports
            </label>
            <input id="q" name="q" type="search" placeholder="Search location, description, name, reference…" defaultValue={q} />
            <label className="sr-only" htmlFor="type">
              Type
            </label>
            <select id="type" name="type" defaultValue={typeFilter}>
              <option value="">All types</option>
              {CATEGORIES.map((c) => (
                <optgroup key={c.id} label={c.label}>
                  {TYPES.filter((t) => t.category === c.id).map((t) => (
                    <option key={t.id} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button className="btn btn-primary btn-small" type="submit">
              Apply
            </button>
            {(q || typeFilter || statusFilter || categoryFilter) && (
              <a className="btn btn-ghost btn-small" href="/admin">
                Clear
              </a>
            )}
          </form>
        </section>

        <p className="muted result-count">
          Showing {shown.length} of {all.length} report{all.length === 1 ? "" : "s"}
        </p>

        {all.length === 0 ? (
          <div className="empty">
            <p>
              <strong>No reports yet.</strong>
            </p>
            <p>Reports sent from the public page will appear here. Print the QR poster so people can find it.</p>
            <a className="btn btn-primary" href="/admin/qr">
              Open the QR poster
            </a>
          </div>
        ) : shown.length === 0 ? (
          <div className="empty">
            <p>
              <strong>No reports match those filters.</strong>
            </p>
            <a className="btn btn-ghost" href="/admin">
              Clear filters
            </a>
          </div>
        ) : (
          <ul className="reports">
            {shown.map((r) => {
              const mapUrl =
                r.coords && COORDS_RE.test(r.coords)
                  ? `https://www.google.com/maps?q=${encodeURIComponent(r.coords)}`
                  : null;
              const emergency = r.category === "emergency";
              const needsResponse = emergency && r.status === "pending";
              return (
                <li
                  key={r.id}
                  className={`report s-${r.status} c-${r.category} ${needsResponse ? "needs-response" : ""}`}
                >
                  <div className="report-head">
                    <div>
                      <span className="report-type">
                        <span aria-hidden="true">{typeIcon(r.type)}</span> {r.type}
                      </span>
                      <span className="ref">{r.ref_code}</span>
                    </div>
                    <div className="badges">
                      <span className={`badge cat-${r.category}`}>{CATEGORY_LABEL[r.category]}</span>
                      <span className={`badge b-${r.status}`}>
                        <span aria-hidden="true">{STATUS_ICON[r.status]}</span> {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </div>

                  {needsResponse && (
                    <p className="response-flag" role="note">
                      🚨 Waiting for a response. Press “Start handling” to stop the alarm.
                    </p>
                  )}

                  <p className="muted">
                    Reported {formatTime(r.created_at)}
                    {r.updated_at ? ` · updated ${formatTime(r.updated_at)}` : ""}
                  </p>

                  <p className="loc">
                    <b>Location:</b> {r.location}{" "}
                    {mapUrl && (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                        Open in Maps
                      </a>
                    )}
                  </p>
                  <p className="description">{r.description}</p>
                  {(r.reporter_name || r.contact) && (
                    <p className="muted">
                      <b>Reporter:</b> {r.reporter_name || "Anonymous"}
                      {r.contact ? ` · ${r.contact}` : ""}
                    </p>
                  )}
                  {r.admin_note && (
                    <p className="note-shown">
                      <b>Message to reporter:</b> {r.admin_note}
                    </p>
                  )}

                  <div className="report-actions">
                    {r.status === "pending" && (
                      <>
                        <form action={updateReportStatus.bind(null, r.id, "in_progress")}>
                          <button className="btn btn-primary btn-small" type="submit">
                            Start handling
                          </button>
                        </form>
                        <form action={updateReportStatus.bind(null, r.id, "resolved")}>
                          <button className="btn btn-ghost btn-small" type="submit">
                            Mark resolved
                          </button>
                        </form>
                      </>
                    )}
                    {r.status === "in_progress" && (
                      <>
                        <form action={updateReportStatus.bind(null, r.id, "resolved")}>
                          <button className="btn btn-primary btn-small" type="submit">
                            Mark resolved
                          </button>
                        </form>
                        <form action={updateReportStatus.bind(null, r.id, "pending")}>
                          <button className="btn btn-ghost btn-small" type="submit">
                            Back to pending
                          </button>
                        </form>
                      </>
                    )}
                    {r.status === "resolved" && (
                      <form action={updateReportStatus.bind(null, r.id, "pending")}>
                        <button className="btn btn-ghost btn-small" type="submit">
                          Reopen
                        </button>
                      </form>
                    )}
                    <DeleteReportButton action={deleteReport.bind(null, r.id)} label={r.ref_code} />
                  </div>

                  <details className="note-form">
                    <summary>{r.admin_note ? "Edit message to reporter" : "Write a message to the reporter"}</summary>
                    <form action={saveReportNote.bind(null, r.id)}>
                      <p className="muted">The reporter sees this when they track the report with their reference number.</p>
                      <textarea name="note" rows={3} maxLength={500} defaultValue={r.admin_note || ""} />
                      <button className="btn btn-ghost btn-small" type="submit">
                        Save message
                      </button>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </>
    </AdminShell>
  );
}
