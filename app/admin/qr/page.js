import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getSession } from "@/lib/session";
import { listPendingEmergencies } from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import PrintButton from "@/components/PrintButton";
import Logo from "@/components/Logo";

export const metadata = {
  title: "QR poster – BantayBarangay Admin",
  robots: { index: false, follow: false },
};

export default function QrPage() {
  return (
    <Suspense fallback={<p className="page">Loading…</p>}>
      <Poster />
    </Suspense>
  );
}

async function Poster() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const waitingEmergencies = (await listPendingEmergencies()).length;

  // Use the public address if it is set, otherwise the address this page was opened from.
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const url = configured || `${proto}://${host}`;
  const isLocal = /localhost|127\.0\.0\.1|192\.168\.|10\./.test(url);

  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 1,
    color: { dark: "#0a3d2f", light: "#ffffff" },
  });
  const download = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <AdminShell alertCount={waitingEmergencies}>
      <>
        <div className="admin-title no-print">
          <h1>QR poster</h1>
          <p className="muted">Print this and put it up in the barangay hall, school, clinic or on posts.</p>
        </div>

        {isLocal && (
          <p className="warn no-print" role="note">
            ⚠️ This QR code points to <b>{url}</b>, which only works on your own network. After you deploy, open this
            page from your real website address (or set <code>NEXT_PUBLIC_SITE_URL</code>) and print it then.
          </p>
        )}

        <div className="no-print poster-actions">
          <PrintButton />
          <a className="btn btn-ghost" href={download} download="bantaybarangay-qr.svg">
            Download QR (SVG)
          </a>
        </div>

        <section className="poster" aria-label="Printable poster">
          <div className="poster-brand">
            <Logo size={64} />
            <span>
              Bantay<span>Barangay</span>
            </span>
          </div>
          <h2>Scan to report an emergency</h2>
          <p className="poster-fil">I-scan para mag-ulat ng emergency</p>
          <div className="poster-qr" dangerouslySetInnerHTML={{ __html: svg }} />
          <ol className="poster-steps">
            <li>Open your phone camera and point it at the code.</li>
            <li>Tap the link that appears.</li>
            <li>Choose the emergency, say where it is, and send.</li>
          </ol>
          <p className="poster-url">{url}</p>
          <p className="poster-call">In immediate danger? Call 911 first.</p>
        </section>
      </>
    </AdminShell>
  );
}
