"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles, Copy, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runAgentAction } from "@/modules/ai/ai.actions";
import type {
  AiAgentDescriptor,
  AiAgentInputField,
  AiRunOutput,
} from "@/modules/ai";

interface RunState {
  status: "idle" | "ok" | "error";
  message?: string;
  output?: AiRunOutput;
}

function Field({ field }: { field: AiAgentInputField }) {
  const baseClass =
    "h-9 w-full bg-background border-hairline rounded-sm px-2 text-sm";
  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          rows={4}
          className={`${baseClass} h-auto py-2 leading-relaxed`}
        />
      );
    case "select":
      return (
        <select
          name={field.name}
          required={field.required}
          defaultValue=""
          className={baseClass}
        >
          <option value="" disabled>
            —
          </option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <Input
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
        />
      );
  }
}

export function AiRunner({ descriptor }: { descriptor: AiAgentDescriptor }) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [run, setRun] = useState<RunState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const input: Record<string, unknown> = {};
    for (const f of descriptor.inputShape) {
      const v = data.get(f.name);
      input[f.name] = typeof v === "string" ? v : "";
    }
    startTransition(async () => {
      setRun({ status: "idle" });
      const res = await runAgentAction(descriptor.id, input);
      if (!res.ok) {
        setRun({ status: "error", message: res.message });
        return;
      }
      setRun({ status: "ok", output: res.output });
    });
  }

  async function copy() {
    if (!run.output) return;
    const text = run.output.parsed
      ? JSON.stringify(run.output.parsed, null, 2)
      : run.output.text;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-2">
        {descriptor.inputShape.map((f) => (
          <div key={f.name} className="space-y-1">
            <label htmlFor={f.name} className="label-mono">
              {f.label}
              {f.required ? <span className="text-terracotta"> *</span> : null}
            </label>
            <Field field={f} />
            {f.helperText ? (
              <p className="label-mono text-muted-foreground">
                {f.helperText}
              </p>
            ) : null}
          </div>
        ))}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              {t("admin.ai.run")}
            </>
          )}
        </Button>
      </form>

      {run.status === "error" ? (
        <div className="border-hairline border-danger/50 bg-danger/10 rounded-sm p-2 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-danger mt-0.5 shrink-0" />
          <div className="text-xs text-danger break-words">{run.message}</div>
        </div>
      ) : null}

      {run.status === "ok" && run.output ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="label-mono text-sage flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              {t("admin.ai.done")}
            </div>
            <Button variant="ghost" size="sm" onClick={copy} type="button">
              {copied ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> {t("admin.ai.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> {t("admin.ai.copy")}
                </>
              )}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="border-hairline rounded-sm p-2">
              <div className="label-mono text-muted-foreground">
                {t("admin.ai.cost")}
              </div>
              <div className="font-mono text-sm tnum">
                ${run.output.costUsd.toFixed(4)}
              </div>
            </div>
            <div className="border-hairline rounded-sm p-2">
              <div className="label-mono text-muted-foreground">
                {t("admin.ai.latency")}
              </div>
              <div className="font-mono text-sm tnum">
                {(run.output.durationMs / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="border-hairline rounded-sm p-2">
              <div className="label-mono text-muted-foreground">
                {t("admin.ai.model")}
              </div>
              <div className="font-mono text-xs truncate">
                {run.output.model}
              </div>
            </div>
          </div>
          <pre className="border-hairline rounded-sm p-2 text-xs font-mono overflow-x-auto bg-surface-raised max-h-96">
            {run.output.parsed
              ? JSON.stringify(run.output.parsed, null, 2)
              : run.output.text}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
