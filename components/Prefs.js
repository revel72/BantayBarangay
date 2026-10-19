"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { STRINGS } from "@/lib/i18n";

const SIZES = { normal: "100%", large: "118%", xlarge: "138%" };

const PrefsContext = createContext(null);

// Remembers the visitor's language and text size on their own device.
export function PrefsProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const [size, setSizeState] = useState("normal");

  useEffect(() => {
    try {
      const l = localStorage.getItem("bb_lang");
      if (l === "en" || l === "fil") setLangState(l);
      const s = localStorage.getItem("bb_size");
      if (s && SIZES[s]) setSizeState(s);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[size];
    document.documentElement.lang = lang === "fil" ? "fil" : "en";
  }, [lang, size]);

  function setLang(l) {
    setLangState(l);
    try {
      localStorage.setItem("bb_lang", l);
    } catch {}
  }

  function setSize(s) {
    setSizeState(s);
    try {
      localStorage.setItem("bb_size", s);
    } catch {}
  }

  const value = { lang, setLang, size, setSize, t: STRINGS[lang] };
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
