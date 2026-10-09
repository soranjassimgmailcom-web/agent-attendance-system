import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="mini-brand">
          <img src="/logo.svg" alt="Logo" width={120} height={90} />
        </div>
        <h1>Login</h1>
        <p>Use your company email and password.</p>
        <AuthForm />
      </section>
    </main>
  );
}
