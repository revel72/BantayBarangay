"use client";

import { usePrefs } from "./Prefs";

const HOTLINE = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER || "911";

// Fixed to the bottom of the screen on phones, so help is always one tap away.
export default function EmergencyBanner() {
  const { t } = usePrefs();
  return (
    <div className="call-card" role="note">
      <p>{t.callFirst.replace("911", HOTLINE)}</p>
      <a className="call-btn" href={`tel:${HOTLINE}`}>
        <span aria-hidden="true">📞</span> {t.callButton.replace("911", HOTLINE)}
      </a>
    </div>
  );
}
