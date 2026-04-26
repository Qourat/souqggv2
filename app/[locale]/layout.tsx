import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "sonner";

import "../globals.css";

import { getLocaleConfig, isLocale, LOCALES } from "@/shared/i18n/locales";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const fontArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "souq — digital products store", template: "%s · souq" },
  description: "Templates, sheets, prompts, code — instant download.",
};

export const viewport: Viewport = {
  themeColor: "#141518",
};

export function generateStaticParams() {
  return LOCALES.map(({ code }) => ({ locale: code }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const cfg = getLocaleConfig(locale);

  return (
    <html
      lang={locale}
      dir={cfg.dir}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} ${fontArabic.variable}`}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster
            position={cfg.dir === "rtl" ? "bottom-left" : "bottom-right"}
            theme="dark"
            toastOptions={{
              style: {
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
