"use client";

import { usePrefs } from "./Prefs";

const HOTLINE = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER || "911";

// Optional barangay hotline. Only shown when NEXT_PUBLIC_BARANGAY_NUMBER is set to a real phone number.
const RAW_BARANGAY = (process.env.NEXT_PUBLIC_BARANGAY_NUMBER || "").trim();
const BARANGAY = /^\+?[\d\s().-]{3,25}$/.test(RAW_BARANGAY) ? RAW_BARANGAY : "";
const BARANGAY_DIAL = BARANGAY.replace(/[^\d+]/g, "");
const BARANGAY_NAME = (process.env.NEXT_PUBLIC_BARANGAY_NAME || "").trim().slice(0, 40);

// Fixed to the bottom of the screen on phones, so help is always one tap away.
export default function EmergencyBanner() {
  const { t } = usePrefs();
  return (
    <div className={`call-card ${BARANGAY ? "has-brgy" : ""}`} role="note">
      <p>{t.callFirst.replace("911", HOTLINE)}</p>
      <div className="call-actions">
        <a className="call-btn" href={`tel:${HOTLINE}`}>
          <span aria-hidden="true">📞</span> {t.callButton.replace("911", HOTLINE)}
        </a>
        {BARANGAY && (
          <a className="call-btn call-btn-brgy" href={`tel:${BARANGAY_DIAL}`}>
            <span aria-hidden="true">🏘️</span> {BARANGAY_NAME ? `${t.callBarangayNamed} ${BARANGAY_NAME}` : t.callBarangay}
          </a>
        )}
      </div>
      {BARANGAY && (
        <p className="call-number">
          {t.callBarangayNumber}: <a href={`tel:${BARANGAY_DIAL}`}>{BARANGAY}</a>
        </p>
      )}
    </div>
  );
}
