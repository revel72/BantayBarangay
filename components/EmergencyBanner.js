"use client";

import { usePrefs } from "./Prefs";
import { parsePhone, DEFAULT_AREA_CODE } from "@/lib/phone";

// All of these come from environment variables (set them in Vercel, then Redeploy).
const AREA_CODE = process.env.NEXT_PUBLIC_AREA_CODE || DEFAULT_AREA_CODE;
// The barangay hotline. 046 = Cavite, so "2309641" is read as (046) 230 9641.
const BARANGAY = parsePhone(process.env.NEXT_PUBLIC_BARANGAY_NUMBER || "2309641", AREA_CODE);
const BARANGAY_NAME = (process.env.NEXT_PUBLIC_BARANGAY_NAME || "").trim().slice(0, 40);
// National emergency line, kept as the second button. Default 911.
const EMERGENCY = parsePhone(process.env.NEXT_PUBLIC_EMERGENCY_NUMBER || "911", AREA_CODE);

// Fixed to the bottom of the screen on phones, so help is always one tap away.
export default function EmergencyBanner() {
  const { t } = usePrefs();
  return (
    <div className="call-card has-brgy" role="note">
      <p>{t.callFirst.replace("911", EMERGENCY?.display || "911")}</p>
      <div className="call-actions">
        {BARANGAY && (
          <a className="call-btn" href={`tel:${BARANGAY.dial}`}>
            <span aria-hidden="true">📞</span>{" "}
            {BARANGAY_NAME ? `${t.callBarangayNamed} ${BARANGAY_NAME}` : t.callBarangay}
          </a>
        )}
        {EMERGENCY && (
          <a className="call-btn call-btn-alt" href={`tel:${EMERGENCY.dial}`}>
            <span aria-hidden="true">🚨</span> {t.callButton.replace("911", EMERGENCY.display)}
          </a>
        )}
      </div>
      {BARANGAY && (
        <p className="call-number">
          {t.callBarangayNumber}:{" "}
          <a href={`tel:${BARANGAY.dial}`} dir="ltr">
            {BARANGAY.display}
          </a>
        </p>
      )}
    </div>
  );
}
