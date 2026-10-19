import Link from "next/link";
import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Admin sign in – BantayBarangay",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="card form login-card">
        <div className="login-brand">
          <Logo size={56} />
          <h1>Admin sign in</h1>
          <p className="lead">For barangay officials only.</p>
        </div>
        <LoginForm />
        <p className="hint center">
          <Link href="/">Back to the report page</Link>
        </p>
      </div>
    </main>
  );
}
