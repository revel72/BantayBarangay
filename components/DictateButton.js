"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "./Prefs";

// Voice typing with the browser's built-in speech recognition (Chrome, Edge, Android, Safari 14.1+).
// The button only appears on browsers that support it; typing always keeps working.
export default function DictateButton({ value, onChange, maxLength = 3000 }) {
  const { t, lang } = usePrefs();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState("");
  const recRef = useRef(null);
  const baseRef = useRef("");
  const retryRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    // Brave switches the speech service off on purpose, so the button would never work there.
    const hasApi = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSupported(hasApi && !navigator.brave);
    return () => {
      try {
        recRef.current?.abort();
      } catch {}
    };
  }, []);

  function start(langOverride) {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    setProblem("");
    const rec = new Rec();
    rec.lang = typeof langOverride === "string" ? langOverride : lang === "fil" ? "fil-PH" : "en-PH";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = valueRef.current.trim();

    rec.onresult = (e) => {
      const parts = [];
      for (let i = 0; i < e.results.length; i++) parts.push(e.results[i][0].transcript.trim());
      const joined = [baseRef.current, ...parts].filter(Boolean).join(" ").replace(/\s+/g, " ");
      onChangeRef.current(joined.slice(0, maxLength));
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") setProblem("denied");
      else if (e.error === "service-not-allowed") setProblem("unavailable");
      else if (e.error === "language-not-supported") {
        // This phone has no Filipino voice typing: try English instead.
        if (rec.lang !== "en-US") retryRef.current = true;
        else setProblem("unavailable");
      } else if (e.error === "network") setProblem("network");
      else if (e.error === "audio-capture") setProblem("nomic");
      else if (e.error !== "no-speech" && e.error !== "aborted") setProblem("error");
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (retryRef.current) {
        retryRef.current = false;
        start("en-US");
      }
    };
    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setProblem("error");
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {}
  }

  if (!supported) return null;

  return (
    <div className="dictate">
      <button
        type="button"
        className={`btn btn-ghost dictate-btn ${listening ? "is-listening" : ""}`}
        onClick={listening ? stop : () => start()}
        aria-pressed={listening}
      >
        {listening ? t.dictateStop : t.dictate}
      </button>
      <p className="hint" role="status" aria-live="polite">
        {problem === "denied"
          ? t.dictateDenied
          : problem === "network"
            ? t.dictateNetwork
            : problem === "nomic"
              ? t.dictateNoMic
              : problem === "unavailable"
            ? t.dictateUnavailable
            : problem === "error"
                ? t.dictateError
                : listening
              ? t.dictateListening
              : ""}
      </p>
    </div>
  );
}
