import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Page not found – BantayBarangay" };

export default function NotFound() {
  return (
    <main className="login-page">
      <div className="card form login-card center">
        <div className="login-brand">
          <Logo size={56} />
          <h1>We can’t find that page</h1>
          <p className="lead">The link may be wrong, or the page may have moved.</p>
          <p className="lead">Hindi namin mahanap ang pahinang iyon.</p>
        </div>
        <Link className="btn btn-primary btn-big" href="/">
          Go to the report page
        </Link>
      </div>
    </main>
  );
}
