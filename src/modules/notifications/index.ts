/**
 * Notifications module — Sprint 5.
 *
 * Transactional email layer. Lives behind the @/shared/email mailer
 * adapter so we can swap Resend for any other provider without
 * touching modules that decide WHAT to send.
 */

export { notificationsService } from "./notifications.service";
export { renderDownloadReadyEmail } from "./templates/download-ready";
export type {
  DownloadReadyEmailInput,
  DownloadReadyEmailItem,
} from "./notifications.types";
