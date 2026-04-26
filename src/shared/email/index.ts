import { env } from "@/shared/env";

import { noopMailer } from "./noop";
import { resendMailer } from "./resend";

import type { MailerAdapter } from "./types";

/**
 * Active mailer. Falls back to a no-op (still logs) when
 * RESEND_API_KEY isn't set so the rest of the system doesn't
 * blow up locally.
 */
export const mailer: MailerAdapter = env.RESEND_API_KEY
  ? resendMailer
  : noopMailer;

export function isMailerConfigured(): boolean {
  return mailer.id !== "noop";
}

export type {
  MailerAdapter,
  SendEmailInput,
  SendEmailResult,
} from "./types";
