import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "../lib/appwrite";

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Failed to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
        padding: 16,
      }}
    >
      <Card style={{ width: 360 }}>
        <h1 style={{ marginTop: 0, color: "var(--color-text)" }}>Sign in</h1>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          {error ? (
            <div style={{ color: "crimson", fontSize: "var(--font-sm)" }}>
              {error}
            </div>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div
          style={{
            marginTop: 12,
            color: "var(--color-text-muted)",
            fontSize: "var(--font-sm)",
          }}
        >
          Project: <code>{APPWRITE_PROJECT_ID}</code> • Endpoint:{" "}
          <code>{APPWRITE_ENDPOINT}</code>
        </div>
      </Card>
    </div>
  );
}
