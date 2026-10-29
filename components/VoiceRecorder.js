"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "./Prefs";

export const MAX_SECONDS = 30;
const TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

// Records a short voice message in the browser. The finished clip is handed up with onChange({ blob, seconds, url })
// (or null when removed), and the form adds it to the report when it is sent.
export default function VoiceRecorder({ clip, onChange }) {
  const { t } = usePrefs();
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [problem, setProblem] = useState("");
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const startedRef = useRef(0);

  useEffect(() => {
    setSupported(Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder));
    return () => {
      clearInterval(timerRef.current);
      try {
        recRef.current?.state === "recording" && recRef.current.stop();
      } catch {}
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  // Free the old preview URL when the clip is replaced or removed.
  useEffect(() => {
    const url = clip?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [clip?.url]);

  async function start() {
    setProblem("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = TYPES.find((m) => MediaRecorder.isTypeSupported?.(m));
      const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 24000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        clearInterval(timerRef.current);
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        setRecording(false);
        const seconds = Math.min(MAX_SECONDS, Math.max(1, Math.round((Date.now() - startedRef.current) / 1000)));
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
        if (blob.size > 0) onChange({ blob, seconds, url: URL.createObjectURL(blob) });
        else setProblem("fail");
      };
      recRef.current = rec;
      rec.start(1000);
      startedRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startedRef.current) / 1000);
        setElapsed(s);
        if (s >= MAX_SECONDS) stop();
      }, 250);
    } catch (err) {
      setProblem(err?.name === "NotAllowedError" || err?.name === "SecurityError" ? "denied" : "fail");
    }
  }

  function stop() {
    try {
      if (recRef.current?.state === "recording") recRef.current.stop();
    } catch {}
  }

  if (!supported) return null;

  return (
    <div className="voice">
      {!recording && !clip && (
        <button type="button" className="btn btn-ghost voice-btn" onClick={start}>
          {t.voiceRecord} <small>({t.voiceMax})</small>
        </button>
      )}

      {recording && (
        <>
          <button type="button" className="btn btn-ghost voice-btn is-recording" onClick={stop}>
            {t.voiceStop} · 0:{String(elapsed).padStart(2, "0")}/0:{MAX_SECONDS}
          </button>
          <p className="hint" role="status">
            {t.voiceRecording}
          </p>
        </>
      )}

      {!recording && clip && (
        <div className="voice-ready">
          <audio controls src={clip.url} preload="metadata" />
          <div className="voice-actions">
            <button type="button" className="btn btn-ghost" onClick={start}>
              {t.voiceRedo}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onChange(null)}>
              {t.voiceRemove}
            </button>
          </div>
          <p className="hint good" role="status">
            {t.voiceReady}
          </p>
        </div>
      )}

      {problem && (
        <p className="hint" role="alert">
          {problem === "denied" ? t.voiceDenied : t.voiceFail}
        </p>
      )}
    </div>
  );
}
