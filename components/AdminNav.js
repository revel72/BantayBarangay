import Link from "next/link";
import Logo from "./Logo";
import AdminNavLinks from "./AdminNavLinks";
import { logout } from "@/app/admin/actions";

// Sidebar on wide screens, compact top bar on phones.
export default function AdminNav() {
  return (
    <aside className="admin-side no-print">
      <Link href="/admin" className="brand">
        <Logo size={38} />
        <span className="brand-name">
          Bantay<span>Barangay</span>
          <em>Admin</em>
        </span>
      </Link>
      <nav className="side-nav" aria-label="Admin">
        <AdminNavLinks />
        <a href="/admin/export" download>
          <span aria-hidden="true">⬇️</span> Export CSV
        </a>
        <Link href="/" target="_blank">
          <span aria-hidden="true">🌐</span> View public site
        </Link>
        <form action={logout}>
          <button type="submit" className="link-btn">
            <span aria-hidden="true">🚪</span> Sign out
          </button>
        </form>
      </nav>
    </aside>
  );
}
