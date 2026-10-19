"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrefs } from "./Prefs";
import Logo from "./Logo";

export default function SiteHeader() {
  const { t, lang, setLang, size, setSize } = usePrefs();
  const pathname = usePathname();

  const sizes = [
    { id: "normal", label: "A", name: t.sizeNormal },
    { id: "large", label: "A+", name: t.sizeLarge },
    { id: "xlarge", label: "A++", name: t.sizeXLarge },
  ];

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        {t.skip}
      </a>

      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label={t.siteName}>
          <Logo size={44} />
          <span className="brand-name">
            Bantay<span>Barangay</span>
          </span>
        </Link>

        <div className="prefs">
          <div className="size-group" role="group" aria-label={t.textSize}>
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`size-btn ${size === s.id ? "on" : ""}`}
                aria-pressed={size === s.id}
                aria-label={s.name}
                onClick={() => setSize(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="lang-btn"
            aria-label={t.switchLangLabel}
            lang={lang === "en" ? "fil" : "en"}
            onClick={() => setLang(lang === "en" ? "fil" : "en")}
          >
            {t.switchLang}
          </button>
        </div>
      </div>

      <nav className="site-nav" aria-label="Main">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
          {t.navReport}
        </Link>
        <Link href="/track" aria-current={pathname === "/track" ? "page" : undefined}>
          {t.navTrack}
        </Link>
      </nav>
    </header>
  );
}
