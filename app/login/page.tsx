import Image from "next/image";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="reference-login-page">
      <div className="reference-login-wrap">
        <header className="reference-brand">
          <Image
            className="reference-brand-image"
            src="/runaki-logo.png"
            alt="Runaki logo"
            width={140}
            height={140}
            priority
          />
          <h1>Project System</h1>
          <p>Attendance Management</p>
        </header>

        <section className="reference-login-card">
          <h2>Welcome</h2>
          <p className="reference-login-copy">Sign in to record or manage attendance.</p>
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
