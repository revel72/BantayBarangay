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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      try {
        recRef.current?.abort();
      } catch {}
    };
  }, []);

  function start() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    setProblem("");
    const rec = new Rec();
    rec.lang = lang === "fil" ? "fil-PH" : "en-PH";
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
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setProblem("denied");
      else if (e.error !== "no-speech" && e.error !== "aborted") setProblem("error");
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
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
        onClick={listening ? stop : start}
        aria-pressed={listening}
      >
        {listening ? t.dictateStop : t.dictate}
      </button>
      <p className="hint" role="status" aria-live="polite">
        {problem === "denied"
          ? t.dictateDenied
          : problem === "error"
            ? t.dictateError
            : listening
              ? t.dictateListening
              : ""}
      </p>
    </div>
  );
}
