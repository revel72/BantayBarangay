"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { typeIcon } from "@/lib/constants";

const POLL_MS = 5000; // how often we ask the server for waiting emergencies
const BEEP_EVERY_MS = 2500; // alarm repeats at this interval

function minutesWaiting(createdAt) {
  const t = new Date(String(createdAt).replace(" ", "T") + "Z").getTime();
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

// Rings (red banner, alarm sound, flashing tab title) while any emergency report is still
// "Pending". It stops as soon as every emergency has been started or resolved.
export default function EmergencyAlert({ initialCount = 0 }) {
  const router = useRouter();
  const [data, setData] = useState({ count: initialCount, ids: [], items: [] });
  const [soundOn, setSoundOn] = useState(false);
  const [needsClick, setNeedsClick] = useState(false);
  const [checked, setChecked] = useState(false); // has the server confirmed the count yet?
  const idsRef = useRef(null);
  const ctxRef = useRef(null);

  // Remember the sound choice on this device.
  useEffect(() => {
    try {
      if (localStorage.getItem("bb_alarm") === "on") setSoundOn(true);
    } catch {}
  }, []);

  // ---- Ask the server what is waiting ----
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/admin/alerts", { cache: "no-store" });
      if (res.status === 401) {
        router.refresh(); // session ended: the page sends the admin to the login screen
        return;
      }
      if (!res.ok) return;
      const next = await res.json();
      const key = next.ids.join(",");
      // Something changed (new emergency, or one was started elsewhere): refresh the list too.
      if (idsRef.current !== null && idsRef.current !== key) router.refresh();
      idsRef.current = key;
      setData(next);
      setChecked(true);
    } catch {
      // offline for a moment; try again on the next tick
    }
  }, [router]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  // The dashboard re-rendered (e.g. after pressing Start handling): check straight away.
  useEffect(() => {
    poll();
  }, [initialCount, poll]);

  // ---- Alarm sound ----
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (ctx.state !== "running") {
      setNeedsClick(true); // browsers only allow sound after the page has been clicked once
      return;
    }
    setNeedsClick(false);
    [
      [880, 0],
      [660, 0.3],
    ].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + offset;
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.28);
    });
    window.__bbBeeps = (window.__bbBeeps || 0) + 1; // lets automated tests confirm the alarm rang
  }, [getCtx]);

  useEffect(() => {
    if (!soundOn || data.count === 0) return;
    beep();
    const id = setInterval(beep, BEEP_EVERY_MS);
    // If the browser blocked sound, the first click anywhere unlocks it.
    const unlock = () => {
      getCtx()?.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      clearInterval(id);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [soundOn, data.count, beep, getCtx]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem("bb_alarm", next ? "on" : "off");
    } catch {}
    if (next) {
      // This click is the "user gesture" browsers need before they allow sound.
      getCtx()?.resume().catch(() => {});
      setTimeout(beep, 50);
    }
  }

  // ---- Flash the browser tab title so it is noticed from another tab ----
  useEffect(() => {
    if (data.count === 0) return;
    const original = document.title.replace(/^🚨 EMERGENCY \(\d+\) · /, "");
    let on = false;
    const id = setInterval(() => {
      on = !on;
      document.title = on ? `🚨 EMERGENCY (${data.count}) · ${original}` : original;
    }, 1000);
    return () => {
      clearInterval(id);
      document.title = original;
    };
  }, [data.count]);

  const { count, items } = data;
  const soundButton = (
    <button type="button" className="alert-sound" aria-pressed={soundOn} onClick={toggleSound}>
      {soundOn ? (needsClick ? "🔊 Click anywhere to allow sound" : "🔊 Alarm sound is on") : "🔇 Turn on alarm sound"}
    </button>
  );

  if (count === 0) {
    return (
      <div className="alert-bar alert-off no-print">
        <div className="alert-inner">
          <p className="alert-title">{checked ? "✅ No emergencies waiting" : "Checking for emergencies…"}</p>
          {soundButton}
        </div>
      </div>
    );
  }

  return (
    <div className="alert-bar alert-on no-print">
      <div className="alert-inner">
        <div className="alert-main">
          <p className="alert-title" role="alert">
            <span className="alert-icon" aria-hidden="true">
              🚨
            </span>{" "}
            {count} emergency report{count === 1 ? "" : "s"} waiting. Press “Start handling”.
          </p>
          <ul className="alert-list">
            {items.map((it) => (
              <li key={it.id}>
                <span aria-hidden="true">{typeIcon(it.type)}</span> <b>{it.type}</b> · {it.location} · waiting{" "}
                {minutesWaiting(it.createdAt)} min
              </li>
            ))}
            {count > items.length && <li>and {count - items.length} more</li>}
          </ul>
        </div>
        <div className="alert-actions">
          <a className="btn btn-small alert-btn" href="/admin?category=emergency&status=pending">
            Show waiting emergencies
          </a>
          {soundButton}
        </div>
      </div>
    </div>
  );
}
