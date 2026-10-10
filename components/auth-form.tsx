"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { readApiResponse } from "@/lib/client-api";

type LoginResponse = {
  user: {
    role: "ADMIN" | "AGENT";
  };
};

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readApiResponse<LoginResponse>(response);

      if (data.user?.role !== "ADMIN" && data.user?.role !== "AGENT") {
        throw new Error("The server returned an incomplete login response. Please try again.");
      }

      router.push(data.user.role === "ADMIN" ? "/admin" : "/agent");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Email address
        <input
          type="email"
          autoComplete="username"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? <p className="error-text">{error}</p> : null}

      <button className="primary-btn login-submit" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "LOGIN"}
      </button>
    </form>
  );
}
