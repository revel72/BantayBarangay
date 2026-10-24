"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The two in-app pages, with the current one highlighted.
export default function AdminNavLinks() {
  const pathname = usePathname();
  return (
    <>
      <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined}>
        <span aria-hidden="true">📊</span> Dashboard
      </Link>
      <Link href="/admin/qr" aria-current={pathname === "/admin/qr" ? "page" : undefined}>
        <span aria-hidden="true">🖨️</span> QR poster
      </Link>
    </>
  );
}
