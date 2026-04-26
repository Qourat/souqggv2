import "server-only";

import { Resend } from "resend";

import { logger } from "@/core/logger";
import { env } from "@/shared/env";

import type { MailerAdapter, SendEmailInput, SendEmailResult } from "./types";

const log = logger("mailer.resend");

let _client: Resend | null = null;
function getClient(): Resend {
  if (_client) return _client;
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  _client = new Resend(key);
  return _client;
}

const DEFAULT_FROM = "SOUQ.GG <noreply@souq.gg>";

export const resendMailer: MailerAdapter = {
  id: "resend",
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const result = await getClient().emails.send({
        from: input.from ?? DEFAULT_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        tags: input.tags
          ? Object.entries(input.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      });
      if (result.error) {
        log.error("resend send failed", {
          to: input.to,
          subject: input.subject,
          error: result.error.message,
        });
        return { id: null, delivered: false };
      }
      return { id: result.data?.id ?? null, delivered: true };
    } catch (e) {
      log.error("resend threw", {
        to: input.to,
        subject: input.subject,
        error: e instanceof Error ? e.message : String(e),
      });
      return { id: null, delivered: false };
    }
  },
};
