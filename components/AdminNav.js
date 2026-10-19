import Link from "next/link";
import Logo from "./Logo";
import EmergencyAlert from "./EmergencyAlert";
import { logout } from "@/app/admin/actions";

export default function AdminNav({ alertCount = 0 }) {
  return (
    <>
      <header className="admin-bar no-print">
        <div className="admin-bar-inner">
          <Link href="/admin" className="brand">
            <Logo size={36} />
            <span className="brand-name">
              Bantay<span>Barangay</span> <em>Admin</em>
            </span>
          </Link>
          <nav aria-label="Admin">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/qr">QR poster</Link>
            <a href="/admin/export" download>
              Export CSV
            </a>
            <Link href="/" target="_blank">
              View public site
            </Link>
            <form action={logout}>
              <button type="submit" className="link-btn">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <EmergencyAlert initialCount={alertCount} />
    </>
  );
}
