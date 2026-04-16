import type { Metadata } from "next";
import { Courier_Prime, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://qourat.gg";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-souq-sans",
  display: "swap",
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-souq-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-souq-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SOUQ.GG — The Digital Product Market",
  description:
    "Discover, buy and sell digital products — code, templates, prompts, datasets, APIs and more.",
  openGraph: {
    title: "SOUQ.GG — The Digital Product Market",
    description: "The digital product marketplace for creators and builders.",
    url: siteUrl,
    siteName: "SOUQ.GG",
  },
  twitter: {
    card: "summary",
    title: "SOUQ.GG — The Digital Product Market",
  },
  robots: { index: true, follow: true },
};

const themeBootstrap = `(function(){try{var t=localStorage.getItem('souq-theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${courierPrime.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="souq-grain font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
