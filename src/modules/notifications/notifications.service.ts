import "server-only";

import { AppError, ok, tryAsync, type Result } from "@/core";
import { logger } from "@/core/logger";
import { mailer, isMailerConfigured } from "@/shared/email";
import { publicEnv } from "@/shared/env";

import { renderDownloadReadyEmail } from "./templates/download-ready";
import type { DownloadReadyEmailInput } from "./notifications.types";

const log = logger("notifications.service");

/**
 * Notifications service.
 *
 * Wraps the mailer adapter with typed, idempotent-friendly methods
 * for each transactional email. Failures NEVER throw — we log and
 * return ok(false) so the caller (e.g. the Stripe webhook) can keep
 * marking orders paid even if email is degraded.
 */

export const notificationsService = {
  async sendDownloadReady(
    input: DownloadReadyEmailInput,
  ): Promise<Result<{ delivered: boolean; id: string | null }>> {
    if (!input.to) {
      log.warn("sendDownloadReady skipped: no recipient", {
        orderId: input.orderId,
      });
      return ok({ delivered: false, id: null });
    }
    if (input.items.length === 0) {
      log.warn("sendDownloadReady skipped: no items", {
        orderId: input.orderId,
      });
      return ok({ delivered: false, id: null });
    }
    if (!isMailerConfigured()) {
      log.info("sendDownloadReady mailer not configured (noop)", {
        orderId: input.orderId,
      });
    }

    const email = renderDownloadReadyEmail(input, publicEnv.appUrl);
    const sent = await tryAsync(
      () =>
        mailer.send({
          to: input.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          tags: {
            type: "download_ready",
            order_id: input.orderId.slice(0, 32),
          },
        }),
      AppError.fromUnknown,
    );
    if (!sent.ok) {
      log.error("download-ready email send failed", {
        orderId: input.orderId,
        error: sent.error.message,
      });
      return ok({ delivered: false, id: null });
    }
    return ok({ delivered: sent.value.delivered, id: sent.value.id });
  },
};
