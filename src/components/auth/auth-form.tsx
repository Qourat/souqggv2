"use client";

import { useState, type FormEvent } from "react";

import { Button, Input } from "@/components/ui";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
  locale: string;
  labels: {
    name?: string;
    email: string;
    password: string;
    submit: string;
    loading: string;
    unavailable: string;
  };
}

export function AuthForm({ mode, locale, labels }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "");

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "sign-up" ? { name: fullName, locale } : {}),
        }),
      });
      const result = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(result?.error ?? labels.unavailable);
        return;
      }

      const redirect = new URLSearchParams(window.location.search).get("redirect");
      window.location.href = redirect || `/${locale}/library`;
    } catch {
      setError(labels.unavailable);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5">
      {mode === "sign-up" ? (
        <div>
          <label className="label-mono mb-1 block">{labels.name}</label>
          <Input name="name" type="text" required autoComplete="name" />
        </div>
      ) : null}
      <div>
        <label className="label-mono mb-1 block">{labels.email}</label>
        <Input name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label-mono mb-1 block">{labels.password}</label>
        <Input
          name="password"
          type="password"
          required
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={6}
        />
      </div>
      {error ? (
        <p className="text-xs text-danger" role="status">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? labels.loading : labels.submit}
      </Button>
    </form>
  );
}
