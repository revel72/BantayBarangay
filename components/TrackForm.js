"use client";

import { useActionState } from "react";
import { trackReport } from "@/app/actions";
import { STATUS_ICON } from "@/lib/constants";
import { usePrefs } from "./Prefs";

export default function TrackForm() {
  const { t } = usePrefs();
  const [state, formAction, pending] = useActionState(trackReport, null);

  const errorText =
    state && !state.found
      ? state.code === "invalid"
        ? t.trackInvalid
        : state.code === "notfound"
        ? t.trackNotFound
        : t.errors.server
      : "";

  return (
    <>
      <section className="card form">
        <h1>{t.trackTitle}</h1>
        <p className="lead">{t.trackIntro}</p>

        <form action={formAction} className="track-form">
          <label htmlFor="ref" className="step-title">
            {t.trackLabel}
          </label>
          <input
            id="ref"
            name="ref"
            required
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="BB-ABC234"
            defaultValue={state?.ref || ""}
            className="ref-input"
          />
          {errorText && (
            <p className="error" role="alert">
              ⚠️ {errorText}
            </p>
          )}
          <button className="btn btn-primary btn-big" type="submit" disabled={pending}>
            {pending ? t.checking : t.trackButton}
          </button>
        </form>
      </section>

      {state?.found && (
        <section className={`card result status-${state.status}`} aria-live="polite">
          <p className="hint">{state.ref}</p>
          <h2>
            <span aria-hidden="true">{STATUS_ICON[state.status]}</span> {t.status[state.status]}
          </h2>

          <ol className="progress" aria-label={t.statusTitle}>
            {["pending", "in_progress", "resolved"].map((s, i) => {
              const order = ["pending", "in_progress", "resolved"];
              const reached = order.indexOf(state.status) >= i;
              return (
                <li key={s} className={reached ? "reached" : ""} aria-current={state.status === s ? "step" : undefined}>
                  {t.status[s].replace(/\.$/, "").split(".")[0]}
                </li>
              );
            })}
          </ol>

          <dl className="facts">
            <div>
              <dt>{t.reportedOn}</dt>
              <dd>{state.createdAt}</dd>
            </div>
            {state.updatedAt && (
              <div>
                <dt>{t.lastUpdate}</dt>
                <dd>{state.updatedAt}</dd>
              </div>
            )}
          </dl>

          {state.note && (
            <blockquote className="note">
              <strong>{t.messageFrom}</strong>
              <p>{state.note}</p>
            </blockquote>
          )}
        </section>
      )}
    </>
  );
}
