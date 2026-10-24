"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="login-form">
      <label htmlFor="username" className="field-label">
        Username
      </label>
      <input id="username" name="username" required autoComplete="username" />

      <label htmlFor="password" className="field-label">
        Password
      </label>
      <input id="password" name="password" type="password" required autoComplete="current-password" />

      {state?.error && (
        <p className="error" role="alert">
          ⚠️ {state.error}
        </p>
      )}

      <button className={`btn btn-primary btn-big ${pending ? "is-loading" : ""}`} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
