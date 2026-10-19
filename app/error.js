"use client";

import Logo from "@/components/Logo";

export default function GlobalError({ reset }) {
  return (
    <main className="login-page">
      <div className="card form login-card center">
        <div className="login-brand">
          <Logo size={56} />
          <h1>Something went wrong</h1>
          <p className="lead">The page could not load. Please try again.</p>
          <p className="lead">If someone is in danger, call 911 now.</p>
        </div>
        <button className="btn btn-primary btn-big" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
