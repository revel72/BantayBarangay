"use client";

import { usePrefs } from "./Prefs";

const HOTLINE = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER || "911";

export default function EmergencyBanner() {
  const { t } = usePrefs();
  return (
    <div className="call-banner" role="note">
      <p>{t.callFirst.replace("911", HOTLINE)}</p>
      <a className="call-btn" href={`tel:${HOTLINE}`}>
        📞 {t.callButton.replace("911", HOTLINE)}
      </a>
    </div>
  );
}
