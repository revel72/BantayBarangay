"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReport } from "@/app/actions";
import { TYPES, CATEGORIES } from "@/lib/constants";
import { usePrefs } from "./Prefs";

export default function ReportForm() {
  const { t, lang } = usePrefs();
  const [state, formAction, pending] = useActionState(submitReport, null);

  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [geo, setGeo] = useState({ status: "idle" }); // idle | busy | ok | fail | nosupport
  const [copied, setCopied] = useState(false);

  function chooseCategory(id) {
    setCategory(id);
    // A type from the other category no longer applies.
    if (TYPES.find((ty) => ty.id === type)?.category !== id) setType("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeo({ status: "nosupport" });
      return;
    }
    setGeo({ status: "busy" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        setCoords(c);
        setLocation((prev) => (prev.trim() ? prev : `GPS: ${c}`));
        setGeo({ status: "ok" });
      },
      () => setGeo({ status: "fail" }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  async function copyRef(ref) {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (state?.ok) {
    return (
      <section className="card success" aria-live="polite">
        <div className="success-icon" aria-hidden="true">
          ✅
        </div>
        <h1>{t.successTitle}</h1>
        <p className="lead">{state.category === "non_emergency" ? t.successHelpNon : t.successHelp}</p>

        <div className="ref-box">
          <span className="ref-label">{t.successRef}</span>
          <strong className="ref-code">{state.ref}</strong>
          <button type="button" className="btn btn-ghost" onClick={() => copyRef(state.ref)}>
            {copied ? `✓ ${t.copied}` : t.copy}
          </button>
        </div>
        <p className="hint">{t.successKeep}</p>

        <div className="actions">
          <Link className="btn" href="/track">
            {t.trackMine}
          </Link>
          <a className="btn btn-ghost" href="/">
            {t.another}
          </a>
        </div>
      </section>
    );
  }

  const geoMessage = {
    busy: t.locating,
    ok: t.locationOk,
    fail: t.locationFail,
    nosupport: t.locationNoSupport,
  }[geo.status];

  const visibleTypes = TYPES.filter((ty) => ty.category === category);

  return (
    <form action={formAction} className="form stepper">
      <header className="form-head">
        <h1>{t.heroTitle}</h1>
        <p className="lead">{t.heroSub}</p>
      </header>

      <div className="steps">
      <fieldset className="step">
        <legend>
          <span className="step-num" aria-hidden="true">
            1
          </span>
          {t.stepCategory}
        </legend>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <label key={c.id} className={`cat-tile cat-${c.id}`}>
              <input
                type="radio"
                name="category"
                value={c.id}
                required
                checked={category === c.id}
                onChange={() => chooseCategory(c.id)}
              />
              <span className="cat-body">
                <span className="cat-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <span className="cat-text">
                  <strong>{lang === "fil" ? c.fil : c.label}</strong>
                  <span className="cat-help">{c.id === "emergency" ? t.catEmergencyHelp : t.catNonHelp}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="step">
        <legend>
          <span className="step-num" aria-hidden="true">
            2
          </span>
          {category === "non_emergency" ? t.typeQNon : t.typeQEmergency}
        </legend>
        {!category ? (
          <p className="hint">{t.chooseCategoryFirst}</p>
        ) : (
          <div className="type-grid">
            {visibleTypes.map((ty) => (
              <label key={ty.id} className="type-tile">
                <input
                  type="radio"
                  name="type"
                  value={ty.id}
                  required
                  checked={type === ty.id}
                  onChange={() => setType(ty.id)}
                />
                <span className="tile-body">
                  <span className="tile-icon" aria-hidden="true">
                    {ty.icon}
                  </span>
                  <span className="tile-text">{lang === "fil" ? ty.fil : ty.label}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="step">
        <label htmlFor="location" className="step-title">
          <span className="step-num" aria-hidden="true">
            3
          </span>
          {t.stepWhere}
        </label>
        <input
          id="location"
          name="location"
          required
          maxLength={300}
          autoComplete="street-address"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t.locationPlaceholder}
        />
        <input type="hidden" name="coords" value={coords} />
        <button type="button" className="btn btn-ghost" onClick={useMyLocation} disabled={geo.status === "busy"}>
          {t.useLocation}
        </button>
        {geoMessage && (
          <p className={`hint ${geo.status === "ok" ? "good" : ""}`} role="status">
            {geoMessage}
          </p>
        )}
      </div>

      <div className="step">
        <label htmlFor="description" className="step-title">
          <span className="step-num" aria-hidden="true">
            4
          </span>
          {t.stepWhat}
        </label>
        <p className="hint" id="desc-help">
          {t.descHelp}
        </p>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={3000}
          aria-describedby="desc-help"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descPlaceholder}
        />
      </div>

      <fieldset className="step">
        <legend>
          <span className="step-num" aria-hidden="true">
            5
          </span>
          {t.stepContact}
        </legend>
        <label htmlFor="reporterName" className="field-label">
          {t.name}
        </label>
        <input
          id="reporterName"
          name="reporterName"
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="contact" className="field-label">
          {t.contact}
        </label>
        <input
          id="contact"
          name="contact"
          maxLength={100}
          autoComplete="tel"
          aria-describedby="contact-help"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <p className="hint" id="contact-help">
          {t.contactHelp}
        </p>
      </fieldset>

      </div>

      {/* Honeypot for bots */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state && !state.ok && (
        <p className="error" role="alert">
          ⚠️ {t.errors[state.code] || t.errors.server}
        </p>
      )}

      <button className={`btn btn-primary btn-big ${pending ? "is-loading" : ""}`} type="submit" disabled={pending}>
        {pending ? t.sending : t.send}
      </button>
      <p className="hint center">🔒 {t.privacy}</p>
    </form>
  );
}
