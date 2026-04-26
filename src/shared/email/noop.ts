import "server-only";

import { logger } from "@/core/logger";

import type { MailerAdapter, SendEmailInput, SendEmailResult } from "./types";

const log = logger("mailer.noop");

/**
 * No-op mailer used when RESEND_API_KEY isn't set. We log the
 * envelope so you can verify the call site without actually
 * sending mail in dev / preview deploys.
 */
export const noopMailer: MailerAdapter = {
  id: "noop",
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    log.info("noop mailer would send", {
      to: input.to,
      subject: input.subject,
      tags: input.tags,
    });
    return { id: null, delivered: false };
  },
};
