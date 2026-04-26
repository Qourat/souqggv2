import { getLocaleConfig } from "@/shared/i18n/locales";
import { formatPrice } from "@/shared/utils";

import type { DownloadReadyEmailInput } from "../notifications.types";

/**
 * Inline HTML/text template. Kept dependency-free on purpose so the
 * webhook handler stays cold-start friendly. If we ever migrate to
 * react-email we can drop a React variant alongside this and switch
 * the call site without changing the service signature.
 */

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface CopyBlock {
  subject: (orderId: string) => string;
  heading: string;
  greeting: string;
  instructions: string;
  library: string;
  summary: string;
  total: string;
  legal: string;
}

const COPY: { en: CopyBlock; ar: CopyBlock } = {
  en: {
    subject: (orderId: string) =>
      `Your downloads are ready · order ${orderId.slice(0, 8)}`,
    heading: "Your downloads are ready",
    greeting: "Thanks for buying from SOUQ.GG.",
    instructions:
      "Click any file below to download it. Links open the secure SOUQ.GG library and stay valid for one click.",
    library: "Open my library",
    summary: "Order summary",
    total: "Total",
    legal:
      "Each download is for personal or business use under the original product license. Re-distribution is not allowed.",
  },
  ar: {
    subject: (orderId: string) =>
      `روابط التحميل جاهزة · طلب ${orderId.slice(0, 8)}`,
    heading: "روابط التحميل جاهزة",
    greeting: "شكراً لشرائك من سوق.GG.",
    instructions:
      "اضغط على أي ملف لتحميله. الروابط تفتح مكتبتك الآمنة في سوق.GG وتصلح لضغطة واحدة.",
    library: "افتح مكتبتي",
    summary: "ملخّص الطلب",
    total: "الإجمالي",
    legal:
      "كل ملف للاستخدام الشخصي أو التجاري وفق ترخيص المنتج الأصلي. لا يُسمح بإعادة النشر.",
  },
};

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickCopy(locale: string): CopyBlock {
  if (locale.startsWith("ar")) return COPY.ar;
  return COPY.en;
}

export function renderDownloadReadyEmail(
  input: DownloadReadyEmailInput,
  appUrl: string,
): RenderedEmail {
  const dir = getLocaleConfig(input.locale).dir;
  const c = pickCopy(input.locale);
  const total = formatPrice(input.totalCents, input.currency, input.locale);
  const libraryUrl = `${appUrl}/${input.locale}/library`;

  const itemsHtml = input.items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #1f1f1f;">
            <div style="font-size:14px;color:#f5f5f5;">${escape(it.productTitle)}</div>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#9aa0a6;">${escape(it.filename)}</div>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #1f1f1f;text-align:${dir === "rtl" ? "left" : "right"};">
            <a href="${escape(it.downloadUrl)}" style="display:inline-block;padding:6px 10px;border:1px solid #c2532b;color:#c2532b;text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:11px;border-radius:2px;">↓ download</a>
          </td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="${input.locale}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escape(c.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#f5f5f5;font-family:Inter,system-ui,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111;border:1px solid #1f1f1f;border-radius:2px;">
            <tr>
              <td style="padding:18px 20px;border-bottom:1px solid #1f1f1f;">
                <div style="font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#c2532b;letter-spacing:.08em;">SOUQ.GG</div>
                <h1 style="margin:6px 0 0;font-size:18px;color:#f5f5f5;">${escape(c.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 20px;">
                <p style="margin:0 0 8px;font-size:14px;color:#f5f5f5;">${escape(c.greeting)}</p>
                <p style="margin:0 0 16px;font-size:13px;color:#9aa0a6;">${escape(c.instructions)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                  <tr>
                    <td style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#9aa0a6;letter-spacing:.06em;text-transform:uppercase;">${escape(c.summary)}</td>
                    <td style="font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#9aa0a6;text-align:${dir === "rtl" ? "left" : "right"};">#${escape(input.orderId.slice(0, 8))}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:6px;font-size:13px;color:#f5f5f5;">${escape(c.total)}</td>
                    <td style="padding-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:#f5f5f5;text-align:${dir === "rtl" ? "left" : "right"};">${escape(total)}</td>
                  </tr>
                </table>
                <div style="margin-top:18px;text-align:center;">
                  <a href="${escape(libraryUrl)}" style="display:inline-block;padding:10px 18px;background:#c2532b;color:#0a0a0a;text-decoration:none;font-family:ui-monospace,Menlo,monospace;font-size:12px;border-radius:2px;letter-spacing:.04em;">${escape(c.library)} →</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;border-top:1px solid #1f1f1f;">
                <p style="margin:0;font-size:11px;color:#6b7280;line-height:1.5;">${escape(c.legal)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    c.heading,
    "",
    c.greeting,
    c.instructions,
    "",
    ...input.items.map(
      (it) => `• ${it.productTitle} — ${it.filename}\n  ${it.downloadUrl}`,
    ),
    "",
    `${c.total}: ${total}`,
    "",
    `${c.library}: ${libraryUrl}`,
    "",
    c.legal,
  ];

  return {
    subject: c.subject(input.orderId),
    html,
    text: textLines.join("\n"),
  };
}
