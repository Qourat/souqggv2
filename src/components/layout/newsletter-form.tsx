"use client";

import { useState } from "react";

import { Button, Input } from "@/components/ui";

export function NewsletterForm({
  placeholder,
  cta,
}: {
  placeholder: string;
  cta: string;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="flex items-stretch gap-1.5 max-w-sm"
    >
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="h-8"
        aria-label={placeholder}
      />
      <Button type="submit" size="md" variant="primary" disabled={submitted}>
        {submitted ? "✓" : cta}
      </Button>
    </form>
  );
}
