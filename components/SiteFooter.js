"use client";

import Link from "next/link";
import { usePrefs } from "./Prefs";

export default function SiteFooter() {
  const { t } = usePrefs();
  return (
    <footer className="site-footer">
      <p>{t.footerProject}</p>
      <p>
        <Link href="/admin">{t.footerAdmin}</Link>
      </p>
    </footer>
  );
}
