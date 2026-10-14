import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <main className="reference-login-page redesigned-login">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />
      <div className="reference-login-wrap redesigned-login-wrap">
        <div className="login-toolbar">
          <a href="/" className="back-link">← Back to home</a>
          <ThemeToggle />
        </div>
        <header className="reference-brand redesigned-brand">
          <Image className="reference-brand-image" src="/runaki-logo.png" alt="Bardarash Co logo" width={112} height={112} priority />
          <span className="eyebrow">Bardarash Co workspace</span>
          <h1>Welcome back.</h1>
          <p>Sign in to manage attendance, updates, and team collaboration.</p>
        </header>
        <section className="reference-login-card redesigned-login-card">
          <div className="card-heading">
            <div><span className="card-label">SECURE ACCESS</span><h2>Sign in</h2></div>
            <span className="status-dot" aria-label="Secure connection" />
          </div>
          <p className="reference-login-copy">Use your company email and password to continue.</p>
          <AuthForm />
          <p className="login-support">Need access help? Contact your supervisor.</p>
        </section>
      </div>
    </main>
  );
}
