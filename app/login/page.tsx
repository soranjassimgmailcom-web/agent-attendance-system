import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="mini-brand">
          <span className="brand-name">BARDARASH <span>ATTENDANCE</span></span>
        </div>
        <h1>Sign in</h1>
        <p>Use your company email and password to continue.</p>
        <AuthForm />
      </section>
    </main>
  );
}
